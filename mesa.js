"use strict";

/*
==============================================================
 MESA RPG ONLINE
 CORE / ORQUESTRADOR
==============================================================

 Responsabilidades deste arquivo:

 - Inicializar a mesa
 - Identificar campanha ativa
 - Identificar Mestre / Jogador
 - Controlar o modo atual da mesa
 - Controlar a área central
 - Abrir o menu do Mestre
 - Encaminhar ações de aventura
 - Controlar CTE
 - Manter os 8 lugares da mesa
 - Sincronizar informações básicas da campanha
 - Conversar com mesa-jogadores.js
 - Conversar com mesa-aventura.js

 NÃO é responsabilidade deste arquivo:

 - Gerenciar HP individual
 - Gerenciar inventário
 - Gerenciar habilidades
 - Gerenciar passivas
 - Gerenciar status individuais

 Essas funções pertencem ao mesa-jogadores.js.
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

        quantidadePadrao: 1,

        duracaoMinima: 100,

        duracaoMaxima: 30000,

        quantidadeMinima: 1,

        quantidadeMaxima: 20

    }

};



/* ============================================================
   ESTADO CENTRAL DA MESA
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

        isMaster: false,

        isPlayer: false

    },



    jogadorAtual: {

        characterId: null,

        slot: null

    },



    /*
     Os oito lugares físicos da mesa.

     IMPORTANTE:

     Estes objetos NÃO são os personagens.

     São apenas os assentos da mesa.

     Os dados reais dos personagens vêm do
     sistema de jogadores / Supabase.
    */

    jogadores: Array.from(

        { length: MESA_CONFIG.maxJogadores },

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



    /*
     =========================================================
     CTE
     =========================================================

     O CTE é transversal à mesa.

     Ele NÃO muda o modo da mesa.

     O Mestre pode determinar:

     - tempo
     - dificuldade
     - quantidade de acertos
     - todos os jogadores
     - jogadores específicos
     - se uma falha será divulgada globalmente

     Cada jogador selecionado possui seu próprio resultado.
    */

    cte: {

        ativo:
            false,

        id:
            null,

        dificuldade:
            MESA_CONFIG.cte.dificuldadePadrao,

        duracao:
            MESA_CONFIG.cte.dificuldades.normal,

        quantidade:
            MESA_CONFIG.cte.quantidadePadrao,

        todos:
            true,

        alvos:
            [],

        resultados:
            [],

        inicio:
            null,

        falhaGlobal:
            true

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

    settingsButton:
        null,

    masterMenu:
        null,

    masterButtons:
        [],

    nomeCampanha:
        null

};



/* ============================================================
   INICIALIZAÇÃO
============================================================ */

function inicializarMesa() {

    if (mesaState.inicializado) {

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



    MesaUI.settingsButton =
        document.getElementById(
            "btn-configuracoes"
        );



    MesaUI.masterMenu =
        document.getElementById(
            "master-menu"
        );



    MesaUI.masterButtons =
        Array.from(
            document.querySelectorAll(
                "[data-master-action]"
            )
        );



    MesaUI.nomeCampanha =
        document.getElementById(
            "nome-campanha"
        );



    if (!MesaUI.container) {

        console.warn(
            "[Mesa] Elemento #online-table-panel não encontrado."
        );

        return;

    }



    mesaState.inicializado =
        true;



    carregarContextoUsuario();

    registrarEventos();

    configurarMenuMestre();

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
        "[Mesa] Mesa RPG inicializada."
    );

}



/* ============================================================
   CONTEXTO DO USUÁRIO
============================================================ */

function carregarContextoUsuario() {

    const auth =
        window.rpgAuth || null;



    const campanha =
        obterCampanhaAtiva();



    /*
     Usuário
    */

    if (
        auth &&
        auth.user
    ) {

        mesaState.usuario.id =
            auth.user.id ||
            null;



        mesaState.usuario.nome =
            auth.user.user_metadata?.name ||
            auth.user.user_metadata?.full_name ||
            auth.user.email ||
            "Jogador";

    }



    /*
     Campanha
    */

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
     Identificação do Mestre
    */

    const usuarioId =
        mesaState.usuario.id;



    mesaState.usuario.isMaster =
        Boolean(

            (

                mesaState.campanha.masterId &&

                usuarioId &&

                mesaState.campanha.masterId ===
                usuarioId

            )

            ||

            auth?.isMaster === true

            ||

            (

                typeof window.usuarioEhMestreInterface ===
                "function" &&

                window.usuarioEhMestreInterface() === true

            )

        );



    mesaState.usuario.isPlayer =
        !mesaState.usuario.isMaster &&
        Boolean(usuarioId);



    /*
     Personagem / slot atual
    */

    descobrirJogadorAtual();

}



/* ============================================================
   CAMPANHA ATIVA
============================================================ */

function obterCampanhaAtiva() {

    /*
     Primeiro: campaign.js
    */

    if (

        window.rpgCampaign &&

        typeof window.rpgCampaign.obterCampanhaAtiva ===
        "function"

    ) {

        const campanha =
            window.rpgCampaign.obterCampanhaAtiva();



        if (campanha) {

            return campanha;

        }

    }



    /*
     Segundo: auth.js
    */

    if (

        window.rpgAuth &&

        window.rpgAuth.campaign

    ) {

        return window.rpgAuth.campaign;

    }



    /*
     Terceiro: localStorage
    */

    try {

        const salvo =
            localStorage.getItem(
                "rpg_mesa_ativa"
            );



        if (salvo) {

            const mesa =
                JSON.parse(
                    salvo
                );



            if (
                mesa &&
                mesa.campaignId
            ) {

                return {

                    id:
                        mesa.campaignId,

                    name:
                        mesa.campaignName ||
                        "Campanha",

                    codigo_mesa:
                        mesa.codigoMesa ||
                        null,

                    master_id:
                        null

                };

            }

        }

    } catch (erro) {

        console.warn(
            "[Mesa] Não foi possível ler a mesa salva.",
            erro
        );

    }



    return null;

}



/* ============================================================
   DESCOBRIR JOGADOR ATUAL
============================================================ */

function descobrirJogadorAtual() {

    const usuarioId =
        mesaState.usuario.id;



    if (!usuarioId) {

        return;

    }



    /*
     Primeiro tenta o localStorage da entrada.
    */

    try {

        const salvo =
            localStorage.getItem(
                "rpg_mesa_ativa"
            );



        if (salvo) {

            const mesa =
                JSON.parse(
                    salvo
                );



            if (mesa) {

                mesaState.jogadorAtual.characterId =
                    mesa.characterId ||
                    null;



                mesaState.jogadorAtual.slot =
                    mesa.slot ||
                    null;

            }

        }

    } catch (erro) {

        console.warn(
            "[Mesa] Erro ao recuperar jogador atual.",
            erro
        );

    }



    /*
     Depois tenta personagens carregados pelo auth.
    */

    if (

        !mesaState.jogadorAtual.characterId &&

        window.rpgAuth &&

        Array.isArray(
            window.rpgAuth.campaignCharacters
        )

    ) {

        const personagem =
            window.rpgAuth.campaignCharacters.find(

                character =>
                    character.user_id ===
                    usuarioId

            );



        if (personagem) {

            mesaState.jogadorAtual.characterId =
                personagem.id ||
                null;



            mesaState.jogadorAtual.slot =
                personagem.slot ||
                null;

        }

    }

}



/* ============================================================
   EVENTOS
============================================================ */

function registrarEventos() {

    /*
     Botão de configurações do Mestre
    */

    if (MesaUI.settingsButton) {

        MesaUI.settingsButton.addEventListener(

            "click",

            event => {

                event.stopPropagation();

                alternarMenuMestre();

            }

        );

    }



    /*
     Clique fora do menu
    */

    document.addEventListener(

        "click",

        event => {

            if (

                !MesaUI.masterMenu ||

                MesaUI.masterMenu.hidden

            ) {

                return;

            }



            const clicouNoMenu =
                MesaUI.masterMenu.contains(
                    event.target
                );



            const clicouNoBotao =
                MesaUI.settingsButton &&

                MesaUI.settingsButton.contains(
                    event.target
                );



            if (

                !clicouNoMenu &&

                !clicouNoBotao

            ) {

                fecharMenuMestre();

            }

        }

    );



    /*
     ESC fecha menu
    */

    document.addEventListener(

        "keydown",

        event => {

            if (
                event.key ===
                "Escape"
            ) {

                fecharMenuMestre();

            }

        }

    );



    /*
     Ações do Mestre
    */

    MesaUI.masterButtons.forEach(

        button => {

            button.addEventListener(

                "click",

                event => {

                    event.stopPropagation();



                    const acao =
                        button.dataset.masterAction;



                    executarAcaoMestre(
                        acao
                    );

                }

            );

        }

    );



    /*
     Seleção dos cards
    */

    if (MesaUI.jogadores) {

        MesaUI.jogadores.addEventListener(
            "click",
            tratarCliqueJogador
        );

    }



    /*
     Eventos vindos de outros módulos
    */

    document.addEventListener(

        "mesa:jogadorAtualizado",

        event => {

            if (

                event.detail &&

                event.detail.slot

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

            sincronizarCampanha(
                event.detail
            );

        }

    );

}



/* ============================================================
   MENU DO MESTRE
============================================================ */

function configurarMenuMestre() {

    if (!MesaUI.masterMenu) {

        return;

    }



    /*
     Nunca mostramos o menu automaticamente
     para um jogador.
    */

    if (!mesaState.usuario.isMaster) {

        MesaUI.masterMenu.hidden =
            true;

    }

}



/* ============================================================
   ABRIR MENU
============================================================ */

function abrirMenuMestre() {

    if (!mesaState.usuario.isMaster) {

        return;

    }



    if (!MesaUI.masterMenu) {

        return;

    }



    MesaUI.masterMenu.hidden =
        false;

}



/* ============================================================
   FECHAR MENU
============================================================ */

function fecharMenuMestre() {

    if (!MesaUI.masterMenu) {

        return;

    }



    MesaUI.masterMenu.hidden =
        true;

}



/* ============================================================
   ALTERNAR MENU
============================================================ */

function alternarMenuMestre() {

    if (!mesaState.usuario.isMaster) {

        return;

    }



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

    if (!mesaState.usuario.isMaster) {

        return;

    }



    fecharMenuMestre();



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

            iniciarCTE();

            break;



        default:

            console.warn(
                "[Mesa] Ação desconhecida:",
                acao
            );

    }

}



/* ============================================================
   MODO DA MESA
============================================================ */

function mudarModo(modo) {

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



    /*
     Compatibilidade com mesa-aventura.js
    */

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

        /*
         Por padrão, participantes são os jogadores
         que possuem personagem conectado.
        */

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
                        mesaState.batalha.participantes,

                    estado:
                        mesaState

                }

            }

        )

    );



    /*
     Compatibilidade com mesa-aventura.js
    */

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

/*
 CTE é GLOBAL / TRANSVERSAL.

 Ele não troca o modo da mesa.

 O Mestre pode iniciar:

 - todos os jogadores
 - um jogador
 - vários jogadores

 Somente os jogadores presentes em "alvos"
 devem receber o desafio.

 O resultado de cada jogador é armazenado
 separadamente.

 Se falhaGlobal estiver ativo, uma falha
 pode gerar um evento visível para toda a mesa.
*/


function iniciarCTE(
    opcoes = {}
) {

    if (!mesaState.usuario.isMaster) {

        console.warn(
            "[Mesa] Somente o Mestre pode iniciar um CTE."
        );

        return null;

    }



    if (mesaState.cte.ativo) {

        console.warn(
            "[Mesa] Já existe um CTE ativo."
        );

        return null;

    }



    /*
     =========================================================
     DIFICULDADE
     =========================================================
    */

    const dificuldadesValidas =
        Object.keys(
            MESA_CONFIG.cte.dificuldades
        );



    const dificuldade =
        dificuldadesValidas.includes(
            opcoes.dificuldade
        )

            ? opcoes.dificuldade

            : MESA_CONFIG.cte.dificuldadePadrao;



    /*
     =========================================================
     DURAÇÃO
     =========================================================
    */

    let duracao;



    if (
        opcoes.duracao !== undefined &&
        opcoes.duracao !== null &&
        opcoes.duracao !== ""
    ) {

        duracao =
            Number(
                opcoes.duracao
            );

    } else {

        duracao =
            MESA_CONFIG.cte.dificuldades[
                dificuldade
            ];

    }



    if (!Number.isFinite(duracao)) {

        duracao =
            MESA_CONFIG.cte.dificuldades[
                dificuldade
            ];

    }



    duracao =
        Math.min(

            MESA_CONFIG.cte.duracaoMaxima,

            Math.max(

                MESA_CONFIG.cte.duracaoMinima,

                duracao

            )

        );



    /*
     =========================================================
     QUANTIDADE DE ACERTOS
     =========================================================
    */

    let quantidade =
        Number(
            opcoes.quantidade
        );



    if (!Number.isFinite(quantidade)) {

        quantidade =
            MESA_CONFIG.cte.quantidadePadrao;

    }



    quantidade =
        Math.min(

            MESA_CONFIG.cte.quantidadeMaxima,

            Math.max(

                MESA_CONFIG.cte.quantidadeMinima,

                Math.floor(
                    quantidade
                )

            )

        );



    /*
     =========================================================
     ALVOS
     =========================================================

     todos = true

     → todos os assentos ocupados.

     todos = false

     → somente os slots enviados.
    */

    const todos =
        opcoes.todos === true;



    let alvos = [];



    if (todos) {

        alvos =
            mesaState.jogadores

                .filter(
                    jogador =>
                        jogador.ocupado
                )

                .map(
                    jogador =>
                        Number(
                            jogador.slot
                        )
                );

    } else {

        if (
            Array.isArray(
                opcoes.alvos
            )
        ) {

            alvos =
                opcoes.alvos

                    .map(
                        slot =>
                            Number(slot)
                    )

                    .filter(
                        slot =>
                            Number.isInteger(slot) &&
                            slot >= 1 &&
                            slot <=
                                MESA_CONFIG.maxJogadores
                    );

        }

    }



    /*
     Remove duplicados.
    */

    alvos =
        [
            ...new Set(
                alvos
            )
        ];



    /*
     Somente assentos ocupados podem
     receber um CTE.
    */

    alvos =
        alvos.filter(

            slot => {

                const jogador =
                    mesaState.jogadores[
                        slot - 1
                    ];



                return Boolean(
                    jogador &&
                    jogador.ocupado
                );

            }

        );



    /*
     Não existe CTE sem alvo.
    */

    if (!alvos.length) {

        console.warn(
            "[Mesa] Nenhum jogador válido foi selecionado para o CTE."
        );

        return null;

    }



    /*
     =========================================================
     RESULTADOS INDIVIDUAIS
     =========================================================
    */

    const agora =
        Date.now();



    const resultados =
        alvos.map(

            slot => ({

                slot,

                iniciadoEm:
                    agora,

                concluido:
                    false,

                sucesso:
                    null,

                falhou:
                    false,

                acertos:
                    0

            })

        );



    /*
     =========================================================
     ID ÚNICO DO CTE
     =========================================================
    */

    const id =
        `cte-${agora}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;



    /*
     =========================================================
     ATUALIZA ESTADO
     =========================================================
    */

    mesaState.cte.ativo =
        true;



    mesaState.cte.id =
        id;



    mesaState.cte.dificuldade =
        dificuldade;



    mesaState.cte.duracao =
        duracao;



    mesaState.cte.quantidade =
        quantidade;



    mesaState.cte.todos =
        todos;



    mesaState.cte.alvos =
        alvos;



    mesaState.cte.resultados =
        resultados;



    mesaState.cte.inicio =
        agora;



    mesaState.cte.falhaGlobal =
        opcoes.falhaGlobal !== false;



    /*
     O overlay local será criado pelo sistema
     visual do CTE.

     O mesa-aventura.js poderá substituir
     esta apresentação por uma versão própria.
    */

    criarOverlayCTE();



    /*
     Evento global do início.
    */

    document.dispatchEvent(

        new CustomEvent(
            "mesa:cteIniciado",
            {

                detail: {

                    id,

                    dificuldade,

                    duracao,

                    quantidade,

                    todos,

                    alvos,

                    falhaGlobal:
                        mesaState.cte.falhaGlobal,

                    resultados,

                    estado:
                        mesaState

                }

            }

        )

    );



    console.log(
        "[Mesa] CTE iniciado:",
        {

            id,

            dificuldade,

            duracao,

            quantidade,

            todos,

            alvos

        }

    );



    return {

        id,

        dificuldade,

        duracao,

        quantidade,

        todos,

        alvos,

        falhaGlobal:
            mesaState.cte.falhaGlobal

    };

}



/* ============================================================
   CRIAR OVERLAY CTE
============================================================ */

function criarOverlayCTE() {

    if (!MesaUI.screen) {

        return;

    }



    /*
     Remove somente um CTE anterior,
     caso exista.
    */

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



    /*
     O overlay fica dentro da tela,
     sem destruir o conteúdo existente.
    */

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

    if (!overlay) {

        return;

    }



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

            if (frameId !== null) {

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

            /*
             IMPORTANTE:

             O CTE não é automaticamente
             considerado sucesso.

             O módulo visual deverá registrar
             o resultado do jogador.

             Caso ainda não exista um resultado
             individual para este dispositivo,
             o sistema encerra a etapa visual
             sem inventar um sucesso.
            */

            finalizarTempoCTEVisual(
                overlay
            );

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
   FINALIZAR TEMPO VISUAL DO CTE
============================================================ */

function finalizarTempoCTEVisual(
    overlay
) {

    if (!mesaState.cte.ativo) {

        return;

    }



    /*
     O mesa-aventura
