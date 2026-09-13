/* =========================================================
   RPG CHARACTER CARD
   SISTEMA PRINCIPAL
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    const STORAGE_KEY = "rpg_character_card_dev_v3";
    const MAX_LEVEL = 30;

    const RACES = {
        Humano: {
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

        Elfo: {
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

        Besta: {
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

    const LOCKED_RACES = [
        "Vampiro",
        "Lizard",
        "Dragonoide",
        "Aqua",
        "Morto-vivo",
        "Demônio",
        "Divino",
        "Dríade",
        "Lupino",
        "Doppelganger"
    ];

    const AFFINITIES = {
        Agua: {
            name: "Água",
            icon: "💧",
            color: "#38bdf8",
            crest: "🐺",
            guardian: "Guardião do Lobo"
        },

        Luz: {
            name: "Luz",
            icon: "✨",
            color: "#fef08a",
            crest: "🐯",
            guardian: "Guardião do Tigre"
        },

        Terra: {
            name: "Terra",
            icon: "🪨",
            color: "#a3a34a",
            crest: "🐻",
            guardian: "Guardião do Urso"
        },

        Trevas: {
            name: "Trevas",
            icon: "🌑",
            color: "#a855f7",
            crest: "🦊",
            guardian: "Guardião da Raposa"
        },

        Vento: {
            name: "Vento",
            icon: "🌪️",
            color: "#5eead4",
            crest: "🦅",
            guardian: "Guardião da Águia"
        },

        Fogo: {
            name: "Fogo",
            icon: "🔥",
            color: "#fb7185",
            crest: "🐉",
            guardian: "Guardião do Dragão"
        },

        Fisico: {
            name: "Físico",
            icon: "⚔️",
            color: "#f87171",
            crest: "🦣",
            guardian: "Guardião do Mamute"
        },

        Magico: {
            name: "Mágico",
            icon: "🔮",
            color: "#c084fc",
            crest: "🦉",
            guardian: "Guardião da Coruja"
        }
    };

    const XP_TABLE = {
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

    const CREST_STAGES = [
        { xp: 0, name: "SEM NENHUM" },
        { xp: 3000, name: "INICIAL" },
        { xp: 6000, name: "LEVE" },
        { xp: 9000, name: "PEQUENO" },
        { xp: 12000, name: "MÉDIO" },
        { xp: 15000, name: "GRANDE" },
        { xp: 20000, name: "PESADO" },
        { xp: 25000, name: "ARCANO" },
        { xp: 50000, name: "EXTRA" }
    ];


    /* =====================================================
       ESTADO PADRÃO
    ===================================================== */

    function criarEstadoInicial() {

        const race = RACES.Humano;

        return {
            character: {
                name: "Novo Personagem",
                race: "Humano",
                class: "Saber",
                affinity: null,
                imageUrl: "",

                level: 1,
                xp: 0,

                crestXP: 0,

                stats: {
                    hp: race.hp,
                    maxHp: race.hp,

                    mp: race.mp,
                    maxMp: race.mp,

                    est: race.est,
                    maxEst: race.est,

                    sanidade: race.sanidade,

                    atk: race.atk,
                    atkMgc: race.atkMgc,
                    def: race.def,
                    res: race.res,
                    agi: race.agi,
                    int: race.int
                },

                attributePoints: 3,

                inventory: [],
                equipment: [],

                elementConfirmed: false
            },

            combat: {
                basicAttackName: "Ataque básico",

                dodgeName: "Esquiva",
                counterName: "Contra-ataque",

                counterEnabled: true,

                abilities: [
                    {
                        name: "Habilidade 1",
                        costType: "MP",
                        cost: 7,
                        description: ""
                    },
                    {
                        name: "Habilidade 2",
                        costType: "EST",
                        cost: 5,
                        description: ""
                    },
                    {
                        name: "Habilidade 3",
                        costType: "MP",
                        cost: 7,
                        description: ""
                    }
                ],

                passive: {
                    name: "Passiva",
                    description: ""
                },

                combatLog: []
            }
        };
    }


    /* =====================================================
       CARREGAR / SALVAR
    ===================================================== */

    let state = carregarEstado();

    function carregarEstado() {

        try {

            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) {
                return criarEstadoInicial();
            }

            const parsed = JSON.parse(saved);
            const base = criarEstadoInicial();

            return mesclarProfundo(base, parsed);

        } catch (error) {

            console.warn("Não foi possível carregar o personagem.", error);

            return criarEstadoInicial();
        }
    }


    function mesclarProfundo(base, saved) {

        if (
            typeof base !== "object" ||
            base === null ||
            typeof saved !== "object" ||
            saved === null
        ) {
            return saved ?? base;
        }

        const result = { ...base };

        Object.keys(saved).forEach(key => {

            if (
                typeof saved[key] === "object" &&
                saved[key] !== null &&
                !Array.isArray(saved[key]) &&
                typeof base[key] === "object" &&
                base[key] !== null &&
                !Array.isArray(base[key])
            ) {
                result[key] = mesclarProfundo(base[key], saved[key]);
            } else {
                result[key] = saved[key];
            }

        });

        return result;
    }


    function salvar() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(state)
        );
    }


    /* =====================================================
       NAVEGAÇÃO ENTRE DIMENSÕES
    ===================================================== */

    const navButtons =
        document.querySelectorAll(".dimension-button");

    const dimensions =
        document.querySelectorAll(".card-dimension");


    function abrirDimensao(nome) {

        navButtons.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.dimension === nome
            );

        });

        dimensions.forEach(dimension => {

            dimension.classList.toggle(
                "active",
                dimension.dataset.dimensionContent === nome
            );

        });

    }


    navButtons.forEach(button => {

        button.addEventListener("click", () => {

            abrirDimensao(
                button.dataset.dimension
            );

        });

    });


    abrirDimensao("character");


    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    function encontrar(id) {
        return document.getElementById(id);
    }


    function formatarNumero(numero) {

        return Number(numero || 0).toLocaleString("pt-BR");

    }


    function obterElementoAfinidade() {

        if (!state.character.affinity) {
            return null;
        }

        return AFFINITIES[state.character.affinity] || null;
    }


    /* =====================================================
       XP DO PERSONAGEM
    ===================================================== */

    function xpNecessarioParaProximoNivel(level) {

        if (level >= MAX_LEVEL) {
            return Infinity;
        }

        if (XP_TABLE[level]) {
            return XP_TABLE[level];
        }

        /*
           Depois do nível 15:
           16 → 17 = 2100
           17 → 18 = 2250
           etc.
        */

        return 1950 + ((level - 15) * 150);
    }


    function adicionarXP(valor) {

        valor = Number(valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            return;
        }

        if (state.character.level >= MAX_LEVEL) {
            return;
        }

        state.character.xp += Math.floor(valor);

        let subiuNivel = false;

        while (
            state.character.level < MAX_LEVEL &&
            state.character.xp >= xpNecessarioParaProximoNivel(
                state.character.level
            )
        ) {

            const custo =
                xpNecessarioParaProximoNivel(
                    state.character.level
                );

            state.character.xp -= custo;

            state.character.level++;

            aplicarRecompensasDeNivel(
                state.character.level
            );

            subiuNivel = true;
        }

        if (state.character.level >= MAX_LEVEL) {
            state.character.xp = 0;
        }

        if (subiuNivel) {
            atualizarCapacidadeInventario();
        }

        salvar();
        atualizarTudo();
    }


    function removerXP(valor) {

        valor = Number(valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            return;
        }

        state.character.xp -= Math.floor(valor);

        while (state.character.xp < 0 && state.character.level > 1) {

            state.character.level--;

            const anterior =
                xpNecessarioParaProximoNivel(
                    state.character.level
                );

            state.character.xp += anterior;

            removerRecompensasDeNivel(
                state.character.level + 1
            );
        }

        if (state.character.xp < 0) {
            state.character.xp = 0;
        }

        salvar();
        atualizarTudo();
    }


    function aplicarRecompensasDeNivel(level) {

        /*
           Todo nível conquistado:
           +3 pontos de atributo
           +1 Sanidade

           A cada 3 níveis:
           +5 pontos de recursos.
        */

        state.character.attributePoints += 3;

        state.character.stats.sanidade += 1;

        if (level % 3 === 0) {

            state.character.stats.maxHp += 5;
            state.character.stats.maxMp += 5;
            state.character.stats.maxEst += 5;

            state.character.stats.hp += 5;
            state.character.stats.mp += 5;
            state.character.stats.est += 5;
        }

        /*
           A cada 5 níveis:
           +500 XP de Brasão.
        */

        if (level % 5 === 0) {

            state.character.crestXP += 500;

            adicionarLog(
                `Brasão recebeu +500 XP pelo nível ${level}.`
            );
        }
    }


    function removerRecompensasDeNivel(level) {

        state.character.attributePoints =
            Math.max(
                0,
                state.character.attributePoints - 3
            );

        state.character.stats.sanidade =
            Math.max(
                0,
                state.character.stats.sanidade - 1
            );

        if (level % 3 === 0) {

            state.character.stats.maxHp =
                Math.max(
                    1,
                    state.character.stats.maxHp - 5
                );

            state.character.stats.maxMp =
                Math.max(
                    0,
                    state.character.stats.maxMp - 5
                );

            state.character.stats.maxEst =
                Math.max(
                    0,
                    state.character.stats.maxEst - 5
                );

            state.character.stats.hp =
                Math.min(
                    state.character.stats.hp,
                    state.character.stats.maxHp
                );

            state.character.stats.mp =
                Math.min(
                    state.character.stats.mp,
                    state.character.stats.maxMp
                );

            state.character.stats.est =
                Math.min(
                    state.character.stats.est,
                    state.character.stats.maxEst
                );
        }

        if (level % 5 === 0) {

            state.character.crestXP =
                Math.max(
                    0,
                    state.character.crestXP - 500
                );
        }
    }


    /* =====================================================
       ATRIBUTOS
    ===================================================== */

    function aumentarAtributo(nome) {

        if (state.character.attributePoints <= 0) {
            return;
        }

        if (
            !Object.prototype.hasOwnProperty.call(
                state.character.stats,
                nome
            )
        ) {
            return;
        }

        state.character.stats[nome]++;

        state.character.attributePoints--;

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       RECURSOS
    ===================================================== */

    function gastarRecurso(tipo, quantidade) {

        quantidade = Number(quantidade);

        if (!Number.isFinite(quantidade) || quantidade < 0) {
            return false;
        }

        let recurso;

        if (tipo === "MP") {
            recurso = "mp";
        }

        if (tipo === "EST") {
            recurso = "est";
        }

        if (!recurso) {
            return true;
        }

        if (
            state.character.stats[recurso] <
            quantidade
        ) {
            return false;
        }

        state.character.stats[recurso] -= quantidade;

        return true;
    }


    function recuperarRecurso(tipo, quantidade) {

        quantidade = Number(quantidade);

        if (tipo === "MP") {

            state.character.stats.mp =
                Math.min(
                    state.character.stats.mp + quantidade,
                    state.character.stats.maxMp
                );
        }

        if (tipo === "EST") {

            state.character.stats.est =
                Math.min(
                    state.character.stats.est + quantidade,
                    state.character.stats.maxEst
                );
        }

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       ATAQUE BÁSICO
    ===================================================== */

    function usarAtaqueBasico() {

        if (!gastarRecurso("EST", 1)) {

            adicionarLog(
                "Ataque básico falhou: EST insuficiente."
            );

            atualizarTudo();
            return;
        }

        adicionarLog(
            `${state.combat.basicAttackName} utilizado. EST -1.`
        );

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       ESQUIVA / CONTRA-ATAQUE
    ===================================================== */

    function usarContraAtaque() {

        if (!state.combat.counterEnabled) {
            return;
        }

        if (!gastarRecurso("EST", 3)) {

            adicionarLog(
                "Contra-ataque falhou: EST insuficiente."
            );

            atualizarTudo();
            return;
        }

        adicionarLog(
            `${state.combat.counterName} utilizado. EST -3.`
        );

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       HABILIDADES
    ===================================================== */

    function usarHabilidade(index) {

        const ability =
            state.combat.abilities[index];

        if (!ability) {
            return;
        }

        const cost =
            Number(ability.cost) || 0;

        if (
            ability.costType !== "MP" &&
            ability.costType !== "EST"
        ) {

            adicionarLog(
                `${ability.name} utilizada.`
            );

            efeitoElemental();

            salvar();
            atualizarTudo();

            return;
        }

        if (!gastarRecurso(ability.costType, cost)) {

            adicionarLog(
                `${ability.name}: recurso insuficiente.`
            );

            atualizarTudo();

            return;
        }

        adicionarLog(
            `${ability.name} utilizada. ${ability.costType} -${cost}.`
        );

        efeitoElemental();

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       PASSIVA
    ===================================================== */

    function salvarPassiva(nome, descricao) {

        state.combat.passive.name =
            nome || "Passiva";

        state.combat.passive.description =
            descricao || "";

        salvar();
    }


    /* =====================================================
       LOG DE COMBATE
    ===================================================== */

    function adicionarLog(texto) {

        const agora = new Date();

        const hora =
            agora.toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        state.combat.combatLog.push({
            time: hora,
            text: texto
        });

        /*
           Mantém somente os últimos 50 registros.
        */

        if (state.combat.combatLog.length > 50) {

            state.combat.combatLog =
                state.combat.combatLog.slice(-50);
        }
    }


    function limparLog() {

        state.combat.combatLog = [];

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       AFINIDADE
    ===================================================== */

    function confirmarAfinidade(afinidade) {

        if (state.character.elementConfirmed) {
            return;
        }

        if (!AFFINITIES[afinidade]) {
            return;
        }

        state.character.affinity = afinidade;
        state.character.elementConfirmed = true;

        efeitoElemental();

        adicionarLog(
            `Afinidade permanente escolhida: ${AFFINITIES[afinidade].name}.`
        );

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       EFEITO ELEMENTAL
    ===================================================== */

    function efeitoElemental() {

        const affinity =
            obterElementoAfinidade();

        if (!affinity) {
            return;
        }

        const effect =
            document.createElement("div");

        effect.className =
            "element-effect";

        effect.style.setProperty(
            "--element-color",
            affinity.color
        );

        effect.textContent =
            affinity.icon;

        document.body.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 900);
    }


    /* =====================================================
       BRASÃO
    ===================================================== */

    function obterEstagioBrasao() {

        let atual =
            CREST_STAGES[0];

        for (const stage of CREST_STAGES) {

            if (state.character.crestXP >= stage.xp) {
                atual = stage;
            }

        }

        return atual;
    }


    function adicionarXPDoBrasao(valor) {

        valor = Number(valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            return;
        }

        state.character.crestXP +=
            Math.floor(valor);

        salvar();
        atualizarTudo();
    }


    function removerXPDoBrasao(valor) {

        valor = Number(valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            return;
        }

        state.character.crestXP =
            Math.max(
                0,
                state.character.crestXP - Math.floor(valor)
            );

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       INVENTÁRIO
    ===================================================== */

    function obterCapacidadeInventario() {

        const level =
            state.character.level;

        return 50 +
            (Math.floor(level / 10) * 50);
    }


    function atualizarCapacidadeInventario() {

        const capacidade =
            obterCapacidadeInventario();

        /*
           Apenas visualmente limitamos o número de
           espaços disponíveis.
        */

        if (
            state.character.inventory.length >
            capacidade
        ) {

            state.character.inventory =
                state.character.inventory.slice(
                    0,
                    capacidade
                );
        }
    }


    function adicionarItem(nome) {

        nome = String(nome || "").trim();

        if (!nome) {
            return;
        }

        const capacidade =
            obterCapacidadeInventario();

        if (
            state.character.inventory.length >=
            capacidade
        ) {
            return;
        }

        state.character.inventory.push(nome);

        salvar();
        atualizarTudo();
    }


    function removerItem(index) {

        if (
            index < 0 ||
            index >= state.character.inventory.length
        ) {
            return;
        }

        state.character.inventory.splice(
            index,
            1
        );

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       IMAGEM
    ===================================================== */

    function aplicarImagemURL(url) {

        state.character.imageUrl =
            String(url || "").trim();

        salvar();
        atualizarTudo();
    }


    function removerImagem() {

        state.character.imageUrl = "";

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       RAÇA
    ===================================================== */

    function trocarRaca(raceName) {

        if (!RACES[raceName]) {
            return;
        }

        state.character.race = raceName;

        const base =
            RACES[raceName];

        /*
           Ao mudar a raça, os atributos raciais
           retornam aos valores base.
        */

        state.character.stats.hp = base.hp;
        state.character.stats.maxHp = base.hp;

        state.character.stats.mp = base.mp;
        state.character.stats.maxMp = base.mp;

        state.character.stats.est = base.est;
        state.character.stats.maxEst = base.est;

        state.character.stats.sanidade =
            base.sanidade +
            Math.max(
                0,
                state.character.level - 1
            );

        state.character.stats.atk = base.atk;
        state.character.stats.atkMgc = base.atkMgc;
        state.character.stats.def = base.def;
        state.character.stats.res = base.res;
        state.character.stats.agi = base.agi;
        state.character.stats.int = base.int;

        salvar();
        atualizarTudo();
    }


    /* =====================================================
       RENDERIZAÇÃO
    ===================================================== */

    function atualizarTudo() {

        atualizarPersonagem();
        atualizarXP();
        atualizarBrasao();
        atualizarStatus();
        atualizarAfinidade();
        atualizarCombate();
        atualizarInventario();
        atualizarEditor();
        atualizarIndicadorPontos();
    }


    /* =====================================================
       PERSONAGEM
    ===================================================== */

    function atualizarPersonagem() {

        const c =
            state.character;

        const nome =
            document.querySelector(
                "[data-character-name]"
            );

        if (nome) {
            nome.textContent =
                c.name;
        }

        const race =
            document.querySelector(
                "[data-character-race]"
            );

        if (race) {
            race.textContent =
                c.race;
        }

        const classe =
            document.querySelector(
                "[data-character-class]"
            );

        if (classe) {
            classe.textContent =
                c.class;
        }

        const affinity =
            document.querySelector(
                "[data-character-affinity]"
            );

        if (affinity) {

            const data =
                obterElementoAfinidade();

            affinity.textContent =
                data
                    ? `${data.icon} ${data.name}`
                    : "Não definida";
        }

        const level =
            document.querySelector(
                "[data-character-level]"
            );

        if (level) {
            level.textContent =
                `Nível ${c.level}`;
        }

        /*
           Brasão
        */

        const crest =
            document.querySelector(
                "[data-character-crest]"
            );

        if (crest) {

            const data =
                obterElementoAfinidade();

            crest.textContent =
                data
                    ? data.crest
                    : "◇";
        }

        /*
           Imagem por URL
        */

        const image =
            document.querySelector(
                "[data-character-image]"
            );

        if (image) {

            if (c.imageUrl) {

                image.src =
                    c.imageUrl;

                image.style.display =
                    "block";

            } else {

                image.removeAttribute(
                    "src"
                );

                image.style.display =
                    "none";
            }
        }
    }


    /* =====================================================
       XP
    ===================================================== */

    function atualizarXP() {

        const c =
            state.character;

        const xpText =
            document.querySelector(
                "[data-character-xp]"
            );

        if (xpText) {

            if (c.level >= MAX_LEVEL) {

                xpText.textContent =
                    "NÍVEL MÁXIMO";

            } else {

                xpText.textContent =
                    `${formatarNumero(c.xp)} / ${formatarNumero(
                        xpNecessarioParaProximoNivel(c.level)
                    )} XP`;
            }
        }

        const progress =
            document.querySelector(
                "[data-character-xp-progress]"
            );

        if (progress) {

            const required =
                xpNecessarioParaProximoNivel(
                    c.level
                );

            const percent =
                c.level >= MAX_LEVEL
                    ? 100
                    : Math.min(
                        100,
                        (c.xp / required) * 100
                    );

            progress.style.width =
                `${percent}%`;
        }
    }


    /* =====================================================
       BRASÃO
    ===================================================== */

    function atualizarBrasao() {

        const stage =
            obterEstagioBrasao();

        const affinity =
            obterElementoAfinidade();

        const stageText =
            document.querySelector(
                "[data-crest-stage]"
            );

        if (stageText) {
            stageText.textContent =
                stage.name;
        }

        const xp =
            document.querySelector(
                "[data-crest-xp]"
            );

        if (xp) {
            xp.textContent =
                `${formatarNumero(
                    state.character.crestXP
                )} XP`;
        }

        const crest =
            document.querySelector(
                "[data-character-crest]"
            );

        if (crest && affinity) {
            crest.textContent =
                affinity.crest;
        }

        const guardian =
            document.querySelector(
                "[data-crest-guardian]"
            );

        if (guardian) {

            guardian.textContent =
                affinity
                    ? affinity.guardian
                    : "Nenhum Guardião";
        }

        const progress =
            document.querySelector(
                "#badge-xp-progress"
            );

        if (progress) {

            const index =
                CREST_STAGES.indexOf(stage);

            const next =
                CREST_STAGES[index + 1];

            let percent = 100;

            if (next) {

                const range =
                    next.xp - stage.xp;

                percent =
                    (
                        (state.character.crestXP - stage.xp) /
                        range
                    ) * 100;

                percent =
                    Math.max(
                        0,
                        Math.min(100, percent)
                    );
            }

            progress.style.width =
                `${percent}%`;

            const inner =
                progress.querySelector(
                   ("div")
                );

            if (inner) {
                inner.style.width =
                    `${percent}%`;
            }
        }
    }


    /* =====================================================
       STATUS
    ===================================================== */

    function atualizarStatus() {

        const s =
            state.character.stats;

        const valores = {
            hp: s.hp,
            maxHp: s.maxHp,

            mp: s.mp,
            maxMp: s.maxMp,

            est: s.est,
            maxEst: s.maxEst,

            sanidade: s.sanidade,

            atk: s.atk,
            atkMgc: s.atkMgc,
            def: s.def,
            res: s.res,
            agi: s.agi,
            int: s.int
        };

        Object.keys(valores).forEach(key => {

            const elements =
                document.querySelectorAll(
                    `[data-stat="${key}"]`
                );

            elements.forEach(element => {

                element.textContent =
                    formatarNumero(
                        valores[key]
                    );

            });

        });

        const points =
            document.querySelector(
                "[data-attribute-points]"
            );

        if (points) {
            points.textContent =
                state.character.attributePoints;
        }

        /*
           Atualiza botões de atributo.
        */

        document.querySelectorAll(
            "[data-attribute]"
        ).forEach(button => {

            button.disabled =
                state.character.attributePoints <= 0;

        });
    }


    /* =====================================================
       AFINIDADE
    ===================================================== */

    function atualizarAfinidade() {

        const buttons =
            document.querySelectorAll(
                "[data-affinity]"
            );

        buttons.forEach(button => {

            const value =
                button.dataset.affinity;

            const selected =
                state.character.affinity === value;

            button.classList.toggle(
                "selected",
                selected
            );

            button.disabled =
                state.character.elementConfirmed &&
                !selected;
        });

        const confirm =
            document.querySelector(
                "[data-confirm-affinity]"
            );

        if (confirm) {

            confirm.disabled =
                state.character.elementConfirmed ||
                !state.character.affinity;
        }
    }


    /* =====================================================
       COMBATE
    ===================================================== */

    function atualizarCombate() {

        const s =
            state.character.stats;

        const mp =
            document.querySelector(
                "[data-combat-mp]"
            );

        if (mp) {

            mp.textContent =
                `${s.mp} / ${s.maxMp}`;
        }

        const est =
            document.querySelector(
                "[data-combat-est]"
            );

        if (est) {

            est.textContent =
                `${s.est} / ${s.maxEst}`;
        }

        /*
           Nomes das habilidades
        */

        document.querySelectorAll(
            "[data-ability-name]"
        ).forEach((element, index) => {

            const ability =
                state.combat.abilities[index];

            if (!ability) {
                return;
            }

            element.textContent =
                ability.name;
        });

        /*
           Custos
        */

        document.querySelectorAll(
            "[data-ability-cost]"
        ).forEach((element, index) => {

            const ability =
                state.combat.abilities[index];

            if (!ability) {
                return;
            }

            if (
                ability.costType === "Nenhum"
            ) {

                element.textContent =
                    "Sem custo";

            } else {

                element.textContent =
                    `${ability.cost} ${ability.costType}`;
            }
        });

        /*
           Ataque básico
        */

        document.querySelectorAll(
            "[data-basic-attack-name]"
        ).forEach(element => {

            element.textContent =
                state.combat.basicAttackName;
        });

        /*
           Passiva
        */

        document.querySelectorAll(
            "[data-passive-name]"
        ).forEach(element => {

            element.textContent =
                state.combat.passive.name;
        });

        document.querySelectorAll(
            "[data-passive-description]"
        ).forEach(element => {

            element.textContent =
                state.combat.passive.description ||
                "Nenhuma descrição definida.";
        });

        /*
           Log
        */

        atualizarLogCombate();
    }


    function atualizarLogCombate() {

        const log =
            document.querySelector(
                "#combat-log"
            );

        if (!log) {
            return;
        }

        log.innerHTML = "";

        state.combat.combatLog
            .slice()
            .reverse()
            .forEach(entry => {

                const line =
                    document.createElement("div");

                line.className =
                    "combat-log-entry";

                line.textContent =
                    `[${entry.time}] ${entry.text}`;

                log.appendChild(line);
            });
    }


    /* =====================================================
       INVENTÁRIO
    ===================================================== */

    function atualizarInventario() {

        const capacidade =
            obterCapacidadeInventario();

        const usado =
            state.character.inventory.length;

        const capacity =
            document.querySelector(
                "[data-inventory-capacity]"
            );

        if (capacity) {

            capacity.textContent =
                `${usado} / ${capacidade}`;
        }

        const list =
            document.querySelector(
                "[data-inventory-list]"
            );

        if (list) {

            list.innerHTML = "";

            state.character.inventory
                .forEach((item, index) => {

                    const row =
                        document.createElement("div");

                    row.className =
                        "inventory-item";

                    const name =
                        document.createElement("span");

                    name.textContent =
                        item;

                    const remove =
                        document.createElement("button");

                    remove.type =
                        "button";

                    remove.textContent =
                        "×";

                    remove.addEventListener(
                        "click",
                        () => removerItem(index)
                    );

                    row.appendChild(name);
                    row.appendChild(remove);

                    list.appendChild(row);
                });
        }
    }


    /* =====================================================
       EDITOR
    ===================================================== */

    function atualizarEditor() {

        const nameInput =
            document.querySelector(
                "[data-edit-name]"
            );

        if (
            nameInput &&
            document.activeElement !== nameInput
        ) {
            nameInput.value =
                state.character.name;
        }

        const classInput =
            document.querySelector(
                "[data-edit-class]"
            );

        if (
            classInput &&
            document.activeElement !== classInput
        ) {
            classInput.value =
                state.character.class;
        }

        const raceInput =
            document.querySelector(
                "[data-edit-race]"
            );

        if (
            raceInput &&
            document.activeElement !== raceInput
        ) {
            raceInput.value =
                state.character.race;
        }

        const imageInput =
            document.querySelector(
                "[data-edit-image]"
            );

        if (
            imageInput &&
            document.activeElement !== imageInput
        ) {
            imageInput.value =
                state.character.imageUrl;
        }
    }


    /* =====================================================
       INDICADOR DE PONTOS
    ===================================================== */

    function atualizarIndicadorPontos() {

        let indicator =
            document.querySelector(
                "#level-up-indicator"
            );

        const points =
            state.character.attributePoints;

        if (!indicator) {

            indicator =
                document.createElement("div");

            indicator.id =
                "level-up-indicator";

            indicator.className =
                "level-up-indicator";

            const target =
                document.querySelector(
                    "[data-attribute-points]"
                );

            if (target) {

                target.parentElement
                    .appendChild(indicator);
            }
        }

        if (!indicator) {
            return;
        }

        if (points > 0) {

            indicator.textContent =
                `+${points} PONTOS`;

            indicator.classList.add(
                "visible"
            );

        } else {

            indicator.classList.remove(
                "visible"
            );
        }
    }


    /* =====================================================
       EVENTOS DO EDITOR
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            const target =
                event.target;

            if (
                target.matches(
                    "[data-edit-name]"
                )
            ) {

                state.character.name =
                    target.value;

                salvar();
                atualizarPersonagem();
            }

        }
    );


    document.addEventListener(
        "change",
        event => {

            const target =
                event.target;

            if (
                target.matches(
                    "[data-edit-race]"
                )
            ) {

                trocarRaca(
                    target.value
                );

                return;
            }

            if (
                target.matches(
                    "[data-edit-class]"
                )
            ) {

                state.character.class =
                    target.value;

                salvar();
                atualizarPersonagem();

                return;
            }

            if (
                target.matches(
                    "[data-edit-image]"
                )
            ) {

                aplicarImagemURL(
                    target.value
                );
            }

        }
    );


    /* =====================================================
       CLIQUES GERAIS
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const target =
                event.target.closest(
                    "button"
                );

            if (!target) {
                return;
            }


            /* ---------------------------------------------
               ATRIBUTO +
            --------------------------------------------- */

            if (
                target.dataset.attribute
            ) {

                aumentarAtributo(
                    target.dataset.attribute
                );

                return;
            }


            /* ---------------------------------------------
               AFINIDADE
            --------------------------------------------- */

            if (
                target.dataset.affinity
            ) {

                if (
                    !state.character.elementConfirmed
                ) {

                    state.character.affinity =
                        target.dataset.affinity;

                    salvar();

                    efeitoElemental();

                    atualizarAfinidade();
                }

                return;
            }


            /* ---------------------------------------------
               CONFIRMAR AFINIDADE
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-confirm-affinity]"
                )
            ) {

                if (
                    state.character.affinity
                ) {

                    confirmarAfinidade(
                        state.character.affinity
                    );
                }

                return;
            }


            /* ---------------------------------------------
               ATAQUE BÁSICO
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-use-basic-attack]"
                )
            ) {

                usarAtaqueBasico();

                return;
            }


            /* ---------------------------------------------
               CONTRA-ATAQUE
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-use-counter]"
                )
            ) {

                usarContraAtaque();

                return;
            }


            /* ---------------------------------------------
               HABILIDADE
            --------------------------------------------- */

            if (
                target.dataset.useAbility !==
                undefined
            ) {

                usarHabilidade(
                    Number(
                        target.dataset.useAbility
                    )
                );

                return;
            }


            /* ---------------------------------------------
               LIMPAR LOG
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-clear-combat-log]"
                )
            ) {

                limparLog();

                return;
            }


            /* ---------------------------------------------
               RECUPERAR MP
            --------------------------------------------- */

            if (
                target.dataset.restoreMp
            ) {

                recuperarRecurso(
                    "MP",
                    Number(
                        target.dataset.restoreMp
                    )
                );

                return;
            }


            /* ---------------------------------------------
               RECUPERAR EST
            --------------------------------------------- */

            if (
                target.dataset.restoreEst
            ) {

                recuperarRecurso(
                    "EST",
                    Number(
                        target.dataset.restoreEst
                    )
                );

                return;
            }


            /* ---------------------------------------------
               IMAGEM
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-remove-image]"
                )
            ) {

                removerImagem();

                return;
            }


            /* ---------------------------------------------
               ADICIONAR ITEM
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-add-inventory]"
                )
            ) {

                const input =
                    document.querySelector(
                        "[data-inventory-input]"
                    );

                if (input) {

                    adicionarItem(
                        input.value
                    );

                    input.value = "";
                }

                return;
            }


            /* ---------------------------------------------
               XP
            --------------------------------------------- */

            if (
                target.dataset.xpAdd
            ) {

                adicionarXP(
                    Number(
                        target.dataset.xpAdd
                    )
                );

                return;
            }


            if (
                target.dataset.xpRemove
            ) {

                removerXP(
                    Number(
                        target.dataset.xpRemove
                    )
                );

                return;
            }


            /* ---------------------------------------------
               XP PERSONALIZADO
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-add-custom-xp]"
                )
            ) {

                const input =
                    document.querySelector(
                        "[data-custom-xp]"
                    );

                if (input) {

                    adicionarXP(
                        Number(input.value)
                    );

                    input.value = "";
                }

                return;
            }


            if (
                target.matches(
                    "[data-remove-custom-xp]"
                )
            ) {

                const input =
                    document.querySelector(
                        "[data-custom-xp]"
                    );

                if (input) {

                    removerXP(
                        Number(input.value)
                    );

                    input.value = "";
                }

                return;
            }


            /* ---------------------------------------------
               XP DO BRASÃO
            --------------------------------------------- */

            if (
                target.dataset.crestXpAdd
            ) {

                adicionarXPDoBrasao(
                    Number(
                        target.dataset.crestXpAdd
                    )
                );

                return;
            }


            if (
                target.dataset.crestXpRemove
            ) {

                removerXPDoBrasao(
                    Number(
                        target.dataset.crestXpRemove
                    )
                );

                return;
            }


            /* ---------------------------------------------
               XP PERSONALIZADO DO BRASÃO
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-add-custom-crest-xp]"
                )
            ) {

                const input =
                    document.querySelector(
                        "[data-custom-crest-xp]"
                    );

                if (input) {

                    adicionarXPDoBrasao(
                        Number(input.value)
                    );

                    input.value = "";
                }

                return;
            }


            if (
                target.matches(
                    "[data-remove-custom-crest-xp]"
                )
            ) {

                const input =
                    document.querySelector(
                        "[data-custom-crest-xp]"
                    );

                if (input) {

                    removerXPDoBrasao(
                        Number(input.value)
                    );

                    input.value = "";
                }

                return;
            }


            /* ---------------------------------------------
               MODO MESTRE
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-master-toggle]"
                )
            ) {

                const controls =
                    document.querySelector(
                        "[data-master-controls]"
                    );

                if (controls) {

                    controls.classList.toggle(
                        "active"
                    );
                }

                return;
            }


            /* ---------------------------------------------
               RESET
            --------------------------------------------- */

            if (
                target.matches(
                    "[data-reset-character]"
                )
            ) {

                const confirmed =
                    confirm(
                        "Tem certeza que deseja resetar o personagem?"
                    );

                if (!confirmed) {
                    return;
                }

                state =
                    criarEstadoInicial();

                salvar();
                atualizarTudo();

                return;
            }

        }
    );


    /* =====================================================
       EDITOR DE COMBATE
    ===================================================== */

    function prepararEditorCombate() {

        /*
           O sistema cria os campos de edição
           caso eles ainda não existam no HTML.
        */

        const combat =
            document.querySelector(
                '[data-dimension-content="combat"]'
            );

        if (!combat) {
            return;
        }

        let editor =
            combat.querySelector(
                ".combat-editor"
            );

        if (!editor) {

            editor =
                document.createElement("div");

            editor.className =
                "combat-editor";

            editor.innerHTML = `
                <h3>EDITOR DE COMBATE</h3>

                <div class="combat-edit-field">
                    <label>Ataque básico</label>
                    <input
                        type="text"
                        data-combat-basic-name
                        placeholder="Nome do ataque"
                    >
                </div>

                <div class="combat-edit-field">
                    <label>Esquiva</label>
                    <input
                        type="text"
                        data-combat-dodge-name
                        placeholder="Nome da esquiva"
                    >
                </div>

                <div class="combat-edit-field">
                    <label>Contra-ataque</label>
                    <input
                        type="text"
                        data-combat-counter-name
                        placeholder="Nome do contra-ataque"
                    >
                </div>

                <div class="combat-abilities-editor">
                    <h4>HABILIDADES</h4>
                    <div data-abilities-editor></div>
                </div>

                <div class="combat-passive-editor">
                    <h4>PASSIVA</h4>

                    <input
                        type="text"
                        data-passive-name-input
                        placeholder="Nome da passiva"
                    >

                    <textarea
                        data-passive-description-input
                        placeholder="Escreva aqui o efeito da passiva..."
                        rows="5"
                    ></textarea>
                </div>
            `;

            combat.appendChild(editor);
        }

        renderizarEditorHabilidades();

        const basic =
            editor.querySelector(
                "[data-combat-basic-name]"
            );

        const dodge =
            editor.querySelector(
                "[data-combat-dodge-name]"
            );

        const counter =
            editor.querySelector(
                "[data-combat-counter-name]"
            );

        const passiveName =
            editor.querySelector(
                "[data-passive-name-input]"
            );

        const passiveDescription =
            editor.querySelector(
                "[data-passive-description-input]"
            );

        if (
            basic &&
            document.activeElement !== basic
        ) {
            basic.value =
                state.combat.basicAttackName;
        }

        if (
            dodge &&
            document.activeElement !== dodge
        ) {
            dodge.value =
                state.combat.dodgeName;
        }

        if (
            counter &&
            document.activeElement !== counter
        ) {
            counter.value =
                state.combat.counterName;
        }

        if (
            passiveName &&
            document.activeElement !== passiveName
        ) {
            passiveName.value =
                state.combat.passive.name;
        }

        if (
            passiveDescription &&
            document.activeElement !== passiveDescription
        ) {
            passiveDescription.value =
                state.combat.passive.description;
        }
    }


    function renderizarEditorHabilidades() {

        const container =
            document.querySelector(
                "[data-abilities-editor]"
            );

        if (!container) {
            return;
        }

        container.innerHTML = "";

        state.combat.abilities.forEach(
            (ability, index) => {

                const wrapper =
                    document.createElement("div");

                wrapper.className =
                    "ability-edit-box";

                wrapper.innerHTML = `
                    <strong>Habilidade ${index + 1}</strong>

                    <input
                        type="text"
                        data-ability-edit-name="${index}"
                        placeholder="Nome da habilidade"
                    >

                    <div class="ability-cost-editor">

                        <select
                            data-ability-edit-type="${index}"
                        >
                            <option value="MP">MP</option>
                            <option value="EST">EST</option>
                            <option value="Nenhum">Sem custo</option>
                        </select>

                        <input
                            type="number"
                            min="0"
                            data-ability-edit-cost="${index}"
                            placeholder="Custo"
                        >

                    </div>

                    <textarea
                        data-ability-edit-description="${index}"
                        placeholder="Descrição / efeito da habilidade..."
                        rows="4"
                    ></textarea>
                `;

                container.appendChild(
                    wrapper
                );

                const name =
                    wrapper.querySelector(
                        "[data-ability-edit-name]"
                    );

                const type =
                    wrapper.querySelector(
                        "[data-ability-edit-type]"
                    );

                const cost =
                    wrapper.querySelector(
                        "[data-ability-edit-cost]"
                    );

                const description =
                    wrapper.querySelector(
                        "[data-ability-edit-description]"
                    );

                name.value =
                    ability.name;

                type.value =
                    ability.costType;

                cost.value =
                    ability.cost;

                description.value =
                    ability.description;
            }
        );
    }


    /* =====================================================
       EVENTOS DO EDITOR DE COMBATE
    ===================================================== */

    document.addEventListener(
        "input",
        event => {

            const target =
                event.target;

            if (
                target.matches(
                    "[data-combat-basic-name]"
                )
            ) {

                state.combat.basicAttackName =
                    target.value;

                salvar();

                return;
            }

            if (
                target.matches(
                    "[data-combat-dodge-name]"
                )
            ) {

                state.combat.dodgeName =
                    target.value;

                salvar();

                return;
            }

            if (
                target.matches(
                    "[data-combat-counter-name]"
                )
            ) {

                state.combat.counterName =
                    target.value;

                salvar();

                return;
            }

            if (
                target.matches(
                    "[data-passive-name-input]"
                )
            ) {

                state.combat.passive.name =
                    target.value;

                salvar();
                atualizarCombate();

                return;
            }

            if (
                target.matches(
                    "[data-passive-description-input]"
                )
            ) {

                state.combat.passive.description =
                    target.value;

                salvar();
                atualizarCombate();

                return;
            }

            const abilityName =
                target.closest(
                    "[data-ability-edit-name]"
                );

            if (abilityName) {

                const index =
                    Number(
                        abilityName.dataset
                            .abilityEditName
                    );

                if (
                    state.combat.abilities[index]
                ) {

                    state.combat
                        .abilities[index]
                        .name =
                        abilityName.value;

                    salvar();
                    atualizarCombate();
                }

                return;
            }

            if (
                target.matches(
                    "[data-ability-edit-cost]"
                )
            ) {

                const index =
                    Number(
                        target.dataset
                            .abilityEditCost
                    );

                if (
                    state.combat.abilities[index]
                ) {

                    state.combat
                        .abilities[index]
                        .cost =
                        Math.max(
                            0,
                            Number(target.value) || 0
                        );

                    salvar();
                    atualizarCombate();
                }

                return;
            }

            if (
                target.matches(
                    "[data-ability-edit-description]"
                )
            ) {

                const index =
                    Number(
                        target.dataset
                            .abilityEditDescription
                    );

                if (
                    state.combat.abilities[index]
                ) {

                    state.combat
                        .abilities[index]
                        .description =
                        target.value;

                    salvar();
                    atualizarCombate();
                }

                return;
            }
        }
    );


    document.addEventListener(
        "change",
        event => {

            const target =
                event.target;

            if (
                target.matches(
                    "[data-ability-edit-type]"
                )
            ) {

                const index =
                    Number(
                        target.dataset
                            .abilityEditType
                    );

                if (
                    state.combat.abilities[index]
                ) {

                    state.combat
                        .abilities[index]
                        .costType =
                        target.value;

                    salvar();
                    atualizarCombate();
                }
            }
        }
    );


    /* =====================================================
       BLOQUEIO DA AFINIDADE
    ===================================================== */

    function protegerAfinidade() {

        if (
            !state.character.elementConfirmed
        ) {
            return;
        }

        document.querySelectorAll(
            "[data-affinity]"
        ).forEach(button => {

            const value =
                button.dataset.affinity;

            button.disabled =
                value !==
                state.character.affinity;

        });
    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    prepararEditorCombate();

    atualizarTudo();

    protegerAfinidade();


    /* =====================================================
       EXPOSIÇÃO OPCIONAL
       Permite usar funções pelo HTML antigo,
       caso algum botão ainda use onclick.
    ===================================================== */

    window.adicionarXP = adicionarXP;
    window.removerXP = removerXP;

    window.adicionarXPDoBrasao =
        adicionarXPDoBrasao;

    window.removerXPDoBrasao =
        removerXPDoBrasao;

    window.aumentarAtributo =
        aumentarAtributo;

    window.confirmarAfinidade =
        confirmarAfinidade;

    window.usarAtaqueBasico =
        usarAtaqueBasico;

    window.usarContraAtaque =
        usarContraAtaque;

    window.usarHabilidade =
        usarHabilidade;

    window.adicionarItem =
        adicionarItem;

    window.removerItem =
        removerItem;

    window.recuperarRecurso =
        recuperarRecurso;

});
