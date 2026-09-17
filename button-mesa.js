/* ==========================================
   MESA ONLINE — RPG
   SISTEMA DE INTERAÇÃO DA MESA
========================================== */

"use strict";

(function () {


    /* ========================================================
       INICIALIZAÇÃO
    ======================================================== */

    function inicializarBotoesMesa() {

        registrarEventos();

        console.log(
            "[Button Mesa] Sistema de interação inicializado."
        );

    }



    /* ========================================================
       EVENTOS
    ======================================================== */

    function registrarEventos() {


        /* ----------------------------------------------
           CLIQUES GERAIS
        ---------------------------------------------- */

        document.addEventListener(
            "click",
            tratarCliqueGeral
        );


        /* ----------------------------------------------
           CLIQUE NOS CARDS DOS JOGADORES
        ---------------------------------------------- */

        document.addEventListener(
            "click",
            tratarCliqueCardJogador
        );


        /*
         NÃO registramos um segundo listener específico
         para CTE aqui.

         O CTE já é tratado por tratarCliqueGeral()
         através de [data-mesa-action].
        */

    }



    /* ========================================================
       CLIQUE GERAL
    ======================================================== */

    function tratarCliqueGeral(event) {

        const elemento =
            event.target.closest(
                "[data-mesa-action]"
            );


        if (!elemento) {

            return;

        }


        event.preventDefault();


        const acao =
            elemento.dataset.mesaAction;


        executarAcao(
            acao,
            elemento,
            event
        );

    }



    /* ========================================================
       EXECUTAR AÇÃO GERAL
    ======================================================== */

    function executarAcao(
        acao,
        elemento,
        event
    ) {

        if (!acao) {

            return;

        }


        switch (acao) {


            /* ----------------------------------------------
               VOLTAR
            ---------------------------------------------- */

            case "voltar":

                voltarParaMesa();

                break;



            /* ----------------------------------------------
               MESA PRINCIPAL
            ---------------------------------------------- */

            case "mesa":

                mostrarMesaPrincipal();

                break;



            /* ----------------------------------------------
               FECHAR
            ---------------------------------------------- */

            case "fechar":

                fecharPainel();

                break;



            /* ----------------------------------------------
               ATUALIZAR
            ---------------------------------------------- */

            case "atualizar":

                atualizarMesa();

                break;



            /* ----------------------------------------------
               CTE
            ---------------------------------------------- */

            case "cte":

                interagirCTE(
                    elemento,
                    event
                );

                break;



            /* ----------------------------------------------
               DESCONHECIDA
            ---------------------------------------------- */

            default:

                console.warn(
                    "[Button Mesa] Ação desconhecida:",
                    acao
                );

        }

    }



    /* ========================================================
       CARD DO JOGADOR
    ======================================================== */

    function tratarCliqueCardJogador(event) {

        const card =
            event.target.closest(
                "[data-player]"
            );


        if (!card) {

            return;

        }


        if (
            card.dataset.interactive ===
            "false"
        ) {

            return;

        }


        const slot =
            Number(
                card.dataset.player
            );


        if (

            !slot ||

            slot < 1 ||

            slot > 8

        ) {

            return;

        }


        if (

            window.MesaRPG &&

            typeof window.MesaRPG.selecionarJogador ===
            "function"

        ) {

            window.MesaRPG.selecionarJogador(
                slot
            );

        } else {

            console.warn(
                "[Button Mesa] MesaRPG ainda não está disponível."
            );

        }

    }



    /* ========================================================
       CTE
    ======================================================== */

    function interagirCTE(
        elemento,
        event,
        acao = null
    ) {

        const acaoCTE =
            acao ||
            elemento?.dataset?.cteAction ||
            "iniciar";


        /*
         O botão CTE somente encaminha
         a ação para o Core.

         NÃO existe cronômetro aqui.
         NÃO existe setInterval.
         NÃO existe setTimeout.
        */

        switch (acaoCTE) {


            case "iniciar":

                iniciarCTE();

                break;


            case "cancelar":

                limparCTE();

                break;


            default:

                document.dispatchEvent(

                    new CustomEvent(
                        "mesa:cteInteracao",
                        {

                            detail: {

                                acao:
                                    acaoCTE,

                                elemento,

                                evento:
                                    event

                            }

                        }

                    )

                );

        }

    }



    /* ========================================================
       VOLTAR PARA MESA
    ======================================================== */

    function voltarParaMesa() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.voltarParaMesaNormal ===
            "function"

        ) {

            window.MesaRPG.voltarParaMesaNormal();

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       MESA PRINCIPAL
    ======================================================== */

    function mostrarMesaPrincipal() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.mostrarTelaPrincipal ===
            "function"

        ) {

            window.MesaRPG.mostrarTelaPrincipal();

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       FECHAR PAINEL
    ======================================================== */

    function fecharPainel() {

        mostrarMesaPrincipal();

    }



    /* ========================================================
       ATUALIZAR MESA
    ======================================================== */

    function atualizarMesa() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.atualizarAssentos ===
            "function"

        ) {

            window.MesaRPG.atualizarAssentos();

        } else {

            console.warn(
                "[Button Mesa] MesaRPG ainda não está disponível."
            );

        }


        document.dispatchEvent(

            new CustomEvent(
                "mesa:atualizarSolicitado"
            )

        );

    }



    /* ========================================================
       CTE — ENCAMINHAR PARA O CORE
    ======================================================== */

    function iniciarCTE(
        opcoes = {}
    ) {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.iniciarCTE ===
            "function"

        ) {

            window.MesaRPG.iniciarCTE(
                opcoes
            );

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       CTE — LIMPAR
    ======================================================== */

    function limparCTE() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.limparCTE ===
            "function"

        ) {

            window.MesaRPG.limparCTE();

            return;

        }


        console.warn(
            "[Button Mesa] MesaRPG ainda não está disponível."
        );

    }



    /* ========================================================
       API PÚBLICA
    ======================================================== */

    window.ButtonMesa = {

        executarAcao,

        tratarCliqueCardJogador,

        voltarParaMesa,

        mostrarMesaPrincipal,

        fecharPainel,

        atualizarMesa,

        iniciarCTE,

        limparCTE,

        interagirCTE

    };



    /* ========================================================
       DOM READY
    ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(

            "DOMContentLoaded",

            inicializarBotoesMesa

        );

    } else {

        inicializarBotoesMesa();

    }


})();
