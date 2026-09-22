/* =========================================================
   MESA ONLINE — ABLY
   Camada multiplayer da Mesa RPG.

   Responsabilidades:
   - descobrir o contexto autenticado da campanha;
   - autenticar no Ably usando a Edge Function do Supabase;
   - entrar no canal exclusivo da campanha;
   - registrar/listar presença dos jogadores;
   - reagir a login e troca de campanha.

   A chave secreta do Ably nunca deve ficar neste arquivo.
========================================================= */

(function () {
    "use strict";

    const ABLY_TOKEN_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";

    const RETRY_DELAY_MS = 1500;

    let ably = null;
    let canal = null;
    let conexaoEmAndamento = null;
    let retryTimer = null;
    let eventosRegistrados = false;

    const estado = {
        conectado: false,
        campanhaId: null,
        usuarioId: null,
        personagemId: null,
        slot: null,
        nome: null,
        isMaster: false,
        canalNome: null,
        jogadores: []
    };

    function diagnostico(texto) {
        console.log("[MESA ONLINE]", texto);

        const log = document.querySelector("#diagnostico-log");
        if (!log) return;

        const linha = document.createElement("div");
        linha.textContent = "[ONLINE] " + texto;
        log.appendChild(linha);
        log.scrollTop = log.scrollHeight;
    }

    function atualizarRealtime(status) {
        const elemento = document.querySelector(
            '[data-diagnostico="realtime"]'
        );

        if (elemento) elemento.textContent = status;
    }

    function obterMesaAtiva() {
        try {
            const valor = localStorage.getItem("rpg_mesa_ativa");
            return valor ? JSON.parse(valor) : null;
        } catch (erro) {
            console.warn("[MESA ONLINE] Estado local inválido:", erro);
            return null;
        }
    }

    function obterDadosMesa() {
        const salvo = obterMesaAtiva() || {};
        const auth = window.rpgAuth || {};
        const campanha = auth.campaign ||
            window.rpgCampaign?.activeCampaign || {};
        const usuario = auth.user || {};
        const personagem = auth.campaignCharacter ||
            auth.currentCharacter ||
            auth.character ||
            {};

        // A sessão autenticada tem prioridade sobre dados antigos do localStorage.
        estado.campanhaId = campanha.id ||
            salvo.campaignId ||
            salvo.campaign_id ||
            null;

        estado.usuarioId = usuario.id || salvo.userId || null;
        estado.personagemId = personagem.id || salvo.characterId || null;
        estado.slot = personagem.slot ?? auth.campaignSlot ?? salvo.slot ?? null;
        estado.nome = personagem.name ||
            personagem.nome ||
            auth.profile?.username ||
            salvo.characterName ||
            usuario.email ||
            "Jogador";

        estado.isMaster = Boolean(
            auth.isMaster === true ||
            salvo.isMaster === true ||
            (campanha.master_id && usuario.id &&
                String(campanha.master_id) === String(usuario.id))
        );

        return estado;
    }

    function obterClientesSupabase() {
        return [
            window.supabaseClient,
            window.sb,
            window.supabaseMesa?.client,
            window.SupabaseMesa?.client
        ].filter(Boolean);
    }

    async function obterAccessToken() {
        for (const cliente of obterClientesSupabase()) {
            if (typeof cliente.auth?.getSession !== "function") continue;

            try {
                const resultado = await cliente.auth.getSession();
                const token = resultado?.data?.session?.access_token;
                if (token) return token;
            } catch (erro) {
                console.warn("[MESA ONLINE] Falha ao ler sessão:", erro);
            }
        }

        return window.rpgAuth?.session?.access_token || null;
    }

    async function obterTokenAbly() {
        const accessToken = await obterAccessToken();

        if (!accessToken) {
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

        const texto = await resposta.text();
        let dados = null;

        try {
            dados = texto ? JSON.parse(texto) : null;
        } catch {
            throw new Error("A Edge Function do Ably retornou JSON inválido.");
        }

        if (!resposta.ok) {
            throw new Error(
                dados?.error ||
                dados?.message ||
                dados?.detalhes ||
                "Não foi possível autenticar no Ably."
            );
        }

        if (!dados) {
            throw new Error("Resposta vazia da autenticação Ably.");
        }

        return dados;
    }

    function disparar(nome, detail = {}) {
        window.dispatchEvent(new CustomEvent(nome, { detail }));
    }

    function tratarEstadoConexao(evento) {
        const atual = evento?.current || evento?.state;
        estado.conectado = atual === "connected";

        if (atual === "connected") {
            atualizarRealtime("Conectado");
            diagnostico("Multiplayer conectado no canal " + estado.canalNome + ".");
            disparar("mesa:multiplayerConectado", { estado });
            atualizarJogadoresOnline();
            return;
        }

        if (["disconnected", "suspended"].includes(atual)) {
            atualizarRealtime(atual);
            diagnostico("Multiplayer " + atual + ".");
            disparar("mesa:multiplayerDesconectado", { estado });
            return;
        }

        if (atual === "failed") {
            estado.conectado = false;
            atualizarRealtime("Falha");
            const erro = evento?.reason || new Error("Conexão Ably falhou.");
            diagnostico("Falha no Ably: " + (erro.message || String(erro)));
            disparar("mesa:multiplayerErro", { erro });
        }
    }

    async function esperarConexao() {
        if (ably?.connection?.state === "connected") return;

        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error("Tempo esgotado aguardando conexão do Ably."));
            }, 15000);

            const listener = (evento) => {
                if (evento?.current === "connected") {
                    clearTimeout(timer);
                    ably.connection.off(listener);
                    resolve();
                } else if (evento?.current === "failed") {
                    clearTimeout(timer);
                    ably.connection.off(listener);
                    reject(evento.reason || new Error("Falha na conexão Ably."));
                }
            };

            ably.connection.on(listener);
        });
    }

    async function atualizarPresenca() {
        if (!canal) return;

        await canal.presence.enter({
            usuarioId: estado.usuarioId,
            personagemId: estado.personagemId,
            nome: estado.nome,
            slot: estado.slot,
            isMaster: estado.isMaster
        });
    }

    async function atualizarJogadoresOnline() {
        if (!canal?.presence) return [];

        try {
            const resultado = await canal.presence.get();
            const jogadores = Array.isArray(resultado)
                ? resultado
                : resultado?.items || [];

            estado.jogadores = jogadores;
            diagnostico("Jogadores online: " + jogadores.length);
            disparar("mesa:multiplayerJogadoresAtualizados", {
                jogadores,
                quantidade: jogadores.length
            });
            return jogadores;
        } catch (erro) {
            console.warn("[MESA ONLINE] Erro ao consultar presença:", erro);
            return [];
        }
    }

    function assinarPresenca() {
        if (!canal?.presence) return;

        ["enter", "leave", "update"].forEach((evento) => {
            canal.presence.subscribe(evento, atualizarJogadoresOnline);
        });
    }

    async function desconectarAbly() {
        try {
            if (canal?.presence) {
                try {
                    await canal.presence.leave();
                } catch (erro) {
                    console.warn("[MESA ONLINE] Falha ao sair da presença:", erro);
                }
            }

            if (ably) ably.close();
        } finally {
            ably = null;
            canal = null;
            estado.conectado = false;
            estado.canalNome = null;
            estado.jogadores = [];
            atualizarRealtime("Desconectado");
        }
    }

    function agendarNovaTentativa() {
        if (retryTimer) return;

        retryTimer = setTimeout(() => {
            retryTimer = null;
            conectarAbly();
        }, RETRY_DELAY_MS);
    }

    async function conectarAbly() {
        if (conexaoEmAndamento) return conexaoEmAndamento;

        conexaoEmAndamento = (async () => {
            obterDadosMesa();

            if (!estado.campanhaId) {
                atualizarRealtime("Aguardando campanha");
                diagnostico("Campanha ainda não identificada.");
                return false;
            }

            if (!estado.usuarioId) {
                atualizarRealtime("Aguardando usuário");
                diagnostico("Usuário ainda não identificado.");
                return false;
            }

            if (!window.Ably?.Realtime) {
                atualizarRealtime("SDK Ably ausente");
                diagnostico("Biblioteca Ably não encontrada.");
                disparar("mesa:multiplayerErro", {
                    erro: new Error("SDK Ably não carregado.")
                });
                return false;
            }

            if (ably && estado.conectado && canal) return true;

            atualizarRealtime("Autenticando Ably...");
            diagnostico("Solicitando autenticação segura do Ably...");

            // authCallback é chamado novamente pelo SDK quando o token expirar.
            ably = new window.Ably.Realtime({
                authCallback: async function (_params, callback) {
                    try {
                        callback(null, await obterTokenAbly());
                    } catch (erro) {
                        callback(erro, null);
                    }
                }
            });

            ably.connection.on(tratarEstadoConexao);
            await esperarConexao();

            estado.canalNome = "rpg:mesa:" + estado.campanhaId;
            canal = ably.channels.get(estado.canalNome);
            assinarPresenca();

            await atualizarPresenca();
            await atualizarJogadoresOnline();

            diagnostico("Canal multiplayer preparado.");
            return true;
        })()
            .catch(async (erro) => {
                console.error("[MESA ONLINE] Erro ao conectar:", erro);
                estado.conectado = false;
                atualizarRealtime("Erro");
                diagnostico("Erro multiplayer: " + (erro?.message || String(erro)));
                disparar("mesa:multiplayerErro", { erro });
                await desconectarAbly();
                agendarNovaTentativa();
                return false;
            })
            .finally(() => {
                conexaoEmAndamento = null;
            });

        return conexaoEmAndamento;
    }

    async function reconectarPorMudancaDeContexto() {
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }

        await desconectarAbly();
        await conectarAbly();
    }

    function registrarEventos() {
        if (eventosRegistrados) return;
        eventosRegistrados = true;

        [
            "rpgAuth:loginConfirmado",
            "rpgAuth:campanhaSincronizada",
            "mesa:campanhaAlterada",
            "supabase:entradaPronta",
            "supabase:mesaContextoRecebido"
        ].forEach((nomeEvento) => {
            window.addEventListener(nomeEvento, () => {
                setTimeout(conectarAbly, 0);
            });
        });

        window.addEventListener("beforeunload", () => {
            try {
                canal?.presence?.leave();
                ably?.close();
            } catch {}
        });
    }

    window.mesaOnline = {
        estado,
        conectar: conectarAbly,
        desconectar: desconectarAbly,
        reconectar: reconectarPorMudancaDeContexto,
        obterDados: obterDadosMesa,
        atualizarJogadores: atualizarJogadoresOnline,
        get canal() {
            return canal;
        },
        get channel() {
            return canal;
        },
        get ably() {
            return ably;
        }
    };

    registrarEventos();

    function iniciar() {
        diagnostico("Camada multiplayer carregada.");
        conectarAbly();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
