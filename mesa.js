/* =========================================================
   MESA RPG ONLINE
   mesa.js
   PARTE 1/3
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       ESTADO PRINCIPAL
    ===================================================== */

    const mesa = {
        campanha: null,
        mestre: null,
        jogadores: [],

        maxJogadores: 8,

        modo: "interface",
        telaAtual: "inicio",

        cte: null,
        cteTimer: null,

        combate: null,
        boss: null,
        bossTimer: null,

        mapa: {
            x: 0,
            y: 0,
            escala: 1
        },

        configuracoes: {
            mostrarChat: true,
            mostrarCards: true,
            animacoes: true
        },

        inicializada: false,

        elementos: {}
    };


    /* =====================================================
       ESTADO GLOBAL
    ===================================================== */

    window.rpgMesa = mesa;


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function qs(seletor, raiz = document) {
        return raiz.querySelector(seletor);
    }

    function qsa(seletor, raiz = document) {
        return [...raiz.querySelectorAll(seletor)];
    }

    function criarElemento(tag, classes = [], texto = "") {
        const elemento = document.createElement(tag);

        if (Array.isArray(classes)) {
            elemento.classList.add(...classes.filter(Boolean));
        } else if (classes) {
            elemento.className = classes;
        }

        if (texto !== "") {
            elemento.textContent = texto;
        }

        return elemento;
    }

    function limparElemento(elemento) {
        if (!elemento) return;

        while (elemento.firstChild) {
            elemento.removeChild(elemento.firstChild);
        }
    }

    function obterNome(objeto, padrao = "Jogador") {
        if (!objeto) return padrao;

        return (
            objeto.nome ||
            objeto.name ||
            objeto.username ||
            objeto.display_name ||
            objeto.displayName ||
            objeto.nickname ||
            padrao
        );
    }

    function obterId(objeto) {
        if (!objeto) return null;

        return (
            objeto.id ||
            objeto.user_id ||
            objeto.userId ||
            objeto.uid ||
            objeto.player_id ||
            null
        );
    }

    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    window.escaparHTML = escaparHTML;


    /* =====================================================
       USUÁRIO
    ===================================================== */

    function obterUsuarioAtual() {
        return window.rpgAuth?.user ||
               window.rpgAuth?.usuario ||
               window.usuarioAtual ||
               null;
    }

    function usuarioEhMestre() {
        const usuario = obterUsuarioAtual();

        if (!usuario) return false;

        if (window.rpgAuth?.isMaster === true) {
            return true;
        }

        const idUsuario = obterId(usuario);

        const idMestre =
            mesa.campanha?.master_id ||
            mesa.campanha?.masterId ||
            mesa.campanha?.mestre_id ||
            mesa.campanha?.mestreId;

        if (idUsuario && idMestre) {
            return String(idUsuario) === String(idMestre);
        }

        return false;
    }

    window.usuarioEhMestre = usuarioEhMestre;


    /* =====================================================
       NOME DO MESTRE
    ===================================================== */

    function obterNomeMestre() {
        if (mesa.mestre) {
            return obterNome(mesa.mestre, "Mestre");
        }

        if (mesa.campanha) {
            return (
                mesa.campanha.master_name ||
                mesa.campanha.masterName ||
                mesa.campanha.mestre_nome ||
                mesa.campanha.mestreNome ||
                "Mestre"
            );
        }

        return "Mestre";
    }

    window.obterNomeMestre = obterNomeMestre;


    /* =====================================================
       CAMPANHA
    ===================================================== */

    async function obterCampanha() {
        try {
            if (typeof window.obterCampanhaAtiva === "function") {
                const campanha = await window.obterCampanhaAtiva();

                if (campanha) {
                    return campanha;
                }
            }
        } catch (erro) {
            console.warn("Não foi possível obter campanha ativa:", erro);
        }

        if (window.rpgAuth?.campaign) {
            return window.rpgAuth.campaign;
        }

        if (window.rpgAuth?.campanha) {
            return window.rpgAuth.campanha;
        }

        return null;
    }


    /* =====================================================
       JOGADORES
    ===================================================== */

    async function carregarJogadoresMesa() {
        try {
            const campanha = mesa.campanha;

            if (!campanha) {
                mesa.jogadores = [];
                return;
            }

            const jogadores =
                campanha.players ||
                campanha.jogadores ||
                campanha.members ||
                campanha.membros ||
                campanha.participantes ||
                [];

            mesa.jogadores = Array.isArray(jogadores)
                ? jogadores.slice(0, mesa.maxJogadores)
                : [];

        } catch (erro) {
            console.error("Erro ao carregar jogadores:", erro);
            mesa.jogadores = [];
        }
    }

    window.carregarJogadoresMesa = carregarJogadoresMesa;


    function atualizarListaJogadores() {
        renderizarAssentos();
        renderizarCardsJogadores();
    }

    window.atualizarListaJogadores = atualizarListaJogadores;


    /* =====================================================
       LOCALIZAR PAINEL
    ===================================================== */

    function obterPainelMesa() {
        let painel = document.getElementById("online-table-panel");

        if (painel) {
            return painel;
        }

        painel = criarElemento("section");
        painel.id = "online-table-panel";

        document.body.appendChild(painel);

        return painel;
    }


    /* =====================================================
       CRIAÇÃO DA INTERFACE
    ===================================================== */

    function criarInterfaceMesa() {
        const painel = obterPainelMesa();

        limparElemento(painel);

        const header = criarElemento("header", ["online-table-header"]);

        const tituloArea = criarElemento("div");

        const label = criarElemento(
            "span",
            ["online-table-label"],
            "MESA ONLINE"
        );

        const titulo = criarElemento(
            "h2",
            [],
            mesa.campanha?.name ||
            mesa.campanha?.nome ||
            "Mesa de RPG"
        );

        tituloArea.appendChild(label);
        tituloArea.appendChild(titulo);

        const status = criarElemento(
            "div",
            ["online-table-status"],
            "🟢 INTERFACE"
        );

        status.id = "mesa-status";

        header.appendChild(tituloArea);
        header.appendChild(status);

        painel.appendChild(header);


        /* -----------------------------------------------
           MESA
        ------------------------------------------------ */

        const rpgTable = criarElemento("div", ["rpg-table"]);
        rpgTable.id = "rpg-table";


        /* -----------------------------------------------
           MESTRE
        ------------------------------------------------ */

        const mestre = criarElemento("div", ["table-head"]);

        const mestreSmall = criarElemento(
            "small",
            [],
            "👑 MESTRE"
        );

        const mestreNome = criarElemento(
            "strong",
            [],
            obterNomeMestre()
        );

        mestre.appendChild(mestreSmall);
        mestre.appendChild(mestreNome);

        rpgTable.appendChild(mestre);


        /* -----------------------------------------------
           LADO ESQUERDO
        ------------------------------------------------ */

        const ladoEsquerdo = criarElemento(
            "div",
            ["table-side", "left"]
        );

        ladoEsquerdo.id = "mesa-seats-left";

        for (let i = 1; i <= 4; i++) {
            ladoEsquerdo.appendChild(criarAssento(i));
        }

        rpgTable.appendChild(ladoEsquerdo);


        /* -----------------------------------------------
           LADO DIREITO
        ------------------------------------------------ */

        const ladoDireito = criarElemento(
            "div",
            ["table-side", "right"]
        );

        ladoDireito.id = "mesa-seats-right";

        for (let i = 5; i <= 8; i++) {
            ladoDireito.appendChild(criarAssento(i));
        }

        rpgTable.appendChild(ladoDireito);


        /* -----------------------------------------------
           CENTRO
        ------------------------------------------------ */

        const centro = criarElemento("div", ["table-center"]);
        centro.id = "mesa-center";

        const tela = criarElemento("div", ["mesa-screen"]);
        tela.id = "mesa-screen";

        centro.appendChild(tela);

        rpgTable.appendChild(centro);


        /* -----------------------------------------------
           MESA
        ------------------------------------------------ */

        painel.appendChild(rpgTable);


        /* -----------------------------------------------
           CARDS
        ------------------------------------------------ */

        const cardsArea = criarElemento(
            "section",
            ["online-table-players"]
        );

        cardsArea.id = "mesa-players-area";

        const tituloJogadores = criarElemento(
            "div",
            ["online-table-section-title"]
        );

        const textoJogadores = criarElemento(
            "span",
            [],
            "JOGADORES"
        );

        const contador = criarElemento(
            "strong",
            [],
            `0/${mesa.maxJogadores}`
        );

        contador.id = "mesa-player-count";

        tituloJogadores.appendChild(textoJogadores);
        tituloJogadores.appendChild(contador);

        cardsArea.appendChild(tituloJogadores);

        const cards = criarElemento(
            "div",
            ["mesa-player-cards"]
        );

        cards.id = "mesa-player-cards";

        cardsArea.appendChild(cards);

        painel.appendChild(cardsArea);


        /* -----------------------------------------------
           NOTIFICAÇÃO
        ------------------------------------------------ */

        criarSistemaNotificacao();


        /* -----------------------------------------------
           ELEMENTOS
        ------------------------------------------------ */

        mesa.elementos = {
            painel,
            rpgTable,
            centro,
            tela,
            status,
            cardsArea,
            cards,
            mestreNome
        };


        /* -----------------------------------------------
           TELA INICIAL
        ------------------------------------------------ */

        renderizarTelaInicial();

        atualizarListaJogadores();
    }


    /* =====================================================
       ASSENTO
    ===================================================== */

    function criarAssento(numero) {
        const assento = criarElemento(
            "div",
            ["table-seat"]
        );

        assento.dataset.seat = String(numero);

        const conteudo = criarElemento(
            "div",
            ["table-seat-content"]
        );

        const icone = criarElemento(
            "div",
            ["table-seat-icon"],
            "👤"
        );

        const nome = criarElemento(
            "div",
            ["table-seat-name"],
            "Aguardando jogador"
        );

        const numeroElemento = criarElemento(
            "div",
            ["table-seat-number"],
            String(numero)
        );

        conteudo.appendChild(icone);
        conteudo.appendChild(nome);

        assento.appendChild(numeroElemento);
        assento.appendChild(conteudo);

        assento.addEventListener("click", () => {
            const jogador = mesa.jogadores[numero - 1];

            if (jogador) {
                abrirJogador(jogador);
            }
        });

        return assento;
    }


    /* =====================================================
       RENDERIZAR ASSENTOS
    ===================================================== */

    function renderizarAssentos() {
        const assentos = qsa(
            "#rpg-table .table-seat"
        );

        assentos.forEach((assento, index) => {
            const jogador = mesa.jogadores[index];

            const nome = qs(
                ".table-seat-name",
                assento
            );

            const icone = qs(
                ".table-seat-icon",
                assento
            );

            if (!jogador) {
                if (nome) {
                    nome.textContent = "Aguardando jogador";
                }

                if (icone) {
                    icone.textContent = "👤";
                }

                assento.classList.remove("occupied");
                assento.removeAttribute("data-player-id");

                return;
            }

            const nomeJogador = obterNome(
                jogador,
                "Jogador"
            );

            if (nome) {
                nome.textContent = nomeJogador;
            }

            if (icone) {
                icone.textContent =
                    jogador.avatar ||
                    jogador.icone ||
                    "🧙";
            }

            assento.classList.add("occupied");

            const id = obterId(jogador);

            if (id) {
                assento.dataset.playerId = String(id);
            }
        });

        const contador = qs("#mesa-player-count");

        if (contador) {
            contador.textContent =
                `${mesa.jogadores.length}/${mesa.maxJogadores}`;
        }
    }


    /* =====================================================
       CARDS DOS JOGADORES
    ===================================================== */

    function renderizarCardsJogadores() {
        const container = mesa.elementos.cards;

        if (!container) return;

        limparElemento(container);

        if (!mesa.jogadores.length) {
            const vazio = criarElemento(
                "div",
                ["online-table-empty"],
                "Nenhum jogador conectado."
            );

            container.appendChild(vazio);
            return;
        }

        mesa.jogadores.forEach((jogador, index) => {
            const card = criarElemento(
                "div",
                ["mesa-player-card"]
            );

            card.dataset.playerIndex = String(index);

            const nome = criarElemento(
                "strong",
                [],
                obterNome(jogador, `Jogador ${index + 1}`)
            );

            const personagem = criarElemento(
                "small",
                [],
                obterNomePersonagem(jogador)
            );

            const status = criarElemento(
                "small",
                [],
                obterStatusResumo(jogador)
            );

            card.appendChild(nome);
            card.appendChild(personagem);
            card.appendChild(status);

            card.addEventListener("click", () => {
                abrirJogador(jogador);
            });

            container.appendChild(card);
        });
    }


    function obterNomePersonagem(jogador) {
        if (!jogador) return "Sem personagem";

        return (
            jogador.character_name ||
            jogador.characterName ||
            jogador.personagem_nome ||
            jogador.personagemNome ||
            jogador.character?.name ||
            jogador.personagem?.nome ||
            "Sem personagem"
        );
    }


    function obterStatusResumo(jogador) {
        const status =
            jogador.status ||
            jogador.character?.status ||
            jogador.personagem?.status;

        if (!status) {
            return "Status disponível";
        }

        if (typeof status === "string") {
            return status;
        }

        const hp =
            status.hp ??
            status.vida ??
            status.health;

        const maxHp =
            status.maxHp ??
            status.max_hp ??
            status.vidaMaxima;

        if (hp != null && maxHp != null) {
            return `HP ${hp}/${maxHp}`;
        }

        return "Status disponível";
    }


    /* =====================================================
       TELA INICIAL
    ===================================================== */

    function renderizarTelaInicial() {
        const tela = mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        const icone = criarElemento(
            "div",
            [],
            "🎲"
        );

        icone.style.fontSize = "42px";

        const titulo = criarElemento(
            "h3",
            [],
            "MESA DE RPG"
        );

        const texto = criarElemento(
            "p",
            [],
            "Aguardando uma ação do Mestre ou a escolha de um módulo."
        );

        tela.appendChild(icone);
        tela.appendChild(titulo);
        tela.appendChild(texto);

        criarBotoesModulos(tela);

        mesa.telaAtual = "inicio";
    }


    /* =====================================================
       BOTÕES DE MÓDULOS
    ===================================================== */

    function criarBotoesModulos(container) {
        const area = criarElemento(
            "div",
            ["table-modules"]
        );

        const modulos = [
            ["🎭", "Personagem", "character"],
            ["❤️", "Status", "status"],
            ["✨", "Afinidade", "affinity"],
            ["🎒", "Inventário", "inventory"],
            ["🗺️", "Mapa", "map"],
            ["⚔️", "Combate", "combat"],
            ["⚡", "CTE", "cte"],
            ["💬", "Interface", "interface"]
        ];

        modulos.forEach(([icone, nome, id]) => {
            const botao = criarElemento(
                "button",
                ["table-module"]
            );

            botao.type = "button";

            const span = criarElemento(
                "span",
                [],
                icone
            );

            const small = criarElemento(
                "small",
                [],
                nome
            );

            botao.appendChild(span);
            botao.appendChild(small);

            botao.addEventListener("click", () => {
                abrirModulo(id);
            });

            area.appendChild(botao);
        });

        container.appendChild(area);
    }


    /* =====================================================
       ABRIR MÓDULO
    ===================================================== */

    function abrirModulo(modulo) {
        if (!mesa.elementos.tela) return;

        switch (modulo) {
            case "character":
                renderizarPersonagem();
                break;

            case "status":
                renderizarStatus();
                break;

            case "affinity":
                renderizarAfinidade();
                break;

            case "inventory":
                renderizarInventario();
                break;

            case "map":
                renderizarMapa();
                definirModo("map");
                break;

            case "combat":
                renderizarCombate();
                definirModo("combat");
                break;

            case "cte":
                renderizarCTE();
                definirModo("cte");
                break;

            case "interface":
                renderizarInterface();
                definirModo("interface");
                break;

            case "players":
                renderizarJogadores();
                break;

            case "needs":
                renderizarNecessidades();
                break;

            case "help":
                renderizarAjuda();
                break;

            default:
                renderizarTelaInicial();
                definirModo("interface");
        }

        mesa.telaAtual = modulo;
    }

    window.abrirModuloMesa = abrirModulo;
    window.rpgMesa.abrirModulo = abrirModulo;


    /* =====================================================
       MODO DA MESA
    ===================================================== */

    function definirModo(modo) {
        const painel = mesa.elementos.painel;

        if (!painel) return;

        const modos = [
            "mesa-state-interface",
            "mesa-state-combat",
            "mesa-state-cte",
            "mesa-state-map",
            "mesa-state-boss",
            "mesa-state-campaign"
        ];

        painel.classList.remove(...modos);

        let classe = "mesa-state-interface";
        let texto = "🟢 INTERFACE";

        switch (modo) {
            case "combat":
                classe = "mesa-state-combat";
                texto = "🔴 COMBATE";
                break;

            case "cte":
                classe = "mesa-state-cte";
                texto = "🟡 CTE";
                break;

            case "map":
                classe = "mesa-state-map";
                texto = "🔵 MAPA";
                break;

            case "boss":
                classe = "mesa-state-boss";
                texto = "🚨 BOSS";
                break;

            case "campaign":
                classe = "mesa-state-campaign";
                texto = "🟢 CAMPANHA";
                break;

            default:
                classe = "mesa-state-interface";
                texto = "🟢 INTERFACE";
        }

        painel.classList.add(classe);

        if (mesa.elementos.status) {
            mesa.elementos.status.textContent = texto;
        }

        mesa.modo = modo;

        window.dispatchEvent(
            new CustomEvent("rpg:mesa:modo", {
                detail: { modo }
            })
        );
    }

    window.definirModoMesa = definirModo;
    window.rpgMesa.definirModo = definirModo;


    /* =====================================================
       NOTIFICAÇÕES
    ===================================================== */

    function criarSistemaNotificacao() {
        let notificacao = document.getElementById(
            "mesa-notificacao"
        );

        if (notificacao) return;

        notificacao = criarElemento(
            "div",
            []
        );

        notificacao.id = "mesa-notificacao";

        notificacao.hidden = true;

        document.body.appendChild(notificacao);
    }

    function notificar(mensagem, duracao = 2500) {
        let notificacao = document.getElementById(
            "mesa-notificacao"
        );

        if (!notificacao) {
            criarSistemaNotificacao();

            notificacao = document.getElementById(
                "mesa-notificacao"
            );
        }

        notificacao.textContent = mensagem;
        notificacao.hidden = false;

        clearTimeout(
            notificacao._timer
        );

        notificacao._timer = setTimeout(() => {
            notificacao.hidden = true;
        }, duracao);
    }

    window.notificarMesa = notificar;


    /* =====================================================
       VOLTAR
    ===================================================== */

    function criarBotaoVoltar(container) {
        const voltar = criarElemento(
            "button",
            [],
            "← Voltar"
        );

        voltar.type = "button";

        voltar.style.marginBottom = "12px";

        voltar.addEventListener("click", () => {
            definirModo("interface");
            renderizarTelaInicial();
        });

        container.appendChild(voltar);

        return voltar;
    }


    /* =====================================================
       PERSONAGEM
    ===================================================== */

    function renderizarPersonagem() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        const titulo = criarElemento(
            "h3",
            [],
            "🎭 PERSONAGEM"
        );

        tela.appendChild(titulo);

        const jogadores = mesa.jogadores;

        if (!jogadores.length) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhum personagem disponível."
                )
            );
            return;
        }

        jogadores.forEach((jogador, index) => {
            const bloco = criarElemento("div");

            bloco.style.width = "100%";
            bloco.style.maxWidth = "600px";
            bloco.style.padding = "12px";
            bloco.style.marginBottom = "8px";
            bloco.style.border = "1px solid rgba(134,239,172,.15)";
            bloco.style.borderRadius = "12px";

            const nome = criarElemento(
                "strong",
                [],
                obterNomePersonagem(jogador)
            );

            const jogadorNome = criarElemento(
                "small",
                [],
                obterNome(jogador, `Jogador ${index + 1}`)
            );

            const raca = obterCampoPersonagem(
                jogador,
                ["race", "raca", "raça"]
            );

            const classe = obterCampoPersonagem(
                jogador,
                ["class", "classe"]
            );

            const afinidade = obterCampoPersonagem(
                jogador,
                ["affinity", "afinidade"]
            );

            bloco.appendChild(nome);
            bloco.appendChild(document.createElement("br"));
            bloco.appendChild(jogadorNome);

            bloco.appendChild(
                criarElemento(
                    "p",
                    [],
                    `Raça: ${raca || "—"}`
                )
            );

            bloco.appendChild(
                criarElemento(
                    "p",
                    [],
                    `Classe: ${classe || "—"}`
                )
            );

            bloco.appendChild(
                criarElemento(
                    "p",
                    [],
                    `Afinidade: ${afinidade || "—"}`
                )
            );

            tela.appendChild(bloco);
        });
    }


    function obterCampoPersonagem(jogador, campos) {
        for (const campo of campos) {
            if (jogador?.[campo] != null) {
                return jogador[campo];
            }

            if (jogador?.character?.[campo] != null) {
                return jogador.character[campo];
            }

            if (jogador?.personagem?.[campo] != null) {
                return jogador.personagem[campo];
            }
        }

        return "";
    }


    /* =====================================================
       STATUS
    ===================================================== */

    function renderizarStatus() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "❤️ STATUS"
            )
        );

        if (!mesa.jogadores.length) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhum jogador disponível."
                )
            );
            return;
        }

        mesa.jogadores.forEach((jogador, index) => {
            const bloco = criarElemento("div");

            bloco.style.width = "100%";
            bloco.style.maxWidth = "600px";
            bloco.style.padding = "12px";
            bloco.style.marginBottom = "8px";
            bloco.style.border = "1px solid rgba(255,255,255,.1)";
            bloco.style.borderRadius = "12px";

            const status =
                jogador.status ||
                jogador.character?.status ||
                jogador.personagem?.status ||
                {};

            bloco.appendChild(
                criarElemento(
                    "strong",
                    [],
                    obterNomePersonagem(jogador)
                )
            );

            const hp =
                status.hp ??
                status.vida ??
                status.health ??
                "—";

            const maxHp =
                status.maxHp ??
                status.max_hp ??
                status.vidaMaxima ??
                status.maxHealth ??
                "—";

            const mana =
                status.mana ??
                status.mp ??
                "—";

            const energia =
                status.energy ??
                status.energia ??
                "—";

            bloco.appendChild(
                criarElemento(
                    "p",
                    [],
                    `❤️ Vida: ${hp}/${maxHp}`
                )
            );

            bloco.appendChild(
                criarElemento(
                    "p",
                    [],
                    `💧 Mana: ${mana}`
                )
            );

            bloco.appendChild(
                criarElemento(
                    "p",
                    [],
                    `⚡ Energia: ${energia}`
                )
            );

            tela.appendChild(bloco);
        });
    }


    /* =====================================================
       AFINIDADE
    ===================================================== */

    function renderizarAfinidade() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "✨ AFINIDADES"
            )
        );

        mesa.jogadores.forEach((jogador, index) => {
            const afinidade = obterCampoPersonagem(
                jogador,
                ["affinity", "afinidade"]
            );

            const bloco = criarElemento(
                "div",
                [],
                `${obterNomePersonagem(jogador)} — ${afinidade || "Sem afinidade"}`
            );

            bloco.style.width = "100%";
            bloco.style.maxWidth = "500px";
            bloco.style.padding = "12px";
            bloco.style.marginBottom = "8px";
            bloco.style.border = "1px solid rgba(255,255,255,.1)";
            bloco.style.borderRadius = "10px";

            tela.appendChild(bloco);
        });

        if (!mesa.jogadores.length) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhum jogador disponível."
                )
            );
        }
    }


    /* =====================================================
       INVENTÁRIO
    ===================================================== */

    function renderizarInventario() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "🎒 INVENTÁRIO"
            )
        );

        if (!mesa.jogadores.length) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhum inventário disponível."
                )
            );
            return;
        }

        mesa.jogadores.forEach((jogador) => {
            const bloco = criarElemento("div");

            bloco.style.width = "100%";
            bloco.style.maxWidth = "600px";
            bloco.style.padding = "12px";
            bloco.style.marginBottom = "10px";
            bloco.style.border = "1px solid rgba(255,255,255,.1)";
            bloco.style.borderRadius = "12px";

            bloco.appendChild(
                criarElemento(
                    "strong",
                    [],
                    obterNomePersonagem(jogador)
                )
            );

            const inventario =
                jogador.inventory ||
                jogador.inventario ||
                jogador.character?.inventory ||
                jogador.personagem?.inventario ||
                [];

            if (!Array.isArray(inventario) || !inventario.length) {
                bloco.appendChild(
                    criarElemento(
                        "p",
                        [],
                        "Inventário vazio."
                    )
                );
            } else {
                const lista = criarElemento("ul");

                inventario.forEach((item) => {
                    const li = criarElemento(
                        "li",
                        [],
                        typeof item === "string"
                            ? item
                            : `${item.name || item.nome || "Item"} × ${item.quantity || item.quantidade || 1}`
                    );

                    lista.appendChild(li);
                });

                bloco.appendChild(lista);
            }

            tela.appendChild(bloco);
        });
    }/* =========================================================
   MESA RPG ONLINE
   mesa.js
   PARTE 2/3
========================================================= */


    /* =====================================================
       INTERFACE
    ===================================================== */

    function renderizarInterface() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "💬 INTERFACE DA MESA"
            )
        );

        tela.appendChild(
            criarElemento(
                "p",
                [],
                "A Mesa está em modo de interação."
            )
        );

        const area = criarElemento(
            "div",
            ["table-modules"]
        );

        const botoes = [
            ["🎭", "Personagem", "character"],
            ["❤️", "Status", "status"],
            ["✨", "Afinidade", "affinity"],
            ["🎒", "Inventário", "inventory"],
            ["🗺️", "Mapa", "map"],
            ["⚔️", "Combate", "combat"],
            ["⚡", "CTE", "cte"],
            ["⚙️", "Configurações", "settings"]
        ];

        botoes.forEach(([icone, nome, modulo]) => {
            const botao = criarElemento(
                "button",
                ["table-module"]
            );

            botao.type = "button";

            botao.appendChild(
                criarElemento(
                    "span",
                    [],
                    icone
                )
            );

            botao.appendChild(
                criarElemento(
                    "small",
                    [],
                    nome
                )
            );

            botao.addEventListener("click", () => {
                if (modulo === "settings") {
                    abrirConfiguracoes();
                } else {
                    abrirModulo(modulo);
                }
            });

            area.appendChild(botao);
        });

        tela.appendChild(area);

        criarChat(tela);
    }


    /* =====================================================
       CHAT
    ===================================================== */

    function criarChat(container) {
        if (!mesa.configuracoes.mostrarChat) {
            return;
        }

        const chat = criarElemento(
            "div",
            ["table-chat"]
        );

        const titulo = criarElemento(
            "div",
            ["table-chat-title"],
            "💬 CHAT DA MESA"
        );

        const mensagens = criarElemento(
            "div",
            ["table-chat-messages"]
        );

        mensagens.id = "mesa-chat-messages";

        mensagens.appendChild(
            criarElemento(
                "div",
                [],
                "Nenhuma mensagem ainda."
            )
        );

        chat.appendChild(titulo);
        chat.appendChild(mensagens);

        container.appendChild(chat);
    }


    /* =====================================================
       NECESSIDADES
    ===================================================== */

    function renderizarNecessidades() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "📋 NECESSIDADES"
            )
        );

        tela.appendChild(
            criarElemento(
                "p",
                [],
                "Área de gerenciamento das necessidades dos personagens."
            )
        );

        mesa.jogadores.forEach((jogador) => {
            const bloco = criarElemento("div");

            bloco.style.width = "100%";
            bloco.style.maxWidth = "600px";
            bloco.style.padding = "12px";
            bloco.style.marginBottom = "8px";
            bloco.style.border = "1px solid rgba(255,255,255,.1)";
            bloco.style.borderRadius = "10px";

            bloco.appendChild(
                criarElemento(
                    "strong",
                    [],
                    obterNomePersonagem(jogador)
                )
            );

            const necessidades =
                jogador.needs ||
                jogador.necessidades ||
                jogador.character?.needs ||
                [];

            if (!Array.isArray(necessidades) || !necessidades.length) {
                bloco.appendChild(
                    criarElemento(
                        "p",
                        [],
                        "Nenhuma necessidade registrada."
                    )
                );
            } else {
                necessidades.forEach((necessidade) => {
                    bloco.appendChild(
                        criarElemento(
                            "p",
                            [],
                            `• ${typeof necessidade === "string"
                                ? necessidade
                                : necessidade.name || necessidade.nome || "Necessidade"}`
                        )
                    );
                });
            }

            tela.appendChild(bloco);
        });
    }


    /* =====================================================
       JOGADORES
    ===================================================== */

    function renderizarJogadores() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "👥 JOGADORES"
            )
        );

        if (!mesa.jogadores.length) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhum jogador conectado."
                )
            );
            return;
        }

        mesa.jogadores.forEach((jogador, index) => {
            const bloco = criarElemento("button");

            bloco.type = "button";

            bloco.style.width = "100%";
            bloco.style.maxWidth = "600px";
            bloco.style.padding = "14px";
            bloco.style.marginBottom = "8px";
            bloco.style.border = "1px solid rgba(134,239,172,.18)";
            bloco.style.borderRadius = "12px";
            bloco.style.background = "rgba(0,0,0,.18)";
            bloco.style.color = "inherit";
            bloco.style.textAlign = "left";

            bloco.appendChild(
                criarElemento(
                    "strong",
                    [],
                    `${index + 1}. ${obterNome(jogador)}`
                )
            );

            bloco.appendChild(
                criarElemento(
                    "small",
                    [],
                    obterNomePersonagem(jogador)
                )
            );

            bloco.addEventListener("click", () => {
                abrirJogador(jogador);
            });

            tela.appendChild(bloco);
        });
    }


    /* =====================================================
       JOGADOR SELECIONADO
    ===================================================== */

    function abrirJogador(jogador) {
        if (!jogador) return;

        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                `👤 ${obterNome(jogador)}`
            )
        );

        tela.appendChild(
            criarElemento(
                "p",
                [],
                `Personagem: ${obterNomePersonagem(jogador)}`
            )
        );

        const info = criarElemento("div");

        info.style.width = "100%";
        info.style.maxWidth = "600px";

        const campos = [
            ["Raça", ["race", "raca", "raça"]],
            ["Classe", ["class", "classe"]],
            ["Afinidade", ["affinity", "afinidade"]]
        ];

        campos.forEach(([nome, lista]) => {
            const valor = obterCampoPersonagem(
                jogador,
                lista
            );

            info.appendChild(
                criarElemento(
                    "p",
                    [],
                    `${nome}: ${valor || "—"}`
                )
            );
        });

        tela.appendChild(info);

        mesa.telaAtual = "player";
    }


    /* =====================================================
       COMBATE
    ===================================================== */

    function renderizarCombate(dados = null) {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "⚔️ COMBATE"
            )
        );

        const combate =
            dados ||
            mesa.combate;

        if (!combate) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    usuarioEhMestre()
                        ? "Nenhum combate ativo. O Mestre pode iniciar um combate pelas configurações."
                        : "Nenhum combate ativo no momento."
                )
            );

            if (usuarioEhMestre()) {
                const iniciar = criarElemento(
                    "button",
                    [],
                    "⚔️ Iniciar combate"
                );

                iniciar.type = "button";

                iniciar.addEventListener("click", () => {
                    iniciarCombate({
                        nome: "Encontro",
                        inimigos: []
                    });
                });

                tela.appendChild(iniciar);
            }

            return;
        }

        const nome = combate.nome ||
                     combate.title ||
                     combate.titulo ||
                     "Combate";

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                nome
            )
        );

        if (combate.descricao) {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    combate.descricao
                )
            );
        }

        const iniciativa = combate.iniciativa || [];

        if (Array.isArray(iniciativa) && iniciativa.length) {
            const lista = criarElemento("div");

            iniciativa.forEach((participante, index) => {
                const linha = criarElemento(
                    "div"
                );

                linha.style.padding = "8px";
                linha.style.marginBottom = "5px";
                linha.style.borderRadius = "8px";
                linha.style.background = "rgba(0,0,0,.2)";

                linha.textContent =
                    `${index + 1}. ${obterNome(participante, "Participante")}`;

                lista.appendChild(linha);
            });

            tela.appendChild(lista);
        }

        if (usuarioEhMestre()) {
            const finalizar = criarElemento(
                "button",
                [],
                "🏁 Encerrar combate"
            );

            finalizar.type = "button";

            finalizar.addEventListener("click", () => {
                finalizarCombate();
            });

            tela.appendChild(finalizar);
        }
    }


    /* =====================================================
       INICIAR COMBATE
    ===================================================== */

    function iniciarCombate(dados = {}) {
        mesa.combate = {
            ...dados,
            ativo: true,
            iniciadoEm: Date.now()
        };

        definirModo("combat");

        renderizarCombate();

        notificar("⚔️ Combate iniciado!");
    }

    window.rpgMesa.iniciarCombate = iniciarCombate;


    /* =====================================================
       FINALIZAR COMBATE
    ===================================================== */

    function finalizarCombate() {
        mesa.combate = null;

        definirModo("interface");

        renderizarInterface();

        notificar("🏁 Combate encerrado.");
    }

    window.rpgMesa.finalizarCombate = finalizarCombate;


    /* =====================================================
       CTE
    ===================================================== */

    function iniciarCTE(dados = {}) {
        pararTimerCTE();

        const opcoes = Array.isArray(dados.options)
            ? dados.options
            : Array.isArray(dados.opcoes)
                ? dados.opcoes
                : [];

        mesa.cte = {
            id: dados.id || `cte-${Date.now()}`,

            title:
                dados.title ||
                dados.titulo ||
                "EVENTO",

            description:
                dados.description ||
                dados.descricao ||
                "Escolha uma ação.",

            timeLimit: Number(
                dados.timeLimit ??
                dados.tempo ??
                dados.tempoLimite ??
                10
            ),

            remaining: Number(
                dados.timeLimit ??
                dados.tempo ??
                dados.tempoLimite ??
                10
            ),

            options: opcoes,

            active: true,

            startedAt: Date.now(),

            response: null
        };

        definirModo("cte");

        renderizarCTE();

        iniciarTimerCTE();

        notificar("⚡ CTE iniciado!");
    }

    window.rpgMesa.iniciarCTE = iniciarCTE;


    /* =====================================================
       RENDERIZAR CTE
    ===================================================== */

    function renderizarCTE() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        const cte = mesa.cte;

        if (!cte) {
            tela.appendChild(
                criarElemento(
                    "h3",
                    [],
                    "⚡ CTE"
                )
            );

            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhum evento rápido ativo."
                )
            );

            return;
        }

        const box = criarElemento(
            "div",
            ["mesa-cte"]
        );

        box.appendChild(
            criarElemento(
                "h2",
                [],
                `⚡ ${cte.title}`
            )
        );

        box.appendChild(
            criarElemento(
                "p",
                [],
                cte.description
            )
        );

        const timer = criarElemento(
            "div",
            ["mesa-cte-timer"],
            String(cte.remaining)
        );

        timer.id = "mesa-cte-timer";

        box.appendChild(timer);

        const opcoes = criarElemento(
            "div",
            ["mesa-cte-options"]
        );

        if (!cte.options.length) {
            opcoes.appendChild(
                criarElemento(
                    "p",
                    [],
                    "Nenhuma opção configurada."
                )
            );
        }

        cte.options.forEach((opcao, index) => {
            const id =
                opcao.id ||
                opcao.value ||
                String(index);

            const label =
                opcao.label ||
                opcao.nome ||
                opcao.text ||
                `Opção ${index + 1}`;

            const botao = criarElemento(
                "button",
                ["mesa-cte-option"]
            );

            botao.type = "button";
            botao.textContent = label;

            botao.addEventListener("click", () => {
                responderCTE(id);
            });

            opcoes.appendChild(botao);
        });

        box.appendChild(opcoes);

        tela.appendChild(box);
    }


    /* =====================================================
       TIMER DO CTE
    ===================================================== */

    function iniciarTimerCTE() {
        pararTimerCTE();

        if (!mesa.cte) return;

        mesa.cteTimer = setInterval(() => {
            if (!mesa.cte || !mesa.cte.active) {
                pararTimerCTE();
                return;
            }

            mesa.cte.remaining -= 1;

            const timer = document.getElementById(
                "mesa-cte-timer"
            );

            if (timer) {
                timer.textContent =
                    String(Math.max(0, mesa.cte.remaining));
            }

            if (mesa.cte.remaining <= 0) {
                finalizarCTE("tempo");
            }
        }, 1000);
    }


    function pararTimerCTE() {
        if (mesa.cteTimer) {
            clearInterval(mesa.cteTimer);
            mesa.cteTimer = null;
        }
    }


    /* =====================================================
       RESPONDER CTE
    ===================================================== */

    function responderCTE(id) {
        if (!mesa.cte || !mesa.cte.active) {
            return;
        }

        const opcao = mesa.cte.options.find(
            (item, index) =>
                String(
                    item.id ??
                    item.value ??
                    index
                ) === String(id)
        );

        mesa.cte.response = opcao || {
            id
        };

        mesa.cte.active = false;

        notificar(
            `⚡ Escolha: ${
                opcao?.label ||
                opcao?.nome ||
                opcao?.text ||
                id
            }`
        );

        finalizarCTE("resposta");
    }

    window.rpgMesa.responderCTE = responderCTE;


    /* =====================================================
       FINALIZAR CTE
    ===================================================== */

    function finalizarCTE(motivo = "finalizado") {
        pararTimerCTE();

        const resultado = mesa.cte
            ? {
                ...mesa.cte,
                motivo
            }
            : null;

        mesa.cte = null;

        definirModo("interface");

        renderizarInterface();

        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:cte-finalizado",
                {
                    detail: resultado
                }
            )
        );
    }

    window.rpgMesa.finalizarCTE = finalizarCTE;


    /* =====================================================
       MAPA
    ===================================================== */

    function renderizarMapa() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        const titulo = criarElemento(
            "h3",
            [],
            "🗺️ MAPA"
        );

        tela.appendChild(titulo);

        const mapa = criarElemento(
            "div",
            ["mesa-map"]
        );

        mapa.id = "mesa-map";

        const svg = criarMapaSVG();

        mapa.appendChild(svg);

        tela.appendChild(mapa);

        const controles = criarElemento(
            "div",
            ["mesa-map-controls"]
        );

        const menos = criarElemento(
            "button",
            [],
            "−"
        );

        const reset = criarElemento(
            "button",
            [],
            "↺"
        );

        const mais = criarElemento(
            "button",
            [],
            "+"
        );

        menos.type = "button";
        reset.type = "button";
        mais.type = "button";

        menos.addEventListener("click", () => {
            alterarZoomMapa(-0.1);
        });

        reset.addEventListener("click", () => {
            resetarMapa();
        });

        mais.addEventListener("click", () => {
            alterarZoomMapa(0.1);
        });

        controles.appendChild(menos);
        controles.appendChild(reset);
        controles.appendChild(mais);

        tela.appendChild(controles);

        configurarMapaInteracao(mapa, svg);
    }


    /* =====================================================
       SVG DO MAPA
    ===================================================== */

    function criarMapaSVG() {
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );

        svg.setAttribute(
            "viewBox",
            "0 0 1000 600"
        );

        svg.setAttribute(
            "preserveAspectRatio",
            "xMidYMid meet"
        );

        const fundo = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
        );

        fundo.setAttribute("x", "0");
        fundo.setAttribute("y", "0");
        fundo.setAttribute("width", "1000");
        fundo.setAttribute("height", "600");
        fundo.setAttribute("fill", "#07111d");

        svg.appendChild(fundo);


        const regioes = [
            {
                nome: "Região Norte",
                x: 80,
                y: 80,
                largura: 250,
                altura: 180
            },
            {
                nome: "Região Central",
                x: 370,
                y: 190,
                largura: 260,
                altura: 190
            },
            {
                nome: "Região Leste",
                x: 680,
                y: 70,
                largura: 220,
                altura: 210
            },
            {
                nome: "Região Sul",
                x: 170,
                y: 390,
                largura: 280,
                altura: 150
            },
            {
                nome: "Região Oeste",
                x: 570,
                y: 390,
                largura: 260,
                altura: 150
            }
        ];

        regioes.forEach((regiao) => {
            const rect = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
            );

            rect.setAttribute("x", regiao.x);
            rect.setAttribute("y", regiao.y);
            rect.setAttribute("width", regiao.largura);
            rect.setAttribute("height", regiao.altura);
            rect.setAttribute("rx", "18");
            rect.setAttribute(
                "fill",
                "rgba(34,197,94,.10)"
            );
            rect.setAttribute(
                "stroke",
                "rgba(134,239,172,.35)"
            );

            rect.style.cursor = "pointer";

            rect.addEventListener("click", () => {
                notificar(
                    `🗺️ ${regiao.nome}`
                );
            });

            svg.appendChild(rect);

            const texto = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

            texto.setAttribute(
                "x",
                regiao.x + regiao.largura / 2
            );

            texto.setAttribute(
                "y",
                regiao.y + regiao.altura / 2
            );

            texto.setAttribute(
                "text-anchor",
                "middle"
            );

            texto.setAttribute(
                "dominant-baseline",
                "middle"
            );

            texto.setAttribute(
                "fill",
                "#86efac"
            );

            texto.setAttribute(
                "font-size",
                "18"
            );

            texto.textContent = regiao.nome;

            svg.appendChild(texto);
        });


        /* -----------------------------------------------
           MARCADOR CENTRAL
        ------------------------------------------------ */

        const marcador = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

        marcador.setAttribute("cx", "500");
        marcador.setAttribute("cy", "285");
        marcador.setAttribute("r", "13");

        marcador.setAttribute(
            "fill",
            "#eab308"
        );

        marcador.setAttribute(
            "stroke",
            "#fff7ae"
        );

        marcador.setAttribute(
            "stroke-width",
            "3"
        );

        svg.appendChild(marcador);


        return svg;
    }


    /* =====================================================
       ZOOM MAPA
    ===================================================== */

    function alterarZoomMapa(valor) {
        mesa.mapa.escala = Math.max(
            .5,
            Math.min(
                3,
                mesa.mapa.escala + valor
            )
        );

        aplicarTransformacaoMapa();
    }


    function resetarMapa() {
        mesa.mapa.x = 0;
        mesa.mapa.y = 0;
        mesa.mapa.escala = 1;

        aplicarTransformacaoMapa();
    }


    function aplicarTransformacaoMapa() {
        const svg = qs("#mesa-map svg");

        if (!svg) return;

        svg.style.transform =
            `translate(${mesa.mapa.x}px, ${mesa.mapa.y}px) scale(${mesa.mapa.escala})`;

        svg.style.transformOrigin = "center";
    }


    /* =====================================================
       INTERAÇÃO MAPA
    ===================================================== */

    function configurarMapaInteracao(container, svg) {
        let arrastando = false;
        let inicioX = 0;
        let inicioY = 0;

        container.addEventListener(
            "pointerdown",
            (evento) => {
                arrastando = true;

                inicioX = evento.clientX -
                          mesa.mapa.x;

                inicioY = evento.clientY -
                          mesa.mapa.y;

                container.setPointerCapture(
                    evento.pointerId
                );
            }
        );

        container.addEventListener(
            "pointermove",
            (evento) => {
                if (!arrastando) return;

                mesa.mapa.x =
                    evento.clientX - inicioX;

                mesa.mapa.y =
                    evento.clientY - inicioY;

                aplicarTransformacaoMapa();
            }
        );

        container.addEventListener(
            "pointerup",
            () => {
                arrastando = false;
            }
        );

        container.addEventListener(
            "pointercancel",
            () => {
                arrastando = false;
            }
        );
    }


    /* =====================================================
       BOSS
    ===================================================== */

    function ativarBoss(nome = "BOSS") {
        limparBossAnterior();

        mesa.boss = {
            nome,
            ativo: true,
            iniciadoEm: Date.now()
        };

        definirModo("boss");

        const painel = mesa.elementos.painel;

        if (painel) {
            painel.classList.add(
                "mesa-boss-flash"
            );
        }

        criarAlertaBoss(nome);

        notificar(
            `🚨 BOSS: ${nome}`,
            4000
        );

        mesa.bossTimer = setTimeout(() => {
            finalizarBoss();
        }, 5000);
    }

    window.ativarBoss = ativarBoss;
    window.rpgMesa.alertarBoss = ativarBoss;


    /* =====================================================
       ALERTA BOSS
    ===================================================== */

    function criarAlertaBoss(nome) {
        const painel = mesa.elementos.painel;

        if (!painel) return;

        const overlay = criarElemento(
            "div",
            ["mesa-boss-alert"]
        );

        overlay.id = "mesa-boss-alert";

        const conteudo = criarElemento(
            "div",
            ["mesa-boss-alert-content"]
        );

        conteudo.appendChild(
            criarElemento(
                "h2",
                [],
                "🚨 BOSS"
            )
        );

        conteudo.appendChild(
            criarElemento(
                "strong",
                [],
                nome
            )
        );

        conteudo.appendChild(
            criarElemento(
                "p",
                [],
                "Uma presença poderosa entrou em cena."
            )
        );

        overlay.appendChild(conteudo);

        painel.appendChild(overlay);
    }


    /* =====================================================
       FINALIZAR BOSS
    ===================================================== */

    function finalizarBoss() {
        if (mesa.bossTimer) {
            clearTimeout(mesa.bossTimer);
            mesa.bossTimer = null;
        }

        const painel = mesa.elementos.painel;

        if (painel) {
            painel.classList.remove(
                "mesa-boss-flash"
            );
        }

        const alerta = document.getElementById(
            "mesa-boss-alert"
        );

        if (alerta) {
            alerta.remove();
        }

        mesa.boss = null;

        definirModo("interface");

        renderizarInterface();
    }


    function limparBossAnterior() {
        if (mesa.bossTimer) {
            clearTimeout(mesa.bossTimer);
            mesa.bossTimer = null;
        }

        const alerta = document.getElementById(
            "mesa-boss-alert"
        );

        if (alerta) {
            alerta.remove();
        }
    }


    /* =====================================================
       AJUDA
    ===================================================== */

    function renderizarAjuda() {
        const tela = mesa.elementos.tela;

        limparElemento(tela);

        criarBotaoVoltar(tela);

        tela.appendChild(
            criarElemento(
                "h3",
                [],
                "❓ AJUDA"
            )
        );

        const textos = [
            "🎭 Personagem — informações do personagem.",
            "❤️ Status — vida, mana e outros recursos.",
            "✨ Afinidade — afinidade elemental/mágica.",
            "🎒 Inventário — itens carregados.",
            "🗺️ Mapa — exploração do mapa.",
            "⚔️ Combate — estado atual da batalha.",
            "⚡ CTE — eventos com tempo limitado.",
            "🚨 BOSS — alerta especial do Mestre."
        ];

        textos.forEach((texto) => {
            tela.appendChild(
                criarElemento(
                    "p",
                    [],
                    texto
                )
            );
        });
    }
   /* ============================================================
   MESA RPG ONLINE — PARTE 3/3
   COMBATE + CTE + BOSS + CONFIGURAÇÕES +
   ATALHOS + FINALIZAÇÃO
============================================================ */

(function () {
    "use strict";

    const MESA = window.rpgMesa;


    /* ========================================================
       COMBATE
    ======================================================== */

    function criarTelaCombate() {
        const tela = limparTela();

        if (!tela) return;

        criarTitulo(
            tela,
            "⚔️ COMBATE",
            "A Mesa está em modo de combate."
        );

        const aviso = document.createElement("div");

        aviso.style.cssText = `
            width:min(100%,600px);
            padding:18px;
            margin-top:12px;
            border:1px solid rgba(252,165,165,.25);
            border-radius:15px;
            background:rgba(80,15,15,.2);
            text-align:center;
        `;

        aviso.innerHTML = `
            <div style="font-size:34px">⚔️</div>
            <strong style="display:block;margin-top:8px;color:#fee2e2">
                COMBATE ATIVO
            </strong>
            <small style="display:block;margin-top:6px;color:#fca5a5">
                O Mestre controla os acontecimentos desta batalha.
            </small>
        `;

        tela.appendChild(aviso);


        /* Participantes */

        const participantes =
            document.createElement("div");

        participantes.style.cssText = `
            width:min(100%,600px);
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:9px;
            margin-top:12px;
        `;

        const jogadores =
            MESA.players || [];

        jogadores.forEach(function (jogador, index) {
            const card =
                document.createElement("div");

            card.style.cssText = `
                padding:12px;
                border:1px solid rgba(252,165,165,.15);
                border-radius:11px;
                background:rgba(0,0,0,.2);
            `;

            const nome =
                document.createElement("strong");

            nome.textContent =
                obterNomeUsuario(jogador);

            const hp =
                document.createElement("small");

            hp.textContent =
                "❤️ 100 / 100";

            hp.style.cssText = `
                display:block;
                margin-top:5px;
                color:#fca5a5;
            `;

            card.appendChild(nome);
            card.appendChild(hp);

            participantes.appendChild(card);
        });

        if (!jogadores.length) {
            const vazio =
                document.createElement("p");

            vazio.textContent =
                "Nenhum participante carregado.";

            participantes.appendChild(vazio);
        }

        tela.appendChild(participantes);

        tela.appendChild(criarBotaoVoltar());
    }


    /* ========================================================
       CTE
    ======================================================== */

    function iniciarCTE(dados) {
        dados = dados || {};

        const tempo =
            Number(
                dados.timeLimit ??
                dados.tempo ??
                dados.tempoLimite ??
                10
            );

        const opcoes =
            Array.isArray(dados.options)
                ? dados.options
                : Array.isArray(dados.opcoes)
                    ? dados.opcoes
                    : [];

        MESA.cte = {
            title:
                dados.title ||
                dados.titulo ||
                "EVENTO",

            description:
                dados.description ||
                dados.descricao ||
                "Escolha uma ação.",

            timeLimit:
                tempo,

            remaining:
                tempo,

            options:
                opcoes,

            active: true,

            answered: false
        };

        definirModo("cte");

        criarTelaCTE();

        iniciarTimerCTE();

        mostrarNotificacao(
            "⚡ CTE iniciado!"
        );
    }

    window.rpgMesa.iniciarCTE =
        iniciarCTE;


    function iniciarTimerCTE() {
        clearInterval(MESA.cteTimer);

        if (!MESA.cte) {
            return;
        }

        atualizarTimerCTE();

        MESA.cteTimer =
            setInterval(function () {

                if (!MESA.cte ||
                    !MESA.cte.active) {

                    clearInterval(
                        MESA.cteTimer
                    );

                    return;
                }

                MESA.cte.remaining--;

                atualizarTimerCTE();

                if (MESA.cte.remaining <= 0) {
                    finalizarCTE(
                        "tempo"
                    );
                }

            }, 1000);
    }


    function atualizarTimerCTE() {
        const timer =
            document.getElementById(
                "mesa-cte-timer"
            );

        if (!timer || !MESA.cte) {
            return;
        }

        timer.textContent =
            MESA.cte.remaining;
    }


    function criarTelaCTE() {
        const tela = limparTela();

        if (!tela) return;

        if (!MESA.cte) {
            criarTelaCTEIndisponivel();
            return;
        }

        const cte =
            document.createElement("div");

        cte.className = "mesa-cte";

        const titulo =
            document.createElement("h2");

        titulo.textContent =
            cteTitulo();

        const descricao =
            document.createElement("p");

        descricao.textContent =
            MESA.cte.description;

        const timer =
            document.createElement("div");

        timer.className =
            "mesa-cte-timer";

        timer.id =
            "mesa-cte-timer";

        timer.textContent =
            MESA.cte.remaining;

        const opcoes =
            document.createElement("div");

        opcoes.className =
            "mesa-cte-options";

        MESA.cte.options.forEach(
            function (opcao, index) {

                const botao =
                    document.createElement("button");

                botao.type = "button";

                botao.className =
                    "mesa-cte-option";

                botao.dataset.optionId =
                    opcao.id ??
                    index;

                botao.textContent =
                    opcao.label ||
                    opcao.nome ||
                    `Opção ${index + 1}`;

                botao.onclick =
                    function () {

                        responderCTE(
                            opcao.id ??
                            index
                        );
                    };

                opcoes.appendChild(
                    botao
                );
            }
        );

        cte.appendChild(titulo);
        cte.appendChild(descricao);
        cte.appendChild(timer);
        cte.appendChild(opcoes);

        tela.appendChild(cte);
    }


    function cteTitulo() {
        return MESA.cte?.title ||
            "EVENTO";
    }


    function criarTelaCTEIndisponivel() {
        const tela = limparTela();

        if (!tela) return;

        criarTitulo(
            tela,
            "⚡ CTE",
            "Nenhum evento de decisão rápida está ativo."
        );

        const info =
            document.createElement("div");

        info.style.cssText = `
            margin-top:15px;
            padding:20px;
            width:min(100%,500px);
            text-align:center;
            border:1px solid rgba(234,179,8,.18);
            border-radius:15px;
            background:rgba(234,179,8,.04);
        `;

        info.textContent =
            usuarioEhMestre()
                ? "Use as configurações da Mesa para iniciar um CTE."
                : "Aguardando o Mestre iniciar um evento.";

        tela.appendChild(info);
    }


    function responderCTE(id) {
        if (!MESA.cte ||
            !MESA.cte.active) {

            return;
        }

        const opcao =
            MESA.cte.options.find(
                function (item, index) {
                    return String(
                        item.id ?? index
                    ) === String(id);
                }
            );

        if (!opcao) {
            return;
        }

        MESA.cte.answered = true;
        MESA.cte.active = false;

        clearInterval(
            MESA.cteTimer
        );

        mostrarNotificacao(
            "Escolha registrada: " +
            (
                opcao.label ||
                opcao.nome ||
                "Opção"
            )
        );

        finalizarCTE("resposta");
    }

    window.rpgMesa.responderCTE =
        responderCTE;


    function finalizarCTE(motivo) {
        clearInterval(
            MESA.cteTimer
        );

        MESA.cteTimer = null;

        if (MESA.cte) {
            MESA.cte.active = false;
        }

        if (motivo === "tempo") {
            mostrarNotificacao(
                "⏱️ O tempo do CTE acabou."
            );
        }

        MESA.cte = null;

        definirModo("interface");

        criarTelaInterface();
    }

    window.rpgMesa.finalizarCTE =
        finalizarCTE;


    /* ========================================================
       BOSS
    ======================================================== */

    function ativarBoss(nome) {
        const painel =
            document.getElementById(
                "online-table-panel"
            );

        if (!painel) {
            return;
        }

        clearTimeout(
            MESA.bossTimeout
        );

        definirModo("boss");

        painel.classList.add(
            "mesa-boss-flash"
        );

        const alerta =
            document.createElement("div");

        alerta.className =
            "mesa-boss-alert";

        const conteudo =
            document.createElement("div");

        conteudo.className =
            "mesa-boss-alert-content";

        const titulo =
            document.createElement("h2");

        titulo.textContent =
            "🚨 BOSS";

        const nomeBoss =
            document.createElement("strong");

        nomeBoss.textContent =
            nome ||
            "Inimigo poderoso";

        conteudo.appendChild(titulo);
        conteudo.appendChild(nomeBoss);

        alerta.appendChild(conteudo);

        painel.appendChild(alerta);

        mostrarNotificacao(
            "🚨 BOSS ENCONTRADO!"
        );

        MESA.bossTimeout =
            setTimeout(
                function () {

                    painel.classList.remove(
                        "mesa-boss-flash"
                    );

                    alerta.remove();

                    definirModo(
                        "interface"
                    );

                    criarTelaInterface();

                },
                5000
            );
    }

    window.rpgMesa.alertarBoss =
        ativarBoss;


    /* ========================================================
       CONFIGURAÇÕES
    ======================================================== */

    function abrirConfiguracoesMesa() {
        fecharConfiguracoesMesa();

        const painel =
            document.getElementById(
                "online-table-panel"
            );

        if (!painel) {
            return;
        }

        const overlay =
            document.createElement("div");

        overlay.className =
            "mesa-settings-overlay";

        overlay.id =
            "mesa-settings-overlay";

        const caixa =
            document.createElement("div");

        caixa.className =
            "mesa-settings";

        const titulo =
            document.createElement("h3");

        titulo.textContent =
            "⚙️ CONFIGURAÇÕES DA MESA";

        caixa.appendChild(titulo);

        if (usuarioEhMestre()) {
            criarConfiguracoesMestre(
                caixa
            );
        } else {
            criarConfiguracoesJogador(
                caixa
            );
        }

        const fechar =
            document.createElement("button");

        fechar.type = "button";

        fechar.textContent =
            "Fechar";

        fechar.onclick =
            fecharConfiguracoesMesa;

        caixa.appendChild(fechar);

        overlay.appendChild(caixa);

        painel.appendChild(overlay);
    }

    window.rpgMesa.abrirConfiguracoes =
        abrirConfiguracoesMesa;


    function fecharConfiguracoesMesa() {
        const overlay =
            document.getElementById(
                "mesa-settings-overlay"
            );

        if (overlay) {
            overlay.remove();
        }
    }

    window.rpgMesa.fecharConfiguracoes =
        fecharConfiguracoesMesa;


    function criarConfiguracoesMestre(caixa) {
        const titulo =
            document.createElement("p");

        titulo.textContent =
            "FERRAMENTAS DO MESTRE";

        titulo.style.cssText = `
            color:#86efac;
            font-size:9px;
            letter-spacing:2px;
        `;

        caixa.appendChild(titulo);


        criarBotaoConfig(
            caixa,
            "👥 Jogadores",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("players");
            }
        );


        criarBotaoConfig(
            caixa,
            "👤 Personagens",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("character");
            }
        );


        criarBotaoConfig(
            caixa,
            "❤️ Status",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("status");
            }
        );


        criarBotaoConfig(
            caixa,
            "🍖 Necessidades",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("needs");
            }
        );


        criarBotaoConfig(
            caixa,
            "🎒 Inventário",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("inventory");
            }
        );


        criarBotaoConfig(
            caixa,
            "⚔️ Combate",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("combat");
            }
        );


        criarBotaoConfig(
            caixa,
            "⚡ Eventos / CTE",
            function () {
                fecharConfiguracoesMesa();

                iniciarCTE({
                    title: "DESVIE!",
                    description:
                        "Escolha rapidamente uma ação.",
                    timeLimit: 5,
                    options: [
                        {
                            id: "left",
                            label: "⬅️ Esquerda"
                        },
                        {
                            id: "right",
                            label: "➡️ Direita"
                        }
                    ]
                });
            }
        );


        criarBotaoConfig(
            caixa,
            "🗺️ Mapa",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("map");
            }
        );


        criarBotaoConfig(
            caixa,
            "🚨 Testar BOSS",
            function () {
                fecharConfiguracoesMesa();
                ativarBoss(
                    "Guardião da Mesa"
                );
            }
        );
    }


    function criarConfiguracoesJogador(caixa) {
        const titulo =
            document.createElement("p");

        titulo.textContent =
            "FERRAMENTAS DO JOGADOR";

        titulo.style.cssText = `
            color:#86efac;
            font-size:9px;
            letter-spacing:2px;
        `;

        caixa.appendChild(titulo);


        criarBotaoConfig(
            caixa,
            "🟢 Interface",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("interface");
            }
        );


        criarBotaoConfig(
            caixa,
            "❔ Ajuda",
            function () {
                fecharConfiguracoesMesa();
                abrirModulo("help");
            }
        );
    }


    function criarBotaoConfig(
        caixa,
        texto,
        acao
    ) {
        const botao =
            document.createElement("button");

        botao.type = "button";

        botao.textContent = texto;

        botao.onclick = acao;

        caixa.appendChild(botao);
    }


    /* ========================================================
       AUXILIARES DE DADOS
    ======================================================== */

    function obterNomeUsuario(usuario) {
        if (!usuario) {
            return "Jogador";
        }

        return (
            usuario.nome ||
            usuario.name ||
            usuario.username ||
            usuario.display_name ||
            usuario.displayName ||
            usuario.email?.split("@")[0] ||
            "Jogador"
        );
    }


    function escaparHTML(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function limparTela() {
        const tela =
            document.getElementById(
                "mesa-screen"
            );

        if (!tela) {
            return null;
        }

        tela.innerHTML = "";

        return tela;
    }


    function criarBotaoVoltar() {
        const botao =
            document.createElement("button");

        botao.type = "button";

        botao.textContent =
            "← Voltar";

        botao.style.cssText = `
            margin-top:12px;
            padding:9px 14px;
            border:1px solid rgba(134,239,172,.25);
            border-radius:10px;
            background:rgba(34,197,94,.06);
            color:#d8e8db;
            cursor:pointer;
        `;

        botao.onclick = function () {
            definirModo("interface");
            criarTelaInicialMesa();
        };

        return botao;
    }


    function criarTelaInicialMesa() {
        const tela =
            limparTela();

        if (!tela) return;

        const titulo =
            document.createElement("h3");

        titulo.textContent =
            "MESA DE RPG";

        const texto =
            document.createElement("p");

        texto.textContent =
            "A mesa está pronta para a aventura.";

        tela.appendChild(titulo);
        tela.appendChild(texto);
    }


    /* ========================================================
       EXPORTAÇÕES
    ======================================================== */

    window.rpgMesa.criarTelaCombate =
        criarTelaCombate;

    window.rpgMesa.criarTelaCTE =
        criarTelaCTE;

    window.rpgMesa.criarTelaJogadores =
        criarTelaJogadores;

    window.rpgMesa.criarTelaInterface =
        criarTelaInterface;

    window.rpgMesa.criarTelaNecessidades =
        criarTelaNecessidades;

    window.rpgMesa.criarTelaAjuda =
        criarTelaAjuda;

    window.rpgMesa.criarTelaMapa =
        criarTelaMapa;


    /* ========================================================
       ATALHOS GLOBAIS
    ======================================================== */

    window.iniciarCTE =
        iniciarCTE;

    window.responderCTE =
        responderCTE;

    window.finalizarCTE =
        finalizarCTE;

    window.ativarBoss =
        ativarBoss;

    window.alertarBoss =
        ativarBoss;

    window.abrirModuloMesa =
        abrirModulo;

    window.abrirConfiguracoesMesa =
        abrirConfiguracoesMesa;

    window.fecharConfiguracoesMesa =
        fecharConfiguracoesMesa;


    /* ========================================================
       INICIALIZAÇÃO FINAL
    ======================================================== */

    function iniciarQuandoPronto() {
        if (typeof window.iniciarMesa === "function") {
            window.iniciarMesa();
        }
    }


    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            iniciarQuandoPronto
        );
    } else {
        iniciarQuandoPronto();
    }

})();
