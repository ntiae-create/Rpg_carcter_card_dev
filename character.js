/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: CHARACTER
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const CharacterModule = (() => {

    const MAX_LEVEL = 30;


    /* =====================================================
       RAÇAS
    ===================================================== */

    const RACES = {

        "Humano": {
            hp: 25,
            mp: 15,
            est: 30,
            sanidade: 100,
            atk: 4,
            atkMgc: 4,
            def: 8,
            res: 8,
            agi: 8,
            int: 15
        },

        "Meio-elfo": {
            hp: 23,
            mp: 22,
            est: 25,
            sanidade: 100,
            atk: 3,
            atkMgc: 7,
            def: 6,
            res: 9,
            agi: 10,
            int: 15
        },

        "Elfo": {
            hp: 22,
            mp: 25,
            est: 25,
            sanidade: 100,
            atk: 3,
            atkMgc: 8,
            def: 5,
            res: 9,
            agi: 12,
            int: 16
        },

        "Semi-besta": {
            hp: 30,
            mp: 10,
            est: 35,
            sanidade: 90,
            atk: 9,
            atkMgc: 3,
            def: 7,
            res: 6,
            agi: 10,
            int: 10
        },

        "Besta": {
            hp: 35,
            mp: 8,
            est: 40,
            sanidade: 80,
            atk: 11,
            atkMgc: 2,
            def: 6,
            res: 5,
            agi: 9,
            int: 6
        }

    };


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
       XP NECESSÁRIO
    ===================================================== */

    function obterXPNecessario(level) {

        if (level < 10) {

            return XP_LEVELS[level] || 100;

        }


        return 1200 + (
            Math.max(0, level - 10) * 150
        );

    }


    /* =====================================================
       ADICIONAR XP
    ===================================================== */

    function adicionarXP(valor) {

        valor =
            Number(valor);


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            return;

        }


        const nivelAntes =
            character.level;


        character.xp += valor;


        while (
            character.level < MAX_LEVEL &&
            character.xp >=
            obterXPNecessario(
                character.level
            )
        ) {

            character.xp -=
                obterXPNecessario(
                    character.level
                );


            character.level++;


            /*
               Cada nível:
               +3 pontos de atributo
               +1 Sanidade
            */

            character.attributePoints += 3;

            character.resources.sanidade++;


            /*
               A cada 3 níveis:
               +5 HP
               +5 MP
               +5 EST
            */

            if (
                character.level % 3 === 0
            ) {

                character.resources.hp += 5;

                character.resources.mp += 5;

                character.resources.est += 5;

            }

        }


        if (
            character.level >= MAX_LEVEL
        ) {

            character.level = MAX_LEVEL;

            character.xp = 0;

        }


        /*
           O sistema de brasão continua no
           script principal.
        */

        if (
            typeof atualizarMarcosBrasao ===
            "function"
        ) {

            atualizarMarcosBrasao(
                nivelAntes,
                character.level
            );

        }


        atualizarInterface();

        salvarPersonagem();

    }


    /* =====================================================
       REMOVER XP
    ===================================================== */

    function removerXP(valor) {

        valor =
            Number(valor);


        if (
            !Number.isFinite(valor) ||
            valor <= 0
        ) {

            return;

        }


        character.xp -= valor;


        while (
            character.xp < 0 &&
            character.level > 1
        ) {

            character.level--;


            character.xp +=
                obterXPNecessario(
                    character.level
                );


            character.attributePoints =
                Math.max(
                    0,
                    character.attributePoints - 3
                );


            character.resources.sanidade =
                Math.max(
                    0,
                    character.resources.sanidade - 1
                );

        }


        if (
            character.level <= 1
        ) {

            character.level = 1;

            character.xp =
                Math.max(
                    0,
                    character.xp
                );

        }


        atualizarInterface();

        salvarPersonagem();

    }


    /* =====================================================
       ALTERAR RAÇA
    ===================================================== */

    function alterarRaca(raceName) {

        const race =
            RACES[raceName];


        if (!race) {

            return;

        }


        character.race =
            raceName;


        character.resources.hp =
            race.hp;

        character.resources.mp =
            race.mp;

        character.resources.est =
            race.est;

        character.resources.sanidade =
            race.sanidade;


        character.attributes.atk =
            race.atk;

        character.attributes.atkMgc =
            race.atkMgc;

        character.attributes.def =
            race.def;

        character.attributes.res =
            race.res;

        character.attributes.agi =
            race.agi;

        character.attributes.int =
            race.int;


        atualizarInterface();

        salvarPersonagem();

    }


    /* =====================================================
       EDITOR DO PERSONAGEM
    ===================================================== */

    function configurarEditor() {

        const nameInput =
            get("character-name-input");

        const raceSelect =
            get("character-race-select");

        const classSelect =
            get("character-class-select");


        /* -------------------------------------------------
           NOME
        ------------------------------------------------- */

        if (nameInput) {

            nameInput.value =
                character.name;


            nameInput.addEventListener(
                "input",
                () => {

                    character.name =
                        nameInput.value ||
                        "Personagem";


                    atualizarInterface();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           RAÇA
        ------------------------------------------------- */

        if (raceSelect) {

            raceSelect.value =
                character.race;


            raceSelect.addEventListener(
                "change",
                () => {

                    alterarRaca(
                        raceSelect.value
                    );

                }
            );

        }


        /* -------------------------------------------------
           CLASSE
        ------------------------------------------------- */

        if (classSelect) {

            classSelect.value =
                character.class;


            classSelect.addEventListener(
                "change",
                () => {

                    character.class =
                        classSelect.value;


                    atualizarInterface();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           URL DA IMAGEM
        ------------------------------------------------- */

        const imageURL =
            get("character-image-url");


        if (imageURL) {

            imageURL.value =
                character.imageURL || "";

        }


        const applyImage =
            get("apply-image-url");


        if (applyImage) {

            applyImage.addEventListener(
                "click",
                () => {

                    character.imageURL =
                        imageURL.value.trim();


                    atualizarImagem();

                    salvarPersonagem();

                }
            );

        }


        /* -------------------------------------------------
           REMOVER IMAGEM
        ------------------------------------------------- */

        const removeImage =
            get("remove-image-button");


        if (removeImage) {

            removeImage.addEventListener(
                "click",
                () => {

                    character.imageURL = "";


                    if (imageURL) {

                        imageURL.value = "";

                    }


                    atualizarImagem();

                    salvarPersonagem();

                }
            );

        }

    }


    /* =====================================================
       ATUALIZAR IMAGEM
    ===================================================== */

    function atualizarImagem() {

        const container =
            get(
                "character-art-container"
            );


        if (!container) {

            return;

        }


        if (
            character.imageURL
        ) {

            container.innerHTML = `
                <img
                    src="${escaparHTML(character.imageURL)}"
                    alt="Imagem do personagem"
                    class="character-image-display"
                    onerror="this.style.display='none'; this.parentElement.classList.add('image-error');"
                >
            `;

        } else {

            container.innerHTML = `

                <div class="image-placeholder">

                    <span>
                        IMAGEM DO PERSONAGEM
                    </span>

                    <span>
                        Adicione uma imagem no editor
                    </span>

                </div>

            `;

        }

    }


    /* =====================================================
       SINCRONIZAR EDITOR
    ===================================================== */

    function sincronizarEditor() {

        const name =
            get("character-name-input");


        if (
            name &&
            document.activeElement !== name
        ) {

            name.value =
                character.name;

        }


        const race =
            get("character-race-select");


        if (race) {

            race.value =
                character.race;

        }


        const classSelect =
            get("character-class-select");


        if (classSelect) {

            classSelect.value =
                character.class;

        }


        const imageURL =
            get("character-image-url");


        if (
            imageURL &&
            document.activeElement !== imageURL
        ) {

            imageURL.value =
                character.imageURL || "";

        }

    }


    /* =====================================================
       INFORMAÇÕES
    ===================================================== */

    function getInfo() {

        return {

            name:
                character.name,

            race:
                character.race,

            class:
                character.class,

            level:
                character.level,

            xp:
                character.xp,

            imageURL:
                character.imageURL

        };

    }


    /* =====================================================
       API DO MÓDULO
    ===================================================== */

    return {

        RACES,

        XP_LEVELS,

        MAX_LEVEL,

        obterXPNecessario,

        adicionarXP,

        removerXP,

        alterarRaca,

        configurarEditor,

        atualizarImagem,

        sincronizarEditor,

        getInfo

    };

})();
nameInput.addEventListener(
    "input",
    () => {

        character.name =
            nameInput.value ||
            "Personagem";

        atualizarInterface();

        salvarPersonagem();

    }
);
