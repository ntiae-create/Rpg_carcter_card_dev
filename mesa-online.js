(function () {
    "use strict";

    const ABLY_TOKEN_URL = "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";
    let ably = null;
    let canal = null;

    // 🔍 PASSO A PASSO EXPLÍCITO
    async function iniciar() {
        console.log("=== 1. INICIANDO ===");

        // 1 — Pegar o cliente Supabase
        let cliente = null;
        let fonte = "";

        if (window.SupabaseMesa?.obterCliente) {
            cliente = window.SupabaseMesa.obterCliente();
            fonte = "SupabaseMesa";
        } else if (window.supabase) {
            cliente = window.supabase;
            fonte = "window.supabase";
        } else if (window.supabaseClient) {
            cliente = window.supabaseClient;
            fonte = "window.supabaseClient";
        }

        console.log("=== 2. CLIENTE:", cliente ? "✅ ENCONTRADO (" + fonte + ")" : "❌ NÃO ENCONTRADO");
        if (!cliente) return;

        // 2 — Pegar sessão/token
        const { data } = await cliente.auth.getSession();
        const token = data?.session?.access_token;
        console.log("=== 3. TOKEN:", token ? "✅ ENCONTRADO (" + token.substring(0, 20) + "...)" : "❌ NÃO ENCONTRADO");
        if (!token) return;

        // 3 — Pegar campanha
        const campanhaId = localStorage.getItem("rpg_campanha_id") || 
                          JSON.parse(localStorage.getItem("rpg_mesa_ativa") || "{}").campaignId ||
                          null;
        console.log("=== 4. CAMPANHA:", campanhaId ? "✅ " + campanhaId : "❌ NÃO ENCONTRADA");
        if (!campanhaId) return;

        // 4 — Chamar função
        console.log("=== 5. CHAMANDO FUNÇÃO ABLY-TOKEN ===");
        const res = await fetch(ABLY_TOKEN_URL, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ campanhaId })
        });

        console.log("=== 6. RESPOSTA HTTP:", res.status);
        const dados = await res.json();
        console.log("=== 7. DADOS RECEBIDOS:", dados);

        if (!res.ok || !dados.key) {
            console.log("❌ Falha na função!");
            return;
        }

        // 5 — Conectar Ably
        console.log("=== 8. CONECTANDO ABLY ===");
        if (!window.Ably) {
            console.log("❌ Ably não carregado!");
            return;
        }

        ably = new Ably.Realtime({ key: dados.key });
        ably.connection.on((evt) => {
            console.log("=== 9. STATUS ABLY:", evt.current);
            if (evt.current === "connected") {
                console.log("🎉 🎉 🎉 CONECTADO!");
                canal = ably.channels.get("rpg:mesa:" + campanhaId);
            }
        });
    }

    document.addEventListener("DOMContentLoaded", iniciar);
    if (document.readyState !== "loading") iniciar();
})();
