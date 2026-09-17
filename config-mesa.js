/* ==========================================
   MESA ONLINE — RPG
   CONFIGURAÇÕES DO MESTRE
========================================== */

"use strict";

(function () {

    /* ------------------------------------------
       REFERÊNCIAS
    ------------------------------------------ */

    let settingsButton = null;
    let masterMenu = null;
    let masterButtons = [];


    /* ------------------------------------------
       INICIALIZAÇÃO
    ------------------------------------------ */

    function inicializarConfigMesa() {

        settingsButton = document.getElementById("btn-configuracoes");
        masterMenu = document.getElementById("master-menu");

        masterButtons = Array.from(
            document.querySelectorAll("[data-master-action]")
        );

        if (!settingsButton || !masterMenu) {
            console.warn(
                "[Config Mesa] Botão de configurações ou menu do Mestre não encontrado."
            );
            return;
        }

        registrarEventos();

        atualizarPermissaoMestre();

    }


    /* ------------------------------------------
       PERMISSÃO
    ------------------------------------------ */

    function usuarioEhMestre() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.usuarioEhMestre === "function"
        ) {
            return window.MesaRPG.usuarioEhMestre();
        }

        return false;

    }


    function atualizarPermissaoMestre() {

        const ehMestre = usuarioEhMestre();

        settingsButton.hidden = !ehMestre;

        if (!ehMestre) {
            fecharMenuMestre();
        }

    }


    /* ------------------------------------------
       EVENTOS
    ------------------------------------------ */

    function registrarEventos() {

        settingsButton.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopPropagation();

            alternarMenuMestre();

        });


        document.addEventListener("click", function (event) {

            if (!masterMenu || masterMenu.hidden) {
                return;
            }

            const clicouNoMenu =
                masterMenu.contains(event.target);

            const clicouNoBotao =
                settingsButton.contains(event.target);

            if (!clicouNoMenu && !clicouNoBotao) {
                fecharMenuMestre();
            }

        });


        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape") {
                fecharMenuMestre();
            }

        });


        masterButtons.forEach(function (button) {

            button.addEventListener("click", function (event) {

                event.preventDefault();
                event.stopPropagation();

                const acao =
                    button.dataset.masterAction;

                executarAcaoMestre(acao);

            });

        });


        document.addEventListener(
            "mesa:inicializada",
            atualizarPermissaoMestre
        );


        document.addEventListener(
            "mesa:campanhaAlterada",
            atualizarPermissaoMestre
        );

    }


    /* ------------------------------------------
       MENU DO MESTRE
    ------------------------------------------ */

    function abrirMenuMestre() {

        if (!usuarioEhMestre()) {
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


    /* ------------------------------------------
       AÇÕES DO MESTRE
    ------------------------------------------ */

    function executarAcaoMestre(acao) {

        if (!usuarioEhMestre()) {
            return;
        }

        fecharMenuMestre();

        switch (acao) {

            case "mapa":
                abrirMapa();
                break;


            case "dungeon":
                abrirDungeon();
                break;


            case "combate":
                iniciarCombate();
                break;


            case "boss":
                iniciarBoss();
                break;


            case "cte":
                iniciarCTE();
                break;


            default:
                console.warn(
                    "[Config Mesa] Ação desconhecida:",
                    acao
                );

        }

    }


    /* ------------------------------------------
       MAPA
    ------------------------------------------ */

    function abrirMapa() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.abrirAventura === "function"
        ) {

            window.MesaRPG.abrirAventura("mapa");

        }

    }


    /* ------------------------------------------
       DUNGEON
    ------------------------------------------ */

    function abrirDungeon() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.abrirAventura === "function"
        ) {

            window.MesaRPG.abrirAventura("dungeon");

        }

    }


    /* ------------------------------------------
       COMBATE
    ------------------------------------------ */

    function iniciarCombate() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarBatalha === "function"
        ) {

            window.MesaRPG.iniciarBatalha();

        }

    }


    /* ------------------------------------------
       BOSS
    ------------------------------------------ */

    function iniciarBoss() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarBoss === "function"
        ) {

            window.MesaRPG.iniciarBoss();

        }

    }


    /* ------------------------------------------
       CTE
    ------------------------------------------ */

    function iniciarCTE() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.iniciarCTE === "function"
        ) {

            window.MesaRPG.iniciarCTE();

        }

    }


    /* ------------------------------------------
       API
    ------------------------------------------ */

    window.ConfigMesa = {

        abrirMenuMestre,
        fecharMenuMestre,
        alternarMenuMestre,
        atualizarPermissaoMestre,
        executarAcaoMestre

    };


    /* ------------------------------------------
       DOM READY
    ------------------------------------------ */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarConfigMesa
        );

    } else {

        inicializarConfigMesa();

    }

})();
