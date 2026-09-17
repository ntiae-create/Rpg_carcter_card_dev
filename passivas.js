/* ==========================================
   RPG — SISTEMA DE PASSIVAS
   CONTROLADOR PRINCIPAL
========================================== */

"use strict";

(function () {

    /* ------------------------------------------
       VERIFICAÇÕES
    ------------------------------------------ */

    function sistemaDisponivel() {
        return (
            window.PassivasDados &&
            window.PassivasStacks &&
            window.PassivasEfeitos
        );
    }


    /* ------------------------------------------
       DADOS DA PASSIVA
    ------------------------------------------ */

    function obterPassiva(passivaId) {

        if (!window.PassivasDados) {
            console.warn("[Passivas] PassivasDados não disponível.");
            return null;
        }

        return window.PassivasDados.obter(passivaId);
    }


    function listarPassivas() {

        if (!window.PassivasDados) {
            return [];
        }

        return window.PassivasDados.listar();
    }


    function existePassiva(passivaId) {

        if (!window.PassivasDados) {
            return false;
        }

        return window.PassivasDados.existe(passivaId);
    }


    /* ------------------------------------------
       STACKS
    ------------------------------------------ */

    function obterStacks(jogadorId, passivaId) {

        if (!window.PassivasStacks) {
            return null;
        }

        return window.PassivasStacks.obter(
            jogadorId,
            passivaId
        );
    }


    function adicionarStack(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        if (!window.PassivasStacks) {
            console.warn("[Passivas] PassivasStacks não disponível.");
            return null;
        }

        return window.PassivasStacks.adicionar(
            jogadorId,
            passivaId,
            quantidade
        );
    }


    function removerStack(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        if (!window.PassivasStacks) {
            console.warn("[Passivas] PassivasStacks não disponível.");
            return null;
        }

        return window.PassivasStacks.remover(
            jogadorId,
            passivaId,
            quantidade
        );
    }


    function definirStacks(
        jogadorId,
        passivaId,
        quantidade
    ) {

        if (!window.PassivasStacks) {
            console.warn("[Passivas] PassivasStacks não disponível.");
            return null;
        }

        return window.PassivasStacks.definir(
            jogadorId,
            passivaId,
            quantidade
        );
    }


    function resetarPassiva(
        jogadorId,
        passivaId
    ) {

        if (!window.PassivasStacks) {
            return null;
        }

        return window.PassivasStacks.resetar(
            jogadorId,
            passivaId
        );
    }


    function resetarJogador(jogadorId) {

        if (!window.PassivasStacks) {
            return null;
        }

        return window.PassivasStacks.resetarJogador(
            jogadorId
        );
    }


    function obterTodas(jogadorId) {

        if (!window.PassivasStacks) {
            return {};
        }

        return window.PassivasStacks.obterTodas(
            jogadorId
        );
    }


    /* ------------------------------------------
       VISUAL
    ------------------------------------------ */

    function atualizarVisual(
        jogadorId,
        passivaId
    ) {

        if (!window.PassivasEfeitos) {
            return null;
        }

        return window.PassivasEfeitos.atualizar(
            jogadorId,
            passivaId
        );
    }


    function limparVisual(
        jogadorId,
        passivaId
    ) {

        if (!window.PassivasEfeitos) {
            return;
        }

        window.PassivasEfeitos.limpar(
            jogadorId,
            passivaId
        );
    }


    function limparVisuaisJogador(jogadorId) {

        if (!window.PassivasEfeitos) {
            return;
        }

        window.PassivasEfeitos.limparJogador(
            jogadorId
        );
    }


    function reaplicarVisuais() {

        if (!window.PassivasEfeitos) {
            return;
        }

        window.PassivasEfeitos.reaplicarTodos();
    }


    /* ------------------------------------------
       ATALHOS DE GAMEPLAY
    ------------------------------------------ */

    function ganharStack(
        jogadorId,
        passivaId
    ) {

        return adicionarStack(
            jogadorId,
            passivaId,
            1
        );
    }


    function perderStack(
        jogadorId,
        passivaId
    ) {

        return removerStack(
            jogadorId,
            passivaId,
            1
        );
    }


    function stackMaximo(
        jogadorId,
        passivaId
    ) {

        const estado = obterStacks(
            jogadorId,
            passivaId
        );

        if (!estado) {
            return false;
        }

        return estado.valor >= estado.maximo;
    }


    function possuiStack(
        jogadorId,
        passivaId
    ) {

        const estado = obterStacks(
            jogadorId,
            passivaId
        );

        if (!estado) {
            return false;
        }

        return estado.valor > estado.minimo;
    }


    /* ------------------------------------------
       EVENTOS
    ------------------------------------------ */

    function registrarEventos() {

        document.addEventListener(
            "passiva:stacksAlterada",
            function (event) {

                const detalhe = event.detail;

                if (!detalhe) {
                    return;
                }

                /*
                 * O PassivasStacks já dispara
                 * a alteração.
                 *
                 * Aqui podemos centralizar
                 * futuras reações do sistema.
                 */

                document.dispatchEvent(
                    new CustomEvent(
                        "passiva:atualizada",
                        {
                            detail: detalhe
                        }
                    )
                );

            }
        );


        document.addEventListener(
            "mesa:jogadoresAtualizados",
            function () {

                reaplicarVisuais();

            }
        );


        document.addEventListener(
            "mesa:jogadorAtualizado",
            function (event) {

                const jogadorId =
                    event.detail?.jogadorId ??
                    event.detail?.slot ??
                    event.detail?.playerId;

                if (jogadorId == null) {
                    return;
                }

                reaplicarJogador(
                    jogadorId
                );

            }
        );

    }


    /* ------------------------------------------
       REAPLICAR UM JOGADOR
    ------------------------------------------ */

    function reaplicarJogador(jogadorId) {

        if (!window.PassivasStacks) {
            return;
        }

        const passivas =
            obterTodas(jogadorId);

        if (!passivas) {
            return;
        }

        Object.keys(passivas).forEach(
            function (passivaId) {

                atualizarVisual(
                    jogadorId,
                    passivaId
                );

            }
        );

    }


    /* ------------------------------------------
       INICIALIZAÇÃO
    ------------------------------------------ */

    function inicializar() {

        if (!sistemaDisponivel()) {

            console.warn(
                "[Passivas] Dependências ainda não disponíveis."
            );

            return;
        }

        registrarEventos();

        console.log(
            "[Passivas] Sistema de passivas inicializado."
        );

    }


    /* ------------------------------------------
       API PÚBLICA
    ------------------------------------------ */

    window.PassivasRPG = {

        // Dados
        obterPassiva,
        listarPassivas,
        existePassiva,

        // Stacks
        obterStacks,
        adicionarStack,
        removerStack,
        definirStacks,
        resetarPassiva,
        resetarJogador,
        obterTodas,

        // Visual
        atualizarVisual,
        limparVisual,
        limparVisuaisJogador,
        reaplicarVisuais,

        // Atalhos
        ganharStack,
        perderStack,
        stackMaximo,
        possuiStack,

        // Atualização
        reaplicarJogador
    };


    /* ------------------------------------------
       START
    ------------------------------------------ */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }

})();
