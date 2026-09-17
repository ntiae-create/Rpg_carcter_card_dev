/* ==========================================
   MESA ONLINE — RPG
   CONFIGURAÇÕES DA MESA
========================================== */

"use strict";

(function () {

    let settingsButton = null;
    let masterMenu = null;
    let masterButtons = [];


    /* ========================================================
       INICIALIZAÇÃO
    ======================================================== */

    function inicializarConfigMesa() {

        settingsButton =
            document.getElementById(
                "btn-configuracoes"
            );

        masterMenu =
            document.getElementById(
                "master-menu"
            );

        masterButtons =
            Array.from(
                document.querySelectorAll(
                    "[data-master-action]"
                )
            );


        if (!settingsButton) {

            console.warn(
                "[Config Mesa] Botão #btn-configuracoes não encontrado."
            );

            return;

        }


        if (!masterMenu) {

            console.warn(
                "[Config Mesa] Menu #master-menu não encontrado."
            );

            return;

        }


        registrarEventos();


        /*
         O botão de configurações aparece
         para QUALQUER usuário.

         A diferença acontece no conteúdo
         do menu.
        */

        settingsButton.hidden = false;


        atualizarMenuPorUsuario();


        console.log(
            "[Config Mesa] Sistema de configurações inicializado."
        );

    }



    /* ========================================================
       IDENTIFICAÇÃO DO USUÁRIO
    ======================================================== */

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


    function usuarioEhJogador() {

        if (

            window.MesaRPG &&

            typeof window.MesaRPG.usuarioEhJogador ===
            "function"

        ) {

            return window.MesaRPG.usuarioEhJogador();

        }


        return false;

    }



    /* ========================================================
       EVENTOS
    ======================================================== */

    function registrarEventos() {


        /* ----------------------------------------------
           BOTÃO DE CONFIGURAÇÕES
        ---------------------------------------------- */

        settingsButton.addEventListener(

            "click",

            function (event) {

                event.preventDefault();

                event.stopPropagation();


                alternarMenuConfiguracoes();

            }

        );



        /* ----------------------------------------------
           AÇÕES DO MESTRE
        ---------------------------------------------- */

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



        /* ----------------------------------------------
           CLIQUE FORA DO MENU
        ---------------------------------------------- */

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

                    fecharMenuConfiguracoes();

                }

            }

        );



        /* ----------------------------------------------
           ESC
        ---------------------------------------------- */

        document.addEventListener(

            "keydown",

            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    fecharMenuConfiguracoes();

                }

            }

        );



        /* ----------------------------------------------
           MESA INICIALIZADA
        ---------------------------------------------- */

        document.addEventListener(

            "mesa:inicializada",

            function () {

                /*
                 Agora que o mesa.js já carregou
                 o usuário, atualizamos o menu.
                */

                settingsButton.hidden = false;

                atualizarMenuPorUsuario();

            }

        );



        /* ----------------------------------------------
           CAMPANHA ALTERADA
        ---------------------------------------------- */

        document.addEventListener(

            "mesa:campanhaAlterada",

            function () {

                settingsButton.hidden = false;

                atualizarMenuPorUsuario();

            }

        );

    }



    /* ========================================================
       MENU DE CONFIGURAÇÕES
    ======================================================== */

    function abrirMenuConfiguracoes() {

        if (!masterMenu) {

            return;

        }


        atualizarMenuPorUsuario();


        masterMenu.hidden = false;

    }


    function fecharMenuConfiguracoes() {

        if (!masterMenu) {

            return;

        }


        masterMenu.hidden = true;

    }


    function alternarMenuConfiguracoes() {

        if (!masterMenu) {

            return;

        }


        if (masterMenu.hidden) {

            abrirMenuConfiguracoes();

        } else {

            fecharMenuConfiguracoes();

        }

    }



    /* ========================================================
       COMPATIBILIDADE — MENU DO MESTRE
    ======================================================== */

    function abrirMenuMestre() {

        if (!usuarioEhMestre()) {

            return;

        }


        abrirMenuConfiguracoes();

    }


    function fecharMenuMestre() {

        fecharMenuConfiguracoes();

    }


    function alternarMenuMestre() {

        if (!usuarioEhMestre()) {

            return;

        }


        alternarMenuConfiguracoes();

    }



    /* ========================================================
       ATUALIZAR CONTEÚDO DO MENU
    ======================================================== */

    function atualizarMenuPorUsuario() {

        if (!masterMenu) {

            return;

        }


        const ehMestre =
            usuarioEhMestre();


        const ehJogador =
            usuarioEhJogador();


        /*
         ------------------------------------------------------
         MESTRE
         ------------------------------------------------------

         Mantemos os botões que já existem no HTML.

         Não precisamos recriá-los.
        */

        masterButtons.forEach(

            function (button) {

                button.hidden =
                    !ehMestre;

            }

        );


        /*
         ------------------------------------------------------
         JOGADOR
         ------------------------------------------------------

         Criamos uma área própria para as opções
         do jogador caso ela ainda não exista.
        */

        let jogadorMenu =
            document.getElementById(
                "config-jogador"
            );


        if (!jogadorMenu) {

            jogadorMenu =
                criarMenuJogador();

        }


        jogadorMenu.hidden =
            ehMestre || !ehJogador;


        /*
         ------------------------------------------------------
         TÍTULO
         ------------------------------------------------------
        */

        const titulo =
            masterMenu.querySelector(
                "h2"
            );


        if (titulo) {

            if (ehMestre) {

                titulo.textContent =
                    "⚙️ Mestre";

            } else {

                titulo.textContent =
                    "⚙️ Configurações";

            }

        }

    }



    /* ========================================================
       CRIAR MENU DO JOGADOR
    ======================================================== */

    function criarMenuJogador() {

        const menuContent =
            masterMenu.querySelector(
                ".master-menu-content"
            );


        const jogadorMenu =
            document.createElement(
                "div"
            );


        jogadorMenu.id =
            "config-jogador";


        jogadorMenu.className =
            "config-jogador";


        jogadorMenu.innerHTML = `

            <div class="config-jogador-title">
                👤 Jogador
            </div>

            <div class="config-jogador-actions">

                <button
                    type="button"
                    data-player-config-action="ficha"
                >
                    📜 Meu personagem
                </button>

                <button
                    type="button"
                    data-player-config-action="atualizar"
                >
                    🔄 Atualizar mesa
                </button>

                <button
                    type="button"
                    data-player-config-action="fechar"
                >
                    ✕ Fechar
                </button>

            </div>

        `;


        if (menuContent) {

            menuContent.appendChild(
                jogadorMenu
            );

        } else {

            masterMenu.appendChild(
                jogadorMenu
            );

        }


        const buttons =
            jogadorMenu.querySelectorAll(
                "[data-player-config-action]"
            );


        buttons.forEach(

            function (button) {

                button.addEventListener(

                    "click",

                    function (event) {

                        event.preventDefault();

                        event.stopPropagation();


                        const acao =
                            button.dataset.playerConfigAction;


                        executarAcaoJogador(
                            acao
                        );

                    }

                );

            }

        );


        return jogadorMenu;

    }



    /* ========================================================
       AÇÕES DO JOGADOR
    ======================================================== */

    function executarAcaoJogador(
        acao
    ) {

        switch (acao) {


            /* ----------------------------------------------
               FICHA
            ---------------------------------------------- */

            case "ficha":

                abrirFichaJogador();

                break;



            /* ----------------------------------------------
               ATUALIZAR
            ---------------------------------------------- */

            case "atualizar":

                atualizarMesa();

                break;



            /* ----------------------------------------------
               FECHAR
            ---------------------------------------------- */

            case "fechar":

                fecharMenuConfiguracoes();

                break;



            default:

                console.warn(
                    "[Config Mesa] Ação de jogador desconhecida:",
                    acao
                );

        }

    }



    /* ========================================================
       ABRIR FICHA DO JOGADOR
    ======================================================== */

    function abrirFichaJogador() {

        fecharMenuConfiguracoes();


        /*
         O sistema de personagem já existente
         pode fornecer esta função.
        */

        if (

            typeof window.abrirFichaJogador ===
            "function"

        ) {

            const slot =

                window.MesaRPG &&

                typeof window.MesaRPG.obterSlotAtual ===
                "function"

                    ?

                window.MesaRPG.obterSlotAtual()

                    :

                null;


            window.abrirFichaJogador(
                slot
            );

            return;

        }


        /*
         Caso a ficha ainda não esteja
         disponível, apenas avisamos.
        */

        console.warn(
            "[Config Mesa] Função abrirFichaJogador() não está disponível."
        );

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

        }


        document.dispatchEvent(

            new CustomEvent(
                "mesa:atualizarSolicitado"
            )

        );


        fecharMenuConfiguracoes();

    }



    /* ========================================================
       AÇÕES DO MESTRE
    ======================================================== */

    function executarAcaoMestre(
        acao
    ) {

        /*
         Proteção real.

         Mesmo que alguém tente executar
         manualmente a função, as ações
         do Mestre continuam protegidas.
        */

        if (!usuarioEhMestre()) {

            return;

        }


        fecharMenuConfiguracoes();


        switch (acao) {


            /* ----------------------------------------------
               MAPA
            ---------------------------------------------- */

            case "mapa":

                abrirMapa();

                break;



            /* ----------------------------------------------
               DUNGEON
            ---------------------------------------------- */

            case "dungeon":

                abrirDungeon();

                break;



            /* ----------------------------------------------
               COMBATE
            ---------------------------------------------- */

            case "combate":

                iniciarCombate();

                break;



            /* ----------------------------------------------
               BOSS
            ---------------------------------------------- */

            case "boss":

                iniciarBoss();

                break;



            /* ----------------------------------------------
               CTE
            ---------------------------------------------- */

            case "cte":

                iniciarCTE();

                break;



            default:

                console.warn(
                    "[Config Mesa] Ação do Mestre desconhecida:",
                    acao
                );

                break;

        }

    }



    /* ========================================================
       MAPA
    ======================================================== */

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



    /* ========================================================
       DUNGEON
    ======================================================== */

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



    /* ========================================================
       COMBATE
    ======================================================== */

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



    /* ========================================================
       BOSS
    ======================================================== */

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



    /* ========================================================
       CTE
    ======================================================== */

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



    /* ========================================================
       ATUALIZAÇÃO DA PERMISSÃO
    ======================================================== */

    function atualizarPermissaoMestre() {

        /*
         Mantemos esta função por compatibilidade
         com qualquer outro código que já a utilize.

         IMPORTANTE:

         Ela NÃO esconde mais o botão.

         O botão pertence a todos.
        */

        if (!settingsButton) {

            return;

        }


        settingsButton.hidden = false;


        atualizarMenuPorUsuario();

    }



    /* ========================================================
       API PÚBLICA
    ======================================================== */

    window.ConfigMesa = {

        /*
         Menu geral
        */

        abrirMenuConfiguracoes,

        fecharMenuConfiguracoes,

        alternarMenuConfiguracoes,


        /*
         Compatibilidade antiga
        */

        abrirMenuMestre,

        fecharMenuMestre,

        alternarMenuMestre,


        /*
         Permissões
        */

        atualizarPermissaoMestre,


        /*
         Ações
        */

        executarAcaoMestre,

        executarAcaoJogador

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

            inicializarConfigMesa

        );

    } else {

        inicializarConfigMesa();

    }

})();
