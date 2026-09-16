// ==========================================
// MESA ONLINE — RPG CHARACTER CARD
// ==========================================

(function () {

    "use strict";


    // ==========================================
    // ESTADO DA MESA
    // ==========================================

    window.rpgMesa = {

        campaign: null,

        master: null,

        players: [],

        maxPlayers: 8,

        initialized: false,

        mode: "campaign"

    };


    // ==========================================
    // INICIALIZAR MESA
    // ==========================================

    async function iniciarMesa() {

        console.log(
            "🎲 Mesa.js carregado."
        );


        // --------------------------------------
        // ESPERAR AUTENTICAÇÃO
        // --------------------------------------

        let tentativas = 0;

        const limite = 40;


        while (
            tentativas < limite
        ) {

            if (
                window.rpgAuth &&
                window.rpgAuth.user
            ) {

                break;

            }


            await esperar(250);

            tentativas++;

        }


        // --------------------------------------
        // VERIFICAR USUÁRIO
        // --------------------------------------

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            console.log(
                "ℹ️ Mesa.js: nenhum usuário autenticado."
            );

            return;

        }


        // --------------------------------------
        // ESPERAR CAMPANHA
        // --------------------------------------

        let campanha = null;

        let tentativasCampanha = 0;

        const limiteCampanha = 40;


        while (
            !campanha &&
            tentativasCampanha < limiteCampanha
        ) {

            // ----------------------------------
            // TENTAR CAMPAIGN.JS
            // ----------------------------------

            if (
                window.obterCampanhaAtiva
            ) {

                campanha =
                    window.obterCampanhaAtiva();

            }


            // ----------------------------------
            // FALLBACK: AUTH.JS
            // ----------------------------------

            if (
                !campanha &&
                window.rpgAuth &&
                window.rpgAuth.campaign
            ) {

                campanha =
                    window.rpgAuth.campaign;

            }


            if (!campanha) {

                await esperar(250);

            }


            tentativasCampanha++;

        }


        // --------------------------------------
        // VERIFICAR CAMPANHA
        // --------------------------------------

        if (!campanha) {

            console.log(
                "ℹ️ Mesa.js: nenhuma campanha disponível."
            );

            return;

        }


        // --------------------------------------
        // SALVAR CAMPANHA
        // --------------------------------------

        window.rpgMesa.campaign =
            campanha;


        window.rpgMesa.master =
            campanha.master_id;


        // --------------------------------------
        // CRIAR MESA
        // --------------------------------------

        criarInterfaceMesa();


        // --------------------------------------
        // ESPERAR DADOS DOS JOGADORES
        // --------------------------------------

        await carregarJogadoresMesa();


        window.rpgMesa.initialized =
            true;


        console.log(
            "✅ Mesa.js: mesa inicializada.",
            campanha
        );

    }


    // ==========================================
    // ESPERAR
    // ==========================================

    function esperar(tempo) {

        return new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    tempo
                );

            }
        );

    }


    // ==========================================
    // CRIAR INTERFACE DA MESA
    // ==========================================

    function criarInterfaceMesa() {

        // --------------------------------------
        // EVITAR DUPLICAÇÃO
        // --------------------------------------

        if (
            document.getElementById(
                "online-table-panel"
            )
        ) {

            return;

        }


        const painel =
            document.createElement("section");


        painel.id =
            "online-table-panel";


        // --------------------------------------
        // CLASSES PRINCIPAIS DA MESA
        // --------------------------------------

        painel.classList.add(
            "mesa-fullscreen"
        );


        painel.innerHTML = `

            <!-- =================================
                 CABEÇALHO
            ================================== -->

            <div class="online-table-header">

                <div>

                    <span class="online-table-label">
                        🎲 MESA ONLINE
                    </span>

                    <h2 id="online-table-name">
                        ${escaparHTML(
                            window.rpgMesa.campaign.name
                        )}
                    </h2>

                </div>


                <div class="online-table-status">

                    🟢 CAMPANHA

                </div>

            </div>


            <!-- =================================
                 MESA
            ================================== -->

            <div class="rpg-table">


                <!-- =================================
                     MESTRE — CABECEIRA
                ================================== -->

                <div class="table-head">

                    <small>MESTRE</small>

                    <strong>
                        ${escaparHTML(
                            obterNomeMestre()
                        )}
                    </strong>

                </div>


                <!-- =================================
                     JOGADORES — ESQUERDA
                ================================== -->

                <div class="table-side left">

                    ${criarAssento(1)}

                    ${criarAssento(2)}

                    ${criarAssento(3)}

                    ${criarAssento(4)}

                </div>


                <!-- =================================
                     JOGADORES — DIREITA
                ================================== -->

                <div class="table-side right">

                    ${criarAssento(5)}

                    ${criarAssento(6)}

                    ${criarAssento(7)}

                    ${criarAssento(8)}

                </div>


                <!-- =================================
                     CENTRO DA MESA
                ================================== -->

                <div class="table-center">


                    <!-- CHAT -->

                    <div class="table-chat">

                        <div class="table-chat-title">

                            💬 CHAT DA MESA

                        </div>


                        <div
                            id="online-table-chat-messages"
                            class="table-chat-messages"
                        >

                            A mesa está pronta.
                            Aguardando os jogadores...

                        </div>

                    </div>


                    <!-- =================================
                         MÓDULOS
                    ================================== -->

                    <div class="table-modules">


                        <button
                            type="button"
                            class="table-module"
                            data-table-module="character"
                        >

                            <span>🎴</span>

                            <small>
                                PERSONAGEM
                            </small>

                        </button>


                        <button
                            type="button"
                            class="table-module"
                            data-table-module="status"
                        >

                            <span>❤️</span>

                            <small>
                                STATUS
                            </small>

                        </button>


                        <button
                            type="button"
                            class="table-module"
                            data-table-module="affinity"
                        >

                            <span>✨</span>

                            <small>
                                AFINIDADES
                            </small>

                        </button>


                        <button
                            type="button"
                            class="table-module"
                            data-table-module="inventory"
                        >

                            <span>🎒</span>

                            <small>
                                INVENTÁRIO
                            </small>

                        </button>


                    </div>


                </div>


            </div>


            <!-- =================================
                 ÁREA DE JOGADORES
            ================================== -->

            <div class="online-table-players">

                <div class="online-table-section-title">

                    <span>
                        JOGADORES
                    </span>

                    <strong id="online-table-player-count">
                        0 / 8
                    </strong>

                </div>


                <div
                    id="online-table-player-list"
                    class="online-table-player-list"
                >

                    <div class="online-table-empty">

                        Nenhum jogador entrou na mesa.

                    </div>

                </div>

            </div>

        `;


        // --------------------------------------
        // PREPARAÇÃO PARA TELA CHEIA
        // --------------------------------------

        painel.style.width =
            "100%";

        painel.style.minWidth =
            "100%";

        painel.style.minHeight =
            "100%";

        painel.style.margin =
            "0";

        painel.style.boxSizing =
            "border-box";


        // --------------------------------------
        // ADICIONAR AO BODY
        // --------------------------------------

        document.body.appendChild(
            painel
        );


        configurarModulosMesa();

    }


    // ==========================================
    // CRIAR ASSENTO
    // ==========================================

    function criarAssento(numero) {

        return `

            <div
                class="table-seat"
                data-seat="${numero}"
                data-player-id=""
                data-character-id=""
            >

                <div class="table-seat-content">

                    <strong class="table-seat-number">
                        LUGAR ${numero}
                    </strong>

                    <small class="table-seat-character">
                        VAZIO
                    </small>

                </div>

            </div>

        `;

    }


    // ==========================================
    // CARREGAR JOGADORES DA MESA
    // ==========================================

    async function carregarJogadoresMesa() {

        // --------------------------------------
        // ESPERAR AUTH.JS TERMINAR OS DADOS
        // --------------------------------------

        let tentativas = 0;

        const limite = 40;


        while (
            tentativas < limite
        ) {

            if (
                window.rpgAuth &&
                Array.isArray(
                    window.rpgAuth.campaignCharacters
                )
            ) {

                if (
                    window.rpgAuth.campaignCharacters.length > 0 ||
                    tentativas >= 4
                ) {

                    break;

                }

            }


            await esperar(250);

            tentativas++;

        }


        // --------------------------------------
        // OBTER MEMBROS
        // --------------------------------------

        const membros =
            Array.isArray(
                window.rpgAuth?.campaignMembers
            )
                ? window.rpgAuth.campaignMembers
                : [];


        // --------------------------------------
        // OBTER PERSONAGENS
        // --------------------------------------

        const personagens =
            Array.isArray(
                window.rpgAuth?.campaignCharacters
            )
                ? window.rpgAuth.campaignCharacters
                : [];


        console.log(
            "👥 Membros disponíveis para a mesa:",
            membros
        );


        console.log(
            "🎴 Personagens disponíveis para a mesa:",
            personagens
        );


        // --------------------------------------
        // CRIAR JOGADORES
        // --------------------------------------

        const jogadores = [];


        for (
            const membro
            of membros
        ) {

            if (!membro?.user_id) {

                continue;

            }


            // ----------------------------------
            // NÃO COLOCAR O MESTRE COMO JOGADOR
            // ----------------------------------

            if (
                membro.user_id ===
                window.rpgMesa.master
            ) {

                continue;

            }


            // ----------------------------------
            // PROCURAR PERSONAGEM
            // ----------------------------------

            const personagem =
                personagens.find(
                    function (item) {

                        return (
                            item &&
                            item.user_id ===
                            membro.user_id
                        );

                    }
                );


            // ----------------------------------
            // SE NÃO POSSUI PERSONAGEM
            // ----------------------------------

            if (!personagem) {

                jogadores.push({

                    playerId:
                        membro.user_id,

                    characterId:
                        "",

                    character:
                        null

                });


                continue;

            }


            jogadores.push({

                playerId:
                    membro.user_id,

                characterId:
                    personagem.id || "",

                character:
                    personagem

            });

        }


        // --------------------------------------
        // SALVAR ESTADO
        // --------------------------------------

        window.rpgMesa.players =
            jogadores;


        console.log(
            "🎲 Jogadores da mesa:",
            window.rpgMesa.players
        );


        // --------------------------------------
        // PREENCHER ASSENTOS
        // --------------------------------------

        preencherAssentosAutomaticamente();


        // --------------------------------------
        // ATUALIZAR LISTA
        // --------------------------------------

        atualizarListaJogadores();


        // --------------------------------------
        // ATUALIZAR CONTADOR
        // --------------------------------------

        atualizarContadorJogadores();


        // --------------------------------------
        // ATUALIZAR CHAT
        // --------------------------------------

        atualizarMensagemMesa();

    }


    // ==========================================
    // PREENCHER ASSENTOS AUTOMATICAMENTE
    // ==========================================

    function preencherAssentosAutomaticamente() {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        // --------------------------------------
        // LIMPAR TODOS OS ASSENTOS
        // --------------------------------------

        for (
            let numero = 1;
            numero <= window.rpgMesa.maxPlayers;
            numero++
        ) {

            limparAssento(numero);

        }


        // --------------------------------------
        // PREENCHER OS ASSENTOS
        // --------------------------------------

        const jogadores =
            Array.isArray(
                window.rpgMesa.players
            )
                ? window.rpgMesa.players
                : [];


        let assento =
            1;


        for (
            const jogador
            of jogadores
        ) {

            if (
                assento >
                window.rpgMesa.maxPlayers
            ) {

                break;

            }


            preencherAssento(
                assento,
                jogador.character,
                jogador.playerId
            );


            assento++;

        }

    }


    // ==========================================
    // ATUALIZAR LISTA DE JOGADORES
    // ==========================================

    function atualizarListaJogadores() {

        const lista =
            document.getElementById(
                "online-table-player-list"
            );


        if (!lista) {

            return;

        }


        const jogadores =
            Array.isArray(
                window.rpgMesa.players
            )
                ? window.rpgMesa.players
                : [];


        // --------------------------------------
        // NENHUM JOGADOR
        // --------------------------------------

        if (
            jogadores.length === 0
        ) {

            lista.innerHTML = `

                <div class="online-table-empty">

                    Nenhum jogador entrou na mesa.

                </div>

            `;


            return;

        }


        // --------------------------------------
        // CRIAR LISTA
        // --------------------------------------

        lista.innerHTML =
            jogadores
                .map(
                    function (
                        jogador,
                        indice
                    ) {

                        const nome =
                            jogador.character?.name ||
                            jogador.character?.nome ||
                            "Sem personagem";


                        const numero =
                            indice + 1;


                        return `

                            <div class="online-table-player">

                                <strong>
                                    LUGAR ${numero}
                                </strong>

                                <span>
                                    ${escaparHTML(
                                        nome
                                    )}
                                </span>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    // ==========================================
    // PREENCHER ASSENTO
    // ==========================================

    function preencherAssento(
        numero,
        personagem,
        playerId = ""
    ) {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        const assento =
            painel.querySelector(
                `.table-seat[data-seat="${numero}"]`
            );


        if (!assento) {

            return;

        }


        const nome =
            personagem?.name ||
            personagem?.nome ||
            "VAZIO";


        const campoNome =
            assento.querySelector(
                ".table-seat-character"
            );


        const campoNumero =
            assento.querySelector(
                ".table-seat-number"
            );


        if (campoNome) {

            campoNome.textContent =
                nome;

        }


        if (campoNumero) {

            campoNumero.textContent =
                `LUGAR ${numero}`;

        }


        assento.dataset.playerId =
            playerId || "";


        assento.dataset.characterId =
            personagem?.id || "";

    }


    // ==========================================
    // LIMPAR ASSENTO
    // ==========================================

    function limparAssento(numero) {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        const assento =
            painel.querySelector(
                `.table-seat[data-seat="${numero}"]`
            );


        if (!assento) {

            return;

        }


        const campoNome =
            assento.querySelector(
                ".table-seat-character"
            );


        if (campoNome) {

            campoNome.textContent =
                "VAZIO";

        }


        assento.dataset.playerId =
            "";


        assento.dataset.characterId =
            "";

    }


    // ==========================================
    // ATUALIZAR CONTADOR DE JOGADORES
    // ==========================================

    function atualizarContadorJogadores() {

        const contador =
            document.getElementById(
                "online-table-player-count"
            );


        if (!contador) {

            return;

        }


        const jogadores =
            Array.isArray(
                window.rpgMesa.players
            )
                ? window.rpgMesa.players.length
                : 0;


        contador.textContent =
            `${Math.min(
                jogadores,
                window.rpgMesa.maxPlayers
            )} / ${window.rpgMesa.maxPlayers}`;

    }


    // ==========================================
    // ATUALIZAR MENSAGEM DA MESA
    // ==========================================

    function atualizarMensagemMesa() {

        const mensagem =
            document.getElementById(
                "online-table-chat-messages"
            );


        if (!mensagem) {

            return;

        }


        const jogadores =
            Array.isArray(
                window.rpgMesa.players
            )
                ? window.rpgMesa.players
                : [];


        if (
            jogadores.length === 0
        ) {

            mensagem.textContent =
                "A mesa está pronta. Aguardando os jogadores...";

            return;

        }


        const quantidade =
            Math.min(
                jogadores.length,
                window.rpgMesa.maxPlayers
            );


        mensagem.textContent =
            `${quantidade} jogador${quantidade === 1 ? "" : "es"} presente${quantidade === 1 ? "" : "s"} na mesa.`;

    }


    // ==========================================
    // MÓDULOS DA MESA
    // ==========================================

    function configurarModulosMesa() {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        const botoes =
            painel.querySelectorAll(
                "[data-table-module]"
            );


        botoes.forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function (evento) {

                        evento.stopPropagation();


                        const modulo =
                            botao.dataset.tableModule;


                        console.log(
                            "🎴 Módulo da mesa selecionado:",
                            modulo
                        );

                    }
                );

            }
        );

    }


    // ==========================================
    // MODO DA MESA
    // ==========================================
    //
    // campaign = verde
    // battle   = vermelho
    //
    // ==========================================

    function definirModoMesa(modo) {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        window.rpgMesa.mode =
            modo;


        if (
            modo === "battle"
        ) {

            painel.classList.add(
                "battle-mode"
            );


            const status =
                painel.querySelector(
                    ".online-table-status"
                );


            if (status) {

                status.innerHTML =
                    "🔴 BATALHA";

            }


        } else {

            painel.classList.remove(
                "battle-mode"
            );


            const status =
                painel.querySelector(
                    ".online-table-status"
                );


            if (status) {

                status.innerHTML =
                    "🟢 CAMPANHA";

            }

        }

    }


    // ==========================================
    // DISPONIBILIZAR MODO DA MESA
    // ==========================================

    window.definirModoMesa =
        definirModoMesa;


    // ==========================================
    // DISPONIBILIZAR FUNÇÕES DOS ASSENTOS
    // ==========================================

    window.rpgMesa.preencherAssento =
        preencherAssento;


    window.rpgMesa.limparAssento =
        limparAssento;


    window.rpgMesa.atualizarContadorJogadores =
        atualizarContadorJogadores;


    // ==========================================
    // ATUALIZAR JOGADORES MANUALMENTE
    // ==========================================

    window.rpgMesa.carregarJogadores =
        carregarJogadoresMesa;


    window.rpgMesa.atualizarJogadores =
        carregarJogadoresMesa;


    // ==========================================
    // NOME DO MESTRE
    // ==========================================

    function obterNomeMestre() {

        const user =
            window.rpgAuth?.user;


        if (!user) {

            return "Mestre";

        }


        // --------------------------------------
        // NOME DO USUÁRIO
        // --------------------------------------

        const nome =
            user.user_metadata?.name;


        const nomeCompleto =
            user.user_metadata?.full_name;


        // --------------------------------------
        // ACEITAR SOMENTE NOMES
        // --------------------------------------

        if (
            nome &&
            !String(nome).includes("@")
        ) {

            return nome;

        }


        if (
            nomeCompleto &&
            !String(nomeCompleto).includes("@")
        ) {

            return nomeCompleto;

        }


        // --------------------------------------
        // FALLBACK SEGURO
        // --------------------------------------

        return "Mestre";

    }


    // ==========================================
    // ESCAPAR HTML
    // ==========================================

    function escaparHTML(valor) {

        return String(valor ?? "")
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


    // ==========================================
    // DOM PRONTO
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarMesa
        );

    } else {

        iniciarMesa();

    }


})();
