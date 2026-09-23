"use strict";

/*
==============================================================
 MESA RPG ONLINE
 CORE / ORQUESTRADOR
==============================================================
*/

const MESA_CONFIG = {
    maxJogadores: 8,
    modos: {
        NORMAL: "normal",
        AVENTURA: "aventura",
        BATALHA: "batalha"
    },
    cte: {
        disponivel: true,
        tempoPadrao: 1000,
        quantidadePadrao: 1
    }
};

const mesaState = {
    inicializado: false,
    modoAtual: MESA_CONFIG.modos.NORMAL,
    campanha: {
        id: null,
        nome: "Campanha",
        codigoMesa: null,
        masterId: null
    },
    usuario: {
        id: null,
        nome: null,
        email: null,
        isMaster: false,
        isPlayer: false
    },
    jogadorAtual: {
        characterId: null,
        slot: null
    },
    jogadores: Array.from(
        { length: MESA_CONFIG.maxJogadores },
        (_, index) => ({
            slot: index + 1,
            ocupado: false,
            characterId: null,
            userId: null
        })
    ),
    aventura: {
        aberta: false,
        tipo: null,
        dados: null
    },
    batalha: {
        ativa: false,
        rodada: 0,
        turno: null,
        participantes: []
    },
    cte: {
        ativo: false,
        tempo: MESA_CONFIG.cte.tempoPadrao,
        quantidade: MESA_CONFIG.cte.quantidadePadrao,
        cliques: 0,
        resultados: [],
        inicio: null
    }
};

let mesaRealtimeChannel = null;
let mesaRealtimeCampaignId = null;

function obterSupabaseMesa() {
    if (
        window.SupabaseMesa &&
        typeof window.SupabaseMesa.obterCliente === "function"
    ) {
        const cliente = window.SupabaseMesa.obterCliente();
        if (cliente && typeof cliente.from === "function") {
            return cliente;
        }
    }

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        return window.supabaseClient;
    }

    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {
        return window.supabase;
    }

    console.warn("[Mesa] Cliente Supabase não encontrado.");
    return null;
}

async function carregarJogadoresDaCampanha() {
    const campanhaId = mesaState.campanha.id;

    if (!campanhaId) {
        console.warn("[Mesa Realtime] Nenhuma campanha ativa para carregar jogadores.");
        try {
            var el = document.getElementById("nome-campanha");
            if (el) el.textContent = (mesaState.campanha.nome || "Campanha") + " · sem ID";
        } catch (e) {}
        return [];
    }

    const supabase = obterSupabaseMesa();

    if (!supabase) {
        console.warn("[Mesa Realtime] Cliente Supabase não encontrado.");
        try {
            var el2 = document.getElementById("nome-campanha");
            if (el2) el2.textContent = (mesaState.campanha.nome || "Campanha") + " · sem Supabase";
        } catch (e) {}
        return [];
    }

    try {
        const { data: personagens, error } = await supabase
            .from("characters")
            .select("*")
            .eq("campaign_id", campanhaId)
            .order("slot", { ascending: true, nullsFirst: false });

        if (error) {
            console.error("[Mesa Realtime] Erro ao carregar personagens:", error);
            try {
                var el3 = document.getElementById("nome-campanha");
                if (el3) el3.textContent = (mesaState.campanha.nome || "Campanha") + " · erro";
            } catch (e) {}
            return [];
        }

        const lista = Array.isArray(personagens) ? personagens : [];

        if (window.rpgAuth) {
            window.rpgAuth.campaignCharacters = lista;
        }

        sincronizarJogadoresRealtime(lista);

        document.dispatchEvent(
            new CustomEvent("rpg:campanhaAtualizada", {
                detail: {
                    campanha: mesaState.campanha,
                    personagens: lista
                }
            })
        );

        document.dispatchEvent(
            new CustomEvent("mesa:jogadoresAtualizados", {
                detail: { personagens: lista }
            })
        );

        try {
            const el = document.getElementById("nome-campanha");
            if (el) {
                const base = (mesaState.campanha.nome || "Campanha").split(" · ")[0];
                const comSlot = lista.filter(function (p) {
                    const s = Number(p && p.slot);
                    return Number.isInteger(s) && s >= 1 && s <= 8;
                }).length;
                el.textContent = base + " · " + comSlot + " no slot";
            }
        } catch (e) {}

        return lista;
    } catch (erro) {
        console.error("[Mesa Realtime] Falha ao sincronizar jogadores:", erro);
        return [];
    }
}

function sincronizarJogadoresRealtime(personagens) {
    personagens = personagens || [];
    const lista = Array.isArray(personagens) ? personagens : [];

    const jogadores = lista
        .filter(function (personagem) {
            const slot = Number(personagem && personagem.slot);
            return (
                Number.isInteger(slot) &&
                slot >= 1 &&
                slot <= MESA_CONFIG.maxJogadores
            );
        })
        .map(function (personagem) {
            return {
                slot: Number(personagem.slot),
                ocupado: true,
                characterId: personagem.id || null,
                userId: personagem.user_id || null
            };
        });

    definirAssentos(jogadores);

    try {
        lista.forEach(function (personagem) {
            var slot = Number(personagem && personagem.slot);
            if (!Number.isInteger(slot) || slot < 1 || slot > 8) return;
            var card = document.querySelector('.player-card[data-player="' + slot + '"]');
            if (!card) return;
            card.dataset.ocupado = "true";
            card.dataset.characterId = personagem.id || "";
            card.dataset.userId = personagem.user_id || "";
            var nome = card.querySelector(".player-name");
            var raca = card.querySelector(".player-raca");
            var classe = card.querySelector(".player-classe");
            if (nome) nome.textContent = personagem.name || personagem.nome || ("Player " + slot);
            if (raca) raca.textContent = personagem.race || personagem.raca || "Raça";
            if (classe) classe.textContent = personagem.class || personagem.classe || "Classe";
        });
    } catch (e) {}

    const usuarioId = mesaState.usuario.id;

    if (usuarioId) {
        const meuPersonagem = lista.find(function (personagem) {
            return String(personagem && personagem.user_id) === String(usuarioId);
        });

        if (meuPersonagem) {
            mesaState.jogadorAtual.characterId = meuPersonagem.id || null;
            mesaState.jogadorAtual.slot = Number(meuPersonagem.slot) || null;
        } else {
            mesaState.jogadorAtual.characterId = null;
            mesaState.jogadorAtual.slot = null;
        }
    }

    console.log("[Mesa Realtime] Jogadores sincronizados:", lista);
}

async function iniciarRealtimeMesa() {
    const campanhaId = mesaState.campanha.id;

    if (!campanhaId) {
        console.warn("[Mesa Realtime] Não foi possível iniciar: campanha sem ID.");
        return;
    }

    const supabase = obterSupabaseMesa();

    if (!supabase) {
        console.warn("[Mesa Realtime] Não foi possível iniciar: Supabase não encontrado.");
        return;
    }

    if (mesaRealtimeChannel && mesaRealtimeCampaignId === String(campanhaId)) {
        return;
    }

    await pararRealtimeMesa();

    mesaRealtimeCampaignId = String(campanhaId);

    const nomeCanal = "mesa-campanha-" + campanhaId;

    console.log("[Mesa Realtime] Iniciando canal:", nomeCanal);

    mesaRealtimeChannel = supabase
        .channel(nomeCanal)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "characters",
                filter: "campaign_id=eq." + campanhaId
            },
            function (payload) {
                try {
                    console.log("[Mesa Realtime] Alteração recebida:", payload);
                    carregarJogadoresDaCampanha();
                } catch (erro) {
                    console.error("[Mesa Realtime] Erro no callback:", erro);
                }
            }
        )
        .subscribe(function (status) {
            console.log("[Mesa Realtime] Status:", status);
            if (status === "SUBSCRIBED") {
                console.log("[Mesa Realtime] Conectado à campanha:", campanhaId);
            }
        });
}

async function pararRealtimeMesa() {
    if (!mesaRealtimeChannel) {
        mesaRealtimeCampaignId = null;
        return;
    }

    const supabase = obterSupabaseMesa();

    try {
        if (supabase) {
            await supabase.removeChannel(mesaRealtimeChannel);
        }
    } catch (erro) {
        console.warn("[Mesa Realtime] Erro ao remover canal:", erro);
    }

    mesaRealtimeChannel = null;
    mesaRealtimeCampaignId = null;

    console.log("[Mesa Realtime] Canal encerrado.");
}

async function sincronizarRealtimeCampanha() {
    if (!mesaState.campanha.id) {
        try {
            var bruto = localStorage.getItem("rpg_mesa_ativa");
            if (bruto) {
                var dados = JSON.parse(bruto);
                var cid = dados.campaignId || dados.campaign_id || null;
                if (cid) {
                    mesaState.campanha.id = cid;
                    mesaState.campanha.nome =
                        dados.campaignName ||
                        dados.name ||
                        mesaState.campanha.nome ||
                        "Campanha";
                    mesaState.campanha.codigoMesa =
                        dados.campaignCode ||
                        dados.codigoMesa ||
                        mesaState.campanha.codigoMesa;
                    mesaState.campanha.masterId =
                        dados.masterId || mesaState.campanha.masterId;
                }
            }
        } catch (e) {}
    }

    if (!mesaState.campanha.id) {
        await pararRealtimeMesa();
        try {
            var el = document.getElementById("nome-campanha");
            if (el) {
                el.textContent =
                    (mesaState.campanha.nome || "Campanha") + " · sem ID";
            }
        } catch (e2) {}
        return;
    }

    await carregarJogadoresDaCampanha();
    await iniciarRealtimeMesa();
}

const MesaUI = {
    container: null,
    layout: null,
    jogadores: null,
    stage: null,
    screen: null,
    screenContent: null,
    nomeCampanha: null
};

function obterMesaSalva() {
    try {
        const salvo = localStorage.getItem("rpg_mesa_ativa");
        if (!salvo) return null;
        const dados = JSON.parse(salvo);
        if (!dados || !(dados.campaignId || dados.campaign_id)) return null;
        return dados;
    } catch (erro) {
        console.warn("[Mesa] Erro ao ler rpg_mesa_ativa:", erro);
        return null;
    }
}

function obterCampanhaAtiva() {
    if (
        window.rpgCampaign &&
        typeof window.rpgCampaign.obterCampanhaAtiva === "function"
    ) {
        try {
            const campanha = window.rpgCampaign.obterCampanhaAtiva();
            if (campanha) return campanha;
        } catch (erro) {
            console.warn("[Mesa] Erro ao obter campanha pelo campaign.js:", erro);
        }
    }

    if (window.rpgAuth && window.rpgAuth.campaign) {
        return window.rpgAuth.campaign;
    }

    const salvo = obterMesaSalva();

    if (salvo && (salvo.campaignId || salvo.campaign_id)) {
        return {
            id: salvo.campaignId || salvo.campaign_id,
            name: salvo.campaignName || salvo.name || "Campanha",
            codigo_mesa: salvo.campaignCode || salvo.codigoMesa || null,
            master_id: salvo.masterId || null
        };
    }

    return null;
}

function carregarContextoUsuario() {
    const auth = window.rpgAuth || null;
    const salvo = obterMesaSalva();
    const campanha = obterCampanhaAtiva();

    let usuarioId = null;
    let usuarioNome = null;
    let usuarioEmail = null;

    if (auth && auth.user) {
        usuarioId = auth.user.id || null;
        usuarioNome =
            (auth.user.user_metadata &&
                (auth.user.user_metadata.name ||
                    auth.user.user_metadata.full_name)) ||
            auth.user.email ||
            null;
        usuarioEmail = auth.user.email || null;
    }

    if (!usuarioId && salvo && salvo.userId) {
        usuarioId = salvo.userId;
    }

    if (!usuarioNome && salvo && salvo.userName) {
        usuarioNome = salvo.userName;
    }

    if (!usuarioEmail && salvo && salvo.userEmail) {
        usuarioEmail = salvo.userEmail;
    }

    mesaState.usuario.id = usuarioId;
    mesaState.usuario.nome = usuarioNome || "Jogador";
    mesaState.usuario.email = usuarioEmail || null;

    if (campanha) {
        mesaState.campanha.id = campanha.id || null;
        mesaState.campanha.nome =
            campanha.name || campanha.nome || "Campanha";
        mesaState.campanha.codigoMesa =
            campanha.codigo_mesa || campanha.codigoMesa || null;
        mesaState.campanha.masterId =
            campanha.master_id || campanha.masterId || null;
    }

    if (!mesaState.campanha.id && salvo) {
        mesaState.campanha.id = salvo.campaignId || salvo.campaign_id || null;
        mesaState.campanha.nome =
            salvo.campaignName ||
            salvo.name ||
            mesaState.campanha.nome ||
            "Campanha";
        mesaState.campanha.codigoMesa =
            salvo.campaignCode ||
            salvo.codigoMesa ||
            mesaState.campanha.codigoMesa;
    }

    if (!mesaState.campanha.masterId && salvo && salvo.masterId) {
        mesaState.campanha.masterId = salvo.masterId;
    }

    atualizarPermissaoUsuario();
}

function atualizarPermissaoUsuario() {
    const salvo = obterMesaSalva();
    const usuarioId = mesaState.usuario.id || (salvo && salvo.userId) || null;
    const masterId =
        mesaState.campanha.masterId || (salvo && salvo.masterId) || null;

    if (!mesaState.usuario.id && usuarioId) {
        mesaState.usuario.id = usuarioId;
    }

    if (!mesaState.campanha.masterId && masterId) {
        mesaState.campanha.masterId = masterId;
    }

    mesaState.usuario.isMaster =
        !!(usuarioId && masterId && String(usuarioId) === String(masterId));

    mesaState.usuario.isPlayer = !mesaState.usuario.isMaster && !!usuarioId;
}

function atualizarCampanhaVisual() {
    if (!MesaUI.nomeCampanha) return;
    var atual = MesaUI.nomeCampanha.textContent || "";
    var base = mesaState.campanha.nome || "Campanha";
    if (atual.indexOf(" · ") !== -1) {
        var sufixo = atual.split(" · ").slice(1).join(" · ");
        MesaUI.nomeCampanha.textContent = base + " · " + sufixo;
    } else {
        MesaUI.nomeCampanha.textContent = base;
    }
}

function atualizarAssentos() {
    if (!MesaUI.jogadores) return;

    mesaState.jogadores.forEach(function (assento) {
        const card = MesaUI.jogadores.querySelector(
            '[data-player="' + assento.slot + '"]'
        );
        if (!card) return;

        card.classList.toggle("ocupado", !!assento.ocupado);
        card.classList.toggle("vazio", !assento.ocupado);
    });
}

function definirAssentos(jogadores) {
    mesaState.jogadores = Array.from(
        { length: MESA_CONFIG.maxJogadores },
        function (_, index) {
            const jogador = (jogadores || []).find(function (item) {
                return Number(item.slot) === index + 1;
            });

            if (!jogador) {
                return {
                    slot: index + 1,
                    ocupado: false,
                    characterId: null,
                    userId: null
                };
            }

            return {
                slot: index + 1,
                ocupado: jogador.ocupado !== false,
                characterId: jogador.characterId || jogador.id || null,
                userId: jogador.userId || jogador.user_id || null
            };
        }
    );

    atualizarAssentos();

    document.dispatchEvent(
        new CustomEvent("mesa:assentosAtualizados", {
            detail: mesaState.jogadores
        })
    );
}

function atualizarModoVisual() {
    if (!MesaUI.container) return;
    MesaUI.container.dataset.modo = mesaState.modoAtual;
}

function registrarEventos() {}

function inicializarSubmodulos() {
    if (
        window.MesaJogadores &&
        typeof window.MesaJogadores.inicializar === "function"
    ) {
        try {
            window.MesaJogadores.inicializar();
        } catch (erro) {
            console.warn("[Mesa] Erro ao inicializar MesaJogadores:", erro);
        }
    }
}

function obterEstadoMesa() {
    return mesaState;
}

function usuarioEhMestre() {
    return mesaState.usuario.isMaster === true;
}

function usuarioEhJogador() {
    return mesaState.usuario.isPlayer === true;
}

function obterSlotAtual() {
    return mesaState.jogadorAtual.slot || null;
}

function obterCampanhaMesa() {
    return Object.assign({}, mesaState.campanha);
}

function sincronizarCampanha(campanha) {
    if (!campanha) return;

    mesaState.campanha.id =
        campanha.id || campanha.campaignId || mesaState.campanha.id;
    mesaState.campanha.nome =
        campanha.name || campanha.nome || mesaState.campanha.nome;
    mesaState.campanha.codigoMesa =
        campanha.codigo_mesa ||
        campanha.codigoMesa ||
        mesaState.campanha.codigoMesa;
    mesaState.campanha.masterId =
        campanha.master_id ||
        campanha.masterId ||
        mesaState.campanha.masterId;

    atualizarPermissaoUsuario();
    atualizarCampanhaVisual();

    if (mesaState.campanha.id) {
        sincronizarRealtimeCampanha();
    }
}

function selecionarJogador(slot) {
    const n = Number(slot);
    if (!Number.isInteger(n) || n < 1 || n > MESA_CONFIG.maxJogadores) {
        return;
    }

    document.dispatchEvent(
        new CustomEvent("mesa:jogadorSelecionado", {
            detail: { slot: n }
        })
    );
}

function mudarModo(modo) {
    if (!modo) return;
    mesaState.modoAtual = modo;
    atualizarModoVisual();
}

function voltarParaMesaNormal() {
    mesaState.modoAtual = MESA_CONFIG.modos.NORMAL;
    mesaState.aventura.aberta = false;
    mesaState.batalha.ativa = false;
    atualizarModoVisual();
    mostrarTelaPrincipal();
}

function mostrarTelaPrincipal() {
    if (!MesaUI.screenContent) return;
    MesaUI.screenContent.innerHTML =
        '<div class="mesa-welcome">' +
        '<div class="mesa-welcome-icon">🎲</div>' +
        "<h2>Mesa de RPG</h2>" +
        "<p>Aguardando o início da aventura...</p>" +
        "</div>";
}

function mostrarTela(conteudo) {
    if (!MesaUI.screenContent) return;
    if (typeof conteudo === "string") {
        MesaUI.screenContent.innerHTML = conteudo;
    }
}

function abrirAventura(tipo) {
    mesaState.aventura.aberta = true;
    mesaState.aventura.tipo = tipo || null;
    mesaState.modoAtual = MESA_CONFIG.modos.AVENTURA;
    atualizarModoVisual();
}

function iniciarBatalha() {
    mesaState.batalha.ativa = true;
    mesaState.modoAtual = MESA_CONFIG.modos.BATALHA;
    atualizarModoVisual();
}

function finalizarBatalha() {
    mesaState.batalha.ativa = false;
    voltarParaMesaNormal();
}

function iniciarBoss() {
    iniciarBatalha();
}

function iniciarCTE(opcoes) {
    opcoes = opcoes || {};
    if (!MESA_CONFIG.cte.disponivel) return;
    if (mesaState.cte.ativo) return;

    let tempo = Number(opcoes.tempo);
    if (!Number.isFinite(tempo) || tempo <= 0) {
        tempo = Number(opcoes.duracao);
    }
    if (!Number.isFinite(tempo) || tempo <= 0) {
        tempo = MESA_CONFIG.cte.tempoPadrao;
    }

    let quantidade = Number(opcoes.quantidade);
    if (!Number.isFinite(quantidade) || quantidade < 1) {
        quantidade = MESA_CONFIG.cte.quantidadePadrao;
    }
    quantidade = Math.floor(quantidade);

    mesaState.cte.ativo = true;
    mesaState.cte.tempo = tempo;
    mesaState.cte.quantidade = quantidade;
    mesaState.cte.cliques = 0;
    mesaState.cte.resultados = [];
    mesaState.cte.inicio = performance.now();

    if (MesaUI.screenContent) {
        MesaUI.screenContent.innerHTML =
            '<div class="mesa-cte" id="mesa-cte">' +
            "<h2>CLICK TIME EVENT</h2>" +
            '<p id="cte-instruction">Clique quando estiver pronto!</p>' +
            '<button type="button" class="mesa-cte-click" id="cte-click-button" ' +
            'data-mesa-action="cte" data-cte-action="clique">CLIQUE!</button>' +
            '<div id="cte-click-counter">0 / ' +
            quantidade +
            "</div></div>";
    }
}

function executarCliqueCTE() {
    if (!mesaState.cte.ativo) return;

    mesaState.cte.cliques += 1;

    const contador = document.getElementById("cte-click-counter");
    if (contador) {
        contador.textContent =
            mesaState.cte.cliques + " / " + mesaState.cte.quantidade;
    }

    if (mesaState.cte.cliques >= mesaState.cte.quantidade) {
        mesaState.cte.ativo = false;
        mostrarTelaPrincipal();
    }
}

function limparCTE() {
    mesaState.cte.ativo = false;
    mesaState.cte.inicio = null;
    mostrarTelaPrincipal();
}

function inicializarMesa() {
    if (mesaState.inicializado) return;

    MesaUI.container = document.getElementById("online-table-panel");
    MesaUI.layout = document.querySelector(".mesa-layout");
    MesaUI.jogadores = document.getElementById("jogadores");
    MesaUI.stage = document.getElementById("mesa-stage");
    MesaUI.screen = document.getElementById("mesa-screen");
    MesaUI.screenContent = document.getElementById("mesa-screen-content");
    MesaUI.nomeCampanha = document.getElementById("nome-campanha");

    if (!MesaUI.container) {
        console.warn("[Mesa] #online-table-panel não encontrado.");
        return;
    }

    carregarContextoUsuario();

    mesaState.inicializado = true;

    registrarEventos();
    atualizarCampanhaVisual();
    atualizarModoVisual();
    atualizarAssentos();
    inicializarSubmodulos();

    setTimeout(function () {
        sincronizarRealtimeCampanha();
    }, 0);

    setTimeout(function () {
        carregarContextoUsuario();
        sincronizarRealtimeCampanha();
    }, 800);

    setTimeout(function () {
        sincronizarRealtimeCampanha();
    }, 2000);

    document.dispatchEvent(
        new CustomEvent("mesa:inicializada", {
            detail: mesaState
        })
    );

    console.log("[Mesa] Mesa RPG inicializada.", {
        usuario: mesaState.usuario,
        campanha: mesaState.campanha,
        mestre: mesaState.usuario.isMaster
    });
}

window.MesaRPG = {
    estado: obterEstadoMesa,
    campanha: obterCampanhaMesa,
    sincronizarCampanha: sincronizarCampanha,
    usuarioEhMestre: usuarioEhMestre,
    usuarioEhJogador: usuarioEhJogador,
    obterSlotAtual: obterSlotAtual,
    selecionarJogador: selecionarJogador,
    definirAssentos: definirAssentos,
    atualizarAssentos: atualizarAssentos,
    mudarModo: mudarModo,
    voltarParaMesaNormal: voltarParaMesaNormal,
    abrirAventura: abrirAventura,
    iniciarBatalha: iniciarBatalha,
    finalizarBatalha: finalizarBatalha,
    iniciarBoss: iniciarBoss,
    iniciarCTE: iniciarCTE,
    executarCliqueCTE: executarCliqueCTE,
    limparCTE: limparCTE,
    mostrarTela: mostrarTela,
    mostrarTelaPrincipal: mostrarTelaPrincipal,
    carregarJogadoresDaCampanha: carregarJogadoresDaCampanha,
    iniciarRealtimeMesa: iniciarRealtimeMesa,
    pararRealtimeMesa: pararRealtimeMesa,
    sincronizarRealtimeCampanha: sincronizarRealtimeCampanha
};

window.inicializarMesa = inicializarMesa;
window.obterEstadoMesa = obterEstadoMesa;
window.carregarJogadoresDaCampanha = carregarJogadoresDaCampanha;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarMesa);
} else {
    inicializarMesa();
}
