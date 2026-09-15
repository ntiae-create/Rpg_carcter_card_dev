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

        initialized: false

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


            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        250
                    );

                }
            );


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


            // ----------------------------------
            // SE AINDA NÃO EXISTIR
            // ----------------------------------

            if (!campanha) {

                await new Promise(
                    function (resolve) {

                        setTimeout(
                            resolve,
                            250
                        );

                    }
                );

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


        window.rpgMesa.initialized =
            true;


        // --------------------------------------
        // MOSTRAR MESA
        // --------------------------------------

        criarInterfaceMesa();


        console.log(
            "✅ Mesa.js: mesa inicializada.",
            campanha
        );

    }


    // ==========================================
    // CRIAR INTERFACE
    // ==========================================

    function criarInterfaceMesa() {

        // Evitar duplicação

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


        painel.innerHTML = `

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
                    🟢 ATIVA
                </div>

            </div>


            <div class="online-table-master">

                <span class="online-table-icon">
                    👑
                </span>

                <div>

                    <small>MESTRE</small>

                    <strong>
                        ${escaparHTML(
                            obterNomeMestre()
                        )}
                    </strong>

                </div>

            </div>


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


        document.body.appendChild(
            painel
        );

    }


    // ==========================================
    // NOME DO MESTRE
    // ==========================================

    function obterNomeMestre() {

        const user =
            window.rpgAuth?.user;


        if (!user) {

            return "Mestre";

        }


        if (
            user.user_metadata &&
            user.user_metadata.name
        ) {

            return user.user_metadata.name;

        }


        if (
            user.user_metadata &&
            user.user_metadata.full_name
        ) {

            return user.user_metadata.full_name;

        }


        if (user.email) {

            return user.email;

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
