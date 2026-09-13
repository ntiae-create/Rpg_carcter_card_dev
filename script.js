/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: SISTEMA PRINCIPAL / ORQUESTRADOR
========================================================= */


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const STORAGE_KEY = "rpg_character_card";


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

    const race =
        CharacterModule.RACES["Humano"];


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

let character =
    carregarPersonagem();


function carregarPersonagem() {

    const saved =
        localStorage.getItem(
            STORAGE_KEY
        );


    if (!saved) {

        return criarEstadoInicial();

    }


    try {

        const data =
            JSON.parse(saved);


        const base =
            criarEstadoInicial();


        return mesclarObjetos(
            base,
            data
        );

    }

    catch (error) {

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

function mesclarObjetos(
    base,
    extra
) {

    for (
        const key in extra
    ) {

        if (
            extra[key] &&
            typeof extra[key] === "object" &&
            !Array.isArray(extra[key])
        ) {

            base[key] =
                mesclarObjetos(
                    base[key] || {},
                    extra[key]
                );

        }

        else {

            base[key] =
                extra[key];

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

        if (
            button.dataset.navigationConfigured ===
            "true"
        ) {

            return;

        }


        button.dataset.navigationConfigured =
            "true";


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


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
   MODO MESTRE
========================================================= */

function configurarModoMestre() {

    const button =
        get("master-button");


    const controls =
        get("master-controls");


    if (
        !button ||
        !controls
    ) {

        return;

    }


    if (
        button.dataset.masterConfigured ===
        "true"
    ) {

        return;

    }


    button.dataset.masterConfigured =
        "true";


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
   XP DO PERSONAGEM
========================================================= */

function adicionarXP(valor) {

    CharacterModule.adicionarXP(
        valor
    );

}


function removerXP(valor) {

    CharacterModule.removerXP(
        valor
    );

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

        if (
            add.dataset.xpConfigured !==
            "true"
        ) {

            add.dataset.xpConfigured =
                "true";


            add.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    adicionarXP(
                        amount
                            ? amount.value
                            : 0
                    );

                }
            );

        }

    }


    if (remove) {

        if (
            remove.dataset.xpConfigured !==
            "true"
        ) {

            remove.dataset.xpConfigured =
                "true";


            remove.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removerXP(
                        amount
                            ? amount.value
                            : 0
                    );

                }
            );

        }

    }


    const crestAmount =
        get("crest-xp-amount");


    const addCrest =
        get("add-crest-xp");


    const removeCrest =
        get("remove-crest-xp");


    if (addCrest) {

        if (
            addCrest.dataset.crestXPConfigured !==
            "true"
        ) {

            addCrest.dataset.crestXPConfigured =
                "true";


            addCrest.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    adicionarXPDoBrasao(
                        crestAmount
                            ? crestAmount.value
                            : 0
                    );

                }
            );

        }

    }


    if (removeCrest) {

        if (
            removeCrest.dataset.crestXPConfigured !==
            "true"
        ) {

            removeCrest.dataset.crestXPConfigured =
                "true";


            removeCrest.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    removerXPDoBrasao(
                        crestAmount
                            ? crestAmount.value
                            : 0
                    );

                }
            );

        }

    }

}


/* =========================================================
   XP DO BRASÃO
========================================================= */

function adicionarXPDoBrasao(
    valor
) {

    valor =
        limitarNumero(
            valor,
            0
        );


    character.crestXP +=
        valor;


    atualizarInterface();

    salvarPersonagem();

}


function removerXPDoBrasao(
    valor
) {

    valor =
        limitarNumero(
            valor,
            0
        );


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
        marcoDepois >
        marcoAntes
    ) {

        const diferenca =
            marcoDepois -
            marcoAntes;


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


    if (
        button.dataset.resetConfigured ===
        "true"
    ) {

        return;

    }


    button.dataset.resetConfigured =
        "true";


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            const confirmar =
                window.confirm(
                    "Deseja realmente resetar o personagem?"
                );


            if (!confirmar) {

                return;

            }


            character =
                criarEstadoInicial();


            salvarPersonagem();


            atualizarInterface();


            StatusModule.iniciar();

            CharacterModule.atualizarImagem();


            if (
                typeof CombatModule !==
                "undefined"
            ) {

                CombatModule.iniciar();

            }


            if (
                typeof InventoryModule !==
                "undefined"
            ) {

                InventoryModule.iniciar();

            }

        }
    );

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


    let nextStage = null;


    for (
        const current of CREST_STAGES
    ) {

        if (
            current.xp >
            character.crestXP
        ) {

            nextStage =
                current;


            break;

        }

    }


    if (progress) {

        if (!nextStage) {

            progress.style.width =
                "100%";

        }

        else {

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
                        (
                            current /
                            total
                        ) * 100
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

    /* =====================================================
       PERSONAGEM
    ===================================================== */

    const name =
        get("character-name");


    if (name) {

        name.textContent =
            character.name;

    }


    const race =
        get("character-race");


    if (race) {

        race.textContent =
            character.race;

    }


    const classElement =
        get("character-class");


    if (classElement) {

        classElement.textContent =
            character.class;

    }


    const level =
        get("character-level");


    if (level) {

        level.textContent =
            `LV. ${character.level}`;

    }


    /* =====================================================
       XP DO PERSONAGEM
    ===================================================== */

    const xpText =
        get("character-xp-text");


    const xpProgress =
        get("character-xp-progress");


    const xpNeeded =
        CharacterModule.obterXPNecessario(
            character.level
        );


    if (xpText) {

        if (
            character.level >= 30
        ) {

            xpText.textContent =
                "NÍVEL MÁXIMO";

        }

        else {

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


    /* =====================================================
       BRASÃO
    ===================================================== */

    atualizarBrasao();


    /* =====================================================
       STATUS
    ===================================================== */

    StatusModule.atualizarStatus();


    /* =====================================================
       COMBATE
    ===================================================== */

    if (
        typeof CombatModule !==
        "undefined"
    ) {

        CombatModule.atualizar();

    }


    /* =====================================================
       INVENTÁRIO
    ===================================================== */

    if (
        typeof InventoryModule !==
        "undefined"
    ) {

        InventoryModule.atualizar();

    }


    /* =====================================================
       IMAGEM
    ===================================================== */

    CharacterModule.atualizarImagem();


    /* =====================================================
       EDITOR DO PERSONAGEM
    ===================================================== */

    CharacterModule.sincronizarEditor();


    /* =====================================================
       EFEITO ELEMENTAL
    ===================================================== */

    StatusModule.aplicarEfeitoElemental();


    /* =====================================================
       ESTADO VISUAL DOS ELEMENTOS
    ===================================================== */

    StatusModule.configurarEstadoElementos();

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
   INICIALIZAÇÃO
========================================================= */

function iniciar() {

    /*
       Ordem importante:

       1. Navegação
       2. Modo Mestre
       3. Editor do personagem
       4. Status
       5. XP
       6. Reset
       7. Combate
       8. Inventário
       9. Interface
    */


    configurarNavegacao();


    configurarModoMestre();


    CharacterModule.configurarEditor();


    StatusModule.iniciar();


    configurarXP();


    configurarReset();


    if (
        typeof CombatModule !==
        "undefined"
    ) {

        CombatModule.iniciar();

    }


    if (
        typeof InventoryModule !==
        "undefined"
    ) {

        InventoryModule.iniciar();

    }


    atualizarInterface();

}


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);
