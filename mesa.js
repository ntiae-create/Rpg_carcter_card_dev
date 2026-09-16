/* ============================================================
   MESA RPG ONLINE
   mesa.js
   NÚCLEO PRINCIPAL DA MESA
============================================================ */

"use strict";


/* ============================================================
   CONFIGURAÇÃO PRINCIPAL
============================================================ */

const MESA_CONFIG = {

    maxJogadores: 8,

    modos: {
        NORMAL: "normal",
        AVENTURA: "aventura",
        BATALHA: "batalha"
    },

    /* -----------------------------------------
       CONFIGURAÇÃO DO CTE
    ----------------------------------------- */

    cte: {

        disponivel: true,

        /*
            Tempo padrão do CTE.

            2000 = 2 segundos
        */

        duracoes: {

            facil: 3000,

            normal: 2000,

            dificil: 1000,

            extremo: 500

        },

        dificuldadePadrao: "normal",

        /*
            Quantidade de alvos.
            Por enquanto 1.

            Futuramente podemos ter:
            1 alvo
            3 alvos
            sequência
            etc.
        */

        quantidadeAlvos: 1

    }

};


/* ============================================================
   ESTADO DA MESA
============================================================ */

const mesaState = {

    /* -----------------------------------------
       MODO ATUAL
    ----------------------------------------- */

    modoAtual:
        MESA_CONFIG.modos.NORMAL,


    /* -----------------------------------------
       CAMPANHA
    ----------------------------------------- */

    campanha: {

        id: null,

        nome: "Campanha"

    },


    /* -----------------------------------------
       CTE
    ----------------------------------------- */

    cte: {

        ativo: false,

        id: null,

        dificuldade:
            MESA_CONFIG.cte.dificuldadePadrao,

        duracao: 2000,

        iniciadoEm: null,

        encerradoEm: null,

        alvo: null,

        resultado: null,

        jogadorAlvo: null,

        dados: null

    },


    /* -----------------------------------------
       BATALHA
    ----------------------------------------- */

    batalha: {

        ativa: false,

        id: null,

        dados: null

    },


    /* -----------------------------------------
       AVENTURA
    ----------------------------------------- */

    aventura: {

        ativa: false,

        tipo: null,

        dados: null

    },


    /* -----------------------------------------
       JOGADORES
    ----------------------------------------- */

    jogadores: Array.from(
        {
            length:
                MESA_CONFIG.maxJogadores
        },
        (_, index) => {

            return {

                id: index + 1,

                nome:
                    `Player ${index + 1}`,

                conectado: false,

                avatar: null,

                raca: null,

                classe: null,


                hp: {

                    atual: 100,

                    maximo: 100

                },


                mana: {

                    atual: 100,

                    maximo: 100

                },


                status: [],


                fome: 100,

                sede: 100,


                habilidades: [],


                passiva: null,

                passivaClasse: null,


                inventario: [],


                emBatalha: false

            };

        }
    )

};


/* ============================================================
   REFERÊNCIAS DA INTERFACE
============================================================ */

const MesaUI = {

    container: null,

    layout: null,

    jogadores: null,

    stage: null,

    screen: null,

    screenContent: null,

    settingsButton: null,

    masterMenu: null,

    masterButtons: [],

    nomeCampanha: null

};


/* ============================================================
   TIMER INTERNO DO CTE
============================================================ */

let cteTimer = null;

let cteAnimationFrame = null;


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarMesa();

    }
);


function inicializarMesa() {

    obterElementos();

    registrarEventos();

    atualizarNomeCampanha();

    atualizarModoVisual();

    atualizarCardsIniciais();

    console.log(
        "🎲 Mesa RPG inicializada.",
        mesaState
    );

}


/* ============================================================
   ELEMENTOS DA INTERFACE
============================================================ */

function obterElementos() {

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


    MesaUI.settingsButton =
        document.getElementById(
            "btn-configuracoes"
        );


    MesaUI.masterMenu =
        document.getElementById(
            "master-menu"
        );


    MesaUI.nomeCampanha =
        document.getElementById(
            "nome-campanha"
        );


    MesaUI.masterButtons =
        Array.from(
            document.querySelectorAll(
                "[data-master-action]"
            )
        );

}


/* ============================================================
   EVENTOS
============================================================ */

function registrarEventos() {


    /* -----------------------------------------
       BOTÃO DO MESTRE
    ----------------------------------------- */

    if (MesaUI.settingsButton) {

        MesaUI.settingsButton.addEventListener(
            "click",
            alternarMenuMestre
        );

    }


    /* -----------------------------------------
       BOTÕES DO MENU DO MESTRE
    ----------------------------------------- */

    MesaUI.masterButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const acao =
                        button.dataset.masterAction;

                    executarAcaoMestre(
                        acao
                    );

                }
            );

        }
    );


    /* -----------------------------------------
       CLICAR FORA DO MENU
    ----------------------------------------- */

    if (MesaUI.masterMenu) {

        MesaUI.masterMenu.addEventListener(
            "click",
            evento => {

                if (
                    evento.target ===
                    MesaUI.masterMenu
                ) {

                    fecharMenuMestre();

                }

            }
        );

    }


    /* -----------------------------------------
       ESC
    ----------------------------------------- */

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Escape"
            ) {

                fecharMenuMestre();

            }

        }
    );


    /* -----------------------------------------
       CARDS DOS JOGADORES
    ----------------------------------------- */

    const cards =
        document.querySelectorAll(
            ".player-card"
        );


    cards.forEach(
        card => {

            card.addEventListener(
                "click",
                () => {

                    const playerId =
                        Number(
                            card.dataset.player
                        );


                    selecionarJogador(
                        playerId
                    );

                }
            );

        }
    );

}


/* ============================================================
   MENU DO MESTRE
============================================================ */

function abrirMenuMestre() {

    if (!MesaUI.masterMenu) {

        return;

    }


    MesaUI.masterMenu.hidden = false;

}


function fecharMenuMestre() {

    if (!MesaUI.masterMenu) {

        return;

    }


    MesaUI.masterMenu.hidden = true;

}


function alternarMenuMestre() {

    if (!MesaUI.masterMenu) {

        return;

    }


    if (
        MesaUI.masterMenu.hidden
    ) {

        abrirMenuMestre();

    } else {

        fecharMenuMestre();

    }

}


/* ============================================================
   AÇÕES DO MESTRE
============================================================ */

function executarAcaoMestre(
    acao
) {

    switch (acao) {


        case "mapa":

            abrirAventura(
                "mapa"
            );

            break;


        case "dungeon":

            abrirAventura(
                "dungeon"
            );

            break;


        case "combate":

            iniciarBatalha();

            break;


        case "boss":

            iniciarBoss();

            break;


        case "cte":

            abrirCTE();

            break;


        default:

            console.warn(
                "Ação do Mestre desconhecida:",
                acao
            );

    }

}


/* ============================================================
   MODO DA MESA
============================================================ */

function mudarModo(
    novoModo
) {

    const modosValidos =
        Object.values(
            MESA_CONFIG.modos
        );


    if (
        !modosValidos.includes(
            novoModo
        )
    ) {

        console.warn(
            "Modo inválido:",
            novoModo
        );

        return false;

    }


    mesaState.modoAtual =
        novoModo;


    atualizarModoVisual();


    emitirEventoMesa(
        "modoAlterado",
        {
            modo:
                novoModo
        }
    );


    return true;

}


function atualizarModoVisual() {

    if (!MesaUI.container) {

        return;

    }


    MesaUI.container.dataset.mesaModo =
        mesaState.modoAtual;

}


/* ============================================================
   VOLTAR PARA A MESA NORMAL
============================================================ */

function voltarParaMesaNormal() {

    mesaState.modoAtual =
        MESA_CONFIG.modos.NORMAL;


    mesaState.aventura.ativa =
        false;


    mesaState.aventura.tipo =
        null;


    atualizarModoVisual();


    mostrarTelaPrincipal();


    emitirEventoMesa(
        "mesaNormal"
    );

}


/* ============================================================
   AVENTURA
============================================================ */

function abrirAventura(
    tipo,
    dados = null
) {

    fecharMenuMestre();


    mesaState.aventura.ativa =
        true;


    mesaState.aventura.tipo =
        tipo;


    mesaState.aventura.dados =
        dados;


    mudarModo(
        MESA_CONFIG.modos.AVENTURA
    );


    switch (tipo) {


        case "mapa":

            mostrarTela(
                `
                <div class="mesa-view mesa-map-view">

                    <div class="mesa-view-icon">
                        🗺️
                    </div>

                    <h2>Mapa</h2>

                    <p>
                        O mapa da aventura
                        aparecerá aqui.
                    </p>

                </div>
                `
            );

            break;


        case "dungeon":

            mostrarTela(
                `
                <div class="mesa-view mesa-dungeon-view">

                    <div class="mesa-view-icon">
                        🏰
                    </div>

                    <h2>Dungeon</h2>

                    <p>
                        A dungeon da aventura
                        aparecerá aqui.
                    </p>

                </div>
                `
            );

            break;


        default:

            mostrarTelaPrincipal();

    }


    emitirEventoMesa(
        "aventuraAberta",
        {

            tipo,

            dados

        }
    );

}


/* ============================================================
   INICIAR BATALHA
============================================================ */

function iniciarBatalha(
    dados = null
) {

    fecharMenuMestre();


    mesaState.batalha.ativa =
        true;


    mesaState.batalha.dados =
        dados;


    mesaState.batalha.id =
        gerarId("batalha");


    mudarModo(
        MESA_CONFIG.modos.BATALHA
    );


    /*
        NÃO resetamos os personagens.

        Apenas marcamos quem está
        participando da batalha.
    */

    mesaState.jogadores.forEach(
        jogador => {

            if (
                jogador.conectado
            ) {

                jogador.emBatalha =
                    true;

            }

        }
    );


    mostrarTela(
        `
        <div class="mesa-view mesa-battle-loading">

            <div class="mesa-view-icon">
                ⚔️
            </div>

            <h2>Combate iniciado</h2>

            <p>
                Preparando a Mesa de Batalha...
            </p>

        </div>
        `
    );


    emitirEventoMesa(
        "batalhaIniciada",
        {

            batalhaId:
                mesaState.batalha.id,

            dados,

            jogadores:
                mesaState.jogadores

        }
    );


    /*
        Futuro mesa-batalha.js
    */

    if (
        typeof window
            .inicializarMesaBatalha ===
        "function"
    ) {

        window.inicializarMesaBatalha(
            mesaState
        );

    }

}


/* ============================================================
   FINALIZAR BATALHA
============================================================ */

function finalizarBatalha(
    resultado = null
) {

    mesaState.batalha.ativa =
        false;


    mesaState.batalha.id =
        null;


    mesaState.batalha.dados =
        null;


    mesaState.jogadores.forEach(
        jogador => {

            jogador.emBatalha =
                false;

        }
    );


    emitirEventoMesa(
        "batalhaFinalizada",
        {

            resultado

        }
    );


    voltarParaMesaNormal();

}


/* ============================================================
   BOSS
============================================================ */

function iniciarBoss(
    dados = null
) {

    fecharMenuMestre();


    iniciarBatalha(
        {

            tipo: "boss",

            dados

        }
    );

}


/* ============================================================
   CTE
   CLICK TIME EVENT
============================================================ */

/*
    O CTE é GLOBAL.

    Pode ser iniciado em:

        NORMAL
        AVENTURA
        BATALHA

    Ele NÃO muda o modo atual.

    Exemplo:

        batalha
           ↓
        CTE
           ↓
        batalha

*/


function abrirCTE(
    tipo = "normal",
    dados = {}
) {

    if (
        !MESA_CONFIG.cte.disponivel
    ) {

        return;

    }


    /*
        Se já existir um CTE ativo,
        não criamos outro por cima.
    */

    if (
        mesaState.cte.ativo
    ) {

        console.warn(
            "Já existe um CTE ativo."
        );

        return;

    }


    fecharMenuMestre();


    const dificuldade =
        obterDificuldadeCTE(
            tipo,
            dados
        );


    const duracao =
        obterDuracaoCTE(
            dificuldade,
            dados
        );


    mesaState.cte = {

        ativo: true,

        id:
            gerarId("cte"),

        dificuldade,

        duracao,

        iniciadoEm:
            Date.now(),

        encerradoEm:
            null,

        alvo: null,

        resultado: null,

        jogadorAlvo:
            dados.jogadorAlvo ??
            null,

        dados

    };


    emitirEventoMesa(
        "cteIniciado",
        {

            id:
                mesaState.cte.id,

            dificuldade,

            duracao,

            iniciadoEm:
                mesaState.cte.iniciadoEm,

            jogadorAlvo:
                mesaState.cte.jogadorAlvo,

            modoAnterior:
                mesaState.modoAtual,

            dados

        }
    );


    criarCTEVisual();


    iniciarTimerCTE();

}


/* ============================================================
   DIFICULDADE DO CTE
============================================================ */

function obterDificuldadeCTE(
    tipo,
    dados
) {

    if (
        dados &&
        dados.dificuldade &&
        MESA_CONFIG.cte.duracoes[
            dados.dificuldade
        ]
    ) {

        return dados.dificuldade;

    }


    if (
        MESA_CONFIG.cte.duracoes[
            tipo
        ]
    ) {

        return tipo;

    }


    return MESA_CONFIG
        .cte
        .dificuldadePadrao;

}


/* ============================================================
   DURAÇÃO DO CTE
============================================================ */

function obterDuracaoCTE(
    dificuldade,
    dados
) {

    /*
        Podemos sobrescrever a duração
        manualmente no futuro.

        Exemplo:

        abrirCTE("normal", {
            duracao: 1500
        })
    */

    if (
        dados &&
        Number.isFinite(
            Number(
                dados.duracao
            )
        )
    ) {

        return Math.max(
            100,
            Number(
                dados.duracao
            )
        );

    }


    return (
        MESA_CONFIG
            .cte
            .duracoes[
                dificuldade
            ] ||
        2000
    );

}


/* ============================================================
   CRIAR O CTE NA TELA
============================================================ */

function criarCTEVisual() {

    if (
        !MesaUI.screenContent
    ) {

        return;

    }


    /*
        Escolhemos uma posição aleatória
        dentro do palco.

        Mantemos uma margem para que
        o alvo nunca apareça grudado
        nas bordas.
    */

    const posicao =
        gerarPosicaoAlvo();


    mesaState.cte.alvo =
        posicao;


    MesaUI.screenContent.innerHTML =

        `
        <div
            class="cte-overlay"
            id="cte-overlay"
        >

            <div class="cte-info">

                <span class="cte-label">
                    ⚡ CTE
                </span>

                <span
                    class="cte-timer"
                    id="cte-timer"
                >
                    2.00
                </span>

            </div>


            <button
                type="button"
                id="cte-target"
                class="cte-target"
                aria-label="Acertar CTE"
                style="
                    left:${posicao.x}%;
                    top:${posicao.y}%;
                "
            >

                <span>
                    TAP!
                </span>

            </button>

        </div>
        `;


    const alvo =
        document.getElementById(
            "cte-target"
        );


    if (alvo) {

        /*
            pointerdown funciona tanto
            com toque quanto com mouse.

            Isso é importante porque a
            aplicação será usada no celular.
        */

        alvo.addEventListener(
            "pointerdown",
            evento => {

                evento.preventDefault();

                processarAcertoCTE();

            },
            {
                once: true
            }
        );

    }

}


/* ============================================================
   POSIÇÃO DO ALVO
============================================================ */

function gerarPosicaoAlvo() {

    /*
        Valores em porcentagem.

        Margens de segurança:

        X: 15% → 85%
        Y: 22% → 78%

        Assim o alvo fica sempre
        dentro da área útil.
    */

    const x =
        15 +
        Math.random() * 70;


    const y =
        22 +
        Math.random() * 56;


    return {

        x:
            Number(
                x.toFixed(2)
            ),

        y:
            Number(
                y.toFixed(2)
            )

    };

}


/* ============================================================
   TIMER DO CTE
============================================================ */

function iniciarTimerCTE() {

    limparTimerCTE();


    const inicio =
        mesaState.cte.iniciadoEm;


    const duracao =
        mesaState.cte.duracao;


    atualizarTimerCTE();


    function atualizarTimerCTE() {

        if (
            !mesaState.cte.ativo
        ) {

            return;

        }


        const agora =
            Date.now();


        const decorrido =
            agora - inicio;


        const restante =
            Math.max(
                0,
                duracao - decorrido
            );


        atualizarTextoTimer(
            restante
        );


        if (
            restante <= 0
        ) {

            finalizarCTE(
                "falha",
                "tempo_esgotado"
            );

            return;

        }


        cteAnimationFrame =
            requestAnimationFrame(
                atualizarTimerCTE
            );

    }


    cteTimer =
        setTimeout(
            () => {

                if (
                    mesaState.cte.ativo
                ) {

                    finalizarCTE(
                        "falha",
                        "tempo_esgotado"
                    );

                }

            },
            duracao + 50
        );

}


/* ============================================================
   ATUALIZAR TEXTO DO TIMER
============================================================ */

function atualizarTextoTimer(
    restante
) {

    const timer =
        document.getElementById(
            "cte-timer"
        );


    if (!timer) {

        return;

    }


    const segundos =
        restante / 1000;


    timer.textContent =
        segundos.toFixed(2);

}


/* ============================================================
   ACERTO DO CTE
============================================================ */

function processarAcertoCTE() {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    const agora =
        Date.now();


    const decorrido =
        agora -
        mesaState.cte.iniciadoEm;


    /*
        Segurança extra:

        mesmo que o navegador demore
        para processar o toque, verificamos
        o timestamp real.
    */

    if (
        decorrido >
        mesaState.cte.duracao
    ) {

        finalizarCTE(
            "falha",
            "tempo_esgotado"
        );

        return;

    }


    const tempoRestante =
        Math.max(
            0,
            mesaState.cte.duracao -
            decorrido
        );


    finalizarCTE(
        "sucesso",
        "alvo_acertado",
        {

            tempoDecorrido:
                decorrido,

            tempoRestante

        }
    );

}


/* ============================================================
   FINALIZAR CTE
============================================================ */

function finalizarCTE(
    resultado,
    motivo,
    extras = {}
) {

    if (
        !mesaState.cte.ativo
    ) {

        return;

    }


    limparTimerCTE();


    mesaState.cte.ativo =
        false;


    mesaState.cte.encerradoEm =
        Date.now();


    mesaState.cte.resultado = {

        resultado,

        motivo,

        ...extras

    };


    const dadosResultado = {

        id:
            mesaState.cte.id,

        resultado,

        motivo,

        dificuldade:
            mesaState.cte.dificuldade,

        duracao:
            mesaState.cte.duracao,

        iniciadoEm:
            mesaState.cte.iniciadoEm,

        encerradoEm:
            mesaState.cte.encerradoEm,

        alvo:
            mesaState.cte.alvo,

        jogadorAlvo:
            mesaState.cte.jogadorAlvo,

        ...extras

    };


    /*
        Mostramos o resultado por um
        pequeno período antes de retornar
        à mesa anterior.
    */

    mostrarResultadoCTE(
        resultado,
        motivo
    );


    emitirEventoMesa(
        "cteFinalizado",
        dadosResultado
    );


    setTimeout(
        () => {

            limparCTE();

        },
        900
    );

}


/* ============================================================
   RESULTADO VISUAL DO CTE
============================================================ */

function mostrarResultadoCTE(
    resultado,
    motivo
) {

    if (
        !MesaUI.screenContent
    ) {

        return;

    }


    const sucesso =
        resultado === "sucesso";


    MesaUI.screenContent.innerHTML =

        `
        <div
            class="
                mesa-view
                cte-result
                ${sucesso
                    ? "cte-success"
                    : "cte-failure"}
            "
        >

            <div class="mesa-view-icon">

                ${
                    sucesso
                        ? "⚡"
                        : "⌛"
                }

            </div>

            <h2>

                ${
                    sucesso
                        ? "ACERTO!"
                        : "TEMPO ESGOTADO!"
                }

            </h2>

            <p>

                ${
                    sucesso
                        ? "CTE concluído com sucesso."
                        : "O CTE não foi concluído a tempo."
                }

            </p>

        </div>
        `;

}


/* ============================================================
   LIMPAR CTE
============================================================ */

function limparCTE() {

    limparTimerCTE();


    mesaState.cte.ativo =
        false;


    /*
        Guardamos o resultado até o
        próximo CTE para permitir que
        outros sistemas o consultem.
    */

    restaurarTelaAnterior();

}


/* ============================================================
   LIMPAR TIMER
============================================================ */

function limparTimerCTE() {

    if (
        cteTimer !== null
    ) {

        clearTimeout(
            cteTimer
        );

        cteTimer = null;

    }


    if (
        cteAnimationFrame !== null
    ) {

        cancelAnimationFrame(
            cteAnimationFrame
        );

        cteAnimationFrame =
            null;

    }

}


/* ============================================================
   TELA ANTERIOR
============================================================ */

function restaurarTelaAnterior() {


    /* -----------------------------------------
       BATALHA
    ----------------------------------------- */

    if (
        mesaState.modoAtual ===
        MESA_CONFIG.modos.BATALHA
    ) {

        if (
            typeof window
                .restaurarMesaBatalha ===
            "function"
        ) {

            window.restaurarMesaBatalha(
                mesaState
            );

            return;

        }


        mostrarTela(
            `
            <div class="mesa-view">

                <div class="mesa-view-icon">
                    ⚔️
                </div>

                <h2>Combate</h2>

                <p>
                    Mesa de batalha em andamento.
                </p>

            </div>
            `
        );

        return;

    }


    /* -----------------------------------------
       AVENTURA
    ----------------------------------------- */

    if (
        mesaState.modoAtual ===
        MESA_CONFIG.modos.AVENTURA
    ) {

        if (
            typeof window
                .restaurarMesaAventura ===
            "function"
        ) {

            window.restaurarMesaAventura(
                mesaState
            );

            return;

        }


        mostrarTelaPrincipal();

        return;

    }


    /* -----------------------------------------
       NORMAL
    ----------------------------------------- */

    mostrarTelaPrincipal();

}


/* ============================================================
   TELA PRINCIPAL
============================================================ */

function mostrarTelaPrincipal() {

    mostrarTela(
        `
        <div class="mesa-view mesa-main-view">

            <div class="mesa-view-icon">
                🎲
            </div>

            <h2>Mesa de RPG</h2>

            <p>
                Aguardando o início da aventura...
            </p>

        </div>
        `
    );

}


function mostrarTela(
    conteudo
) {

    if (
        !MesaUI.screenContent
    ) {

        return;

    }


    MesaUI.screenContent.innerHTML =
        conteudo;

}


/* ============================================================
   JOGADORES
============================================================ */

function selecionarJogador(
    playerId
) {

    const jogador =
        obterJogador(
            playerId
        );


    if (!jogador) {

        return;

    }


    console.log(
        "👤 Jogador selecionado:",
        jogador
    );


    emitirEventoMesa(
        "jogadorSelecionado",
        {

            jogador

        }
    );


    /*
        Quando mesa-jogadores.js
        existir, ele assumirá
        a abertura da ficha.
    */

    if (
        typeof window
            .abrirFichaJogador ===
        "function"
    ) {

        window.abrirFichaJogador(
            playerId
        );

    }

}


function obterJogador(
    playerId
) {

    return mesaState
        .jogadores
        .find(
            jogador =>
                jogador.id ===
                playerId
        );

}


/* ============================================================
   ATUALIZAÇÃO DOS CARDS
============================================================ */

function atualizarCardsIniciais() {

    mesaState.jogadores.forEach(
        jogador => {

            atualizarCardJogador(
                jogador.id
            );

        }
    );

}


function atualizarCardJogador(
    playerId
) {

    const jogador =
        obterJogador(
            playerId
        );


    if (!jogador) {

        return;

    }


    const card =
        document.querySelector(
            `.player-card[data-player="${playerId}"]`
        );


    if (!card) {

        return;

    }


    const nome =
        card.querySelector(
            ".player-name"
        );


    const raca =
        card.querySelector(
            ".player-raca"
        );


    const classe =
        card.querySelector(
            ".player-classe"
        );


    const hpValue =
        card.querySelector(
            ".hp-value"
        );


    const manaValue =
        card.querySelector(
            ".mana-value"
        );


    const hpBar =
        card.querySelector(
            ".hp-bar span"
        );


    const manaBar =
        card.querySelector(
            ".mana-bar span"
        );


    if (nome) {

        nome.textContent =
            jogador.nome;

    }


    if (raca) {

        raca.textContent =
            jogador.raca ??
            "Raça";

    }


    if (classe) {

        classe.textContent =
            jogador.classe ??
            "Classe";

    }


    if (hpValue) {

        hpValue.textContent =
            `${jogador.hp.atual}/${jogador.hp.maximo}`;

    }


    if (manaValue) {

        manaValue.textContent =
            `${jogador.mana.atual}/${jogador.mana.maximo}`;

    }


    if (hpBar) {

        hpBar.style.width =
            calcularPorcentagem(
                jogador.hp.atual,
                jogador.hp.maximo
            ) + "%";

    }


    if (manaBar) {

        manaBar.style.width =
            calcularPorcentagem(
                jogador.mana.atual,
                jogador.mana.maximo
            ) + "%";

    }


    card.dataset.conectado =
        jogador.conectado
            ? "true"
            : "false";


    card.dataset.emBatalha =
        jogador.emBatalha
            ? "true"
            : "false";

}


function calcularPorcentagem(
    atual,
    maximo
) {

    if (
        !Number.isFinite(
            Number(atual)
        ) ||
        !Number.isFinite(
            Number(maximo)
        ) ||
        Number(maximo) <= 0
    ) {

        return 0;

    }


    return Math.max(
        0,
        Math.min(
            100,
            (
                Number(atual) /
                Number(maximo)
            ) * 100
        )
    );

}


/* ============================================================
   CAMPANHA
============================================================ */

function atualizarNomeCampanha() {

    if (
        !MesaUI.nomeCampanha
    ) {

        return;

    }


    MesaUI.nomeCampanha.textContent =
        mesaState.campanha.nome;

}


function definirNomeCampanha(
    nome
) {

    if (
        typeof nome !==
        "string"
    ) {

        return;

    }


    const nomeLimpo =
        nome.trim();


    if (!nomeLimpo) {

        return;

    }


    mesaState.campanha.nome =
        nomeLimpo;


    atualizarNomeCampanha();


    emitirEventoMesa(
        "campanhaAlterada",
        {

            nome:
                mesaState
                    .campanha
                    .nome

        }
    );

}


/* ============================================================
   EVENTOS INTERNOS
============================================================ */

function emitirEventoMesa(
    nome,
    dados = {}
) {

    document.dispatchEvent(
        new CustomEvent(
            `mesa:${nome}`,
            {
                detail: dados
            }
        )
    );

}


/* ============================================================
   GERADOR DE IDs
============================================================ */

function gerarId(
    prefixo
) {

    const tempo =
        Date.now()
        .toString(36);


    const aleatorio =
        Math.random()
        .toString(36)
        .slice(2, 8);


    return `${prefixo}_${tempo}_${aleatorio}`;

}


/* ============================================================
   API PÚBLICA
============================================================ */

window.MesaRPG = {


    /* -----------------------------------------
       ESTADO
    ----------------------------------------- */

    estado() {

        return mesaState;

    },


    /* -----------------------------------------
       MODO
    ----------------------------------------- */

    modo: {

        atual() {

            return mesaState.modoAtual;

        },


        mudar(
            novoModo
        ) {

            return mudarModo(
                novoModo
            );

        }

    },


    /* -----------------------------------------
       MESTRE
    ----------------------------------------- */

    mestre: {

        abrirMenu() {

            abrirMenuMestre();

        },


        fecharMenu() {

            fecharMenuMestre();

        },


        alternarMenu() {

            alternarMenuMestre();

        }

    },


    /* -----------------------------------------
       AVENTURA
    ----------------------------------------- */

    aventura: {

        abrir(
            tipo,
            dados = null
        ) {

            abrirAventura(
                tipo,
                dados
            );

        }

    },


    /* -----------------------------------------
       BATALHA
    ----------------------------------------- */

    batalha: {

        iniciar(
            dados = null
        ) {

            iniciarBatalha(
                dados
            );

        },


        finalizar(
            resultado = null
        ) {

            finalizarBatalha(
                resultado
            );

        },


        ativa() {

            return (
                mesaState
                    .batalha
                    .ativa
            );

        }

    },


    /* -----------------------------------------
       BOSS
    ----------------------------------------- */

    boss: {

        iniciar(
            dados = null
        ) {

            iniciarBoss(
                dados
            );

        }

    },


    /* -----------------------------------------
       CTE
    ----------------------------------------- */

    cte: {

        abrir(
            tipo = "normal",
            dados = {}
        ) {

            abrirCTE(
                tipo,
                dados
            );

        },


        fechar() {

            if (
                mesaState.cte.ativo
            ) {

                finalizarCTE(
                    "falha",
                    "cancelado"
                );

            }

        },


        ativo() {

            return (
                mesaState
                    .cte
                    .ativo
            );

        },


        resultado() {

            return (
                mesaState
                    .cte
                    .resultado
            );

        }

    },


    /* -----------------------------------------
       JOGADORES
    ----------------------------------------- */

    jogadores: {

        todos() {

            return (
                mesaState
                    .jogadores
            );

        },


        obter(id) {

            return obterJogador(
                id
            );

        },


        atualizarCard(id) {

            atualizarCardJogador(
                id
            );

        }

    },


    /* -----------------------------------------
       CAMPANHA
    ----------------------------------------- */

    campanha: {

        definirNome(
            nome
        ) {

            definirNomeCampanha(
                nome
            );

        }

    }

};


/* ============================================================
   FUNÇÕES GLOBAIS DE COMPATIBILIDADE
============================================================ */

window.iniciarBatalha =
    iniciarBatalha;


window.finalizarBatalha =
    finalizarBatalha;


window.abrirCTE =
    abrirCTE;


window.fecharCTE =
    () => {

        if (
            mesaState.cte.ativo
        ) {

            finalizarCTE(
                "falha",
                "cancelado"
            );

        }

    };


window.abrirAventura =
    abrirAventura;


window.voltarParaMesaNormal =
    voltarParaMesaNormal;


/* ============================================================
   FIM DO MESA.JS
============================================================ */
