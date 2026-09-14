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


        aplicarEstilosMesa();

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
    // ESTILOS TEMPORÁRIOS DA MESA
    // ==========================================

    function aplicarEstilosMesa() {

        if (
            document.getElementById(
                "online-table-styles"
            )
        ) {

            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "online-table-styles";


        style.textContent = `

            #online-table-panel {

                width: min(
                    100%,
                    540px
                );

                margin: 25px auto;

                padding: 20px;

                border-radius: 20px;

                background:
                    linear-gradient(
                        160deg,
                        #171020,
                        #0b0910
                    );

                border:
                    1px solid #6f3aa8;

                box-shadow:
                    0 0 30px
                    rgba(
                        124,
                        58,
                        237,
                        0.18
                    );

                color: #f5f0ff;

                box-sizing: border-box;

            }


            .online-table-header {

                display: flex;

                justify-content:
                    space-between;

                align-items:
                    center;

                gap: 15px;

                margin-bottom: 20px;

            }


            .online-table-label {

                display: block;

                font-size: 10px;

                letter-spacing: 2px;

                color: #a78bfa;

                margin-bottom: 5px;

            }


            .online-table-header h2 {

                margin: 0;

                font-size: 23px;

            }


            .online-table-status {

                padding: 7px 10px;

                border-radius: 20px;

                background:
                    rgba(
                        34,
                        197,
                        94,
                        0.08
                    );

                border:
                    1px solid
                    rgba(
                        34,
                        197,
                        94,
                        0.25
                    );

                color: #86efac;

                font-size: 9px;

                font-weight: bold;

                letter-spacing: 1px;

                white-space: nowrap;

            }


            .online-table-master {

                display: flex;

                align-items: center;

                gap: 12px;

                padding: 14px;

                margin-bottom: 20px;

                border-radius: 14px;

                background:
                    rgba(
                        124,
                        58,
                        237,
                        0.08
                    );

                border:
                    1px solid
                    rgba(
                        255,
                        255,
                        255,
                        0.07
                    );

            }


            .online-table-icon {

                width: 45px;

                height: 45px;

                display: flex;

                align-items: center;

                justify-content: center;

                border-radius: 50%;

                background:
                    radial-gradient(
                        circle,
                        #35205a,
                        #100b18
                    );

                border:
                    1px solid #8b5cf6;

                font-size: 22px;

            }


            .online-table-master small {

                display: block;

                margin-bottom: 4px;

                font-size: 9px;

                letter-spacing: 1px;

                color: #8f839d;

            }


            .online-table-master strong {

                display: block;

                font-size: 14px;

            }


            .online-table-section-title {

                display: flex;

                justify-content:
                    space-between;

                align-items: center;

                margin-bottom: 10px;

                font-size: 11px;

                letter-spacing: 2px;

                color: #b9a9c8;

            }


            .online-table-section-title strong {

                color: #c084fc;

                letter-spacing: 0;

            }


            .online-table-player-list {

                display: flex;

                flex-direction: column;

                gap: 8px;

            }


            .online-table-empty {

                padding: 18px;

                text-align: center;

                border-radius: 12px;

                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.03
                    );

                border:
                    1px solid
                    rgba(
                        255,
                        255,
                        255,
                        0.06
                    );

                color: #75687f;

                font-size: 11px;

            }


            @media (max-width: 380px) {

                #online-table-panel {

                    margin-top: 15px;

                    padding: 16px;

                }


                .online-table-header h2 {

                    font-size: 20px;

                }

            }

        `;


        document.head.appendChild(
            style
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
