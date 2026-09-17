/* ==========================================
   MESA ONLINE — RPG
   CONFIGURAÇÕES E SISTEMA DO MESTRE
========================================== */

"use strict";

(function () {

    let settingsButton = null;
    let masterMenu = null;
    let masterButtons = [];

    /* ==========================================
       INICIALIZAÇÃO
    ========================================== */

    function inicializarConfigMesa() {

        settingsButton =
            document.getElementById("btn-configuracoes");

        masterMenu =
            document.getElementById("master-menu");

        masterButtons =
            Array.from(
                document.querySelectorAll(
                    "[data-master-action]"
                )
            );

        if (!settingsButton) {
            console.warn(
                "[Config Mesa] Botão de configurações não encontrado."
            );
            return;
        }

        if (!masterMenu) {
            console.warn(
                "[Config Mesa] Menu do Mestre não encontrado."
            );
            return;
        }

        registrarEventos();

        atualizarPermissaoMestre();
    }


    /* ==========================================
       PERMISSÃO DO MESTRE
    ========================================== */

    function usuarioEhMestre() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.usuarioEhMestre ===
                "function"
        ) {
            return window.MesaRPG.usuarioEhMestre();
        }

        return false;
    }


    function atualizarPermissaoMestre() {

        if (!settingsButton || !masterMenu) {
            return;
        }

        const ehMestre =
            usuarioEhMestre();

        /*
         * O botão só aparece para o Mestre.
         */

        settingsButton.hidden =
            !ehMestre;

        /*
         * Se deixar de ser Mestre,
         * o menu também é fechado.
         */

        if (!ehMestre) {
            fecharMenuMestre();
        }
    }


    /* ==========================================
       EVENTOS
    ========================================== */

    function registrarEventos() {

        /*
         * BOTÃO ⚙️
         */

        settingsButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                alternarMenuMestre();
            }
        );


        /*
         * AÇÕES DO MENU DO MESTRE
         */

        masterButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();
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
         * FECHAR MENU AO CLICAR FORA
         */

        document.addEventListener(
            "click",
            function (event) {

                if (
                    !masterMenu ||
                    masterMenu.hidden
                ) {
                    return;
                }

                const clicouNoMenu =
                    masterMenu.contains(
                        event.target
                    );

                const clicouNoBotao =
                    settingsButton &&
                    settingsButton.contains(
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
         * ESC FECHA O MENU
         */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {
                    fecharMenuMestre();
                }
            }
        );


        /*
         * MESA TERMINOU DE INICIALIZAR
         */

        document.addEventListener(
            "mesa:inicializada",
            function () {

                atualizarPermissaoMestre();
            }
        );


        /*
         * CAMPANHA FOI ALTERADA
         */

        document.addEventListener(
            "mesa:campanhaAlterada",
            function () {

                atualizarPermissaoMestre();
            }
        );
    }


    /* ==========================================
       MENU DO MESTRE
    ========================================== */

    function abrirMenuMestre() {

        if (!usuarioEhMestre()) {
            return;
        }

        if (!masterMenu) {
            return;
        }

        masterMenu.hidden = false;
    }


    function fecharMenuMestre() {

        if (!masterMenu) {
            return;
        }

        masterMenu.hidden = true;
    }


    function alternarMenuMestre() {

        if (!usuarioEhMestre()) {
            return;
        }

        if (masterMenu.hidden) {
            abrirMenuMestre();
        } else {
            fecharMenuMestre();
        }
    }


    /* ==========================================
       AÇÕES DO MESTRE
    ========================================== */

    function executarAcaoMestre(acao) {

        /*
         * Segurança:
         * nenhuma ação do Mestre pode ser executada
         * se o usuário não tiver permissão.
         */

        if (!usuarioEhMestre()) {
            return;
        }

        /*
         * Fecha o menu antes de executar a ação.
         */

        fecharMenuMestre();


        switch (acao) {

            /* ------------------------------
               MAPA
            ------------------------------ */

            case "mapa":

                abrirMapa();

                break;


            /* ------------------------------
               DUNGEON
            ------------------------------ */

            case "dungeon":

                abrirDungeon();

                break;


            /* ------------------------------
               COMBATE
            ------------------------------ */

            case "combate":

                iniciarCombate();

                break;


            /* ------------------------------
               BOSS
            ------------------------------ */

            case "boss":

                iniciarBoss();

                break;


            /* ------------------------------
               CTE
            ------------------------------ */

            case "cte":

                iniciarCTE();

                break;


            default:

                console.warn(
                    "[Config Mesa] Ação desconhecida:",
                    acao
                );

                break;
        }
    }


    /* ==========================================
       MAPA
    ========================================== */

    function abrirMapa() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.abrirAventura ===
                "function"
        ) {

            window.MesaRPG.abrirAventura(
                "mapa"
            );

            return;
        }

        console.warn(
            "[Config Mesa] MesaRPG.abrirAventura() não está disponível."
        );
    }


    /* ==========================================
       DUNGEON
    ========================================== */

    function abrirDungeon() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.abrirAventura ===
                "function"
        ) {

            window.MesaRPG.abrirAventura(
                "dungeon"
            );

            return;
        }

        console.warn(
            "[Config Mesa] MesaRPG.abrirAventura() não está disponível."
        );
    }


    /* ==========================================
       COMBATE
    ========================================== */

    function iniciarCombate() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarBatalha ===
                "function"
        ) {

            window.MesaRPG.iniciarBatalha();

            return;
        }

        console.warn(
            "[Config Mesa] MesaRPG.iniciarBatalha() não está disponível."
        );
    }


    /* ==========================================
       BOSS
    ========================================== */

    function iniciarBoss() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarBoss ===
                "function"
        ) {

            window.MesaRPG.iniciarBoss();

            return;
        }

        console.warn(
            "[Config Mesa] MesaRPG.iniciarBoss() não está disponível."
        );
    }


    /* ==========================================
       CTE
    ========================================== */

    function iniciarCTE() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarCTE ===
                "function"
        ) {

            window.MesaRPG.iniciarCTE();

            return;
        }

        console.warn(
            "[Config Mesa] MesaRPG.iniciarCTE() não está disponível."
        );
    }


    /* ==========================================
       API PÚBLICA
    ========================================== */

    window.ConfigMesa = {

        abrirMenuMestre,
        fecharMenuMestre,
        alternarMenuMestre,

        atualizarPermissaoMestre,

        executarAcaoMestre
    };


    /* ==========================================
       DOM READY
    ========================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarConfigMesa
        );

    } else {

        inicializarConfigMesa();

    }

})();
