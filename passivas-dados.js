/* ==========================================
   RPG — DADOS DAS PASSIVAS
========================================== */

"use strict";

(function () {

    /*
     * Este arquivo NÃO executa passivas.
     *
     * Ele apenas define as informações
     * de cada passiva do sistema.
     *
     * A lógica ficará nos outros módulos.
     */


    const PASSIVAS = {


        /* ==================================================
           EXEMPLO DE PASSIVA COM STACKS
           ================================================== */

        poder_arcano: {

            id: "poder_arcano",

            nome: "Poder Arcano",

            descricao:
                "Acumula poder conforme as condições da passiva são cumpridas.",

            tipo: "stack",

            stacks: {

                minimo: 0,

                maximo: 5,

                inicial: 0

            },

            efeitoPorStack: {

                1: {
                    descricao: "Primeiro nível de poder acumulado.",
                    valor: 5
                },

                2: {
                    descricao: "Segundo nível de poder acumulado.",
                    valor: 10
                },

                3: {
                    descricao: "Terceiro nível de poder acumulado.",
                    valor: 15
                },

                4: {
                    descricao: "Quarto nível de poder acumulado.",
                    valor: 20
                },

                5: {
                    descricao: "Poder máximo acumulado.",
                    valor: 25
                }

            },

            visual: {

                classeBase: "passiva-stack",

                efeitoPorStack: {

                    0: "nenhum",

                    1: "stack-1",

                    2: "stack-2",

                    3: "stack-3",

                    4: "stack-4",

                    5: "stack-5"

                }

            }

        }


    };


    /* ======================================================
       API
       ====================================================== */

    window.PassivasDados = {

        obter: function (id) {

            return PASSIVAS[id] || null;

        },


        listar: function () {

            return Object.values(PASSIVAS);

        },


        existe: function (id) {

            return Boolean(
                PASSIVAS[id]
            );

        }

    };


    console.log(
        "[Passivas] Dados carregados:",
        Object.keys(PASSIVAS).length
    );

})();
