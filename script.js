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

        confirmed: false,

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
   CONFIRMAÇÃO DO PERSONAGEM
========================================================= */

function configurarConfirmacaoPersonagem() {

    const existente =
        get("character-confirmation-panel");


    if (existente) {

        atualizarInterfaceConfirmacao();

        return;

    }


    const editor =
        document.querySelector(
            ".character-editor"
        );


    if (!editor) {

        setTimeout(
            configurarConfirmacaoPersonagem,
            500
        );

        return;

    }


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "character-confirmation-panel";


    Object.assign(
        panel.style,
        {
            marginTop: "18px",
            padding: "15px",
            borderRadius: "14px",
            border: "1px solid #6f3aa8",
            background: "rgba(124, 58, 237, 0.07)",
            textAlign: "center"
        }
    );


    editor.insertAdjacentElement(
        "afterend",
        panel
    );


    atualizarInterfaceConfirmacao();

}


/* =========================================================
   ATUALIZAR CONFIRMAÇÃO
========================================================= */

function atualizarInterfaceConfirmacao() {

    const panel =
        get(
            "character-confirmation-panel"
        );


    if (!panel) {

        return;

    }


    if (
        character.confirmed === true
    ) {

        panel.innerHTML = `

            <div
                style="
                    color:#86efac;
                    font-weight:bold;
                    font-size:14px;
                    letter-spacing:1px;
                "
            >
                ✓ PERSONAGEM CONFIRMADO
            </div>

            <div
                style="
                    margin-top:7px;
                    color:#8f839d;
                    font-size:10px;
                    line-height:1.5;
                "
            >
                Nome, raça, classe e afinidade estão bloqueados.
            </div>

        `;

        return;

    }


    panel.innerHTML = `

        <div
            style="
                color:#c084fc;
                font-weight:bold;
                font-size:12px;
                letter-spacing:1px;
                margin-bottom:7px;
            "
        >
            PERSONAGEM AINDA NÃO CONFIRMADO
        </div>

        <div
            style="
                color:#8f839d;
                font-size:10px;
                line-height:1.5;
                margin-bottom:12px;
            "
        >
            Confira nome, raça, classe e afinidade
            antes de confirmar.
        </div>

        <button
            id="confirm-character-button"
            type="button"
            style="
                width:100%;
                padding:12px;
                border:1px solid #8b5cf6;
                border-radius:11px;
                background:#1b1424;
                color:#e9d5ff;
                font-weight:bold;
                cursor:pointer;
                font-size:12px;
                letter-spacing:1px;
            "
        >
            ✓ CONFIRMAR PERSONAGEM
        </button>

    `;


    const button =
        get(
            "confirm-character-button"
        );


    if (button) {

        button.addEventListener(
            "click",
            confirmarPersonagem
        );

    }

}


/* =========================================================
   APLICAR BLOQUEIO DAS DEFINIÇÕES
========================================================= */

function aplicarBloqueioDefinicoes() {

    if (
        typeof CharacterModule ===
        "undefined"
    ) {

        return;

    }


    if (
        typeof CharacterModule.atualizarBloqueioDefinicoes ===
        "function"
    ) {

        CharacterModule.atualizarBloqueioDefinicoes();

    }

}


/* =========================================================
   IR PARA A MESA
========================================================= */

function irParaMesa() {

    /*
       A Mesa é criada pelo mesa.js.
       Como os scripts são carregados separadamente,
       pode haver alguns instantes de espera.
    */

    let tentativas = 0;

    const limite = 40;


    const procurarMesa =
        setInterval(
            function () {

                tentativas++;


                const mesa =
                    get(
                        "online-table-panel"
                    );


                if (mesa) {

                    clearInterval(
                        procurarMesa
                    );


                    /*
                       Garante que a Mesa fique
                       visível para o jogador.
                    */

                    mesa.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });


                    /*
                       Pequeno destaque visual
                       para deixar claro que o
                       jogador foi enviado para a Mesa.
                    */

                    mesa.classList.add(
                        "rpg-table-arrived"
                    );


                    setTimeout(
                        function () {

                            mesa.classList.remove(
                                "rpg-table-arrived"
                            );

                        },
                        1200
                    );


                    return;

                }


                if (
                    tentativas >= limite
                ) {

                    clearInterval(
                        procurarMesa
                    );


                    console.warn(
                        "⚠️ Mesa ainda não foi encontrada."
                    );


                    return;

                }

            },
            250
        );

}


/* =========================================================
   CONFIRMAR PERSONAGEM
========================================================= */

function confirmarPersonagem() {

    if (
        character.confirmed === true
    ) {

        return;

    }


    const confirmar =
        window.confirm(
            "Deseja confirmar este personagem?\n\nDepois da confirmação, Nome, Raça, Classe e Afinidade não poderão mais ser alterados."
        );


    if (!confirmar) {

        return;

    }


    /*
       Marca o personagem como confirmado.
    */

    character.confirmed =
        true;


    /*
       Salva imediatamente.
    */

    salvarPersonagem();


    /*
       Bloqueia os campos.
    */

    aplicarBloqueioDefinicoes();


    /*
       Atualiza a interface.
    */

    atualizarInterface();


    atualizarInterfaceConfirmacao();


    /*
       Garante novamente o bloqueio.
    */

    aplicarBloqueioDefinicoes();


    /*
       Mensagem visual.
    */

    if (
        typeof mostrarResultadoSupabase ===
        "function"
    ) {

        mostrarResultadoSupabase(
            "✓ PERSONAGEM CONFIRMADO — ENVIANDO PARA A MESA...",
            "sucesso"
        );

    }


    /*
       =====================================================
       PASSO 3
       ENVIAR AUTOMATICAMENTE PARA A MESA
       =====================================================
    */

    setTimeout(
        irParaMesa,
        350
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


            atualizarInterfaceConfirmacao();


            aplicarBloqueioDefinicoes();


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
   TESTE DE LEITURA DO SUPABASE
========================================================= */

async function testarLeituraPersonagemSupabase() {

    mostrarResultadoSupabase(
        "🔎 Testando conexão com o Supabase...",
        "info"
    );


    console.log(
        "========== TESTE SUPABASE =========="
    );


    if (
        !window.supabaseClient
    ) {

        console.error(
            "❌ window.supabaseClient não existe."
        );


        mostrarResultadoSupabase(
            "❌ Supabase não foi inicializado.",
            "erro"
        );


        return;

    }


    console.log(
        "✅ supabaseClient encontrado."
    );


    if (
        !window.rpgAuth
    ) {

        console.error(
            "❌ window.rpgAuth não existe."
        );


        mostrarResultadoSupabase(
            "❌ Sistema de autenticação ainda não foi carregado.",
            "erro"
        );


        return;

    }


    console.log(
        "rpgAuth:",
        window.rpgAuth
    );


    if (
        !window.rpgAuth.user
    ) {

        console.warn(
            "⚠️ rpgAuth existe, mas nenhum usuário foi encontrado."
        );


        mostrarResultadoSupabase(
            "⚠️ Usuário não encontrado na sessão do Supabase.",
            "aviso"
        );


        return;

    }


    console.log(
        "✅ Usuário encontrado:",
        window.rpgAuth.user.id
    );


    if (
        !window.rpgAuth.campaign
    ) {

        console.warn(
            "⚠️ Usuário encontrado, mas campanha não foi encontrada."
        );


        mostrarResultadoSupabase(
            "⚠️ Usuário autenticado, mas nenhuma campanha foi encontrada.",
            "aviso"
        );


        return;

    }


    console.log(
        "✅ Campanha encontrada:",
        window.rpgAuth.campaign
    );


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("characters")
                .select(
                    "id, name, race, class, affinity, level, xp, crest_xp, attribute_points, sanity, hp, mp, est"
                )
                .eq(
                    "campaign_id",
                    window.rpgAuth.campaign.id
                )
                .eq(
                    "user_id",
                    window.rpgAuth.user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "❌ Erro retornado pelo Supabase:",
                error
            );


            mostrarResultadoSupabase(
                `❌ Supabase respondeu com erro: ${error.message}`,
                "erro"
            );


            return;

        }


        if (!data) {

            console.warn(
                "⚠️ Consulta funcionou, mas nenhum personagem foi encontrado."
            );


            mostrarResultadoSupabase(
                "⚠️ Conexão funcionando, mas nenhum personagem foi encontrado para esta conta/campanha.",
                "aviso"
            );


            return;

        }


        console.log(
            "✅ PERSONAGEM ENCONTRADO:",
            data
        );


        mostrarResultadoSupabase(
            `✅ SUPABASE OK — ${data.name} | LV. ${data.level}`,
            "sucesso"
        );


    }

    catch (error) {

        console.error(
            "❌ Falha inesperada:",
            error
        );


        mostrarResultadoSupabase(
            "❌ Falha inesperada ao consultar o Supabase.",
            "erro"
        );

    }

}


/* =========================================================
   RESULTADO VISUAL DO TESTE
========================================================= */

function mostrarResultadoSupabase(
    texto,
    tipo = "info"
) {

    const existente =
        get("supabase-test-result");


    if (existente) {

        existente.textContent =
            texto;


        if (
            tipo === "sucesso"
        ) {

            existente.style.color =
                "#86efac";

        }

        else if (
            tipo === "erro"
        ) {

            existente.style.color =
                "#fca5a5";

        }

        else if (
            tipo === "aviso"
        ) {

            existente.style.color =
                "#fde68a";

        }

        else {

            existente.style.color =
                "#c4b5fd";

        }


        return;

    }


    const mensagem =
        document.createElement(
            "div"
        );


    mensagem.id =
        "supabase-test-result";


    mensagem.textContent =
        texto;


    Object.assign(
        mensagem.style,
        {
            position: "fixed",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "9998",
            width: "min(92vw, 500px)",
            padding: "12px 15px",
            borderRadius: "12px",
            background: "rgba(11, 9, 16, 0.97)",
            border: "1px solid #6f3aa8",
            boxShadow: "0 0 20px rgba(124, 58, 237, 0.25)",
            textAlign: "center",
            fontFamily: "Arial, sans-serif",
            fontSize: "12px",
            color: "#c4b5fd"
        }
    );


    document.body.appendChild(
        mensagem
    );

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
       BLOQUEIO DAS DEFINIÇÕES
    ===================================================== */

    aplicarBloqueioDefinicoes();


    /* =====================================================
       CONFIRMAÇÃO
    ===================================================== */

    atualizarInterfaceConfirmacao();


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

    configurarNavegacao();


    configurarModoMestre();


    CharacterModule.configurarEditor();


    configurarConfirmacaoPersonagem();


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


    console.log(
        "🚀 Sistema iniciado. Aguardando autenticação..."
    );


    let tentativas =
        0;


    const verificarSupabase =
        setInterval(
            () => {

                tentativas++;


                console.log(
                    `🔎 Verificação Supabase ${tentativas}/60`,
                    {
                        supabase:
                            !!window.supabaseClient,

                        rpgAuth:
                            !!window.rpgAuth,

                        user:
                            !!(
                                window.rpgAuth &&
                                window.rpgAuth.user
                            ),

                        campaign:
                            !!(
                                window.rpgAuth &&
                                window.rpgAuth.campaign
                            )
                    }
                );


                if (
                    window.supabaseClient &&
                    window.rpgAuth &&
                    window.rpgAuth.user &&
                    window.rpgAuth.campaign
                ) {

                    clearInterval(
                        verificarSupabase
                    );


                    testarLeituraPersonagemSupabase();


                    return;

                }


                if (
                    tentativas === 10
                ) {

                    if (
                        !window.supabaseClient
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Supabase ainda não foi inicializado.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth
                    ) {

                        mostrarResultadoSupabase(
                            "⏳ Supabase carregado. Aguardando sistema de autenticação...",
                            "info"
                        );

                    }

                    else if (
                        !window.rpgAuth.user
                    ) {

                        mostrarResultadoSupabase(
                            "⏳ Aguardando usuário autenticado...",
                            "info"
                        );

                    }

                    else if (
                        !window.rpgAuth.campaign
                    ) {

                        mostrarResultadoSupabase(
                            "⏳ Usuário encontrado. Aguardando campanha...",
                            "info"
                        );

                    }

                }


                if (
                    tentativas >= 60
                ) {

                    clearInterval(
                        verificarSupabase
                    );


                    console.error(
                        "❌ Diagnóstico Supabase encerrado após 15 segundos."
                    );


                    if (
                        !window.supabaseClient
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: Supabase não foi carregado.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: auth.js não criou window.rpgAuth.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth.user
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: usuário não está disponível na sessão.",
                            "erro"
                        );

                    }

                    else if (
                        !window.rpgAuth.campaign
                    ) {

                        mostrarResultadoSupabase(
                            "❌ Diagnóstico: usuário existe, mas a campanha não foi carregada.",
                            "erro"
                        );

                    }

                }

            },
            250
        );

}


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);
