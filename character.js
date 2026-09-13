/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: CHARACTER
========================================================= */

/*
   Este arquivo será responsável por tudo relacionado
   à identidade e evolução básica do personagem.

   Por enquanto, o script.js continua sendo o responsável
   pela execução principal.

   Nesta primeira etapa estamos apenas preparando a
   separação do sistema sem interferir nas outras áreas.
*/


const CharacterModule = (() => {

    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    const MAX_LEVEL = 30;


    /* =====================================================
       XP POR NÍVEL
    ===================================================== */

    const XP_LEVELS = {

        1: 100,
        2: 150,
        3: 225,
        4: 325,
        5: 450,
        6: 600,
        7: 775,
        8: 975,
        9: 1200,
        10: 1200,
        11: 1350,
        12: 1500,
        13: 1650,
        14: 1800,
        15: 1950

    };


    /* =====================================================
       XP NECESSÁRIO PARA O PRÓXIMO NÍVEL
    ===================================================== */

    function getXPNecessario(level) {

        if (level >= MAX_LEVEL) {

            return 0;

        }


        if (XP_LEVELS[level]) {

            return XP_LEVELS[level];

        }


        /*
           Depois do nível 15,
           continua aumentando em 150 XP.
        */

        return 1950 + ((level - 15) * 150);

    }


    /* =====================================================
       LIMITE DE NÍVEL
    ===================================================== */

    function getMaxLevel() {

        return MAX_LEVEL;

    }


    /* =====================================================
       PORCENTAGEM DE XP
    ===================================================== */

    function getXPProgress(level, xp) {

        if (level >= MAX_LEVEL) {

            return 100;

        }


        const necessario =
            getXPNecessario(level);


        if (necessario <= 0) {

            return 0;

        }


        return Math.min(
            100,
            Math.max(
                0,
                (xp / necessario) * 100
            )
        );

    }


    /* =====================================================
       NOME DO PERSONAGEM
    ===================================================== */

    function definirNome(personagem, nome) {

        if (!personagem) {

            return;

        }


        const novoNome =
            String(nome || "").trim();


        personagem.name =
            novoNome || "Personagem";

    }


    /* =====================================================
       RAÇA
    ===================================================== */

    function definirRaca(personagem, raca) {

        if (!personagem || !raca) {

            return;

        }


        personagem.race = raca;

    }


    /* =====================================================
       CLASSE
    ===================================================== */

    function definirClasse(personagem, classe) {

        if (!personagem || !classe) {

            return;

        }


        personagem.class = classe;

    }


    /* =====================================================
       IMAGEM POR URL
    ===================================================== */

    function definirImagem(personagem, url) {

        if (!personagem) {

            return;

        }


        personagem.imageURL =
            String(url || "").trim();

    }


    /* =====================================================
       REMOVER IMAGEM
    ===================================================== */

    function removerImagem(personagem) {

        if (!personagem) {

            return;

        }


        personagem.imageURL = "";

    }


    /* =====================================================
       ADICIONAR XP
    ===================================================== */

    function adicionarXP(personagem, quantidade) {

        if (!personagem) {

            return;

        }


        const valor =
            Number(quantidade);


        if (!Number.isFinite(valor) || valor <= 0) {

            return;

        }


        personagem.xp += valor;


        /*
           A lógica de aplicação dos níveis continuará
           temporariamente no script.js.

           Isso é proposital nesta primeira etapa.
        */

    }


    /* =====================================================
       REMOVER XP
    ===================================================== */

    function removerXP(personagem, quantidade) {

        if (!personagem) {

            return;

        }


        const valor =
            Number(quantidade);


        if (!Number.isFinite(valor) || valor <= 0) {

            return;

        }


        personagem.xp =
            Math.max(
                0,
                personagem.xp - valor
            );

    }


    /* =====================================================
       NÍVEL ATUAL
    ===================================================== */

    function getLevel(personagem) {

        if (!personagem) {

            return 1;

        }


        return Math.max(
            1,
            Math.min(
                MAX_LEVEL,
                Number(personagem.level) || 1
            )
        );

    }


    /* =====================================================
       XP ATUAL
    ===================================================== */

    function getXP(personagem) {

        if (!personagem) {

            return 0;

        }


        return Math.max(
            0,
            Number(personagem.xp) || 0
        );

    }


    /* =====================================================
       INFORMAÇÕES DO PERSONAGEM
    ===================================================== */

    function getInfo(personagem) {

        if (!personagem) {

            return {

                name: "Personagem",
                race: "",
                class: "",
                level: 1,
                xp: 0,
                imageURL: ""

            };

        }


        return {

            name:
                personagem.name || "Personagem",

            race:
                personagem.race || "",

            class:
                personagem.class || "",

            level:
                getLevel(personagem),

            xp:
                getXP(personagem),

            imageURL:
                personagem.imageURL || ""

        };

    }


    /* =====================================================
       API DO MÓDULO
    ===================================================== */

    return {

        MAX_LEVEL,

        XP_LEVELS,

        getXPNecessario,

        getMaxLevel,

        getXPProgress,

        definirNome,

        definirRaca,

        definirClasse,

        definirImagem,

        removerImagem,

        adicionarXP,

        removerXP,

        getLevel,

        getXP,

        getInfo

    };

})();
