// ==========================================
// TESTE DE CONEXÃO COM O SUPABASE
// ==========================================

async function testarSupabase() {
    console.log("🔄 Testando conexão com o Supabase...");

    if (!window.supabaseClient) {
        console.error("❌ Supabase Client não encontrado.");
        return;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from("campaigns")
            .select("id")
            .limit(1);

        if (error) {
            console.error("❌ Supabase respondeu com erro:", error);
            return;
        }

        console.log("✅ Conexão com o Supabase funcionando!");
        console.log("📦 Dados recebidos:", data);

    } catch (error) {
        console.error("❌ Falha ao conectar com o Supabase:", error);
    }
}

testarSupabase();
