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


        /*
         ======================================================
         CLIQUES GERAIS
         ======================================================

         Qualquer elemento que possuir:

             data-mesa-action="..."

         será processado aqui.
        */

        document.addEventListener(
            "click",
            tratarCliqueGeral
        );



        /*
         ======================================================
         CLIQUE NOS CARDS DOS JOGADORES
         ======================================================

         O button-mesa.js detecta o clique.

         O mesa.js processa a lógica.
        */

        document.addEventListener(
            "click",
            tratarCliqueCardJogador
        );



        /*
         ======================================================
         CTE
         ======================================================

         Interações visuais do CTE podem ser capturadas
         aqui futuramente sem mover a lógica do CTE
         para este arquivo.
        */

        document.addEventListener(
            "click",
            tratarCliqueCTE
        );

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


        /*
         Impede que um clique em um elemento
         interno seja processado duas vezes.
        */

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


        /*
         Se o card estiver dentro de outro
         sistema que explicitamente bloqueie
         a interação, respeitamos isso.
        */

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


        /*
         O button-mesa.js NÃO decide:

         - se é o próprio jogador
         - se está ocupado
         - se pode abrir a ficha
         - o que acontece com o alvo

         Tudo isso pertence ao Core.
        */

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

    function tratarCliqueCTE(event) {

        const elemento =
            event.target.closest(
                "[data-cte-action]"
            );


        if (!elemento) {

            return;

        }


        event.preventDefault();


        const acao =
            elemento.dataset.cteAction;


        interagirCTE(
            elemento,
            event,
            acao
        );

    }



    /* ========================================================
       INTERAÇÃO CTE
    ======================================================== */

    function interagirCTE(
        elemento,
        event,
        acao = null
    ) {

        const acaoCTE =
            acao ||
            elemento?.dataset?.cteAction ||
            null;


        /*
         A lógica principal do CTE continua
         no mesa.js.

         Aqui apenas encaminhamos a interação.
        */

        switch (acaoCTE) {


            case "iniciar":

                iniciarCTE();

                break;


            case "cancelar":

                limparCTE();

                break;


            default:

                /*
                 Se futuramente o CTE possuir
                 outras interações, elas entram aqui.

                 A mecânica continua no Core.
                */

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

        /*
         O button-mesa.js não manipula diretamente
         o DOM interno da Mesa.

         O Core decide como voltar à tela principal.
        */

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


        /*
         Permite que outros módulos reajam
         ao pedido de atualização.
        */

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

        /*
         Interação geral
        */

        executarAcao,


        /*
         Jogadores
        */

        tratarCliqueCardJogador,


        /*
         Mesa
        */

        voltarParaMesa,

        mostrarMesaPrincipal,

        fecharPainel,

        atualizarMesa,


        /*
         CTE
        */

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
