/* =========================================================
   MESA ONLINE — ABLY
   Multiplayer e presença visual dos jogadores.
========================================================= */

(function () {
    "use strict";

    const ABLY_TOKEN_URL =
        "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";

    let ably = null;
    let canal = null;
    let tentativa = null;
    let reconexao = null;

    const estado = {
        conectado: false,
        campanhaId: null,
        usuarioId: null,
        personagemId: null,
        slot: null,
        nome: null,
        isMaster: false,
        jogadores: [],
        canalNome: null
    };

    function log(texto, erro = false) {
        (erro ? console.error : console.log)("[MESA ONLINE]", texto);

        const painel = document.getElementById("diagnostico-log");
        if (!painel) return;

        const linha = document.createElement("div");
        linha.textContent = "[ONLINE] " + texto;
        painel.appendChild(linha);
        painel.scrollTop = painel.scrollHeight;
    }

    function statusRealtime(texto) {
        const elemento = document.querySelector(
            '[data-diagnostico="realtime"]'
        );
        if (elemento) elemento.textContent = texto;
    }

    function emitir(nome, detalhe = {}) {
        window.dispatchEvent(new CustomEvent(nome, { detail: detalhe }));
    }

    function mesaSalva() {
        try {
            const valor = localStorage.getItem("rpg_mesa_ativa");
            return valor ? JSON.parse(valor) : {};
        } catch {
            return {};
        }
    }

    function obterDados() {
        const salvo = mesaSalva();
        const auth = window.rpgAuth || {};
        const campanha = auth.campaign ||
            window.rpgCampaign?.activeCampaign || {};
        const usuario = auth.user || {};
        const personagens = Array.isArray(auth.campaignCharacters)
            ? auth.campaignCharacters
            : [];

        const personagem = auth.campaignCharacter ||
            auth.currentCharacter ||
            auth.character ||
            personagens.find((item) =>
                String(item?.user_id) === String(usuario.id)
            ) ||
            {};

        estado.campanhaId = campanha.id ||
            salvo.campaignId || salvo.campaign_id || null;
        estado.usuarioId = usuario.id || salvo.userId || null;
        estado.personagemId = personagem.id || salvo.characterId || null;
        estado.slot = personagem.slot ?? auth.campaignSlot ?? salvo.slot ?? null;
        estado.nome = personagem.name || personagem.nome ||
            auth.profile?.username || salvo.characterName ||
            usuario.email || "Jogador";
        estado.isMaster = Boolean(
            auth.isMaster === true ||
            salvo.isMaster === true ||
            (campanha.master_id && usuario.id &&
                String(campanha.master_id) === String(usuario.id))
        );

        return estado;
    }

    async function accessToken() {
        const clientes = [
            window.supabaseClient,
            window.sb,
            window.supabaseMesa?.client,
            window.SupabaseMesa?.client
        ].filter(Boolean);

        for (const cliente of clientes) {
            if (typeof cliente.auth?.getSession !== "function") continue;
            try {
                const resposta = await cliente.auth.getSession();
                const token = resposta?.data?.session?.access_token;
                if (token) return token;
            } catch (erro) {
                console.warn("[MESA ONLINE] Falha ao obter sessão:", erro);
            }
        }

        return window.rpgAuth?.session?.access_token || null;
    }

    async function tokenAbly() {
        const token = await accessToken();
        if (!token) throw new Error("Sessão Supabase não encontrada.");

        const resposta = await fetch(ABLY_TOKEN_URL, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ campanhaId: estado.campanhaId })
        });

        const texto = await resposta.text();
        let dados;
        try {
            dados = texto ? JSON.parse(texto) : null;
        } catch {
            throw new Error("Resposta inválida da autenticação Ably.");
        }

        if (!resposta.ok) {
            throw new Error(
                dados?.error || dados?.message || dados?.detalhes ||
                "Não foi possível autenticar no Ably."
            );
        }

        return dados;
    }

    function dadosMembro(membro) {
        const dados = membro?.data || membro?.presenceData || {};
        const slot = Number(dados.slot);

        return {
            usuarioId: dados.usuarioId || dados.userId || membro?.clientId || null,
            personagemId: dados.personagemId || dados.characterId || null,
            slot: Number.isInteger(slot) ? slot : null,
            nome: dados.nome || dados.name || "Jogador",
            isMaster: dados.isMaster === true
        };
    }

    /*
     * Atualiza o estado/card sem depender de uma função privada do mesa.js.
     * Se atualizarAssento for exposta futuramente, ela será usada primeiro.
     */
    function atualizarSlot(jogador) {
        if (!jogador.slot || jogador.slot < 1 || jogador.slot > 8) return;

        const mesa = window.MesaRPG;
        const dados = {
            ocupado: true,
            userId: jogador.usuarioId,
            characterId: jogador.personagemId,
            conectado: true,
            nome: jogador.nome,
            slot: jogador.slot
        };

        if (typeof mesa?.atualizarAssento === "function") {
            mesa.atualizarAssento(jogador.slot, dados);
        }

        const estadoMesa = typeof mesa?.estado === "function"
            ? mesa.estado()
            : null;
        const assento = estadoMesa?.jogadores?.[jogador.slot - 1];

        if (assento) Object.assign(assento, dados);

        const card = document.querySelector(
            `.player-card[data-player="${jogador.slot}"]`
        );
        if (!card) return;

        card.classList.add("ocupado");
        card.classList.remove("vazio");
        card.dataset.ocupado = "true";
        card.dataset.conectado = "true";
        card.dataset.userId = jogador.usuarioId || "";
        card.dataset.characterId = jogador.personagemId || "";

        const nome = card.querySelector(".player-name");
        if (nome) nome.textContent = jogador.nome;

        if (window.MesaJogadores?.conexao?.definir) {
            window.MesaJogadores.conexao.definir(jogador.slot, true);
        }
    }

    function atualizarSlots(jogadores) {
        const lista = jogadores.map(dadosMembro);
        const porSlot = new Map(
            lista.filter((item) => item.slot).map((item) => [item.slot, item])
        );

        // Remove apenas o indicador de conexão dos slots que saíram.
        const estadoMesa = typeof window.MesaRPG?.estado === "function"
            ? window.MesaRPG.estado()
            : null;

        if (estadoMesa?.jogadores) {
            estadoMesa.jogadores.forEach((assento) => {
                if (!assento?.slot || porSlot.has(Number(assento.slot))) return;
                assento.conectado = false;
                const card = document.querySelector(
                    `.player-card[data-player="${assento.slot}"]`
                );
                if (card) card.dataset.conectado = "false";
            });
        }

        lista.forEach(atualizarSlot);

        if (typeof window.MesaRPG?.atualizarAssentos === "function") {
            window.MesaRPG.atualizarAssentos();
        }
    }

    async function listarJogadores() {
        if (!canal?.presence) return [];

        try {
            const resposta = await canal.presence.get();
            const jogadores = Array.isArray(resposta)
                ? resposta
                : resposta?.items || [];

            estado.jogadores = jogadores;
            atualizarSlots(jogadores);
            log("Jogadores online: " + jogadores.length);

            emitir("mesa:multiplayerJogadoresAtualizados", {
                jogadores,
                quantidade: jogadores.length
            });

            return jogadores;
        } catch (erro) {
            log("Erro ao consultar presença: " + erro.message, true);
            return [];
        }
    }

    async function entrarNaPresenca() {
        if (!canal) return;
        await canal.presence.enter({
            usuarioId: estado.usuarioId,
            personagemId: estado.personagemId,
            nome: estado.nome,
            slot: estado.slot,
            isMaster: estado.isMaster
        });
    }

    function assinarPresenca() {
        ["enter", "leave", "update"].forEach((evento) => {
            canal.presence.subscribe(evento, listarJogadores);
        });
    }

    function estadoConexao(evento) {
        const atual = evento?.current || evento?.state;
        estado.conectado = atual === "connected";

        if (atual === "connected") {
            statusRealtime("Conectado");
            log("Multiplayer conectado no canal " + estado.canalNome + ".");
            emitir("mesa:multiplayerConectado", { estado });
            listarJogadores();
        } else if (["disconnected", "suspended"].includes(atual)) {
            statusRealtime(atual);
            emitir("mesa:multiplayerDesconectado", { estado });
        } else if (atual === "failed") {
            const erro = evento.reason || new Error("Conexão Ably falhou.");
            estado.conectado = false;
            statusRealtime("Falha");
            emitir("mesa:multiplayerErro", { erro });
        }
    }

    async function conectar() {
        if (tentativa) return tentativa;

        tentativa = (async () => {
            obterDados();

            if (!estado.campanhaId) {
                statusRealtime("Aguardando campanha");
                log("Campanha ainda não identificada.");
                return false;
            }

            if (!estado.usuarioId) {
                statusRealtime("Aguardando usuário");
                log("Usuário ainda não identificado.");
                return false;
            }

            if (!window.Ably?.Realtime) {
                statusRealtime("SDK Ably ausente");
                throw new Error("Biblioteca Ably não carregada.");
            }

            if (ably && estado.conectado && canal) return true;

            statusRealtime("Autenticando Ably...");
            ably = new window.Ably.Realtime({
                authCallback: async (_params, callback) => {
                    try {
                        callback(null, await tokenAbly());
                    } catch (erro) {
                        callback(erro, null);
                    }
                }
            });

            ably.connection.on(estadoConexao);
            estado.canalNome = "rpg:mesa:" + estado.campanhaId;
            canal = ably.channels.get(estado.canalNome);
            assinarPresenca();

            await entrarNaPresenca();
            await listarJogadores();

            log("Canal multiplayer preparado.");
            return true;
        })()
            .catch(async (erro) => {
                estado.conectado = false;
                statusRealtime("Erro");
                log("Erro multiplayer: " + erro.message, true);
                emitir("mesa:multiplayerErro", { erro });
                await desconectar();
                if (!reconexao) {
                    reconexao = setTimeout(() => {
                        reconexao = null;
                        conectar();
                    }, 1500);
                }
                return false;
            })
            .finally(() => {
                tentativa = null;
            });

        return tentativa;
    }

    async function desconectar() {
        try {
            if (canal?.presence) {
                try {
                    await canal.presence.leave();
                } catch {}
            }
            if (ably) ably.close();
        } finally {
            ably = null;
            canal = null;
            estado.conectado = false;
            estado.canalNome = null;
            estado.jogadores = [];
            statusRealtime("Desconectado");
        }
    }

    async function reconectar() {
        if (reconexao) {
            clearTimeout(reconexao);
            reconexao = null;
        }
        await desconectar();
        return conectar();
    }

    [
        "rpgAuth:loginConfirmado",
        "rpgAuth:campanhaSincronizada",
        "mesa:campanhaAlterada",
        "supabase:entradaPronta",
        "supabase:mesaContextoRecebido"
    ].forEach((evento) => {
        window.addEventListener(evento, () => setTimeout(conectar, 0));
    });

    window.addEventListener("beforeunload", () => {
        try {
            canal?.presence?.leave();
            ably?.close();
        } catch {}
    });

    window.mesaOnline = {
        estado,
        conectar,
        desconectar,
        reconectar,
        obterDados,
        atualizarJogadores: listarJogadores,
        get canal() { return canal; },
        get channel() { return canal; },
        get ably() { return ably; }
    };

    function iniciar() {
        log("Camada multiplayer carregada.");
        conectar();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar, { once: true });
    } else {
        iniciar();
    }
})();
