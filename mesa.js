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
 - Controlar o modo atual da mesa
 - Controlar a área central
 - Encaminhar ações de aventura
 - Controlar CTE
 - Manter os 8 lugares da mesa
 - Sincronizar informações básicas da campanha
 - Conversar com mesa-jogadores.js
 - Conversar com mesa-aventura.js

 NÃO É RESPONSABILIDADE:

 - Menu de configurações do Mestre
 - Botão de configurações
 - Botões gerais da interface
 - HP individual
 - Inventário
 - Habilidades
 - Passivas
 - Status individuais

 O menu do Mestre pertence ao:
     config-mesa.js

 Os botões gerais pertencem ao:
     button-mesa.js

 O CTE permanece INTEIRO neste arquivo porque
 é um sistema global da Mesa.
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

     Estes objetos NÃO são os personagens.

     São apenas os assentos.

     Os dados reais dos personagens vêm do
     sistema de jogadores / Supabase.
    */

    jogadores:

        Array.from(

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


    /*
     CTE GLOBAL DA MESA

     O Mestre apenas dispara o evento.

     A lógica do CTE permanece aqui.
    */

    cte: {

        ativo: false,

        dificuldade:
            MESA_CONFIG.cte.dificuldadePadrao,

        duracao:
            MESA_CONFIG.cte.dificuldades.normal,

        quantidade:
            MESA_CONFIG.cte.quantidadePadrao,

        resultados: [],

        inicio: null

    }

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

    nomeCampanha: null

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


    mesaState.inicializado = true;


    carregarContextoUsuario();

    registrarEventos();

    atualizarCampanhaVisual();

    atualizarModoVisual();

    atualizarAssentos();

    inicializarSubmodulos();


    document.dispatchEvent(

        new CustomEvent(
            "mesa:inicializada",
            {
                detail: mesaState
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
            auth.user.id || null;


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
            campanha.id || null;


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


    mesaState.usuario.isMaster = Boolean(

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
                JSON.parse(salvo);


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
                        mesa.masterId ||
                        mesa.master_id ||
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
                JSON.parse(salvo);


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
   EVENTOS DO CORE
============================================================ */

function registrarEventos() {

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
                detail: mesaState
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

                        mesaState.batalha
                            .participantes,

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
 CTE É GLOBAL.

 Ele NÃO troca o modo da mesa.

 Ele aparece como uma camada sobre a tela atual.

 O Mestre dispara o CTE através do
 config-mesa.js.

 A execução permanece completamente
 dentro do CORE.
*/

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
     O overlay fica dentro da tela
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
            Date.now() - inicio;


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

    if (!mesaState.cte.ativo) {

        return;

    }


    /*
     Resultado básico.

     A mecânica específica poderá ser
     expandida futuramente.
    */

    const resultado = {

        sucesso: true,

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
        typeof conteudo === "string"
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
   CARDS / ASSENTOS
============================================================ */

/*
 Os cards já existem no HTML.

 Este arquivo não cria personagens falsos.

 Apenas atualiza a ocupação dos oito lugares.
*/

function atualizarAssentos() {

    if (!MesaUI.jogadores) {

        return;

    }


    const cards =
        Array.from(

            MesaUI.jogadores.querySelectorAll(
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


    /*
     Atualiza somente dados de ocupação.
    */

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


    /*
     Estado visual.
    */

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
   CLIQUE NO JOGADOR
============================================================ */

function tratarCliqueJogador(
    event
) {

    const card =
        event.target.closest(
            "[data-player]"
        );


    if (!card) {

        return;

    }


    const slot =
        Number(
            card.dataset.player
        );


    if (

        !slot ||

        slot < 1 ||

        slot > 8

    ) {

        return;

    }


    const jogador =
        mesaState.jogadores[
            slot - 1
        ];


    /*
     Evento global.

     Outros módulos podem utilizar:

     - abrir interação
     - abrir chat privado
     - mostrar status público
     - selecionar alvo
    */

    document.dispatchEvent(

        new CustomEvent(
            "mesa:jogadorSelecionado",
            {

                detail: {

                    slot,

                    jogador,

                    ehProprioJogador:

                        Number(
                            mesaState
                                .jogadorAtual
                                .slot
                        ) === slot

                }

            }
        )

    );


    /*
     Se for o próprio jogador,
     podemos abrir a ficha normalmente.
    */

    if (

        Number(
            mesaState
                .jogadorAtual
                .slot
        ) === slot

    ) {

        if (

            typeof window.abrirFichaJogador ===
            "function"

        ) {

            window.abrirFichaJogador(
                slot
            );

        }

        return;

    }


    /*
     Jogador de outra pessoa:

     Não abrimos a ficha privada.

     Apenas emitimos o evento.
    */

    document.dispatchEvent(

        new CustomEvent(
            "mesa:interacaoJogador",
            {

                detail: {

                    origem:

                        mesaState
                            .jogadorAtual
                            .slot,

                    alvo:
                        slot

                }

            }
        )

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


    carregarContextoUsuario();

    atualizarCampanhaVisual();

}



/* ============================================================
   INICIALIZAR SUBMÓDULOS
============================================================ */

function inicializarSubmodulos() {

    /*
     mesa-jogadores.js e mesa-aventura.js
     possuem seus próprios listeners.

     Aqui apenas avisamos que o CORE terminou.
    */

    document.dispatchEvent(

        new CustomEvent(
            "mesa:corePronto",
            {

                detail: mesaState

            }

        )

    );

}



/* ============================================================
   RECUPERAR ESTADO
============================================================ */

function obterEstadoMesa() {

    return mesaState;

}



/* ============================================================
   VERIFICAR MESTRE
============================================================ */

function usuarioEhMestre() {

    return (

        mesaState.usuario.isMaster ===
        true

    );

}



/* ============================================================
   VERIFICAR JOGADOR
============================================================ */

function usuarioEhJogador() {

    return (

        mesaState.usuario.isPlayer ===
        true

    );

}



/* ============================================================
   OBTER SLOT ATUAL
============================================================ */

function obterSlotAtual() {

    return (

        mesaState.jogadorAtual.slot ||

        null

    );

}



/* ============================================================
   OBTER CAMPANHA
============================================================ */

function obterCampanhaMesa() {

    return {

        ...mesaState.campanha

    };

}



/* ============================================================
   ATUALIZAR JOGADORES
============================================================ */

function definirAssentos(
    jogadores = []
) {

    /*
     Limpa somente os assentos.

     Não apaga dados de personagens no banco.
    */

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

                            Number(item.slot) ===
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
   RESETAR MESA VISUAL
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

    /*
     Estado
    */

    estado:
        obterEstadoMesa,


    /*
     Campanha
    */

    campanha:
        obterCampanhaMesa,

    sincronizarCampanha,


    /*
     Usuário
    */

    usuarioEhMestre,

    usuarioEhJogador,


    /*
     Jogador atual
    */

    obterSlotAtual,


    /*
     Assentos
    */

    definirAssentos,

    atualizarAssentos,


    /*
     Modos
    */

    mudarModo,

    voltarParaMesaNormal,


    /*
     Aventura
    */

    abrirAventura,


    /*
     Batalha
    */

    iniciarBatalha,

    finalizarBatalha,


    /*
     Boss
    */

    iniciarBoss,


    /*
     CTE

     Continua sendo responsabilidade
     do CORE.
    */

    iniciarCTE,

    limparCTE,


    /*
     Interface central

     Disponibilizada para outros módulos.
    */

    mostrarTela,

    mostrarTelaPrincipal,


    /*
     Reset
    */

    resetarMesaVisual

};



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
