async function testarSupabase() {
    const aviso = document.createElement("div");

    aviso.style.position = "fixed";
    aviso.style.top = "15px";
    aviso.style.left = "50%";
    aviso.style.transform = "translateX(-50%)";
    aviso.style.zIndex = "99999";
    aviso.style.padding = "12px 18px";
    aviso.style.borderRadius = "12px";
    aviso.style.fontFamily = "Arial, sans-serif";
    aviso.style.fontSize = "14px";
    aviso.style.fontWeight = "bold";
    aviso.style.textAlign = "center";
    aviso.style.boxShadow = "0 5px 20px rgba(0,0,0,0.4)";
    aviso.style.maxWidth = "90%";

    document.body.appendChild(aviso);

    if (!window.supabaseClient) {
        aviso.textContent = "🔴 Supabase Client não encontrado.";
        aviso.style.background = "#3b0d0d";
        aviso.style.color = "#ffb4b4";
        return;
    }

    aviso.textContent = "🔄 Testando conexão com o Supabase...";
    aviso.style.background = "#241633";
    aviso.style.color = "#d8b4fe";

    try {
        const { data, error } = await window.supabaseClient
            .from("campaigns")
            .select("id")
            .limit(1);

        if (error) {
            aviso.textContent = "🔴 Erro ao conectar com o Supabase.";
            aviso.style.background = "#3b0d0d";
            aviso.style.color = "#ffb4b4";
            return;
        }

        aviso.textContent = "🟢 Supabase conectado com sucesso!";
        aviso.style.background = "#102d20";
        aviso.style.color = "#a7f3d0";

        setTimeout(() => aviso.remove(), 4000);

    } catch (error) {
        aviso.textContent = "🔴 Falha na conexão com o Supabase.";
        aviso.style.background = "#3b0d0d";
        aviso.style.color = "#ffb4b4";
    }
}

testarSupabase();
