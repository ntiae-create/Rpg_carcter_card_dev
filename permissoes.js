// ==========================================
// PERMISSÕES — RPG CHARACTER CARD
// ==========================================
//
// Responsável por separar a interface do
// MESTRE e dos JOGADORES.
//
// Este módulo NÃO altera dados do personagem.
// Ele apenas controla o que cada tipo de
// usuário pode visualizar na interface.
// ==========================================

(function () {

    "use strict";


    // ==========================================
    // ESTADO
    // ==========================================

    window.rpgPermissoes = {

        initialized: false,

        isMaster: false,

        isPlayer: false

    };


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
    // IDENTIFICAR USUÁRIO
    // ==========================================

    function identificarUsuario() {

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            return false;

        }


        const ehMestre =
            window.rpgAuth.isMaster === true;


        window.rpgPermissoes.isMaster =
            ehMestre;


        window.rpgPermissoes.isPlayer =
            !ehMestre;


        return true;

    }


    // ==========================================
    // ESCONDER ELEMENTOS DO MODO MESTRE
    // ==========================================

    function ocultarModoMestre() {

        /*
            Procuramos elementos relacionados
            ao painel/controles do mestre.

            Usamos vários seletores para que
            o sistema continue funcionando
            mesmo que a interface seja alterada.
        */

        const seletores = [

            "#master-toggle",

            "#master-controls",

            ".master-toggle",

            ".master-controls",

            "[data-master-only]",

            "[data-role='master']",

            ".master-panel",

            ".master-section"

        ];


        const elementos = new Set();


        seletores.forEach(

            function (seletor) {

                document
                    .querySelectorAll(seletor)
                    .forEach(

                        function (elemento) {

                            elementos.add(
                                elemento
                            );

                        }

                    );

            }

        );


        elementos.forEach(

            function (elemento) {

                elemento.style.display =
                    "none";

                elemento.setAttribute(
                    "data-master-hidden",
                    "true"
                );

            }

        );

    }


    // ==========================================
    // MOSTRAR ELEMENTOS DO MODO MESTRE
    // ==========================================

    function mostrarModoMestre() {

        const seletores = [

            "#master-toggle",

            "#master-controls",

            ".master-toggle",

            ".master-controls",

            "[data-master-only]",

            "[data-role='master']",

            ".master-panel",

            ".master-section"

        ];


        const elementos = new Set();


        seletores.forEach(

            function (seletor) {

                document
                    .querySelectorAll(seletor)
                    .forEach(

                        function (elemento) {

                            elementos.add(
                                elemento
                            );

                        }

                    );

            }

        );


        elementos.forEach(

            function (elemento) {

                /*
                    O painel de controles utiliza
                    "display: none" normalmente,
                    portanto não vamos forçar
                    display:block aqui.

                    Apenas removemos a marcação
                    de ocultação feita por este módulo.
                */

                elemento.removeAttribute(
                    "data-master-hidden"
                );


                /*
                    O master-controls possui sua
                    própria regra CSS:

                    .master-controls.active

                    Portanto ele deve continuar
                    sendo controlado pelo código
                    original.
                */

                if (
                    elemento.classList.contains(
                        "master-controls"
                    )
                ) {

                    /*
                        Não fazemos nada.
                    */

                    return;

                }


                /*
                    Para o botão do mestre,
                    restauramos o display normal.
                */

                if (
                    elemento.classList.contains(
                        "master-toggle"
                    ) ||
                    elemento.id ===
                        "master-toggle"
                ) {

                    elemento.style.display =
                        "";

                }

            }

        );

    }


    // ==========================================
    // APLICAR PERMISSÕES
    // ==========================================

    function aplicarPermissoes() {

        if (
            !identificarUsuario()
        ) {

            return false;

        }


        if (
            window.rpgPermissoes.isMaster
        ) {

            /*
                MESTRE

                Pode utilizar o modo mestre.
            */

            mostrarModoMestre();

        }

        else {

            /*
                JOGADOR

                Não pode utilizar o modo mestre.
            */

            ocultarModoMestre();

        }


        /*
            A MESA ONLINE NÃO É OCULTADA.

            Tanto Mestre quanto Jogador
            devem poder enxergá-la.
        */


        window.rpgPermissoes.initialized =
            true;


        return true;

    }


    // ==========================================
    // INICIALIZAR
    // ==========================================

    async function iniciarPermissoes() {

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

            return;

        }


        /*
            A autenticação pode ainda estar
            terminando de carregar a campanha.

            Por isso fazemos algumas tentativas.
        */

        for (
            let i = 0;
            i < 12;
            i++
        ) {

            if (
                window.rpgAuth.campaign
            ) {

                break;

            }


            await esperar(250);

        }


        aplicarPermissoes();


        /*
            Faz uma segunda aplicação depois de
            um pequeno intervalo.

            Isso evita que o painel seja criado
            depois da primeira verificação.
        */

        await esperar(500);

        aplicarPermissoes();


        console.log(
            "🔐 Permissões:",
            window.rpgPermissoes
        );

    }


    // ==========================================
    // OBSERVAR MUDANÇAS NA AUTENTICAÇÃO
    // ==========================================

    function observarAutenticacao() {

        let ultimoUsuario =
            null;

        let ultimoModoMestre =
            null;


        setInterval(

            function () {

                if (
                    !window.rpgAuth
                ) {

                    return;

                }


                const usuarioAtual =
                    window.rpgAuth.user?.id ||
                    null;


                const modoMestreAtual =
                    window.rpgAuth.isMaster === true;


                if (
                    usuarioAtual !==
                        ultimoUsuario ||
                    modoMestreAtual !==
                        ultimoModoMestre
                ) {

                    ultimoUsuario =
                        usuarioAtual;

                    ultimoModoMestre =
                        modoMestreAtual;


                    aplicarPermissoes();

                }

            },

            1000

        );

    }


    // ==========================================
    // OBSERVAR ELEMENTOS CRIADOS DEPOIS
    // ==========================================

    function observarInterface() {

        const observador =
            new MutationObserver(

                function () {

                    if (
                        !window.rpgPermissoes.initialized
                    ) {

                        return;

                    }


                    if (
                        window.rpgPermissoes.isPlayer
                    ) {

                        ocultarModoMestre();

                    }

                }

            );


        observador.observe(

            document.body,

            {

                childList: true,

                subtree: true

            }

        );

    }


    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================

    window.aplicarPermissoesRPG =
        aplicarPermissoes;


    window.usuarioEhMestreInterface =
        function () {

            return (
                window.rpgPermissoes &&
                window.rpgPermissoes.isMaster === true
            );

        };


    window.usuarioEhJogadorInterface =
        function () {

            return (
                window.rpgPermissoes &&
                window.rpgPermissoes.isPlayer === true
            );

        };


    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    document.addEventListener(

        "DOMContentLoaded",

        function () {

            iniciarPermissoes();

            observarAutenticacao();

            observarInterface();

        }

    );


})();
