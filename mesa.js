/* =========================================================
   MESA RPG 2.0
   PARTE 1/3

   Responsável por:
   - Estado da Mesa
   - Inicialização
   - Campanha
   - Mestre
   - Até 8 jogadores
   - Cards dos jogadores
   - Personagem confirmado
   - Status somente leitura
   - Estrutura preparada para Realtime
========================================================= */

"use strict";


/* =========================================================
   ESTADO PRINCIPAL
========================================================= */

window.rpgMesa = {

    campanha: null,

    mestre: null,

    jogadores: [],

    maxJogadores: 8,

    estado: "interface",

    moduloAtual: "interface",

    inicializada: false,

    realtimeConectado: false,

    modo: "normal"

};


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    iniciarMesa();

});


async function iniciarMesa() {

    try {

        mostrarNotificacaoMesa(
            "🎲 Inicializando Mesa..."
        );

        await aguardarAutenticacao();

        carregarCampanha();

        carregarMestre();

        carregarJogadores();

        criarCardsJogadores();

        atualizarEstadoVisual();

        configurarNavegacaoModulos();

        configurarPainelMestre();

        configurarModal();

        window.rpgMesa.inicializada = true;

        mostrarNotificacaoMesa(
            "🟢 Mesa inicializada."
        );

    } catch (erro) {

        console.error(
            "Erro ao iniciar Mesa:",
            erro
        );

        mostrarNotificacaoMesa(
            "⚠️ Não foi possível inicializar a Mesa."
        );

    }

}


/* =========================================================
   AGUARDAR AUTENTICAÇÃO
========================================================= */

function aguardarAutenticacao() {

    return new Promise(function (resolve) {

        let tentativas = 0;

        const limite = 50;

        const intervalo = setInterval(function () {

            tentativas++;

            if (
                window.rpgAuth &&
                (
                    window.rpgAuth.user ||
                    window.rpgAuth.campaign
                )
            ) {

                clearInterval(intervalo);

                resolve();

                return;

            }


            if (tentativas >= limite) {

                clearInterval(intervalo);

                /*
                 * A Mesa também pode ser aberta
                 * visualmente sem autenticação.
                 */

                resolve();

            }

        }, 200);

    });

}


/* =========================================================
   CAMPANHA
========================================================= */

function carregarCampanha() {

    let campanha = null;


    /*
     * Primeiro tenta utilizar a arquitetura
     * já existente no projeto.
     */

    if (
        typeof window.obterCampanhaAtiva ===
        "function"
    ) {

        campanha =
            window.obterCampanhaAtiva();

    }


    /*
     * Compatibilidade com rpgAuth.
     */

    if (
        !campanha &&
        window.rpgAuth
    ) {

        campanha =
            window.rpgAuth.campaign;

    }


    /*
     * Caso exista uma campanha válida.
     */

    if (campanha) {

        window.rpgMesa.campanha = campanha;

    }


    atualizarNomeCampanha();

}


/* =========================================================
   NOME DA CAMPANHA
========================================================= */

function atualizarNomeCampanha() {

    const elemento =
        document.getElementById(
            "mesa-campanha-nome"
        );


    if (!elemento) {
        return;
    }


    const campanha =
        window.rpgMesa.campanha;


    if (!campanha) {

        elemento.textContent =
            "Mesa RPG";

        return;

    }


    elemento.textContent =
        campanha.name ||
        campanha.nome ||
        campanha.title ||
        "Mesa RPG";

}


/* =========================================================
   MESTRE
========================================================= */

function carregarMestre() {

    let mestre = null;


    const campanha =
        window.rpgMesa.campanha;


    /*
     * Obtém o ID do mestre da campanha.
     */

    if (campanha) {

        mestre = {

            id:
                campanha.master_id ||
                campanha.mestre_id ||
                null,

            nome:
                campanha.master_name ||
                campanha.mestre_nome ||
                null

        };

    }


    /*
     * Caso o nome não esteja na campanha,
     * tenta obter os dados do usuário atual.
     */

    if (
        window.rpgAuth &&
        window.rpgAuth.profile
    ) {

        const perfil =
            window.rpgAuth.profile;


        if (!mestre) {

            mestre = {};

        }


        mestre.nome =
            mestre.nome ||
            perfil.username ||
            perfil.name ||
            null;

    }


    /*
     * Último fallback:
     * usuário autenticado.
     */

    if (
        window.rpgAuth &&
        window.rpgAuth.user
    ) {

        const usuario =
            window.rpgAuth.user;


        if (!mestre) {

            mestre = {};

        }


        mestre.id =
            mestre.id ||
            usuario.id ||
            null;


        mestre.nome =
            mestre.nome ||
            usuario.user_metadata?.username ||
            usuario.user_metadata?.name ||
            usuario.email ||
            "Mestre";

    }


    window.rpgMesa.mestre =
        mestre;


    atualizarNomeMestre();

}


/* =========================================================
   NOME DO MESTRE
========================================================= */

function atualizarNomeMestre() {

    const elemento =
        document.getElementById(
            "mesa-mestre-nome"
        );


    if (!elemento) {
        return;
    }


    const mestre =
        window.rpgMesa.mestre;


    if (!mestre) {

        elemento.textContent =
            "—";

        return;

    }


    elemento.textContent =
        mestre.nome ||
        "Mestre";

}


/* =========================================================
   JOGADORES
========================================================= */

function carregarJogadores() {

    let jogadores = [];


    /*
     * Primeiro tenta utilizar os membros
     * já carregados pelo sistema de autenticação.
     */

    if (
        window.rpgAuth &&
        Array.isArray(
            window.rpgAuth.campaignMembers
        )
    ) {

        jogadores =
            window.rpgAuth.campaignMembers
                .map(
                    transformarMembroEmJogador
                );

    }


    /*
     * Caso não existam membros, tenta utilizar
     * os personagens já carregados.
     */

    if (
        jogadores.length === 0 &&
        window.rpgAuth &&
        Array.isArray(
            window.rpgAuth.campaignCharacters
        )
    ) {

        jogadores =
            window.rpgAuth.campaignCharacters
                .map(
                    transformarPersonagemEmJogador
                );

    }


    /*
     * Limita a quantidade à capacidade da Mesa.
     */

    jogadores =
        jogadores.slice(
            0,
            window.rpgMesa.maxJogadores
        );


    window.rpgMesa.jogadores =
        jogadores;


}


/* =========================================================
   TRANSFORMAR MEMBRO
========================================================= */

function transformarMembroEmJogador(
    membro,
    indice
) {

    if (!membro) {

        return criarJogadorVazio(indice);

    }


    return {

        id:
            membro.user_id ||
            membro.id ||
            `jogador-${indice + 1}`,

        userId:
            membro.user_id ||
            null,

        nome:
            membro.username ||
            membro.nome ||
            `Jogador ${indice + 1}`,

        personagem:
            null,

        confirmado:
            false,

        status:
            criarStatusInicial(),

        online:
            false

    };

}


/* =========================================================
   TRANSFORMAR PERSONAGEM
========================================================= */

function transformarPersonagemEmJogador(
    personagem,
    indice
) {

    if (!personagem) {

        return criarJogadorVazio(indice);

    }


    return {

        id:
            personagem.user_id ||
            personagem.id ||
            `jogador-${indice + 1}`,

        userId:
            personagem.user_id ||
            null,

        nome:
            personagem.name ||
            personagem.nome ||
            `Jogador ${indice + 1}`,

        personagem:
            personagem,

        confirmado:
            Boolean(
                personagem.confirmado ||
                personagem.confirmed ||
                personagem.character_confirmed
            ),

        status:
            criarStatusDoPersonagem(
                personagem
            ),

        online:
            false

    };

}


/* =========================================================
   JOGADOR VAZIO
========================================================= */

function criarJogadorVazio(indice) {

    return {

        id:
            `vaga-${indice + 1}`,

        userId:
            null,

        nome:
            null,

        personagem:
            null,

        confirmado:
            false,

        status:
            criarStatusInicial(),

        online:
            false

    };

}


/* =========================================================
   STATUS INICIAL
========================================================= */

function criarStatusInicial() {

    return {

        hp: 0,

        hpMax: 0,

        mp: 0,

        mpMax: 0,

        est: 0,

        estMax: 0,

        fome: 0,

        fomeMax: 100,

        sede: 0,

        sedeMax: 100

    };

}


/* =========================================================
   STATUS DO PERSONAGEM
========================================================= */

function criarStatusDoPersonagem(
    personagem
) {

    const status =
        criarStatusInicial();


    if (!personagem) {

        return status;

    }


    status.hp =
        obterNumero(
            personagem.hp ??
            personagem.vida ??
            personagem.current_hp
        );


    status.hpMax =
        obterNumero(
            personagem.hp_max ??
            personagem.vida_max ??
            personagem.max_hp
        );


    status.mp =
        obterNumero(
            personagem.mp ??
            personagem.current_mp
        );


    status.mpMax =
        obterNumero(
            personagem.mp_max ??
            personagem.max_mp
        );


    status.est =
        obterNumero(
            personagem.est ??
            personagem.stamina ??
            personagem.current_est
        );


    status.estMax =
        obterNumero(
            personagem.est_max ??
            personagem.stamina_max ??
            personagem.max_est
        );


    status.fome =
        obterNumero(
            personagem.fome ??
            personagem.hunger
        );


    status.sede =
        obterNumero(
            personagem.sede ??
            personagem.thirst
        );


    return status;

}


/* =========================================================
   CONVERTER NÚMERO
========================================================= */

function obterNumero(valor) {

    const numero =
        Number(valor);


    if (
        Number.isFinite(numero)
    ) {

        return numero;

    }


    return 0;

}


/* =========================================================
   CRIAR CARDS
========================================================= */

function criarCardsJogadores() {

    const containers =
        document.querySelectorAll(
            ".jogadores-container, .jogadores-lateral"
        );


    containers.forEach(
        function (container) {

            container.innerHTML = "";


            for (
                let i = 0;
                i < window.rpgMesa.maxJogadores;
                i++
            ) {

                const jogador =
                    window.rpgMesa.jogadores[i];


                container.appendChild(
                    criarCardJogador(
                        jogador,
                        i
                    )
                );

            }

        }
    );

}


/* =========================================================
   CRIAR CARD INDIVIDUAL
========================================================= */

function criarCardJogador(
    jogador,
    indice
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "jogador-card";


    card.dataset.slot =
        String(indice + 1);


    /*
     * Vaga vazia
     */

    if (
        !jogador ||
        !jogador.nome
    ) {

        card.classList.add(
            "vazio"
        );


        card.innerHTML =
            `
                <span>
                    VAGA ${indice + 1}
                </span>
            `;


        return card;

    }


    /*
     * Card ocupado
     */

    if (jogador.confirmado) {

        card.classList.add(
            "confirmado"
        );

    }


    const personagem =
        jogador.personagem;


    const nome =
        personagem?.name ||
        personagem?.nome ||
        jogador.nome;


    const classe =
        personagem?.class ||
        personagem?.classe ||
        "Classe não definida";


    const status =
        jogador.status ||
        criarStatusInicial();


    card.innerHTML =
        `
            <span class="jogador-nome">
                ${escaparHTML(nome)}
            </span>

            <span class="jogador-classe">
                ${escaparHTML(classe)}
            </span>

            <div class="jogador-status">

                <span class="status-mini">
                    ❤️ ${status.hp}/${status.hpMax}
                </span>

                <span class="status-mini">
                    💧 ${status.mp}/${status.mpMax}
                </span>

            </div>
        `;


    return card;

}


/* =========================================================
   NAVEGAÇÃO DOS MÓDULOS
========================================================= */

function configurarNavegacaoModulos() {

    const botoes =
        document.querySelectorAll(
            ".modulo-btn"
        );


    botoes.forEach(
        function (botao) {

            botao.addEventListener(
                "click",
                function () {

                    const modulo =
                        botao.dataset.modulo;


                    if (!modulo) {

                        return;

                    }


                    abrirModulo(
                        modulo
                    );

                }
            );

        }
    );

}


/* =========================================================
   ABRIR MÓDULO
========================================================= */

function abrirModulo(
    modulo
) {

    const modulos =
        document.querySelectorAll(
            ".modulo-mesa"
        );


    modulos.forEach(
        function (elemento) {

            elemento.hidden =
                true;

        }
    );


    const alvo =
        document.getElementById(
            `modulo-${modulo}`
        );


    if (alvo) {

        alvo.hidden =
            false;

    }


    const botoes =
        document.querySelectorAll(
            ".modulo-btn"
        );


    botoes.forEach(
        function (botao) {

            botao.classList.toggle(
                "ativo",
                botao.dataset.modulo ===
                modulo
            );

        }
    );


    window.rpgMesa.moduloAtual =
        modulo;


    atualizarTituloModulo(
        modulo
    );


}


/* =========================================================
   TÍTULO DO MÓDULO
========================================================= */

function atualizarTituloModulo(
    modulo
) {

    const titulo =
        document.getElementById(
            "tela-mesa-titulo"
        );


    if (!titulo) {
        return;
    }


    const nomes = {

        interface:
            "Interface",

        personagem:
            "Personagem",

        status:
            "Status",

        afinidade:
            "Afinidade",

        inventario:
            "Inventário",

        mapa:
            "Mapa",

        combate:
            "Combate",

        cte:
            "CTE",

        dungeon:
            "Dungeon",

        boss:
            "BOSS"

    };


    titulo.textContent =
        nomes[modulo] ||
        "Mesa RPG";

}


/* =========================================================
   ESTADO DA MESA
========================================================= */

function definirEstadoMesa(
    estado
) {

    const estadosValidos = [

        "interface",

        "combat",

        "cte",

        "map",

        "boss"

    ];


    if (
        !estadosValidos.includes(
            estado
        )
    ) {

        return;

    }


    window.rpgMesa.estado =
        estado;


    atualizarEstadoVisual();

}


/* =========================================================
   ATUALIZAR ESTADO VISUAL
========================================================= */

function atualizarEstadoVisual() {

    const mesa =
        document.getElementById(
            "rpg-mesa"
        );


    const estado =
        document.getElementById(
            "mesa-estado"
        );


    const indicador =
        document.getElementById(
            "mesa-estado-texto"
        );


    if (!mesa || !estado) {

        return;

    }


    mesa.classList.remove(

        "modo-combate",

        "modo-cte",

        "modo-mapa",

        "modo-boss"

    );


    estado.classList.remove(

        "estado-interface",

        "estado-combate",

        "estado-cte",

        "estado-mapa"

    );


    const atual =
        window.rpgMesa.estado;


    const configuracoes = {

        interface: {

            classeEstado:
                "estado-interface",

            texto:
                "INTERFACE"

        },

        combat: {

            classeEstado:
                "estado-combate",

            classeMesa:
                "modo-combate",

            texto:
                "COMBATE"

        },

        cte: {

            classeEstado:
                "estado-cte",

            classeMesa:
                "modo-cte",

            texto:
                "CTE"

        },

        map: {

            classeEstado:
                "estado-mapa",

            classeMesa:
                "modo-mapa",

            texto:
                "MAPA"

        },

        boss: {

            classeEstado:
                "estado-combate",

            classeMesa:
                "modo-boss",

            texto:
                "BOSS"

        }

    };


    const config =
        configuracoes[atual];


    if (!config) {

        return;

    }


    estado.classList.add(
        config.classeEstado
    );


    if (config.classeMesa) {

        mesa.classList.add(
            config.classeMesa
        );

    }


    if (indicador) {

        indicador.textContent =
            config.texto;

    }

}


/* =========================================================
   PAINEL DO MESTRE
========================================================= */

function configurarPainelMestre() {

    const abrir =
        document.getElementById(
            "abrir-painel-mestre"
        );


    const fechar =
        document.getElementById(
            "fechar-painel-mestre"
        );


    const painel =
        document.getElementById(
            "painel-mestre"
        );


    if (
        abrir &&
        painel
    ) {

        abrir.addEventListener(
            "click",
            function () {

                painel.hidden =
                    false;

            }
        );

    }


    if (
        fechar &&
        painel
    ) {

        fechar.addEventListener(
            "click",
            function () {

                painel.hidden =
                    true;

            }
        );

    }


    configurarBotoesEstado();

}


/* =========================================================
   BOTÕES DE ESTADO DO MESTRE
========================================================= */

function configurarBotoesEstado() {

    const botoes =
        document.querySelectorAll(
            "[data-estado]"
        );


    botoes.forEach(
        function (botao) {

            botao.addEventListener(
                "click",
                function () {

                    const estado =
                        botao.dataset.estado;


                    definirEstadoMesa(
                        estado
                    );

                }
            );

        }
    );

}


/* =========================================================
   MODAL
========================================================= */

function configurarModal() {

    const modal =
        document.getElementById(
            "mesa-modal"
        );


    const fechar =
        document.getElementById(
            "fechar-mesa-modal"
        );


    if (!modal) {

        return;

    }


    if (fechar) {

        fechar.addEventListener(
            "click",
            fecharModal
        );

    }


    modal.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target ===
                modal
            ) {

                fecharModal();

            }

        }
    );

}


/* =========================================================
   ABRIR MODAL
========================================================= */

function abrirModal(
    conteudo
) {

    const modal =
        document.getElementById(
            "mesa-modal"
        );


    const body =
        document.getElementById(
            "mesa-modal-body"
        );


    if (!modal || !body) {

        return;

    }


    body.innerHTML =
        conteudo;


    modal.hidden =
        false;

}


/* =========================================================
   FECHAR MODAL
========================================================= */

function fecharModal() {

    const modal =
        document.getElementById(
            "mesa-modal"
        );


    if (!modal) {

        return;

    }


    modal.hidden =
        true;

}


/* =========================================================
   NOTIFICAÇÃO
========================================================= */

function mostrarNotificacaoMesa(
    mensagem
) {

    const container =
        document.getElementById(
            "mesa-notificacoes"
        );


    if (!container) {

        return;

    }


    const notificacao =
        document.createElement(
            "div"
        );


    notificacao.className =
        "mesa-notificacao";


    notificacao.textContent =
        mensagem;


    container.appendChild(
        notificacao
    );


    setTimeout(
        function () {

            notificacao.remove();

        },
        2500
    );

}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(
    valor
) {

    return String(
        valor ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ATUALIZAR JOGADORES
========================================================= */

function atualizarJogadores(
    jogadores
) {

    if (!Array.isArray(jogadores)) {

        return;

    }


    window.rpgMesa.jogadores =
        jogadores.slice(
            0,
            window.rpgMesa.maxJogadores
        );


    criarCardsJogadores();

}


/* =========================================================
   ATUALIZAR MESA
========================================================= */

function atualizarMesa() {

    carregarCampanha();

    carregarMestre();

    carregarJogadores();

    criarCardsJogadores();

    atualizarEstadoVisual();

}


/* =========================================================
   PREPARAÇÃO PARA REALTIME
========================================================= */

function prepararRealtime() {

    /*
     * Esta função não conecta ao Supabase ainda.
     *
     * Ela existe para manter a arquitetura
     * preparada para a próxima etapa.
     */

    window.rpgMesa.realtimeConectado =
        false;

}


/* =========================================================
   API PÚBLICA
========================================================= */

window.rpgMesaAPI = {

    iniciar:
        iniciarMesa,

    abrirModulo:
        abrirModulo,

    definirEstado:
        definirEstadoMesa,

    obterJogadores:
        function () {

            return window.rpgMesa.jogadores;

        },

    obterCampanha:
        function () {

            return window.rpgMesa.campanha;

        },

    obterMestre:
        function () {

            return window.rpgMesa.mestre;

        },

    atualizar:
        atualizarMesa,

    atualizarJogadores:
        atualizarJogadores,

    abrirModal:
        abrirModal,

    fecharModal:
        fecharModal,

    prepararRealtime:
        prepararRealtime

};


/* =========================================================
   FIM — PARTE 1/3
========================================================= */
/* =========================================================
   MESA RPG 2.0
   PARTE 2/3

   SISTEMAS:
   - Navegação dos módulos
   - Interface
   - Personagem
   - Status
   - Afinidade
   - Inventário
   - Combate
   - CTE
   - Dungeon
   - Mapa
========================================================= */


/* =========================================================
   CONFIGURAÇÃO DOS MÓDULOS
========================================================= */

const CONFIGURACAO_MODULOS_MESA = {

    interface: {
        titulo: "Interface"
    },

    personagem: {
        titulo: "Personagem"
    },

    status: {
        titulo: "Status"
    },

    afinidade: {
        titulo: "Afinidade"
    },

    inventario: {
        titulo: "Inventário"
    },

    mapa: {
        titulo: "Mapa"
    },

    combate: {
        titulo: "Combate"
    },

    cte: {
        titulo: "CTE"
    },

    dungeon: {
        titulo: "Dungeon"
    },

    boss: {
        titulo: "BOSS"
    }

};


/* =========================================================
   ABRIR MÓDULO — VERSÃO COMPLETA
========================================================= */

function abrirModuloCompleto(modulo) {

    if (
        !CONFIGURACAO_MODULOS_MESA[modulo]
    ) {

        return;

    }


    const modulos =
        document.querySelectorAll(
            ".modulo-mesa"
        );


    modulos.forEach(
        function (elemento) {

            elemento.hidden = true;

            elemento.classList.remove(
                "modulo-ativo"
            );

        }
    );


    const alvo =
        document.getElementById(
            `modulo-${modulo}`
        );


    if (!alvo) {

        return;

    }


    alvo.hidden = false;

    alvo.classList.add(
        "modulo-ativo"
    );


    const botoes =
        document.querySelectorAll(
            ".modulo-btn"
        );


    botoes.forEach(
        function (botao) {

            botao.classList.toggle(
                "ativo",
                botao.dataset.modulo === modulo
            );

        }
    );


    window.rpgMesa.moduloAtual =
        modulo;


    atualizarTituloModuloCompleto(
        modulo
    );


    /*
     * Alguns módulos precisam atualizar
     * seu conteúdo quando são abertos.
     */

    if (modulo === "personagem") {

        renderizarPersonagemMesa();

    }


    if (modulo === "status") {

        renderizarStatusMesa();

    }


    if (modulo === "afinidade") {

        renderizarAfinidadeMesa();

    }


    if (modulo === "inventario") {

        renderizarInventarioMesa();

    }


    if (modulo === "combate") {

        renderizarCombateMesa();

    }


    if (modulo === "cte") {

        renderizarCTEMesa();

    }


    if (modulo === "dungeon") {

        renderizarDungeonMesa();

    }


    if (modulo === "mapa") {

        renderizarMapaMesa();

    }

}


/* =========================================================
   TÍTULO
========================================================= */

function atualizarTituloModuloCompleto(
    modulo
) {

    const elemento =
        document.getElementById(
            "tela-mesa-titulo"
        );


    if (!elemento) {

        return;

    }


    elemento.textContent =
        CONFIGURACAO_MODULOS_MESA[
            modulo
        ]?.titulo ||
        "Mesa RPG";

}


/* =========================================================
   SUBSTITUIR A NAVEGAÇÃO DA PARTE 1
========================================================= */

function configurarNavegacaoCompleta() {

    const botoes =
        document.querySelectorAll(
            ".modulo-btn"
        );


    botoes.forEach(
        function (botao) {

            /*
             * Clona o botão para remover
             * listeners anteriores.
             */

            const novoBotao =
                botao.cloneNode(true);


            botao.parentNode.replaceChild(
                novoBotao,
                botao
            );


            novoBotao.addEventListener(
                "click",
                function () {

                    abrirModuloCompleto(
                        novoBotao.dataset.modulo
                    );

                }
            );

        }
    );

}


/* =========================================================
   INTERFACE
========================================================= */

function renderizarInterfaceMesa() {

    const modulo =
        document.getElementById(
            "modulo-interface"
        );


    if (!modulo) {

        return;

    }


    modulo.innerHTML =
        `
            <div class="modulo-placeholder">

                <span class="modulo-icone">
                    🎲
                </span>

                <h3>
                    Mesa de RPG
                </h3>

                <p>
                    A Mesa está pronta.
                </p>

            </div>
        `;

}


/* =========================================================
   PERSONAGEM
========================================================= */

function renderizarPersonagemMesa() {

    const container =
        document.getElementById(
            "personagem-conteudo"
        );


    if (!container) {

        return;

    }


    const personagem =
        obterMeuPersonagem();


    if (!personagem) {

        container.innerHTML =
            `
                <div class="mesa-dados-vazio">

                    <strong>
                        Nenhum personagem carregado
                    </strong>

                    <span>
                        O personagem aparecerá aqui
                        quando estiver disponível.
                    </span>

                </div>
            `;

        return;

    }


    const nome =
        personagem.name ||
        personagem.nome ||
        "Personagem";


    const raca =
        personagem.race ||
        personagem.raca ||
        "—";


    const classe =
        personagem.class ||
        personagem.classe ||
        "—";


    const afinidade =
        personagem.affinity ||
        personagem.afinidade ||
        "—";


    container.innerHTML =
        `
            <div class="mesa-personagem-card">

                <div class="mesa-dado">
                    <span>PERSONAGEM</span>
                    <strong>
                        ${escaparHTML(nome)}
                    </strong>
                </div>

                <div class="mesa-dados-grid">

                    <div class="mesa-dado">
                        <span>RAÇA</span>
                        <strong>
                            ${escaparHTML(raca)}
                        </strong>
                    </div>

                    <div class="mesa-dado">
                        <span>CLASSE</span>
                        <strong>
                            ${escaparHTML(classe)}
                        </strong>
                    </div>

                    <div class="mesa-dado">
                        <span>AFINIDADE</span>
                        <strong>
                            ${escaparHTML(afinidade)}
                        </strong>
                    </div>

                </div>

            </div>
        `;

}


/* =========================================================
   OBTER MEU PERSONAGEM
========================================================= */

function obterMeuPersonagem() {

    if (
        !window.rpgAuth
    ) {

        return null;

    }


    const usuario =
        window.rpgAuth.user;


    const personagens =
        window.rpgAuth.campaignCharacters;


    if (
        !Array.isArray(personagens) ||
        personagens.length === 0
    ) {

        return null;

    }


    if (!usuario) {

        return personagens[0];

    }


    return (
        personagens.find(
            function (personagem) {

                return (
                    personagem.user_id ===
                    usuario.id
                );

            }
        ) ||
        personagens[0]
    );

}


/* =========================================================
   STATUS
========================================================= */

function renderizarStatusMesa() {

    const container =
        document.getElementById(
            "status-conteudo"
        );


    if (!container) {

        return;

    }


    const personagem =
        obterMeuPersonagem();


    if (!personagem) {

        container.innerHTML =
            `
                <div class="mesa-dados-vazio">

                    <strong>
                        Status indisponível
                    </strong>

                    <span>
                        Nenhum personagem carregado.
                    </span>

                </div>
            `;

        return;

    }


    const status =
        criarStatusDoPersonagem(
            personagem
        );


    container.innerHTML =
        `
            <div class="mesa-status-grid">

                ${criarBarraStatus(
                    "❤️",
                    "HP",
                    status.hp,
                    status.hpMax
                )}

                ${criarBarraStatus(
                    "💧",
                    "MP",
                    status.mp,
                    status.mpMax
                )}

                ${criarBarraStatus(
                    "⚡",
                    "EST",
                    status.est,
                    status.estMax
                )}

            </div>
        `;

}


/* =========================================================
   BARRA DE STATUS
========================================================= */

function criarBarraStatus(
    icone,
    nome,
    atual,
    maximo
) {

    const porcentagem =
        maximo > 0
            ? Math.max(
                0,
                Math.min(
                    100,
                    (atual / maximo) * 100
                )
            )
            : 0;


    return `
        <div class="mesa-status-item">

            <div class="mesa-status-header">

                <span>
                    ${icone} ${nome}
                </span>

                <strong>
                    ${atual}/${maximo}
                </strong>

            </div>

            <div class="mesa-status-bar">

                <div
                    class="mesa-status-progresso"
                    style="width:${porcentagem}%"
                ></div>

            </div>

        </div>
    `;

}


/* =========================================================
   AFINIDADE
========================================================= */

function renderizarAfinidadeMesa() {

    const container =
        document.getElementById(
            "afinidade-conteudo"
        );


    if (!container) {

        return;

    }


    const personagem =
        obterMeuPersonagem();


    const afinidade =
        personagem?.affinity ||
        personagem?.afinidade ||
        "Nenhuma definida";


    container.innerHTML =
        `
            <div class="mesa-afinidade-card">

                <span class="mesa-afinidade-icone">
                    ✨
                </span>

                <span class="mesa-label">
                    AFINIDADE
                </span>

                <strong>
                    ${escaparHTML(
                        afinidade
                    )}
                </strong>

            </div>
        `;

}


/* =========================================================
   INVENTÁRIO
========================================================= */

function renderizarInventarioMesa() {

    const container =
        document.getElementById(
            "inventario-conteudo"
        );


    if (!container) {

        return;

    }


    const personagem =
        obterMeuPersonagem();


    const inventario =
        personagem?.inventory ||
        personagem?.inventario ||
        [];


    if (
        !Array.isArray(inventario) ||
        inventario.length === 0
    ) {

        container.innerHTML =
            `
                <div class="mesa-dados-vazio">

                    <span class="modulo-icone">
                        🎒
                    </span>

                    <strong>
                        Inventário vazio
                    </strong>

                    <span>
                        Nenhum item disponível.
                    </span>

                </div>
            `;

        return;

    }


    container.innerHTML =
        `
            <div class="mesa-inventario-lista">

                ${inventario.map(
                    function (item) {

                        const nome =
                            item.name ||
                            item.nome ||
                            "Item";

                        const quantidade =
                            item.quantity ||
                            item.quantidade ||
                            1;


                        return `
                            <div
                                class="mesa-item-inventario"
                            >

                                <span>
                                    🎒
                                </span>

                                <strong>
                                    ${escaparHTML(nome)}
                                </strong>

                                <small>
                                    x${quantidade}
                                </small>

                            </div>
                        `;

                    }
                ).join("")}

            </div>
        `;

}


/* =========================================================
   COMBATE
========================================================= */

const estadoCombateMesa = {

    ativo: false,

    turno: 1,

    alvo: null,

    log: []

};


function renderizarCombateMesa() {

    const container =
        document.getElementById(
            "combate-conteudo"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        `
            <div class="mesa-combate">

                <div class="mesa-combate-status">

                    <span>
                        ⚔️ COMBATE
                    </span>

                    <strong>
                        ${
                            estadoCombateMesa.ativo
                                ? "EM ANDAMENTO"
                                : "AGUARDANDO"
                        }
                    </strong>

                </div>


                <div class="mesa-combate-acoes">

                    <button
                        type="button"
                        data-combate="iniciar"
                    >
                        ⚔️ Iniciar
                    </button>

                    <button
                        type="button"
                        data-combate="atacar"
                    >
                        🗡️ Ataque
                    </button>

                    <button
                        type="button"
                        data-combate="proximo-turno"
                    >
                        ⏭️ Próximo turno
                    </button>

                    <button
                        type="button"
                        data-combate="encerrar"
                    >
                        🛑 Encerrar
                    </button>

                </div>


                <div
                    id="mesa-combate-log"
                    class="mesa-combate-log"
                ></div>

            </div>
        `;


    configurarBotoesCombate();

    atualizarLogCombate();

}


/* =========================================================
   BOTÕES DE COMBATE
========================================================= */

function configurarBotoesCombate() {

    document
        .querySelectorAll(
            "[data-combate]"
        )
        .forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function () {

                        executarAcaoCombate(
                            botao.dataset.combate
                        );

                    }
                );

            }
        );

}


/* =========================================================
   AÇÃO DE COMBATE
========================================================= */

function executarAcaoCombate(
    acao
) {

    if (
        acao === "iniciar"
    ) {

        estadoCombateMesa.ativo =
            true;

        estadoCombateMesa.turno =
            1;

        adicionarLogCombate(
            "⚔️ Combate iniciado."
        );

        definirEstadoMesa(
            "combat"
        );

    }


    if (
        acao === "atacar"
    ) {

        if (
            !estadoCombateMesa.ativo
        ) {

            adicionarLogCombate(
                "⚠️ Nenhum combate ativo."
            );

            return;

        }


        adicionarLogCombate(
            "🗡️ Ataque realizado."
        );

    }


    if (
        acao === "proximo-turno"
    ) {

        if (
            !estadoCombateMesa.ativo
        ) {

            return;

        }


        estadoCombateMesa.turno++;

        adicionarLogCombate(
            `⏭️ Turno ${estadoCombateMesa.turno}.`
        );

    }


    if (
        acao === "encerrar"
    ) {

        estadoCombateMesa.ativo =
            false;

        adicionarLogCombate(
            "🛑 Combate encerrado."
        );

        definirEstadoMesa(
            "interface"
        );

    }


    renderizarCombateMesa();

}


/* =========================================================
   LOG DE COMBATE
========================================================= */

function adicionarLogCombate(
    mensagem
) {

    estadoCombateMesa.log.push(
        mensagem
    );


    if (
        estadoCombateMesa.log.length > 30
    ) {

        estadoCombateMesa.log.shift();

    }

}


function atualizarLogCombate() {

    const log =
        document.getElementById(
            "mesa-combate-log"
        );


    if (!log) {

        return;

    }


    log.innerHTML =
        estadoCombateMesa.log
            .map(
                function (mensagem) {

                    return `
                        <div>
                            ${escaparHTML(mensagem)}
                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   CTE
========================================================= */

const estadoCTEMesa = {

    ativo: false,

    tempo: 10,

    intervalo: null,

    pergunta: "",

    opcoes: [],

    resposta: null

};


/* =========================================================
   RENDERIZAR CTE
========================================================= */

function renderizarCTEMesa() {

    const container =
        document.getElementById(
            "cte-conteudo"
        );


    if (!container) {

        return;

    }


    if (
        !estadoCTEMesa.ativo
    ) {

        container.innerHTML =
            `
                <div class="cte-placeholder">

                    <span class="modulo-icone">
                        ⚡
                    </span>

                    <h3>
                        CTE
                    </h3>

                    <p>
                        Nenhum evento em andamento.
                    </p>

                </div>
            `;

        return;

    }


    container.innerHTML =
        `
            <div class="mesa-cte">

                <div class="mesa-cte-topo">

                    <span>
                        ⚡ EVENTO CTE
                    </span>

                    <strong id="cte-contador">
                        ${estadoCTEMesa.tempo}
                    </strong>

                </div>


                <div class="mesa-cte-pergunta">

                    <h3>
                        ${
                            escaparHTML(
                                estadoCTEMesa.pergunta ||
                                "Escolha uma opção."
                            )
                        }
                    </h3>

                </div>


                <div
                    class="mesa-cte-opcoes"
                >

                    ${
                        estadoCTEMesa.opcoes
                            .map(
                                function (
                                    opcao,
                                    indice
                                ) {

                                    return `
                                        <button
                                            type="button"
                                            data-cte-opcao="${indice}"
                                        >
                                            ${escaparHTML(opcao)}
                                        </button>
                                    `;

                                }
                            )
                            .join("")
                    }

                </div>

            </div>
        `;


    document
        .querySelectorAll(
            "[data-cte-opcao]"
        )
        .forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function () {

                        responderCTE(
                            Number(
                                botao.dataset.cteOpcao
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================================
   INICIAR CTE
========================================================= */

function iniciarCTE(
    pergunta,
    opcoes,
    tempo
) {

    encerrarCTE();


    estadoCTEMesa.ativo =
        true;

    estadoCTEMesa.pergunta =
        pergunta ||
        "Escolha uma opção.";

    estadoCTEMesa.opcoes =
        Array.isArray(opcoes)
            ? opcoes
            : [
                "Opção 1",
                "Opção 2"
            ];

    estadoCTEMesa.tempo =
        Number(tempo) > 0
            ? Number(tempo)
            : 10;

    estadoCTEMesa.resposta =
        null;


    definirEstadoMesa(
        "cte"
    );


    abrirModuloCompleto(
        "cte"
    );


    renderizarCTEMesa();


    estadoCTEMesa.intervalo =
        setInterval(
            function () {

                estadoCTEMesa.tempo--;


                atualizarContadorCTE();


                if (
                    estadoCTEMesa.tempo <= 0
                ) {

                    encerrarCTE(
                        "⏱️ Tempo esgotado."
                    );

                }

            },
            1000
        );

}


/* =========================================================
   CONTADOR CTE
========================================================= */

function atualizarContadorCTE() {

    const contador =
        document.getElementById(
            "cte-contador"
        );


    if (
        contador
    ) {

        contador.textContent =
            String(
                estadoCTEMesa.tempo
            );

    }

}


/* =========================================================
   RESPONDER CTE
========================================================= */

function responderCTE(
    indice
) {

    if (
        !estadoCTEMesa.ativo
    ) {

        return;

    }


    const opcao =
        estadoCTEMesa.opcoes[indice];


    estadoCTEMesa.resposta =
        opcao ||
        null;


    mostrarNotificacaoMesa(
        `⚡ Escolha: ${opcao}`
    );


    encerrarCTE(
        "⚡ CTE encerrado."
    );

}


/* =========================================================
   ENCERRAR CTE
========================================================= */

function encerrarCTE(
    mensagem
) {

    if (
        estadoCTEMesa.intervalo
    ) {

        clearInterval(
            estadoCTEMesa.intervalo
        );

        estadoCTEMesa.intervalo =
            null;

    }


    const estavaAtivo =
        estadoCTEMesa.ativo;


    estadoCTEMesa.ativo =
        false;


    if (
        estavaAtivo &&
        mensagem
    ) {

        mostrarNotificacaoMesa(
            mensagem
        );

    }


    renderizarCTEMesa();

}


/* =========================================================
   DUNGEON
========================================================= */

const estadoDungeonMesa = {

    ativo: false,

    nome: "",

    descricao: "",

    andar: 1

};


function renderizarDungeonMesa() {

    const container =
        document.getElementById(
            "dungeon-conteudo"
        );


    if (!container) {

        return;

    }


    if (
        !estadoDungeonMesa.ativo
    ) {

        container.innerHTML =
            `
                <div class="dungeon-placeholder">

                    <span class="modulo-icone">
                        🏰
                    </span>

                    <h3>
                        Dungeon
                    </h3>

                    <p>
                        Nenhuma dungeon ativa.
                    </p>

                </div>
            `;

        return;

    }


    container.innerHTML =
        `
            <div class="mesa-dungeon-card">

                <span class="modulo-icone">
                    🏰
                </span>

                <span class="mesa-label">
                    DUNGEON
                </span>

                <h3>
                    ${escaparHTML(
                        estadoDungeonMesa.nome
                    )}
                </h3>

                <p>
                    ${escaparHTML(
                        estadoDungeonMesa.descricao
                    )}
                </p>

                <strong>
                    Andar ${estadoDungeonMesa.andar}
                </strong>

            </div>
        `;

}


/* =========================================================
   CRIAR DUNGEON
========================================================= */

function criarDungeon(
    nome,
    descricao
) {

    estadoDungeonMesa.ativo =
        true;

    estadoDungeonMesa.nome =
        nome ||
        "Dungeon";

    estadoDungeonMesa.descricao =
        descricao ||
        "Uma nova aventura começou.";

    estadoDungeonMesa.andar =
        1;


    abrirModuloCompleto(
        "dungeon"
    );


    renderizarDungeonMesa();


    mostrarNotificacaoMesa(
        "🏰 Dungeon criada."
    );

}


/* =========================================================
   MAPA
========================================================= */

function renderizarMapaMesa() {

    const container =
        document.getElementById(
            "mapa-conteudo"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        `
            <div class="mesa-mapa-card">

                <span class="modulo-icone">
                    🗺️
                </span>

                <h3>
                    Mapa da Mesa
                </h3>

                <p>
                    Área preparada para o mapa
                    do Mestre.
                </p>

                <button
                    type="button"
                    id="abrir-mapa-mestre"
                >
                    🗺️ Abrir mapa
                </button>

            </div>
        `;


    const botao =
        document.getElementById(
            "abrir-mapa-mestre"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            function () {

                definirEstadoMesa(
                    "map"
                );

                mostrarNotificacaoMesa(
                    "🗺️ Modo mapa ativado."
                );

            }
        );

    }

}


/* =========================================================
   INICIALIZAÇÃO DA PARTE 2
========================================================= */

function iniciarParte2Mesa() {

    configurarNavegacaoCompleta();

    renderizarInterfaceMesa();

    prepararRealtime();

}


/* =========================================================
   EXECUTAR
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarParte2Mesa
    );

} else {

    iniciarParte2Mesa();

}


/* =========================================================
   API — PARTE 2
========================================================= */

window.rpgMesaAPI.abrirModulo =
    abrirModuloCompleto;


window.rpgMesaAPI.iniciarCombate =
    function () {

        executarAcaoCombate(
            "iniciar"
        );

        abrirModuloCompleto(
            "combate"
        );

    };


window.rpgMesaAPI.iniciarCTE =
    iniciarCTE;


window.rpgMesaAPI.encerrarCTE =
    encerrarCTE;


window.rpgMesaAPI.criarDungeon =
    criarDungeon;


window.rpgMesaAPI.renderizar =
    function () {

        renderizarInterfaceMesa();

        renderizarPersonagemMesa();

        renderizarStatusMesa();

        renderizarAfinidadeMesa();

        renderizarInventarioMesa();

        renderizarCombateMesa();

        renderizarCTEMesa();

        renderizarDungeonMesa();

        renderizarMapaMesa();

    };


/* =========================================================
   FIM — PARTE 2/3
========================================================= */
