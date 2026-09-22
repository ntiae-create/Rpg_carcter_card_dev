/* =========================================================
   MESA ONLINE — ABLY
   Multiplayer, presença, slots e diagnóstico visual.
========================================================= */
(function () {
    "use strict";

    const TOKEN_URL = "https://bjkbfxcmyihdruqrwsdf.supabase.co/functions/v1/ably-token";
    const MAX_SLOTS = 8;
    const CHANNEL_PREFIX = "rpg:mesa:";

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
        role: "player",
        jogadores: [],
        canalNome: null
    };

    function ensureVisualStatus() {
        let box = document.getElementById("mesa-online-status");
        if (box) return box;
        box = document.createElement("aside");
        box.id = "mesa-online-status";
        box.setAttribute("aria-live", "polite");
        box.innerHTML = `
            <div class="mesa-online-status-header"><strong>📡 Mesa online</strong><button type="button" data-online-close>×</button></div>
            <div data-online-summary>Aguardando diagnóstico...</div>
            <div data-online-details></div>
        `;
        Object.assign(box.style, {
            position: "fixed", left: "14px", bottom: "14px", zIndex: "99998",
            width: "min(92vw, 360px)", padding: "12px 14px",
            border: "1px solid rgba(201,164,91,.65)", borderRadius: "12px",
            background: "rgba(11,8,17,.96)", color: "#eee7ff",
            font: "12px Arial, sans-serif", boxShadow: "0 8px 25px rgba(0,0,0,.55)"
        });
        const header = box.querySelector(".mesa-online-status-header");
        Object.assign(header.style, { display: "flex", justifyContent: "space-between", marginBottom: "7px" });
        const close = box.querySelector("[data-online-close]");
        Object.assign(close.style, { border: "0", background: "transparent", color: "#efd18a", fontSize: "18px", cursor: "pointer" });
        close.addEventListener("click", () => box.remove());
        document.body.appendChild(box);
        return box;
    }

    function visual(message, type = "info") {
        const box = ensureVisualStatus();
        const summary = box.querySelector("[data-online-summary]");
        const details = box.querySelector("[data-online-details]");
        const colors = { success: "#86efac", error: "#fca5a5", warning: "#fde68a", info: "#c4b5fd" };
        summary.textContent = message;
        summary.style.color = colors[type] || colors.info;
        details.textContent = [
            state.campanhaId ? `Campanha: ${state.campanhaId}` : "Campanha: não encontrada",
            state.usuarioId ? "Usuário: identificado" : "Usuário: não identificado",
            state.isMaster ? "Perfil: Mestre" : state.slot ? `Slot: ${state.slot}` : "Slot: não definido",
            state.isMaster ? "Personagem: não necessário para o Mestre" : state.personagemId ? "Personagem: identificado" : "Personagem: não identificado",
            `Jogadores online: ${presencePlayers.length}`
        ].join(" • ");
        details.style.marginTop = "6px";
        details.style.lineHeight = "1.4";
    }

    function log(message, type = "info") {
        console.log("[MESA ONLINE]", message);
        visual(message, type);
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

    function savedTable() {
        try {
            const raw = localStorage.getItem("rpg_mesa_ativa");
            return raw ? JSON.parse(raw) : {};
        } catch { return {}; }
    }

    function currentCampaign(auth) {
        const mesaCampaign = typeof window.MesaRPG?.campanha === "function"
            ? window.MesaRPG.campanha()
            : null;
        return auth.campaign || window.rpgCampaign?.activeCampaign || mesaCampaign || {};
    }

    function currentUser(auth) {
        return auth.user || auth.usuario || {};
    }

    function readContext() {
        const saved = savedTable();
        const auth = window.rpgAuth || {};
        const campaign = currentCampaign(auth);
        const user = currentUser(auth);
        const userId = user.id || saved.userId || null;
        const characters = Array.isArray(auth.campaignCharacters) ? auth.campaignCharacters : [];
        const character = auth.campaignCharacter || auth.currentCharacter || auth.character ||
            characters.find((item) => String(item?.user_id) === String(userId)) || {};

        const masterId = campaign.master_id || campaign.masterId || saved.masterId || saved.master_id || null;
        const masterByCampaign = Boolean(userId && masterId && String(userId).trim().toLowerCase() === String(masterId).trim().toLowerCase());
        const masterByAuth = auth.isMaster === true || window.MesaRPG?.estado?.()?.usuario?.isMaster === true;

        state.campanhaId = campaign.id || saved.campaignId || saved.campaign_id || null;
        state.usuarioId = userId;
        state.isMaster = masterByCampaign || masterByAuth;
        state.role = state.isMaster ? "master" : "player";
        state.personagemId = state.isMaster ? null : (character.id || saved.characterId || null);
        state.slot = state.isMaster ? null : (character.slot ?? auth.campaignSlot ?? saved.slot ?? null);
        state.nome = state.isMaster
            ? (auth.profile?.username || user.user_metadata?.name || user.email || "Mestre")
            : (character.name || character.nome || auth.profile?.username || saved.characterName || user.email || "Jogador");

        return state;
    }

    async function accessToken() {
        const clients = [window.supabaseClient, window.sb, window.supabaseMesa?.client, window.SupabaseMesa?.client].filter(Boolean);
        for (const supabase of clients) {
            if (typeof supabase.auth?.getSession !== "function") continue;
            try {
                const result = await supabase.auth.getSession();
                if (result?.data?.session?.access_token) return result.data.session.access_token;
            } catch {}
        }
        return window.rpgAuth?.session?.access_token || null;
    }

    async function ablyToken() {
        const token = await accessToken();
        if (!token) throw new Error("Sessão Supabase não encontrada.");
        const response = await fetch(TOKEN_URL, {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ campanhaId: state.campanhaId, isMaster: state.isMaster })
        });
        const text = await response.text();
        let data;
        try { data = text ? JSON.parse(text) : null; } catch { throw new Error("Resposta inválida da autenticação Ably."); }
        if (!response.ok) throw new Error(data?.error || data?.message || data?.detalhes || "Falha na autenticação Ably.");
        return data;
    }

    function normalizeMember(member) {
        const data = member?.data || member?.presenceData || {};
        const slot = Number(data.slot);
        return {
            usuarioId: data.usuarioId || data.userId || member?.clientId || null,
            personagemId: data.personagemId || data.characterId || null,
            slot: Number.isInteger(slot) && slot >= 1 && slot <= MAX_SLOTS ? slot : null,
            nome: data.nome || data.name || "Jogador",
            isMaster: data.isMaster === true || data.role === "master",
            role: data.role || (data.isMaster ? "master" : "player")
        };
    }

    function findSlot(member) {
        if (member.isMaster || member.role === "master") return null;
        if (member.slot) return member.slot;
        const characters = window.rpgAuth?.campaignCharacters;
        if (!Array.isArray(characters)) return null;
        const character = characters.find((item) => String(item?.user_id) === String(member.usuarioId) || String(item?.id) === String(member.personagemId));
        const slot = Number(character?.slot);
        return Number.isInteger(slot) && slot >= 1 && slot <= MAX_SLOTS ? slot : null;
    }

    function injectSlotStyles() {
        if (document.getElementById("mesa-online-slot-styles")) return;
        const style = document.createElement("style");
        style.id = "mesa-online-slot-styles";
        style.textContent = `.player-card[data-ocupado="true"],.player-card.ocupado{opacity:1!important;border-style:solid!important;border-color:rgba(201,164,91,.9)!important}.player-card[data-conectado="true"]{box-shadow:0 0 0 2px rgba(92,220,145,.55),0 12px 30px rgba(0,0,0,.65)!important}.player-card[data-conectado="true"] .player-name::after{content:"  ● online";color:#86efac;font-size:.8em}`;
        document.head.appendChild(style);
    }

    function renderMember(member) {
        const slot = findSlot(member);
        if (!slot) {
            if (member.isMaster || member.role === "master") log(`${member.nome} está conectado como Mestre; Mestre não ocupa slot.`, "success");
            else log(`${member.nome} está conectado, mas não possui slot definido.`, "warning");
            return;
        }
        const card = document.querySelector(`.player-card[data-player="${slot}"]`);
        if (!card) { log(`Slot ${slot} não foi encontrado na interface.`, "error"); return; }
        const name = card.querySelector(".player-name");
        card.dataset.ocupado = "true";
        card.dataset.conectado = "true";
        card.dataset.userId = member.usuarioId || "";
        card.dataset.characterId = member.personagemId || "";
        card.classList.add("ocupado");
        card.classList.remove("vazio");
        if (name) name.textContent = member.nome;
        const mesaState = typeof window.MesaRPG?.estado === "function" ? window.MesaRPG.estado() : null;
        const seat = mesaState?.jogadores?.[slot - 1];
        if (seat) { seat.ocupado = true; seat.conectado = true; seat.userId = member.usuarioId || seat.userId || null; seat.characterId = member.personagemId || seat.characterId || null; seat.nome = member.nome || seat.nome; }
        log(`${member.nome} apareceu no slot ${slot}.`, "success");
    }

    function renderPresence(players) {
        injectSlotStyles();
        presencePlayers = players.map(normalizeMember);
        document.querySelectorAll(".player-card[data-conectado]").forEach((card) => { card.dataset.conectado = "false"; });
        presencePlayers.forEach(renderMember);
        window.MesaRPG?.atualizarAssentos?.();
        visual(`Presença atualizada: ${presencePlayers.length} jogador(es).`, "success");
    }

    async function refreshPresence() {
        if (!channel?.presence) return [];
        try {
            const result = await channel.presence.get();
            const players = Array.isArray(result) ? result : result?.items || [];
            state.jogadores = players;
            renderPresence(players);
            emit("mesa:multiplayerJogadoresAtualizados", { jogadores: players, quantidade: players.length });
            return players;
        } catch (error) { log("Erro ao consultar presença: " + error.message, "error"); return []; }
    }

    async function enterPresence() {
        if (!channel) return;
        await channel.presence.enter({ usuarioId: state.usuarioId, personagemId: state.personagemId, nome: state.nome, slot: state.slot, isMaster: state.isMaster, role: state.role });
        log(state.isMaster ? "Presença enviada como Mestre." : `Presença enviada. Slot informado: ${state.slot || "não definido"}.`);
    }

    function subscribePresence() { ["enter", "leave", "update"].forEach((eventName) => channel.presence.subscribe(eventName, refreshPresence)); }

    function connectionChanged(event) {
        const current = event?.current || event?.state;
        state.conectado = current === "connected";
        if (current === "connected") { setRealtimeStatus("Conectado"); log(state.isMaster ? "Multiplayer conectado como Mestre." : "Multiplayer conectado.", "success"); emit("mesa:multiplayerConectado", { estado: state }); refreshPresence(); }
        else if (["disconnected", "suspended"].includes(current)) { setRealtimeStatus(current); log("Multiplayer " + current, "warning"); emit("mesa:multiplayerDesconectado", { estado: state }); }
        else if (current === "failed") { setRealtimeStatus("Falha"); log("Conexão Ably falhou.", "error"); emit("mesa:multiplayerErro", { erro: event.reason || new Error("Conexão Ably falhou.") }); }
    }

    async function disconnect() { try { await channel?.presence?.leave(); } catch {} try { client?.close(); } catch {} client = null; channel = null; state.conectado = false; state.canalNome = null; state.jogadores = []; setRealtimeStatus("Desconectado"); }

    async function connect() {
        if (connecting) return connecting;
        connecting = (async () => {
            readContext();
            visual("Iniciando diagnóstico visual...", "info");
            if (!state.campanhaId) { log("Campanha não encontrada.", "warning"); setRealtimeStatus("Aguardando campanha"); return false; }
            if (!state.usuarioId) { log("Usuário não identificado.", "warning"); setRealtimeStatus("Aguardando usuário"); return false; }
            if (!window.Ably?.Realtime) throw new Error("SDK Ably não carregado.");
            if (client && state.conectado && channel) return true;
            setRealtimeStatus("Autenticando Ably...");
            client = new window.Ably.Realtime({ authCallback: async (_params, callback) => { try { callback(null, await ablyToken()); } catch (error) { callback(error, null); } } });
            client.connection.on(connectionChanged);
            state.canalNome = CHANNEL_PREFIX + state.campanhaId;
            channel = client.channels.get(state.canalNome);
            subscribePresence();
            await enterPresence();
            await refreshPresence();
            log("Canal multiplayer preparado.", "success");
            return true;
        })().catch(async (error) => { log("Erro multiplayer: " + error.message, "error"); emit("mesa:multiplayerErro", { erro: error }); await disconnect(); if (!retryTimer) retryTimer = setTimeout(() => { retryTimer = null; connect(); }, 1500); return false; }).finally(() => { connecting = null; });
        return connecting;
    }

    async function reconnect() { if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } await disconnect(); return connect(); }

    document.addEventListener("mesa:jogadoresAtualizados", () => setTimeout(() => renderPresence(state.jogadores), 0));
    ["rpgAuth:loginConfirmado", "rpgAuth:campanhaSincronizada", "mesa:campanhaAlterada", "supabase:entradaPronta", "supabase:mesaContextoRecebido"].forEach((eventName) => { window.addEventListener(eventName, () => setTimeout(connect, 0)); });
    window.addEventListener("beforeunload", () => { try { channel?.presence?.leave(); client?.close(); } catch {} });

    window.mesaOnline = { estado: state, conectar: connect, desconectar: disconnect, reconectar: reconnect, obterDados: readContext, atualizarJogadores: refreshPresence, get canal() { return channel; }, get channel() { return channel; }, get ably() { return client; } };
    injectSlotStyles();
    ensureVisualStatus();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connect, { once: true }); else connect();
})();
