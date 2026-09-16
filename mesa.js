/* ============================================================
   MESA RPG ONLINE
   mesa.js
   NÚCLEO / ORQUESTRADOR DA MESA
============================================================ */

"use strict";


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
        disponivel: true
    }

};


/* ============================================================
   ESTADO GLOBAL DA MESA
============================================================ */

/*
    Este objeto representa o estado atual da sessão.

    IMPORTANTE:
    Os dados dos jogadores ficarão aqui futuramente.
    Quando entrarmos em batalha, eles NÃO serão recriados.

    Exemplo:

    Player 1
    HP: 73/100

    entra em batalha
    ↓
    sofre dano
    ↓
    HP: 51/100

    volta para a mesa
    ↓
    continua com 51/100
*/

const mesaState = {

    modoAtual: MESA_CONFIG.modos.NORMAL,

    campanha: {
        nome: "Campanha"
    },

    cte: {

        ativo: false,

        tipo: null,

        dados: null

    },

    batalha: {

        ativa: false,

        dados: null

    },

    aventura: {

        ativa: false,

        tipo: null,

        dados: null

    },

    jogadores: Array.from(
        { length: MESA_CONFIG.maxJogadores },
        (_, index) => {

            return {

                id: index + 1,

                nome: `Player ${index + 1}`,

                conectado: false,

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
   INICIALIZAÇÃO
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    inicializarMesa();

});


function inicializarMesa() {

    obterElementos();

    registrarEventos();

    atualizarNomeCampanha();

    atualizarModoVisual();

    console.log(
        "🎲 Mesa RPG inicializada.",
        mesaState
    );

}


/* ============================================================
   OBTER ELEMENTOS
============================================================ */

function obterElementos() {

    MesaUI.container =
        document.getElementById("online-table-panel");

    MesaUI.layout =
        document.querySelector(".mesa-layout");

    MesaUI.jogadores =
        document.getElementById("jogadores");

    MesaUI.stage =
        document.getElementById("mesa-stage");

    MesaUI.screen =
        document.getElementById("mesa-screen");

    MesaUI.screenContent =
        document.getElementById("mesa-screen-content");

    MesaUI.settingsButton =
        document.getElementById("btn-configuracoes");

    MesaUI.masterMenu =
        document.getElementById("master-menu");

    MesaUI.nomeCampanha =
        document.getElementById("nome-campanha");

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
       BOTÃO DE CONFIGURAÇÕES
    ----------------------------------------- */

    if (MesaUI.settingsButton) {

        MesaUI.settingsButton.addEventListener(
            "click",
            alternarMenuMestre
        );

    }


    /* -----------------------------------------
       BOTÕES DO MESTRE
    ----------------------------------------- */

    MesaUI.masterButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const acao =
                    button.dataset.masterAction;

                executarAcaoMestre(acao);

            }
        );

    });


    /* -----------------------------------------
       FECHAR MENU CLICANDO FORA
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
       TECLA ESC
    ----------------------------------------- */

    document.addEventListener(
        "keydown",
        evento => {

            if (evento.key === "Escape") {

                fecharMenuMestre();

            }

        }
    );


    /* -----------------------------------------
       CARDS DOS JOGADORES
    ----------------------------------------- */

    const cards =
        document.querySelectorAll(".player-card");

    cards.forEach(card => {

        card.addEventListener(
            "click",
            () => {

                const playerId =
                    Number(card.dataset.player);

                selecionarJogador(playerId);

            }
        );

    });

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

    if (MesaUI.masterMenu.hidden) {

        abrirMenuMestre();

    } else {

        fecharMenuMestre();

    }

}


/* ============================================================
   AÇÕES DO MESTRE
============================================================ */

function executarAcaoMestre(acao) {

    switch (acao) {

        case "mapa":

            abrirAventura("mapa");

            break;


        case "dungeon":

            abrirAventura("dungeon");

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
                `Ação do Mestre desconhecida: ${acao}`
            );

    }

}


/* ============================================================
   MODO DA MESA
============================================================ */

function mudarModo(novoModo) {

    const modosValidos = Object.values(
        MESA_CONFIG.modos
    );

    if (!modosValidos.includes(novoModo)) {

        console.warn(
            `Modo inválido: ${novoModo}`
        );

        return;

    }

    mesaState.modoAtual = novoModo;

    atualizarModoVisual();

    emitirEventoMesa(
        "modoAlterado",
        {
            modo: novoModo
        }
    );

}


function atualizarModoVisual() {

    if (!MesaUI.container) {
        return;
    }

    MesaUI.container.dataset.mesaModo =
        mesaState.modoAtual;

}


/* ============================================================
   MESA NORMAL
============================================================ */

function voltarParaMesaNormal() {

    mesaState.modoAtual =
        MESA_CONFIG.modos.NORMAL;

    mesaState.aventura.ativa = false;

    mesaState.aventura.tipo = null;

    atualizarModoVisual();

    mostrarTelaPrincipal();

    emitirEventoMesa(
        "mesaNormal",
        {}
    );

}


/* ============================================================
   AVENTURA
============================================================ */

function abrirAventura(tipo, dados = null) {

    fecharMenuMestre();

    mesaState.aventura.ativa = true;

    mesaState.aventura.tipo = tipo;

    mesaState.aventura.dados = dados;

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
                            O mapa da aventura aparecerá aqui.
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
                            A dungeon da aventura aparecerá aqui.
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
   BATALHA
============================================================ */

/*
    IMPORTANTE:

    Esta função NÃO monta a interface completa da batalha.

    Ela apenas muda o estado da sessão e prepara
    a transferência para o futuro sistema:

        mesa-batalha.js

    Assim não misturamos as responsabilidades.
*/

function iniciarBatalha(dados = null) {

    fecharMenuMestre();

    mesaState.batalha.ativa = true;

    mesaState.batalha.dados = dados;

    mudarModo(
        MESA_CONFIG.modos.BATALHA
    );


    /* -----------------------------------------
       MARCAR JOGADORES COMO EM BATALHA
    ----------------------------------------- */

    mesaState.jogadores.forEach(jogador => {

        if (jogador.conectado) {

            jogador.emBatalha = true;

        }

    });


    /*
        O futuro mesa-batalha.js poderá
        assumir daqui.
    */

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
            dados,

            jogadores:
                mesaState.jogadores
        }
    );


    /*
        Se mesa-batalha.js estiver carregado,
        damos a ele a oportunidade de assumir
        a interface.
    */

    if (
        typeof window.inicializarMesaBatalha ===
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

function finalizarBatalha(resultado = null) {

    mesaState.batalha.ativa = false;

    mesaState.batalha.dados = null;


    mesaState.jogadores.forEach(jogador => {

        jogador.emBatalha = false;

    });


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

function iniciarBoss(dados = null) {

    fecharMenuMestre();

    /*
        Boss também será tratado como
        um tipo especial de batalha.

        Não criamos uma segunda estrutura
        de jogadores.
    */

    iniciarBatalha({

        tipo: "boss",

        dados

    });

}


/* ============================================================
   CTE
============================================================ */

/*
    O CTE é GLOBAL.

    Ele NÃO depende do modo atual da mesa.

    Pode ser aberto:

        Mesa Normal
        Mesa de Aventura
        Mesa de Batalha

    sem destruir o estado atual.
*/

function abrirCTE(tipo = "padrao", dados = null) {

    fecharMenuMestre();

    mesaState.cte.ativo = true;

    mesaState.cte.tipo = tipo;

    mesaState.cte.dados = dados;


    /*
        O CTE fica sobre o conteúdo atual.

        Não mudamos:

            mesaState.modoAtual

        Portanto, se estivermos em batalha,
        continuamos em batalha depois do CTE.
    */

    mostrarCTE();


    emitirEventoMesa(
        "cteAberto",
        {
            tipo,
            dados,

            modoAtual:
                mesaState.modoAtual
        }
    );

}


function mostrarCTE() {

    mostrarTela(
        `
            <div class="mesa-view mesa-cte-view">

                <div class="mesa-view-icon">
                    🎲
                </div>

                <h2>CTE</h2>

                <p>
                    Evento narrativo em andamento.
                </p>

                <button
                    type="button"
                    class="mesa-cte-close"
                    id="btn-fechar-cte"
                >
                    Continuar
                </button>

            </div>
        `
    );


    const botao =
        document.getElementById(
            "btn-fechar-cte"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            fecharCTE
        );

    }

}


function fecharCTE() {

    mesaState.cte.ativo = false;

    mesaState.cte.tipo = null;

    mesaState.cte.dados = null;


    /*
        Retornamos ao sistema que estava
        funcionando antes do CTE.
    */

    restaurarTelaAnterior();


    emitirEventoMesa(
        "cteFechado",
        {}
    );

}


/* ============================================================
   RESTAURAR TELA
============================================================ */

function restaurarTelaAnterior() {

    if (
        mesaState.modoAtual ===
        MESA_CONFIG.modos.BATALHA
    ) {

        if (
            typeof window.restaurarMesaBatalha ===
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


    if (
        mesaState.modoAtual ===
        MESA_CONFIG.modos.AVENTURA
    ) {

        if (
            typeof window.restaurarMesaAventura ===
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


function mostrarTela(conteudo) {

    if (!MesaUI.screenContent) {
        return;
    }

    MesaUI.screenContent.innerHTML =
        conteudo;

}


/* ============================================================
   JOGADORES
============================================================ */

function selecionarJogador(playerId) {

    const jogador =
        obterJogador(playerId);

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
        Quando mesa-jogadores.js existir,
        ele poderá assumir a abertura
        da ficha do personagem.
    */

    if (
        typeof window.abrirFichaJogador ===
        "function"
    ) {

        window.abrirFichaJogador(
            playerId
        );

    }

}


function obterJogador(playerId) {

    return mesaState.jogadores.find(
        jogador =>
            jogador.id === playerId
    );

}


/* ============================================================
   NOME DA CAMPANHA
============================================================ */

function atualizarNomeCampanha() {

    if (!MesaUI.nomeCampanha) {
        return;
    }

    MesaUI.nomeCampanha.textContent =
        mesaState.campanha.nome;

}


function definirNomeCampanha(nome) {

    if (
        typeof nome !== "string" ||
        !nome.trim()
    ) {

        return;

    }

    mesaState.campanha.nome =
        nome.trim();

    atualizarNomeCampanha();


    emitirEventoMesa(
        "campanhaAlterada",
        {
            nome:
                mesaState.campanha.nome
        }
    );

}


/* ============================================================
   EVENTOS INTERNOS DA MESA
============================================================ */

/*
    Criamos um sistema simples de eventos
    para os outros arquivos poderem conversar
    com o mesa.js.

    Exemplo:

    mesa.js
       ↓
    "batalhaIniciada"
       ↓
    mesa-batalha.js
*/

function emitirEventoMesa(nome, dados = {}) {

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
   API PÚBLICA
============================================================ */

/*
    Disponibilizamos somente funções que
    outros arquivos realmente precisarão.

    Os outros sistemas poderão utilizar:

        window.MesaRPG.estado()

        window.MesaRPG.batalha.iniciar()

        window.MesaRPG.batalha.finalizar()

        window.MesaRPG.cte.abrir()

        window.MesaRPG.cte.fechar()

        window.MesaRPG.aventura.abrir()

        window.MesaRPG.modo.mudar()
*/

window.MesaRPG = {

    estado() {

        return mesaState;

    },


    modo: {

        atual() {

            return mesaState.modoAtual;

        },

        mudar(novoModo) {

            mudarModo(novoModo);

        }

    },


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


    aventura: {

        abrir(tipo, dados = null) {

            abrirAventura(
                tipo,
                dados
            );

        }

    },


    batalha: {

        iniciar(dados = null) {

            iniciarBatalha(
                dados
            );

        },

        finalizar(resultado = null) {

            finalizarBatalha(
                resultado
            );

        },

        ativa() {

            return mesaState.batalha.ativa;

        }

    },


    boss: {

        iniciar(dados = null) {

            iniciarBoss(
                dados
            );

        }

    },


    cte: {

        abrir(tipo = "padrao", dados = null) {

            abrirCTE(
                tipo,
                dados
            );

        },

        fechar() {

            fecharCTE();

        },

        ativo() {

            return mesaState.cte.ativo;

        }

    },


    jogadores: {

        todos() {

            return mesaState.jogadores;

        },

        obter(id) {

            return obterJogador(id);

        }

    },


    campanha: {

        definirNome(nome) {

            definirNomeCampanha(
                nome
            );

        }

    }

};


/* ============================================================
   DEBUG
============================================================ */

/*
    Mantemos algumas funções disponíveis
    no window para facilitar a integração
    durante o desenvolvimento.

    Elas poderão ser removidas no futuro.
*/

window.iniciarBatalha = iniciarBatalha;

window.finalizarBatalha = finalizarBatalha;

window.abrirCTE = abrirCTE;

window.fecharCTE = fecharCTE;

window.abrirAventura = abrirAventura;

window.voltarParaMesaNormal = voltarParaMesaNormal;
