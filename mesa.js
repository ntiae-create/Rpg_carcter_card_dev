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
