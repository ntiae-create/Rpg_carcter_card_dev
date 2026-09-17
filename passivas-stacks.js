/* ==========================================
   RPG — SISTEMA DE STACKS DAS PASSIVAS
========================================== */

"use strict";

(function () {

    /*
     * Este módulo controla APENAS o estado
     * das Stacks das passivas.
     *
     * Ele NÃO cria interface.
     * Ele NÃO aplica efeitos visuais.
     * Ele NÃO decide regras específicas
     * de cada classe.
     *
     * Sua função é controlar:
     *
     * • criação
     * • leitura
     * • adição
     * • remoção
     * • definição
     * • limite mínimo
     * • limite máximo
     * • reset
     */


    const estadoStacks = {};



    /* ======================================================
       UTILITÁRIOS
       ====================================================== */

    function obterDefinicao(passivaId) {

        if (
            !window.PassivasDados ||
            typeof window.PassivasDados.obter !== "function"
        ) {

            console.warn(
                "[Passivas Stacks] PassivasDados não está disponível."
            );

            return null;

        }


        return window.PassivasDados.obter(
            passivaId
        );

    }



    function normalizarIdJogador(jogadorId) {

        if (
            jogadorId === null ||
            jogadorId === undefined
        ) {

            return null;

        }


        return String(
            jogadorId
        );

    }



    function limitarValor(
        valor,
        minimo,
        maximo
    ) {

        let resultado =
            Number(valor);


        if (
            !Number.isFinite(resultado)
        ) {

            resultado = minimo;

        }


        resultado =
            Math.floor(resultado);


        if (
            resultado < minimo
        ) {

            resultado = minimo;

        }


        if (
            resultado > maximo
        ) {

            resultado = maximo;

        }


        return resultado;

    }



    /* ======================================================
       GARANTIR ESTADO
       ====================================================== */

    function garantirEstado(
        jogadorId,
        passivaId
    ) {

        const idJogador =
            normalizarIdJogador(
                jogadorId
            );


        if (!idJogador) {

            return null;

        }


        const passiva =
            obterDefinicao(
                passivaId
            );


        if (!passiva) {

            console.warn(
                "[Passivas Stacks] Passiva não encontrada:",
                passivaId
            );

            return null;

        }


        if (
            !estadoStacks[idJogador]
        ) {

            estadoStacks[idJogador] = {};

        }


        if (
            !estadoStacks[idJogador][passivaId]
        ) {

            const minimo =
                passiva.stacks?.minimo ?? 0;

            const maximo =
                passiva.stacks?.maximo ?? 0;

            const inicial =
                passiva.stacks?.inicial ?? minimo;


            estadoStacks[idJogador][passivaId] = {

                jogadorId:
                    idJogador,

                passivaId:
                    passivaId,

                valor:
                    limitarValor(
                        inicial,
                        minimo,
                        maximo
                    ),

                minimo:
                    minimo,

                maximo:
                    maximo

            };

        }


        return estadoStacks[idJogador][passivaId];

    }



    /* ======================================================
       OBTER STACKS
       ====================================================== */

    function obter(
        jogadorId,
        passivaId
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );


        if (!estado) {

            return null;

        }


        return {

            jogadorId:
                estado.jogadorId,

            passivaId:
                estado.passivaId,

            valor:
                estado.valor,

            minimo:
                estado.minimo,

            maximo:
                estado.maximo,

            percentual:
                calcularPercentual(
                    estado
                )

        };

    }



    /* ======================================================
       PERCENTUAL
       ====================================================== */

    function calcularPercentual(
        estado
    ) {

        if (!estado) {

            return 0;

        }


        const intervalo =
            estado.maximo -
            estado.minimo;


        if (
            intervalo <= 0
        ) {

            return 0;

        }


        return (
            (
                estado.valor -
                estado.minimo
            ) /
            intervalo
        ) * 100;

    }



    /* ======================================================
       DEFINIR STACKS
       ====================================================== */

    function definir(
        jogadorId,
        passivaId,
        quantidade
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );


        if (!estado) {

            return null;

        }


        const valorAnterior =
            estado.valor;


        estado.valor =
            limitarValor(
                quantidade,
                estado.minimo,
                estado.maximo
            );


        emitirAlteracao(
            estado,
            valorAnterior
        );


        return obter(
            jogadorId,
            passivaId
        );

    }



    /* ======================================================
       ADICIONAR STACKS
       ====================================================== */

    function adicionar(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );


        if (!estado) {

            return null;

        }


        const valorAnterior =
            estado.valor;


        const quantidadeNormalizada =
            Number.isFinite(
                Number(quantidade)
            )

                ?

                Math.floor(
                    Number(quantidade)
                )

                :

                1;


        estado.valor =
            limitarValor(
                estado.valor +
                quantidadeNormalizada,
                estado.minimo,
                estado.maximo
            );


        emitirAlteracao(
            estado,
            valorAnterior
        );


        return obter(
            jogadorId,
            passivaId
        );

    }



    /* ======================================================
       REMOVER STACKS
       ====================================================== */

    function remover(
        jogadorId,
        passivaId,
        quantidade = 1
    ) {

        const estado =
            garantirEstado(
                jogadorId,
                passivaId
            );


        if (!estado) {

            return null;

        }


        const valorAnterior =
            estado.valor;


        const quantidadeNormalizada =
            Number.isFinite(
                Number(quantidade)
            )

                ?

                Math.floor(
                    Number(quantidade)
                )

                :

                1;


        estado.valor =
            limitarValor(
                estado.valor -
                quantidadeNormalizada,
                estado.minimo,
                estado.maximo
            );


        emitirAlteracao(
            estado,
            valorAnterior
        );


        return obter(
            jogadorId,
            passivaId
        );

    }



    /* ======================================================
       RESETAR PASSIVA
       ====================================================== */

    function resetar(
        jogadorId,
        passivaId
    ) {

        const passiva =
            obterDefinicao(
                passivaId
            );


        if (!passiva) {

            return null;

        }


        const inicial =
            passiva.stacks?.inicial ?? 0;


        return definir(
            jogadorId,
            passivaId,
            inicial
        );

    }



    /* ======================================================
       RESETAR TODAS AS PASSIVAS DO JOGADOR
       ====================================================== */

    function resetarJogador(
        jogadorId
    ) {

        const idJogador =
            normalizarIdJogador(
                jogadorId
            );


        if (!idJogador) {

            return;

        }


        if (
            !estadoStacks[idJogador]
        ) {

            return;

        }


        Object.keys(
            estadoStacks[idJogador]
        ).forEach(

            function (passivaId) {

                resetar(
                    idJogador,
                    passivaId
                );

            }

        );

    }



    /* ======================================================
       OBTER TODAS AS STACKS DO JOGADOR
       ====================================================== */

    function obterTodas(
        jogadorId
    ) {

        const idJogador =
            normalizarIdJogador(
                jogadorId
            );


        if (!idJogador) {

            return {};

        }


        const jogador =
            estadoStacks[idJogador];


        if (!jogador) {

            return {};

        }


        const resultado = {};


        Object.keys(
            jogador
        ).forEach(

            function (passivaId) {

                resultado[passivaId] =
                    obter(
                        idJogador,
                        passivaId
                    );

            }

        );


        return resultado;

    }



    /* ======================================================
       EVENTO DE ALTERAÇÃO
       ====================================================== */

    function emitirAlteracao(
        estado,
        valorAnterior
    ) {

        if (!estado) {

            return;

        }


        const evento =
            new CustomEvent(
                "passiva:stacksAlterada",
                {

                    detail: {

                        jogadorId:
                            estado.jogadorId,

                        passivaId:
                            estado.passivaId,

                        anterior:
                            valorAnterior,

                        atual:
                            estado.valor,

                        minimo:
                            estado.minimo,

                        maximo:
                            estado.maximo,

                        percentual:
                            calcularPercentual(
                                estado
                            )

                    }

                }
            );


        document.dispatchEvent(
            evento
        );


        console.log(
            "[Passivas Stacks]",
            estado.passivaId,
            "→",
            estado.valor,
            "/",
            estado.maximo
        );

    }



    /* ======================================================
       EXPORTAÇÃO
       ====================================================== */

    window.PassivasStacks = {

        obter,

        obterTodas,

        definir,

        adicionar,

        remover,

        resetar,

        resetarJogador

    };


    console.log(
        "[Passivas] Sistema de Stacks carregado."
    );

})();
