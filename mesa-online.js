/* =========================================================
   MESA ONLINE — ABLY
   Multiplayer, presença e renderização dos slots.
========================================================= */
(function () {
    "use strict";

    const TOKEN_URL = "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";
    const CHANNEL_PREFIX = "rpg:mesa:";
    const MAX_SLOTS = 8;

    let client = null;
    let channel = null;
    let connecting = null;
    let retryTimer = null;
    let presencePlayers = [];

    const state = {
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

    function log(message, error = false) {
        (error ? console.error : console.log)("[MESA ONLINE]", message);
        const target = document.getElementById("diagnostico-log");
        if (!target) return;
        const line = document.createElement("div");
        line.textContent = "[ONLINE] " + message;
        target.appendChild(line);
        target.scrollTop = target.scrollHeight;
    }

    function setRealtimeStatus(status) {
        const element = document.querySelector('[data-diagnostico="realtime"]');
        if (element) element.textContent = status;
    }

    function emit(name, detail = {}) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }

    function readSavedTable() {
        try {
            const raw = localStorage.getItem("rpg_mesa_ativa");
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    function readContext() {
        const saved = readSavedTable();
        const auth = window.rpgAuth || {};
        const campaign = auth.campaign || window.rpgCampaign?.activeCampaign || {};
        const user = auth.user || {};
        const characters = Array.isArray(auth.campaignCharacters)
            ? auth.campaignCharacters
            : [];

        const character = auth.campaignCharacter ||
            auth.currentCharacter ||
            auth.character ||
            characters.find((item) => String(item?.user_id) === String(user.id)) ||
            {};

        state.campanhaId = campaign.id || saved.campaignId || saved.campaign_id || null;
        state.usuarioId = user.id || saved.userId || null;
        state.personagemId = character.id || saved.characterId || null;
        state.slot = character.slot ?? auth.campaignSlot ?? saved.slot ?? null;
        state.nome = character.name || character.nome || auth.profile?.username ||
            saved.characterName || user.email || "Jogador";
        state.isMaster = Boolean(
            auth.isMaster === true || saved.isMaster === true ||
            (campaign.master_id && user.id && String(campaign.master_id) === String(user.id))
        );
        return state;
    }

    async function getAccessToken() {
        const clients = [
            window.supabaseClient,
            window.sb,
            window.supabaseMesa?.client,
            window.SupabaseMesa?.client
        ].filter(Boolean);

        for (const supabase of clients) {
            if (typeof supabase.auth?.getSession !== "function") continue;
            try {
                const result = await supabase.auth.getSession();
                const token = result?.data?.session?.access_token;
                if (token) return token;
            } catch (error) {
                console.warn("[MESA ONLINE] Falha ao obter sessão:", error);
            }
        }
        return window.rpgAuth?.session?.access_token || null;
    }

    async function getAblyToken() {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Sessão Supabase não encontrada.");

        const response = await fetch(TOKEN_URL, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + accessToken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ campanhaId: state.campanhaId })
        });

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            throw new Error("Resposta inválida da autenticação Ably.");
        }

        if (!response.ok) {
            throw new Error(data?.error || data?.message || data?.detalhes ||
                "Não foi possível autenticar no Ably.");
        }
        return data;
    }

    function normalizeMember(member) {
        const data = member?.data || member?.presenceData || {};
        const slot = Number(data.slot);
        return {
            usuarioId: data.usuarioId || data.userId || member?.clientId || null,
            personagemId: data.personagemId || data.characterId || null,
            slot: Number.isInteger(slot) && slot >= 1 && slot <= MAX_SLOTS ? slot : null,
            nome: data.nome || data.name || "Jogador"
        };
    }

    function findSlotFor(member) {
        if (member.slot) return member.slot;
        const characters = window.rpgAuth?.campaignCharacters;
        if (!Array.isArray(characters)) return null;
        const character = characters.find((item) =>
            String(item?.user_id) === String(member.usuarioId) ||
            String(item?.id) === String(member.personagemId)
        );
        const slot = Number(character?.slot);
        return Number.isInteger(slot) && slot >= 1 && slot <= MAX_SLOTS ? slot : null;
    }

    function injectSlotStyles() {
        if (document.getElementById("mesa-online-slot-styles")) return;
        const style = document.createElement("style");
        style.id = "mesa-online-slot-styles";
        style.textContent = `
            .player-card[data-ocupado="true"], .player-card.ocupado {
                opacity: 1 !important;
                border-style: solid !important;
                border-color: rgba(201,164,91,.9) !important;
            }
            .player-card[data-conectado="true"] {
                box-shadow: 0 0 0 2px rgba(92,220,145,.55), 0 12px 30px rgba(0,0,0,.65) !important;
            }
            .player-card[data-conectado="true"] .player-name::after {
                content: "  ● online";
                color: #86efac;
                font-size: .8em;
            }
        `;
        document.head.appendChild(style);
    }

    function renderMember(member) {
        const slot = findSlotFor(member);
        if (!slot) return;

        const card = document.querySelector(`.player-card[data-player="${slot}"]`);
        if (!card) return;

        const name = card.querySelector(".player-name");
        card.dataset.ocupado = "true";
        card.dataset.conectado = "true";
        card.dataset.userId = member.usuarioId || "";
        card.dataset.characterId = member.personagemId || "";
        card.classList.add("ocupado");
        card.classList.remove("vazio");
        if (name) name.textContent = member.nome;

        const mesaState = typeof window.MesaRPG?.estado === "function"
            ? window.MesaRPG.estado()
            : null;
        const seat = mesaState?.jogadores?.[slot - 1];
        if (seat) {
            seat.ocupado = true;
            seat.conectado = true;
            seat.userId = member.usuarioId || seat.userId || null;
            seat.characterId = member.personagemId || seat.characterId || null;
            seat.nome = member.nome || seat.nome;
        }
    }

    function renderPresence(players) {
        injectSlotStyles();
        const normalized = players.map(normalizeMember);
        presencePlayers = normalized;

        // Limpa somente o estado visual de conexão; não apaga personagens persistidos.
        document.querySelectorAll(".player-card[data-conectado]").forEach((card) => {
            card.dataset.conectado = "false";
        });

        normalized.forEach((member) => renderMember(member));
        window.MesaRPG?.atualizarAssentos?.();
    }

    async function refreshPresence() {
        if (!channel?.presence) return [];
        try {
            const result = await channel.presence.get();
            const players = Array.isArray(result) ? result : result?.items || [];
            state.jogadores = players;
            renderPresence(players);
            emit("mesa:multiplayerJogadoresAtualizados", {
                jogadores: players,
                quantidade: players.length
            });
            log("Jogadores online: " + players.length);
            return players;
        } catch (error) {
            log("Erro ao consultar presença: " + error.message, true);
            return [];
        }
    }

    async function enterPresence() {
        if (!channel) return;
        await channel.presence.enter({
            usuarioId: state.usuarioId,
            personagemId: state.personagemId,
            nome: state.nome,
            slot: state.slot,
            isMaster: state.isMaster
        });
    }

    function subscribePresence() {
        ["enter", "leave", "update"].forEach((eventName) => {
            channel.presence.subscribe(eventName, refreshPresence);
        });
    }

    function onConnectionChange(event) {
        const current = event?.current || event?.state;
        state.conectado = current === "connected";
        if (current === "connected") {
            setRealtimeStatus("Conectado");
            emit("mesa:multiplayerConectado", { estado: state });
            refreshPresence();
        } else if (["disconnected", "suspended"].includes(current)) {
            setRealtimeStatus(current);
            emit("mesa:multiplayerDesconectado", { estado: state });
        } else if (current === "failed") {
            setRealtimeStatus("Falha");
            emit("mesa:multiplayerErro", {
                erro: event.reason || new Error("Conexão Ably falhou.")
            });
        }
    }

    async function disconnect() {
        try {
            await channel?.presence?.leave();
        } catch {}
        try {
            client?.close();
        } catch {}
        client = null;
        channel = null;
        state.conectado = false;
        state.canalNome = null;
        state.jogadores = [];
        setRealtimeStatus("Desconectado");
    }

    async function connect() {
        if (connecting) return connecting;
        connecting = (async () => {
            readContext();
            if (!state.campanhaId) {
                setRealtimeStatus("Aguardando campanha");
                return false;
            }
            if (!state.usuarioId) {
                setRealtimeStatus("Aguardando usuário");
                return false;
            }
            if (!window.Ably?.Realtime) throw new Error("SDK Ably não carregado.");
            if (client && state.conectado && channel) return true;

            setRealtimeStatus("Autenticando Ably...");
            client = new window.Ably.Realtime({
                authCallback: async (_params, callback) => {
                    try {
                        callback(null, await getAblyToken());
                    } catch (error) {
                        callback(error, null);
                    }
                }
            });
            client.connection.on(onConnectionChange);
            state.canalNome = CHANNEL_PREFIX + state.campanhaId;
            channel = client.channels.get(state.canalNome);
            subscribePresence();
            await enterPresence();
            await refreshPresence();
            log("Canal multiplayer preparado.");
            return true;
        })()
            .catch(async (error) => {
                log("Erro multiplayer: " + error.message, true);
                emit("mesa:multiplayerErro", { erro: error });
                await disconnect();
                if (!retryTimer) {
                    retryTimer = setTimeout(() => {
                        retryTimer = null;
                        connect();
                    }, 1500);
                }
                return false;
            })
            .finally(() => {
                connecting = null;
            });
        return connecting;
    }

    async function reconnect() {
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        await disconnect();
        return connect();
    }

    // O sincronizador de personagens pode redesenhar os cards depois da presença.
    // Reaplica a presença após cada atualização para impedir que o slot desapareça.
    document.addEventListener("mesa:jogadoresAtualizados", () => {
        setTimeout(() => renderPresence(presencePlayers), 0);
    });

    [
        "rpgAuth:loginConfirmado",
        "rpgAuth:campanhaSincronizada",
        "mesa:campanhaAlterada",
        "supabase:entradaPronta",
        "supabase:mesaContextoRecebido"
    ].forEach((eventName) => {
        window.addEventListener(eventName, () => setTimeout(connect, 0));
    });

    window.addEventListener("beforeunload", () => {
        try {
            channel?.presence?.leave();
            client?.close();
        } catch {}
    });

    window.mesaOnline = {
        estado: state,
        conectar: connect,
        desconectar: disconnect,
        reconectar: reconnect,
        obterDados: readContext,
        atualizarJogadores: refreshPresence,
        get canal() { return channel; },
        get channel() { return channel; },
        get ably() { return client; }
    };

    injectSlotStyles();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", connect, { once: true });
    } else {
        connect();
    }
})();
