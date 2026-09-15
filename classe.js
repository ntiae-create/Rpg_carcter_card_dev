"use strict";

/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: CLASSES
========================================================= */


/* =========================================================
   LISTA DE CLASSES
========================================================= */

const RPGClasses = {

    Assassino: {
        nome: "Assassino",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Especialista em furtividade, velocidade e ataques precisos.",
        caracteristicas: [
            "Alto dano em alvos isolados",
            "Grande mobilidade",
            "Ataques críticos"
        ]
    },

    Berserk: {
        nome: "Berserk",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Guerreiro que transforma sua fúria em força destrutiva.",
        caracteristicas: [
            "Dano aumenta sob pressão",
            "Grande força física",
            "Estilo agressivo"
        ]
    },

    Guerreiro: {
        nome: "Guerreiro",
        funcao: "Dano / Defesa",
        dificuldade: "Média",
        descricao:
            "Combatente versátil especializado em combate direto.",
        caracteristicas: [
            "Equilíbrio entre ataque e defesa",
            "Boa resistência",
            "Combate corpo a corpo"
        ]
    },

    Tank: {
        nome: "Tank",
        funcao: "Defesa",
        dificuldade: "Média",
        descricao:
            "Especialista em resistência e proteção dos aliados.",
        caracteristicas: [
            "Alta defesa",
            "Grande resistência",
            "Proteção de aliados"
        ]
    },

    Feiticeiro: {
        nome: "Feiticeiro",
        funcao: "Dano mágico",
        dificuldade: "Alta",
        descricao:
            "Manipulador de magia poderosa através de talento natural.",
        caracteristicas: [
            "Grande poder mágico",
            "Magias destrutivas",
            "Alta flexibilidade mágica"
        ]
    },

    Mago: {
        nome: "Mago",
        funcao: "Dano mágico",
        dificuldade: "Alta",
        descricao:
            "Estudioso das artes arcanas e especialista em diversos tipos de magia.",
        caracteristicas: [
            "Grande variedade de magias",
            "Alto ataque mágico",
            "Controle do campo"
        ]
    },

    Bufao: {
        nome: "Bufão",
        funcao: "Suporte / Controle",
        dificuldade: "Alta",
        descricao:
            "Classe imprevisível que utiliza truques, confusão e efeitos incomuns.",
        caracteristicas: [
            "Efeitos imprevisíveis",
            "Controle de inimigos",
            "Suporte através de habilidades especiais"
        ]
    },

    Alquimista: {
        nome: "Alquimista",
        funcao: "Suporte",
        dificuldade: "Alta",
        descricao:
            "Especialista na criação e utilização de poções, compostos e preparados.",
        caracteristicas: [
            "Criação de poções",
            "Preparação de recursos",
            "Grande utilidade"
        ]
    },

    Arqueiro: {
        nome: "Arqueiro",
        funcao: "Dano à distância",
        dificuldade: "Média",
        descricao:
            "Especialista em ataques precisos a longa distância.",
        caracteristicas: [
            "Grande alcance",
            "Alta precisão",
            "Dano consistente"
        ]
    },

    Lanceiro: {
        nome: "Lanceiro",
        funcao: "Dano / Controle",
        dificuldade: "Média",
        descricao:
            "Combatente especializado em lanças e controle de distância.",
        caracteristicas: [
            "Grande alcance corpo a corpo",
            "Controle de espaço",
            "Ataques precisos"
        ]
    },

    Cacador: {
        nome: "Caçador",
        funcao: "Dano / Rastreamento",
        dificuldade: "Média",
        descricao:
            "Especialista em rastreamento, sobrevivência e caça.",
        caracteristicas: [
            "Rastreamento",
            "Sobrevivência",
            "Dano contra alvos específicos"
        ]
    },

    Clerigo: {
        nome: "Clérigo",
        funcao: "Buffer / Healer",
        dificuldade: "Média",
        descricao:
            "Usuário de poderes sagrados capaz de curar e fortalecer aliados.",
        caracteristicas: [
            "Cura",
            "Fortalecimento de aliados",
            "Proteção espiritual"
        ]
    },

    Necromante: {
        nome: "Necromante",
        funcao: "Dano / Invocação",
        dificuldade: "Alta",
        descricao:
            "Manipulador das forças da morte e das energias sombrias.",
        caracteristicas: [
            "Magia sombria",
            "Manipulação de mortos",
            "Invocações"
        ]
    },

    Ceifador: {
        nome: "Ceifador",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Combatente sombrio especializado em ataques devastadores.",
        caracteristicas: [
            "Alto dano",
            "Ataques de área",
            "Estilo sombrio"
        ]
    },

    Monge: {
        nome: "Monge",
        funcao: "Dano / Mobilidade",
        dificuldade: "Alta",
        descricao:
            "Mestre do combate corporal e do controle da própria energia.",
        caracteristicas: [
            "Alta mobilidade",
            "Combate desarmado",
            "Ataques rápidos"
        ]
    },

    Bardo: {
        nome: "Bardo",
        funcao: "Suporte / Controle",
        dificuldade: "Média",
        descricao:
            "Artista capaz de alterar o campo de batalha através de música e inspiração.",
        caracteristicas: [
            "Buffs",
            "Debuffs",
            "Controle através de habilidades musicais"
        ]
    },

    Invocador: {
        nome: "Invocador",
        funcao: "Invocação",
        dificuldade: "Alta",
        descricao:
            "Especialista em chamar criaturas e entidades para lutar ao seu lado.",
        caracteristicas: [
            "Múltiplas invocações",
            "Controle de criaturas",
            "Grande versatilidade"
        ]
    },

    Oraculo: {
        nome: "Oráculo",
        funcao: "Suporte / Controle",
        dificuldade: "Alta",
        descricao:
            "Usuário de poderes relacionados à previsão, destino e percepção.",
        caracteristicas: [
            "Previsão",
            "Suporte estratégico",
            "Manipulação de possibilidades"
        ]
    },

    Druida: {
        nome: "Druida",
        funcao: "Suporte / Magia",
        dificuldade: "Média",
        descricao:
            "Guardião da natureza capaz de utilizar forças naturais e espirituais.",
        caracteristicas: [
            "Magia natural",
            "Controle de ambiente",
            "Suporte"
        ]
    },

    Duelista: {
        nome: "Duelista",
        funcao: "Dano",
        dificuldade: "Alta",
        descricao:
            "Especialista em combate individual, precisão e velocidade.",
        caracteristicas: [
            "Combate um contra um",
            "Alta velocidade",
            "Ataques precisos"
        ]
    }

};


/* =========================================================
   FUNÇÕES PÚBLICAS
========================================================= */

function obterClasses() {

    return Object.values(RPGClasses);

}


function obterClasse(nome) {

    if (!nome) {
        return null;
    }

    return RPGClasses[nome] || null;

}


function obterNomesClasses() {

    return Object.keys(RPGClasses);

}


function classeExiste(nome) {

    return Object.prototype.hasOwnProperty.call(
        RPGClasses,
        nome
    );

}


/* =========================================================
   PREENCHER SELECT DE CLASSES
========================================================= */

function carregarClassesNoSelect() {

    const select =
        document.getElementById(
            "character-class-select"
        );


    if (!select) {

        return;

    }


    /*
       Guardamos temporariamente o valor
       que o personagem já possuía.
    */

    const valorAtual =
        select.value;


    /*
       Remove TODAS as opções antigas.
    */

    select.innerHTML = "";


    /*
       Opção inicial.
    */

    const primeiraOpcao =
        document.createElement("option");

    primeiraOpcao.value = "";

    primeiraOpcao.textContent =
        "Selecione uma classe";

    select.appendChild(
        primeiraOpcao
    );


    /*
       Adiciona as 20 classes do RPGClasses.
    */

    Object.values(RPGClasses).forEach(
        classe => {

            const option =
                document.createElement(
                    "option"
                );

            /*
               O value usa a chave do objeto.
               Exemplo:
               Assassino
               Berserk
               Cacador
               etc.
            */

            const chave =
                Object.keys(RPGClasses).find(
                    key =>
                        RPGClasses[key] === classe
                );

            option.value =
                chave;

            option.textContent =
                classe.nome;

            select.appendChild(
                option
            );

        }
    );


    /*
       Se o personagem já tinha uma classe,
       mantém essa seleção.
    */

    if (
        valorAtual &&
        RPGClasses[valorAtual]
    ) {

        select.value =
            valorAtual;

    }

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function iniciarClasses() {

    carregarClassesNoSelect();

}


/*
   O script foi colocado antes do character.js,
   então aguardamos o HTML estar pronto.
*/

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarClasses
    );

} else {

    iniciarClasses();

}


/* =========================================================
   API GLOBAL
========================================================= */

window.RPGClasses =
    RPGClasses;

window.obterClasses =
    obterClasses;

window.obterClasse =
    obterClasse;

window.obterNomesClasses =
    obterNomesClasses;

window.classeExiste =
    classeExiste;

window.carregarClassesNoSelect =
    carregarClassesNoSelect;
