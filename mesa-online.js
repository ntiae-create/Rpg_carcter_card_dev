/* =========================================================
   MESA ONLINE — ABLY
   Versão final limpa e estável
   - reconhece mestre
   - aceita jogador apenas se pertencer à campanha
   - sem duplicação de conexão
   - sem chaves sensíveis no frontend
========================================================= */

(function () {
    "use strict";

    console.log("[MESA ONLINE] Inicializando...");

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

    function obterMesaAtiva() {
        try {
            const salvo = localStorage.getItem("rpg_mesa_ativa");
            if (!salvo) return null;
            return JSON.parse(salvo);
        } catch (erro) {
            console.error("[MESA ONLINE] Erro ao ler rpg_mesa_ativa:", erro);
            return null;
        }
    }

    function obterDadosMesa() {
        const salvo = obterMesaAtiva();
        const auth = window.rpgAuth || {};
        const campanha = auth.campaign || {};
        const usuario = auth.user || {};
        const jogador = auth.campaignCharacter || auth.currentCharacter || {};

        estado.campanhaId =
            salvo?.campaignId ||
            salvo?.campaign_id ||
            campanha?.id ||
            window.rpgCampaign?.activeCampaign?.id ||
            null;

        estado.usuarioId =
            salvo?.userId ||
            usuario?.id ||
            null;

        estado.personagemId =
            salvo?.characterId ||
            jogador?.id ||
            null;

        estado.slot =
            salvo?.slot ||
            auth.campaignSlot ||
            jogador?.slot ||
            null;

        estado.nome =
            jogador?.name ||
            jogador?.nome ||
            salvo?.characterName ||
            usuario?.email ||
            "Jogador";

        estado.isMaster =
            auth.isMaster === true ||
            salvo?.isMaster === true ||
            (campanha?.master_id && usuario?.id && String(campanha.master_id) === String(usuario.id));

        console.log("[MESA ONLINE] Dados encontrados:", estado);
        return estado;
    }

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
            if (cliente && typeof cliente.auth?.getSession === "function") {
                try {
                    const resultado = await cliente.auth.getSession();
                    accessToken = resultado?.data?.session?.access_token || null;
                    if (accessToken) break;
                } catch (erro) {
                    console.warn("[MESA ONLINE] Falha ao obter sessão Supabase:", erro);
                }
            }
        }

        if (!accessToken) {
            accessToken = window.rpgAuth?.session?.access_token || null;
        }

        if (!accessToken) {
            throw new Error("Sessão Supabase não encontrada.");
        }

        const resposta = await fetch(ABLY_TOKEN_URL, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                campanhaId: estado.campanhaId
            })
        });

        const texto = await resposta.text();
        let dados = null;

        try {
            dados = JSON.parse(texto);
        } catch {
            dados = null;
        }

        if (!resposta.ok) {
            throw new Error(dados?.error || dados?.details || "Erro ao obter autenticação Ably.");
        }

        if (!dados) {
            throw new Error("Resposta inválida da autenticação Ably.");
        }

        diagnostico("TokenRequest Ably recebido.");
        return dados;
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
            console.error("[MESA ONLINE] Erro na presença:", erro);
            diagnostico("Erro ao registrar presença.");
        }
    }

    async function atualizarJogadoresOnline() {
        if (!canal) return;

        try {
            const membros = await canal.presence.get();
            const jogadores = membros.items || [];
            diagnostico("Jogadores online: " + jogadores.length);

            window.dispatchEvent(new CustomEvent("mesa:multiplayerJogadoresAtualizados", {
                detail: { jogadores }
            }));
        } catch (erro) {
            console.error("[MESA ONLINE] Erro ao atualizar jogadores:", erro);
        }
    }

    async function conectarAbly() {
        if (tentativaConexao) return;
        tentativaConexao = true;

        try {
            obterDadosMesa();

            if (!estado.campanhaId) {
                diagnostico("Não foi possível descobrir a campanha.");
                atualizarRealtime("Sem campanha");
                return;
            }

            if (!estado.usuarioId) {
                diagnostico("Não foi possível descobrir o usuário.");
                atualizarRealtime("Sem usuário");
                return;
            }

            if (!window.Ably) {
                diagnostico("Biblioteca Ably não encontrada.");
                atualizarRealtime("Ably indisponível");
                return;
            }

            if (ably && estado.conectado) {
                diagnostico("Multiplayer já está conectado.");
                return;
            }

            diagnostico("Campanha encontrada: " + estado.campanhaId);
            diagnostico("Usuário encontrado: " + estado.usuarioId);
            diagnostico("Slot: " + (estado.slot ?? "nenhum"));
            diagnostico("Preparando autenticação Ably...");
            atualizarRealtime("Autenticando Ably...");

            ably = new window.Ably.Realtime({
                authCallback: async function (_params, callback) {
                    try {
                        const tokenRequest = await obterTokenAbly();
                        callback(null, tokenRequest);
                    } catch (erro) {
                        callback(erro, null);
                    }
                }
            });

            ably.connection.on(function (evento) {
                console.log("[MESA ONLINE] Ably:", evento);

                if (evento.current === "connected") {
                    estado.conectado = true;
                    atualizarRealtime("Conectado");
                    diagnostico("Multiplayer conectado!");

                    window.dispatchEvent(new CustomEvent("mesa:multiplayerConectado", {
                        detail: { estado }
                    }));
                }

                if (evento.current === "disconnected" || evento.current === "suspended") {
                    estado.conectado = false;
                    atualizarRealtime(evento.current);
                    diagnostico("Multiplayer desconectado: " + evento.current);

                    window.dispatchEvent(new CustomEvent("mesa:multiplayerDesconectado", {
                        detail: { estado }
                    }));
                }

                if (evento.current === "failed") {
                    estado.conectado = false;
                    atualizarRealtime("Falha");
                    diagnostico("Falha na conexão Ably.");

                    window.dispatchEvent(new CustomEvent("mesa:multiplayerErro", {
                        detail: { erro: evento.reason || evento }
                    }));
                }
            });

            const nomeCanal = "rpg:mesa:" + estado.campanhaId;
            diagnostico("Entrando no canal: " + nomeCanal);

            canal = ably.channels.get(nomeCanal);
            estado.canal = nomeCanal;

            canal.presence.subscribe("enter", () => atualizarJogadoresOnline());
            canal.presence.subscribe("leave", () => atualizarJogadoresOnline());
            canal.presence.subscribe("update", () => atualizarJogadoresOnline());

            await atualizarPresenca();
            await atualizarJogadoresOnline();
            diagnostico("Canal multiplayer preparado.");
        } catch (erro) {
            console.error("[MESA ONLINE] Erro ao conectar:", erro);
            estado.conectado = false;
            atualizarRealtime("Erro");
            diagnostico("Erro multiplayer: " + (erro?.message || String(erro)));

            window.dispatchEvent(new CustomEvent("mesa:multiplayerErro", {
                detail: { erro }
            }));
        } finally {
            tentativaConexao = false;
        }
    }

    async function desconectarAbly() {
        try {
            if (canal) {
                try {
                    await canal.presence.leave();
                } catch {}
            }

            if (ably) {
                ably.close();
            }
        } catch (erro) {
            console.warn("[MESA ONLINE] Erro ao desconectar:", erro);
        } finally {
            ably = null;
            canal = null;
            estado.conectado = false;
            estado.canal = null;
            atualizarRealtime("Desconectado");
        }
    }

    window.addEventListener("mesa:campanhaAlterada", async function () {
        console.log("[MESA ONLINE] Campanha alterada.");
        obterDadosMesa();
        await desconectarAbly();
        await conectarAbly();
    });

    window.mesaOnline = {
        estado,
        conectar: conectarAbly,
        desconectar: desconectarAbly,
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

    function iniciar() {
        console.log("[MESA ONLINE] Camada multiplayer carregada.");
        conectarAbly();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
