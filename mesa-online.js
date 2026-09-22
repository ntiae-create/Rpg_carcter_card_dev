/* =========================================================
   MESA ONLINE — ABLY (VERSÃO FINAL)
========================================================= */

(function () {
    "use strict";

    const ABLY_TOKEN_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";

    let ably = null;
    let canal = null;
    let tentativaConexao = false;

    const estado = {
        conectado: false,
        campanhaId: null,
        usuarioId: null,
        personagemId: null,
        slot: null,
        nome: null,
        isMaster: false,
        canal: null
    };

    const diagnosticoMultiplayer = {
        estado: null,
        mensagem: null,
        motivo: null,
        codigo: null,
        ultimoHttpStatus: null,
        ultimaAtualizacao: null
    };

    function textoErro(valor) {
        if (!valor) return "Sem motivo informado.";
        if (typeof valor === "string") return valor;
        if (valor.message) return valor.message;
        try { return JSON.stringify(valor); } catch { return String(valor); }
    }

    function registrarDiagnosticoMultiplayer(estadoConexao, mensagem, detalhe = "") {
        diagnosticoMultiplayer.estado = estadoConexao;
        diagnosticoMultiplayer.mensagem = mensagem;
        diagnosticoMultiplayer.motivo = detalhe || null;
        diagnosticoMultiplayer.ultimaAtualizacao = new Date().toISOString();

        console.groupCollapsed("[MESA ONLINE DIAGNÓSTICO] " + estadoConexao);
        console.log("Mensagem:", mensagem);
        console.log("Motivo:", detalhe || "Sem motivo informado.");
        console.log("Campanha:", estado.campanhaId);
        console.log("Usuário:", estado.usuarioId);
        console.log("Canal:", estado.canal);
        console.log("Estado completo:", diagnosticoMultiplayer);
        console.groupEnd();

        const log = document.querySelector("#diagnostico-log");
        if (log) {
            const linha = document.createElement("div");
            linha.textContent =
                `[ABLY] ${estadoConexao} — ${mensagem}` +
                (detalhe ? ` | ${detalhe}` : "");
            log.appendChild(linha);
            log.scrollTop = log.scrollHeight;
        }

        window.dispatchEvent(new CustomEvent("mesa:diagnosticoMultiplayer", {
            detail: { estado: diagnosticoMultiplayer, contexto: { ...estado } }
        }));
    }

    function obterMesaAtiva() {
        try {
            const salvo = localStorage.getItem("rpg_mesa_ativa");
            return salvo ? JSON.parse(salvo) : null;
        } catch (erro) {
            registrarDiagnosticoMultiplayer(
                "context-error",
                "Não foi possível ler a mesa ativa.",
                textoErro(erro)
            );
            return null;
        }
    }

    function obterDadosMesa() {
        const salvo = obterMesaAtiva() || {};
        const auth = window.rpgAuth || {};
        const campanha = auth.campaign || {};
        const usuario = auth.user || {};
        const jogador = auth.campaignCharacter || auth.currentCharacter || {};

        estado.campanhaId =
            salvo.campaignId ||
            salvo.campaign_id ||
            campanha.id ||
            window.rpgCampaign?.activeCampaign?.id ||
            null;

        estado.usuarioId = salvo.userId || usuario.id || null;
        estado.personagemId = salvo.characterId || jogador.id || null;
        estado.slot = salvo.slot || auth.campaignSlot || jogador.slot || null;
        estado.nome =
            jogador.name || jogador.nome || salvo.characterName ||
            usuario.email || "Jogador";

        estado.isMaster =
            auth.isMaster === true ||
            salvo.isMaster === true ||
            Boolean(
                campanha.master_id &&
                usuario.id &&
                String(campanha.master_id) === String(usuario.id)
            );

        console.log("[MESA ONLINE] Dados encontrados:", { ...estado });
        return estado;
    }

    function diagnostico(texto, detalhe = "") {
        console.log("[MESA ONLINE]", texto, detalhe || "");
        const log = document.querySelector("#diagnostico-log");
        if (!log) return;
        const linha = document.createElement("div");
        linha.textContent = "[ONLINE] " + texto + (detalhe ? ` | ${detalhe}` : "");
        log.appendChild(linha);
        log.scrollTop = log.scrollHeight;
    }

    function atualizarRealtime(status) {
        const elemento = document.querySelector('[data-diagnostico="realtime"]');
        if (elemento) elemento.textContent = status;
    }

    // ✅ DETECÇÃO MELHORADA DO TOKEN
    async function obterTokenSessao() {
        const tentativas = [];

        if (window.supabase?.auth?.getSession) {
            try {
                const { data } = await window.supabase.auth.getSession();
                if (data?.session?.access_token) {
                    tentativas.push(["window.supabase", data.session.access_token]);
                }
            } catch (e) { tentativas.push(["window.supabase", null]); }
        }

        if (window.supabaseClient?.auth?.getSession) {
            try {
                const { data } = await window.supabaseClient.auth.getSession();
                if (data?.session?.access_token) {
                    tentativas.push(["window.supabaseClient", data.session.access_token]);
                }
            } catch (e) { tentativas.push(["window.supabaseClient", null]); }
        }

        if (window.sb?.auth?.getSession) {
            try {
                const { data } = await window.sb.auth.getSession();
                if (data?.session?.access_token) {
                    tentativas.push(["window.sb", data.session.access_token]);
                }
            } catch (e) { tentativas.push(["window.sb", null]); }
        }

        if (window.supabaseMesa?.client?.auth?.getSession) {
            try {
                const { data } = await window.supabaseMesa.client.auth.getSession();
                if (data?.session?.access_token) {
                    tentativas.push(["window.supabaseMesa", data.session.access_token]);
                }
            } catch (e) { tentativas.push(["window.supabaseMesa", null]); }
        }

        if (window.rpgAuth?.session?.access_token) {
            tentativas.push(["window.rpgAuth.session", window.rpgAuth.session.access_token]);
        }

        console.log("[MESA ONLINE] Fontes testadas:", tentativas);

        for (const [fonte, token] of tentativas) {
            if (token) {
                console.log("✅ Token encontrado via:", fonte);
                return token;
            }
        }

        return null;
    }

    async function obterTokenAbly() {
        diagnostico("Solicitando chave do Ably...");

        const accessToken = await obterTokenSessao();

        if (!accessToken) {
            registrarDiagnosticoMultiplayer(
                "auth-error",
                "Sessão Supabase não encontrada.",
                "Faça login antes de abrir a mesa."
            );
            throw new Error("Sessão Supabase não encontrada — faça login primeiro.");
        }

        const resposta = await fetch(ABLY_TOKEN_URL, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ campanhaId: estado.campanhaId })
        });

        diagnosticoMultiplayer.ultimoHttpStatus = resposta.status;

        const texto = await resposta.text();
        let dados = null;
        try { dados = texto ? JSON.parse(texto) : null; } catch {}

        if (!resposta.ok) {
            const detalhe = dados?.error || texto || "Sem resposta detalhada.";
            registrarDiagnosticoMultiplayer(
                "token-error",
                `Edge Function recusou (HTTP ${resposta.status}).`,
                detalhe
            );
            throw new Error(detalhe);
        }

        if (!dados) {
            throw new Error("Resposta vazia da função.");
        }

        const chave = dados.key || dados.token || dados.ablyKey;
        if (!chave) {
            registrarDiagnosticoMultiplayer(
                "token-error",
                "Chave não recebida.",
                JSON.stringify(dados)
            );
            throw new Error("Chave não encontrada na resposta.");
        }

        console.log("✅ Chave recebida! Tamanho:", chave.length);
        return { key: chave };
    }

    async function atualizarPresenca() {
        if (!canal) return;
        try {
            await canal.presence.enter({
                usuarioId: estado.usuarioId,
                personagemId: estado.personagemId,
                nome: estado.nome,
                slot: estado.slot,
                isMaster: estado.isMaster,
                role: estado.isMaster ? "master" : "player"
            });
            diagnostico("Presença registrada ✅");
        } catch (erro) {
            registrarDiagnosticoMultiplayer("presence-error", "Erro ao registrar presença.", textoErro(erro));
            throw erro;
        }
    }

    async function atualizarJogadoresOnline() {
        if (!canal) return;
        try {
            const membros = await canal.presence.get();
            const jogadores = Array.isArray(membros) ? membros : (membros.items || []);
            diagnostico("Jogadores online: " + jogadores.length);
            window.dispatchEvent(new CustomEvent("mesa:multiplayerJogadoresAtualizados", {
                detail: { jogadores }
            }));
        } catch (erro) {
            registrarDiagnosticoMultiplayer("presence-get-error", "Erro ao consultar presença.", textoErro(erro));
        }
    }

    async function conectarAbly() {
        if (tentativaConexao) return;
        tentativaConexao = true;

        try {
            obterDadosMesa();

            if (!estado.campanhaId) {
                atualizarRealtime("Sem campanha");
                registrarDiagnosticoMultiplayer("context-error", "Campanha não encontrada.");
                return;
            }

            if (!estado.usuarioId) {
                atualizarRealtime("Sem usuário");
                registrarDiagnosticoMultiplayer("context-error", "Usuário não identificado.");
                return;
            }

            if (!window.Ably?.Realtime) {
                atualizarRealtime("Ably indisponível");
                registrarDiagnosticoMultiplayer("sdk-error", "Biblioteca Ably não encontrada.");
                return;
            }

            if (ably && estado.conectado) {
                diagnostico("Já conectado ✅");
                return;
            }

            diagnostico("Campanha: " + estado.campanhaId);
            diagnostico("Usuário: " + estado.usuarioId);
            diagnostico("Perfil: " + (estado.isMaster ? "Mestre" : "Jogador"));
            atualizarRealtime("Autenticando...");
            registrarDiagnosticoMultiplayer("connecting", "Conectando ao Ably...");

            ably = new window.Ably.Realtime({
                authCallback: async (params, callback) => {
                    try {
                        callback(null, await obterTokenAbly());
                    } catch (erro) {
                        callback(erro, null);
                    }
                }
            });

            ably.connection.on((evento) => {
                const estadoAtual = evento?.current || evento?.state || "unknown";
                const motivo = evento?.reason ? textoErro(evento.reason) : "";
                console.log("📡 Estado Ably:", estadoAtual, motivo || "");

                if (estadoAtual === "connected") {
                    estado.conectado = true;
                    atualizarRealtime("CONECTADO ✅");
                    registrarDiagnosticoMultiplayer(
                        "connected",
                        "Multiplayer funcionando! 🎉",
                        `Canal: rpg:mesa:${estado.campanhaId}`
                    );
                    estado.canal = "rpg:mesa:" + estado.campanhaId;
                    canal = ably.channels.get(estado.canal);

                    canal.presence.subscribe("enter", atualizarJogadoresOnline);
                    canal.presence.subscribe("leave", atualizarJogadoresOnline);
                    canal.presence.subscribe("update", atualizarJogadoresOnline);

                    atualizarPresenca().then(atualizarJogadoresOnline);
                    return;
                }

                if (["initialized", "connecting", "disconnected", "suspended"].includes(estadoAtual)) {
                    estado.conectado = false;
                    atualizarRealtime(estadoAtual);
                    return;
                }

                if (estadoAtual === "failed") {
                    estado.conectado = false;
                    atualizarRealtime("FALHA ❌");
                    registrarDiagnosticoMultiplayer("failed", "Conexão recusada.", motivo);
                }
            });
        } catch (erro) {
            console.error("[MESA ONLINE] ERRO:", erro);
            estado.conectado = false;
            atualizarRealtime("Erro ❌");
        } finally {
            tentativaConexao = false;
        }
    }

    async function desconectarAbly() {
        try {
            if (canal) { try { await canal.presence.leave(); } catch {} }
            if (ably) ably.close();
        } finally {
            ably = null; canal = null; estado.conectado = false;
            atualizarRealtime("Desconectado");
        }
    }

    window.addEventListener("mesa:campanhaAlterada", async () => {
        await desconectarAbly();
        await conectarAbly();
    });

    window.addEventListener("beforeunload", () => {
        try { canal?.presence?.leave(); } catch {}
        try { ably?.close(); } catch {}
    });

    window.mesaOnline = {
        estado,
        conectar: conectarAbly,
        desconectar: desconectarAbly,
        obterDados: obterDadosMesa
    };

    function iniciar() {
        console.log("[MESA ONLINE] Carregado ✅");
        conectarAbly();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
