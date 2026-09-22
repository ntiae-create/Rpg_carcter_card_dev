import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const ABLY_KEY_NAME = Deno.env.get("ABLY_KEY_NAME");
const ABLY_KEY_SECRET = Deno.env.get("ABLY_KEY_SECRET");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_ANON_KEY devem estar configuradas.");
}

if (!ABLY_KEY_NAME || !ABLY_KEY_SECRET) {
  throw new Error("ABLY_KEY_NAME e ABLY_KEY_SECRET devem estar configuradas.");
}

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const campanhaId = body?.campanhaId;

    if (!campanhaId) {
      return new Response(
        JSON.stringify({ error: "campanhaId não informado." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization ausente." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário do Supabase não autenticado." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: campanha, error: erroCampanha } = await supabase
      .from("campaigns")
      .select("id, master_id")
      .eq("id", campanhaId)
      .maybeSingle();

    if (erroCampanha) {
      return new Response(
        JSON.stringify({ error: "Erro ao buscar campanha." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!campanha) {
      return new Response(
        JSON.stringify({ error: "Campanha não encontrada." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const ehMestre = String(campanha.master_id) === String(user.id);

    if (!ehMestre) {
      const { data: membro, error: erroMembro } = await supabase
        .from("campaign_members")
        .select("user_id")
        .eq("campaign_id", campanhaId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (erroMembro) {
        return new Response(
          JSON.stringify({ error: "Erro ao validar membro da campanha." }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (!membro) {
        return new Response(
          JSON.stringify({ error: "Usuário não pertence à campanha." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const capability = {
      [`rpg:mesa:${campanhaId}`]: ["publish", "subscribe", "presence"],
    };

    const ablyResponse = await fetch(
      "https://rest.ably.io/keys/" + ABLY_KEY_NAME + "/requestToken",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${ABLY_KEY_NAME}:${ABLY_KEY_SECRET}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: user.id,
          capability,
          ttl: 3600000,
        }),
      }
    );

    if (!ablyResponse.ok) {
      const erro = await ablyResponse.text();
      return new Response(
        JSON.stringify({
          error: "Falha ao gerar token Ably.",
          details: erro,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = await ablyResponse.json();

    return new Response(JSON.stringify(token), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Erro interno ao gerar token Ably.",
        details: String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
