import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY"
);

const ALLOWED_ORIGIN = Deno.env.get("FRONTEND_ORIGIN") ?? "*";

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
}

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin =
    ALLOWED_ORIGIN === "*"
      ? "*"
      : origin === ALLOWED_ORIGIN
        ? origin
        : ALLOWED_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed",
      },
      405,
      origin
    );
  }

  const authorization = req.headers.get("authorization");

  if (!authorization) {
    return jsonResponse(
      {
        error: "Missing Authorization header",
      },
      401,
      origin
    );
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return jsonResponse(
      {
        error: "Invalid Authorization header",
      },
      401,
      origin
    );
  }

  const accessToken = match[1].trim();

  if (!accessToken) {
    return jsonResponse(
      {
        error: "Missing access token",
      },
      401,
      origin
    );
  }

  try {
    const { data, error } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return jsonResponse(
        {
          error: "Unauthorized",
        },
        401,
        origin
      );
    }

    return jsonResponse(
      {
        authenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          role: data.user.role ?? null,
        },
      },
      200,
      origin
    );
  } catch (error) {
    console.error("supabase-token error", error);

    return jsonResponse(
      {
        error: "Internal server error",
      },
      500,
      origin
    );
  }
});
