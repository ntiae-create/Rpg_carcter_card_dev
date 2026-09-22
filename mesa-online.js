/* =========================================================
   MESA ONLINE — ABLY (AJUSTADO PARA SEU SupabaseMesa)
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

    function registrarDiagnostico(estadoConexao, mensagem, detalhe = "") {
        diagnosticoMultiplayer.estado = estadoConexao;
        diagnosticoMultiplayer.mensagem = mensagem;
        diagnosticoMultiplayer.motivo = detalhe || null;
        diagnosticoMultiplayer.ultimaAtualizacao = new Date().toISOString();

        console.groupCollapsed("[MESA ONLINE] " + estadoConexao);
        console.log("Mensagem:", mensagem);
        if (detalhe) console.log("Detalhe:", detalhe);
        console.groupEnd();

        const log = document.querySelector("#diagnostico-log");
        if (log) {
            const linha = document.createElement("div");
            linha.textContent = `[${estadoConexao}] ${mensagem}${detalhe ? ` | ${detalhe}` : ""}`;
            log.appendChild(linha);
            log.scrollTop = log.scrollHeight;
        }
    }

    function obterMesaAtiva() {
        try {
            const salvo = localStorage.getItem("rpg_mesa_ativa");
            return salvo ? JSON.parse(salvo) : null;
        } catch (erro) {
            return null;
        }
    }

    function obterDadosMesa() {
        const salvo = obterMesaAtiva() || {};
        const auth = window.rpgAuth || {};
        const campanha = auth.campaign || {};
        const usuario = auth.user || {};
        const jogador = auth.campaignCharacter || auth.currentCharacter || {};

        estado.campanhaId = salvo.campaignId || salvo.campaign_id || campanha.id || window.rpgCampaign?.activeCampaign?.id || null;
        estado.usuarioId = salvo.userId || usuario.id || null;
        estado.personagemId = salvo.characterId || jogador.id || null;
        estado.slot = salvo.slot || null;
        estado.nome = jogador.name || usuario.email?.split("@")[0] || "Jogador";
        estado.isMaster = auth.isMaster === true || salvo.isMaster === true || Boolean(campanha.master_id && usuario.id && String(campanha.master_id) === String(usuario.id));

        return estado;
    }

    function atualizarStatus(status) {
        const el = document.querySelector('[data-diagnostico="realtime"]');
        if (el) el.textContent = status;
    }

    // ✅ AGORA FUNCIONA COM O SEU SupabaseMesa!
    async function obterTokenSessao() {
        let cliente = null;
        let fonte = null;

        // Tenta na ordem que o seu código usa
        if (window.SupabaseMesa?.obterCliente) {
            cliente = window.SupabaseMesa.obterCliente();
            fonte = "SupabaseMesa.obterCliente()";
        }
        if (!cliente && window.supabase) {
            cliente = window.supabase;
            fonte = "window.supabase";
        }
        if (!cliente && window.supabaseClient) {
            cliente = window.supabaseClient;
            fonte = "window.supabaseClient";
        }
        if (!cliente && window.sb) {
            cliente = window.sb;
            fonte = "window.sb";
        }
        if (!cliente && window.rpgAuth?.session?.access_token) {
            console.log("✅ Token direto de rpgAuth.session");
            return window.rpgAuth.session.access_token;
        }

        if (!cliente) {
            console.log("❌ Nenhum cliente Supabase encontrado!");
            return null;
        }

        try {
            const res = await cliente.auth.getSession();
            if (res?.data?.session?.access_token) {
                console.log(`✅ Token encontrado via: ${fonte}`);
                return res.data.session.access_token;
            }
        } catch (e) {
            console.warn(`⚠️ Falha ao pegar sessão de ${fonte}:`, e);
        }

        return null;
    }

    async function obterChaveAbly() {
        registrarDiagnostico("info", "Solicitando chave de conexão...");

        const token = await obterTokenSessao();
        if (!token) {
            throw new Error("Não foi possível obter o token de sessão — faça login.");
        }

        const res = await fetch(ABLY_TOKEN_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ campanhaId: estado.campanhaId })
        });

        const dados = await res.json();
        if (!res.ok) throw new Error(dados.error || "Erro na função");

        if (!dados.key) {
            throw new Error("Chave não recebida da função: " + JSON.stringify(dados));
        }

        console.log("✅ Chave recebida!");
        return { key: dados.key };
    }

    async function registrarPresenca() {
        if (!canal) return;
        try {
            await canal.presence.enter({
                usuarioId: estado.usuarioId,
                personagem: estado.nome,
                slot: estado.slot,
                isMaster: estado.isMaster
            });
        } catch (e) {
            console.warn("Presença:", e);
        }
    }

    async function atualizarJogadores() {
        if (!canal) return;
        try {
            const presentes = await canal.presence.get();
            console.log(`👥 Jogadores online: ${presentes.length}`);
        } catch (e) {}
    }

    async function conectar() {
        if (tentativaConexao || estado.conectado) return;
        tentativaConexao = true;

        try {
            obterDadosMesa();

            if (!estado.campanhaId) {
                registrarDiagnostico("aviso", "Campanha não identificada");
                return;
            }

            if (!window.Ably?.Realtime) {
                registrarDiagnostico("erro", "Biblioteca Ably não carregada");
                return;
            }

            atualizarStatus("Conectando...");

            ably = new Ably.Realtime({
                authCallback: async (params, callback) => {
                    try {
                        callback(null, await obterChaveAbly());
                    } catch (e) {
                        callback(e, null);
                    }
                }
            });

            ably.connection.on((evento) => {
                const status = evento.current;
                console.log("📡 Conexão Ably:", status);
                atualizarStatus(status);

                if (status === "connected") {
                    estado.conectado = true;
                    estado.canal = `rpg:mesa:${estado.campanhaId}`;
                    canal = ably.channels.get(estado.canal);

                    canal.presence.subscribe("enter", atualizarJogadores);
                    canal.presence.subscribe("leave", atualizarJogadores);

                    registrarPresenca().then(atualizarJogadores);
                    registrarDiagnostico("sucesso", "✅ MULTIPLAYER CONECTADO!");
                }

                if (status === "failed") {
                    registrarDiagnostico("erro", "Conexão recusada", evento.reason?.message || "Verificar chave");
                }
            });
        } catch (erro) {
            registrarDiagnostico("erro", "Falha ao iniciar", textoErro(erro));
        } finally {
            tentativaConexao = false;
        }
    }

    async function desconectar() {
        if (canal) await canal.presence.leave();
        if (ably) ably.close();
        ably = null; canal = null; estado.conectado = false;
        atualizarStatus("Desconectado");
    }

    document.addEventListener("DOMContentLoaded", conectar);
    window.addEventListener("beforeunload", desconectar);

    window.mesaOnline = { conectar, desconectar };
})();
