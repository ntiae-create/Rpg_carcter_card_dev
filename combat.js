/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: COMBATE
========================================================= */

const CombatModule = (() => {

    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        configurarBotoes();

        configurarEditor();

        atualizar();

    }


    /* =====================================================
       BOTÕES DE COMBATE
    ===================================================== */

    function configurarBotoes() {

        const buttons =
            document.querySelectorAll(
                ".combat-use-button"
            );


        buttons.forEach(button => {

            if (
                button.dataset.combatModuleConfigured ===
                "true"
            ) {

                return;

            }


            button.dataset.combatModuleConfigured =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    const action =
                        button.dataset.action;


                    if (
                        action ===
                        "basic-attack"
                    ) {

                        usarAtaqueBasico();

                    }


                    else if (
                        action ===
                        "counterattack"
                    ) {

                        usarContraAtaque();

                    }


                    else if (
                        action ===
                        "ability"
                    ) {

                        const index =
                            Number(
                                button.dataset
                                    .abilityIndex
                            );


                        usarHabilidade(index);

                    }

                }
            );

        });

    }


    /* =====================================================
       ATAQUE BÁSICO
    ===================================================== */

    function usarAtaqueBasico() {

        const custo = 1;


        if (
            character.resources.est <
            custo
        ) {

            registrar(
                "EST insuficiente para o ataque básico."
            );


            return;

        }


        character.resources.est -=
            custo;


        const name =
            character.combat
                .basicAttackName ||
            "Ataque básico";


        registrar(
            `${name} usado. −1 EST.`
        );


        atualizar();

        salvarPersonagem();


        aplicarEfeitoAtaque();

    }


    /* =====================================================
       CONTRA-ATAQUE
    ===================================================== */

    function usarContraAtaque() {

        const custo = 3;


        if (
            character.resources.est <
            custo
        ) {

            registrar(
                "EST insuficiente para o contra-ataque."
            );


            return;

        }


        character.resources.est -=
            custo;


        registrar(
            "Contra-ataque realizado. −3 EST."
        );


        atualizar();

        salvarPersonagem();


        aplicarEfeitoContraAtaque();

    }


    /* =====================================================
       HABILIDADES
    ===================================================== */

    function usarHabilidade(index) {

        const abilities =
            character.combat &&
            Array.isArray(
                character.combat.abilities
            )
                ? character.combat.abilities
                : [];


        const ability =
            abilities[index];


        if (!ability) {

            return;

        }


        const name =
            String(
                ability.name || ""
            ).trim();


        if (!name) {

            registrar(
                `Habilidade ${index + 1} ainda não foi configurada.`
            );


            return;

        }


        const cost =
            limitarNumero(
                ability.cost,
                0
            );


        const type =
            ability.costType === "est"
                ? "est"
                : "mp";


        if (
            type === "mp"
        ) {

            if (
                character.resources.mp <
                cost
            ) {

                registrar(
                    `${name}: MP insuficiente.`
                );


                return;

            }


            character.resources.mp -=
                cost;


            registrar(
                `${name} usada. −${cost} MP.`
            );

        }


        else {

            if (
                character.resources.est <
                cost
            ) {

                registrar(
                    `${name}: EST insuficiente.`
                );


                return;

            }


            character.resources.est -=
                cost;


            registrar(
                `${name} usada. −${cost} EST.`
            );

        }


        atualizar();

        salvarPersonagem();


        aplicarEfeitoHabilidade();

    }


    /* =====================================================
       EDITOR DE COMBATE
    ===================================================== */

    function configurarEditor() {

        configurarAtaqueBasico();

        configurarHabilidades();

        configurarPassiva();

    }


    /* =====================================================
       ATAQUE BÁSICO — EDITOR
    ===================================================== */

    function configurarAtaqueBasico() {

        const input =
            get(
                "basic-attack-name"
            );


        if (!input) {

            return;

        }


        if (
            input.dataset.combatEditorConfigured ===
            "true"
        ) {

            return;

        }


        input.dataset.combatEditorConfigured =
            "true";


        input.value =
            character.combat
                .basicAttackName ||
            "Ataque básico";


        input.addEventListener(
            "input",
            () => {

                character.combat
                    .basicAttackName =
                    input.value;


                salvarPersonagem();


                atualizar();

            }
        );

    }


    /* =====================================================
       HABILIDADES — EDITOR
    ===================================================== */

    function configurarHabilidades() {

        const cards =
            document.querySelectorAll(
                ".ability-card"
            );


        cards.forEach(card => {

            const index =
                Number(
                    card.dataset.abilityIndex
                );


            const ability =
                character.combat
                    .abilities[index];


            if (!ability) {

                return;

            }


            const nameInput =
                card.querySelector(
                    ".ability-name-input"
                );


            const costType =
                card.querySelector(
                    ".ability-cost-type"
                );


            const costInput =
                card.querySelector(
                    ".ability-cost-input"
                );


            const descriptionInput =
                card.querySelector(
                    ".ability-description-input"
                );


            /* ---------------------------------------------
               NOME
            --------------------------------------------- */

            if (nameInput) {

                if (
                    nameInput.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    nameInput.dataset.combatEditorConfigured =
                        "true";


                    nameInput.value =
                        ability.name;


                    nameInput.addEventListener(
                        "input",
                        () => {

                            ability.name =
                                nameInput.value;


                            salvarPersonagem();

                        }
                    );

                }

            }


            /* ---------------------------------------------
               TIPO DE CUSTO
            --------------------------------------------- */

            if (costType) {

                if (
                    costType.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    costType.dataset.combatEditorConfigured =
                        "true";


                    costType.value =
                        ability.costType;


                    costType.addEventListener(
                        "change",
                        () => {

                            ability.costType =
                                costType.value;


                            salvarPersonagem();

                        }
                    );

                }

            }


            /* ---------------------------------------------
               CUSTO
            --------------------------------------------- */

            if (costInput) {

                if (
                    costInput.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    costInput.dataset.combatEditorConfigured =
                        "true";


                    costInput.value =
                        ability.cost;


                    costInput.addEventListener(
                        "input",
                        () => {

                            ability.cost =
                                limitarNumero(
                                    costInput.value,
                                    0
                                );


                            salvarPersonagem();

                        }
                    );

                }

            }


            /* ---------------------------------------------
               DESCRIÇÃO
            --------------------------------------------- */

            if (descriptionInput) {

                if (
                    descriptionInput.dataset.combatEditorConfigured !==
                    "true"
                ) {

                    descriptionInput.dataset.combatEditorConfigured =
                        "true";


                    descriptionInput.value =
                        ability.description;


                    descriptionInput.addEventListener(
                        "input",
                        () => {

                            ability.description =
                                descriptionInput.value;


                            salvarPersonagem();

                        }
                    );

                }

            }

        });

    }


    /* =====================================================
       PASSIVA — EDITOR
    ===================================================== */

    function configurarPassiva() {

        const nameInput =
            get("passive-name");


        const descriptionInput =
            get(
                "passive-description"
            );


        if (nameInput) {

            if (
                nameInput.dataset.combatEditorConfigured !==
                "true"
            ) {

                nameInput.dataset.combatEditorConfigured =
                    "true";


                nameInput.value =
                    character.combat
                        .passive.name;


                nameInput.addEventListener(
                    "input",
                    () => {

                        character.combat
                            .passive.name =
                            nameInput.value;


                        salvarPersonagem();

                    }
                );

            }

        }


        if (descriptionInput) {

            if (
                descriptionInput.dataset.combatEditorConfigured !==
                "true"
            ) {

                descriptionInput.dataset.combatEditorConfigured =
                    "true";


                descriptionInput.value =
                    character.combat
                        .passive.description;


                descriptionInput.addEventListener(
                    "input",
                    () => {

                        character.combat
                            .passive.description =
                            descriptionInput.value;


                        salvarPersonagem();

                    }
                );

            }

        }

    }


    /* =====================================================
       LOG
    ===================================================== */

    function registrar(message) {

        if (
            !character.combat.log
        ) {

            character.combat.log = [];

        }


        character.combat.log.unshift(
            message
        );


        character.combat.log =
            character.combat.log.slice(
                0,
                20
            );


        atualizarLog();


        salvarPersonagem();

    }


    function atualizarLog() {

        const log =
            get("combat-log");


        if (!log) {

            return;

        }


        if (
            !character.combat.log ||
            !character.combat.log.length
        ) {

            log.innerHTML =
                "<p>Nenhuma ação realizada.</p>";


            return;

        }


        log.innerHTML =
            character.combat.log
                .map(
                    entry =>
                        `<p>${escaparHTML(entry)}</p>`
                )
                .join("");

    }


    /* =====================================================
       ATUALIZAR
    ===================================================== */

    function atualizar() {

        if (!character) {

            return;

        }


        definirTexto(
            "combat-mp",
            character.resources.mp
        );


        definirTexto(
            "combat-est",
            character.resources.est
        );


        atualizarLog();

        sincronizarEditor();

    }


    /* =====================================================
       SINCRONIZAR EDITOR
    ===================================================== */

    function sincronizarEditor() {

        const basic =
            get("basic-attack-name");


        if (
            basic &&
            document.activeElement !==
            basic
        ) {

            basic.value =
                character.combat
                    .basicAttackName ||
                "Ataque básico";

        }


        const cards =
            document.querySelectorAll(
                ".ability-card"
            );


        cards.forEach(card => {

            const index =
                Number(
                    card.dataset.abilityIndex
                );


            const ability =
                character.combat
                    .abilities[index];


            if (!ability) {

                return;

            }


            const name =
                card.querySelector(
                    ".ability-name-input"
                );


            const type =
                card.querySelector(
                    ".ability-cost-type"
                );


            const cost =
                card.querySelector(
                    ".ability-cost-input"
                );


            const description =
                card.querySelector(
                    ".ability-description-input"
                );


            if (
                name &&
                document.activeElement !==
                name
            ) {

                name.value =
                    ability.name;

            }


            if (type) {

                type.value =
                    ability.costType;

            }


            if (
                cost &&
                document.activeElement !==
                cost
            ) {

                cost.value =
                    ability.cost;

            }


            if (
                description &&
                document.activeElement !==
                description
            ) {

                description.value =
                    ability.description;

            }

        });


        const passiveName =
            get("passive-name");


        const passiveDescription =
            get(
                "passive-description"
            );


        if (
            passiveName &&
            document.activeElement !==
            passiveName
        ) {

            passiveName.value =
                character.combat
                    .passive.name;

        }


        if (
            passiveDescription &&
            document.activeElement !==
            passiveDescription
        ) {

            passiveDescription.value =
                character.combat
                    .passive.description;

        }

    }


    /* =====================================================
       EFEITOS VISUAIS
    ===================================================== */

    function aplicarEfeitoAtaque() {

        const card =
            document.querySelector(
                ".character-card"
            );


        if (!card) {

            return;

        }


        card.classList.remove(
            "combat-attack-effect"
        );


        void card.offsetWidth;


        card.classList.add(
            "combat-attack-effect"
        );

    }


    function aplicarEfeitoContraAtaque() {

        const card =
            document.querySelector(
                ".character-card"
            );


        if (!card) {

            return;

        }


        card.classList.remove(
            "combat-counter-effect"
        );


        void card.offsetWidth;


        card.classList.add(
            "combat-counter-effect"
        );

    }


    function aplicarEfeitoHabilidade() {

        const card =
            document.querySelector(
                ".character-card"
            );


        if (!card) {

            return;

        }


        card.classList.remove(
            "combat-ability-effect"
        );


        void card.offsetWidth;


        card.classList.add(
            "combat-ability-effect"
        );

    }


    /* =====================================================
       UTILIDADES INTERNAS
    ===================================================== */

    function get(id) {

        return document.getElementById(id);

    }


    function definirTexto(
        id,
        value
    ) {

        const element =
            get(id);


        if (element) {

            element.textContent =
                value;

        }

    }


    function limitarNumero(
        valor,
        minimo = 0
    ) {

        const numero =
            Number(valor);


        if (
            Number.isNaN(numero)
        ) {

            return minimo;

        }


        return Math.max(
            minimo,
            numero
        );

    }


    function escaparHTML(
        text
    ) {

        return String(text)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =====================================================
       API
    ===================================================== */

    return {

        iniciar,

        atualizar,

        usarAtaqueBasico,

        usarContraAtaque,

        usarHabilidade,

        registrar,

        atualizarLog

    };

})();
