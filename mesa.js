"use strict";

/*
==============================================================
 MESA RPG ONLINE
 CORE / ORQUESTRADOR
==============================================================

 RESPONSABILIDADES:

 - Inicializar a mesa
 - Identificar campanha ativa
 - Identificar Mestre / Jogador
 - Controlar o modo atual
 - Controlar a área central
 - Encaminhar ações de aventura
 - Controlar CTE
 - Manter os 8 lugares
 - Sincronizar campanha
 - Processar interações
 - Conversar com mesa-jogadores.js
 - Conversar com mesa-aventura.js

 IMPORTANTE:

 A Mesa pode ser aberta sem auth.js/campaign.js carregados
 diretamente no mesa.html.

 Por isso, o CORE também recupera o contexto salvo em:

     rpg_mesa_ativa

 Esse registro contém:

     campaignId
     userId
     masterId
     characterId
     slot

 A identificação do Mestre é feita principalmente por:

     usuario.id === campanha.master_id

==============================================================
*/


/* ============================================================
   CONFIGURAÇÃO
============================================================ */

const MESA_CONFIG = {

    maxJogadores: 8,

    modos: {

        NORMAL: "normal",

        AVENTURA: "aventura",

        BATALHA: "batalha"

    },

    cte: {

        disponivel: true,

        dificuldades: {

            facil: 3000,

            normal: 2000,

            dificil: 1000,

            extremo: 500

        },

        dificuldadePadrao: "normal",

        quantidadePadrao: 1

    }

};


/* ============================================================
   ESTADO CENTRAL
============================================================ */

const mesaState = {

    inicializado: false,

    modoAtual:
        MESA_CONFIG.modos.NORMAL,


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


    jogadores:

        Array.from(

            {
                length:
                    MESA_CONFIG.maxJogadores
            },

            (_, index) => ({

                slot:
                    index + 1,

                ocupado:
                    false,

                characterId:
                    null,

                userId:
                    null

            })

        ),


    aventura: {

        aberta:
            false,

        tipo:
            null,

        dados:
            null

    },


    batalha: {

        ativa:
            false,

        rodada:
            0,

        turno:
            null,

        participantes:
            []

    },


    cte: {

        ativo:
            false,

        dificuldade:
            MESA_CONFIG.cte.dificuldadePadrao,

        duracao:
            MESA_CONFIG.cte.dificuldades.normal,

        quantidade:
            MESA_CONFIG.cte.quantidadePadrao,

        resultados:
            [],

        inicio:
            null

    }

};


/* ============================================================
   REFERÊNCIAS DA INTERFACE
============================================================ */

const MesaUI = {

    container:
        null,

    layout:
        null,

    jogadores:
        null,

    stage:
        null,

    screen:
        null,

    screenContent:
        null,

    nomeCampanha:
        null

};


/* ============================================================
   LER MESA SALVA
============================================================ */

function obterMesaSalva() {

    try {

        const salvo =
            localStorage.getItem(
                "rpg_mesa_ativa"
            );


        if (!salvo) {

            return null;

        }


        const dados =
            JSON.parse(
                salvo
            );


        if (
            !dados ||
            !dados.campaignId
        ) {

            return null;

        }


        return dados;

    } catch (erro) {

        console.warn(
            "[Mesa] Erro ao ler rpg_mesa_ativa:",
            erro
        );

        return null;

    }

}


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

function inicializarMesa() {

    if (
        mesaState.inicializado
    ) {

        return;

    }


    MesaUI.container =
        document.getElementById(
            "online-table-panel"
        );


    MesaUI.layout =
        document.querySelector(
            ".mesa-layout"
        );


    MesaUI.jogadores =
        document.getElementById(
            "jogadores"
        );


    MesaUI.stage =
        document.getElementById(
            "mesa-stage"
        );


    MesaUI.screen =
        document.getElementById(
            "mesa-screen"
        );


    MesaUI.screenContent =
        document.getElementById(
            "mesa-screen-content"
        );


    MesaUI.nomeCampanha =
        document.getElementById(
            "nome-campanha"
        );


    if (!MesaUI.container) {

        console.warn(
            "[Mesa] #online-table-panel não encontrado."
        );

        return;

    }


    /*
     IMPORTANTE:

     O contexto é carregado ANTES de definir
     o visual da Mesa.
    */

    carregarContextoUsuario();


    mesaState.inicializado =
        true;


    registrarEventos();

    atualizarCampanhaVisual();

    atualizarModoVisual();

    atualizarAssentos();

    inicializarSubmodulos();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:inicializada",
            {
                detail:
                    mesaState
            }
        )

    );


    console.log(
        "[Mesa] Mesa RPG inicializada.",
        {
            usuario:
                mesaState.usuario,

            campanha:
                mesaState.campanha,

            mestre:
                mesaState.usuario.isMaster
        }
    );

}


/* ============================================================
   CONTEXTO DO USUÁRIO
============================================================ */

function carregarContextoUsuario() {

    const auth =
        window.rpgAuth || null;


    const salvo =
        obterMesaSalva();


    const campanha =
        obterCampanhaAtiva();


    /* ========================================================
       USUÁRIO
    ======================================================== */

    let usuarioId =
        null;

    let usuarioNome =
        null;

    let usuarioEmail =
        null;


    /*
     Primeiro tenta auth.js.
    */

    if (
        auth?.user
    ) {

        usuarioId =
            auth.user.id ||
            null;


        usuarioNome =

            auth.user.user_metadata?.name ||

            auth.user.user_metadata?.full_name ||

            auth.user.email ||

            null;


        usuarioEmail =
            auth.user.email ||
            null;

    }


    /*
     Se auth.js não estiver carregado no mesa.html,
     recuperamos o usuário salvo pela entrada.
    */

    if (
        !usuarioId &&
        salvo?.userId
    ) {

        usuarioId =
            salvo.userId;

    }


    if (
        !usuarioNome &&
        salvo?.userName
    ) {

        usuarioNome =
            salvo.userName;

    }


    if (
        !usuarioEmail &&
        salvo?.userEmail
    ) {

        usuarioEmail =
            salvo.userEmail;

    }


    mesaState.usuario.id =
        usuarioId;


    mesaState.usuario.nome =
        usuarioNome ||
        "Jogador";


    mesaState.usuario.email =
        usuarioEmail ||
        null;


    /* ========================================================
       CAMPANHA
    ======================================================== */

    if (campanha) {

        mesaState.campanha.id =
            campanha.id ||
            null;


        mesaState.campanha.nome =

            campanha.name ||

            campanha.nome ||

            "Campanha";


        mesaState.campanha.codigoMesa =

            campanha.codigo_mesa ||

            campanha.codigoMesa ||

            null;


        mesaState.campanha.masterId =

            campanha.master_id ||

            campanha.masterId ||

            null;

    }


    /*
     Se a campanha veio do localStorage,
     o masterId também está salvo lá.
    */

    if (
        !mesaState.campanha.masterId &&
        salvo?.masterId
    ) {

        mesaState.campanha.masterId =
            salvo.masterId;

    }


    /* ========================================================
       IDENTIFICAÇÃO DO MESTRE
    ======================================================== */

    atualizarPermissaoUsuario();


    /* ========================================================
       PERSONAGEM / SLOT
    ======================================================== */

    descobrirJogadorAtual();

}


/* ============================================================
   ATUALIZAR PERMISSÃO
============================================================ */

function atualizarPermissaoUsuario() {

    const usuarioId =
        mesaState.usuario.id;


    const masterId =
        mesaState.campanha.masterId;


    /*
     REGRA PRINCIPAL:

     O Mestre é definido pela igualdade entre:

         auth.users.id
                +
         campaigns.master_id
    */

    const mestrePorCampanha =
        Boolean(

            usuarioId &&

            masterId &&

            String(usuarioId).trim().toLowerCase() ===

            String(masterId).trim().toLowerCase()

        );


    /*
     Compatibilidade com auth.js.
    */

    const mestrePorAuth =
        Boolean(
            window.rpgAuth?.isMaster === true
        );


    /*
     Compatibilidade com sistemas antigos.
    */

    let mestrePorInterface =
        false;


    if (
        typeof window.usuarioEhMestreInterface ===
        "function"
    ) {

        try {

            mestrePorInterface =
                window.usuarioEhMestreInterface() ===
                true;

        } catch (erro) {

            console.warn(
                "[Mesa] Falha ao verificar mestre pela interface:",
                erro
            );

        }

    }


    /*
     O ID da campanha tem prioridade.

     Se o UID do usuário for exatamente o
     master_id, é Mestre.

     Isso funciona mesmo se auth.js não estiver
     carregado no mesa.html.
    */

    mesaState.usuario.isMaster =

        mestrePorCampanha ||

        mestrePorAuth ||

        mestrePorInterface;


    mesaState.usuario.isPlayer =

        Boolean(
            usuarioId
        ) &&

        !mesaState.usuario.isMaster;


    /*
     Se descobrimos Mestre pelo banco/localStorage,
     corrigimos também o estado do auth, quando
     ele existir.
    */

    if (
        window.rpgAuth
    ) {

        window.rpgAuth.isMaster =
            mesaState.usuario.isMaster;

    }


    console.log(
        "[Mesa] Permissão determinada:",
        {

            usuarioId,

            masterId,

            mestrePorCampanha,

            mestrePorAuth,

            mestrePorInterface,

            isMaster:
                mesaState.usuario.isMaster,

            isPlayer:
                mesaState.usuario.isPlayer

        }
    );

}


/* ============================================================
   CAMPANHA ATIVA
============================================================ */

function obterCampanhaAtiva() {

    /*
     1. campaign.js
    */

    if (

        window.rpgCampaign &&

        typeof window.rpgCampaign.obterCampanhaAtiva ===
        "function"

    ) {

        try {

            const campanha =
                window.rpgCampaign
                    .obterCampanhaAtiva();


            if (campanha) {

                return campanha;

            }

        } catch (erro) {

            console.warn(
                "[Mesa] Erro ao obter campanha pelo campaign.js:",
                erro
            );

        }

    }


    /*
     2. auth.js
    */

    if (
        window.rpgAuth?.campaign
    ) {

        return window.rpgAuth.campaign;

    }


    /*
     3. localStorage

     Esse é o caminho principal quando
     mesa.html é aberto diretamente.
    */

    const salvo =
        obterMesaSalva();


    if (
        salvo?.campaignId
    ) {

        return {

            id:
                salvo.campaignId,

            name:
                salvo.campaignName ||

                salvo.name ||

                "Campanha",

            codigo_mesa:

                salvo.campaignCode ||

                salvo.codigoMesa ||

                null,

            master_id:

                salvo.masterId ||

                salvo.master_id ||

                null

        };

    }


    return null;

}


/* ============================================================
   DESCOBRIR JOGADOR ATUAL
============================================================ */

function descobrirJogadorAtual() {

    const salvo =
        obterMesaSalva();


    /*
     Primeiro: dados salvos pela entrada.
    */

    if (salvo) {

        mesaState.jogadorAtual.characterId =

            salvo.characterId ||

            null;


        mesaState.jogadorAtual.slot =

            Number(salvo.slot) ||

            null;

    }


    /*
     Segundo: auth.js.
    */

    if (

        !mesaState.jogadorAtual.characterId &&

        window.rpgAuth

    ) {

        const personagem =

            window.rpgAuth.currentCharacter ||

            window.rpgAuth.campaignCharacter ||

            null;


        if (personagem) {

            mesaState.jogadorAtual.characterId =

                personagem.id ||

                null;


            mesaState.jogadorAtual.slot =

                Number(
                    personagem.slot
                ) ||

                null;

        }

    }


    /*
     Terceiro: personagens da campanha.
    */

    if (

        !mesaState.jogadorAtual.characterId &&

        Array.isArray(
            window.rpgAuth?.campaignCharacters
        )

    ) {

        const usuarioId =
            mesaState.usuario.id;


        const personagem =

            window.rpgAuth
                .campaignCharacters
                .find(

                    character =>

                        String(
                            character.user_id
                        ) ===

                        String(
                            usuarioId
                        )

                );


        if (personagem) {

            mesaState.jogadorAtual.characterId =

                personagem.id ||

                null;


            mesaState.jogadorAtual.slot =

                Number(
                    personagem.slot
                ) ||

                null;

        }

    }

}


/* ============================================================
   EVENTOS
============================================================ */

function registrarEventos() {

    document.addEventListener(

        "mesa:jogadorAtualizado",

        event => {

            if (
                event.detail?.slot
            ) {

                atualizarAssento(

                    event.detail.slot,

                    event.detail

                );

            }

        }

    );


    document.addEventListener(

        "mesa:jogadoresAtualizados",

        () => {

            atualizarAssentos();

        }

    );


    document.addEventListener(

        "mesa:campanhaAlterada",

        event => {

            /*
             campaign.js pode disparar:

                 detail: campanha

             ou:

                 detail: {
                     campanha: campanha
                 }

             Aceitamos os dois.
            */

            const detalhe =
                event.detail || null;


            const campanha =

                detalhe?.campanha ||

                detalhe?.campaign ||

                detalhe;


            if (campanha) {

                sincronizarCampanha(
                    campanha
                );

            }

        }

    );

}


/* ============================================================
   SINCRONIZAR CAMPANHA
============================================================ */

function sincronizarCampanha(
    campanha
) {

    if (!campanha) {

        return;

    }


    mesaState.campanha.id =

        campanha.id ||

        mesaState.campanha.id;


    mesaState.campanha.nome =

        campanha.name ||

        campanha.nome ||

        mesaState.campanha.nome;


    mesaState.campanha.codigoMesa =

        campanha.codigo_mesa ||

        campanha.codigoMesa ||

        mesaState.campanha.codigoMesa;


    mesaState.campanha.masterId =

        campanha.master_id ||

        campanha.masterId ||

        mesaState.campanha.masterId;


    /*
     Recalcula Mestre/Jogador depois
     da campanha ser atualizada.
    */

    atualizarPermissaoUsuario();


    atualizarCampanhaVisual();

}


/* ============================================================
   SELECIONAR JOGADOR
============================================================ */

function selecionarJogador(
    slot
) {

    const numeroSlot =
        Number(slot);


    if (

        !numeroSlot ||

        numeroSlot < 1 ||

        numeroSlot >
            MESA_CONFIG.maxJogadores

    ) {

        return;

    }


    const jogador =
        mesaState.jogadores[
            numeroSlot - 1
        ];


    if (!jogador) {

        return;

    }


    const slotAtual =
        Number(
            mesaState.jogadorAtual.slot
        );


    const ehProprioJogador =
        slotAtual ===
        numeroSlot;


    document.dispatchEvent(

        new CustomEvent(
            "mesa:jogadorSelecionado",
            {

                detail: {

                    slot:
                        numeroSlot,

                    jogador,

                    ehProprioJogador

                }

            }

        )

    );


    if (ehProprioJogador) {

        if (

            typeof window.abrirFichaJogador ===
            "function"

        ) {

            window.abrirFichaJogador(
                numeroSlot
            );

        }

        return;

    }


    document.dispatchEvent(

        new CustomEvent(
            "mesa:interacaoJogador",
            {

                detail: {

                    origem:
                        slotAtual,

                    alvo:
                        numeroSlot

                }

            }

        )

    );

}


/* ============================================================
   MODO
============================================================ */

function mudarModo(
    modo
) {

    if (

        !Object.values(
            MESA_CONFIG.modos
        ).includes(modo)

    ) {

        console.warn(
            "[Mesa] Modo inválido:",
            modo
        );

        return;

    }


    mesaState.modoAtual =
        modo;


    atualizarModoVisual();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:modoAlterado",
            {

                detail: {

                    modo,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   VISUAL DO MODO
============================================================ */

function atualizarModoVisual() {

    if (!MesaUI.container) {

        return;

    }


    MesaUI.container.dataset.modo =
        mesaState.modoAtual;


    MesaUI.container.classList.remove(

        "modo-normal",

        "modo-aventura",

        "modo-batalha"

    );


    MesaUI.container.classList.add(

        `modo-${mesaState.modoAtual}`

    );

}


/* ============================================================
   MESA NORMAL
============================================================ */

function voltarParaMesaNormal() {

    mesaState.modoAtual =
        MESA_CONFIG.modos.NORMAL;


    mesaState.aventura.aberta =
        false;


    mesaState.aventura.tipo =
        null;


    atualizarModoVisual();

    mostrarTelaPrincipal();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:modoNormal",
            {

                detail:
                    mesaState

            }

        )

    );

}


/* ============================================================
   AVENTURA
============================================================ */

function abrirAventura(
    tipo,
    dados = {}
) {

    mesaState.aventura.aberta =
        true;


    mesaState.aventura.tipo =
        tipo;


    mesaState.aventura.dados =
        dados;


    mudarModo(
        MESA_CONFIG.modos.AVENTURA
    );


    mostrarTela(
        "🎲 Preparando aventura..."
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:aventuraAberta",
            {

                detail: {

                    tipo,

                    dados,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        window.MesaAventura &&

        typeof window.MesaAventura.abrir ===
        "function"

    ) {

        window.MesaAventura.abrir(

            tipo,

            dados

        );

    }

}


/* ============================================================
   BATALHA
============================================================ */

function iniciarBatalha(
    participantes = null
) {

    mesaState.batalha.ativa =
        true;


    mesaState.batalha.rodada =
        1;


    mesaState.batalha.turno =
        null;


    if (
        Array.isArray(
            participantes
        )
    ) {

        mesaState.batalha.participantes =
            participantes;

    } else {

        mesaState.batalha.participantes =

            mesaState.jogadores

                .filter(
                    jogador =>
                        jogador.ocupado
                )

                .map(
                    jogador =>
                        jogador.slot
                );

    }


    mudarModo(
        MESA_CONFIG.modos.BATALHA
    );


    mostrarTela(
        "⚔️ Preparando combate..."
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:batalhaIniciada",
            {

                detail: {

                    participantes:

                        mesaState.batalha
                            .participantes,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        typeof window.inicializarMesaBatalha ===
        "function"

    ) {

        window.inicializarMesaBatalha(
            mesaState
        );

    }


    return mesaState.batalha;

}


/* ============================================================
   FINALIZAR BATALHA
============================================================ */

function finalizarBatalha(
    resultado = null
) {

    mesaState.batalha.ativa =
        false;


    mesaState.batalha.turno =
        null;


    mesaState.batalha.rodada =
        0;


    document.dispatchEvent(

        new CustomEvent(
            "mesa:batalhaFinalizada",
            {

                detail: {

                    resultado,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        typeof window.restaurarMesaBatalha ===
        "function"

    ) {

        window.restaurarMesaBatalha();

    }


    voltarParaMesaNormal();

}


/* ============================================================
   BOSS
============================================================ */

function iniciarBoss(
    dados = {}
) {

    mesaState.aventura.aberta =
        true;


    mesaState.aventura.tipo =
        "boss";


    mesaState.aventura.dados =
        dados;


    mudarModo(
        MESA_CONFIG.modos.AVENTURA
    );


    mostrarTela(
        "👹 Um Boss está se aproximando..."
    );


    document.dispatchEvent(

        new CustomEvent(
            "mesa:bossIniciado",
            {

                detail: {

                    dados,

                    estado:
                        mesaState

                }

            }

        )

    );


    if (

        window.MesaAventura &&

        typeof window.MesaAventura.boss ===
        "function"

    ) {

        window.MesaAventura.boss(
            dados
        );

    }

}


/* ============================================================
   CTE
============================================================ */

function iniciarCTE(
    opcoes = {}
) {

    if (
        mesaState.cte.ativo
    ) {

        return;

    }


    const dificuldade =

        opcoes.dificuldade ||

        MESA_CONFIG.cte
            .dificuldadePadrao;


    const duracao =

        opcoes.duracao ||

        MESA_CONFIG.cte
            .dificuldades[
                dificuldade
            ] ||

        MESA_CONFIG.cte
            .dificuldades.normal;


    const quantidade =

        Number(

            opcoes.quantidade ||

            MESA_CONFIG.cte
                .quantidadePadrao

        );


    mesaState.cte.ativo =
        true;


    mesaState.cte.dificuldade =
        dificuldade;


    mesaState.cte.duracao =
        duracao;


    mesaState.cte.quantidade =
        quantidade;


    mesaState.cte.resultados =
        [];


    mesaState.cte.inicio =
        Date.now();


    criarOverlayCTE();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteIniciado",
            {

                detail: {

                    dificuldade,

                    duracao,

                    quantidade,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   OVERLAY CTE
============================================================ */

function criarOverlayCTE() {

    if (!MesaUI.screen) {

        return;

    }


    const anterior =
        document.getElementById(
            "cte-overlay"
        );


    if (anterior) {

        anterior.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "cte-overlay";


    overlay.className =
        "cte-overlay";


    overlay.innerHTML = `

        <div class="cte-panel">

            <div class="cte-header">

                <span class="cte-icon">
                    ⚡
                </span>

                <h2>
                    CTE
                </h2>

            </div>

            <p class="cte-instruction">
                Prepare-se...
            </p>

            <div class="cte-timer">

                <span id="cte-timer-value">
                    0
                </span>

            </div>

            <div class="cte-progress">

                <div
                    id="cte-progress-bar"
                    class="cte-progress-bar">
                </div>

            </div>

        </div>

    `;


    MesaUI.screen.appendChild(
        overlay
    );


    executarContagemCTE(
        overlay
    );

}


/* ============================================================
   CONTAGEM CTE
============================================================ */

function executarContagemCTE(
    overlay
) {

    const timer =
        overlay.querySelector(
            "#cte-timer-value"
        );


    const progress =
        overlay.querySelector(
            "#cte-progress-bar"
        );


    const inicio =
        Date.now();


    const duracao =
        mesaState.cte.duracao;


    let frameId =
        null;


    function atualizar() {

        if (
            !mesaState.cte.ativo
        ) {

            if (frameId) {

                cancelAnimationFrame(
                    frameId
                );

            }

            return;

        }


        const decorrido =
            Date.now() -
            inicio;


        const restante =
            Math.max(

                0,

                duracao -
                decorrido

            );


        const percentual =
            Math.min(

                100,

                (
                    decorrido /
                    duracao
                ) * 100

            );


        if (timer) {

            timer.textContent =

                (
                    restante /
                    1000

                ).toFixed(1);

        }


        if (progress) {

            progress.style.width =
                `${percentual}%`;

        }


        if (
            restante <= 0
        ) {

            mostrarResultadoCTE();

            return;

        }


        frameId =
            requestAnimationFrame(
                atualizar
            );

    }


    atualizar();

}


/* ============================================================
   RESULTADO CTE
============================================================ */

function mostrarResultadoCTE() {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    const resultado = {

        sucesso:
            true,

        dificuldade:
            mesaState.cte.dificuldade,

        timestamp:
            Date.now()

    };


    mesaState.cte.resultados.push(
        resultado
    );


    const overlay =
        document.getElementById(
            "cte-overlay"
        );


    if (!overlay) {

        limparCTE();

        return;

    }


    overlay.innerHTML = `

        <div class="cte-panel cte-result">

            <div class="cte-result-icon">
                ✨
            </div>

            <h2>
                CTE CONCLUÍDO
            </h2>

            <p>
                A ação foi processada.
            </p>

        </div>

    `;


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteResultado",
            {

                detail: {

                    resultado,

                    estado:
                        mesaState

                }

            }

        )

    );


    setTimeout(
        limparCTE,
        1500
    );

}


/* ============================================================
   LIMPAR CTE
============================================================ */

function limparCTE() {

    mesaState.cte.ativo =
        false;


    const overlay =
        document.getElementById(
            "cte-overlay"
        );


    if (overlay) {

        overlay.remove();

    }


    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteFinalizado",
            {

                detail: {

                    resultados:
                        mesaState.cte.resultados,

                    estado:
                        mesaState

                }

            }

        )

    );

}


/* ============================================================
   TELA PRINCIPAL
============================================================ */

function mostrarTelaPrincipal() {

    if (!MesaUI.screenContent) {

        return;

    }


    MesaUI.screenContent.innerHTML = `

        <div class="mesa-welcome">

            <div class="mesa-welcome-icon">
                🎲
            </div>

            <h2>
                Mesa de RPG
            </h2>

            <p>
                Aguardando o início da aventura...
            </p>

        </div>

    `;

}


/* ============================================================
   MOSTRAR TELA
============================================================ */

function mostrarTela(
    conteudo
) {

    if (!MesaUI.screenContent) {

        return;

    }


    if (
        typeof conteudo ===
        "string"
    ) {

        MesaUI.screenContent.innerHTML = `

            <div class="mesa-screen-message">

                ${conteudo}

            </div>

        `;

        return;

    }


    if (
        conteudo instanceof HTMLElement
    ) {

        MesaUI.screenContent.innerHTML =
            "";

        MesaUI.screenContent.appendChild(
            conteudo
        );

    }

}


/* ============================================================
   ASSENTOS
============================================================ */

function atualizarAssentos() {

    if (!MesaUI.jogadores) {

        return;

    }


    const cards =
        Array.from(

            MesaUI.jogadores
                .querySelectorAll(
                    "[data-player]"
                )

        );


    cards.forEach(

        card => {

            const slot =
                Number(
                    card.dataset.player
                );


            const assento =
                mesaState.jogadores[
                    slot - 1
                ];


            if (!assento) {

                return;

            }


            atualizarAssento(
                slot,
                assento
            );

        }

    );

}


/* ============================================================
   ATUALIZAR ASSENTO
============================================================ */

function atualizarAssento(
    slot,
    dados = {}
) {

    const card =
        MesaUI.jogadores?.querySelector(

            `[data-player="${slot}"]`

        );


    if (!card) {

        return;

    }


    const assento =
        mesaState.jogadores[
            Number(slot) - 1
        ];


    if (!assento) {

        return;

    }


    if (
        typeof dados.ocupado !==
        "undefined"
    ) {

        assento.ocupado =
            Boolean(
                dados.ocupado
            );

    }


    if (
        dados.characterId
    ) {

        assento.characterId =
            dados.characterId;

    }


    if (
        dados.userId
    ) {

        assento.userId =
            dados.userId;

    }


    card.classList.toggle(
        "ocupado",
        assento.ocupado
    );


    card.classList.toggle(
        "vazio",
        !assento.ocupado
    );

}


/* ============================================================
   CAMPANHA VISUAL
============================================================ */

function atualizarCampanhaVisual() {

    if (!MesaUI.nomeCampanha) {

        return;

    }


    MesaUI.nomeCampanha.textContent =

        mesaState.campanha.nome ||

        "Campanha";

}


/* ============================================================
   DEFINIR ASSENTOS
============================================================ */

function definirAssentos(
    jogadores = []
) {

    mesaState.jogadores =

        Array.from(

            {
                length:
                    MESA_CONFIG.maxJogadores
            },

            (_, index) => {

                const jogador =

                    jogadores.find(

                        item =>

                            Number(
                                item.slot
                            ) ===
                            index + 1

                    );


                if (!jogador) {

                    return {

                        slot:
                            index + 1,

                        ocupado:
                            false,

                        characterId:
                            null,

                        userId:
                            null

                    };

                }


                return {

                    slot:
                        index + 1,

                    ocupado:
                        true,

                    characterId:

                        jogador.characterId ||

                        jogador.id ||

                        null,

                    userId:

                        jogador.userId ||

                        jogador.user_id ||

                        null

                };

            }

        );


    atualizarAssentos();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:assentosAtualizados",
            {

                detail:
                    mesaState.jogadores

            }

        )

    );

}


/* ============================================================
   RESET VISUAL
============================================================ */

function resetarMesaVisual() {

    voltarParaMesaNormal();

    atualizarCampanhaVisual();

    atualizarAssentos();

}


/* ============================================================
   API PÚBLICA
============================================================ */

window.MesaRPG = {

    estado:
        obterEstadoMesa,

    campanha:
        obterCampanhaMesa,

    sincronizarCampanha,

    usuarioEhMestre,

    usuarioEhJogador,

    obterSlotAtual,

    selecionarJogador,

    definirAssentos,

    atualizarAssentos,

    mudarModo,

    voltarParaMesaNormal,

    abrirAventura,

    iniciarBatalha,

    finalizarBatalha,

    iniciarBoss,

    iniciarCTE,

    limparCTE,

    mostrarTela,

    mostrarTelaPrincipal,

    resetarMesaVisual

};


/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */

function obterEstadoMesa() {

    return mesaState;

}


function usuarioEhMestre() {

    return (
        mesaState.usuario.isMaster ===
        true
    );

}


function usuarioEhJogador() {

    return (
        mesaState.usuario.isPlayer ===
        true
    );

}


function obterSlotAtual() {

    return (

        mesaState.jogadorAtual.slot ||

        null

    );

}


function obterCampanhaMesa() {

    return {

        ...mesaState.campanha

    };

}


/* ============================================================
   COMPATIBILIDADE GLOBAL
============================================================ */

window.inicializarMesa =
    inicializarMesa;


window.mudarModoMesa =
    mudarModo;


window.abrirMesaAventura =
    abrirAventura;


window.iniciarMesaBatalha =
    iniciarBatalha;


window.finalizarMesaBatalha =
    finalizarBatalha;


window.iniciarMesaBoss =
    iniciarBoss;


window.iniciarMesaCTE =
    iniciarCTE;


window.limparMesaCTE =
    limparCTE;


window.obterEstadoMesa =
    obterEstadoMesa;


window.usuarioEhMestreMesa =
    usuarioEhMestre;


window.usuarioEhJogadorMesa =
    usuarioEhJogador;


/* ============================================================
   DOM READY
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(

        "DOMContentLoaded",

        inicializarMesa

    );

} else {

    inicializarMesa();

}
