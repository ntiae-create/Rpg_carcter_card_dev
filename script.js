/* =========================================================
   RPG CHARACTER CARD
   SCRIPT PRINCIPAL
========================================================= */


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const STORAGE_KEY = "rpg_character_card";


/* =========================================================
   XP POR NÍVEL
========================================================= */

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


/* =========================================================
   RAÇAS
========================================================= */

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


/* =========================================================
   ELEMENTOS
========================================================= */

const ELEMENTS = {

    agua: {
        name: "Água",
        symbol: "💧"
    },

    luz: {
        name: "Luz",
        symbol: "☀️"
    },

    terra: {
        name: "Terra",
        symbol: "🪨"
    },

    trevas: {
        name: "Trevas",
        symbol: "🌑"
    },

    vento: {
        name: "Vento",
        symbol: "🌪️"
    },

    fogo: {
        name: "Fogo",
        symbol: "🔥"
    },

    fisico: {
        name: "Físico",
        symbol: "💪"
    },

    magico: {
        name: "Mágico",
        symbol: "✨"
    }

};


/* =========================================================
   BRASÕES
========================================================= */

const CRESTS = {

    agua: {
        symbol: "🐺",
        guardian: "Guardião do Lobo"
    },

    luz: {
        symbol: "🐯",
        guardian: "Guardião do Tigre"
    },

    terra: {
        symbol: "🐻",
        guardian: "Guardião do Urso"
    },

    trevas: {
        symbol: "🦊",
        guardian: "Guardião da Raposa"
    },

    vento: {
        symbol: "🦅",
        guardian: "Guardião da Águia"
    },

    fogo: {
        symbol: "🐉",
        guardian: "Guardião do Dragão"
    },

    fisico: {
        symbol: "🦣",
        guardian: "Guardião do Mamute"
    },

    magico: {
        symbol: "🦉",
        guardian: "Guardião da Coruja"
    }

};


/* =========================================================
   ESTÁGIOS DO BRASÃO
========================================================= */

const CREST_STAGES = [

    {
        xp: 0,
        name: "SEM NENHUM"
    },

    {
        xp: 3000,
        name: "INICIAL"
    },

    {
        xp: 6000,
        name: "LEVE"
    },

    {
        xp: 9000,
        name: "PEQUENO"
    },

    {
        xp: 12000,
        name: "MÉDIO"
    },

    {
        xp: 15000,
        name: "GRANDE"
    },

    {
        xp: 20000,
        name: "PESADO"
    },

    {
        xp: 25000,
        name: "ARCANO"
    },

    {
        xp: 50000,
        name: "EXTRA"
    }

];


/* =========================================================
   ESTADO PADRÃO
========================================================= */

function criarEstadoInicial() {

    const race = RACES["Humano"];

    return {

        name: "Personagem",

        race: "Humano",

        class: "Saber",

        affinity: null,

        level: 1,

        xp: 0,

        crestXP: 0,

        crestMilestones: 0,

        imageURL: "",


        resources: {

            hp: race.hp,
            mp: race.mp,
            est: race.est,
            sanidade: race.sanidade

        },


        attributes: {

            atk: race.atk,
            atkMgc: race.atkMgc,
            def: race.def,
            res: race.res,
            agi: race.agi,
            int: race.int

        },


        attributePoints: 3,


        combat: {

            basicAttackName: "Ataque básico",

            abilities: [

                {
                    name: "",
                    costType: "mp",
                    cost: 0,
                    description: ""
                },

                {
                    name: "",
                    costType: "mp",
                    cost: 0,
                    description: ""
                },

                {
                    name: "",
                    costType: "mp",
                    cost: 0,
                    description: ""
                }

            ],

            passive: {

                name: "",

                description: ""

            },

            log: []

        },


        inventory: {

            items: [],

            equipment: {

                weapon: "",
                armor: "",
                accessory: "",
                relic: ""

            }

        }

    };

}


/* =========================================================
   CARREGAR ESTADO
========================================================= */

let character = carregarPersonagem();


function carregarPersonagem() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {

        return criarEstadoInicial();

    }

    try {

        const data = JSON.parse(saved);

        const base = criarEstadoInicial();

        return mesclarObjetos(base, data);

    } catch (error) {

        console.error(
            "Erro ao carregar personagem:",
            error
        );

        return criarEstadoInicial();

    }

}


/* =========================================================
   MERGE
========================================================= */

function mesclarObjetos(base, extra) {

    for (const key in extra) {

        if (
            extra[key] &&
            typeof extra[key] === "object" &&
            !Array.isArray(extra[key])
        ) {

            base[key] = mesclarObjetos(
                base[key] || {},
                extra[key]
            );

        } else {

            base[key] = extra[key];

        }

    }

    return base;

}


/* =========================================================
   SALVAR
========================================================= */

function salvarPersonagem() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(character)
    );

}


/* =========================================================
   UTILIDADES
========================================================= */

function get(id) {

    return document.getElementById(id);

}


function limitarNumero(valor, minimo = 0) {

    const numero = Number(valor);

    if (Number.isNaN(numero)) {

        return minimo;

    }

    return Math.max(minimo, numero);

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function configurarNavegacao() {

    const buttons =
        document.querySelectorAll(
            ".dimension-button"
        );

    const sections =
        document.querySelectorAll(
            "[data-dimension-content]"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const dimension =
                    button.dataset.dimension;


                buttons.forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


                sections.forEach(section => {

                    section.classList.remove(
                        "active"
                    );

                });


                button.classList.add("active");


                const target =
                    document.querySelector(
                        `[data-dimension-content="${dimension}"]`
                    );


                if (target) {

                    target.classList.add(
                        "active"
                    );

                }

            }

        );

    });

}


/* =========================================================
   MODO MESTRE
========================================================= */

function configurarModoMestre() {

    const button =
        get("master-button");

    const controls =
        get("master-controls");


    if (!button || !controls) {

        return;

    }


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            controls.classList.toggle(
                "active"
            );

        }
    );

}


/* =========================================================
   EDITOR DE PERSONAGEM
========================================================= */

function configurarEditor() {

    const nameInput =
        get("character-name-input");

    const raceSelect =
        get("character-race-select");

    const classSelect =
        get("character-class-select");


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


/* =========================================================
   ALTERAR RAÇA
========================================================= */

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


/* =========================================================
   AFINIDADE ELEMENTAL
========================================================= */

let elementoSelecionado =
    character.affinity || null;


function configurarElementos() {

    const options =
        document.querySelectorAll(
            ".element-option"
        );

    const confirm =
        get("confirm-element");


    options.forEach(option => {

        option.addEventListener(
            "click",
            () => {

                /*
                   Se já existe afinidade,
                   ela é permanente.
                */

                if (character.affinity) {

                    return;

                }


                elementoSelecionado =
                    option.dataset.element;


                options.forEach(item => {

                    item.classList.remove(
                        "selected"
                    );

                });


                option.classList.add(
                    "selected"
                );


                if (confirm) {

                    confirm.disabled =
                        false;

                }

            }
        );

    });


    if (confirm) {

        confirm.addEventListener(
            "click",
            () => {

                if (!elementoSelecionado) {

                    return;

                }


                if (character.affinity) {

                    return;

                }


                character.affinity =
                    elementoSelecionado;


                salvarPersonagem();

                atualizarInterface();

                aplicarEfeitoElemental();


                confirm.textContent =
                    "AFINIDADE CONFIRMADA";

                confirm.disabled =
                    true;

            }
        );

    }

}


/* =========================================================
   EFEITO ELEMENTAL
========================================================= */

function aplicarEfeitoElemental() {

    const card =
        document.querySelector(
            ".character-card"
        );


    if (!card) {

        return;

    }


    /*
       Remove efeitos anteriores.
    */

    Object.keys(ELEMENTS).forEach(
        element => {

            card.classList.remove(
                `element-${element}`
            );

        }
    );


    if (!character.affinity) {

        return;

    }


    card.classList.add(
        `element-${character.affinity}`
    );

}


/* =========================================================
   ATRIBUTOS
========================================================= */

function configurarAtributos() {

    const buttons =
        document.querySelectorAll(
            ".attribute-plus"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const attribute =
                    button.dataset.attribute;


                if (
                    character.attributePoints <= 0
                ) {

                    return;

                }


                if (
                    character.attributes[
                        attribute
                    ] === undefined
                ) {

                    return;

                }


                character.attributes[
                    attribute
                ]++;


                character.attributePoints--;


                atualizarInterface();

                salvarPersonagem();

            }
        );

    });

}


/* =========================================================
   XP
========================================================= */

function obterXPNecessario(level) {

    if (level < 10) {

        return XP_LEVELS[level] || 100;

    }


    return 1200 + (
        Math.max(0, level - 10) * 150
    );

}


/* =========================================================
   ADICIONAR XP
========================================================= */

function adicionarXP(valor) {

    valor =
        limitarNumero(valor, 0);


    if (valor <= 0) {

        return;

    }


    const nivelAntes =
        character.level;


    character.xp += valor;


    while (
        character.level < 30 &&
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
           +1 sanidade
        */

        character.attributePoints += 3;


        character.resources.sanidade++;


        /*
           A cada 3 níveis:
           +5 nos recursos.
        */

        if (
            character.level % 3 === 0
        ) {

            character.resources.hp += 5;

            character.resources.mp += 5;

            character.resources.est += 5;

        }

    }


    if (character.level >= 30) {

        character.level = 30;

        character.xp = 0;

    }


    atualizarMarcosBrasao(
        nivelAntes,
        character.level
    );


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   REMOVER XP
========================================================= */

function removerXP(valor) {

    valor =
        limitarNumero(valor, 0);


    if (valor <= 0) {

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


    if (character.level <= 1) {

        character.level = 1;

        character.xp =
            Math.max(0, character.xp);

    }


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   CONTROLES DE XP DO MESTRE
========================================================= */

function configurarXP() {

    const amount =
        get("xp-amount");

    const add =
        get("add-xp");

    const remove =
        get("remove-xp");


    if (add) {

        add.addEventListener(
            "click",
            () => {

                adicionarXP(
                    amount.value
                );

            }
        );

    }


    if (remove) {

        remove.addEventListener(
            "click",
            () => {

                removerXP(
                    amount.value
                );

            }
        );

    }


    const crestAmount =
        get("crest-xp-amount");

    const addCrest =
        get("add-crest-xp");

    const removeCrest =
        get("remove-crest-xp");


    if (addCrest) {

        addCrest.addEventListener(
            "click",
            () => {

                adicionarXPDoBrasao(
                    crestAmount.value
                );

            }
        );

    }


    if (removeCrest) {

        removeCrest.addEventListener(
            "click",
            () => {

                removerXPDoBrasao(
                    crestAmount.value
                );

            }
        );

    }

}


/* =========================================================
   XP DO BRASÃO
========================================================= */

function adicionarXPDoBrasao(valor) {

    valor =
        limitarNumero(valor, 0);


    character.crestXP += valor;


    atualizarInterface();

    salvarPersonagem();

}


function removerXPDoBrasao(valor) {

    valor =
        limitarNumero(valor, 0);


    character.crestXP =
        Math.max(
            0,
            character.crestXP - valor
        );


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   MARCOS DO BRASÃO
========================================================= */

function atualizarMarcosBrasao(
    nivelAntes,
    nivelDepois
) {

    const marcoAntes =
        Math.floor(
            nivelAntes / 5
        );


    const marcoDepois =
        Math.floor(
            nivelDepois / 5
        );


    if (
        marcoDepois > marcoAntes
    ) {

        const diferenca =
            marcoDepois - marcoAntes;


        character.crestXP +=
            diferenca * 500;

    }

}


/* =========================================================
   RESET
========================================================= */

function configurarReset() {

    const button =
        get("reset-character");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        () => {

            const confirmar =
                window.confirm(
                    "Deseja realmente resetar o personagem?"
                );


            if (!confirmar) {

                return;

            }


            character =
                criarEstadoInicial();


            elementoSelecionado =
                null;


            salvarPersonagem();

            atualizarInterface();

            atualizarImagem();

            configurarEstadoElementos();

        }
    );

}


/* =========================================================
   COMBATE
========================================================= */

function configurarCombate() {

    /*
       Ataque básico,
       contra-ataque
       e habilidades.
    */

    const buttons =
        document.querySelectorAll(
            ".combat-use-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

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


    configurarEditorDeCombate();

}


/* =========================================================
   ATAQUE BÁSICO
========================================================= */

function usarAtaqueBasico() {

    const custo = 1;


    if (
        character.resources.est <
        custo
    ) {

        registrarCombate(
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


    registrarCombate(
        `${name} usado. −1 EST.`
    );


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   CONTRA-ATAQUE
========================================================= */

function usarContraAtaque() {

    const custo = 3;


    if (
        character.resources.est <
        custo
    ) {

        registrarCombate(
            "EST insuficiente para o contra-ataque."
        );

        return;

    }


    character.resources.est -=
        custo;


    registrarCombate(
        "Contra-ataque realizado. −3 EST."
    );


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   HABILIDADES
========================================================= */

function usarHabilidade(index) {

    const ability =
        character.combat
            .abilities[index];


    if (!ability) {

        return;

    }


    const name =
        ability.name.trim();


    if (!name) {

        registrarCombate(
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
        ability.costType;


    if (type === "mp") {

        if (
            character.resources.mp <
            cost
        ) {

            registrarCombate(
                `${name}: MP insuficiente.`
            );

            return;

        }


        character.resources.mp -=
            cost;


        registrarCombate(
            `${name} usada. −${cost} MP.`
        );

    }


    else if (type === "est") {

        if (
            character.resources.est <
            cost
        ) {

            registrarCombate(
                `${name}: EST insuficiente.`
            );

            return;

        }


        character.resources.est -=
            cost;


        registrarCombate(
            `${name} usada. −${cost} EST.`
        );

    }


    atualizarInterface();

    salvarPersonagem();

}


/* =========================================================
   EDITOR DAS HABILIDADES
========================================================= */

function configurarEditorDeCombate() {

    const basicInput =
        get("basic-attack-name");


    if (basicInput) {

        basicInput.value =
            character.combat
                .basicAttackName;


        basicInput.addEventListener(
            "input",
            () => {

                character.combat
                    .basicAttackName =
                    basicInput.value;

                salvarPersonagem();

            }
        );

    }


    const abilityCards =
        document.querySelectorAll(
            ".ability-card"
        );


    abilityCards.forEach(card => {

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


        if (nameInput) {

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


        if (costType) {

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


        if (costInput) {

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


        if (descriptionInput) {

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

    });


    /*
       PASSIVA
    */

    const passiveName =
        get("passive-name");

    const passiveDescription =
        get("passive-description");


    if (passiveName) {

        passiveName.value =
            character.combat
                .passive.name;


        passiveName.addEventListener(
            "input",
            () => {

                character.combat
                    .passive.name =
                    passiveName.value;

                salvarPersonagem();

            }
        );

    }


    if (passiveDescription) {

        passiveDescription.value =
            character.combat
                .passive.description;


        passiveDescription.addEventListener(
            "input",
            () => {

                character.combat
                    .passive.description =
                    passiveDescription.value;

                salvarPersonagem();

            }
        );

    }

}


/* =========================================================
   LOG DE COMBATE
========================================================= */

function registrarCombate(message) {

    character.combat.log.unshift(
        message
    );


    /*
       Mantém somente os últimos 20.
    */

    character.combat.log =
        character.combat.log.slice(
            0,
            20
        );


    atualizarLogCombate();

    salvarPersonagem();

}


function atualizarLogCombate() {

    const log =
        get("combat-log");


    if (!log) {

        return;

    }


    if (
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


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   INVENTÁRIO
========================================================= */

function atualizarInventario() {

    const slots =
        get("inventory-slots");

    const capacity =
        get("inventory-capacity");


    const bonus =
        Math.floor(
            character.level / 10
        ) * 50;


    const maxSlots =
        50 + bonus;


    const used =
        character.inventory.items.length;


    if (capacity) {

        capacity.textContent =
            `${used} / ${maxSlots}`;

    }


    if (!slots) {

        return;

    }


    slots.innerHTML = "";


    for (
        let i = 0;
        i < maxSlots;
        i++
    ) {

        const slot =
            document.createElement(
                "div"
            );


        slot.className =
            "inventory-slot";


        if (
            character.inventory.items[i]
        ) {

            slot.textContent =
                character.inventory.items[i];

            slot.classList.add(
                "occupied"
            );

        } else {

            slot.textContent =
                i + 1;

        }


        slots.appendChild(slot);

    }

}


/* =========================================================
   IMAGEM
========================================================= */

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


/* =========================================================
   BRASÃO
========================================================= */

function obterEstagioBrasao() {

    let stage =
        CREST_STAGES[0];


    for (
        const current of CREST_STAGES
    ) {

        if (
            character.crestXP >=
            current.xp
        ) {

            stage = current;

        }

    }


    return stage;

}


/* =========================================================
   ATUALIZAR BRASÃO
========================================================= */

function atualizarBrasao() {

    const stage =
        obterEstagioBrasao();


    const stageElement =
        get("crest-stage");


    const crestXP =
        get("crest-xp");


    const progress =
        get("crest-xp-progress");


    const symbol =
        get("crest-symbol");


    if (stageElement) {

        stageElement.textContent =
            stage.name;

    }


    if (crestXP) {

        crestXP.textContent =
            `${character.crestXP} XP`;

    }


    /*
       Descobre próximo estágio.
    */

    let nextStage = null;


    for (
        const current of CREST_STAGES
    ) {

        if (
            current.xp >
            character.crestXP
        ) {

            nextStage = current;

            break;

        }

    }


    if (progress) {

        if (!nextStage) {

            progress.style.width =
                "100%";

        } else {

            const previousStage =
                stage.xp;


            const total =
                nextStage.xp -
                previousStage;


            const current =
                character.crestXP -
                previousStage;


            const percentage =
                Math.min(
                    100,
                    Math.max(
                        0,
                        (current / total) *
                        100
                    )
                );


            progress.style.width =
                `${percentage}%`;

        }

    }


    if (
        symbol &&
        character.affinity &&
        CRESTS[
            character.affinity
        ]
    ) {

        symbol.textContent =
            CRESTS[
                character.affinity
            ].symbol;

    }

}


/* =========================================================
   INTERFACE PRINCIPAL
========================================================= */

function atualizarInterface() {

    /*
       Nome
    */

    const name =
        get("character-name");


    if (name) {

        name.textContent =
            character.name;

    }


    /*
       Raça
    */

    const race =
        get("character-race");


    if (race) {

        race.textContent =
            character.race;

    }


    /*
       Classe
    */

    const classElement =
        get("character-class");


    if (classElement) {

        classElement.textContent =
            character.class;

    }


    /*
       Nível
    */

    const level =
        get("character-level");


    if (level) {

        level.textContent =
            `LV. ${character.level}`;

    }


    /*
       Afinidade
    */

    const affinity =
        get("character-affinity");


    const affinitySymbol =
        get(
            "character-affinity-symbol"
        );


    if (character.affinity) {

        const element =
            ELEMENTS[
                character.affinity
            ];


        if (affinity) {

            affinity.textContent =
                element.name;

        }


        if (affinitySymbol) {

            affinitySymbol.textContent =
                element.symbol;

        }

    } else {

        if (affinity) {

            affinity.textContent =
                "Nenhuma";

        }


        if (affinitySymbol) {

            affinitySymbol.textContent =
                "?";

        }

    }


    /*
       Recursos
    */

    definirTexto(
        "stat-hp",
        character.resources.hp
    );

    definirTexto(
        "stat-mp",
        character.resources.mp
    );

    definirTexto(
        "stat-est",
        character.resources.est
    );

    definirTexto(
        "stat-sanidade",
        character.resources.sanidade
    );


    /*
       Atributos
    */

    definirTexto(
        "stat-atk",
        character.attributes.atk
    );

    definirTexto(
        "stat-atkMgc",
        character.attributes.atkMgc
    );

    definirTexto(
        "stat-def",
        character.attributes.def
    );

    definirTexto(
        "stat-res",
        character.attributes.res
    );

    definirTexto(
        "stat-agi",
        character.attributes.agi
    );

    definirTexto(
        "stat-int",
        character.attributes.int
    );


    /*
       Pontos
    */

    definirTexto(
        "attribute-points",
        character.attributePoints
    );


    /*
       XP
    */

    const xpText =
        get("character-xp-text");


    const xpProgress =
        get("character-xp-progress");


    const xpNeeded =
        obterXPNecessario(
            character.level
        );


    if (xpText) {

        if (
            character.level >= 30
        ) {

            xpText.textContent =
                "NÍVEL MÁXIMO";

        } else {

            xpText.textContent =
                `${character.xp} / ${xpNeeded}`;

        }

    }


    if (xpProgress) {

        const percentage =
            character.level >= 30
                ? 100
                : (
                    character.xp /
                    xpNeeded
                ) * 100;


        xpProgress.style.width =
            `${Math.min(
                100,
                percentage
            )}%`;

    }


    /*
       Brasão
    */

    atualizarBrasao();


    /*
       Combate
    */

    definirTexto(
        "combat-mp",
        character.resources.mp
    );

    definirTexto(
        "combat-est",
        character.resources.est
    );


    /*
       Log
    */

    atualizarLogCombate();


    /*
       Inventário
    */

    atualizarInventario();


    /*
       Imagem
    */

    atualizarImagem();


    /*
       Elemento
    */

    aplicarEfeitoElemental();


    /*
       Inputs do editor
    */

    sincronizarEditor();


    /*
       Seleção elemental
    */

    configurarEstadoElementos();

}


/* =========================================================
   TEXTO
========================================================= */

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


/* =========================================================
   SINCRONIZAR EDITOR
========================================================= */

function sincronizarEditor() {

    const name =
        get("character-name-input");


    if (name) {

        if (
            document.activeElement !==
            name
        ) {

            name.value =
                character.name;

        }

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
        document.activeElement !==
        imageURL
    ) {

        imageURL.value =
            character.imageURL || "";

    }


    /*
       Ataque básico
    */

    const basic =
        get("basic-attack-name");


    if (
        basic &&
        document.activeElement !==
        basic
    ) {

        basic.value =
            character.combat
                .basicAttackName;

    }


    /*
       Habilidades
    */

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


    /*
       Passiva
    */

    const passiveName =
        get("passive-name");


    const passiveDescription =
        get("passive-description");


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


/* =========================================================
   ESTADO DOS ELEMENTOS
========================================================= */

function configurarEstadoElementos() {

    const options =
        document.querySelectorAll(
            ".element-option"
        );


    const confirm =
        get("confirm-element");


    options.forEach(option => {

        option.classList.remove(
            "selected"
        );


        if (
            character.affinity &&
            option.dataset.element ===
            character.affinity
        ) {

            option.classList.add(
                "selected"
            );

        }

    });


    if (confirm) {

        if (character.affinity) {

            confirm.disabled =
                true;

            confirm.textContent =
                "AFINIDADE CONFIRMADA";

        } else {

            confirm.disabled =
                !elementoSelecionado;

            confirm.textContent =
                "CONFIRMAR AFINIDADE";

        }

    }

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function iniciar() {

    configurarNavegacao();

    configurarModoMestre();

    configurarEditor();

    configurarElementos();

    configurarAtributos();

    configurarXP();

    configurarReset();

    configurarCombate();

    atualizarInterface();

}


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);
