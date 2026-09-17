/* ==========================================
   RPG — EFEITOS VISUAIS DAS PASSIVAS
========================================== */

"use strict";

(function () {

    /*
     * Este módulo controla SOMENTE a representação
     * visual das passivas.
     *
     * NÃO altera o valor das Stacks.
     * NÃO executa regras de combate.
     * NÃO calcula dano.
     *
     * Ele recebe o estado da passiva e transforma
     * esse estado em elementos visuais.
     *
     * Exemplo:
     *
     * 0 stacks → nenhum efeito
     * 1 stack  → 1 núcleo
     * 2 stacks → 2 núcleos
     * 3 stacks → aura
     * 4 stacks → partículas
     * 5 stacks → efeito máximo
     *
     * O sistema também funciona para passivas
     * que possuam comportamentos visuais próprios.
     */


    const efeitosAtivos = {};



    /* ======================================================
       CONFIGURAÇÃO VISUAL PADRÃO
       ====================================================== */

    const EFEITO_PADRAO = {

        classeBase:
            "passiva-visual",

        classeStack:
            "passiva-stack",

        classeAtiva:
            "passiva-ativa",

        classeInativa:
            "passiva-inativa",

        seletorAssento:
            "[data-player]"

    };



    /* ======================================================
       LOCALIZAR ASSENTO
       ====================================================== */

    function obterAssento(
        jogadorId
    ) {

        if (
            jogadorId === null ||
            jogadorId === undefined
        ) {

            return null;

        }


        const id =
            String(jogadorId);


        /*
         * Primeiro tentamos encontrar um assento
         * cujo data-user-id corresponda ao jogador.
         */

        const porUsuario =
            document.querySelector(
                `[data-user-id="${CSS.escape(id)}"]`
            );


        if (porUsuario) {

            return porUsuario;

        }



        /*
         * Depois tentamos data-character-id.
         */

        const porPersonagem =
            document.querySelector(
                `[data-character-id="${CSS.escape(id)}"]`
            );


        if (porPersonagem) {

            return porPersonagem;

        }



        /*
         * Por último, se o ID for numérico,
         * tratamos como slot.
         */

        const numero =
            Number(jogadorId);


        if (
            Number.isInteger(numero) &&
            numero >= 1 &&
            numero <= 8
        ) {

            return document.querySelector(
                `[data-player="${numero}"]`
            );

        }


        return null;

    }



    /* ======================================================
       OBTER/CRIAR CONTAINER VISUAL
       ====================================================== */

    function obterContainer(
        assento,
        passivaId
    ) {

        if (!assento) {

            return null;

        }


        let container =
            assento.querySelector(
                `[data-passiva-visual="${CSS.escape(passivaId)}"]`
            );


        if (container) {

            return container;

        }


        container =
            document.createElement(
                "div"
            );


        container.className =
            EFEITO_PADRAO.classeBase;


        container.dataset.passivaVisual =
            passivaId;


        container.innerHTML = `

            <div class="passiva-visual-header">

                <span
                    class="passiva-visual-icon"
                    aria-hidden="true"
                >
                    ✦
                </span>

                <span class="passiva-visual-name"></span>

            </div>


            <div
                class="passiva-visual-stacks"
                aria-label="Stacks da passiva"
            ></div>


            <div
                class="passiva-visual-aura"
                aria-hidden="true"
            ></div>


            <div
                class="passiva-visual-particles"
                aria-hidden="true"
            ></div>

        `;


        /*
         * Tentamos colocar o efeito em uma área própria
         * do card, caso ela exista.
         */

        const area =
            assento.querySelector(
                ".player-card-content"
            );


        if (area) {

            area.appendChild(
                container
            );

        } else {

            assento.appendChild(
                container
            );

        }


        return container;

    }



    /* ======================================================
       OBTER DADOS DA PASSIVA
       ====================================================== */

    function obterPassiva(
        passivaId
    ) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.obter !==
            "function"
        ) {

            console.warn(
                "[Passivas Efeitos] PassivasDados não disponível."
            );

            return null;

        }


        return window.PassivasDados.obter(
            passivaId
        );

    }



    /* ======================================================
       LIMPAR EFEITO
       ====================================================== */

    function limpar(
        jogadorId,
        passivaId
    ) {

        const assento =
            obterAssento(
                jogadorId
            );


        if (!assento) {

            return;

        }


        const container =
            assento.querySelector(
                `[data-passiva-visual="${CSS.escape(passivaId)}"]`
            );


        if (!container) {

            return;

        }


        container.remove();


        const chave =
            criarChave(
                jogadorId,
                passivaId
            );


        delete efeitosAtivos[chave];

    }



    /* ======================================================
       CRIAR CHAVE
       ====================================================== */

    function criarChave(
        jogadorId,
        passivaId
    ) {

        return (
            String(jogadorId) +
            "::" +
            String(passivaId)
        );

    }



    /* ======================================================
       DESENHAR STACKS
       ====================================================== */

    function desenharStacks(
        container,
        valor,
        maximo
    ) {

        const area =
            container.querySelector(
                ".passiva-visual-stacks"
            );


        if (!area) {

            return;

        }


        area.innerHTML = "";


        const quantidadeMaxima =
            Math.max(
                0,
                Number(maximo) || 0
            );


        const quantidadeAtual =
            Math.max(
                0,
                Math.min(
                    Number(valor) || 0,
                    quantidadeMaxima
                )
            );


        /*
         * Se a passiva não possuir limite,
         * usamos apenas a quantidade atual.
         */

        const quantidadeRenderizada =
            quantidadeMaxima > 0
                ? quantidadeMaxima
                : quantidadeAtual;


        for (
            let i = 1;
            i <= quantidadeRenderizada;
            i++
        ) {

            const stack =
                document.createElement(
                    "span"
                );


            stack.className =
                "passiva-stack";


            stack.dataset.stack =
                String(i);


            stack.classList.toggle(
                "ativo",
                i <= quantidadeAtual
            );


            stack.classList.toggle(
                "inativo",
                i > quantidadeAtual
            );


            stack.textContent =
                i <= quantidadeAtual
                    ? "◆"
                    : "◇";


            area.appendChild(
                stack
            );

        }


        area.dataset.stacks =
            String(quantidadeAtual);


        area.dataset.maxStacks =
            String(quantidadeMaxima);

    }



    /* ======================================================
       APLICAR NÍVEL VISUAL
       ====================================================== */

    function aplicarNivelVisual(
        container,
        valor,
        maximo
    ) {

        /*
         * Remove níveis anteriores.
         */

        for (
            let i = 0;
            i <= 20;
            i++
        ) {

            container.classList.remove(
                `stack-${i}`
            );

        }


        const atual =
            Math.max(
                0,
                Number(valor) || 0
            );


        /*
         * A classe permite ao CSS decidir
         * qual efeito deve aparecer.
         */

        container.classList.add(
            `stack-${atual}`
        );


        container.dataset.stacks =
            String(atual);


        container.dataset.maxStacks =
            String(
                Number(maximo) || 0
            );


        /*
         * Estado geral.
         */

        container.classList.toggle(
            "passiva-ativa",
            atual > 0
        );


        container.classList.toggle(
            "passiva-inativa",
            atual <= 0
        );


        /*
         * Intensidade em percentual.
         */

        const percentual =
            maximo > 0

                ?

            Math.max(
                0,
                Math.min(
                    100,
                    (atual / maximo) * 100
                )
            )

                :

            0;


        container.style.setProperty(
            "--passiva-progresso",
            `${percentual}%`
        );


        container.style.setProperty(
            "--passiva-stacks",
            atual
        );


        /*
         * Classes especiais por intensidade.
         */

        container.classList.toggle(
            "passiva-nivel-baixo",
            atual >= 1 &&
            atual < maximo * 0.4
        );


        container.classList.toggle(
            "passiva-nivel-medio",
            atual >= maximo * 0.4 &&
            atual < maximo * 0.8
        );


        container.classList.toggle(
            "passiva-nivel-alto",
            atual >= maximo * 0.8
        );


        container.classList.toggle(
            "passiva-maxima",
            maximo > 0 &&
            atual >= maximo
        );

    }



    /* ======================================================
       NOME DA PASSIVA
       ====================================================== */

    function atualizarNome(
        container,
        passiva
    ) {

        const nome =
            container.querySelector(
                ".passiva-visual-name"
            );


        if (!nome) {

            return;

        }


        nome.textContent =
            passiva?.nome ||
            passiva?.id ||
            "Passiva";

    }



    /* ======================================================
       ATUALIZAR EFEITO
       ====================================================== */

    function atualizar(
        jogadorId,
        passivaId,
        estado = null
    ) {

        const passiva =
            obterPassiva(
                passivaId
            );


        if (!passiva) {

            return null;

        }


        /*
         * Se o estado não foi fornecido,
         * tentamos buscar no sistema de Stacks.
         */

        if (
            !estado &&
            window.PassivasStacks &&
            typeof window.PassivasStacks.obter ===
            "function"
        ) {

            estado =
                window.PassivasStacks.obter(
                    jogadorId,
                    passivaId
                );

        }


        if (!estado) {

            return null;

        }


        const assento =
            obterAssento(
                jogadorId
            );


        if (!assento) {

            /*
             * O jogador pode ainda não ter
             * seu card renderizado.
             *
             * Guardamos o estado para aplicar
             * quando o assento aparecer.
             */

            efeitosAtivos[
                criarChave(
                    jogadorId,
                    passivaId
                )
            ] = {

                jogadorId,

                passivaId,

                estado

            };


            return estado;

        }


        const container =
            obterContainer(
                assento,
                passivaId
            );


        if (!container) {

            return null;

        }


        atualizarNome(
            container,
            passiva
        );


        const valor =
            Number(
                estado.valor
            ) || 0;


        const maximo =
            Number(
                estado.maximo ??
                passiva.stacks?.maximo ??
                0
            ) || 0;


        desenharStacks(
            container,
            valor,
            maximo
        );


        aplicarNivelVisual(
            container,
            valor,
            maximo
        );


        /*
         * Guarda o estado atual.
         */

        efeitosAtivos[
            criarChave(
                jogadorId,
                passivaId
            )
        ] = {

            jogadorId,

            passivaId,

            estado: {

                ...estado

            }

        };


        /*
         * Pequena animação de alteração.
         */

        container.classList.remove(
            "passiva-stack-alterada"
        );


        /*
         * Força a animação a reiniciar.
         */

        void container.offsetWidth;


        container.classList.add(
            "passiva-stack-alterada"
        );


        /*
         * Evento para outros sistemas.
         */

        document.dispatchEvent(

            new CustomEvent(
                "passiva:efeitoVisualAtualizado",
                {

                    detail: {

                        jogadorId,

                        passivaId,

                        valor,

                        maximo,

                        container

                    }

                }

            )

        );


        return estado;

    }



    /* ======================================================
       EVENTO DE STACK ALTERADA
       ====================================================== */

    function tratarAlteracaoStacks(
        event
    ) {

        const detalhe =
            event.detail;


        if (!detalhe) {

            return;

        }


        atualizar(

            detalhe.jogadorId,

            detalhe.passivaId,

            {

                jogadorId:
                    detalhe.jogadorId,

                passivaId:
                    detalhe.passivaId,

                valor:
                    detalhe.atual,

                minimo:
                    detalhe.minimo,

                maximo:
                    detalhe.maximo,

                percentual:
                    detalhe.percentual

            }

        );

    }



    /* ======================================================
       REAPLICAR EFEITOS
       ====================================================== */

    function reaplicarTodos() {

        Object.keys(
            efeitosAtivos
        ).forEach(

            function (chave) {

                const efeito =
                    efeitosAtivos[chave];


                if (!efeito) {

                    return;

                }


                atualizar(

                    efeito.jogadorId,

                    efeito.passivaId,

                    efeito.estado

                );

            }

        );

    }



    /* ======================================================
       LIMPAR TODAS AS PASSIVAS DE UM JOGADOR
       ====================================================== */

    function limparJogador(
        jogadorId
    ) {

        const prefixo =
            String(jogadorId) +
            "::";


        Object.keys(
            efeitosAtivos
        ).forEach(

            function (chave) {

                if (
                    !chave.startsWith(
                        prefixo
                    )
                ) {

                    return;

                }


                const efeito =
                    efeitosAtivos[chave];


                limpar(

                    efeito.jogadorId,

                    efeito.passivaId

                );

            }

        );

    }



    /* ======================================================
       INICIALIZAÇÃO
       ====================================================== */

    function inicializar() {

        /*
         * Escuta alterações produzidas pelo
         * passivas-stacks.js.
         */

        document.addEventListener(

            "passiva:stacksAlterada",

            tratarAlteracaoStacks

        );


        /*
         * Quando os jogadores/cards forem
         * atualizados, tentamos reaplicar
         * os efeitos existentes.
         */

        document.addEventListener(

            "mesa:jogadoresAtualizados",

            function () {

                reaplicarTodos();

            }

        );


        document.addEventListener(

            "mesa:jogadorAtualizado",

            function () {

                reaplicarTodos();

            }

        );


        console.log(
            "[Passivas] Sistema de efeitos visuais carregado."
        );

    }



    /* ======================================================
       API PÚBLICA
       ====================================================== */

    window.PassivasEfeitos = {

        atualizar,

        limpar,

        limparJogador,

        reaplicarTodos,

        obterAssento

    };



    /* ======================================================
       DOM READY
       ====================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }

})();
