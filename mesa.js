function escaparHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
function obterNomeMestre() {
    const campanha = window.rpgMesa?.campaign;
    const mestre = window.rpgMesa?.master;

    return (
        mestre?.nome ||
        mestre?.name ||
        campanha?.master_name ||
        campanha?.masterName ||
        campanha?.nome_mestre ||
        campanha?.nomeMestre ||
        "Mestre"
    );
}
window.obterNomeMestre = obterNomeMestre;
function criarAssento(numero) {
    const assento = document.createElement("div");

    assento.className = "mesa-seat";
    assento.dataset.seat = numero;

    assento.innerHTML = `
        <div class="mesa-seat-number">${numero}</div>
        <div class="mesa-seat-content">
            <div class="mesa-seat-icon">👤</div>
            <div class="mesa-seat-name">Aguardando jogador</div>
        </div>
    `;

    return assento;
}
function atualizarListaJogadores() {
    const jogadores = window.rpgMesa?.players || [];

    const assentos = document.querySelectorAll(".mesa-seat");

    assentos.forEach((assento, index) => {
        const jogador = jogadores[index];

        const nome = assento.querySelector(".mesa-seat-name");
        const icone = assento.querySelector(".mesa-seat-icon");

        if (!jogador) {
            if (nome) nome.textContent = "Aguardando jogador";
            if (icone) icone.textContent = "👤";
            assento.classList.remove("ocupado");
            return;
        }

        const nomeJogador =
            jogador.nome ||
            jogador.name ||
            jogador.username ||
            "Jogador";

        if (nome) nome.textContent = nomeJogador;
        if (icone) icone.textContent = "🧙";

        assento.classList.add("ocupado");
    });

    const contador = document.querySelector("#mesa-player-count");

    if (contador) {
        contador.textContent = `${jogadores.length}/${window.rpgMesa?.maxPlayers || 8}`;
    }
}
// ==========================================
// MESA ONLINE — RPG
// PASSO 6 — MESA FUNCIONAL
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

        mode: "campaign",

        activeModule: "home",

        selectedPlayer: null,

        selectedCharacter: null,

        cte: null,

        bossTimeout: null,

        map: {

            x: 0,

            y: 0,

            scale: 1

        }

    };


    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    async function iniciarMesa() {

        console.log("🎲 Mesa.js carregado.");


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
                window.rpgAuth?.campaign
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
    // MESTRE
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
    // INTERFACE PRINCIPAL
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


        painel.className =
            "mesa-fullscreen";


        painel.innerHTML = `

            <!-- ==================================
                 CABEÇALHO
            ================================== -->

            <header class="mesa-header">

                <div>

                    <span class="mesa-header-label">
                        🎲 MESA ONLINE
                    </span>

                    <h2 id="online-table-name">
                        ${escaparHTML(
                            window.rpgMesa.campaign?.name ||
                            "Campanha"
                        )}
                    </h2>

                </div>


                <div class="mesa-header-actions">

                    <div
                        id="mesa-mode-status"
                        class="mesa-mode-status"
                    >
                        🟢 CAMPANHA
                    </div>


                    <button
                        id="mesa-settings-button"
                        class="mesa-icon-button"
                        type="button"
                        title="Configurações"
                    >
                        ⚙️
                    </button>

                </div>

            </header>


            <!-- ==================================
                 ÁREA PRINCIPAL
            ================================== -->

            <main class="mesa-main">


                <!-- ==============================
                     MESTRE
                =============================== -->

                <div class="mesa-master">

                    <span>👑 MESTRE</span>

                    <strong>
                        ${escaparHTML(
                            window.obterNomeMestre()
                        )}
                    </strong>

                </div>


                <!-- ==============================
                     MESA
                =============================== -->

                <div
                    id="rpg-table"
                    class="rpg-table mesa-state-campaign"
                >


                    <!-- LADO ESQUERDO -->

                    <div class="table-side left">

                        ${criarAssento(1)}
                        ${criarAssento(2)}
                        ${criarAssento(3)}
                        ${criarAssento(4)}

                    </div>


                    <!-- CENTRO -->

                    <div class="table-center">


                        <!-- TELA -->

                        <div
                            id="mesa-screen"
                            class="mesa-screen"
                        >

                            ${criarTelaInicial()}

                        </div>


                        <!-- MÓDULOS -->

                        <div class="table-modules">

                            <button
                                type="button"
                                class="table-module"
                                data-table-module="character"
                            >
                                <span>🎴</span>
                                <small>PERSONAGEM</small>
                            </button>


                            <button
                                type="button"
                                class="table-module"
                                data-table-module="status"
                            >
                                <span>❤️</span>
                                <small>STATUS</small>
                            </button>


                            <button
                                type="button"
                                class="table-module"
                                data-table-module="affinity"
                            >
                                <span>✨</span>
                                <small>AFINIDADES</small>
                            </button>


                            <button
                                type="button"
                                class="table-module"
                                data-table-module="inventory"
                            >
                                <span>🎒</span>
                                <small>INVENTÁRIO</small>
                            </button>


                            <button
                                type="button"
                                class="table-module"
                                data-table-module="map"
                            >
                                <span>🗺️</span>
                                <small>MAPA</small>
                            </button>


                            <button
                                type="button"
                                class="table-module"
                                data-table-module="combat"
                            >
                                <span>⚔️</span>
                                <small>COMBATE</small>
                            </button>


                            <button
                                type="button"
                                class="table-module"
                                data-table-module="cte"
                            >
                                <span>⚡</span>
                                <small>CTE</small>
                            </button>

                        </div>


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

                    </div>


                    <!-- LADO DIREITO -->

                    <div class="table-side right">

                        ${criarAssento(5)}
                        ${criarAssento(6)}
                        ${criarAssento(7)}
                        ${criarAssento(8)}

                    </div>

                </div>


                <!-- ==============================
                     CARDS
                =============================== -->

                <section class="online-table-players">

                    <div class="online-table-section-title">

                        <span>
                            JOGADORES
                        </span>

                        <strong
                            id="online-table-player-count"
                        >
                            0 / 8
                        </strong>

                    </div>


                    <div
                        id="online-table-player-list"
                        class="online-table-player-list"
                    >
                    </div>

                </section>

            </main>


            <!-- ==================================
                 CONFIGURAÇÕES
            ================================== -->

            <div
                id="mesa-settings-panel"
                class="mesa-overlay"
                style="display:none;"
            >

                <div class="mesa-settings-box">

                    <div class="mesa-panel-header">

                        <div>

                            <small>
                                OPÇÕES DA MESA
                            </small>

                            <h2>
                                ⚙️ Configurações
                            </h2>

                        </div>


                        <button
                            id="mesa-settings-close"
                            class="mesa-close-button"
                            type="button"
                        >
                            ✕
                        </button>

                    </div>


                    <!-- MESTRE -->

                    <div
                        id="mesa-master-settings"
                        style="display:none;"
                    >

                        <div class="mesa-settings-heading master">
                            👑 MODO MESTRE
                        </div>


                        ${criarBotaoConfiguracao(
                            "players",
                            "👥",
                            "Jogadores",
                            "Gerenciar jogadores da mesa"
                        )}


                        ${criarBotaoConfiguracao(
                            "characters",
                            "🎴",
                            "Personagens",
                            "Visualizar personagens"
                        )}


                        ${criarBotaoConfiguracao(
                            "status",
                            "❤️",
                            "Status",
                            "Controlar status dos jogadores"
                        )}


                        ${criarBotaoConfiguracao(
                            "needs",
                            "🍖",
                            "Fome e Sede",
                            "Controlar necessidades"
                        )}


                        ${criarBotaoConfiguracao(
                            "inventory",
                            "🎒",
                            "Inventário",
                            "Dar, remover e trocar itens"
                        )}


                        ${criarBotaoConfiguracao(
                            "combat",
                            "⚔️",
                            "Combate",
                            "Controle do combate"
                        )}


                        ${criarBotaoConfiguracao(
                            "events",
                            "⚡",
                            "Eventos / CTE",
                            "Criar e lançar eventos"
                        )}


                        ${criarBotaoConfiguracao(
                            "map",
                            "🗺️",
                            "Mapa",
                            "Controle do mapa"
                        )}


                        <button
                            type="button"
                            class="mesa-boss-button"
                            id="mesa-boss-button"
                        >
                            👹 DISPARAR ALERTA DE BOSS
                        </button>

                    </div>


                    <!-- JOGADOR -->

                    <div
                        id="mesa-player-settings"
                        style="display:none;"
                    >

                        <div class="mesa-settings-heading">
                            ⚙️ OPÇÕES DO JOGADOR
                        </div>


                        ${criarBotaoConfiguracao(
                            "interface",
                            "🎨",
                            "Interface",
                            "Opções visuais da mesa"
                        )}


                        ${criarBotaoConfiguracao(
                            "help",
                            "❓",
                            "Ajuda",
                            "Informações da mesa"
                        )}

                    </div>


                    <div class="mesa-settings-maintenance">

                        <small>
                            🔄 MESA
                        </small>


                        <button
                            id="mesa-refresh-button"
                            class="mesa-setting-action"
                            type="button"
                        >
                            🔄 ATUALIZAR MESA
                        </button>


                        <div
                            id="mesa-refresh-status"
                            class="mesa-refresh-status"
                        ></div>

                    </div>

                </div>

            </div>


            <!-- ==================================
                 MODAL DO JOGADOR
            ================================== -->

            <div
                id="mesa-player-modal"
                class="mesa-overlay"
                style="display:none;"
            >

                <div
                    id="mesa-player-modal-content"
                    class="mesa-module-box"
                >
                </div>

            </div>

        `;


        document.body.appendChild(
            painel
        );


        configurarEstilosMesa();

        configurarEventosMesa();

        atualizarPermissoesConfiguracoes();

        atualizarListaJogadores();

    }


    // ==========================================
    // TELA INICIAL
    // ==========================================

    function criarTelaInicial() {

        return `

            <div class="mesa-screen-home">

                <div class="mesa-screen-symbol">
                    🎲
                </div>

                <h3>
                    MESA DE RPG
                </h3>

                <p>
                    Aguardando uma ação...
                </p>

                <span>
                    Selecione um módulo abaixo.
                </span>

            </div>

        `;

    }


    // ==========================================
    // BOTÃO DE CONFIGURAÇÃO
    // ==========================================

    function criarBotaoConfiguracao(
        ferramenta,
        icone,
        titulo,
        descricao
    ) {

        return `

            <button
                type="button"
                class="mesa-setting-option"
                data-master-tool="${escaparHTML(
                    ferramenta
                )}"
                data-player-tool="${escaparHTML(
                    ferramenta
                )}"
            >

                <span>
                    ${icone}
                </span>

                <div>

                    <strong>
                        ${escaparHTML(titulo)}
                    </strong>

                    <small>
                        ${escaparHTML(descricao)}
                    </small>

                </div>

            </button>

        `;

    }


    // ==========================================
    // CONFIGURAR EVENTOS
    // ==========================================

    function configurarEventosMesa() {

        const painel =
            document.getElementById(
                "online-table-panel"
            );


        if (!painel) {

            return;

        }


        const settingsButton =
            document.getElementById(
                "mesa-settings-button"
            );


        const settingsClose =
            document.getElementById(
                "mesa-settings-close"
            );


        const settings =
            document.getElementById(
                "mesa-settings-panel"
            );


        const refresh =
            document.getElementById(
                "mesa-refresh-button"
            );


        if (settingsButton) {

            settingsButton.addEventListener(
                "click",
                abrirConfiguracoesMesa
            );

        }


        if (settingsClose) {

            settingsClose.addEventListener(
                "click",
                fecharConfiguracoesMesa
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


        if (refresh) {

            refresh.addEventListener(
                "click",
                atualizarMesaSemRecarregar
            );

        }


        painel
            .querySelectorAll(
                "[data-table-module]"
            )
            .forEach(
                function (botao) {

                    botao.addEventListener(
                        "click",
                        function () {

                            abrirModulo(
                                botao.dataset.tableModule
                            );

                        }
                    );

                }
            );


        painel
            .querySelectorAll(
                "[data-master-tool]"
            )
            .forEach(
                function (botao) {

                    botao.addEventListener(
                        "click",
                        function () {

                            if (
                                !usuarioEhMestre()
                            ) {

                                return;

                            }


                            selecionarFerramentaMestre(
                                botao.dataset.masterTool
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
                function (botao) {

                    botao.addEventListener(
                        "click",
                        function () {

                            selecionarFerramentaJogador(
                                botao.dataset.playerTool
                            );

                        }
                    );

                }
            );


        const bossButton =
            document.getElementById(
                "mesa-boss-button"
            );


        if (bossButton) {

            bossButton.addEventListener(
                "click",
                function () {

                    if (
                        usuarioEhMestre()
                    ) {

                        ativarBoss();

                    }

                }
            );

        }

    }


    // ==========================================
    // ESTILOS
    // ==========================================

    function configurarEstilosMesa() {

        if (
            document.getElementById(
                "mesa-functional-style"
            )
        ) {

            return;

        }


        const style =
            document.createElement("style");


        style.id =
            "mesa-functional-style";


        style.textContent = `

            /* ==================================
               BASE
            ================================== */

            #online-table-panel {

                --mesa-accent:#7c3aed;
                --mesa-glow:rgba(124,58,237,.25);

                width:100%;
                min-height:100vh;

                box-sizing:border-box;

                padding:12px;

                background:
                    radial-gradient(
                        circle at 50% 15%,
                        rgba(124,58,237,.08),
                        transparent 40%
                    ),
                    #05030a;

                color:#f5f0ff;

            }


            .mesa-main {

                width:100%;
                max-width:1500px;

                margin:0 auto;

            }


            /* ==================================
               HEADER
            ================================== */

            .mesa-header {

                display:flex;

                align-items:center;

                justify-content:space-between;

                gap:12px;

                padding:10px 4px 16px;

            }


            .mesa-header-label {

                color:#8f839d;

                font-size:9px;

                letter-spacing:3px;

            }


            .mesa-header h2 {

                margin:3px 0 0;

                font-size:18px;

            }


            .mesa-header-actions {

                display:flex;

                align-items:center;

                gap:8px;

            }


            .mesa-mode-status {

                padding:8px 11px;

                border-radius:10px;

                border:1px solid var(--mesa-accent);

                background:rgba(255,255,255,.035);

                color:#ddd;

                font-size:9px;

                font-weight:bold;

                white-space:nowrap;

            }


            .mesa-icon-button {

                width:40px;

                height:40px;

                border:1px solid #68408a;

                border-radius:11px;

                background:#171020;

                color:#fff;

                cursor:pointer;

                font-size:18px;

            }


            /* ==================================
               MESTRE
            ================================== */

            .mesa-master {

                display:flex;

                flex-direction:column;

                align-items:center;

                gap:3px;

                margin-bottom:8px;

            }


            .mesa-master span {

                color:#8f839d;

                font-size:8px;

                letter-spacing:2px;

            }


            .mesa-master strong {

                color:#e9d5ff;

                font-size:12px;

            }


            /* ==================================
               MESA
            ================================== */

            .rpg-table {

                position:relative;

                display:grid;

                grid-template-columns:minmax(90px,170px) minmax(0,1fr) minmax(90px,170px);

                gap:14px;

                min-height:620px;

                padding:22px;

                border:2px solid var(--mesa-accent);

                border-radius:32px;

                background:
                    radial-gradient(
                        circle at center,
                        rgba(124,58,237,.09),
                        transparent 58%
                    ),
                    linear-gradient(
                        145deg,
                        #171020,
                        #08060d
                    );

                box-shadow:
                    0 0 35px var(--mesa-glow),
                    inset 0 0 50px rgba(0,0,0,.45);

                transition:
                    border-color .25s ease,
                    box-shadow .25s ease,
                    background .25s ease;

            }


            .table-side {

                display:flex;

                flex-direction:column;

                justify-content:space-around;

                gap:10px;

            }


            .table-center {

                min-width:0;

                display:flex;

                flex-direction:column;

                justify-content:center;

                gap:14px;

            }


            /* ==================================
               ASSENTOS
            ================================== */

            .table-seat {

                min-height:82px;

                display:flex;

                align-items:center;

                justify-content:center;

                padding:8px;

                border:1px solid rgba(255,255,255,.09);

                border-radius:18px;

                background:
                    rgba(255,255,255,.035);

                box-shadow:
                    inset 0 0 20px rgba(0,0,0,.2);

                transition:
                    transform .2s ease,
                    border-color .2s ease,
                    background .2s ease;

                cursor:pointer;

            }


            .table-seat:hover {

                transform:scale(1.025);

                border-color:var(--mesa-accent);

                background:
                    rgba(124,58,237,.09);

            }


            .table-seat-content {

                text-align:center;

                min-width:0;

            }


            .table-seat-number {

                display:block;

                color:#75687f;

                font-size:8px;

                letter-spacing:1px;

            }


            .table-seat-character {

                display:block;

                margin-top:5px;

                color:#e9d5ff;

                font-size:10px;

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

            }


            /* ==================================
               TELA CENTRAL
            ================================== */

            .mesa-screen {

                position:relative;

                width:100%;

                min-height:300px;

                border:1px solid rgba(255,255,255,.1);

                border-radius:22px;

                overflow:hidden;

                background:
                    #08060d;

                box-shadow:
                    inset 0 0 35px rgba(0,0,0,.5);

            }


            .mesa-screen-home {

                min-height:300px;

                display:flex;

                flex-direction:column;

                justify-content:center;

                align-items:center;

                text-align:center;

                padding:25px;

            }


            .mesa-screen-symbol {

                font-size:46px;

                margin-bottom:10px;

                filter:
                    drop-shadow(
                        0 0 15px
                        var(--mesa-accent)
                    );

            }


            .mesa-screen-home h3 {

                margin:0;

                font-size:18px;

            }


            .mesa-screen-home p {

                margin:7px 0;

                color:#a99bb4;

                font-size:11px;

            }


            .mesa-screen-home span {

                color:#655b6d;

                font-size:9px;

            }


            /* ==================================
               MÓDULOS
            ================================== */

            .table-modules {

                display:grid;

                grid-template-columns:
                    repeat(7,minmax(0,1fr));

                gap:7px;

            }


            .table-module {

                min-width:0;

                padding:9px 4px;

                border:1px solid rgba(255,255,255,.08);

                border-radius:11px;

                background:#100c16;

                color:#fff;

                cursor:pointer;

                transition:
                    .2s ease;

            }


            .table-module:hover {

                border-color:var(--mesa-accent);

                background:
                    rgba(124,58,237,.12);

                transform:translateY(-2px);

            }


            .table-module span {

                display:block;

                font-size:18px;

            }


            .table-module small {

                display:block;

                margin-top:4px;

                color:#8f839d;

                font-size:7px;

            }


            /* ==================================
               CHAT
            ================================== */

            .table-chat {

                border:1px solid rgba(255,255,255,.07);

                border-radius:14px;

                background:rgba(0,0,0,.2);

                overflow:hidden;

            }


            .table-chat-title {

                padding:7px 10px;

                border-bottom:1px solid rgba(255,255,255,.06);

                color:#8f839d;

                font-size:8px;

                letter-spacing:1px;

            }


            .table-chat-messages {

                min-height:35px;

                max-height:60px;

                overflow:auto;

                padding:9px;

                color:#a99bb4;

                font-size:9px;

            }


            /* ==================================
               CARDS
            ================================== */

            .online-table-players {

                margin-top:15px;

            }


            .online-table-section-title {

                display:flex;

                justify-content:space-between;

                align-items:center;

                margin-bottom:9px;

            }


            .online-table-section-title span {

                color:#8f839d;

                font-size:9px;

                letter-spacing:2px;

            }


            .online-table-section-title strong {

                color:#c084fc;

                font-size:10px;

            }


            .online-table-player-list {

                display:grid;

                grid-template-columns:
                    repeat(4,minmax(0,1fr));

                gap:10px;

            }


            .mesa-player-card {

                position:relative;

                min-height:150px;

                padding:12px;

                border-radius:17px;

                border:1px solid #68408a;

                background:
                    linear-gradient(
                        145deg,
                        #171020,
                        #0b0910
                    );

                box-shadow:
                    0 0 18px rgba(124,58,237,.1);

                overflow:hidden;

                cursor:pointer;

                transition:.2s ease;

            }


            .mesa-player-card:hover {

                transform:translateY(-3px);

                border-color:#a78bfa;

                box-shadow:
                    0 0 24px
                    rgba(124,58,237,.25);

            }


            .mesa-player-card.selected {

                border-color:#f0abfc;

                box-shadow:
                    0 0 28px
                    rgba(192,132,252,.3);

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


            .mesa-player-card-top {

                display:flex;

                gap:9px;

                align-items:center;

                margin-bottom:10px;

            }


            .mesa-player-avatar {

                width:45px;

                height:45px;

                flex-shrink:0;

                display:flex;

                align-items:center;

                justify-content:center;

                border:1px solid #8b5cf6;

                border-radius:50%;

                background:#100b18;

                overflow:hidden;

                font-size:20px;

            }


            .mesa-player-avatar img {

                width:100%;
                height:100%;

                object-fit:cover;

            }


            .mesa-player-card-name {

                min-width:0;

            }


            .mesa-player-card-name strong {

                display:block;

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

                font-size:12px;

            }


            .mesa-player-card-name small {

                color:#75687f;

                font-size:8px;

            }


            .mesa-player-card-info {

                display:grid;

                grid-template-columns:1fr 1fr;

                gap:5px;

            }


            .mesa-player-card-info div {

                padding:6px;

                border-radius:8px;

                background:rgba(255,255,255,.035);

            }


            .mesa-player-card-info span {

                display:block;

                color:#75687f;

                font-size:7px;

            }


            .mesa-player-card-info strong {

                display:block;

                margin-top:2px;

                color:#e9d5ff;

                font-size:9px;

                overflow:hidden;

                text-overflow:ellipsis;

                white-space:nowrap;

            }


            .mesa-player-card-footer {

                display:flex;

                justify-content:space-between;

                margin-top:8px;

                color:#75687f;

                font-size:7px;

            }


            .mesa-player-card-status {

                color:#86efac;

            }


            .mesa-player-card-empty {

                min-height:150px;

                display:flex;

                flex-direction:column;

                align-items:center;

                justify-content:center;

                border:1px dashed rgba(255,255,255,.1);

                border-radius:17px;

                color:#75687f;

                text-align:center;

            }


            /* ==================================
               OVERLAYS
            ================================== */

            .mesa-overlay {

                position:fixed;

                inset:0;

                z-index:99999;

                display:flex;

                align-items:center;

                justify-content:center;

                padding:15px;

                background:
                    rgba(3,2,8,.88);

                backdrop-filter:blur(8px);

                overflow:auto;

            }


            .mesa-settings-box,
            .mesa-module-box {

                width:100%;

                max-width:540px;

                max-height:90vh;

                overflow:auto;

                padding:18px;

                border:1px solid #68408a;

                border-radius:20px;

                background:
                    linear-gradient(
                        160deg,
                        #171020,
                        #0b0910
                    );

                box-shadow:
                    0 0 35px
                    rgba(124,58,237,.25);

            }


            .mesa-panel-header {

                display:flex;

                justify-content:space-between;

                gap:10px;

                margin-bottom:15px;

            }


            .mesa-panel-header small {

                color:#8f839d;

                font-size:8px;

                letter-spacing:2px;

            }


            .mesa-panel-header h2 {

                margin:4px 0 0;

                font-size:18px;

            }


            .mesa-close-button {

                width:36px;
                height:36px;

                border:1px solid #68408a;

                border-radius:50%;

                background:#1b1424;

                color:#fff;

                cursor:pointer;

            }


            .mesa-settings-heading {

                padding:11px;

                margin-bottom:9px;

                border-radius:11px;

                background:rgba(255,255,255,.035);

                color:#c084fc;

                font-size:10px;

                letter-spacing:1px;

            }


            .mesa-settings-heading.master {

                border:1px solid #6f3aa8;

                background:
                    rgba(124,58,237,.08);

            }


            .mesa-setting-option {

                width:100%;

                display:flex;

                align-items:center;

                gap:11px;

                padding:11px;

                margin-bottom:7px;

                border:1px solid rgba(255,255,255,.08);

                border-radius:12px;

                background:rgba(255,255,255,.035);

                color:#fff;

                text-align:left;

                cursor:pointer;

                transition:.2s ease;

            }


            .mesa-setting-option:hover {

                border-color:#8b5cf6;

                background:
                    rgba(124,58,237,.1);

            }


            .mesa-setting-option > span {

                width:34px;
                height:34px;

                display:flex;

                align-items:center;
                justify-content:center;

                border-radius:9px;

                background:#1b1424;

                font-size:17px;

            }


            .mesa-setting-option div {

                display:flex;

                flex-direction:column;

                gap:2px;

            }


            .mesa-setting-option strong {

                font-size:11px;

            }


            .mesa-setting-option small {

                color:#8f839d;

                font-size:8px;

            }


            .mesa-settings-maintenance {

                margin-top:15px;

                padding-top:14px;

                border-top:1px solid rgba(255,255,255,.07);

            }


            .mesa-settings-maintenance > small {

                display:block;

                margin-bottom:8px;

                color:#75687f;

                font-size:8px;

            }


            .mesa-setting-action,
            .mesa-boss-button {

                width:100%;

                padding:11px;

                border-radius:11px;

                cursor:pointer;

                font-weight:bold;

            }


            .mesa-setting-action {

                border:1px solid #68408a;

                background:#1b1424;

                color:#d8c7e8;

            }


            .mesa-boss-button {

                margin-top:12px;

                border:1px solid #ef4444;

                background:rgba(239,68,68,.12);

                color:#fca5a5;

            }


            .mesa-refresh-status {

                min-height:15px;

                margin-top:7px;

                color:#75687f;

                text-align:center;

                font-size:8px;

            }


            /* ==================================
               PAINÉIS DE MÓDULO
            ================================== */

            .mesa-module-title {

                color:#c084fc;

                font-size:9px;

                letter-spacing:2px;

            }


            .mesa-module-box h2 {

                margin:5px 0 15px;

                font-size:20px;

            }


            .mesa-data-grid {

                display:grid;

                grid-template-columns:1fr 1fr;

                gap:8px;

            }


            .mesa-data-item {

                padding:10px;

                border:1px solid rgba(255,255,255,.07);

                border-radius:10px;

                background:rgba(255,255,255,.035);

            }


            .mesa-data-item span {

                display:block;

                color:#75687f;

                font-size:7px;

            }


            .mesa-data-item strong {

                display:block;

                margin-top:3px;

                color:#e9d5ff;

                font-size:11px;

            }


            .mesa-module-actions {

                display:flex;

                flex-wrap:wrap;

                gap:7px;

                margin-top:15px;

            }


            .mesa-module-action {

                flex:1;

                min-width:120px;

                padding:10px;

                border:1px solid #68408a;

                border-radius:10px;

                background:#171020;

                color:#e9d5ff;

                cursor:pointer;

            }


            /* ==================================
               STATUS
            ================================== */

            .mesa-hp-bar {

                height:12px;

                margin:7px 0 15px;

                border-radius:99px;

                overflow:hidden;

                background:#241d2c;

            }


            .mesa-hp-fill {

                height:100%;

                width:100%;

                background:#ef4444;

                transition:.3s ease;

            }


            /* ==================================
               MAPA
            ================================== */

            .mesa-map-wrap {

                position:relative;

                height:430px;

                overflow:hidden;

                border-radius:14px;

                background:#05070c;

                touch-action:none;

                cursor:grab;

            }


            .mesa-map-wrap.dragging {

                cursor:grabbing;

            }


            .mesa-map-svg {

                width:100%;

                height:100%;

                display:block;

                user-select:none;

            }


            .mesa-map-region {

                fill:rgba(14,165,164,.13);

                stroke:#0ea5a4;

                stroke-width:3;

                cursor:pointer;

                transition:.2s ease;

            }


            .mesa-map-region:hover {

                fill:rgba(14,165,164,.25);

            }


            .mesa-map-label {

                fill:#d8c7e8;

                font-size:20px;

                pointer-events:none;

                text-anchor:middle;

            }


            .mesa-map-player {

                fill:#c084fc;

                stroke:#fff;

                stroke-width:3;

                cursor:pointer;

            }


            .mesa-map-portal {

                fill:#7c3aed;

                stroke:#ddd6fe;

                stroke-width:3;

                animation:mesaPortalPulse 1.6s infinite;

            }


            @keyframes mesaPortalPulse {

                0%,100% {
                    opacity:.55;
                    transform:scale(1);
                    transform-origin:center;
                }

                50% {
                    opacity:1;
                    transform:scale(1.25);
                    transform-origin:center;
                }

            }


            .mesa-map-controls {

                position:absolute;

                top:8px;

                right:8px;

                display:flex;

                gap:5px;

                z-index:2;

            }


            .mesa-map-controls button {

                width:32px;
                height:32px;

                border:1px solid #68408a;

                border-radius:8px;

                background:#100b18;

                color:#fff;

                cursor:pointer;

            }


            /* ==================================
               CTE
            ================================== */

            .mesa-cte {

                min-height:300px;

                display:flex;

                flex-direction:column;

                justify-content:center;

                align-items:center;

                text-align:center;

                padding:20px;

                border:1px solid #eab308;

                background:
                    radial-gradient(
                        circle,
                        rgba(234,179,8,.12),
                        transparent 65%
                    );

            }


            .mesa-cte-timer {

                margin:15px 0;

                font-size:55px;

                font-weight:900;

                color:#fde047;

                text-shadow:
                    0 0 20px rgba(234,179,8,.5);

            }


            .mesa-cte-button {

                padding:14px 25px;

                border:1px solid #eab308;

                border-radius:12px;

                background:#302707;

                color:#fef08a;

                font-weight:bold;

                cursor:pointer;

            }


            /* ==================================
               COMBATE
            ================================== */

            .mesa-combat {

                min-height:300px;

                padding:20px;

                background:
                    radial-gradient(
                        circle,
                        rgba(239,68,68,.13),
                        transparent 65%
                    );

            }


            .mesa-combat-title {

                color:#fca5a5;

                font-size:22px;

                font-weight:bold;

            }


            /* ==================================
               BOSS
            ================================== */

            .mesa-boss-flash {

                animation:
                    mesaBossFlash .42s ease-in-out
                    0s 8 alternate;

            }


            @keyframes mesaBossFlash {

                from {

                    border-color:#7f1d1d;

                    box-shadow:
                        0 0 30px
                        rgba(239,68,68,.3);

                }

                to {

                    border-color:#ff0000;

                    box-shadow:
                        0 0 75px
                        rgba(239,0,0,.95);

                }

            }


            .mesa-boss-alert {

                position:absolute;

                inset:0;

                z-index:20;

                display:flex;

                align-items:center;

                justify-content:center;

                padding:20px;

                background:
                    rgba(90,0,0,.3);

                pointer-events:none;

            }


            .mesa-boss-alert-box {

                padding:22px;

                border:2px solid #ef4444;

                border-radius:18px;

                background:#180606;

                color:#fecaca;

                text-align:center;

                box-shadow:
                    0 0 40px
                    rgba(239,68,68,.7);

            }


            .mesa-boss-alert-box strong {

                display:block;

                font-size:28px;

                color:#f87171;

            }


            .mesa-boss-alert-box span {

                display:block;

                margin-top:7px;

                font-size:10px;

                letter-spacing:2px;

            }


            /* ==================================
               ESTADOS
            ================================== */

            .rpg-table.mesa-state-interface {

                --mesa-accent:#22c55e;

                --mesa-glow:rgba(34,197,94,.25);

            }


            .rpg-table.mesa-state-combat {

                --mesa-accent:#ef4444;

                --mesa-glow:rgba(239,68,68,.3);

            }


            .rpg-table.mesa-state-cte {

                --mesa-accent:#eab308;

                --mesa-glow:rgba(234,179,8,.3);

            }


            .rpg-table.mesa-state-map {

                --mesa-accent:#3b82f6;

                --mesa-glow:rgba(59,130,246,.25);

            }


            /* ==================================
               RESPONSIVO
            ================================== */

            @media (max-width:900px) {

                .rpg-table {

                    grid-template-columns:
                        85px minmax(0,1fr) 85px;

                    min-height:560px;

                    padding:12px;

                    gap:8px;

                }


                .table-seat {

                    min-height:70px;

                }


                .table-modules {

                    grid-template-columns:
                        repeat(4,minmax(0,1fr));

                }


                .online-table-player-list {

                    grid-template-columns:
                        repeat(2,minmax(0,1fr));

                }

            }


            @media (max-width:600px) {

                #online-table-panel {

                    padding:7px;

                }


                .mesa-header h2 {

                    font-size:15px;

                }


                .mesa-mode-status {

                    display:none;

                }


                .rpg-table {

                    grid-template-columns:
                        58px minmax(0,1fr) 58px;

                    min-height:500px;

                    border-radius:22px;

                    padding:8px;

                }


                .table-seat {

                    min-height:62px;

                    border-radius:12px;

                }


                .table-seat-number {

                    font-size:6px;

                }


                .table-seat-character {

                    font-size:7px;

                }


                .mesa-screen {

                    min-height:240px;

                }


                .mesa-screen-home {

                    min-height:240px;

                }


                .mesa-map-wrap {

                    height:350px;

                }


                .online-table-player-list {

                    grid-template-columns:1fr 1fr;

                }


                .mesa-player-card {

                    min-height:135px;

                    padding:9px;

                }


                .mesa-player-avatar {

                    width:38px;

                    height:38px;

                }


                .mesa-player-card-info {

                    gap:3px;

                }

            }


            @media (max-width:380px) {

                .rpg-table {

                    grid-template-columns:
                        48px minmax(0,1fr) 48px;

                }


                .table-modules {

                    grid-template-columns:
                        repeat(3,minmax(0,1fr));

                }


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
    // CONFIGURAÇÕES
    // ==========================================

    function abrirConfiguracoesMesa() {

        const painel =
            document.getElementById(
                "mesa-settings-panel"
            );


        if (!painel) {

            return;

        }


        atualizarPermissoesConfiguracoes();


        painel.style.display =
            "flex";


        document.body.style.overflow =
            "hidden";

    }


    function fecharConfiguracoesMesa() {

        const painel =
            document.getElementById(
                "mesa-settings-panel"
            );


        if (!painel) {

            return;

        }


        painel.style.display =
            "none";


        document.body.style.overflow =
            "";

    }


    function atualizarPermissoesConfiguracoes() {

        const mestre =
            usuarioEhMestre();


        const masterArea =
            document.getElementById(
                "mesa-master-settings"
            );


        const playerArea =
            document.getElementById(
                "mesa-player-settings"
            );


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

    }


    // ==========================================
    // FERRAMENTAS DO MESTRE
    // ==========================================

    function selecionarFerramentaMestre(
        ferramenta
    ) {

        if (
            !usuarioEhMestre()
        ) {

            return;

        }


        fecharConfiguracoesMesa();


        const mapa = {

            players:
                "players",

            characters:
                "character",

            status:
                "status",

            needs:
                "needs",

            inventory:
                "inventory",

            combat:
                "combat",

            events:
                "cte",

            map:
                "map"

        };


        const modulo =
            mapa[ferramenta];


        if (modulo) {

            abrirModulo(modulo);

        }

    }


    // ==========================================
    // FERRAMENTAS DO JOGADOR
    // ==========================================

    function selecionarFerramentaJogador(
        ferramenta
    ) {

        fecharConfiguracoesMesa();


        if (
            ferramenta === "interface"
        ) {

            abrirModulo("interface");

            return;

        }


        if (
            ferramenta === "help"
        ) {

            abrirModulo("help");

        }

    }


    // ==========================================
    // ABRIR MÓDULO
    // ==========================================

    function abrirModulo(
        modulo
    ) {

        const tela =
            document.getElementById(
                "mesa-screen"
            );


        if (!tela) {

            return;

        }


        window.rpgMesa.activeModule =
            modulo;


        switch (modulo) {

            case "character":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaPersonagem(
                        obterPersonagemSelecionado()
                    );

                break;


            case "status":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaStatus(
                        obterPersonagemSelecionado()
                    );

                break;


            case "affinity":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaAfinidades(
                        obterPersonagemSelecionado()
                    );

                break;


            case "inventory":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaInventario(
                        obterPersonagemSelecionado()
                    );

                break;


            case "map":

                definirModoMesa(
                    "map"
                );

                tela.innerHTML =
                    criarTelaMapa();

                configurarMapa();

                break;


            case "combat":

                definirModoMesa(
                    "combat"
                );

                tela.innerHTML =
                    criarTelaCombate();

                break;


            case "cte":

                definirModoMesa(
                    "cte"
                );

                tela.innerHTML =
                    criarTelaCTE();

                break;


            case "interface":

                definirModoMesa(
                    "interface"
                );

                tela.innerHTML =
                    criarTelaInterface();

                break;


            case "needs":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaNecessidades(
                        obterPersonagemSelecionado()
                    );

                break;


            case "players":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaJogadores();

                configurarSelecaoJogadores();

                break;


            case "help":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaAjuda();

                break
            case "help":

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaAjuda();

                break;


            default:

                definirModoMesa(
                    "campaign"
                );

                tela.innerHTML =
                    criarTelaInicial();

                break;

        }

    }


    // ==========================================
    // PERSONAGEM SELECIONADO
    // ==========================================

    function obterPersonagemSelecionado() {

        if (
            window.rpgMesa.selectedCharacter
        ) {

            return window.rpgMesa.selectedCharacter;

        }


        const jogador =
            window.rpgMesa.players.find(
                function (player) {

                    return (
                        String(
                            player.user_id ||
                            player.id ||
                            player.player_id
                        ) ===
                        String(
                            window.rpgAuth?.user?.id
                        )
                    );

                }
            );


        if (jogador) {

            return (
                jogador.character ||
                jogador.personagem ||
                jogador
            );

        }


        return null;

    }


    // ==========================================
    // TELA — PERSONAGEM
    // ==========================================

    function criarTelaPersonagem(
        personagem
    ) {

        if (!personagem) {

            return criarTelaVazia(
                "🎴",
                "PERSONAGEM",
                "Nenhum personagem selecionado."
            );

        }


        const nome =
            personagem.name ||
            personagem.nome ||
            "Sem nome";


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


        const nivel =
            personagem.level ||
            personagem.nivel ||
            1;


        return `

            <div class="mesa-module-content">

                <div class="mesa-module-title">
                    🎴 PERSONAGEM
                </div>

                <h2>
                    ${escaparHTML(nome)}
                </h2>

                <div class="mesa-data-grid">

                    ${criarItemDados(
                        "RAÇA",
                        raca
                    )}

                    ${criarItemDados(
                        "CLASSE",
                        classe
                    )}

                    ${criarItemDados(
                        "AFINIDADE",
                        afinidade
                    )}

                    ${criarItemDados(
                        "NÍVEL",
                        nivel
                    )}

                </div>

            </div>

        `;

    }


    // ==========================================
    // TELA — STATUS
    // ==========================================

    function criarTelaStatus(
        personagem
    ) {

        if (!personagem) {

            return criarTelaVazia(
                "❤️",
                "STATUS",
                "Nenhum personagem selecionado."
            );

        }


        const hp =
            Number(
                personagem.hp ??
                personagem.health ??
                personagem.vida ??
                100
            );


        const maxHp =
            Number(
                personagem.max_hp ??
                personagem.maxHealth ??
                personagem.maxVida ??
                100
            );


        const hpSeguro =
            Math.max(
                0,
                Math.min(
                    hp,
                    maxHp || 100
                )
            );


        const porcentagem =
            maxHp > 0
                ? (hpSeguro / maxHp) * 100
                : 0;


        const energia =
            personagem.energy ??
            personagem.energia ??
            100;


        const mana =
            personagem.mana ??
            personagem.mp ??
            100;


        return `

            <div class="mesa-module-content">

                <div class="mesa-module-title">
                    ❤️ STATUS
                </div>

                <h2>
                    ${escaparHTML(
                        personagem.name ||
                        personagem.nome ||
                        "Personagem"
                    )}
                </h2>

                <div>

                    <small>
                        VIDA
                    </small>

                    <div class="mesa-hp-bar">

                        <div
                            class="mesa-hp-fill"
                            style="width:${porcentagem}%"
                        ></div>

                    </div>

                    <div
                        style="
                            display:flex;
                            justify-content:space-between;
                            font-size:10px;
                            color:#aaa;
                        "
                    >

                        <span>
                            HP
                        </span>

                        <strong>
                            ${hpSeguro} / ${maxHp}
                        </strong>

                    </div>

                </div>


                <div
                    class="mesa-data-grid"
                    style="margin-top:15px;"
                >

                    ${criarItemDados(
                        "ENERGIA",
                        energia
                    )}

                    ${criarItemDados(
                        "MANA",
                        mana
                    )}

                </div>

            </div>

        `;

    }


    // ==========================================
    // TELA — AFINIDADES
    // ==========================================

    function criarTelaAfinidades(
        personagem
    ) {

        if (!personagem) {

            return criarTelaVazia(
                "✨",
                "AFINIDADES",
                "Nenhum personagem selecionado."
            );

        }


        const afinidade =
            personagem.affinity ||
            personagem.afinidade ||
            "Nenhuma definida";


        const afinidades =
            personagem.affinities ||
            personagem.afinidades ||
            [];


        let lista = "";


        if (
            Array.isArray(afinidades) &&
            afinidades.length
        ) {

            lista =
                afinidades
                    .map(
                        function (item) {

                            return `

                                <div
                                    class="mesa-data-item"
                                >

                                    <span>
                                        AFINIDADE
                                    </span>

                                    <strong>
                                        ${escaparHTML(
                                            typeof item === "string"
                                                ? item
                                                : item.name ||
                                                  item.nome ||
                                                  "—"
                                        )}
                                    </strong>

                                </div>

                            `;

                        }
                    )
                    .join("");

        }


        return `

            <div class="mesa-module-content">

                <div class="mesa-module-title">
                    ✨ AFINIDADES
                </div>

                <h2>
                    ${escaparHTML(
                        personagem.name ||
                        personagem.nome ||
                        "Personagem"
                    )}
                </h2>

                <div class="mesa-data-grid">

                    ${criarItemDados(
                        "PRINCIPAL",
                        afinidade
                    )}

                    ${
                        lista ||
                        criarItemDados(
                            "STATUS",
                            "Nenhuma afinidade adicional"
                        )
                    }

                </div>

            </div>

        `;

    }


    // ==========================================
    // TELA — INVENTÁRIO
    // ==========================================

    function criarTelaInventario(
        personagem
    ) {

        if (!personagem) {

            return criarTelaVazia(
                "🎒",
                "INVENTÁRIO",
                "Nenhum personagem selecionado."
            );

        }


        const inventario =
            personagem.inventory ||
            personagem.inventario ||
            personagem.items ||
            personagem.itens ||
            [];


        let conteudo = "";


        if (
            Array.isArray(inventario) &&
            inventario.length
        ) {

            conteudo =
                inventario
                    .map(
                        function (item) {

                            const nome =
                                typeof item === "string"
                                    ? item
                                    : item.name ||
                                      item.nome ||
                                      "Item";


                            const quantidade =
                                typeof item === "object"
                                    ? (
                                        item.quantity ??
                                        item.quantidade ??
                                        1
                                    )
                                    : 1;


                            return `

                                <div
                                    class="mesa-data-item"
                                >

                                    <span>
                                        ITEM
                                    </span>

                                    <strong>
                                        ${escaparHTML(nome)}
                                        ×${escaparHTML(
                                            quantidade
                                        )}
                                    </strong>

                                </div>

                            `;

                        }
                    )
                    .join("");

        } else {

            conteudo = `

                <div
                    style="
                        grid-column:1/-1;
                        padding:25px;
                        text-align:center;
                        color:#75687f;
                    "
                >
                    🎒 Inventário vazio.
                </div>

            `;

        }


        return `

            <div class="mesa-module-content">

                <div class="mesa-module-title">
                    🎒 INVENTÁRIO
                </div>

                <h2>
                    ${escaparHTML(
                        personagem.name ||
                        personagem.nome ||
                        "Personagem"
                    )}
                </h2>

                <div class="mesa-data-grid">

                    ${conteudo}

                </div>

            </div>

        `;

    }


    // ==========================================
    // TELA — NECESSIDADES
    // ==========================================

    function criarTelaNecessidades(
        personagem
    ) {

        if (!personagem) {

            return criarTelaVazia(
                "🍖",
                "FOME E SEDE",
                "Nenhum personagem selecionado."
            );

        }


        const fome =
            personagem.hunger ??
            personagem.fome ??
            100;


        const sede =
            personagem.thirst ??
            personagem.sede ??
            100;


        return `

            <div class="mesa-module-content">

                <div class="mesa-module-title">
                    🍖 NECESSIDADES
                </div>

                <h2>
                    Fome e Sede
                </h2>

                <div class="mesa-data-grid">

                    ${criarItemDados(
                        "FOME",
                        fome + "%"
                    )}

                    ${criarItemDados(
                        "SEDE",
                        sede + "%"
                    )}

                </div>

                <p
                    style="
                        margin-top:15px;
                        color:#75687f;
                        font-size:9px;
                    "
                >
                    Os valores poderão ser alterados pelo
                    Mestre através do painel de controle.
                </p>

            </div>

        `;

    }


    // ==========================================
    // TELA — JOGADORES
    // ==========================================

    function criarTelaJogadores() {

        const jogadores =
            window.rpgMesa.players || [];


        if (!jogadores.length) {

            return criarTelaVazia(
                "👥",
                "JOGADORES",
                "Nenhum jogador conectado."
            );

        }


        return `

            <div class="mesa-module-content">

                <div class="mesa-module-title">
                    👥 JOGADORES
                </div>

                <h2>
                    Jogadores da Mesa
                </h2>

                <div class="mesa-data-grid">

                    ${
                        jogadores
                            .map(
                                function (player, index) {

                                    const nome =
                                        player.character?.name ||
                                        player.personagem?.name ||
                                        player.name ||
                                        player.username ||
                                        "Jogador " + (index + 1);


                                    return `

                                        <button
                                            type="button"
                                            class="mesa-data-item"
                                            data-select-player="${index}"
                                            style="
                                                cursor:pointer;
                                                color:#fff;
                                                text-align:left;
                                            "
                                        >

                                            <span>
                                                JOGADOR ${index + 1}
                                            </span>

                                            <strong>
                                                ${escaparHTML(nome)}
                                            </strong>

                                        </button>

                                    `;

                                }
                            )
                            .join("")
                    }

                </div>

            </div>

        `;

    }


    // ==========================================
    // SELEÇÃO DE JOGADORES
    // ==========================================

    function configurarSelecaoJogadores() {

        const tela =
            document.getElementById(
                "mesa-screen"
            );


        if (!tela) {

            return;

        }


        tela
            .querySelectorAll(
                "[data-select-player]"
            )
            .forEach(
                function (botao) {

                    botao.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    botao.dataset.selectPlayer
                                );


                            const jogador =
                                window.rpgMesa.players[
                                    index
                                ];


                            if (!jogador) {

                                return;

                            }


                            window.rpgMesa.selectedPlayer =
                                jogador;


                            window.rpgMesa.selectedCharacter =
                                jogador.character ||
                                jogador.personagem ||
                                jogador;


                            abrirModulo(
                                "character"
                            );

                        }
                    );

                }
            );

    }


    // ==========================================
    // TELA — COMBATE
    // ==========================================

    function criarTelaCombate() {

        return `

            <div class="mesa-combat">

                <div class="mesa-module-title">
                    ⚔️ SISTEMA DE COMBATE
                </div>

                <div class="mesa-combat-title">
                    COMBATE
                </div>

                <p
                    style="
                        color:#a99bb4;
                        font-size:10px;
                    "
                >
                    A mesa está em modo de combate.
                </p>

                ${
                    usuarioEhMestre()
                        ? `

                            <div
                                class="mesa-module-actions"
                            >

                                <button
                                    type="button"
                                    class="mesa-module-action"
                                    data-combat-action="start"
                                >
                                    ⚔️ INICIAR COMBATE
                                </button>

                                <button
                                    type="button"
                                    class="mesa-module-action"
                                    data-combat-action="end"
                                >
                                    🏳️ ENCERRAR COMBATE
                                </button>

                            </div>

                        `
                        : ""
                }

            </div>

        `;

    }


    // ==========================================
    // TELA — CTE
    // ==========================================

    function criarTelaCTE() {

        const cte =
            window.rpgMesa.cte;


        if (!cte) {

            return `

                <div class="mesa-cte">

                    <div
                        style="
                            font-size:45px;
                        "
                    >
                        ⚡
                    </div>

                    <h2>
                        CTE
                    </h2>

                    <p
                        style="
                            color:#a99bb4;
                            font-size:10px;
                        "
                    >
                        Nenhum evento ativo.
                    </p>

                    ${
                        usuarioEhMestre()
                            ? `

                                <button
                                    type="button"
                                    class="mesa-cte-button"
                                    id="mesa-cte-demo"
                                >
                                    ⚡ INICIAR CTE
                                </button>

                            `
                            : ""
                    }

                </div>

            `;

        }


        return `

            <div class="mesa-cte">

                <div
                    style="
                        color:#fde047;
                        font-size:9px;
                        letter-spacing:3px;
                    "
                >
                    ⚡ CLICK TIME EVENT
                </div>

                <h2>
                    ${escaparHTML(
                        cte.title ||
                        "EVENTO"
                    )}
                </h2>

                <p
                    style="
                        max-width:450px;
                        color:#d6ccad;
                        font-size:11px;
                    "
                >
                    ${escaparHTML(
                        cte.description ||
                        "Escolha uma ação."
                    )}
                </p>

                <div
                    class="mesa-cte-timer"
                    id="mesa-cte-timer"
                >
                    ${cte.timeLimit || 0}
                </div>

                <div
                    class="mesa-module-actions"
                    id="mesa-cte-options"
                >

                    ${
                        (cte.options || [])
                            .map(
                                function (opcao) {

                                    return `

                                        <button
                                            type="button"
                                            class="mesa-cte-button"
                                            data-cte-option="${escaparHTML(
                                                opcao.id ||
                                                opcao.value ||
                                                opcao.label
                                            )}"
                                        >
                                            ${escaparHTML(
                                                opcao.label ||
                                                opcao.text ||
                                                "Escolher"
                                            )}
                                        </button>

                                    `;

                                }
                            )
                            .join("")
                    }

                </div>

            </div>

        `;

    }


    // ==========================================
    // TELA — INTERFACE
    // ==========================================

    function criarTelaInterface() {

        return `

            <div class="mesa-screen-home">

                <div class="mesa-screen-symbol">
                    🎨
                </div>

                <h3>
                    INTERFACE DA MESA
                </h3>

                <p>
                    Personalização visual.
                </p>

                <div
                    class="mesa-module-actions"
                    style="max-width:400px;"
                >

                    <button
                        type="button"
                        class="mesa-module-action"
                        data-interface-mode="normal"
                    >
                        🟣 Padrão
                    </button>

                    <button
                        type="button"
                        class="mesa-module-action"
                        data-interface-mode="green"
                    >
                        🟢 Verde
                    </button>

                </div>

            </div>

        `;

    }


    // ==========================================
    // TELA — AJUDA
    // ==========================================

    function criarTelaAjuda() {

        return `

            <div class="mesa-screen-home">

                <div class="mesa-screen-symbol">
                    ❓
                </div>

                <h3>
                    AJUDA
                </h3>

                <p>
                    Bem-vindo à Mesa Online.
                </p>

                <span>
                    Use os módulos para acessar
                    personagem, status, inventário,
                    mapa, combate e CTE.
                </span>

            </div>

        `;

    }


    // ==========================================
    // TELA — MAPA
    // ==========================================

    function criarTelaMapa() {

        return `

            <div
                class="mesa-map-wrap"
                id="mesa-map"
            >

                <div class="mesa-map-controls">

                    <button
                        type="button"
                        id="mesa-map-minus"
                    >
                        −
                    </button>

                    <button
                        type="button"
                        id="mesa-map-reset"
                    >
                        ⟳
                    </button>

                    <button
                        type="button"
                        id="mesa-map-plus"
                    >
                        +
                    </button>

                </div>


                <svg
                    class="mesa-map-svg"
                    id="mesa-map-svg"
                    viewBox="0 0 1000 600"
                >

                    <rect
                        width="1000"
                        height="600"
                        fill="#080b12"
                    />


                    <path
                        class="mesa-map-region"
                        d="
                            M80 80
                            Q250 20 400 100
                            L350 250
                            Q200 280 80 220
                            Z
                        "
                        data-region="Região Norte"
                    />

                    <text
                        class="mesa-map-label"
                        x="230"
                        y="160"
                    >
                        REGIÃO NORTE
                    </text>


                    <path
                        class="mesa-map-region"
                        d="
                            M450 100
                            Q650 30 900 120
                            L850 300
                            Q650 340 480 260
                            Z
                        "
                        data-region="Região Leste"
                    />

                    <text
                        class="mesa-map-label"
                        x="680"
                        y="180"
                    >
                        REGIÃO LESTE
                    </text>


                    <path
                        class="mesa-map-region"
                        d="
                            M120 320
                            Q300 270 470 350
                            L420 520
                            Q250 550 100 460
                            Z
                        "
                        data-region="Região Sul"
                    />

                    <text
                        class="mesa-map-label"
                        x="280"
                        y="420"
                    >
                        REGIÃO SUL
                    </text>


                    <circle
                        class="mesa-map-portal"
                        cx="500"
                        cy="300"
                        r="14"
                        data-region="Portal Central"
                    />

                    <circle
                        class="mesa-map-player"
                        cx="700"
                        cy="410"
                        r="10"
                        data-player-map="true"
                    />

                </svg>

            </div>

        `;

    }


    // ==========================================
    // CONFIGURAR MAPA
    // ==========================================

    function configurarMapa() {

        const mapa =
            document.getElementById(
                "mesa-map"
            );


        const svg =
            document.getElementById(
                "mesa-map-svg"
            );


        if (!mapa || !svg) {

            return;

        }


        const estado =
            window.rpgMesa.map;


        estado.x = 0;
        estado.y = 0;
        estado.scale = 1;


        function aplicarTransformacao() {

            svg.style.transform =
                `
                    translate(
                        ${estado.x}px,
                        ${estado.y}px
                    )
                    scale(
                        ${estado.scale}
                    )
                `;

        }


        const plus =
            document.getElementById(
                "mesa-map-plus"
            );


        const minus =
            document.getElementById(
                "mesa-map-minus"
            );


        const reset =
            document.getElementById(
                "mesa-map-reset"
            );


        if (plus) {

            plus.onclick =
                function () {

                    estado.scale =
                        Math.min(
                            3,
                            estado.scale + .2
                        );

                    aplicarTransformacao();

                };

        }


        if (minus) {

            minus.onclick =
                function () {

                    estado.scale =
                        Math.max(
                            .6,
                            estado.scale - .2
                        );

                    aplicarTransformacao();

                };

        }


        if (reset) {

            reset.onclick =
                function () {

                    estado.x = 0;
                    estado.y = 0;
                    estado.scale = 1;

                    aplicarTransformacao();

                };

        }


        let arrastando = false;

        let inicioX = 0;

        let inicioY = 0;


        mapa.addEventListener(
            "pointerdown",
            function (evento) {

                if (
                    evento.target.closest(
                        ".mesa-map-controls"
                    )
                ) {

                    return;

                }


                arrastando = true;

                inicioX =
                    evento.clientX -
                    estado.x;

                inicioY =
                    evento.clientY -
                    estado.y;

                mapa.classList.add(
                    "dragging"
                );

                mapa.setPointerCapture(
                    evento.pointerId
                );

            }
        );


        mapa.addEventListener(
            "pointermove",
            function (evento) {

                if (!arrastando) {

                    return;

                }


                estado.x =
                    evento.clientX -
                    inicioX;

                estado.y =
                    evento.clientY -
                    inicioY;

                aplicarTransformacao();

            }
        );


        mapa.addEventListener(
            "pointerup",
            function (evento) {

                arrastando = false;

                mapa.classList.remove(
                    "dragging"
                );

                try {

                    mapa.releasePointerCapture(
                        evento.pointerId
                    );

                } catch (erro) {}

            }
        );


        svg
            .querySelectorAll(
                ".mesa-map-region,.mesa-map-portal"
            )
            .forEach(
                function (elemento) {

                    elemento.addEventListener(
                        "click",
                        function () {

                            const nome =
                                elemento.dataset.region ||
                                "Local";


                            mostrarNotificacaoMesa(
                                "🗺️ " + nome
                            );

                        }
                    );

                }
            );

    }


    // ==========================================
    // MODO DA MESA
    // ==========================================

    function definirModoMesa(
        modo
    ) {

        const tabela =
            document.getElementById(
                "rpg-table"
            );


        const status =
            document.getElementById(
                "mesa-mode-status"
            );


        if (!tabela) {

            return;

        }


        tabela.classList.remove(
            "mesa-state-campaign",
            "mesa-state-interface",
            "mesa-state-combat",
            "mesa-state-cte",
            "mesa-state-map",
            "mesa-state-boss"
        );


        let classe =
            "mesa-state-campaign";


        let texto =
            "🟢 CAMPANHA";


        switch (modo) {

            case "interface":

                classe =
                    "mesa-state-interface";

                texto =
                    "🟢 INTERFACE";

                break;


            case "combat":

                classe =
                    "mesa-state-combat";

                texto =
                    "🔴 COMBATE";

                break;


            case "cte":

                classe =
                    "mesa-state-cte";

                texto =
                    "🟡 CTE";

                break;


            case "map":

                classe =
                    "mesa-state-map";

                texto =
                    "🔵 MAPA";

                break;


            case "boss":

                classe =
                    "mesa-state-boss";

                texto =
                    "🚨 BOSS";

                break;


            default:

                break;

        }


        tabela.classList.add(
            classe
        );


        window.rpgMesa.mode =
            modo;


        if (status) {

            status.textContent =
                texto;

        }

    }


    // ==========================================
    // CTE — INICIAR
    // ==========================================

    function iniciarCTE(
        dados
    ) {

        dados =
            dados || {};


        const duracao =
            Number(
                dados.timeLimit ??
                dados.tempo ??
                10
            );


        window.rpgMesa.cte = {

            title:
                dados.title ||
                dados.titulo ||
                "EVENTO",

            description:
                dados.description ||
                dados.descricao ||
                "Escolha uma ação.",

            timeLimit:
                Math.max(
                    1,
                    duracao
                ),

            remaining:
                Math.max(
                    1,
                    duracao
                ),

            options:
                Array.isArray(
                    dados.options
                )
                    ? dados.options
                    : [],

            active:true

        };


        definirModoMesa(
            "cte"
        );


        abrirModulo(
            "cte"
        );


        iniciarTimerCTE();

    }


    // ==========================================
    // TIMER CTE
    // ==========================================

    function iniciarTimerCTE() {

        if (
            window.rpgMesa.cteTimer
        ) {

            clearInterval(
                window.rpgMesa.cteTimer
            );

        }


        window.rpgMesa.cteTimer =
            setInterval(
                function () {

                    const cte =
                        window.rpgMesa.cte;


                    if (
                        !cte ||
                        !cte.active
                    ) {

                        clearInterval(
                            window.rpgMesa.cteTimer
                        );

                        window.rpgMesa.cteTimer =
                            null;

                        return;

                    }


                    cte.remaining--;


                    const timer =
                        document.getElementById(
                            "mesa-cte-timer"
                        );


                    if (timer) {

                        timer.textContent =
                            cte.remaining;

                    }


                    if (
                        cte.remaining <= 0
                    ) {

                        finalizarCTE();

                    }

                },
                1000
            );

    }


    // ==========================================
    // RESPONDER CTE
    // ==========================================

    function responderCTE(
        id
    ) {

        const cte =
            window.rpgMesa.cte;


        if (
            !cte ||
            !cte.active
        ) {

            return;

        }


        const opcao =
            cte.options.find(
                function (item) {

                    return String(
                        item.id ||
                        item.value ||
                        item.label
                    ) ===
                    String(id);

                }
            );


        if (!opcao) {

            return;

        }


        cte.active = false;


        mostrarNotificacaoMesa(
            "⚡ Escolha registrada: " +
            (
                opcao.label ||
                opcao.text ||
                "opção"
            )
        );


        finalizarCTE();

    }


    // ==========================================
    // FINALIZAR CTE
    // ==========================================

    function finalizarCTE() {

        if (
            window.rpgMesa.cteTimer
        ) {

            clearInterval(
                window.rpgMesa.cteTimer
            );

            window.rpgMesa.cteTimer =
                null;

        }


        if (
            window.rpgMesa.cte
        ) {

            window.rpgMesa.cte.active =
                false;

        }


        window.rpgMesa.cte =
            null;


        definirModoMesa(
            "interface"
        );


        abrirModulo(
            "interface"
        );

    }


    // ==========================================
    // BOSS
    // ==========================================

    function ativarBoss(
        nome
    ) {

        nome =
            nome ||
            "BOSS";

        
        definirModoMesa(
            "boss"
        );


        const tabela =
            document.getElementById(
                "rpg-table"
            );


        if (!tabela) {

            return;

        }


        tabela.classList.remove(
            "mesa-boss-flash"
        );


        void tabela.offsetWidth;


        tabela.classList.add(
            "mesa-boss-flash"
        );


        const alerta =
            document.createElement(
                "div"
            );


        alerta.className =
            "mesa-boss-alert";


        alerta.innerHTML = `

            <div
                class="mesa-boss-alert-box"
            >

                <strong>
                    🚨 BOSS
                </strong>

                <span>
                    ${escaparHTML(nome)}
                </span>

            </div>

        `;


        tabela.appendChild(
            alerta
        );


        mostrarNotificacaoMesa(
            "🚨 ALERTA DE BOSS: " +
            nome
        );


        if (
            window.rpgMesa.bossTimeout
        ) {

            clearTimeout(
                window.rpgMesa.bossTimeout
            );

        }


        window.rpgMesa.bossTimeout =
            setTimeout(
                function () {

                    tabela.classList.remove(
                        "mesa-boss-flash"
                    );


                    if (
                        alerta.parentNode
                    ) {

                        alerta.remove();

                    }


                    definirModoMesa(
                        "interface"
                    );

                },
                5000
            );

    }


    // ==========================================
    // ITEM DE DADOS
    // ==========================================

    function criarItemDados(
        label,
        valor
    ) {

        return `

            <div class="mesa-data-item">

                <span>
                    ${escaparHTML(label)}
                </span>

                <strong>
                    ${escaparHTML(valor)}
                </strong>

            </div>

        `;

    }


    // ==========================================
    // TELA VAZIA
    // ==========================================

    function criarTelaVazia(
        icone,
        titulo,
        mensagem
    ) {

        return `

            <div class="mesa-screen-home">

                <div class="mesa-screen-symbol">
                    ${icone}
                </div>

                <h3>
                    ${escaparHTML(titulo)}
                </h3>

                <p>
                    ${escaparHTML(mensagem)}
                </p>

            </div>

        `;

    }


    // ==========================================
    // NOTIFICAÇÃO
    // ==========================================

    function mostrarNotificacaoMesa(
        mensagem
    ) {

        let notificacao =
            document.getElementById(
                "mesa-notificacao"
            );


        if (!notificacao) {

            notificacao =
                document.createElement(
                    "div"
                );


            notificacao.id =
                "mesa-notificacao";


            notificacao.style.cssText = `

                position:fixed;
                left:50%;
                bottom:20px;
                transform:translateX(-50%);
                z-index:100000;

                max-width:90%;
                padding:10px 15px;

                border:1px solid #8b5cf6;
                border-radius:12px;

                background:#171020;
                color:#fff;

                box-shadow:
                    0 0 25px
                    rgba(124,58,237,.35);

                font-size:10px;
                text-align:center;

            `;


            document.body.appendChild(
                notificacao
            );

        }


        notificacao.textContent =
            mensagem;


        notificacao.style.display =
            "block";


        clearTimeout(
            notificacao._timeout
        );


        notificacao._timeout =
            setTimeout(
                function () {

                    notificacao.style.display =
                        "none";

                },
                3000
            );

    }


    // ==========================================
    // ATUALIZAR MESA
    // ==========================================

    async function atualizarMesaSemRecarregar() {

        const status =
            document.getElementById(
                "mesa-refresh-status"
            );


        if (status) {

            status.textContent =
                "Atualizando...";

        }


        try {

            await carregarJogadoresMesa();

            if (status) {

                status.textContent =
                    "✓ Mesa atualizada.";

            }


            mostrarNotificacaoMesa(
                "🔄 Mesa atualizada."
            );

        } catch (erro) {

            console.error(
                erro
            );


            if (status) {

                status.textContent =
                    "Erro ao atualizar.";

            }

        }

    }


    // ==========================================
    // EXPOR FUNÇÕES
    // ==========================================

    window.rpgMesa.definirModo =
        definirModoMesa;


    window.rpgMesa.abrirModulo =
        abrirModulo;


    window.rpgMesa.iniciarCTE =
        iniciarCTE;


    window.rpgMesa.responderCTE =
        responderCTE;


    window.rpgMesa.finalizarCTE =
        finalizarCTE;


    window.rpgMesa.alertarBoss =
        ativarBoss;


    window.rpgMesa.abrirConfiguracoes =
        abrirConfiguracoesMesa;


    window.rpgMesa.fecharConfiguracoes =
        fecharConfiguracoesMesa;


    window.rpgMesa.usuarioEhMestre =
        usuarioEhMestre;


    window.rpgMesa.obterJogadores =
        function () {

            return (
                window.rpgMesa.players || []
            );

        };


    // ==========================================
    // INICIAR
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
window.addEventListener("error", function (e) {
    document.body.innerHTML = `
        <div style="
            padding:20px;
            background:#120505;
            color:#fff;
            font-family:monospace;
            min-height:100vh;
            box-sizing:border-box;
        ">
            <h2 style="color:#ff5555;">❌ Erro na Mesa</h2>

            <p><strong>Mensagem:</strong></p>
            <pre style="
                white-space:pre-wrap;
                background:#000;
                padding:15px;
                border-radius:8px;
            ">${e.message || "Erro desconhecido"}</pre>

            <p><strong>Arquivo:</strong> ${e.filename || "desconhecido"}</p>
            <p><strong>Linha:</strong> ${e.lineno || "desconhecida"}</p>
        </div>
    `;
});

window.addEventListener("unhandledrejection", function (e) {
    document.body.innerHTML = `
        <div style="
            padding:20px;
            background:#120505;
            color:#fff;
            font-family:monospace;
            min-height:100vh;
            box-sizing:border-box;
        ">
            <h2 style="color:#ff5555;">❌ Erro na Mesa</h2>

            <p><strong>Promise rejeitada:</strong></p>
            <pre style="
                white-space:pre-wrap;
                background:#000;
                padding:15px;
                border-radius:8px;
            ">${e.reason?.message || e.reason || "Erro desconhecido"}</pre>
        </div>
    `;
});
