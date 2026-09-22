/* =========================================================
   MESA ONLINE — ABLY (CÓDIGO COMPLETO CORRIGIDO)
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

        console.groupCollapsed(
            "[MESA ONLINE DIAGNÓSTICO] " + estadoConexao
        );
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

    async function obterTokenAbly() {
        diagnostico("Solicitando token do Ably...");

        let accessToken = null;
        const clientesSupabase = [
            window.supabaseClient,
            window.sb,
            window.supabaseMesa?.client,
            window.SupabaseMesa?.client
        ];

        for (const cliente of clientesSupabase) {
            if (!cliente || typeof cliente.auth?.getSession !== "function") continue;
            try {
                const resultado = await cliente.auth.getSession();
                accessToken = resultado?.data?.session?.access_token || null;
                if (accessToken) break;
            } catch (erro) {
                console.warn("[MESA ONLINE] Falha ao obter sessão:", erro);
            }
        }

        if (!accessToken) accessToken = window.rpgAuth?.session?.access_token || null;
        if (!accessToken) {
            registrarDiagnosticoMultiplayer(
                "auth-error",
                "Sessão Supabase não encontrada.",
                "Não foi possível obter access_token."
            );
            throw new Error("Sessão Supabase não encontrada.");
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
            const detalhe = dados?.details || dados?.error || texto || "Sem resposta detalhada.";
            registrarDiagnosticoMultiplayer(
                "token-error",
                `Edge Function recusou o token (HTTP ${resposta.status}).`,
                textoErro(detalhe)
            );
            throw new Error(textoErro(detalhe));
        }

        if (!dados) {
            registrarDiagnosticoMultiplayer(
                "token-error",
                "Resposta inválida da Edge Function.",
                texto || "Resposta vazia."
            );
            throw new Error("Resposta inválida da autenticação Ably.");
        }

        // ✅ CORRIGIDO: Pega a chave no formato correto
        const chave = dados.token || dados.key || dados.ablyKey;
        if (!chave) {
            registrarDiagnosticoMultiplayer(
                "token-error",
                "Token não encontrado na resposta.",
                JSON.stringify(dados)
            );
            throw new Error("Token não encontrado na resposta");
        }

        diagnostico("Token Ably recebido.");
        return { key: chave }; // Formato exato que o Ably precisa
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
            diagnostico("Presença registrada na Mesa.");
        } catch (erro) {
            registrarDiagnosticoMultiplayer(
                "presence-error",
                "Erro ao registrar presença.",
                textoErro(erro)
            );
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
            registrarDiagnosticoMultiplayer(
                "presence-get-error",
                "Erro ao consultar presença.",
                textoErro(erro)
            );
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
                diagnostico("Multiplayer já está conectado.");
                return;
            }

            diagnostico("Campanha encontrada: " + estado.campanhaId);
            diagnostico("Usuário encontrado: " + estado.usuarioId);
            diagnostico("Perfil: " + (estado.isMaster ? "Mestre" : "Jogador"));
            diagnostico("Preparando autenticação Ably...");
            atualizarRealtime("Autenticando Ably...");
            registrarDiagnosticoMultiplayer("connecting", "Iniciando conexão Ably.");

            ably = new window.Ably.Realtime({
                authCallback: async function (_params, callback) {
                    try {
                        callback(null, await obterTokenAbly());
                    } catch (erro) {
                        registrarDiagnosticoMultiplayer(
                            "auth-error",
                            "Falha no authCallback do Ably.",
                            textoErro(erro)
                        );
                        callback(erro, null);
                    }
                }
            });

            ably.connection.on(function (evento) {
                const estadoAtual = evento?.current || evento?.state || "unknown";
                const motivo = evento?.reason ? textoErro(evento.reason) : "";
                console.log("[MESA ONLINE] Evento Ably:", evento);

                if (estadoAtual === "connected") {
                    estado.conectado = true;
                    atualizarRealtime("Conectado ✅");
                    registrarDiagnosticoMultiplayer(
                        "connected",
                        "Multiplayer conectado com sucesso! 🎉",
                        `Canal: ${estado.canal}`
                    );
                    window.dispatchEvent(new CustomEvent("mesa:multiplayerConectado", {
                        detail: { estado }
                    }));
                    return;
                }

                if (["initialized", "connecting", "disconnected", "suspended"].includes(estadoAtual)) {
                    estado.conectado = false;
                    atualizarRealtime(estadoAtual);
                    registrarDiagnosticoMultiplayer(
                        estadoAtual,
                        `Ably está em estado "${estadoAtual}".`,
                        motivo || "Sem motivo informado."
                    );
                    return;
                }

                if (estadoAtual === "failed") {
                    estado.conectado = false;
                    atualizarRealtime("Falha ❌");
                    registrarDiagnosticoMultiplayer(
                        "failed",
                        "A conexão Ably falhou.",
                        motivo || "Sem motivo informado."
                    );
                }
            });

            estado.canal = "rpg:mesa:" + estado.campanhaId;
            diagnostico("Entrando no canal: " + estado.canal);
            canal = ably.channels.get(estado.canal);

            canal.presence.subscribe("enter", atualizarJogadoresOnline);
            canal.presence.subscribe("leave", atualizarJogadoresOnline);
            canal.presence.subscribe("update", atualizarJogadoresOnline);

            await atualizarPresenca();
            await atualizarJogadoresOnline();
            diagnostico("Canal multiplayer preparado ✅");
        } catch (erro) {
            console.error("[MESA ONLINE] Erro ao conectar:", erro);
            estado.conectado = false;
            atualizarRealtime("Erro ❌");
            registrarDiagnosticoMultiplayer(
                "error",
                "Erro ao iniciar multiplayer.",
                textoErro(erro)
            );
        } finally {
            tentativaConexao = false;
        }
    }

    async function desconectarAbly() {
        try {
            if (canal) {
                try { await canal.presence.leave(); } catch (erro) {
                    console.warn("[MESA ONLINE] Erro ao sair da presença:", erro);
                }
            }
            if (ably) ably.close();
        } finally {
            ably = null;
            canal = null;
            estado.conectado = false;
            estado.canal = null;
            atualizarRealtime("Desconectado");
            registrarDiagnosticoMultiplayer("closed", "Conexão encerrada.");
        }
    }

    window.addEventListener("mesa:campanhaAlterada", async function () {
        await desconectarAbly();
        await conectarAbly();
    });

    window.addEventListener("beforeunload", function () {
        try { canal?.presence?.leave(); } catch {}
        try { ably?.close(); } catch {}
    });

    window.mesaOnline = {
        estado,
        diagnostico: diagnosticoMultiplayer,
        conectar: conectarAbly,
        desconectar: desconectarAbly,
        obterDados: obterDadosMesa,
        atualizarJogadores: atualizarJogadoresOnline,
        get canal() { return canal; },
        get channel() { return canal; },
        get ably() { return ably; }
    };

    function iniciar() {
        console.log("[MESA ONLINE] Camada multiplayer carregada ✅");
        conectarAbly();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
