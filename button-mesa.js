/* ==========================================
   MESA ONLINE — RPG
   BOTÕES GERAIS DA MESA
========================================== */

"use strict";

(function () {

    /* ------------------------------------------
       REFERÊNCIAS
    ------------------------------------------ */

    let mesaContainer = null;
    let mesaStage = null;
    let mesaScreen = null;


    /* ------------------------------------------
       INICIALIZAÇÃO
    ------------------------------------------ */

    function inicializarBotoesMesa() {

        mesaContainer = document.getElementById("online-table-panel");
        mesaStage = document.getElementById("mesa-stage");
        mesaScreen = document.getElementById("mesa-screen");

        registrarEventos();

    }


    /* ------------------------------------------
       EVENTOS
    ------------------------------------------ */

    function registrarEventos() {

        /*
         * Delegação de eventos:
         * qualquer botão geral da Mesa pode ser
         * identificado pelo atributo data-mesa-action.
         */

        document.addEventListener("click", function (event) {

            const botao = event.target.closest(
                "[data-mesa-action]"
            );

            if (!botao) {
                return;
            }

            const acao = botao.dataset.mesaAction;

            executarAcao(acao, botao, event);

        });

    }


    /* ------------------------------------------
       AÇÕES GERAIS
    ------------------------------------------ */

    function executarAcao(acao, botao, event) {

        switch (acao) {

            /*
             * Voltar para a mesa normal
             */
            case "voltar":

                voltarParaMesa();

                break;


            /*
             * Abrir tela principal
             */
            case "mesa":

                mostrarMesaPrincipal();

                break;


            /*
             * Fechar alguma tela/painel
             */
            case "fechar":

                fecharPainel();

                break;


            /*
             * Atualizar Mesa
             */
            case "atualizar":

                atualizarMesa();

                break;


            /*
             * Ação ainda não definida
             */
            default:

                console.warn(
                    "[Button Mesa] Ação desconhecida:",
                    acao
                );

        }

    }


    /* ------------------------------------------
       VOLTAR PARA A MESA
    ------------------------------------------ */

    function voltarParaMesa() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.voltarParaMesaNormal === "function"
        ) {

            window.MesaRPG.voltarParaMesaNormal();

        }

    }


    /* ------------------------------------------
       MOSTRAR MESA PRINCIPAL
    ------------------------------------------ */

    function mostrarMesaPrincipal() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.mostrarTelaPrincipal === "function"
        ) {

            window.MesaRPG.mostrarTelaPrincipal();

        }

    }


    /* ------------------------------------------
       FECHAR PAINEL
    ------------------------------------------ */

    function fecharPainel() {

        /*
         * Primeiro tenta utilizar a API da Mesa.
         */

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.mostrarTelaPrincipal === "function"
        ) {

            window.MesaRPG.mostrarTelaPrincipal();

            return;

        }


        /*
         * Fallback visual.
         */

        if (mesaScreen) {
            mesaScreen.hidden = true;
        }

    }


    /* ------------------------------------------
       ATUALIZAR MESA
    ------------------------------------------ */

    function atualizarMesa() {

        if (
            window.MesaRPG &&
            typeof window.MesaRPG.atualizarAssentos === "function"
        ) {

            window.MesaRPG.atualizarAssentos();

        }

        document.dispatchEvent(
            new CustomEvent("mesa:atualizarSolicitado")
        );

    }


    /* ------------------------------------------
       API PÚBLICA
    ------------------------------------------ */

    window.ButtonMesa = {

        executarAcao,
        voltarParaMesa,
        mostrarMesaPrincipal,
        fecharPainel,
        atualizarMesa

    };


    /* ------------------------------------------
       DOM READY
    ------------------------------------------ */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            inicializarBotoesMesa
        );

    } else {

        inicializarBotoesMesa();

    }

})();
