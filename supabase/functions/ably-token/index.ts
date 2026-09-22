import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const ABLY_API_KEY = Deno.env.get("ABLY_API_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY devem estar configuradas.");
}

if (!ABLY_API_KEY) {
  throw new Error("ABLY_API_KEY deve estar configurada.");
}

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ error: "Método não permitido. Use POST." }, 405);
    }

    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return json({ error: "Authorization ausente." }, 401);
    }

    let body: { campanhaId?: string; campaignId?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: "Corpo da requisição inválido." }, 400);
    }

    const campanhaId = body.campanhaId || body.campaignId;
    if (!campanhaId) {
      return json({ error: "campanhaId não informado." }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authorization } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userError || !user) {
      return json({
        error: "Usuário do Supabase não autenticado.",
        details: userError?.message || null,
      }, 401);
    }

    const { data: campanha, error: campanhaError } = await supabase
      .from("campaigns")
      .select("id, master_id")
      .eq("id", campanhaId)
      .maybeSingle();

    if (campanhaError) {
      console.error("[ABLY TOKEN] Erro ao buscar campanha:", campanhaError);
      return json({
        error: "Erro ao buscar campanha.",
        details: campanhaError.message,
      }, 500);
    }

    if (!campanha) {
      return json({ error: "Campanha não encontrada." }, 404);
    }

    const isMaster = String(campanha.master_id) === String(user.id);

    if (!isMaster) {
      const { data: member, error: memberError } = await supabase
        .from("campaign_members")
        .select("user_id")
        .eq("campaign_id", campanhaId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberError) {
        console.error("[ABLY TOKEN] Erro ao validar membro:", memberError);
        return json({
          error: "Erro ao validar membro da campanha.",
          details: memberError.message,
        }, 500);
      }

      if (!member) {
        return json({ error: "Usuário não pertence à campanha." }, 403);
      }
    }

    const separator = ABLY_API_KEY.indexOf(":");
    if (separator <= 0) {
      return json({
        error: "ABLY_API_KEY está em formato inválido. Use nome-da-chave:segredo-da-chave.",
      }, 500);
    }

    const keyName = ABLY_API_KEY.slice(0, separator);
    const capability = {
      [`rpg:mesa:${campanhaId}`]: ["publish", "subscribe", "presence"],
    };

    const ablyResponse = await fetch(
      `https://rest.ably.io/keys/${keyName}/requestToken`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(ABLY_API_KEY)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: user.id,
          capability,
          ttl: 3600000,
        }),
      },
    );

    const ablyText = await ablyResponse.text();

    if (!ablyResponse.ok) {
      console.error("[ABLY TOKEN] Ably respondeu:", ablyResponse.status, ablyText);
      return json({
        error: "Falha ao gerar token Ably.",
        statusAbly: ablyResponse.status,
        details: ablyText,
      }, 500);
    }

    try {
      JSON.parse(ablyText);
    } catch {
      return json({
        error: "Resposta inválida recebida do Ably.",
        details: ablyText,
      }, 500);
    }

    return new Response(ablyText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ABLY TOKEN] Erro inesperado:", error);
    return json({
      error: "Erro interno ao gerar token Ably.",
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});
