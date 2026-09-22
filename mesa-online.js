/* =========================================================
   MESA ONLINE — ABLY | VERSÃO FINAL COMPLETA
========================================================= */

(function () {
    "use strict";

    const ABLY_TOKEN_URL = "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";

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

    function textoErro(valor) {
        if (!valor) return "Sem motivo.";
        if (typeof valor === "string") return valor;
        if (valor.message) return valor.message;
        try { return JSON.stringify(valor); } catch { return String(valor); }
    }

    function logDiagnostico(texto, detalhe = "") {
        console.log("[MESA-ONLINE]", texto, detalhe);
        const log = document.querySelector("#diagnostico-log");
        if (!log) return;
        const linha = document.createElement("div");
        linha.textContent = `[ONLINE] ${texto}${detalhe ? ` | ${detalhe}` : ""}`;
        log.appendChild(linha);
        log.scrollTop = log.scrollHeight;
    }

    function atualizarStatusRealtime(texto) {
        const el = document.querySelector('[data-diagnostico="realtime"]');
        if (el) el.textContent = texto;
    }

    function obterMesaAtiva() {
        try {
            const salvo = localStorage.getItem("rpg_mesa_ativa");
            return salvo ? JSON.parse(salvo) : null;
        } catch { return null; }
    }

    function obterDadosMesa() {
        const salvo = obterMesaAtiva() || {};
        const auth = window.rpgAuth || {};
        const campanha = auth.campaign || {};
        const usuario = auth.user || {};
        const jogador = auth.campaignCharacter || auth.currentCharacter || {};

        estado.campanhaId =
            salvo.campaignId || salvo.campaign_id || campanha.id ||
            window.rpgCampaign?.activeCampaign?.id || null;

        estado.usuarioId = salvo.userId || usuario.id || null;
        estado.personagemId = salvo.characterId || jogador.id || null;
        estado.slot = salvo.slot || auth.campaignSlot || jogador.slot || null;
        estado.nome =
            jogador.name || jogador.nome || salvo.characterName ||
            usuario.email?.split("@")[0] || "Jogador";

        estado.isMaster =
            auth.isMaster === true || salvo.isMaster === true ||
            Boolean(campanha.master_id && usuario.id &&
                String(campanha.master_id) === String(usuario.id));

        logDiagnostico("Dados carregados", `Campanha:${estado.campanhaId} Usuário:${estado.usuarioId}`);
        return estado;
    }

    async function obterClienteSupabase() {
        if (window.SupabaseMesa?.obterCliente) {
            const cli = window.SupabaseMesa.obterCliente();
            if (cli) {
                logDiagnostico("✅ Cliente via SupabaseMesa");
                return cli;
            }
        }
        if (window.supabase?.auth?.getSession) {
            logDiagnostico("✅ Cliente via window.supabase");
            return window.supabase;
        }
        if (window.supabaseClient?.auth?.getSession) {
            logDiagnostico("✅ Cliente via window.supabaseClient");
            return window.supabaseClient;
        }
        if (window.sb?.auth?.getSession) {
            logDiagnostico("✅ Cliente via window.sb");
            return window.sb;
        }
        logDiagnostico("❌ Nenhum cliente Supabase encontrado");
        return null;
    }

    async function obterTokenAcesso() {
        if (window.rpgAuth?.session?.access_token) {
            logDiagnostico("✅ Token direto de rpgAuth");
            return window.rpgAuth.session.access_token;
        }
        const cliente = await obterClienteSupabase();
        if (!cliente) return null;
        try {
            const { data } = await cliente.auth.getSession();
            const token = data?.session?.access_token;
            if (token) {
                logDiagnostico("✅ Token de sessão obtido");
                return token;
            }
        } catch (e) {
            logDiagnostico("❌ Erro ao pegar sessão", textoErro(e));
        }
        return null;
    }

    async function obterChaveAbly() {
        const token = await obterTokenAcesso();
        if (!token) throw new Error("Token de acesso não disponível");

        logDiagnostico("Solicitando chave...");
        const res = await fetch(ABLY_TOKEN_URL, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ campanhaId: estado.campanhaId })
        });

        const dados = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(dados.error || `HTTP ${res.status}`);
        if (!dados.key && !dados.token) throw new Error("Chave não retornada");

        logDiagnostico("✅ Chave recebida");
        return { key: dados.key || dados.token || dados.ablyKey };
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
            logDiagnostico("✅ Presença registrada");
        } catch (e) {
            logDiagnostico("⚠️ Erro presença", textoErro(e));
        }
    }

    async function atualizarListaJogadores() {
        if (!canal) return;
        try {
            const membros = await canal.presence.get();
            const lista = membros.items || membros || [];
            logDiagnostico(`👥 Jogadores online: ${lista.length}`);
            window.dispatchEvent(new CustomEvent("mesa:multiplayerJogadoresAtualizados", {
                detail: { jogadores: lista }
            }));
        } catch (e) {}
    }

    async function conectarAbly() {
        if (tentativaConexao || estado.conectado) return;
        tentativaConexao = true;

        try {
            obterDadosMesa();

            if (!estado.campanhaId) {
                atualizarStatusRealtime("Sem campanha");
                logDiagnostico("❌ Campanha não identificada");
                return;
            }
            if (!estado.usuarioId) {
                atualizarStatusRealtime("Sem usuário");
                logDiagnostico("❌ Usuário não identificado");
                return;
            }
            if (!window.Ably?.Realtime) {
                atualizarStatusRealtime("Ably indisponível");
                logDiagnostico("❌ Biblioteca Ably não carregada");
                return;
            }

            atualizarStatusRealtime("Autenticando...");
            ably = new Ably.Realtime({
                authCallback: async (_, cb) => {
                    try { cb(null, await obterChaveAbly()); }
                    catch (e) { cb(e, null); }
                }
            });

            ably.connection.on((evt) => {
                const status = evt.current;
                atualizarStatusRealtime(status);
                logDiagnostico("📡 Status Ably", status);

                if (status === "connected") {
                    estado.conectado = true;
                    estado.canal = `rpg:mesa:${estado.campanhaId}`;
                    canal = ably.channels.get(estado.canal);

                    canal.presence.subscribe("enter", atualizarListaJogadores);
                    canal.presence.subscribe("leave", atualizarListaJogadores);

                    atualizarPresenca().then(atualizarListaJogadores);
                    logDiagnostico("🎉 CONECTADO AO MULTIPLAYER!");
                    window.dispatchEvent(new CustomEvent("mesa:multiplayerConectado", { detail: { estado } }));
                }

                if (status === "failed") {
                    logDiagnostico("❌ Conexão falhou", evt.reason?.message || "Sem motivo");
                }
            });
        } catch (e) {
            logDiagnostico("❌ Erro conexão", textoErro(e));
        } finally {
            tentativaConexao = false;
        }
    }

    async function desconectarAbly() {
        try {
            if (canal) await canal.presence.leave();
            if (ably) ably.close();
        } catch {}
        ably = null; canal = null; estado.conectado = false;
        atualizarStatusRealtime("Desconectado");
    }

    window.addEventListener("mesa:campanhaAlterada", async () => {
        await desconectarAbly();
        await conectarAbly();
    });

    window.addEventListener("beforeunload", desconectarAbly);

    window.mesaOnline = {
        conectar: conectarAbly,
        desconectar: desconectarAbly,
        obterDados: obterDadosMesa,
        estado,
        canal: () => canal
    };

    function iniciar() {
        logDiagnostico("=== SCRIPT CARREGADO ===");
        conectarAbly();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
