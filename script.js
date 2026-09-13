/* =========================================================
   RPG CHARACTER CARD
   SCRIPT PRINCIPAL
========================================================= */


/* =========================================================
   DADOS DAS RAÇAS
========================================================= */

const RACES = {

    "Humano": {
        hp: 25,
        mp: 15,
        est: 30,
        sanity: 100,
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
        sanity: 100,
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
        sanity: 100,
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
        sanity: 90,
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
        sanity: 80,
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
        symbol: "💧",
        crest: "🐺",
        guardian: "Guardião do Lobo"
    },

    luz: {
        name: "Luz",
        symbol: "✨",
        crest: "🐯",
        guardian: "Guardião do Tigre"
    },

    terra: {
        name: "Terra",
        symbol: "🌍",
        crest: "🐻",
        guardian: "Guardião do Urso"
    },

    trevas: {
        name: "Trevas",
        symbol: "🌑",
        crest: "🦊",
        guardian: "Guardião da Raposa"
    },

    vento: {
        name: "Vento",
        symbol: "🌪️",
        crest: "🦅",
        guardian: "Guardião da Águia"
    },

    fogo: {
        name: "Fogo",
        symbol: "🔥",
        crest: "🐉",
        guardian: "Guardião do Dragão"
    },

    fisico: {
        name: "Físico",
        symbol: "🦣",
        crest: "🦣",
        guardian: "Guardião do Mamute"
    },

    magico: {
        name: "Mágico",
        symbol: "🦉",
        crest: "🦉",
        guardian: "Guardião da Coruja"
    }

};


/* =========================================================
   XP DO PERSONAGEM
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
    15: 1950,
    16: 2100,
    17: 2250,
    18: 2400,
    19: 2550,
    20: 2700,
    21: 2850,
    22: 3000,
    23: 3150,
    24: 3300,
    25: 3450,
    26: 3600,
    27: 3750,
    28: 3900,
    29: 4050,
    30: 0

};


/* =========================================================
   XP DOS BRASÕES
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
   ESTADO INICIAL
========================================================= */

const DEFAULT_CHARACTER = {

    name: "Nome do Personagem",

    race: "Humano",

    class: "Saber",

    element: null,

    image: "",

    level: 1,

    xp: 0,

    crestXp: 0,

    attributePoints: 3,

    stats: {
        hp: 25,
        mp: 15,
        est: 30,
        sanity: 100,

        atk: 4,
        atkMgc: 4,
        def: 8,
        res: 8,
        agi: 8,
        int: 15
    },

    inventoryCapacity: 50,

    inventory: [],

    equipment: {
        weapon: "Vazio",
        armor: "Vazio",
        accessory: "Vazio",
        relic: "Vazio"
    },

    abilities: [

        {
            name: "[EDITÁVEL]",
            type: "MP",
            cost: 0,
            description: ""
        },

        {
            name: "[EDITÁVEL]",
            type: "MP",
            cost: 0,
            description: ""
        },

        {
            name: "[EDITÁVEL]",
            type: "EST",
            cost: 0,
            description: ""
        }

    ],

    passive: {
        name: "[EDITÁVEL]",
        description: ""
    },

    combatLog: []

};


/* =========================================================
   ESTADO ATUAL
========================================================= */

let character = carregarPersonagem();

let selectedElement = null;


/* =========================================================
   LOCAL STORAGE
========================================================= */

function carregarPersonagem() {

    const salvo = localStorage.getItem(
        "rpgCharacterCard"
    );

    if (!salvo) {

        return structuredClone(DEFAULT_CHARACTER);

    }

    try {

        const dados = JSON.parse(salvo);

        return {

            ...structuredClone(DEFAULT_CHARACTER),

            ...dados,

            stats: {
                ...DEFAULT_CHARACTER.stats,
                ...(dados.stats || {})
            },

            equipment: {
                ...DEFAULT_CHARACTER.equipment,
                ...(dados.equipment || {})
            },

            abilities:
                Array.isArray(dados.abilities)
                    ? dados.abilities
                    : structuredClone(DEFAULT_CHARACTER.abilities),

            passive:
                dados.passive || structuredClone(DEFAULT_CHARACTER.passive),

            inventory:
                Array.isArray(dados.inventory)
                    ? dados.inventory
                    : []

        };

    } catch {

        return structuredClone(DEFAULT_CHARACTER);

    }

}


function salvarPersonagem() {

    localStorage.setItem(
        "rpgCharacterCard",
        JSON.stringify(character)
    );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);


function iniciar() {

    configurarNavegacao();

    configurarModoMestre();

    configurarEditor();

    configurarAtributos();

    configurarElementos();

    configurarCombate();

    atualizarTudo();

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function configurarNavegacao() {

    const buttons =
        document.querySelectorAll(
            ".dimension-button"
        );

    const dimensions =
        document.querySelectorAll(
            ".card-dimension"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const dimension =
                    button.dataset.dimension;

                buttons.forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });

                dimensions.forEach(section => {

                    section.classList.remove(
                        "active"
                    );

                });

                button.classList.add(
                    "active"
                );

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
   ATUALIZAÇÃO GERAL
========================================================= */

function atualizarTudo() {

    atualizarPersonagem();

    atualizarStatus();

    atualizarElementos();

    atualizarBrasao();

    atualizarInventario();

    atualizarCombate();

    atualizarAbilities();

}


/* =========================================================
   PERSONAGEM
========================================================= */

function atualizarPersonagem() {

    const name =
        document.getElementById(
            "character-name"
        );

    const race =
        document.getElementById(
            "character-race"
        );

    const classElement =
        document.getElementById(
            "character-class"
        );

    const level =
        document.getElementById(
            "character-level"
        );

    const affinity =
        document.getElementById(
            "character-affinity"
        );

    const affinitySymbol =
        document.getElementById(
            "character-affinity-symbol"
        );

    const crest =
        document.getElementById(
            "crest-symbol"
        );

    if (name) {

        name.textContent =
            character.name;

    }

    if (race) {

        race.textContent =
            character.race;

    }

    if (classElement) {

        classElement.textContent =
            character.class;

    }

    if (level) {

        level.textContent =
            character.level;

    }

    if (character.element) {

        const element =
            ELEMENTS[
                character.element
            ];

        if (element) {

            if (affinity) {

                affinity.textContent =
                    element.name;

            }

            if (affinitySymbol) {

                affinitySymbol.textContent =
                    element.symbol;

            }

            if (crest) {

                crest.textContent =
                    element.crest;

            }

        }

    } else {

        if (affinity) {

            affinity.textContent =
                "Não escolhida";

        }

        if (affinitySymbol) {

            affinitySymbol.textContent =
                "❔";

        }

        if (crest) {

            crest.textContent =
                "❔";

        }

    }


    atualizarImagem();

    atualizarXP();

}


/* =========================================================
   IMAGEM
========================================================= */

function atualizarImagem() {

    const container =
        document.getElementById(
            "character-art-container"
        );

    if (!container) return;


    if (!character.image) {

        container.innerHTML = `

            <span>
                IMAGEM
            </span>

            <small>
                Nenhuma imagem definida
            </small>

        `;

        return;

    }


    container.innerHTML = `

        <img
            src="${escapeAttribute(character.image)}"
            alt="Imagem do personagem"
            style="
                width:100%;
                height:100%;
                object-fit:cover;
                display:block;
            "
            onerror="
                this.style.display='none';
                this.nextElementSibling.style.display='flex';
            "
        >

        <small
            style="
                display:none;
                align-items:center;
                justify-content:center;
                height:100%;
            "
        >
            Não foi possível carregar a imagem.
        </small>

    `;

}


function configurarEditor() {

    const nameInput =
        document.getElementById(
            "character-name-input"
        );

    const raceSelect =
        document.getElementById(
            "character-race-select"
        );

    const classSelect =
        document.getElementById(
            "character-class-select"
        );

    const imageInput =
        document.getElementById(
            "character-image-url"
        );

    if (nameInput) {

        nameInput.value =
            character.name;

        nameInput.addEventListener(
            "input",
            () => {

                character.name =
                    nameInput.value ||
                    "Nome do Personagem";

                salvarPersonagem();

                atualizarPersonagem();

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

                salvarPersonagem();

                atualizarPersonagem();

            }
        );

    }


    if (imageInput) {

        imageInput.value =
            character.image;

    }


    const applyImage =
        document.getElementById(
            "apply-image-url"
        );

    if (applyImage) {

        applyImage.addEventListener(
            "click",
            () => {

                character.image =
                    imageInput
                        ? imageInput.value.trim()
                        : "";

                salvarPersonagem();

                atualizarImagem();

            }
        );

    }


    const removeImage =
        document.getElementById(
            "remove-image-button"
        );

    if (removeImage) {

        removeImage.addEventListener(
            "click",
            () => {

                character.image = "";

                if (imageInput) {

                    imageInput.value = "";

                }

                salvarPersonagem();

                atualizarImagem();

            }
        );

    }

}


/* =========================================================
   RAÇA
========================================================= */

function alterarRaca(race) {

    if (!RACES[race]) return;

    const oldStats =
        character.stats;

    const newBase =
        RACES[race];

    character.race =
        race;

    character.stats = {

        hp: newBase.hp,
        mp: newBase.mp,
        est: newBase.est,
        sanity: newBase.sanity,

        atk:
            newBase.atk,

        atkMgc:
            newBase.atkMgc,

        def:
            newBase.def,

        res:
            newBase.res,

        agi:
            newBase.agi,

        int:
            newBase.int

    };


    /*
       Mantém o nível e pontos gastos.
       A troca de raça no editor serve para
       configurar a ficha enquanto estamos
       desenvolvendo o sistema.
    */

    character.stats.hp =
        Math.max(
            0,
            Math.min(
                oldStats.hp,
                character.stats.hp
            )
        );


    character.stats.mp =
        Math.max(
            0,
            Math.min(
                oldStats.mp,
                character.stats.mp
            )
        );


    character.stats.est =
        Math.max(
            0,
            Math.min(
                oldStats.est,
                character.stats.est
            )
        );


    salvarPersonagem();

    atualizarTudo();

}


/* =========================================================
   XP
========================================================= */

function atualizarXP() {

    const text =
        document.getElementById(
            "character-xp-text"
        );

    const progress =
        document.getElementById(
            "character-xp-progress"
        );

    if (!text || !progress) return;


    if (character.level >= 30) {

        text.textContent =
            `${character.xp} XP — NÍVEL MÁXIMO`;

        progress.style.width =
            "100%";

        return;

    }


    const needed =
        XP_LEVELS[
            character.level
        ] || 100;

    const percent =
        Math.min(
            100,
            (character.xp / needed) * 100
        );


    text.textContent =
        `${character.xp} / ${needed} XP`;

    progress.style.width =
        `${percent}%`;

}


function adicionarXP(valor) {

    valor =
        Number(valor);

    if (!Number.isFinite(valor) ||
        valor <= 0) {

        return;

    }


    character.xp += valor;

    processarLevelUp();

    salvarPersonagem();

    atualizarTudo();

}


function removerXP(valor) {

    valor =
        Number(valor);

    if (!Number.isFinite(valor) ||
        valor <= 0) {

        return;

    }


    character.xp =
        Math.max(
            0,
            character.xp - valor
        );

    salvarPersonagem();

    atualizarTudo();

}


/* =========================================================
   LEVEL UP
========================================================= */

function processarLevelUp() {

    while (

        character.level < 30 &&

        character.xp >=
        XP_LEVELS[character.level]

    ) {

        character.xp -=
            XP_LEVELS[character.level];

        character.level++;

        /*
           +3 pontos de atributo
           a cada nível, incluindo o sistema
           já iniciado no nível 1.
        */

        character.attributePoints += 3;


        /*
           +1 SANIDADE por nível.
        */

        character.stats.sanity += 1;


        /*
           A cada 3 níveis:
           +5 HP
           +5 MP
           +5 EST
        */

        if (
            character.level % 3 === 0
        ) {

            character.stats.hp += 5;

            character.stats.mp += 5;

            character.stats.est += 5;

        }


        /*
           A cada 10 níveis:
           +50 espaços no inventário.
        */

        if (
            character.level % 10 === 0
        ) {

            character.inventoryCapacity += 50;

        }

    }


    if (character.level >= 30) {

        character.level = 30;

        character.xp = 0;

    }

}


/* =========================================================
   STATUS
========================================================= */

function atualizarStatus() {

    definirTexto(
        "status-hp",
        character.stats.hp
    );

    definirTexto(
        "status-mp",
        character.stats.mp
    );

    definirTexto(
        "status-est",
        character.stats.est
    );

    definirTexto(
        "status-sanity",
        character.stats.sanity
    );

    definirTexto(
        "status-atk",
        character.stats.atk
    );

    definirTexto(
        "status-atk-mgc",
        character.stats.atkMgc
    );

    definirTexto(
        "status-def",
        character.stats.def
    );

    definirTexto(
        "status-res",
        character.stats.res
    );

    definirTexto(
        "status-agi",
        character.stats.agi
    );

    definirTexto(
        "status-int",
        character.stats.int
    );

    definirTexto(
        "available-attribute-points",
        character.attributePoints
    );

}


/* =========================================================
   ATRIBUTOS
========================================================= */

function configurarAtributos() {

    document
        .querySelectorAll(
            ".attribute-plus"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const attribute =
                        button.dataset.attribute;

                    adicionarAtributo(
                        attribute
                    );

                }
            );

        });

}


function adicionarAtributo(attribute) {

    if (
        character.attributePoints <= 0
    ) {

        return;

    }


    if (
        !Object.prototype.hasOwnProperty.call(
            character.stats,
            attribute
        )
    ) {

        return;

    }


    character.stats[attribute]++;

    character.attributePoints--;

    salvarPersonagem();

    atualizarStatus();

}


/* =========================================================
   ELEMENTOS
========================================================= */

function configurarElementos() {

    const options =
        document.querySelectorAll(
            ".element-option"
        );

    const confirmButton =
        document.getElementById(
            "confirm-element"
        );


    /*
       Se já existe uma afinidade salva,
       ela já está confirmada.
    */

    if (character.element) {

        selectedElement =
            character.element;

        bloquearSelecaoElemental();

        atualizarElementos();

        return;

    }


    options.forEach(option => {

        option.addEventListener(
            "click",
            () => {

                /*
                   Não permite alteração
                   depois da confirmação.
                */

                if (character.element) {

                    return;

                }


                options.forEach(item => {

                    item.classList.remove(
                        "selected"
                    );

                });


                option.classList.add(
                    "selected"
                );


                selectedElement =
                    option.dataset.element;


                if (confirmButton) {

                    confirmButton.disabled =
                        false;

                }

                aplicarPreviaElemento(
                    selectedElement
                );

            }
        );

    });


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            confirmarElemento
        );

    }

}


/* =========================================================
   PRÉ-VISUALIZAÇÃO DO ELEMENTO
========================================================= */

function aplicarPreviaElemento(elementKey) {

    const element =
        ELEMENTS[elementKey];

    if (!element) return;


    const card =
        document.getElementById(
            "character-card"
        );

    if (!card) return;


    card.dataset.previewElement =
        elementKey;


    /*
       Efeito visual simples.
       O CSS pode usar:
       [data-preview-element="fogo"]
       etc.
    */

    card.classList.forEach(className => {

        if (
            className.startsWith(
                "element-"
            )
        ) {

            card.classList.remove(
                className
            );

        }

    });


    card.classList.add(
        `element-${elementKey}`
    );

}


/* =========================================================
   CONFIRMAR ELEMENTO
========================================================= */

function confirmarElemento() {

    /*
       Proteção contra clique sem seleção.
    */

    if (!selectedElement) {

        return;

    }


    /*
       Proteção contra tentativa de trocar
       uma afinidade já confirmada.
    */

    if (character.element) {

        return;

    }


    if (
        !ELEMENTS[selectedElement]
    ) {

        return;

    }


    character.element =
        selectedElement;


    /*
       A afinidade agora é permanente.
    */

    salvarPersonagem();


    bloquearSelecaoElemental();

    atualizarPersonagem();

    atualizarElementos();

}


/* =========================================================
   BLOQUEAR ELEMENTOS
========================================================= */

function bloquearSelecaoElemental() {

    const options =
        document.querySelectorAll(
            ".element-option"
        );

    const confirmButton =
        document.getElementById(
            "confirm-element"
        );


    options.forEach(option => {

        option.disabled = true;

        option.classList.remove(
            "selected"
        );

        if (
            option.dataset.element ===
            character.element
        ) {

            option.classList.add(
                "selected"
            );

        }

    });


    if (confirmButton) {

        confirmButton.disabled =
            true;

        confirmButton.textContent =
            "AFINIDADE CONFIRMADA";

    }

}


/* =========================================================
   ATUALIZAR ELEMENTOS
========================================================= */

function atualizarElementos() {

    const options =
        document.querySelectorAll(
            ".element-option"
        );


    if (character.element) {

        options.forEach(option => {

            option.disabled = true;

            option.classList.remove(
                "selected"
            );

            if (
                option.dataset.element ===
                character.element
            ) {

                option.classList.add(
                    "selected"
                );

            }

        });

        aplicarPreviaElemento(
            character.element
        );

    }

}


/* =========================================================
   BRASÃO
========================================================= */

function atualizarBrasao() {

    const stageElement =
        document.getElementById(
            "crest-stage"
        );

    const xpElement =
        document.getElementById(
            "crest-xp"
        );

    const progress =
        document.getElementById(
            "crest-xp-progress"
        );


    let currentStage =
        CREST_STAGES[0];

    let nextStage =
        null;


    for (
        let i = 0;
        i < CREST_STAGES.length;
        i++
    ) {

        if (
            character.crestXp >=
            CREST_STAGES[i].xp
        ) {

            currentStage =
                CREST_STAGES[i];

        }

    }


    const currentIndex =
        CREST_STAGES.indexOf(
            currentStage
        );


    if (
        currentIndex <
        CREST_STAGES.length - 1
    ) {

        nextStage =
            CREST_STAGES[
                currentIndex + 1
            ];

    }


    if (stageElement) {

        stageElement.textContent =
            currentStage.name;

    }


    if (xpElement) {

        xpElement.textContent =
            character.crestXp;

    }


    if (progress) {

        let percent = 100;


        if (nextStage) {

            const previousXP =
                currentStage.xp;

            const nextXP =
                nextStage.xp;

            percent =
                (
                    (
                        character.crestXp -
                        previousXP
                    ) /
                    (
                        nextXP -
                        previousXP
                    )
                ) * 100;

        }


        progress.style.width =
            `${Math.max(
                0,
                Math.min(
                    100,
                    percent
                )
            )}%`;

    }

}


/* =========================================================
   XP DO BRASÃO
========================================================= */

function adicionarXPDoBrasao(valor) {

    valor =
        Number(valor);

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        return;

    }


    const oldXP =
        character.crestXp;


    character.crestXp +=
        valor;


    atualizarMarcosBrasao(
        oldXP,
        character.crestXp
    );


    salvarPersonagem();

    atualizarBrasao();

}


function removerXPDoBrasao(valor) {

    valor =
        Number(valor);

    if (
        !Number.isFinite(valor) ||
        valor <= 0
    ) {

        return;

    }


    character.crestXp =
        Math.max(
            0,
            character.crestXp - valor
        );


    salvarPersonagem();

    atualizarBrasao();

}


/* =========================================================
   MARCOS DO BRASÃO
========================================================= */

function atualizarMarcosBrasao(
    oldXP,
    newXP
) {

    /*
       A cada marco de 5 níveis do
       personagem, o brasão recebe
       500 XP.

       Isso é calculado apenas quando
       o XP atravessa o marco.
    */

    const oldLevel =
        calcularNivelPorXPTotal(
            oldXP
        );

    const newLevel =
        calcularNivelPorXPTotal(
            newXP
        );


    const oldMilestones =
        Math.floor(
            oldLevel / 5
        );

    const newMilestones =
        Math.floor(
            newLevel / 5
        );


    if (
        newMilestones >
        oldMilestones
    ) {

        const gained =
            (
                newMilestones -
                oldMilestones
            ) * 500;


        character.crestXp +=
            gained;

    }

}


function calcularNivelPorXPTotal(xp) {

    let level = 1;

    let remainingXP =
        Number(xp) || 0;


    while (
        level < 30 &&
        remainingXP >=
        XP_LEVELS[level]
    ) {

        remainingXP -=
            XP_LEVELS[level];

        level++;

    }


    return level;

}


/* =========================================================
   MODO MESTRE
========================================================= */

function configurarModoMestre() {

    const button =
        document.getElementById(
            "master-button"
        );

    const controls =
        document.getElementById(
            "master-controls"
        );


    if (button && controls) {

        button.addEventListener(
            "click",
            () => {

                controls.classList.toggle(
                    "active"
                );

            }
        );

    }


    const addXP =
        document.getElementById(
            "add-xp"
        );

    const removeXP =
        document.getElementById(
            "remove-xp"
        );

    const xpInput =
        document.getElementById(
            "xp-amount"
        );


    if (addXP) {

        addXP.addEventListener(
            "click",
            () => {

                adicionarXP(
                    xpInput
                        ? xpInput.value
                        : 0
                );

            }
        );

    }


    if (removeXP) {

        removeXP.addEventListener(
            "click",
            () => {

                removerXP(
                    xpInput
                        ? xpInput.value
                        : 0
                );

            }
        );

    }


    const addCrestXP =
        document.getElementById(
            "add-crest-xp"
        );

    const removeCrestXP =
        document.getElementById(
            "remove-crest-xp"
        );

    const crestXPInput =
        document.getElementById(
            "crest-xp-amount"
        );


    if (addCrestXP) {

        addCrestXP.addEventListener(
            "click",
            () => {

                adicionarXPDoBrasao(
                    crestXPInput
                        ? crestXPInput.value
                        : 0
                );

            }
        );

    }


    if (removeCrestXP) {

        removeCrestXP.addEventListener(
            "click",
            () => {

                removerXPDoBrasao(
                    crestXPInput
                        ? crestXPInput.value
                        : 0
                );

            }
        );

    }


    const reset =
        document.getElementById(
            "reset-character"
        );


    if (reset) {

        reset.addEventListener(
            "click",
            resetarPersonagem
        );

    }

}


/* =========================================================
   RESET
========================================================= */

function resetarPersonagem() {

    const confirmar =
        window.confirm(
            "Deseja realmente resetar o personagem?"
        );


    if (!confirmar) {

        return;

    }


    character =
        structuredClone(
            DEFAULT_CHARACTER
        );


    selectedElement =
        null;


    localStorage.removeItem(
        "rpgCharacterCard"
    );


    const card =
        document.getElementById(
            "character-card"
        );


    if (card) {

        delete card.dataset.previewElement;

        card.classList.forEach(className => {

            if (
                className.startsWith(
                    "element-"
                )
            ) {

                card.classList.remove(
                    className
                );

            }

        });

    }


    const confirmButton =
        document.getElementById(
            "confirm-element"
        );


    if (confirmButton) {

        confirmButton.disabled =
            true;

        confirmButton.textContent =
            "CONFIRMAR AFINIDADE";

    }


    const imageInput =
        document.getElementById(
            "character-image-url"
        );

    if (imageInput) {

        imageInput.value = "";

    }


    document
        .querySelectorAll(
            ".element-option"
        )
        .forEach(option => {

            option.disabled = false;

            option.classList.remove(
                "selected"
            );

        });


    atualizarTudo();

}


/* =========================================================
   COMBATE
========================================================= */

function configurarCombate() {

    document
        .querySelectorAll(
            ".combat-use-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    executarAcao(
                        button
                    );

                }
            );

        });

}


/* =========================================================
   EXECUTAR AÇÃO
========================================================= */

function executarAcao(button) {

    const action =
        button.dataset.action;


    if (
        action ===
        "basic-attack"
    ) {

        usarAtaqueBasico();

        return;

    }


    if (
        action ===
        "counterattack"
    ) {

        usarContraAtaque();

        return;

    }


    /*
       Habilidades configuráveis
    */

    const abilityCard =
        button.closest(
            ".ability-card"
        );


    if (!abilityCard) return;


    const costType =
        (
            abilityCard.dataset.costType ||
            "mp"
        ).toLowerCase();


    const cost =
        Number(
            abilityCard.dataset.cost
        ) || 0;


    const nameElement =
        abilityCard.querySelector(
            "strong"
        );


    const name =
        nameElement
            ? nameElement.textContent.trim()
            : "[EDITÁVEL]";


    usarHabilidade(
        name,
        costType,
        cost
    );

}


/* =========================================================
   ATAQUE BÁSICO
   SEMPRE -1 EST
========================================================= */

function usarAtaqueBasico() {

    if (
        character.stats.est < 1
    ) {

        registrarCombate(
            "Ataque básico falhou: EST insuficiente."
        );

        return;

    }


    character.stats.est -= 1;


    registrarCombate(
        "⚔️ Ataque básico usado. −1 EST."
    );


    salvarPersonagem();

    atualizarCombate();

    atualizarStatus();

}


/* =========================================================
   CONTRA-ATAQUE
   SEMPRE -3 EST
========================================================= */

function usarContraAtaque() {

    if (
        character.stats.est < 3
    ) {

        registrarCombate(
            "Contra-ataque falhou: EST insuficiente."
        );

        return;

    }


    character.stats.est -= 3;


    registrarCombate(
        "↩️ Contra-ataque usado. −3 EST."
    );


    salvarPersonagem();

    atualizarCombate();

    atualizarStatus();

}


/* =========================================================
   HABILIDADE
========================================================= */

function usarHabilidade(
    name,
    costType,
    cost
) {

    if (cost <= 0) {

        registrarCombate(
            `${name} não possui custo definido.`
        );

        return;

    }


    if (
        costType === "mp"
    ) {

        if (
            character.stats.mp < cost
        ) {

            registrarCombate(
                `${name} falhou: MP insuficiente.`
            );

            return;

        }


        character.stats.mp -=
            cost;


        registrarCombate(
            `✨ ${name} usado. −${cost} MP.`
        );

    }


    else if (
        costType === "est"
    ) {

        if (
            character.stats.est < cost
        ) {

            registrarCombate(
                `${name} falhou: EST insuficiente.`
            );

            return;

        }


        character.stats.est -=
            cost;


        registrarCombate(
            `⚡ ${name} usado. −${cost} EST.`
        );

    }


    salvarPersonagem();

    atualizarCombate();

    atualizarStatus();

}


/* =========================================================
   HISTÓRICO
========================================================= */

function registrarCombate(message) {

    character.combatLog.unshift(
        message
    );


    if (
        character.combatLog.length > 20
    ) {

        character.combatLog =
            character.combatLog.slice(
                0,
                20
            );

    }


    atualizarLogCombate();

}


function atualizarLogCombate() {

    const log =
        document.getElementById(
            "combat-log"
        );


    if (!log) return;


    if (
        character.combatLog.length === 0
    ) {

        log.innerHTML = `
            <p>
                Nenhuma ação realizada.
            </p>
        `;

        return;

    }


    log.innerHTML =
        character.combatLog
            .map(
                item =>
                    `<p>${escapeHTML(item)}</p>`
            )
            .join("");

}


/* =========================================================
   RECURSOS DO COMBATE
========================================================= */

function atualizarCombate() {

    definirTexto(
        "combat-mp",
        character.stats.mp
    );

    definirTexto(
        "combat-est",
        character.stats.est
    );

    atualizarLogCombate();

}


/* =========================================================
   HABILIDADES
========================================================= */

function atualizarAbilities() {

    const cards =
        document.querySelectorAll(
            ".ability-card"
        );


    cards.forEach(
        (card, index) => {

            const ability =
                character.abilities[index];


            if (!ability) return;


            const name =
                card.querySelector(
                    "strong"
                );

            const cost =
                card.querySelector(
                    "small"
                );


            if (name) {

                name.textContent =
                    ability.name ||
                    "[EDITÁVEL]";

            }


            if (cost) {

                const type =
                    (
                        ability.type ||
                        "MP"
                    ).toUpperCase();


                const value =
                    Number(
                        ability.cost
                    ) || 0;


                cost.textContent =
                    `Custo: ${value} ${type}`;

            }


            card.dataset.costType =
                (
                    ability.type ||
                    "MP"
                ).toLowerCase();


            card.dataset.cost =
                Number(
                    ability.cost
                ) || 0;

        }
    );

}


/* =========================================================
   INVENTÁRIO
========================================================= */

function atualizarInventario() {

    const capacity =
        document.getElementById(
            "inventory-capacity"
        );

    const list =
        document.getElementById(
            "inventory-list"
        );

    const slots =
        document.getElementById(
            "inventory-slots"
        );


    if (capacity) {

        capacity.textContent =
            `${character.inventory.length} / ${character.inventoryCapacity}`;

    }


    if (list) {

        if (
            character.inventory.length === 0
        ) {

            list.innerHTML = `
                <div class="inventory-empty">
                    Nenhum item no inventário.
                </div>
            `;

        } else {

            list.innerHTML =
                character.inventory
                    .map(
                        item =>
                            `<div class="inventory-item">
                                ${escapeHTML(item)}
                            </div>`
                    )
                    .join("");

        }

    }


    if (slots) {

        slots.innerHTML = "";

        for (
            let i = 0;
            i < character.inventoryCapacity;
            i++
        ) {

            const slot =
                document.createElement(
                    "div"
                );

            slot.className =
                "inventory-slot";


            if (
                character.inventory[i]
            ) {

                slot.classList.add(
                    "occupied"
                );

            }


            slots.appendChild(
                slot
            );

        }

    }


    definirTexto(
        "equipment-weapon",
        character.equipment.weapon
    );

    definirTexto(
        "equipment-armor",
        character.equipment.armor
    );

    definirTexto(
        "equipment-accessory",
        character.equipment.accessory
    );

    definirTexto(
        "equipment-relic",
        character.equipment.relic
    );

}


/* =========================================================
   UTILITÁRIOS
========================================================= */

function definirTexto(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}
