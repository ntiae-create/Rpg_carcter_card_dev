const SUPABASE_URL = "https://bjkbfxcmyihdruqrwsdf.supabase.co";

const SUPABASE_KEY = "SUA_PUBLISHABLE_KEY_AQUI";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

window.supabaseClient = supabaseClient;
