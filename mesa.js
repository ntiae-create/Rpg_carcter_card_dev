// ==========================================
// MESA ONLINE — RPG CHARACTER CARD
// PASSO 5 — CARDS DOS JOGADORES
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

            if (
                window.obterCampanhaAtiva
            ) {

                campanha =
                    window.obterCampanhaAtiva();

            }


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


        if (!campanha) {

            console.log(
                "ℹ️ Mesa.js: nenhuma campanha disponível."
            );

            return;

        }


        window.rpgMesa.campaign =
            campanha;


        window.rpgMesa.master =
            campanha.master_id;


        criarInterfaceMesa();


        await carregarJogadoresMesa();


        window.rpgMesa.initialized =
            true;


        atualizarPermissoesConfiguracoes();


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
    // VERIFICAR SE É MESTRE
    // ==========================================

    function usuarioEhMestre() {

        const user =
            window.rpgAuth?.user;


        if (!user) {

            return false;

        }


        if (
            window.rpgAuth?.isMaster === true
        ) {

            return true;

        }


        return (
            String(user.id) ===
            String(window.rpgMesa.master)
        );

    }


    // ==========================================
    // CRIAR INTERFACE DA MESA
    // ==========================================

    function criarInterfaceMesa() {

        if (
            document.getElementById(
                "online-table-panel"
            )
        ) {

            atualizarPermissoesConfiguracoes();

            return;

        }


        const painel =
            document.createElement("section");


        painel.id =
            "online-table-panel";


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


                <div
                    class="online-table-header-actions"
                    style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                    "
                >

                    <div class="online-table-status">

                        🟢 CAMPANHA

                    </div>


                    <button
                        id="mesa-settings-button"
                        type="button"
                        style="
                            border:1px solid #68408a;
                            border-radius:10px;
                            background:#1b1424;
                            color:#d8c7e8;
                            padding:9px 11px;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >

                        ⚙️

                    </button>

                </div>

            </div>


            <!-- =================================
                 CENTRAL DE CONFIGURAÇÕES
            ================================== -->

            <div
                id="mesa-settings-panel"
                style="
                    display:none;
                    position:fixed;
                    inset:0;
                    z-index:9999;
                    padding:18px;
                    background:rgba(3,2,8,0.88);
                    backdrop-filter:blur(8px);
                    overflow-y:auto;
                "
            >

                <div
                    style="
                        width:100%;
                        max-width:500px;
                        margin:0 auto;
                        border:1px solid #6f3aa8;
                        border-radius:18px;
                        background:
                            linear-gradient(
                                160deg,
                                #171020,
                                #0b0910
                            );
                        box-shadow:
                            0 0 30px rgba(
                                124,
                                58,
                                237,
                                0.28
                            );
                        padding:18px;
                    "
                >

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            gap:10px;
                            margin-bottom:18px;
                        "
                    >

                        <div>

                            <small
                                style="
                                    color:#8f839d;
                                    letter-spacing:2px;
                                "
                            >
                                OPÇÕES DA MESA
                            </small>

                            <h2
                                style="
                                    margin:4px 0 0;
                                    color:#f5f0ff;
                                "
                            >
                                ⚙️ Configurações
                            </h2>

                        </div>


                        <button
                            id="mesa-settings-close"
                            type="button"
                            style="
                                width:38px;
                                height:38px;
                                border:1px solid #68408a;
                                border-radius:50%;
                                background:#1b1424;
                                color:#fff;
                                cursor:pointer;
                                font-size:18px;
                            "
                        >
                            ✕
                        </button>

                    </div>


                    <!-- =================================
                         ÁREA DO MESTRE
                    ================================== -->

                    <div
                        id="mesa-master-settings"
                        style="display:none;"
                    >

                        <div
                            style="
                                padding:14px;
                                margin-bottom:12px;
                                border:1px solid #6f3aa8;
                                border-radius:14px;
                                background:
                                    rgba(
                                        124,
                                        58,
                                        237,
                                        0.08
                                    );
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#c084fc;
                                    font-size:13px;
                                    letter-spacing:1px;
                                    margin-bottom:5px;
                                "
                            >
                                👑 MODO MESTRE
                            </strong>

                            <span
                                style="
                                    color:#8f839d;
                                    font-size:10px;
                                "
                            >
                                Ferramentas administrativas da mesa
                            </span>

                        </div>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="players"
                        >

                            <span>👥</span>

                            <div>
                                <strong>Jogadores</strong>

                                <small>
                                    Gerenciar jogadores da mesa
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="characters"
                        >

                            <span>🎴</span>

                            <div>
                                <strong>Personagens</strong>

                                <small>
                                    Visualizar e gerenciar personagens
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="status"
                        >

                            <span>❤️</span>

                            <div>
                                <strong>Status</strong>

                                <small>
                                    Recursos e condições dos jogadores
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="needs"
                        >

                            <span>🍖</span>

                            <div>
                                <strong>Fome e Sede</strong>

                                <small>
                                    Controlar necessidades dos jogadores
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="inventory"
                        >

                            <span>🎒</span>

                            <div>
                                <strong>Inventário</strong>

                                <small>
                                    Dar, remover e trocar itens
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="combat"
                        >

                            <span>⚔️</span>

                            <div>
                                <strong>Combate</strong>

                                <small>
                                    Controle de combate da mesa
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="events"
                        >

                            <span>🎲</span>

                            <div>
                                <strong>Eventos / QTE</strong>

                                <small>
                                    Criar e lançar eventos
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-master-tool="map"
                        >

                            <span>🗺️</span>

                            <div>
                                <strong>Mapa</strong>

                                <small>
                                    Controle do mapa da campanha
                                </small>
                            </div>

                        </button>


                    </div>


                    <!-- =================================
                         CONFIGURAÇÕES DO JOGADOR
                    ================================== -->

                    <div
                        id="mesa-player-settings"
                        style="display:none;"
                    >

                        <div
                            style="
                                padding:14px;
                                margin-bottom:12px;
                                border:1px solid rgba(
                                    255,
                                    255,
                                    255,
                                    0.08
                                );
                                border-radius:14px;
                                background:
                                    rgba(
                                        255,
                                        255,
                                        255,
                                        0.03
                                    );
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#c084fc;
                                    font-size:13px;
                                    margin-bottom:5px;
                                "
                            >
                                ⚙️ OPÇÕES
                            </strong>

                            <span
                                style="
                                    color:#8f839d;
                                    font-size:10px;
                                "
                            >
                                Configurações disponíveis para você
                            </span>

                        </div>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-player-tool="interface"
                        >

                            <span>🎨</span>

                            <div>
                                <strong>Interface</strong>

                                <small>
                                    Opções visuais da mesa
                                </small>
                            </div>

                        </button>


                        <button
                            type="button"
                            class="mesa-setting-option"
                            data-player-tool="help"
                        >

                            <span>❓</span>

                            <div>
                                <strong>Ajuda</strong>

                                <small>
                                    Informações sobre a mesa
                                </small>
                            </div>

                        </button>

                    </div>


                    <!-- =================================
                         MANUTENÇÃO
                    ================================== -->

                    <div
                        style="
                            margin-top:18px;
                            padding-top:16px;
                            border-top:1px solid rgba(
                                255,
                                255,
                                255,
                                0.08
                            );
                        "
                    >

                        <small
                            style="
                                display:block;
                                color:#8f839d;
                                letter-spacing:1px;
                                margin-bottom:10px;
                            "
                        >
                            🔄 MESA
                        </small>


                        <button
                            id="mesa-refresh-button"
                            type="button"
                            class="mesa-setting-action"
                        >

                            🔄 ATUALIZAR MESA

                        </button>


                        <div
                            id="mesa-refresh-status"
                            style="
                                text-align:center;
                                margin-top:8px;
                                min-height:14px;
                                color:#75687f;
                                font-size:9px;
                            "
                        ></div>

                    </div>

                </div>

            </div>


            <!-- =================================
                 MESA
            ================================== -->

            <div class="rpg-table">


                <!-- =================================
                     MESTRE
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
                     CENTRO
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


                    <!-- MÓDULOS -->

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
                 CARDS DOS JOGADORES
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


        // ======================================
        // TELA CHEIA
        // ======================================

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


        document.body.appendChild(
            painel
        );


        configurarEstilosConfiguracoes();

        configurarEstilosCards();

        configurarModulosMesa();

        configurarConfiguracoesMesa();

        atualizarPermissoesConfiguracoes();

    }


    // ==========================================
    // ESTILOS DAS CONFIGURAÇÕES
    // ==========================================

    function configurarEstilosConfiguracoes() {

        if (
            document.getElementById(
                "mesa-settings-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement("style");


        style.id =
            "mesa-settings-style";


        style.textContent = `

            .mesa-setting-option {

                width:100%;

                display:flex;

                align-items:center;

                gap:12px;

                padding:12px;

                margin-bottom:8px;

                border:1px solid rgba(
                    255,
                    255,
                    255,
                    0.08
                );

                border-radius:12px;

                background:rgba(
                    255,
                    255,
                    255,
                    0.035
                );

                color:#f5f0ff;

                text-align:left;

                cursor:pointer;

                transition:
                    background 0.2s ease,
                    border-color 0.2s ease,
                    transform 0.2s ease;

            }


            .mesa-setting-option:hover {

                background:rgba(
                    124,
                    58,
                    237,
                    0.10
                );

                border-color:#68408a;

                transform:translateY(-1px);

            }


            .mesa-setting-option > span {

                width:34px;

                height:34px;

                display:flex;

                align-items:center;

                justify-content:center;

                border-radius:10px;

                background:#1b1424;

                font-size:18px;

                flex-shrink:0;

            }


            .mesa-setting-option div {

                display:flex;

                flex-direction:column;

                gap:3px;

            }


            .mesa-setting-option strong {

                font-size:12px;

            }


            .mesa-setting-option small {

                color:#8f839d;

                font-size:9px;

            }


            .mesa-setting-action {

                width:100%;

                padding:12px;

                border:1px solid #68408a;

                border-radius:12px;

                background:#1b1424;

                color:#d8c7e8;

                font-weight:bold;

                cursor:pointer;

                transition:
                    background 0.2s ease,
                    border-color 0.2s ease,
                    transform 0.2s ease;

            }


            .mesa-setting-action:hover {

                background:#241633;

                border-color:#8b5cf6;

                transform:translateY(-1px);

            }


            #mesa-settings-panel {

                animation:mesaSettingsOpen 0.2s ease;

            }


            @keyframes mesaSettingsOpen {

                from {

                    opacity:0;

                }

                to {

                    opacity:1;

                }

            }


            @media (max-width:380px) {

                #mesa-settings-panel {

                    padding:10px;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    // ==========================================
    // ESTILOS DOS CARDS
    // ==========================================

    function configurarEstilosCards() {

        if (
            document.getElementById(
                "mesa-player-cards-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement("style");


        style.id =
            "mesa-player-cards-style";


        style.textContent = `

            .online-table-player-list {

                display:grid;

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));

                gap:10px;

            }


            .mesa-player-card {

                position:relative;

                min-height:155px;

                padding:12px;

                border-radius:16px;

                border:1px solid #68408a;

                background:
                    linear-gradient(
                        145deg,
                        #171020,
                        #0b0910
                    );

                box-shadow:
                    0 0 18px rgba(
                        124,
                        58,
                        237,
                        0.12
                    );

                overflow:hidden;

                cursor:pointer;

                transition:
                    transform 0.2s ease,
                    border-color 0.2s ease,
                    box-shadow 0.2s ease;

            }


            .mesa-player-card:hover {

                transform:translateY(-2px);

                border-color:#8b5cf6;

                box-shadow:
                    0 0 22px rgba(
                        124,
                        58,
                        237,
                        0.24
                    );

            }


            .mesa-player-card::before {

                content:"";

                position:absolute;

                top:0;

                left:0;

                right:0;

                height:3px;

                background:
                    linear-gradient(
                        90deg,
                        #6d28d9,
                        #c084fc
                    );

            }


            .mesa-player-card-empty {

                display:flex;

                flex-direction:column;

                justify-content:center;

                align-items:center;

                min-height:155px;

                padding:12px;

                border-radius:16px;

                border:1px dashed
                    rgba(
                        255,
                        255,
                        255,
                        0.12
                    );

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.025
                    );

                text-align:center;

                color:#75687f;

            }


            .mesa-player-card-top {

                display:flex;

                align-items:center;

                gap:10px;

                margin-bottom:10px;

            }


            .mesa-player-avatar {

                width:48px;

                height:48px;

                border-radius:50%;

                display:flex;

                align-items:center;

                justify-content:center;

                flex-shrink:0;

                border:1px solid #8b5cf6;

                background:
                    radial-gradient(
                        circle,
                        #35205a,
                        #100b18
                    );

                color:#d8b4fe;

                font-size:22px;

                overflow:hidden;

            }


            .mesa-player-avatar img {

                width:100%;

                height:100%;

                object-fit:cover;

            }


            .mesa-player-card-name {

                min-width:0;

                flex:1;

            }


            .mesa-player-card-name strong {

                display:block;

                font-size:13px;

                white-space:nowrap;

                overflow:hidden;

                text-overflow:ellipsis;

            }


            .mesa-player-card-name small {

                display:block;

                margin-top:3px;

                color:#8f839d;

                font-size:9px;

            }


            .mesa-player-card-info {

                display:grid;

                grid-template-columns:
                    1fr 1fr;

                gap:6px;

            }


            .mesa-player-card-info div {

                padding:7px;

                border-radius:9px;

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.035
                    );

                border:
                    1px solid rgba(
                        255,
                        255,
                        255,
                        0.06
                    );

            }


            .mesa-player-card-info span {

                display:block;

                color:#75687f;

                font-size:8px;

                margin-bottom:3px;

            }


            .mesa-player-card-info strong {

                display:block;

                color:#e9d5ff;

                font-size:10px;

                white-space:nowrap;

                overflow:hidden;

                text-overflow:ellipsis;

            }


            .mesa-player-card-footer {

                display:flex;

                justify-content:space-between;

                align-items:center;

                margin-top:8px;

                color:#75687f;

                font-size:8px;

            }


            .mesa-player-card-status {

                color:#c084fc;

            }


            @media (max-width:380px) {

                .online-table-player-list {

                    grid-template-columns:1fr;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    // ==========================================
    // CONFIGURAÇÕES DA MESA
    // ==========================================

    function configurarConfiguracoesMesa() {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        const botao =
            document.getElementById(
                "mesa-settings-button"
            );


        const settings =
            document.getElementById(
                "mesa-settings-panel"
            );


        const fechar =
            document.getElementById(
                "mesa-settings-close"
            );


        const atualizar =
            document.getElementById(
                "mesa-refresh-button"
            );


        if (botao) {

            botao.addEventListener(
                "click",
                function () {

                    abrirConfiguracoesMesa();

                }
            );

        }


        if (fechar) {

            fechar.addEventListener(
                "click",
                function () {

                    fecharConfiguracoesMesa();

                }
            );

        }


        if (settings) {

            settings.addEventListener(
                "click",
                function (evento) {

                    if (
                        evento.target === settings
                    ) {

                        fecharConfiguracoesMesa();

                    }

                }
            );

        }


        if (atualizar) {

            atualizar.addEventListener(
                "click",
                async function () {

                    await atualizarMesaSemRecarregar();

                }
            );

        }


        painel
            .querySelectorAll(
                "[data-master-tool]"
            )
            .forEach(
                function (botaoFerramenta) {

                    botaoFerramenta.addEventListener(
                        "click",
                        function () {

                            const ferramenta =
                                botaoFerramenta.dataset.masterTool;


                            selecionarFerramentaMestre(
                                ferramenta
                            );

                        }
                    );

                }
            );


        painel
            .querySelectorAll(
                "[data-player-tool]"
            )
            .forEach(
                function (botaoFerramenta) {

                    botaoFerramenta.addEventListener(
                        "click",
                        function () {

                            const ferramenta =
                                botaoFerramenta.dataset.playerTool;


                            selecionarFerramentaJogador(
                                ferramenta
                            );

                        }
                    );

                }
            );

    }


    // ==========================================
    // ABRIR CONFIGURAÇÕES
    // ==========================================

    function abrirConfiguracoesMesa() {

        const settings =
            document.getElementById(
                "mesa-settings-panel"
            );


        if (!settings) {

            return;

        }


        atualizarPermissoesConfiguracoes();


        settings.style.display =
            "block";


        document.body.style.overflow =
            "hidden";

    }


    // ==========================================
    // FECHAR CONFIGURAÇÕES
    // ==========================================

    function fecharConfiguracoesMesa() {

        const settings =
            document.getElementById(
                "mesa-settings-panel"
            );


        if (!settings) {

            return;

        }


        settings.style.display =
            "none";


        document.body.style.overflow =
            "hidden";

    }


    // ==========================================
    // ATUALIZAR PERMISSÕES
    // ==========================================

    function atualizarPermissoesConfiguracoes() {

        const masterArea =
            document.getElementById(
                "mesa-master-settings"
            );


        const playerArea =
            document.getElementById(
                "mesa-player-settings"
            );


        const botao =
            document.getElementById(
                "mesa-settings-button"
            );


        const mestre =
            usuarioEhMestre();


        if (masterArea) {

            masterArea.style.display =
                mestre
                    ? "block"
                    : "none";

        }


        if (playerArea) {

            playerArea.style.display =
                mestre
                    ? "none"
                    : "block";

        }


        if (botao) {

            botao.title =
                mestre
                    ? "Configurações do Mestre"
                    : "Configurações";

        }

    }


    // ==========================================
    // SELECIONAR FERRAMENTA DO MESTRE
    // ==========================================

    function selecionarFerramentaMestre(
        ferramenta
    ) {

        if (!usuarioEhMestre()) {

            console.log(
                "🔒 Acesso negado à ferramenta:",
                ferramenta
            );

            return;

        }


        console.log(
            "👑 Ferramenta do Mestre selecionada:",
            ferramenta
        );


        mostrarAvisoConfiguracao(
            `🛠️ ${obterNomeFerramenta(
                ferramenta
            )} será aberto aqui.`
        );

    }


    // ==========================================
    // SELECIONAR FERRAMENTA DO JOGADOR
    // ==========================================

    function selecionarFerramentaJogador(
        ferramenta
    ) {

        console.log(
            "⚙️ Opção do jogador selecionada:",
            ferramenta
        );


        mostrarAvisoConfiguracao(
            `⚙️ ${obterNomeFerramenta(
                ferramenta
            )}`
        );

    }


    // ==========================================
    // NOME DA FERRAMENTA
    // ==========================================

    function obterNomeFerramenta(
        ferramenta
    ) {

        const nomes = {

            players:
                "Jogadores",

            characters:
                "Personagens",

            status:
                "Status",

            needs:
                "Fome e Sede",

            inventory:
                "Inventário",

            combat:
                "Combate",

            events:
                "Eventos / QTE",

            map:
                "Mapa",

            interface:
                "Interface",

            help:
                "Ajuda"

        };


        return (
            nomes[ferramenta] ||
            "Ferramenta"

        );

    }


    // ==========================================
    // AVISO DA CONFIGURAÇÃO
    // ==========================================

    function mostrarAvisoConfiguracao(
        texto
    ) {

        const existente =
            document.getElementById(
                "mesa-settings-message"
            );


        if (existente) {

            existente.remove();

        }


        const mensagem =
            document.createElement("div");


        mensagem.id =
            "mesa-settings-message";


        mensagem.textContent =
            texto;


        mensagem.style.cssText = `

            margin-top:12px;

            padding:10px;

            border-radius:10px;

            border:1px solid #68408a;

            background:rgba(
                124,
                58,
                237,
                0.08
            );

            color:#c084fc;

            text-align:center;

            font-size:10px;

        `;


        const settings =
            document.querySelector(
                "#mesa-settings-panel > div"
            );


        if (settings) {

            settings.appendChild(
                mensagem
            );

        }


        setTimeout(
            function () {

                if (
                    mensagem.parentNode
                ) {

                    mensagem.remove();

                }

            },
            2500
        );

    }


    // ==========================================
    // ATUALIZAR MESA SEM RECARREGAR
    // ==========================================

    async function atualizarMesaSemRecarregar() {

        const status =
            document.getElementById(
                "mesa-refresh-status"
            );


        if (status) {

            status.textContent =
                "🔄 Sincronizando...";

        }


        try {

            const modoAtual =
                window.rpgMesa.mode;


            await carregarJogadoresMesa();


            definirModoMesa(
                modoAtual
            );


            if (status) {

                status.textContent =
                    "✅ Mesa atualizada sem perder o estado.";

            }


            mostrarNotificacaoMesa(
                "🔄 Mesa sincronizada"
            );


        } catch (erro) {

            console.error(
                "❌ Erro ao atualizar mesa:",
                erro
            );


            if (status) {

                status.textContent =
                    "❌ Não foi possível atualizar.";

            }

        }


        setTimeout(
            function () {

                if (status) {

                    status.textContent =
                        "";

                }

            },
            3500
        );

    }


    // ==========================================
    // NOTIFICAÇÃO
    // ==========================================

    function mostrarNotificacaoMesa(
        texto
    ) {

        const antiga =
            document.getElementById(
                "mesa-system-notification"
            );


        if (antiga) {

            antiga.remove();

        }


        const notificacao =
            document.createElement("div");


        notificacao.id =
            "mesa-system-notification";


        notificacao.textContent =
            texto;


        notificacao.style.cssText = `

            position:fixed;

            left:50%;

            bottom:22px;

            transform:translateX(-50%);

            z-index:10000;

            padding:10px 15px;

            border-radius:12px;

            border:1px solid #68408a;

            background:#100b18;

            color:#e9d5ff;

            box-shadow:
                0 0 20px rgba(
                    124,
                    58,
                    237,
                    0.25
                );

            font-size:11px;

            pointer-events:none;

        `;


        document.body.appendChild(
            notificacao
        );


        setTimeout(
            function () {

                if (
                    notificacao.parentNode
                ) {

                    notificacao.remove();

                }

            },
            2500
        );

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
    // CARREGAR JOGADORES
    // ==========================================

    async function carregarJogadoresMesa() {

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


        const membros =
            Array.isArray(
                window.rpgAuth?.campaignMembers
            )
                ? window.rpgAuth.campaignMembers
                : [];


        const personagens =
            Array.isArray(
                window.rpgAuth?.campaignCharacters
            )
                ? window.rpgAuth.campaignCharacters
                : [];


        const jogadores = [];


        for (
            const membro
            of membros
        ) {

            if (!membro?.user_id) {

                continue;

            }


            if (
                String(membro.user_id) ===
                String(window.rpgMesa.master)
            ) {

                continue;

            }


            const personagem =
                personagens.find(
                    function (item) {

                        return (
                            item &&
                            String(item.user_id) ===
                            String(membro.user_id)
                        );

                    }
                );


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


        window.rpgMesa.players =
            jogadores;


        preencherAssentosAutomaticamente();

        atualizarListaJogadores();

        atualizarContadorJogadores();

        atualizarMensagemMesa();

    }


    // ==========================================
    // PREENCHER ASSENTOS
    // ==========================================

    function preencherAssentosAutomaticamente() {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        for (
            let numero = 1;
            numero <= window.rpgMesa.maxPlayers;
            numero++
        ) {

            limparAssento(numero);

        }


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
    // ATUALIZAR CARDS DOS JOGADORES
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
        // MOSTRAR SOMENTE 4 CARDS
        // --------------------------------------

        const quantidadeCards = 4;


        let html = "";


        for (
            let indice = 0;
            indice < quantidadeCards;
            indice++
        ) {

            const jogador =
                jogadores[indice];


            if (!jogador) {

                html += criarCardJogadorVazio(
                    indice + 1
                );

                continue;

            }


            html += criarCardJogador(
                jogador,
                indice + 1
            );

        }


        lista.innerHTML =
            html;


        lista
            .querySelectorAll(
                "[data-player-card]"
            )
            .forEach(
                function (card) {

                    card.addEventListener(
                        "click",
                        function () {

                            const playerId =
                                card.dataset.playerId;


                            const characterId =
                                card.dataset.characterId;


                            console.log(
                                "🎴 Card do jogador selecionado:",
                                {
                                    playerId,
                                    characterId
                                }
                            );

                        }
                    );

                }
            );

    }


    // ==========================================
    // CARD DE JOGADOR
    // ==========================================

    function criarCardJogador(
        jogador,
        numero
    ) {

        const personagem =
            jogador.character;


        const nome =
            personagem?.name ||
            personagem?.nome ||
            "Sem personagem";


        const classe =
            personagem?.class ||
            personagem?.classe ||
            "Classe não definida";


        const raca =
            personagem?.race ||
            personagem?.raca ||
            "Raça não definida";


        const nivel =
            personagem?.level ||
            personagem?.nivel ||
            1;


        const imagem =
            personagem?.image ||
            personagem?.image_url ||
            personagem?.avatar ||
            "";


        const confirmado =
            personagem?.confirmed === true ||
            personagem?.confirmado === true;


        const avatar =
            imagem
                ? `
                    <img
                        src="${escaparHTML(imagem)}"
                        alt=""
                    >
                  `
                : "🎭";


        return `

            <div
                class="mesa-player-card"
                data-player-card="true"
                data-player-id="${escaparHTML(
                    jogador.playerId
                )}"
                data-character-id="${escaparHTML(
                    jogador.characterId
                )}"
            >

                <div class="mesa-player-card-top">

                    <div class="mesa-player-avatar">

                        ${avatar}

                    </div>


                    <div class="mesa-player-card-name">

                        <strong>
                            ${escaparHTML(nome)}
                        </strong>

                        <small>
                            LUGAR ${numero}
                        </small>

                    </div>

                </div>


                <div class="mesa-player-card-info">

                    <div>

                        <span>
                            CLASSE
                        </span>

                        <strong>
                            ${escaparHTML(classe)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            RAÇA
                        </span>

                        <strong>
                            ${escaparHTML(raca)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            NÍVEL
                        </span>

                        <strong>
                            ${escaparHTML(nivel)}
                        </strong>

                    </div>


                    <div>

                        <span>
                            ESTADO
                        </span>

                        <strong>
                            ${confirmado
                                ? "CONFIRMADO"
                                : "PENDENTE"
                            }
                        </strong>

                    </div>

                </div>


                <div class="mesa-player-card-footer">

                    <span>
                        🎴 PERSONAGEM
                    </span>

                    <span class="mesa-player-card-status">

                        ● ONLINE

                    </span>

                </div>

            </div>

        `;

    }


    // ==========================================
    // CARD VAZIO
    // ==========================================

    function criarCardJogadorVazio(
        numero
    ) {

        return `

            <div class="mesa-player-card-empty">

                <strong
                    style="
                        font-size:12px;
                        color:#8f839d;
                    "
                >
                    LUGAR ${numero}
                </strong>

                <small
                    style="
                        margin-top:6px;
                        font-size:9px;
                    "
                >
                    Aguardando jogador...

                </small>

            </div>

        `;

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
    // CONTADOR
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
    // MENSAGEM DA MESA
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
    // MÓDULOS
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
    // DISPONIBILIZAR MODO
    // ==========================================

    window.definirModoMesa =
        definirModoMesa;


    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================

    window.rpgMesa.preencherAssento =
        preencherAssento;


    window.rpgMesa.limparAssento =
        limparAssento;


    window.rpgMesa.atualizarContadorJogadores =
        atualizarContadorJogadores;


    window.rpgMesa.carregarJogadores =
        carregarJogadoresMesa;


    window.rpgMesa.atualizarJogadores =
        carregarJogadoresMesa;


    window.rpgMesa.atualizarMesa =
        atualizarMesaSemRecarregar;


    window.rpgMesa.abrirConfiguracoes =
        abrirConfiguracoesMesa;


    window.rpgMesa.fecharConfiguracoes =
        fecharConfiguracoesMesa;


    window.rpgMesa.usuarioEhMestre =
        usuarioEhMestre;


    window.rpgMesa.obterJogadores =
        function () {

            return Array.isArray(
                window.rpgMesa.players
            )
                ? window.rpgMesa.players
                : [];

        };


    // ==========================================
    // NOME DO MESTRE
    // ==========================================

    function obterNomeMestre() {

        const user =
            window.rpgAuth?.user;


        if (!user) {

            return "Mestre";

        }


        const nome =
            user.user_metadata?.name;


        const nomeCompleto =
            user.user_metadata?.full_name;


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
