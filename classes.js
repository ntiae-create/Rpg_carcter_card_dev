/* =========================================
   CLASSE.JS
   Sistema central de classes do RPG
========================================= */

"use strict";

const RPGClasses = {

    /* =====================================
       ASSASSINO
    ===================================== */

    Assassino: {
        nome: "Assassino",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Especialista em furtividade, velocidade e ataques precisos.",
        caracteristicas: [
            "Alta mobilidade",
            "Ataques críticos",
            "Furtividade",
            "Dano concentrado"
        ]
    },


    /* =====================================
       BERSERK
    ===================================== */

    Berserk: {
        nome: "Berserk",
        funcao: "Dano",
        dificuldade: "Média",
        descricao:
            "Combatente que transforma sua fúria em força e resistência.",
        caracteristicas: [
            "Força elevada",
            "Alta resistência",
            "Fúria",
            "Combate agressivo"
        ]
    },


    /* =====================================
       GUERREIRO
    ===================================== */

    Guerreiro: {
        nome: "Guerreiro",
        funcao: "Dano / Defesa",
        dificuldade: "Baixa",
        descricao:
            "Combatente versátil especializado em confrontos diretos.",
        caracteristicas: [
            "Equilíbrio",
            "Boa defesa",
            "Boa força",
            "Versatilidade"
        ]
    },


    /* =====================================
       TANK
    ===================================== */

    Tank: {
        nome: "Tank",
        funcao: "Defesa",
        dificuldade: "Média",
        descricao:
            "Especialista em resistência e proteção dos aliados.",
        caracteristicas: [
            "Defesa elevada",
            "Alta vitalidade",
            "Proteção",
            "Controle de ameaça"
        ]
    },


    /* =====================================
       FEITICEIRO
    ===================================== */

    Feiticeiro: {
        nome: "Feiticeiro",
        funcao: "Dano Mágico",
        dificuldade: "Alta",
        descricao:
            "Usuário de magia instintiva capaz de liberar grande poder.",
        caracteristicas: [
            "Grande poder mágico",
            "Magia instintiva",
            "Explosões de dano",
            "Alta versatilidade"
        ]
    },


    /* =====================================
       MAGO
    ===================================== */

    Mago: {
        nome: "Mago",
        funcao: "Dano / Controle",
        dificuldade: "Alta",
        descricao:
            "Especialista em conhecimento mágico, controle e manipulação de elementos.",
        caracteristicas: [
            "Grande conhecimento",
            "Controle mágico",
            "Magias elementais",
            "Longo alcance"
        ]
    },


    /* =====================================
       BUFÃO
    ===================================== */

    Bufao: {
        nome: "Bufão",
        funcao: "Controle / Suporte",
        dificuldade: "Muito Alta",
        descricao:
            "Combatente imprevisível que utiliza truques, ilusões e efeitos inesperados.",
        caracteristicas: [
            "Imprevisibilidade",
            "Ilusões",
            "Controle",
            "Efeitos aleatórios"
        ]
    },


    /* =====================================
       ALQUIMISTA
    ===================================== */

    Alquimista: {
        nome: "Alquimista",
        funcao: "Suporte / Dano",
        dificuldade: "Alta",
        descricao:
            "Especialista na criação de poções, compostos e artefatos alquímicos.",
        caracteristicas: [
            "Poções",
            "Bombas alquímicas",
            "Preparação",
            "Efeitos especiais"
        ]
    },


    /* =====================================
       ARQUEIRO
    ===================================== */

    Arqueiro: {
        nome: "Arqueiro",
        funcao: "Dano à Distância",
        dificuldade: "Média",
        descricao:
            "Especialista em ataques à distância e precisão.",
        caracteristicas: [
            "Precisão",
            "Longo alcance",
            "Mobilidade",
            "Ataques críticos"
        ]
    },


    /* =====================================
       LANCEIRO
    ===================================== */

    Lanceiro: {
        nome: "Lanceiro",
        funcao: "Dano / Defesa",
        dificuldade: "Média",
        descricao:
            "Combatente especializado em armas de haste e controle de distância.",
        caracteristicas: [
            "Alcance",
            "Contra-ataques",
            "Controle de espaço",
            "Defesa"
        ]
    },


    /* =====================================
       CAÇADOR
    ===================================== */

    Cacador: {
        nome: "Caçador",
        funcao: "Dano / Controle",
        dificuldade: "Média",
        descricao:
            "Rastreador especializado em criaturas, armadilhas e sobrevivência.",
        caracteristicas: [
            "Rastreamento",
            "Armadilhas",
            "Sobrevivência",
            "Caça a criaturas"
        ]
    },


    /* =====================================
       CLÉRIGO
    ===================================== */

    Clerigo: {
        nome: "Clérigo",
        funcao: "Buffer / Healer",
        dificuldade: "Média",
        descricao:
            "Especialista em cura, proteção e fortalecimento de aliados.",
        caracteristicas: [
            "Cura",
            "Regeneração",
            "Fortalecimento",
            "Proteção"
        ]
    },


    /* =====================================
       NECROMANTE
    ===================================== */

    Necromante: {
        nome: "Necromante",
        funcao: "Dano / Invocação",
        dificuldade: "Muito Alta",
        descricao:
            "Mago especializado em forças da morte e entidades sombrias.",
        caracteristicas: [
            "Magia sombria",
            "Invocações",
            "Drenagem",
            "Controle"
        ]
    },


    /* =====================================
       CEIFADOR
    ===================================== */

    Ceifador: {
        nome: "Ceifador",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Guerreiro especializado em ceifar a energia de seus inimigos.",
        caracteristicas: [
            "Drenagem",
            "Dano elevado",
            "Mobilidade",
            "Energia sombria"
        ]
    },


    /* =====================================
       MONGE
    ===================================== */

    Monge: {
        nome: "Monge",
        funcao: "Dano / Mobilidade",
        dificuldade: "Alta",
        descricao:
            "Especialista em combate corporal, velocidade e técnicas marciais.",
        caracteristicas: [
            "Combate corporal",
            "Velocidade",
            "Esquiva",
            "Técnicas marciais"
        ]
    },


    /* =====================================
       BARDO
    ===================================== */

    Bardo: {
        nome: "Bardo",
        funcao: "Suporte / Controle",
        dificuldade: "Alta",
        descricao:
            "Utiliza música e magia para alterar o campo de batalha.",
        caracteristicas: [
            "Buffs",
            "Debuffs",
            "Controle",
            "Suporte"
        ]
    },


    /* =====================================
       INVOCADOR
    ===================================== */

    Invocador: {
        nome: "Invocador",
        funcao: "Invocação",
        dificuldade: "Muito Alta",
        descricao:
            "Especialista em invocar criaturas e entidades para lutar ao seu lado.",
        caracteristicas: [
            "Invocações",
            "Controle de criaturas",
            "Versatilidade",
            "Combate indireto"
        ]
    },


    /* =====================================
       ORÁCULO
    ===================================== */

    Oraculo: {
        nome: "Oráculo",
        funcao: "Suporte / Controle",
        dificuldade: "Muito Alta",
        descricao:
            "Manipula informações, previsões e possibilidades para alterar acontecimentos.",
        caracteristicas: [
            "Previsão",
            "Percepção",
            "Manipulação de possibilidades",
            "Suporte"
        ]
    },


    /* =====================================
       DRUIDA
    ===================================== */

    Druida: {
        nome: "Druida",
        funcao: "Magia / Suporte",
        dificuldade: "Alta",
        descricao:
            "Canaliza forças da natureza e pode assumir diferentes formas.",
        caracteristicas: [
            "Magia natural",
            "Transformação",
            "Cura",
            "Controle elemental"
        ]
    },


    /* =====================================
       DUELISTA
    ===================================== */

    Duelista: {
        nome: "Duelista",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Especialista em combates individuais, esquivas e contra-ataques.",
        caracteristicas: [
            "Combate individual",
            "Precisão",
            "Esquiva",
            "Contra-ataques"
        ]
    }

};


/* =========================================
   FUNÇÕES DO SISTEMA
========================================= */

/*
   Retorna todas as classes disponíveis.
*/

function obterClasses() {
    return Object.values(RPGClasses);
}


/*
   Procura uma classe pelo nome.
*/

function obterClasse(nome) {

    if (!nome) {
        return null;
    }

    return RPGClasses[nome] || null;
}


/*
   Retorna apenas os nomes das classes.
*/

function obterNomesClasses() {
    return Object.keys(RPGClasses);
}


/*
   Verifica se uma classe existe.
*/

function classeExiste(nome) {
    return Object.prototype.hasOwnProperty.call(
        RPGClasses,
        nome
    );
}


/* =========================================
   DISPONIBILIZAR GLOBALMENTE
========================================= */

window.RPGClasses = RPGClasses;
window.obterClasses = obterClasses;
window.obterClasse = obterClasse;
window.obterNomesClasses = obterNomesClasses;
window.classeExiste = classeExiste;
