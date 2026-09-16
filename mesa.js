/* =========================================================
   MESA RPG ONLINE
   mesa.js
   PARTE 1/3
   ---------------------------------------------------------
   Núcleo da Mesa
   - Estado
   - Usuário / Mestre
   - Campanha
   - Jogadores
   - Interface
   - Assentos
   - Cards
   - Personagem
   - Status
   - Afinidade
   - Inventário
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

        telaAtual: "inicio",
        modo: "interface",

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

        elementos: {},

        inicializada: false
    };

    window.rpgMesa = mesa;


    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    function qs(seletor, origem = document) {
        return origem.querySelector(seletor);
    }

    function qsa(seletor, origem = document) {
        return [...origem.querySelectorAll(seletor)];
    }

    function criarElemento(tag, classe = "", texto = "") {
        const elemento = document.createElement(tag);

        if (classe) {
            elemento.className = classe;
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

    function escaparHTML(valor) {
        const div = document.createElement("div");
        div.textContent = valor ?? "";
        return div.innerHTML;
    }

    window.escaparHTML = escaparHTML;


    /* =====================================================
       LEITURA FLEXÍVEL DE DADOS
       -----------------------------------------------------
       Permite que a Mesa funcione mesmo que o personagem
       tenha sido salvo com nomes de propriedades diferentes.
    ===================================================== */

    function primeiroValor(obj, campos, padrao = null) {
        if (!obj) return padrao;

        for (const campo of campos) {
            const valor = obj[campo];

            if (
                valor !== undefined &&
                valor !== null &&
                valor !== ""
            ) {
                return valor;
            }
        }

        return padrao;
    }

    function obterId(obj) {
        return primeiroValor(
            obj,
            [
                "id",
                "uid",
                "user_id",
                "userId",
                "player_id",
                "playerId"
            ],
            null
        );
    }

    function obterNome(obj) {
        return primeiroValor(
            obj,
            [
                "name",
                "nome",
                "username",
                "displayName",
                "display_name"
            ],
            "Jogador"
        );
    }

    function obterNomeUsuario(obj) {
        return primeiroValor(
            obj,
            [
                "name",
                "nome",
                "username",
                "displayName",
                "display_name"
            ],
            "Jogador"
        );
    }


    /* =====================================================
       USUÁRIO ATUAL
    ===================================================== */

    function obterUsuarioAtual() {
        const auth = window.rpgAuth;

        if (auth?.user) {
            return auth.user;
        }

        if (auth?.usuario) {
            return auth.usuario;
        }

        if (window.usuarioAtual) {
            return window.usuarioAtual;
        }

        if (window.usuario) {
            return window.usuario;
        }

        return null;
    }

    window.obterUsuarioAtual = obterUsuarioAtual;


    /* =====================================================
       MESTRE
    ===================================================== */

    function usuarioEhMestre() {
        const usuario = obterUsuarioAtual();

        if (!usuario) return false;

        if (window.rpgAuth?.isMaster === true) {
            return true;
        }

        const idUsuario = obterId(usuario);

        const idMestre = primeiroValor(
            mesa.campanha,
            [
                "master_id",
                "masterId",
                "mestre_id",
                "mestreId"
            ],
            null
        );

        if (
            idUsuario !== null &&
            idMestre !== null &&
            String(idUsuario) === String(idMestre)
        ) {
            return true;
        }

        if (mesa.mestre) {
            const idMestreObjeto = obterId(mesa.mestre);

            if (
                idUsuario !== null &&
                idMestreObjeto !== null &&
                String(idUsuario) === String(idMestreObjeto)
            ) {
                return true;
            }
        }

        return false;
    }

    window.usuarioEhMestre = usuarioEhMestre;


    function obterNomeMestre() {
        if (mesa.mestre) {
            return obterNome(mesa.mestre);
        }

        return primeiroValor(
            mesa.campanha,
            [
                "master_name",
                "masterName",
                "mestre_nome",
                "mestreNome"
            ],
            "Mestre"
        );
    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    function obterCampanha() {
        if (typeof window.obterCampanhaAtiva === "function") {
            try {
                const campanha = window.obterCampanhaAtiva();

                if (campanha) {
                    return campanha;
                }
            } catch (erro) {
                console.warn(
                    "Não foi possível obter campanha ativa:",
                    erro
                );
            }
        }

        if (window.rpgAuth?.campaign) {
            return window.rpgAuth.campaign;
        }

        if (window.rpgAuth?.campanha) {
            return window.rpgAuth.campanha;
        }

        if (window.campanhaAtual) {
            return window.campanhaAtual;
        }

        return null;
    }


    /* =====================================================
       JOGADORES
    ===================================================== */

    function obterListaBrutaJogadores(campanha) {
        if (!campanha) {
            return [];
        }

        return primeiroValor(
            campanha,
            [
                "players",
                "jogadores",
                "members",
                "membros",
                "participantes"
            ],
            []
        );
    }


    function normalizarJogador(jogador) {
        if (!jogador) {
            return null;
        }

        const personagem =
            jogador.character ||
            jogador.personagem ||
            jogador.characterData ||
            jogador.personagemData ||
            {};

        const status =
            jogador.status ||
            personagem.status ||
            {};

        const habilidades =
            primeiroValor(
                jogador,
                [
                    "abilities",
                    "habilidades",
                    "skills",
                    "skillsData"
                ],
                null
            ) ||
            primeiroValor(
                personagem,
                [
                    "abilities",
                    "habilidades",
                    "skills",
                    "skillsData"
                ],
                []
            ) ||
            [];

        const passiva =
            primeiroValor(
                jogador,
                [
                    "passive",
                    "passiva"
                ],
                null
            ) ||
            primeiroValor(
                personagem,
                [
                    "passive",
                    "passiva"
                ],
                null
            );

        return {
            ...jogador,

            character: personagem,

            status,

            abilities: Array.isArray(habilidades)
                ? habilidades.slice(0, 3)
                : [],

            passive: passiva || null
        };
    }


    function carregarJogadoresMesa() {
        const lista = obterListaBrutaJogadores(
            mesa.campanha
        );

        if (!Array.isArray(lista)) {
            mesa.jogadores = [];
            return;
        }

        mesa.jogadores = lista
            .map(normalizarJogador)
            .filter(Boolean)
            .slice(0, mesa.maxJogadores);
    }


    function encontrarJogador(id) {
        if (id === null || id === undefined) {
            return null;
        }

        return mesa.jogadores.find(jogador => {
            const jogadorId = obterId(jogador);

            return (
                jogadorId !== null &&
                String(jogadorId) === String(id)
            );
        }) || null;
    }


    function obterNomePersonagem(jogador) {
        if (!jogador) {
            return "Personagem";
        }

        const personagem =
            jogador.character ||
            jogador.personagem ||
            {};

        return primeiroValor(
            jogador,
            [
                "character_name",
                "characterName",
                "personagem_nome",
                "personagemNome"
            ],
            primeiroValor(
                personagem,
                [
                    "name",
                    "nome"
                ],
                "Personagem"
            )
        );
    }


    function obterRaca(jogador) {
        const personagem =
            jogador?.character ||
            jogador?.personagem ||
            {};

        return primeiroValor(
            jogador,
            [
                "race",
                "raca"
            ],
            primeiroValor(
                personagem,
                [
                    "race",
                    "raca"
                ],
                "—"
            )
        );
    }


    function obterClasse(jogador) {
        const personagem =
            jogador?.character ||
            jogador?.personagem ||
            {};

        return primeiroValor(
            jogador,
            [
                "class",
                "classe"
            ],
            primeiroValor(
                personagem,
                [
                    "class",
                    "classe"
                ],
                "—"
            )
        );
    }


    function obterAfinidade(jogador) {
        const personagem =
            jogador?.character ||
            jogador?.personagem ||
            {};

        return primeiroValor(
            jogador,
            [
                "affinity",
                "afinidade"
            ],
            primeiroValor(
                personagem,
                [
                    "affinity",
                    "afinidade"
                ],
                "—"
            )
        );
    }


    /* =====================================================
       STATUS
    ===================================================== */

    function obterHP(jogador) {
        const status = jogador?.status || {};

        const atual = Number(
            primeiroValor(
                status,
                [
                    "hp",
                    "vida",
                    "currentHp",
                    "currentHP",
                    "vidaAtual"
                ],
                primeiroValor(
                    jogador,
                    [
                        "hp",
                        "vida"
                    ],
                    0
                )
            )
        );

        const maximo = Number(
            primeiroValor(
                status,
                [
                    "maxHp",
                    "maxHP",
                    "hpMax",
                    "vidaMaxima",
                    "vidaMax"
                ],
                primeiroValor(
                    jogador,
                    [
                        "maxHp",
                        "maxHP"
                    ],
                    atual
                )
            )
        );

        return {
            atual: Number.isFinite(atual)
                ? Math.max(0, atual)
                : 0,

            maximo: Number.isFinite(maximo)
                ? Math.max(1, maximo)
                : 1
        };
    }


    function obterRecurso(jogador, tipo) {
        const status = jogador?.status || {};

        if (tipo === "mana") {
            return {
                atual: Number(
                    primeiroValor(
                        status,
                        [
                            "mana",
                            "manaAtual",
                            "currentMana"
                        ],
                        0
                    )
                ),

                maximo: Number(
                    primeiroValor(
                        status,
                        [
                            "maxMana",
                            "manaMax",
                            "manaMaxima"
                        ],
                        0
                    )
                )
            };
        }

        if (tipo === "energia") {
            return {
                atual: Number(
                    primeiroValor(
                        status,
                        [
                            "energy",
                            "energia",
                            "energiaAtual",
                            "currentEnergy"
                        ],
                        0
                    )
                ),

                maximo: Number(
                    primeiroValor(
                        status,
                        [
                            "maxEnergy",
                            "maxEnergia",
                            "energiaMax"
                        ],
                        0
                    )
                )
            };
        }

        return {
            atual: 0,
            maximo: 0
        };
    }


    function calcularPercentual(atual, maximo) {
        if (!maximo || maximo <= 0) {
            return 0;
        }

        return Math.max(
            0,
            Math.min(
                100,
                (atual / maximo) * 100
            )
        );
    }


    /* =====================================================
       ELEMENTOS PRINCIPAIS DA MESA
    ===================================================== */

    function obterPainelMesa() {
        let painel = document.querySelector(
            "#online-table-panel"
        );

        if (!painel) {
            painel = criarElemento(
                "section",
                "online-table-panel"
            );

            painel.id = "online-table-panel";

            document.body.appendChild(painel);
        }

        return painel;
    }


    function criarInterfaceMesa() {
        const painel = obterPainelMesa();

        limparElemento(painel);

        /* -------------------------------------------------
           HEADER
        ------------------------------------------------- */

        const header = criarElemento(
            "header",
            "online-table-header"
        );

        const tituloArea = criarElemento(
            "div",
            "online-table-title-area"
        );

        const etiqueta = criarElemento(
            "span",
            "online-table-label",
            "MESA ONLINE"
        );

        const titulo = criarElemento(
            "h1",
            "online-table-title",
            primeiroValor(
                mesa.campanha,
                [
                    "name",
                    "nome",
                    "title",
                    "titulo"
                ],
                "Mesa de RPG"
            )
        );

        const statusMesa = criarElemento(
            "span",
            "online-table-status",
            "🟢 INTERFACE"
        );

        statusMesa.id = "mesa-mode-status";

        tituloArea.append(
            etiqueta,
            titulo
        );

        header.append(
            tituloArea,
            statusMesa
        );

        /* -------------------------------------------------
           ÁREA PRINCIPAL
        ------------------------------------------------- */

        const mesaArea = criarElemento(
            "main",
            "rpg-table"
        );

        mesaArea.id = "rpg-table";

        /* -------------------------------------------------
           MESTRE
        ------------------------------------------------- */

        const areaMestre = criarElemento(
            "section",
            "table-master"
        );

        const mestreIcone = criarElemento(
            "div",
            "table-master-icon",
            "♛"
        );

        const mestreInfo = criarElemento(
            "div",
            "table-master-info"
        );

        const mestreLabel = criarElemento(
            "span",
            "table-master-label",
            "MESTRE"
        );

        const mestreNome = criarElemento(
            "strong",
            "table-master-name",
            obterNomeMestre()
        );

        mestreInfo.append(
            mestreLabel,
            mestreNome
        );

        areaMestre.append(
            mestreIcone,
            mestreInfo
        );

        /* -------------------------------------------------
           CORPO DA MESA
        ------------------------------------------------- */

        const corpoMesa = criarElemento(
            "div",
            "table-body"
        );

        /* LADO ESQUERDO */

        const ladoEsquerdo = criarElemento(
            "div",
            "table-side left"
        );

        ladoEsquerdo.id = "mesa-seats-left";

        /* LADO DIREITO */

        const ladoDireito = criarElemento(
            "div",
            "table-side right"
        );

        ladoDireito.id = "mesa-seats-right";

        /* CENTRO */

        const centro = criarElemento(
            "section",
            "table-center"
        );

        const tela = criarElemento(
            "div",
            "mesa-screen"
        );

        tela.id = "mesa-screen";

        centro.append(tela);

        for (let i = 1; i <= 4; i++) {
            ladoEsquerdo.append(
                criarAssento(i)
            );
        }

        for (let i = 5; i <= 8; i++) {
            ladoDireito.append(
                criarAssento(i)
            );
        }

        corpoMesa.append(
            ladoEsquerdo,
            centro,
            ladoDireito
        );

        /* -------------------------------------------------
           ÁREA DE CARDS
        ------------------------------------------------- */

        const jogadoresArea = criarElemento(
            "section",
            "online-table-players"
        );

        jogadoresArea.id = "mesa-players-area";

        const jogadoresHeader = criarElemento(
            "div",
            "mesa-players-header"
        );

        const jogadoresTitulo = criarElemento(
            "h2",
            "",
            "JOGADORES"
        );

        const contador = criarElemento(
            "span",
            "mesa-player-count",
            "0/8"
        );

        contador.id = "mesa-player-count";

        jogadoresHeader.append(
            jogadoresTitulo,
            contador
        );

        const cards = criarElemento(
            "div",
            "mesa-player-cards"
        );

        cards.id = "mesa-player-cards";

        jogadoresArea.append(
            jogadoresHeader,
            cards
        );

        /* -------------------------------------------------
           NOTIFICAÇÃO
        ------------------------------------------------- */

        const notificacao = criarElemento(
            "div",
            "mesa-notificacao"
        );

        notificacao.id = "mesa-notificacao";

        notificacao.setAttribute(
            "aria-live",
            "polite"
        );

        painel.append(
            header,
            mesaArea,
            jogadoresArea,
            notificacao
        );

        /* -------------------------------------------------
           REFERÊNCIAS
        ------------------------------------------------- */

        mesa.elementos = {
            painel,
            header,
            mesaArea,
            tela,
            statusMesa,
            mestreNome,
            ladoEsquerdo,
            ladoDireito,
            cards,
            contador,
            notificacao
        };
    }


    /* =====================================================
       ASSENTOS
    ===================================================== */

    function criarAssento(numero) {
        const assento = criarElemento(
            "button",
            "table-seat"
        );

        assento.type = "button";

        assento.dataset.seat = String(numero);

        const icone = criarElemento(
            "div",
            "table-seat-icon",
            "👤"
        );

        const nome = criarElemento(
            "span",
            "table-seat-name",
            "Aguardando jogador"
        );

        const numeroAssento = criarElemento(
            "span",
            "table-seat-number",
            `S${numero}`
        );

        assento.append(
            icone,
            nome,
            numeroAssento
        );

        assento.addEventListener(
            "click",
            () => {
                const jogador = mesa.jogadores.find(
                    item =>
                        Number(item.seat) === numero ||
                        Number(item.assento) === numero
                );

                if (jogador) {
                    abrirJogador(jogador);
                }
            }
        );

        return assento;
    }


    function renderizarAssentos() {
        const esquerda =
            mesa.elementos.ladoEsquerdo;

        const direita =
            mesa.elementos.ladoDireito;

        if (!esquerda || !direita) {
            return;
        }

        const assentos = [
            ...qsa(".table-seat", esquerda),
            ...qsa(".table-seat", direita)
        ];

        assentos.forEach(assento => {
            const numero = Number(
                assento.dataset.seat
            );

            const jogador =
                mesa.jogadores.find(item => {
                    const assentoJogador =
                        Number(
                            primeiroValor(
                                item,
                                [
                                    "seat",
                                    "assento",
                                    "slot"
                                ],
                                0
                            )
                        );

                    return (
                        assentoJogador === numero
                    );
                }) ||
                mesa.jogadores[numero - 1];

            const icone = qs(
                ".table-seat-icon",
                assento
            );

            const nome = qs(
                ".table-seat-name",
                assento
            );

            if (jogador) {
                assento.classList.add(
                    "occupied"
                );

                if (icone) {
                    icone.textContent =
                        primeiroValor(
                            jogador,
                            [
                                "avatar",
                                "icone",
                                "emoji"
                            ],
                            "🧙"
                        );
                }

                if (nome) {
                    nome.textContent =
                        obterNomePersonagem(
                            jogador
                        );
                }

                assento.title =
                    obterNomeUsuario(jogador);
            } else {
                assento.classList.remove(
                    "occupied"
                );

                if (icone) {
                    icone.textContent = "👤";
                }

                if (nome) {
                    nome.textContent =
                        "Aguardando jogador";
                }

                assento.removeAttribute(
                    "title"
                );
            }
        });

        atualizarContadorJogadores();
    }


    function atualizarContadorJogadores() {
        const contador =
            mesa.elementos.contador;

        if (!contador) return;

        contador.textContent =
            `${mesa.jogadores.length}/${mesa.maxJogadores}`;
    }


    /* =====================================================
       CARDS DOS JOGADORES
       -----------------------------------------------------
       IMPORTANTE:
       Cada card possui:
       - Nome do jogador
       - Nome do personagem
       - Raça
       - Classe
       - Afinidade
       - HP
       - Recursos
       - 3 habilidades
       - 1 passiva
    ===================================================== */

    function renderizarCardsJogadores() {
        const container =
            mesa.elementos.cards;

        if (!container) {
            return;
        }

        limparElemento(container);

        if (
            !mesa.configuracoes.mostrarCards
        ) {
            return;
        }

        if (mesa.jogadores.length === 0) {
            const vazio = criarElemento(
                "div",
                "mesa-cards-empty"
            );

            vazio.textContent =
                "Nenhum jogador conectado à mesa.";

            container.appendChild(vazio);

            atualizarContadorJogadores();

            return;
        }

        mesa.jogadores.forEach(
            (jogador, indice) => {
                container.appendChild(
                    criarCardJogador(
                        jogador,
                        indice
                    )
                );
            }
        );

        atualizarContadorJogadores();
    }


    function criarCardJogador(
        jogador,
        indice
    ) {
        const card = criarElemento(
            "article",
            "mesa-player-card"
        );

        const id =
            obterId(jogador) ??
            `player-${indice + 1}`;

        card.dataset.playerId =
            String(id);

        /* -------------------------------------------------
           CABEÇALHO
        ------------------------------------------------- */

        const header = criarElemento(
            "div",
            "player-card-header"
        );

        const avatar = criarElemento(
            "div",
            "player-card-avatar",
            primeiroValor(
                jogador,
                [
                    "avatar",
                    "icone",
                    "emoji"
                ],
                "🧙"
            )
        );

        const identidade = criarElemento(
            "div",
            "player-card-identity"
        );

        const personagem = criarElemento(
            "strong",
            "player-card-character",
            obterNomePersonagem(jogador)
        );

        const jogadorNome = criarElemento(
            "span",
            "player-card-player",
            obterNomeUsuario(jogador)
        );

        identidade.append(
            personagem,
            jogadorNome
        );

        const slot = criarElemento(
            "span",
            "player-card-slot",
            `S${indice + 1}`
        );

        header.append(
            avatar,
            identidade,
            slot
        );


        /* -------------------------------------------------
           INFORMAÇÕES
        ------------------------------------------------- */

        const informacoes = criarElemento(
            "div",
            "player-card-info"
        );

        informacoes.append(
            criarInfoCard(
                "RAÇA",
                obterRaca(jogador)
            ),

            criarInfoCard(
                "CLASSE",
                obterClasse(jogador)
            ),

            criarInfoCard(
                "AFINIDADE",
                obterAfinidade(jogador)
            )
        );


        /* -------------------------------------------------
           HP
        ------------------------------------------------- */

        const hp = obterHP(jogador);

        const hpArea = criarElemento(
            "div",
            "player-card-resource hp-resource"
        );

        const hpHeader = criarElemento(
            "div",
            "resource-header"
        );

        const hpNome = criarElemento(
            "span",
            "",
            "HP"
        );

        const hpValor = criarElemento(
            "strong",
            "",
            `${hp.atual}/${hp.maximo}`
        );

        hpHeader.append(
            hpNome,
            hpValor
        );

        const hpBarra = criarElemento(
            "div",
            "resource-bar"
        );

        const hpPreenchimento = criarElemento(
            "div",
            "resource-fill"
        );

        hpPreenchimento.style.width =
            `${calcularPercentual(
                hp.atual,
                hp.maximo
            )}%`;

        hpBarra.append(
            hpPreenchimento
        );

        hpArea.append(
            hpHeader,
            hpBarra
        );


        /* -------------------------------------------------
           MANA / ENERGIA
        ------------------------------------------------- */

        const recursos =
            criarElemento(
                "div",
                "player-card-resources"
            );

        const mana =
            obterRecurso(
                jogador,
                "mana"
            );

        const energia =
            obterRecurso(
                jogador,
                "energia"
            );

        if (mana.maximo > 0) {
            recursos.append(
                criarRecursoMini(
                    "MANA",
                    mana
                )
            );
        }

        if (energia.maximo > 0) {
            recursos.append(
                criarRecursoMini(
                    "ENERGIA",
                    energia
                )
            );
        }


        /* -------------------------------------------------
           HABILIDADES
        ------------------------------------------------- */

        const habilidadesTitulo =
            criarElemento(
                "span",
                "player-card-section-title",
                "HABILIDADES"
            );

        const habilidades =
            criarElemento(
                "div",
                "player-card-abilities"
            );

        const listaHabilidades =
            Array.isArray(
                jogador.abilities
            )
                ? jogador.abilities
                : [];

        for (let i = 0; i < 3; i++) {
            const habilidade =
                listaHabilidades[i] ||
                null;

            habilidades.append(
                criarSlotHabilidade(
                    habilidade,
                    i + 1
                )
            );
        }


        /* -------------------------------------------------
           PASSIVA
        ------------------------------------------------- */

        const passivaTitulo =
            criarElemento(
                "span",
                "player-card-section-title",
                "PASSIVA"
            );

        const passiva =
            criarSlotPassiva(
                jogador.passive
            );


        /* -------------------------------------------------
           MONTAGEM
        ------------------------------------------------- */

        card.append(
            header,
            informacoes,
            hpArea,
            recursos,
            habilidadesTitulo,
            habilidades,
            passivaTitulo,
            passiva
        );


        /* -------------------------------------------------
           ABRIR DETALHES
        ------------------------------------------------- */

        card.addEventListener(
            "click",
            evento => {
                if (
                    evento.target.closest(
                        "button"
                    )
                ) {
                    return;
                }

                abrirJogador(jogador);
            }
        );

        return card;
    }


    function criarInfoCard(
        titulo,
        valor
    ) {
        const area = criarElemento(
            "div",
            "player-card-info-item"
        );

        const label = criarElemento(
            "span",
            "",
            titulo
        );

        const texto = criarElemento(
            "strong",
            "",
            valor ?? "—"
        );

        area.append(
            label,
            texto
        );

        return area;
    }


    function criarRecursoMini(
        nome,
        recurso
    ) {
        const area = criarElemento(
            "div",
            "resource-mini"
        );

        const header = criarElemento(
            "div",
            "resource-mini-header"
        );

        const titulo = criarElemento(
            "span",
            "",
            nome
        );

        const valor = criarElemento(
            "strong",
            "",
            `${recurso.atual}/${recurso.maximo}`
        );

        header.append(
            titulo,
            valor
        );

        const barra = criarElemento(
            "div",
            "resource-bar mini"
        );

        const preenchimento =
            criarElemento(
                "div",
                "resource-fill"
            );

        preenchimento.style.width =
            `${calcularPercentual(
                recurso.atual,
                recurso.maximo
            )}%`;

        barra.append(
            preenchimento
        );

        area.append(
            header,
            barra
        );

        return area;
    }


    function criarSlotHabilidade(
        habilidade,
        numero
    ) {
        const slot = criarElemento(
            "div",
            "ability-slot"
        );

        slot.dataset.slot =
            String(numero);

        const numeroElemento =
            criarElemento(
                "span",
                "ability-slot-number",
                String(numero)
            );

        const nome =
            criarElemento(
                "strong",
                "ability-slot-name",
                habilidade
                    ? obterNomeHabilidade(
                        habilidade
                    )
                    : "Vazio"
            );

        const detalhe =
            criarElemento(
                "span",
                "ability-slot-detail",
                habilidade
                    ? obterDetalheHabilidade(
                        habilidade
                    )
                    : "Nenhuma habilidade"
            );

        slot.append(
            numeroElemento,
            nome,
            detalhe
        );

        if (!habilidade) {
            slot.classList.add(
                "empty"
            );
        }

        return slot;
    }


    function criarSlotPassiva(
        passiva
    ) {
        const slot = criarElemento(
            "div",
            "passive-slot"
        );

        const icone =
            criarElemento(
                "span",
                "passive-icon",
                "✦"
            );

        const conteudo =
            criarElemento(
                "div",
                "passive-content"
            );

        const nome =
            criarElemento(
                "strong",
                "",
                passiva
                    ? obterNomeHabilidade(
                        passiva
                    )
                    : "Nenhuma passiva"
            );

        const descricao =
            criarElemento(
                "span",
                "",
                passiva
                    ? obterDetalheHabilidade(
                        passiva
                    )
                    : "Passiva não definida"
            );

        conteudo.append(
            nome,
            descricao
        );

        slot.append(
            icone,
            conteudo
        );

        if (!passiva) {
            slot.classList.add(
                "empty"
            );
        }

        return slot;
    }


    function obterNomeHabilidade(
        habilidade
    ) {
        if (
            typeof habilidade === "string"
        ) {
            return habilidade;
        }

        return primeiroValor(
            habilidade,
            [
                "name",
                "nome",
                "title",
                "titulo"
            ],
            "Habilidade"
        );
    }


    function obterDetalheHabilidade(
        habilidade
    ) {
        if (
            typeof habilidade === "string"
        ) {
            return "";
        }

        return primeiroValor(
            habilidade,
            [
                "description",
                "descricao",
                "detail",
                "detalhe",
                "effect",
                "efeito"
            ],
            ""
        );
    }


    /* =====================================================
       ATUALIZAÇÃO GERAL
    ===================================================== */

    function atualizarListaJogadores() {
        renderizarAssentos();

        renderizarCardsJogadores();
    }


    /* =====================================================
       NOTIFICAÇÕES
    ===================================================== */

    function notificar(
        mensagem,
        duracao = 3000,
        tipo = "normal"
    ) {
        const elemento =
            mesa.elementos.notificacao;

        if (!elemento) {
            return;
        }

        elemento.textContent =
            mensagem;

        elemento.className =
            "mesa-notificacao";

        elemento.classList.add(
            `notification-${tipo}`
        );

        elemento.classList.add(
            "visible"
        );

        clearTimeout(
            mesa._notificacaoTimer
        );

        mesa._notificacaoTimer =
            setTimeout(
                () => {
                    elemento.classList.remove(
                        "visible"
                    );
                },
                duracao
            );
    }

    window.notificarMesa = notificar;


    /* =====================================================
       MODO DA MESA
    ===================================================== */

    function definirModo(modo) {
        mesa.modo = modo;

        const area =
            mesa.elementos.mesaArea;

        const status =
            mesa.elementos.statusMesa;

        if (area) {
            area.classList.remove(
                "mesa-state-interface",
                "mesa-state-combat",
                "mesa-state-cte",
                "mesa-state-map",
                "mesa-state-boss",
                "mesa-state-campaign"
            );

            area.classList.add(
                `mesa-state-${modo}`
            );
        }

        if (status) {
            const nomes = {
                interface: "🟢 INTERFACE",
                combat: "⚔️ COMBATE",
                cte: "🎭 CTE",
                map: "🗺️ MAPA",
                boss: "👹 BOSS",
                campaign: "📖 CAMPANHA"
            };

            status.textContent =
                nomes[modo] ||
                "🟢 INTERFACE";
        }

        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:modo",
                {
                    detail: {
                        modo
                    }
                }
            )
        );
    }


    /* =====================================================
       TELA INICIAL
    ===================================================== */

    function renderizarTelaInicial() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "inicio";

        definirModo(
            "interface"
        );

        const conteudo =
            criarElemento(
                "div",
                "mesa-home"
            );

        const icone =
            criarElemento(
                "div",
                "mesa-home-icon",
                "🎲"
            );

        const titulo =
            criarElemento(
                "h2",
                "",
                "MESA DE RPG"
            );

        const descricao =
            criarElemento(
                "p",
                "",
                "Escolha uma área da mesa para continuar."
            );

        const botoes =
            criarBotoesModulos();

        conteudo.append(
            icone,
            titulo,
            descricao,
            botoes
        );

        tela.appendChild(
            conteudo
        );
    }


    function criarBotoesModulos() {
        const area =
            criarElemento(
                "div",
                "mesa-module-buttons"
            );

        const modulos = [
            {
                id: "personagem",
                icone: "🧙",
                nome: "Personagem"
            },
            {
                id: "status",
                icone: "❤️",
                nome: "Status"
            },
            {
                id: "afinidade",
                icone: "✦",
                nome: "Afinidade"
            },
            {
                id: "inventario",
                icone: "🎒",
                nome: "Inventário"
            },
            {
                id: "necessidades",
                icone: "🍖",
                nome: "Necessidades"
            },
            {
                id: "mapa",
                icone: "🗺️",
                nome: "Mapa"
            },
            {
                id: "combate",
                icone: "⚔️",
                nome: "Combate"
            },
            {
                id: "cte",
                icone: "🎭",
                nome: "CTE"
            },
            {
                id: "interface",
                icone: "💬",
                nome: "Interface"
            },
            {
                id: "configuracoes",
                icone: "⚙️",
                nome: "Configurações"
            }
        ];

        modulos.forEach(
            modulo => {
                const botao =
                    criarElemento(
                        "button",
                        "mesa-module-button"
                    );

                botao.type = "button";

                const icone =
                    criarElemento(
                        "span",
                        "module-icon",
                        modulo.icone
                    );

                const nome =
                    criarElemento(
                        "span",
                        "module-name",
                        modulo.nome
                    );

                botao.append(
                    icone,
                    nome
                );

                botao.addEventListener(
                    "click",
                    () => {
                        abrirModulo(
                            modulo.id
                        );
                    }
                );

                area.appendChild(
                    botao
                );
            }
        );

        return area;
    }


    /* =====================================================
       ABRIR MÓDULO
    ===================================================== */

    function abrirModulo(modulo) {
        switch (modulo) {

            case "personagem":
                renderizarPersonagem();
                break;

            case "status":
                renderizarStatus();
                break;

            case "afinidade":
                renderizarAfinidade();
                break;

            case "inventario":
                renderizarInventario();
                break;

            case "necessidades":
                if (
                    typeof renderizarNecessidades ===
                    "function"
                ) {
                    renderizarNecessidades();
                }
                break;

            case "mapa":
                if (
                    typeof renderizarMapa ===
                    "function"
                ) {
                    renderizarMapa();
                }
                break;

            case "combate":
                if (
                    typeof renderizarCombate ===
                    "function"
                ) {
                    renderizarCombate();
                }
                break;

            case "cte":
                if (
                    typeof renderizarCTE ===
                    "function"
                ) {
                    renderizarCTE();
                }
                break;

            case "interface":
                if (
                    typeof renderizarInterface ===
                    "function"
                ) {
                    renderizarInterface();
                } else {
                    renderizarTelaInicial();
                }
                break;

            case "configuracoes":
                if (
                    typeof abrirConfiguracoesMesa ===
                    "function"
                ) {
                    abrirConfiguracoesMesa();
                }
                break;

            default:
                renderizarTelaInicial();
                break;
        }
    }

    window.abrirModuloMesa =
        abrirModulo;

    mesa.abrirModulo =
        abrirModulo;


    /* =====================================================
       BOTÃO VOLTAR
    ===================================================== */

    function criarBotaoVoltar(
        destino = renderizarTelaInicial
    ) {
        const botao =
            criarElemento(
                "button",
                "mesa-back-button",
                "← Voltar"
            );

        botao.type = "button";

        botao.addEventListener(
            "click",
            destino
        );

        return botao;
    }


    /* =====================================================
       PERSONAGEM
    ===================================================== */

    function renderizarPersonagem() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "personagem";

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        const titulo =
            criarElemento(
                "h2",
                "",
                "🧙 PERSONAGENS"
            );

        header.append(
            criarBotaoVoltar(),
            titulo
        );

        conteudo.append(
            header
        );

        mesa.jogadores.forEach(
            jogador => {
                const bloco =
                    criarElemento(
                        "article",
                        "character-panel"
                    );

                const nome =
                    criarElemento(
                        "h3",
                        "",
                        obterNomePersonagem(
                            jogador
                        )
                    );

                const jogadorNome =
                    criarElemento(
                        "p",
                        "",
                        `Jogador: ${obterNomeUsuario(
                            jogador
                        )}`
                    );

                const dados =
                    criarElemento(
                        "div",
                        "character-data-grid"
                    );

                dados.append(
                    criarInfoCard(
                        "RAÇA",
                        obterRaca(jogador)
                    ),

                    criarInfoCard(
                        "CLASSE",
                        obterClasse(jogador)
                    ),

                    criarInfoCard(
                        "AFINIDADE",
                        obterAfinidade(jogador)
                    )
                );

                bloco.append(
                    nome,
                    jogadorNome,
                    dados
                );

                conteudo.append(
                    bloco
                );
            }
        );

        if (
            mesa.jogadores.length === 0
        ) {
            conteudo.append(
                criarElemento(
                    "p",
                    "mesa-empty-message",
                    "Nenhum personagem disponível."
                )
            );
        }

        tela.appendChild(
            conteudo
        );

        definirModo(
            "interface"
        );
    }


    /* =====================================================
       STATUS
       -----------------------------------------------------
       SOMENTE LEITURA
    ===================================================== */

    function renderizarStatus() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "status";

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "❤️ STATUS"
            )
        );

        conteudo.append(
            header
        );

        mesa.jogadores.forEach(
            jogador => {
                const card =
                    criarElemento(
                        "article",
                        "status-panel"
                    );

                const titulo =
                    criarElemento(
                        "h3",
                        "",
                        obterNomePersonagem(
                            jogador
                        )
                    );

                const hp =
                    obterHP(jogador);

                const hpTexto =
                    criarElemento(
                        "p",
                        "",
                        `HP: ${hp.atual}/${hp.maximo}`
                    );

                const hpBarra =
                    criarElemento(
                        "div",
                        "resource-bar large"
                    );

                const hpFill =
                    criarElemento(
                        "div",
                        "resource-fill"
                    );

                hpFill.style.width =
                    `${calcularPercentual(
                        hp.atual,
                        hp.maximo
                    )}%`;

                hpBarra.append(
                    hpFill
                );

                const recursos =
                    criarElemento(
                        "div",
                        "status-resource-grid"
                    );

                const mana =
                    obterRecurso(
                        jogador,
                        "mana"
                    );

                const energia =
                    obterRecurso(
                        jogador,
                        "energia"
                    );

                if (
                    mana.maximo > 0
                ) {
                    recursos.append(
                        criarInfoCard(
                            "MANA",
                            `${mana.atual}/${mana.maximo}`
                        )
                    );
                }

                if (
                    energia.maximo > 0
                ) {
                    recursos.append(
                        criarInfoCard(
                            "ENERGIA",
                            `${energia.atual}/${energia.maximo}`
                        )
                    );
                }

                card.append(
                    titulo,
                    hpTexto,
                    hpBarra,
                    recursos
                );

                conteudo.append(
                    card
                );
            }
        );

        if (
            mesa.jogadores.length === 0
        ) {
            conteudo.append(
                criarElemento(
                    "p",
                    "mesa-empty-message",
                    "Nenhum status disponível."
                )
            );
        }

        tela.appendChild(
            conteudo
        );

        definirModo(
            "interface"
        );
    }


    /* =====================================================
       AFINIDADE
    ===================================================== */

    function renderizarAfinidade() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "afinidade";

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "✦ AFINIDADES"
            )
        );

        conteudo.append(
            header
        );

        mesa.jogadores.forEach(
            jogador => {
                const bloco =
                    criarElemento(
                        "article",
                        "affinity-panel"
                    );

                bloco.append(
                    criarElemento(
                        "h3",
                        "",
                        obterNomePersonagem(
                            jogador
                        )
                    ),

                    criarInfoCard(
                        "AFINIDADE",
                        obterAfinidade(
                            jogador
                        )
                    )
                );

                conteudo.append(
                    bloco
                );
            }
        );

        if (
            mesa.jogadores.length === 0
        ) {
            conteudo.append(
                criarElemento(
                    "p",
                    "mesa-empty-message",
                    "Nenhuma afinidade disponível."
                )
            );
        }

        tela.appendChild(
            conteudo
        );

        definirModo(
            "interface"
        );
    }


    /* =====================================================
       INVENTÁRIO
    ===================================================== */

    function obterInventario(jogador) {
        const personagem =
            jogador?.character ||
            jogador?.personagem ||
            {};

        return primeiroValor(
            jogador,
            [
                "inventory",
                "inventario"
            ],
            primeiroValor(
                personagem,
                [
                    "inventory",
                    "inventario"
                ],
                []
            )
        );
    }


    function obterNomeItem(item) {
        if (
            typeof item === "string"
        ) {
            return item;
        }

        return primeiroValor(
            item,
            [
                "name",
                "nome",
                "itemName",
                "item_name"
            ],
            "Item"
        );
    }


    function obterQuantidadeItem(item) {
        if (
            typeof item === "string"
        ) {
            return 1;
        }

        const quantidade =
            Number(
                primeiroValor(
                    item,
                    [
                        "quantity",
                        "quantidade",
                        "amount",
                        "qtd"
                    ],
                    1
                )
            );

        return Number.isFinite(
            quantidade
        )
            ? quantidade
            : 1;
    }


    function renderizarInventario() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "inventario";

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "🎒 INVENTÁRIO"
            )
        );

        conteudo.append(
            header
        );

        mesa.jogadores.forEach(
            jogador => {
                const bloco =
                    criarElemento(
                        "article",
                        "inventory-panel"
                    );

                bloco.append(
                    criarElemento(
                        "h3",
                        "",
                        obterNomePersonagem(
                            jogador
                        )
                    )
                );

                const inventario =
                    obterInventario(
                        jogador
                    );

                const lista =
                    criarElemento(
                        "div",
                        "inventory-grid"
                    );

                if (
                    Array.isArray(
                        inventario
                    ) &&
                    inventario.length > 0
                ) {
                    inventario.forEach(
                        item => {
                            const itemElemento =
                                criarElemento(
                                    "div",
                                    "inventory-item"
                                );

                            const nome =
                                criarElemento(
                                    "strong",
                                    "",
                                    obterNomeItem(
                                        item
                                    )
                                );

                            const quantidade =
                                criarElemento(
                                    "span",
                                    "",
                                    `x${obterQuantidadeItem(
                                        item
                                    )}`
                                );

                            itemElemento.append(
                                nome,
                                quantidade
                            );

                            lista.append(
                                itemElemento
                            );
                        }
                    );
                } else {
                    lista.append(
                        criarElemento(
                            "span",
                            "inventory-empty",
                            "Inventário vazio."
                        )
                    );
                }

                bloco.append(
                    lista
                );

                conteudo.append(
                    bloco
                );
            }
        );

        if (
            mesa.jogadores.length === 0
        ) {
            conteudo.append(
                criarElemento(
                    "p",
                    "mesa-empty-message",
                    "Nenhum jogador disponível."
                )
            );
        }

        tela.appendChild(
            conteudo
        );

        definirModo(
            "interface"
        );
    }


    /* =====================================================
       EXPORTAÇÕES DA PARTE 1
    ===================================================== */

    mesa.criarInterfaceMesa =
        criarInterfaceMesa;

    mesa.carregarJogadoresMesa =
        carregarJogadoresMesa;

    mesa.atualizarListaJogadores =
        atualizarListaJogadores;

    mesa.renderizarCardsJogadores =
        renderizarCardsJogadores;

    mesa.renderizarAssentos =
        renderizarAssentos;

    mesa.encontrarJogador =
        encontrarJogador;

    mesa.renderizarPersonagem =
        renderizarPersonagem;

    mesa.renderizarStatus =
        renderizarStatus;

    mesa.renderizarAfinidade =
        renderizarAfinidade;

    mesa.renderizarInventario =
        renderizarInventario;

    mesa.obterHP =
        obterHP;

    mesa.obterRecurso =
        obterRecurso;

    mesa.abrirJogador =
        abrirJogador;


    /* =====================================================
       NÃO INICIALIZAR AQUI
       -----------------------------------------------------
       A inicialização completa ficará na PARTE 3.
    ===================================================== */
/* =========================================================
   MESA RPG ONLINE
   mesa.js
   PARTE 2/3
   ---------------------------------------------------------
   Interface
   Chat
   Necessidades
   Jogadores
   Tela individual
   Inventário avançado
   Entrega de itens
   Sistema de troca
   Mapa
========================================================= */

(() => {
    "use strict";

    const mesa = window.rpgMesa;

    if (!mesa) {
        console.error(
            "Mesa RPG: a Parte 1 do mesa.js não foi carregada."
        );
        return;
    }


    /* =====================================================
       ATALHOS INTERNOS
    ===================================================== */

    const qs = (seletor, origem = document) =>
        origem.querySelector(seletor);

    const qsa = (seletor, origem = document) =>
        [...origem.querySelectorAll(seletor)];

    const criarElemento = (
        tag,
        classe = "",
        texto = ""
    ) => {
        const elemento =
            document.createElement(tag);

        if (classe) {
            elemento.className = classe;
        }

        if (texto !== "") {
            elemento.textContent = texto;
        }

        return elemento;
    };

    const limparElemento = elemento => {
        if (!elemento) return;

        while (elemento.firstChild) {
            elemento.removeChild(
                elemento.firstChild
            );
        }
    };

    const primeiroValor = (
        objeto,
        campos,
        padrao = null
    ) => {
        if (!objeto) return padrao;

        for (const campo of campos) {
            const valor = objeto[campo];

            if (
                valor !== undefined &&
                valor !== null &&
                valor !== ""
            ) {
                return valor;
            }
        }

        return padrao;
    };


    /* =====================================================
       DADOS DO PERSONAGEM
    ===================================================== */

    function obterPersonagem(jogador) {
        return (
            jogador?.character ||
            jogador?.personagem ||
            jogador?.characterData ||
            jogador?.personagemData ||
            {}
        );
    }


    function obterNecessidades(jogador) {
        const personagem =
            obterPersonagem(jogador);

        return primeiroValor(
            jogador,
            [
                "needs",
                "necessidades"
            ],
            primeiroValor(
                personagem,
                [
                    "needs",
                    "necessidades"
                ],
                []
            )
        );
    }


    /* =====================================================
       INTERFACE DA MESA
    ===================================================== */

    function renderizarInterface() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "interface";

        definirModo(
            "interface"
        );

        const conteudo =
            criarElemento(
                "section",
                "mesa-interface-screen"
            );

        const cabecalho =
            criarElemento(
                "div",
                "module-screen-header"
            );

        cabecalho.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "💬 INTERFACE DA MESA"
            )
        );

        conteudo.append(
            cabecalho
        );


        /* -------------------------------------------------
           AÇÕES PRINCIPAIS
        ------------------------------------------------- */

        const acoes =
            criarElemento(
                "div",
                "mesa-interface-actions"
            );

        const botoes = [
            [
                "🧙",
                "Personagens",
                "personagem"
            ],
            [
                "❤️",
                "Status",
                "status"
            ],
            [
                "✦",
                "Afinidades",
                "afinidade"
            ],
            [
                "🎒",
                "Inventário",
                "inventario"
            ],
            [
                "🍖",
                "Necessidades",
                "necessidades"
            ],
            [
                "🗺️",
                "Mapa",
                "mapa"
            ],
            [
                "⚔️",
                "Combate",
                "combate"
            ],
            [
                "🎭",
                "CTE",
                "cte"
            ]
        ];

        if (
            typeof window.abrirConfiguracoesMesa ===
            "function"
        ) {
            botoes.push([
                "⚙️",
                "Configurações",
                "configuracoes"
            ]);
        }

        botoes.forEach(
            ([icone, nome, modulo]) => {
                const botao =
                    criarElemento(
                        "button",
                        "mesa-interface-action"
                    );

                botao.type = "button";

                botao.append(
                    criarElemento(
                        "span",
                        "action-icon",
                        icone
                    ),

                    criarElemento(
                        "span",
                        "action-name",
                        nome
                    )
                );

                botao.addEventListener(
                    "click",
                    () => abrirModulo(modulo)
                );

                acoes.appendChild(
                    botao
                );
            }
        );

        conteudo.append(
            acoes
        );


        /* -------------------------------------------------
           CHAT
        ------------------------------------------------- */

        if (
            mesa.configuracoes.mostrarChat
        ) {
            conteudo.append(
                criarChat()
            );
        }

        tela.appendChild(
            conteudo
        );
    }


    function criarBotaoVoltarMesa() {
        const botao =
            criarElemento(
                "button",
                "mesa-back-button",
                "← Voltar"
            );

        botao.type = "button";

        botao.addEventListener(
            "click",
            () => {
                if (
                    typeof mesa.renderizarTelaInicial ===
                    "function"
                ) {
                    mesa.renderizarTelaInicial();
                } else {
                    renderizarTelaInicialLocal();
                }
            }
        );

        return botao;
    }


    function renderizarTelaInicialLocal() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "inicio";

        definirModo(
            "interface"
        );

        const conteudo =
            criarElemento(
                "div",
                "mesa-home"
            );

        conteudo.append(
            criarElemento(
                "div",
                "mesa-home-icon",
                "🎲"
            ),

            criarElemento(
                "h2",
                "",
                "MESA DE RPG"
            ),

            criarElemento(
                "p",
                "",
                "Escolha uma área da mesa para continuar."
            )
        );

        tela.appendChild(
            conteudo
        );
    }


    function definirModo(modo) {
        mesa.modo = modo;

        const area =
            mesa.elementos.mesaArea;

        const status =
            mesa.elementos.statusMesa;

        if (area) {
            area.classList.remove(
                "mesa-state-interface",
                "mesa-state-combat",
                "mesa-state-cte",
                "mesa-state-map",
                "mesa-state-boss",
                "mesa-state-campaign"
            );

            area.classList.add(
                `mesa-state-${modo}`
            );
        }

        if (status) {
            const nomes = {
                interface: "🟢 INTERFACE",
                combat: "⚔️ COMBATE",
                cte: "🎭 CTE",
                map: "🗺️ MAPA",
                boss: "👹 BOSS",
                campaign: "📖 CAMPANHA"
            };

            status.textContent =
                nomes[modo] ||
                "🟢 INTERFACE";
        }
    }


    function abrirModulo(modulo) {
        switch (modulo) {

            case "personagem":
                mesa.renderizarPersonagem();
                break;

            case "status":
                mesa.renderizarStatus();
                break;

            case "afinidade":
                mesa.renderizarAfinidade();
                break;

            case "inventario":
                mesa.renderizarInventario();
                break;

            case "necessidades":
                renderizarNecessidades();
                break;

            case "jogadores":
                renderizarJogadores();
                break;

            case "mapa":
                renderizarMapa();
                break;

            case "combate":
                if (
                    typeof mesa.renderizarCombate ===
                    "function"
                ) {
                    mesa.renderizarCombate();
                }
                break;

            case "cte":
                if (
                    typeof mesa.renderizarCTE ===
                    "function"
                ) {
                    mesa.renderizarCTE();
                }
                break;

            case "configuracoes":
                if (
                    typeof window.abrirConfiguracoesMesa ===
                    "function"
                ) {
                    window.abrirConfiguracoesMesa();
                }
                break;

            case "interface":
            default:
                renderizarInterface();
                break;
        }
    }


    /* =====================================================
       CHAT
    ===================================================== */

    function criarChat() {
        const chat =
            criarElemento(
                "section",
                "table-chat"
            );

        const cabecalho =
            criarElemento(
                "div",
                "table-chat-header"
            );

        cabecalho.append(
            criarElemento(
                "strong",
                "",
                "💬 CHAT"
            )
        );

        const mensagens =
            criarElemento(
                "div",
                "table-chat-messages"
            );

        mensagens.id =
            "mesa-chat-messages";

        const mensagensSalvas =
            obterMensagensChat();

        if (
            mensagensSalvas.length === 0
        ) {
            mensagens.append(
                criarElemento(
                    "p",
                    "chat-empty",
                    "Nenhuma mensagem ainda."
                )
            );
        } else {
            mensagensSalvas.forEach(
                mensagem => {
                    mensagens.append(
                        criarMensagemChat(
                            mensagem
                        )
                    );
                }
            );
        }


        const formulario =
            criarElemento(
                "form",
                "table-chat-form"
            );

        const entrada =
            criarElemento(
                "input",
                "table-chat-input"
            );

        entrada.type = "text";

        entrada.placeholder =
            "Digite uma mensagem...";

        entrada.autocomplete =
            "off";

        const enviar =
            criarElemento(
                "button",
                "table-chat-send",
                "Enviar"
            );

        enviar.type = "submit";

        formulario.append(
            entrada,
            enviar
        );

        formulario.addEventListener(
            "submit",
            evento => {
                evento.preventDefault();

                const texto =
                    entrada.value.trim();

                if (!texto) return;

                enviarMensagemChat(
                    texto
                );

                entrada.value = "";

                entrada.focus();
            }
        );

        chat.append(
            cabecalho,
            mensagens,
            formulario
        );

        return chat;
    }


    function obterMensagensChat() {
        const campanha =
            mesa.campanha;

        const mensagens =
            primeiroValor(
                campanha,
                [
                    "chat",
                    "mensagens",
                    "messages"
                ],
                []
            );

        return Array.isArray(
            mensagens
        )
            ? mensagens
            : [];
    }


    function criarMensagemChat(
        mensagem
    ) {
        const item =
            criarElement(
                "div",
                "chat-message"
            );

        const autor =
            primeiroValor(
                mensagem,
                [
                    "authorName",
                    "author_name",
                    "autor",
                    "nome",
                    "username"
                ],
                "Jogador"
            );

        const texto =
            primeiroValor(
                mensagem,
                [
                    "text",
                    "texto",
                    "message",
                    "mensagem"
                ],
                ""
            );

        const autorElemento =
            criarElement(
                "strong",
                "chat-message-author",
                autor
            );

        const textoElemento =
            criarElement(
                "span",
                "chat-message-text",
                texto
            );

        item.append(
            autorElemento,
            textoElemento
        );

        return item;
    }


    function enviarMensagemChat(
        texto
    ) {
        const usuario =
            obterUsuarioAtualLocal();

        const mensagem = {
            id:
                `msg-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2)}`,

            authorId:
                obterIdLocal(usuario),

            authorName:
                obterNomeLocal(usuario),

            text:
                texto,

            createdAt:
                new Date().toISOString()
        };

        if (
            !Array.isArray(
                mesa.campanha.chat
            )
        ) {
            mesa.campanha.chat = [];
        }

        mesa.campanha.chat.push(
            mensagem
        );

        renderizarInterface();

        /* Evento para futura sincronização */
        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:chat",
                {
                    detail: mensagem
                }
            )
        );
    }


    function obterUsuarioAtualLocal() {
        if (
            window.rpgAuth?.user
        ) {
            return window.rpgAuth.user;
        }

        if (
            window.rpgAuth?.usuario
        ) {
            return window.rpgAuth.usuario;
        }

        if (
            window.usuarioAtual
        ) {
            return window.usuarioAtual;
        }

        return null;
    }


    function obterIdLocal(objeto) {
        return primeiroValor(
            objeto,
            [
                "id",
                "uid",
                "user_id",
                "userId"
            ],
            null
        );
    }


    function obterNomeLocal(objeto) {
        return primeiroValor(
            objeto,
            [
                "name",
                "nome",
                "username",
                "displayName"
            ],
            "Jogador"
        );
    }


    /* =====================================================
       NECESSIDADES
    ===================================================== */

    function renderizarNecessidades() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "necessidades";

        definirModo(
            "interface"
        );

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "🍖 NECESSIDADES"
            )
        );

        conteudo.append(
            header
        );


        mesa.jogadores.forEach(
            jogador => {
                const painel =
                    criarElemento(
                        "article",
                        "needs-panel"
                    );

                painel.append(
                    criarElemento(
                        "h3",
                        "",
                        obterNomePersonagemLocal(
                            jogador
                        )
                    )
                );

                const necessidades =
                    obterNecessidades(
                        jogador
                    );

                const grid =
                    criarElemento(
                        "div",
                        "needs-grid"
                    );

                if (
                    Array.isArray(
                        necessidades
                    ) &&
                    necessidades.length
                ) {
                    necessidades.forEach(
                        necessidade => {
                            grid.append(
                                criarNecessidade(
                                    necessidade
                                )
                            );
                        }
                    );
                } else if (
                    necessidades &&
                    typeof necessidades ===
                        "object"
                ) {
                    Object.entries(
                        necessidades
                    ).forEach(
                        ([chave, valor]) => {
                            grid.append(
                                criarNecessidade({
                                    name: chave,
                                    value: valor
                                })
                            );
                        }
                    );
                } else {
                    grid.append(
                        criarElemento(
                            "span",
                            "needs-empty",
                            "Nenhuma necessidade registrada."
                        )
                    );
                }

                painel.append(
                    grid
                );

                conteudo.append(
                    painel
                );
            }
        );


        if (
            mesa.jogadores.length === 0
        ) {
            conteudo.append(
                criarElemento(
                    "p",
                    "mesa-empty-message",
                    "Nenhum jogador disponível."
                )
            );
        }

        tela.appendChild(
            conteudo
        );
    }


    function criarNecessidade(
        necessidade
    ) {
        const item =
            criarElemento(
                "div",
                "need-item"
            );

        if (
            typeof necessidade ===
            "string"
        ) {
            item.textContent =
                necessidade;

            return item;
        }

        const nome =
            primeiroValor(
                necessidade,
                [
                    "name",
                    "nome",
                    "type",
                    "tipo"
                ],
                "Necessidade"
            );

        const valor =
            primeiroValor(
                necessidade,
                [
                    "value",
                    "valor",
                    "level",
                    "nivel",
                    "amount",
                    "quantidade"
                ],
                "—"
            );

        item.append(
            criarElemento(
                "strong",
                "",
                nome
            ),

            criarElemento(
                "span",
                "",
                String(valor)
            )
        );

        return item;
    }


    /* =====================================================
       JOGADORES
    ===================================================== */

    function renderizarJogadores() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "jogadores";

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "👥 JOGADORES"
            )
        );

        conteudo.append(
            header
        );


        const lista =
            criarElemento(
                "div",
                "players-list"
            );

        mesa.jogadores.forEach(
            jogador => {
                const botao =
                    criarElemento(
                        "button",
                        "player-list-item"
                    );

                botao.type = "button";

                botao.append(
                    criarElemento(
                        "span",
                        "player-list-avatar",
                        primeiroValor(
                            jogador,
                            [
                                "avatar",
                                "icone",
                                "emoji"
                            ],
                            "🧙"
                        )
                    ),

                    criarElemento(
                        "span",
                        "player-list-info",
                        `${obterNomePersonagemLocal(
                            jogador
                        )} — ${obterNomeLocal(
                            jogador
                        )}`
                    )
                );

                botao.addEventListener(
                    "click",
                    () => abrirJogador(
                        jogador
                    )
                );

                lista.appendChild(
                    botao
                );
            }
        );

        if (
            mesa.jogadores.length === 0
        ) {
            lista.append(
                criarElemento(
                    "p",
                    "mesa-empty-message",
                    "Nenhum jogador conectado."
                )
            );
        }

        conteudo.append(
            lista
        );

        tela.appendChild(
            conteudo
        );

        definirModo(
            "interface"
        );
    }


    /* =====================================================
       TELA INDIVIDUAL DO JOGADOR
    ===================================================== */

    function abrirJogador(
        jogador
    ) {
        if (!jogador) return;

        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "jogador";

        definirModo(
            "interface"
        );

        const conteudo =
            criarElemento(
                "section",
                "mesa-player-detail"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "🧙 FICHA DO JOGADOR"
            )
        );

        conteudo.append(
            header
        );


        /* -------------------------------------------------
           IDENTIDADE
        ------------------------------------------------- */

        const identidade =
            criarElemento(
                "article",
                "player-detail-identity"
            );

        identidade.append(
            criarElemento(
                "div",
                "player-detail-avatar",
                primeiroValor(
                    jogador,
                    [
                        "avatar",
                        "icone",
                        "emoji"
                    ],
                    "🧙"
                )
            ),

            criarElemento(
                "h3",
                "",
                obterNomePersonagemLocal(
                    jogador
                )
            ),

            criarElemento(
                "p",
                "",
                `Jogador: ${obterNomeLocal(
                    jogador
                )}`
            )
        );

        conteudo.append(
            identidade
        );


        /* -------------------------------------------------
           DADOS
        ------------------------------------------------- */

        const dados =
            criarElemento(
                "div",
                "player-detail-grid"
            );

        dados.append(
            criarInfoLocal(
                "RAÇA",
                obterRacaLocal(
                    jogador
                )
            ),

            criarInfoLocal(
                "CLASSE",
                obterClasseLocal(
                    jogador
                )
            ),

            criarInfoLocal(
                "AFINIDADE",
                obterAfinidadeLocal(
                    jogador
                )
            )
        );

        conteudo.append(
            dados
        );


        /* -------------------------------------------------
           STATUS
        ------------------------------------------------- */

        const status =
            criarElemento(
                "article",
                "player-detail-section"
            );

        status.append(
            criarElemento(
                "h3",
                "",
                "❤️ STATUS"
            )
        );

        const hp =
            mesa.obterHP(
                jogador
            );

        status.append(
            criarInfoLocal(
                "HP",
                `${hp.atual}/${hp.maximo}`
            )
        );

        const mana =
            mesa.obterRecurso(
                jogador,
                "mana"
            );

        const energia =
            mesa.obterRecurso(
                jogador,
                "energia"
            );

        if (
            mana.maximo > 0
        ) {
            status.append(
                criarInfoLocal(
                    "MANA",
                    `${mana.atual}/${mana.maximo}`
                )
            );
        }

        if (
            energia.maximo > 0
        ) {
            status.append(
                criarInfoLocal(
                    "ENERGIA",
                    `${energia.atual}/${energia.maximo}`
                )
            );
        }

        conteudo.append(
            status
        );


        /* -------------------------------------------------
           HABILIDADES
        ------------------------------------------------- */

        const habilidades =
            criarElemento(
                "article",
                "player-detail-section"
            );

        habilidades.append(
            criarElemento(
                "h3",
                "",
                "⚔️ HABILIDADES"
            )
        );

        for (
            let i = 0;
            i < 3;
            i++
        ) {
            habilidades.append(
                criarSlotDetalheHabilidade(
                    jogador.abilities?.[i],
                    i + 1
                )
            );
        }

        conteudo.append(
            habilidades
        );


        /* -------------------------------------------------
           PASSIVA
        ------------------------------------------------- */

        const passiva =
            criarElemento(
                "article",
                "player-detail-section"
            );

        passiva.append(
            criarElemento(
                "h3",
                "",
                "✦ PASSIVA"
            )
        );

        passiva.append(
            criarSlotDetalheHabilidade(
                jogador.passive,
                null,
                true
            )
        );

        conteudo.append(
            passiva
        );


        /* -------------------------------------------------
           AÇÕES DO MESTRE
        ------------------------------------------------- */

        if (
            usuarioEhMestreLocal()
        ) {
            conteudo.append(
                criarAcoesMestreJogador(
                    jogador
                )
            );
        }


        tela.appendChild(
            conteudo
        );
    }


    function criarInfoLocal(
        titulo,
        valor
    ) {
        const item =
            criarElemento(
                "div",
                "player-detail-info"
            );

        item.append(
            criarElemento(
                "span",
                "",
                titulo
            ),

            criarElemento(
                "strong",
                "",
                valor ?? "—"
            )
        );

        return item;
    }


    function criarSlotDetalheHabilidade(
        habilidade,
        numero = null,
        passiva = false
    ) {
        const item =
            criarElemento(
                "div",
                passiva
                    ? "detail-passive"
                    : "detail-ability"
            );

        const nome =
            obterNomeHabilidadeLocal(
                habilidade
            );

        const descricao =
            obterDescricaoHabilidadeLocal(
                habilidade
            );

        if (numero !== null) {
            item.dataset.slot =
                String(numero);
        }

        item.append(
            criarElemento(
                "strong",
                "",
                passiva
                    ? nome
                    : `${numero}. ${nome}`
            ),

            criarElemento(
                "span",
                "",
                descricao ||
                    (
                        habilidade
                            ? "Sem descrição."
                            : "Slot vazio."
                    )
            )
        );

        if (!habilidade) {
            item.classList.add(
                "empty"
            );
        }

        return item;
    }


    function criarAcoesMestreJogador(
        jogador
    ) {
        const area =
            criarElemento(
                "section",
                "master-player-actions"
            );

        area.append(
            criarElemento(
                "h3",
                "",
                "👑 AÇÕES DO MESTRE"
            )
        );


        const botoes =
            criarElemento(
                "div",
                "master-actions-grid"
            );


        const entregar =
            criarElemento(
                "button",
                "master-action-button",
                "🎁 Entregar item"
            );

        entregar.type = "button";

        entregar.addEventListener(
            "click",
            () => abrirEntregaItem(
                jogador
            )
        );


        const troca =
            criarElemento(
                "button",
                "master-action-button",
                "🔄 Trocar item"
            );

        troca.type = "button";

        troca.addEventListener(
            "click",
            () => abrirTroca(
                jogador
            )
        );


        botoes.append(
            entregar,
            troca
        );

        area.append(
            botoes
        );

        return area;
    }


    /* =====================================================
       ENTREGA DE ITEM
    ===================================================== */

    function abrirEntregaItem(
        jogador
    ) {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "🎁 ENTREGAR ITEM"
            )
        );

        conteudo.append(
            header
        );


        const formulario =
            criarElemento(
                "form",
                "item-delivery-form"
            );

        const nome =
            criarElemento(
                "input",
                "mesa-form-input"
            );

        nome.type = "text";
        nome.placeholder =
            "Nome do item";
        nome.required = true;


        const quantidade =
            criarElemento(
                "input",
                "mesa-form-input"
            );

        quantidade.type =
            "number";

        quantidade.min = "1";
        quantidade.value = "1";


        const descricao =
            criarElemento(
                "textarea",
                "mesa-form-textarea"
            );

        descricao.placeholder =
            "Descrição do item (opcional)...";


        const confirmar =
            criarElemento(
                "button",
                "mesa-primary-button",
                "🎁 Entregar"
            );

        confirmar.type =
            "submit";


        formulario.append(
            criarLabelLocal(
                "Item",
                nome
            ),

            criarLabelLocal(
                "Quantidade",
                quantidade
            ),

            criarLabelLocal(
                "Descrição",
                descricao
            ),

            confirmar
        );


        formulario.addEventListener(
            "submit",
            evento => {
                evento.preventDefault();

                entregarItem(
                    jogador,
                    {
                        name:
                            nome.value.trim(),

                        quantity:
                            Math.max(
                                1,
                                Number(
                                    quantidade.value
                                ) || 1
                            ),

                        description:
                            descricao.value.trim()
                    }
                );
            }
        );


        conteudo.append(
            formulario
        );

        tela.appendChild(
            conteudo
        );
    }


    function criarLabelLocal(
        texto,
        input
    ) {
        const label =
            criarElement(
                "label",
                "mesa-form-label"
            );

        label.append(
            criarElemento(
                "span",
                "",
                texto
            ),
            input
        );

        return label;
    }


    function entregarItem(
        jogador,
        item
    ) {
        const inventario =
            obterInventarioLocal(
                jogador
            );

        if (
            !Array.isArray(
                inventario
            )
        ) {
            jogador.inventory = [];
        }

        const lista =
            Array.isArray(
                jogador.inventory
            )
                ? jogador.inventory
                : [];


        const existente =
            lista.find(
                atual => {
                    const nome =
                        typeof atual ===
                        "string"
                            ? atual
                            : primeiroValor(
                                atual,
                                [
                                    "name",
                                    "nome"
                                ],
                                ""
                            );

                    return (
                        String(nome)
                            .toLowerCase() ===
                        String(item.name)
                            .toLowerCase()
                    );
                }
            );


        if (existente) {
            if (
                typeof existente ===
                "object"
            ) {
                existente.quantity =
                    Number(
                        existente.quantity ||
                        existente.quantidade ||
                        0
                    ) +
                    item.quantity;
            }
        } else {
            lista.push({
                ...item
            });
        }


        jogador.inventory =
            lista;


        notificarLocal(
            `${item.quantity}x ${item.name} entregue para ${obterNomePersonagemLocal(
                jogador
            )}.`,
            3500,
            "success"
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:item-entregue",
                {
                    detail: {
                        jogador,
                        item
                    }
                }
            )
        );


        abrirJogador(
            jogador
        );
    }


    function obterInventarioLocal(
        jogador
    ) {
        const personagem =
            obterPersonagem(
                jogador
            );

        return primeiroValor(
            jogador,
            [
                "inventory",
                "inventario"
            ],
            primeiroValor(
                personagem,
                [
                    "inventory",
                    "inventario"
                ],
                []
            )
        );
    }


    /* =====================================================
       SISTEMA DE TROCA
    ===================================================== */

    function abrirTroca(
        jogadorOrigem
    ) {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "🔄 SISTEMA DE TROCA"
            )
        );

        conteudo.append(
            header
        );


        const origem =
            criarElemento(
                "article",
                "trade-panel"
            );

        origem.append(
            criarElemento(
                "h3",
                "",
                `De: ${obterNomePersonagemLocal(
                    jogadorOrigem
                )}`
            )
        );


        const selectOrigem =
            criarElemento(
                "select",
                "mesa-form-input"
            );

        const inventario =
            obterInventarioLocal(
                jogadorOrigem
            );


        if (
            Array.isArray(
                inventario
            )
        ) {
            inventario.forEach(
                (item, indice) => {
                    const option =
                        criarElemento(
                            "option"
                        );

                    option.value =
                        String(indice);

                    option.textContent =
                        obterNomeItemLocal(
                            item
                        );

                    selectOrigem.append(
                        option
                    );
                }
            );
        }


        origem.append(
            criarLabelLocal(
                "Item",
                selectOrigem
            )
        );


        const destino =
            criarElemento(
                "article",
                "trade-panel"
            );

        destino.append(
            criarElemento(
                "h3",
                "",
                "Para:"
            )
        );


        const selectDestino =
            criarElemento(
                "select",
                "mesa-form-input"
            );


        mesa.jogadores
            .filter(
                jogador =>
                    jogador !==
                    jogadorOrigem
            )
            .forEach(
                jogador => {
                    const option =
                        criarElemento(
                            "option"
                        );

                    option.value =
                        String(
                            obterIdLocal(
                                jogador
                            ) ??
                            mesa.jogadores.indexOf(
                                jogador
                            )
                        );

                    option.textContent =
                        obterNomePersonagemLocal(
                            jogador
                        );

                    selectDestino.append(
                        option
                    );
                }
            );


        destino.append(
            criarLabelLocal(
                "Jogador",
                selectDestino
            )
        );


        const confirmar =
            criarElemento(
                "button",
                "mesa-primary-button",
                "🔄 Realizar troca"
            );

        confirmar.type =
            "button";


        confirmar.addEventListener(
            "click",
            () => {
                const indice =
                    Number(
                        selectOrigem.value
                    );

                const jogadorDestino =
                    encontrarJogadorLocal(
                        selectDestino.value
                    );

                if (
                    !jogadorDestino
                ) {
                    notificarLocal(
                        "Nenhum jogador de destino selecionado.",
                        3000,
                        "error"
                    );

                    return;
                }

                trocarItem(
                    jogadorOrigem,
                    jogadorDestino,
                    indice
                );
            }
        );


        conteudo.append(
            origem,
            destino,
            confirmar
        );

        tela.appendChild(
            conteudo
        );
    }


    function trocarItem(
        origem,
        destino,
        indice
    ) {
        const inventarioOrigem =
            obterInventarioLocal(
                origem
            );

        if (
            !Array.isArray(
                inventarioOrigem
            ) ||
            !inventarioOrigem[indice]
        ) {
            notificarLocal(
                "Item inválido.",
                3000,
                "error"
            );

            return;
        }


        const item =
            inventarioOrigem.splice(
                indice,
                1
            )[0];


        const inventarioDestino =
            obterInventarioLocal(
                destino
            );


        if (
            !Array.isArray(
                inventarioDestino
            )
        ) {
            destino.inventory = [];
        }


        const listaDestino =
            Array.isArray(
                destino.inventory
            )
                ? destino.inventory
                : [];


        listaDestino.push(
            item
        );

        destino.inventory =
            listaDestino;


        notificarLocal(
            `${obterNomeItemLocal(
                item
            )} transferido para ${obterNomePersonagemLocal(
                destino
            )}.`,
            3500,
            "success"
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:item-trocado",
                {
                    detail: {
                        origem,
                        destino,
                        item
                    }
                }
            )
        );


        abrirJogador(
            destino
        );
    }


    function encontrarJogadorLocal(
        id
    ) {
        return mesa.jogadores.find(
            jogador =>
                String(
                    obterIdLocal(
                        jogador
                    )
                ) === String(id)
        ) || mesa.jogadores[
            Number(id)
        ] || null;
    }


    /* =====================================================
       MAPA
    ===================================================== */

    function renderizarMapa() {
        const tela =
            mesa.elementos.tela;

        if (!tela) return;

        limparElemento(tela);

        mesa.telaAtual =
            "mapa";

        definirModo(
            "map"
        );

        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen map-screen"
            );

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltarMesa(),

            criarElemento(
                "h2",
                "",
                "🗺️ MAPA"
            )
        );

        conteudo.append(
            header
        );


        const controles =
            criarElemento(
                "div",
                "map-controls"
            );

        const diminuir =
            criarElemento(
                "button",
                "map-control-button",
                "−"
            );

        const resetar =
            criarElemento(
                "button",
                "map-control-button",
                "⟳"
            );

        const aumentar =
            criarElemento(
                "button",
                "map-control-button",
                "+"
            );


        diminuir.type =
            "button";

        resetar.type =
            "button";

        aumentar.type =
            "button";


        controles.append(
            diminuir,
            resetar,
            aumentar
        );


        const mapaContainer =
            criarElemento(
                "div",
                "mesa-map"
            );

        mapaContainer.id =
            "mesa-map";


        const svg =
            criarMapaSVG();

        mapaContainer.append(
            svg
        );


        diminuir.addEventListener(
            "click",
            () => alterarZoomMapa(
                -0.1,
                svg
            )
        );


        aumentar.addEventListener(
            "click",
            () => alterarZoomMapa(
                0.1,
                svg
            )
        );


        resetar.addEventListener(
            "click",
            () => resetarMapa(
                svg
            )
        );


        conteudo.append(
            controles,
            mapaContainer
        );


        tela.appendChild(
            conteudo
        );
    }


    function criarMapaSVG() {
        const svg =
            document.createElementNS(
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

        svg.classList.add(
            "mesa-map-svg"
        );


        /* -------------------------------------------------
           FUNDO
        ------------------------------------------------- */

        const fundo =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
            );

        fundo.setAttribute(
            "x",
            "0"
        );

        fundo.setAttribute(
            "y",
            "0"
        );

        fundo.setAttribute(
            "width",
            "1000"
        );

        fundo.setAttribute(
            "height",
            "600"
        );

        fundo.setAttribute(
            "rx",
            "20"
        );

        fundo.classList.add(
            "map-background"
        );

        svg.appendChild(
            fundo
        );


        /* -------------------------------------------------
           REGIÕES
        ------------------------------------------------- */

        const regioes = [
            {
                nome: "Sylvandor",
                x: 70,
                y: 70,
                largura: 260,
                altura: 180
            },

            {
                nome: "Aqualith",
                x: 650,
                y: 80,
                largura: 270,
                altura: 170
            },

            {
                nome: "Caelwyn",
                x: 70,
                y: 350,
                largura: 260,
                altura: 170
            },

            {
                nome: "Pyrrathis",
                x: 650,
                y: 340,
                largura: 270,
                altura: 180
            },

            {
                nome: "Iligandres",
                x: 390,
                y: 220,
                largura: 220,
                altura: 160
            }
        ];


        regioes.forEach(
            regiao => {
                const grupo =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "g"
                    );

                grupo.classList.add(
                    "map-region"
                );

                grupo.dataset.region =
                    regiao.nome;


                const retangulo =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "rect"
                    );

                retangulo.setAttribute(
                    "x",
                    regiao.x
                );

                retangulo.setAttribute(
                    "y",
                    regiao.y
                );

                retangulo.setAttribute(
                    "width",
                    regiao.largura
                );

                retangulo.setAttribute(
                    "height",
                    regiao.altura
                );

                retangulo.setAttribute(
                    "rx",
                    "24"
                );

                retangulo.classList.add(
                    "map-region-shape"
                );


                const texto =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "text"
                    );

                texto.setAttribute(
                    "x",
                    regiao.x +
                    regiao.largura / 2
                );

                texto.setAttribute(
                    "y",
                    regiao.y +
                    regiao.altura / 2
                );

                texto.setAttribute(
                    "text-anchor",
                    "middle"
                );

                texto.setAttribute(
                    "dominant-baseline",
                    "middle"
                );

                texto.classList.add(
                    "map-region-label"
                );

                texto.textContent =
                    regiao.nome;


                grupo.append(
                    retangulo,
                    texto
                );


                grupo.addEventListener(
                    "click",
                    () => {
                        selecionarRegiaoMapa(
                            regiao.nome
                        );
                    }
                );


                svg.appendChild(
                    grupo
                );
            }
        );


        /* -------------------------------------------------
           RIOS / FLUXOS
        ------------------------------------------------- */

        const rios = [
            "M 330 150 C 400 180, 430 210, 500 300",
            "M 670 160 C 610 190, 570 240, 500 300",
            "M 320 430 C 390 400, 430 350, 500 300",
            "M 680 420 C 620 390, 570 350, 500 300"
        ];


        rios.forEach(
            caminho => {
                const path =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "path"
                    );

                path.setAttribute(
                    "d",
                    caminho
                );

                path.classList.add(
                    "map-river"
                );

                svg.appendChild(
                    path
                );
            }
        );


        /* -------------------------------------------------
           ILIGANDRES / CENTRO
        ------------------------------------------------- */

        const centro =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );

        centro.setAttribute(
            "cx",
            "500"
        );

        centro.setAttribute(
            "cy",
            "300"
        );

        centro.setAttribute(
            "r",
            "24"
        );

        centro.classList.add(
            "map-center-marker"
        );

        svg.appendChild(
            centro
        );


        const centroTexto =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );

        centroTexto.setAttribute(
            "x",
            "500"
        );

        centroTexto.setAttribute(
            "y",
            "300"
        );

        centroTexto.setAttribute(
            "text-anchor",
            "middle"
        );

        centroTexto.setAttribute(
            "dominant-baseline",
            "middle"
        );

        centroTexto.classList.add(
            "map-center-text"
        );

        centroTexto.textContent =
            "✦";


        svg.appendChild(
            centroTexto
        );


        /* -------------------------------------------------
           PORTAIS
        ------------------------------------------------- */

        const portais = [
            {
                nome: "Abismo de Nyx",
                x: 190,
                y: 160,
                ativo: true
            },

            {
                nome: "Fenda do Sussurro",
                x: 210,
                y: 430,
                ativo: true
            },

            {
                nome: "Vórtice de Lhor",
                x: 500,
                y: 260,
                ativo: false
            },

            {
                nome: "Ruptura de Sera",
                x: 780,
                y: 430,
                ativo: true
            },

            {
                nome: "Fissura de Felgan",
                x: 790,
                y: 160,
                ativo: false
            }
        ];


        portais.forEach(
            portal => {
                const grupo =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "g"
                    );

                grupo.classList.add(
                    "map-portal"
                );

                if (
                    portal.ativo
                ) {
                    grupo.classList.add(
                        "active"
                    );
                } else {
                    grupo.classList.add(
                        "inactive"
                    );
                }


                const circulo =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "circle"
                    );

                circulo.setAttribute(
                    "cx",
                    portal.x
                );

                circulo.setAttribute(
                    "cy",
                    portal.y
                );

                circulo.setAttribute(
                    "r",
                    "12"
                );


                const aura =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "circle"
                    );

                aura.setAttribute(
                    "cx",
                    portal.x
                );

                aura.setAttribute(
                    "cy",
                    portal.y
                );

                aura.setAttribute(
                    "r",
                    "22"
                );

                aura.classList.add(
                    "map-portal-aura"
                );


                grupo.append(
                    aura,
                    circulo
                );


                grupo.addEventListener(
                    "click",
                    () => {
                        selecionarPortalMapa(
                            portal
                        );
                    }
                );


                svg.appendChild(
                    grupo
                );
            }
        );


        adicionarInteracaoMapa(
            svg
        );

        return svg;
    }


    /* =====================================================
       INTERAÇÃO DO MAPA
    ===================================================== */

    function alterarZoomMapa(
        valor,
        svg
    ) {
        mesa.mapa.escala =
            Math.max(
                0.6,
                Math.min(
                    2.5,
                    mesa.mapa.escala +
                    valor
                )
            );

        aplicarTransformacaoMapa(
            svg
        );
    }


    function resetarMapa(
        svg
    ) {
        mesa.mapa.x = 0;
        mesa.mapa.y = 0;
        mesa.mapa.escala = 1;

        aplicarTransformacaoMapa(
            svg
        );
    }


    function aplicarTransformacaoMapa(
        svg
    ) {
        if (!svg) return;

        svg.style.transform =
            `translate(${mesa.mapa.x}px, ${mesa.mapa.y}px) scale(${mesa.mapa.escala})`;
    }


    function adicionarInteracaoMapa(
        svg
    ) {
        let arrastando = false;

        let inicioX = 0;
        let inicioY = 0;

        let origemX = 0;
        let origemY = 0;


        svg.addEventListener(
            "pointerdown",
            evento => {
                arrastando = true;

                inicioX =
                    evento.clientX;

                inicioY =
                    evento.clientY;

                origemX =
                    mesa.mapa.x;

                origemY =
                    mesa.mapa.y;

                svg.setPointerCapture(
                    evento.pointerId
                );

                svg.classList.add(
                    "dragging"
                );
            }
        );


        svg.addEventListener(
            "pointermove",
            evento => {
                if (!arrastando) {
                    return;
                }

                mesa.mapa.x =
                    origemX +
                    (
                        evento.clientX -
                        inicioX
                    );

                mesa.mapa.y =
                    origemY +
                    (
                        evento.clientY -
                        inicioY
                    );

                aplicarTransformacaoMapa(
                    svg
                );
            }
        );


        const finalizar =
            evento => {
                if (!arrastando) {
                    return;
                }

                arrastando = false;

                try {
                    svg.releasePointerCapture(
                        evento.pointerId
                    );
                } catch (_) {}

                svg.classList.remove(
                    "dragging"
                );
            };


        svg.addEventListener(
            "pointerup",
            finalizar
        );

        svg.addEventListener(
            "pointercancel",
            finalizar
        );

        svg.addEventListener(
            "pointerleave",
            evento => {
                if (
                    evento.pointerType ===
                    "mouse"
                ) {
                    finalizar(
                        evento
                    );
                }
            }
        );
    }


    function selecionarRegiaoMapa(
        nome
    ) {
        notificarLocal(
            `Região selecionada: ${nome}`,
            2500
        );

        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:regiao-selecionada",
                {
                    detail: {
                        nome
                    }
                }
            )
        );
    }


    function selecionarPortalMapa(
        portal
    ) {
        const estado =
            portal.ativo
                ? "ATIVO"
                : "INERTE";

        notificarLocal(
            `${portal.nome} — ${estado}`,
            3000,
            portal.ativo
                ? "success"
                : "normal"
        );

        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:portal-selecionado",
                {
                    detail: portal
                }
            )
        );
    }


    /* =====================================================
       FUNÇÕES LOCAIS DE DADOS
    ===================================================== */

    function obterNomePersonagemLocal(
        jogador
    ) {
        const personagem =
            obterPersonagem(
                jogador
            );

        return primeiroValor(
            jogador,
            [
                "character_name",
                "characterName",
                "personagem_nome",
                "personagemNome"
            ],
            primeiroValor(
                personagem,
                [
                    "name",
                    "nome"
                ],
                "Personagem"
            )
        );
    }


    function obterRacaLocal(
        jogador
    ) {
        const personagem =
            obterPersonagem(
                jogador
            );

        return primeiroValor(
            jogador,
            [
                "race",
                "raca"
            ],
            primeiroValor(
                personagem,
                [
                    "race",
                    "raca"
                ],
                "—"
            )
        );
    }


    function obterClasseLocal(
        jogador
    ) {
        const personagem =
            obterPersonagem(
                jogador
            );

        return primeiroValor(
            jogador,
            [
                "class",
                "classe"
            ],
            primeiroValor(
                personagem,
                [
                    "class",
                    "classe"
                ],
                "—"
            )
        );
    }


    function obterAfinidadeLocal(
        jogador
    ) {
        const personagem =
            obterPersonagem(
                jogador
            );

        return primeiroValor(
            jogador,
            [
                "affinity",
                "afinidade"
            ],
            primeiroValor(
                personagem,
                [
                    "affinity",
                    "afinidade"
                ],
                "—"
            )
        );
    }


    function obterNomeHabilidadeLocal(
        habilidade
    ) {
        if (!habilidade) {
            return "Slot vazio";
        }

        if (
            typeof habilidade ===
            "string"
        ) {
            return habilidade;
        }

        return primeiroValor(
            habilidade,
            [
                "name",
                "nome",
                "title",
                "titulo"
            ],
            "Habilidade"
        );
    }


    function obterDescricaoHabilidadeLocal(
        habilidade
    ) {
        if (!habilidade) {
            return "";
        }

        if (
            typeof habilidade ===
            "string"
        ) {
            return "";
        }

        return primeiroValor(
            habilidade,
            [
                "description",
                "descricao",
                "detail",
                "detalhe",
                "effect",
                "efeito"
            ],
            ""
        );
    }


    function obterNomeItemLocal(
        item
    ) {
        if (
            typeof item ===
            "string"
        ) {
            return item;
        }

        return primeiroValor(
            item,
            [
                "name",
                "nome",
                "itemName",
                "item_name"
            ],
            "Item"
        );
    }


    function usuarioEhMestreLocal() {
        const usuario =
            obterUsuarioAtualLocal();

        if (!usuario) {
            return false;
        }

        if (
            window.rpgAuth?.isMaster ===
            true
        ) {
            return true;
        }

        const idUsuario =
            obterIdLocal(
                usuario
            );

        const idMestre =
            primeiroValor(
                mesa.campanha,
                [
                    "master_id",
                    "masterId",
                    "mestre_id",
                    "mestreId"
                ],
                null
            );

        return (
            idUsuario !== null &&
            idMestre !== null &&
            String(idUsuario) ===
            String(idMestre)
        );
    }


    function notificarLocal(
        mensagem,
        duracao = 3000,
        tipo = "normal"
    ) {
        if (
            typeof window.notificarMesa ===
            "function"
        ) {
            window.notificarMesa(
                mensagem,
                duracao,
                tipo
            );

            return;
        }

        const elemento =
            mesa.elementos.notificacao;

        if (!elemento) return;

        elemento.textContent =
            mensagem;

        elemento.className =
            `mesa-notificacao notification-${tipo} visible`;

        clearTimeout(
            mesa._notificacaoTimer
        );

        mesa._notificacaoTimer =
            setTimeout(
                () => {
                    elemento.classList.remove(
                        "visible"
                    );
                },
                duracao
            );
    }


    /* =====================================================
       ATUALIZAÇÃO DOS CARDS
    ===================================================== */

    function atualizarCards() {
        if (
            typeof mesa.renderizarCardsJogadores ===
            "function"
        ) {
            mesa.renderizarCardsJogadores();
        }

        if (
            typeof mesa.renderizarAssentos ===
            "function"
        ) {
            mesa.renderizarAssentos();
        }
    }


    /* =====================================================
       EXPORTAÇÕES
    ===================================================== */

    mesa.renderizarInterface =
        renderizarInterface;

    mesa.renderizarNecessidades =
        renderizarNecessidades;

    mesa.renderizarJogadores =
        renderizarJogadores;

    mesa.abrirJogador =
        abrirJogador;

    mesa.abrirEntregaItem =
        abrirEntregaItem;

    mesa.entregarItem =
        entregarItem;

    mesa.abrirTroca =
        abrirTroca;

    mesa.trocarItem =
        trocarItem;

    mesa.renderizarMapa =
        renderizarMapa;

    mesa.atualizarCards =
        atualizarCards;


    window.renderizarInterfaceMesa =
        renderizarInterface;

    window.renderizarMapaMesa =
        renderizarMapa;

    window.renderizarJogadoresMesa =
        renderizarJogadores;

    window.abrirJogadorMesa =
        abrirJogador;

    window.entregarItemMesa =
        entregarItem;

    window.abrirTrocaMesa =
        abrirTroca;


    /* =====================================================
       EVENTOS INTERNOS
    ===================================================== */

    window.addEventListener(
        "rpg:mesa:atualizar-jogadores",
        () => {
            atualizarCards();
        }
    );


    window.addEventListener(
        "rpg:mesa:inventario-atualizado",
        () => {
            atualizarCards();
        }
    );


    console.log(
        "Mesa RPG — Parte 2 carregada."
    );

})();
})();
/* =========================================================
   MESA RPG ONLINE
   mesa.js
   PARTE 3/3
   ---------------------------------------------------------
   Combate
   CTE
   Boss
   Configurações
   Eventos
   Inicialização
   Integração
========================================================= */

(() => {
    "use strict";

    const mesa = window.rpgMesa;

    if (!mesa) {
        console.error(
            "Mesa RPG: as partes anteriores não foram carregadas."
        );
        return;
    }


    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    const criarElemento = (
        tag,
        classe = "",
        texto = ""
    ) => {
        const elemento =
            document.createElement(tag);

        if (classe) {
            elemento.className = classe;
        }

        if (texto !== "") {
            elemento.textContent = texto;
        }

        return elemento;
    };


    const limparElemento = elemento => {
        if (!elemento) return;

        while (elemento.firstChild) {
            elemento.removeChild(
                elemento.firstChild
            );
        }
    };


    const primeiroValor = (
        objeto,
        campos,
        padrao = null
    ) => {
        if (!objeto) {
            return padrao;
        }

        for (const campo of campos) {
            const valor =
                objeto[campo];

            if (
                valor !== undefined &&
                valor !== null &&
                valor !== ""
            ) {
                return valor;
            }
        }

        return padrao;
    };


    function obterId(objeto) {
        return primeiroValor(
            objeto,
            [
                "id",
                "uid",
                "user_id",
                "userId",
                "player_id",
                "playerId"
            ],
            null
        );
    }


    function obterNome(objeto) {
        return primeiroValor(
            objeto,
            [
                "name",
                "nome",
                "username",
                "displayName",
                "display_name"
            ],
            "Jogador"
        );
    }


    function obterUsuarioAtual() {
        if (
            window.rpgAuth?.user
        ) {
            return window.rpgAuth.user;
        }

        if (
            window.rpgAuth?.usuario
        ) {
            return window.rpgAuth.usuario;
        }

        if (
            window.usuarioAtual
        ) {
            return window.usuarioAtual;
        }

        return null;
    }


    function usuarioEhMestre() {
        const usuario =
            obterUsuarioAtual();

        if (!usuario) {
            return false;
        }

        if (
            window.rpgAuth?.isMaster ===
            true
        ) {
            return true;
        }

        const idUsuario =
            obterId(usuario);

        const idMestre =
            primeiroValor(
                mesa.campanha,
                [
                    "master_id",
                    "masterId",
                    "mestre_id",
                    "mestreId"
                ],
                null
            );

        return (
            idUsuario !== null &&
            idMestre !== null &&
            String(idUsuario) ===
            String(idMestre)
        );
    }


    function notificar(
        mensagem,
        duracao = 3000,
        tipo = "normal"
    ) {
        if (
            typeof window.notificarMesa ===
            "function"
        ) {
            window.notificarMesa(
                mensagem,
                duracao,
                tipo
            );

            return;
        }

        const elemento =
            mesa.elementos.notificacao;

        if (!elemento) return;

        elemento.textContent =
            mensagem;

        elemento.className =
            `mesa-notificacao notification-${tipo} visible`;

        clearTimeout(
            mesa._notificacaoTimer
        );

        mesa._notificacaoTimer =
            setTimeout(
                () => {
                    elemento.classList.remove(
                        "visible"
                    );
                },
                duracao
            );
    }


    function limparTela() {
        const tela =
            mesa.elementos.tela;

        if (tela) {
            limparElemento(
                tela
            );
        }
    }


    function criarBotaoVoltar() {
        const botao =
            criarElemento(
                "button",
                "mesa-back-button",
                "← Voltar"
            );

        botao.type =
            "button";

        botao.addEventListener(
            "click",
            () => {
                if (
                    typeof mesa.renderizarInterface ===
                    "function"
                ) {
                    mesa.renderizarInterface();
                }
            }
        );

        return botao;
    }


    function definirModo(modo) {
        mesa.modo =
            modo;

        const area =
            mesa.elementos.mesaArea;

        const status =
            mesa.elementos.statusMesa;

        if (area) {
            area.classList.remove(
                "mesa-state-interface",
                "mesa-state-combat",
                "mesa-state-cte",
                "mesa-state-map",
                "mesa-state-boss",
                "mesa-state-campaign"
            );

            area.classList.add(
                `mesa-state-${modo}`
            );
        }

        const nomes = {
            interface:
                "🟢 INTERFACE",

            combat:
                "⚔️ COMBATE",

            cte:
                "🎭 CTE",

            map:
                "🗺️ MAPA",

            boss:
                "👹 BOSS",

            campaign:
                "📖 CAMPANHA"
        };

        if (status) {
            status.textContent =
                nomes[modo] ||
                "🟢 INTERFACE";
        }

        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:modo",
                {
                    detail: {
                        modo
                    }
                }
            )
        );
    }


    /* =====================================================
       COMBATE
    ===================================================== */

    function renderizarCombate(
        dados = null
    ) {
        limparTela();

        mesa.telaAtual =
            "combate";

        definirModo(
            "combat"
        );

        const tela =
            mesa.elementos.tela;

        const conteudo =
            criarElemento(
                "section",
                "mesa-combat-screen"
            );


        /* -------------------------------------------------
           CABEÇALHO
        ------------------------------------------------- */

        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "⚔️ COMBATE"
            )
        );

        conteudo.append(
            header
        );


        /* -------------------------------------------------
           COMBATE ATIVO
        ------------------------------------------------- */

        if (
            mesa.combate
        ) {
            const combateInfo =
                criarElemento(
                    "article",
                    "combat-info"
                );

            combateInfo.append(
                criarElemento(
                    "h3",
                    "",
                    mesa.combate.nome ||
                    "Combate em andamento"
                ),

                criarElemento(
                    "p",
                    "",
                    mesa.combate.descricao ||
                    "O combate está acontecendo."
                )
            );


            /* ---------------------------------------------
               PARTICIPANTES
            --------------------------------------------- */

            const participantes =
                criarElemento(
                    "div",
                    "combat-participants"
                );

            mesa.jogadores.forEach(
                jogador => {
                    const participante =
                        criarParticipanteCombate(
                            jogador
                        );

                    participantes.append(
                        participante
                    );
                }
            );


            combateInfo.append(
                participantes
            );

            conteudo.append(
                combateInfo
            );


            /* ---------------------------------------------
               CONTROLE DO MESTRE
            --------------------------------------------- */

            if (
                usuarioEhMestre()
            ) {
                const finalizar =
                    criarElemento(
                        "button",
                        "mesa-danger-button",
                        "⛔ Encerrar combate"
                    );

                finalizar.type =
                    "button";

                finalizar.addEventListener(
                    "click",
                    finalizarCombate
                );

                conteudo.append(
                    finalizar
                );
            }
        }

        /* -------------------------------------------------
           SEM COMBATE
        ------------------------------------------------- */

        else {
            const vazio =
                criarElemento(
                    "div",
                    "combat-empty"
                );

            vazio.append(
                criarElemento(
                    "div",
                    "combat-empty-icon",
                    "⚔️"
                ),

                criarElemento(
                    "h3",
                    "",
                    "Nenhum combate ativo"
                ),

                criarElemento(
                    "p",
                    "",
                    usuarioEhMestre()
                        ? "O Mestre pode iniciar um combate."
                        : "Aguardando o Mestre iniciar o combate."
                )
            );


            if (
                usuarioEhMestre()
            ) {
                const iniciar =
                    criarElemento(
                        "button",
                        "mesa-primary-button",
                        "⚔️ Iniciar combate"
                    );

                iniciar.type =
                    "button";

                iniciar.addEventListener(
                    "click",
                    () => {
                        iniciarCombate();
                    }
                );

                vazio.append(
                    iniciar
                );
            }

            conteudo.append(
                vazio
            );
        }


        tela.appendChild(
            conteudo
        );
    }


    function criarParticipanteCombate(
        jogador
    ) {
        const item =
            criarElement(
                "article",
                "combat-player"
            );

        const hp =
            obterHPCombate(
                jogador
            );

        const percentual =
            hp.max > 0
                ? Math.max(
                    0,
                    Math.min(
                        100,
                        hp.atual /
                        hp.max *
                        100
                    )
                )
                : 0;


        item.append(
            criarElemento(
                "strong",
                "combat-player-name",
                obterNomePersonagem(
                    jogador
                )
            ),

            criarElemento(
                "span",
                "combat-player-hp",
                `HP ${hp.atual}/${hp.max}`
            )
        );


        const barra =
            criarElemento(
                "div",
                "resource-bar"
            );

        const fill =
            criarElemento(
                "div",
                "resource-fill"
            );

        fill.style.width =
            `${percentual}%`;

        barra.append(
            fill
        );

        item.append(
            barra
        );

        return item;
    }


    function obterHPCombate(
        jogador
    ) {
        if (
            typeof mesa.obterHP ===
            "function"
        ) {
            const hp =
                mesa.obterHP(
                    jogador
                );

            return {
                atual:
                    Number(hp.atual) || 0,

                max:
                    Number(hp.maximo) || 1
            };
        }

        return {
            atual: 0,
            max: 1
        };
    }


    function obterNomePersonagem(
        jogador
    ) {
        const personagem =
            jogador?.character ||
            jogador?.personagem ||
            {};

        return primeiroValor(
            jogador,
            [
                "character_name",
                "characterName",
                "personagem_nome",
                "personagemNome"
            ],
            primeiroValor(
                personagem,
                [
                    "name",
                    "nome"
                ],
                "Personagem"
            )
        );
    }


    function iniciarCombate(
        dados = {}
    ) {
        if (
            !usuarioEhMestre()
        ) {
            notificar(
                "Somente o Mestre pode iniciar um combate.",
                3000,
                "error"
            );

            return;
        }

        mesa.combate = {
            id:
                dados.id ||
                `combat-${Date.now()}`,

            nome:
                dados.nome ||
                dados.name ||
                "Combate",

            descricao:
                dados.descricao ||
                dados.description ||
                "Combate iniciado pelo Mestre.",

            iniciadoEm:
                new Date().toISOString(),

            participantes:
                mesa.jogadores.map(
                    jogador => ({
                        id:
                            obterId(
                                jogador
                            ),

                        nome:
                            obterNomePersonagem(
                                jogador
                            )
                    })
                )
        };


        definirModo(
            "combat"
        );

        renderizarCombate();


        notificar(
            "⚔️ Combate iniciado!",
            3000,
            "success"
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:combate-iniciado",
                {
                    detail:
                        mesa.combate
                }
            )
        );
    }


    function finalizarCombate() {
        if (
            !mesa.combate
        ) {
            return;
        }

        const combateAnterior =
            mesa.combate;

        mesa.combate =
            null;

        definirModo(
            "interface"
        );

        if (
            typeof mesa.renderizarInterface ===
            "function"
        ) {
            mesa.renderizarInterface();
        }

        notificar(
            "⚔️ Combate encerrado.",
            3000
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:combate-finalizado",
                {
                    detail:
                        combateAnterior
                }
            )
        );
    }


    mesa.renderizarCombate =
        renderizarCombate;

    mesa.iniciarCombate =
        iniciarCombate;

    mesa.finalizarCombate =
        finalizarCombate;

    window.iniciarCombateMesa =
        iniciarCombate;

    window.finalizarCombateMesa =
        finalizarCombate;


    /* =====================================================
       CTE
       -----------------------------------------------------
       CTE = Cena / decisão / evento temporário
    ===================================================== */

    function iniciarCTE(
        dados = {}
    ) {
        if (
            !usuarioEhMestre()
        ) {
            notificar(
                "Somente o Mestre pode iniciar um CTE.",
                3000,
                "error"
            );

            return;
        }


        if (
            mesa.cteTimer
        ) {
            clearInterval(
                mesa.cteTimer
            );

            mesa.cteTimer =
                null;
        }


        const opcoes =
            Array.isArray(
                dados.options
            )
                ? dados.options
                : Array.isArray(
                    dados.opcoes
                )
                    ? dados.opcoes
                    : [
                        "Continuar",
                        "Recuar"
                    ];


        const tempo =
            Math.max(
                1,
                Number(
                    dados.timeLimit ||
                    dados.tempo ||
                    dados.duracao ||
                    10
                )
            );


        mesa.cte = {
            id:
                dados.id ||
                `cte-${Date.now()}`,

            titulo:
                dados.title ||
                dados.titulo ||
                "Evento",

            descricao:
                dados.description ||
                dados.descricao ||
                "Escolha uma ação.",

            options:
                opcoes,

            timeLimit:
                tempo,

            remaining:
                tempo,

            active:
                true,

            response:
                null,

            startedAt:
                new Date().toISOString()
        };


        definirModo(
            "cte"
        );

        renderizarCTE();

        iniciarTimerCTE();


        notificar(
            "🎭 Um CTE foi iniciado!",
            3000
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:cte-iniciado",
                {
                    detail:
                        mesa.cte
                }
            )
        );
    }


    function renderizarCTE() {
        limparTela();

        mesa.telaAtual =
            "cte";

        definirModo(
            "cte"
        );

        const tela =
            mesa.elementos.tela;


        const conteudo =
            criarElemento(
                "section",
                "mesa-cte-screen"
            );


        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "🎭 CTE"
            )
        );

        conteudo.append(
            header
        );


        if (
            !mesa.cte ||
            !mesa.cte.active
        ) {
            const vazio =
                criarElemento(
                    "div",
                    "cte-empty"
                );

            vazio.append(
                criarElemento(
                    "div",
                    "cte-empty-icon",
                    "🎭"
                ),

                criarElemento(
                    "h3",
                    "",
                    "Nenhum CTE ativo"
                ),

                criarElemento(
                    "p",
                    "",
                    usuarioEhMestre()
                        ? "O Mestre pode iniciar um evento."
                        : "Aguardando um evento do Mestre."
                )
            );


            if (
                usuarioEhMestre()
            ) {
                const iniciar =
                    criarElemento(
                        "button",
                        "mesa-primary-button",
                        "🎭 Criar CTE"
                    );

                iniciar.type =
                    "button";

                iniciar.addEventListener(
                    "click",
                    () => {
                        iniciarCTE({
                            title:
                                "Escolha rápida",

                            description:
                                "O grupo precisa decidir rapidamente.",

                            options: [
                                "Esquerda",
                                "Direita"
                            ],

                            timeLimit:
                                10
                        });
                    }
                );

                vazio.append(
                    iniciar
                );
            }


            conteudo.append(
                vazio
            );

            tela.appendChild(
                conteudo
            );

            return;
        }


        /* -------------------------------------------------
           CTE ATIVO
        ------------------------------------------------- */

        const painel =
            criarElemento(
                "article",
                "mesa-cte-panel"
            );


        painel.append(
            criarElemento(
                "h3",
                "cte-title",
                mesa.cte.titulo
            ),

            criarElemento(
                "p",
                "cte-description",
                mesa.cte.descricao
            )
        );


        const timer =
            criarElemento(
                "div",
                "cte-timer",
                `${mesa.cte.remaining}s`
            );

        timer.id =
            "mesa-cte-timer";


        painel.append(
            timer
        );


        const opcoes =
            criarElemento(
                "div",
                "cte-options"
            );


        mesa.cte.options.forEach(
            (opcao, indice) => {
                const botao =
                    criarElemento(
                        "button",
                        "cte-option",
                        typeof opcao ===
                        "string"
                            ? opcao
                            : obterNomeOpcao(
                                opcao
                            )
                    );

                botao.type =
                    "button";

                botao.dataset.option =
                    String(indice);


                botao.addEventListener(
                    "click",
                    () => {
                        responderCTE(
                            indice
                        );
                    }
                );


                opcoes.append(
                    botao
                );
            }
        );


        painel.append(
            opcoes
        );

        conteudo.append(
            painel
        );

        tela.appendChild(
            conteudo
        );
    }


    function obterNomeOpcao(
        opcao
    ) {
        if (
            typeof opcao ===
            "string"
        ) {
            return opcao;
        }

        return primeiroValor(
            opcao,
            [
                "name",
                "nome",
                "title",
                "titulo"
            ],
            "Opção"
        );
    }


    function iniciarTimerCTE() {
        if (
            mesa.cteTimer
        ) {
            clearInterval(
                mesa.cteTimer
            );
        }


        mesa.cteTimer =
            setInterval(
                () => {
                    if (
                        !mesa.cte ||
                        !mesa.cte.active
                    ) {
                        clearInterval(
                            mesa.cteTimer
                        );

                        mesa.cteTimer =
                            null;

                        return;
                    }


                    mesa.cte.remaining--;

                    atualizarTimerCTE();


                    if (
                        mesa.cte.remaining <= 0
                    ) {
                        finalizarCTE(
                            "tempo"
                        );
                    }
                },
                1000
            );
    }


    function atualizarTimerCTE() {
        const timer =
            document.getElementById(
                "mesa-cte-timer"
            );

        if (!timer) {
            return;
        }

        timer.textContent =
            `${Math.max(
                0,
                mesa.cte?.remaining ||
                0
            )}s`;
    }


    function responderCTE(
        indice
    ) {
        if (
            !mesa.cte ||
            !mesa.cte.active
        ) {
            return;
        }


        const opcao =
            mesa.cte.options[
                indice
            ];


        if (
            opcao === undefined
        ) {
            return;
        }


        mesa.cte.response =
            typeof opcao ===
            "string"
                ? opcao
                : obterNomeOpcao(
                    opcao
                );


        mesa.cte.active =
            false;


        finalizarCTE(
            "resposta"
        );
    }


    function finalizarCTE(
        motivo = "manual"
    ) {
        if (
            mesa.cteTimer
        ) {
            clearInterval(
                mesa.cteTimer
            );

            mesa.cteTimer =
                null;
        }


        if (!mesa.cte) {
            return;
        }


        const resultado = {
            ...mesa.cte,

            motivo
        };


        mesa.cte =
            null;


        definirModo(
            "interface"
        );


        if (
            typeof mesa.renderizarInterface ===
            "function"
        ) {
            mesa.renderizarInterface();
        }


        let mensagem =
            "🎭 CTE finalizado.";


        if (
            motivo ===
            "tempo"
        ) {
            mensagem =
                "⏰ O tempo do CTE acabou.";
        }


        if (
            resultado.response
        ) {
            mensagem =
                `🎭 Escolha: ${resultado.response}`;
        }


        notificar(
            mensagem,
            3500
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:cte-finalizado",
                {
                    detail:
                        resultado
                }
            )
        );
    }


    mesa.renderizarCTE =
        renderizarCTE;

    mesa.iniciarCTE =
        iniciarCTE;

    mesa.responderCTE =
        responderCTE;

    mesa.finalizarCTE =
        finalizarCTE;

    window.iniciarCTEMesa =
        iniciarCTE;

    window.finalizarCTEMesa =
        finalizarCTE;


    /* =====================================================
       BOSS
    ===================================================== */

    function ativarBoss(
        nome = "BOSS"
    ) {
        if (
            !usuarioEhMestre()
        ) {
            notificar(
                "Somente o Mestre pode ativar um BOSS.",
                3000,
                "error"
            );

            return;
        }


        finalizarBoss(
            false
        );


        mesa.boss = {
            id:
                `boss-${Date.now()}`,

            nome:
                nome ||
                "BOSS",

            ativo:
                true,

            ativadoEm:
                new Date().toISOString()
        };


        definirModo(
            "boss"
        );


        const painel =
            mesa.elementos.painel;

        if (painel) {
            painel.classList.add(
                "boss-active"
            );
        }


        const alerta =
            criarElemento(
                "div",
                "mesa-boss-alert"
            );

        alerta.id =
            "mesa-boss-alert";


        alerta.append(
            criarElemento(
                "span",
                "boss-alert-icon",
                "👹"
            ),

            criarElemento(
                "strong",
                "",
                "BOSS ATIVADO"
            ),

            criarElemento(
                "span",
                "boss-alert-name",
                nome
            )
        );


        if (painel) {
            painel.append(
                alerta
            );
        }


        notificar(
            `👹 ${nome} apareceu!`,
            4000,
            "error"
        );


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:boss-ativado",
                {
                    detail:
                        mesa.boss
                }
            )
        );


        mesa.bossTimer =
            setTimeout(
                () => {
                    finalizarBoss();
                },
                5000
            );
    }


    function finalizarBoss(
        notificarFim = true
    ) {
        if (
            mesa.bossTimer
        ) {
            clearTimeout(
                mesa.bossTimer
            );

            mesa.bossTimer =
                null;
        }


        const bossAnterior =
            mesa.boss;


        mesa.boss =
            null;


        const alerta =
            document.getElementById(
                "mesa-boss-alert"
            );

        if (alerta) {
            alerta.remove();
        }


        const painel =
            mesa.elementos.painel;

        if (painel) {
            painel.classList.remove(
                "boss-active"
            );
        }


        if (
            mesa.modo ===
            "boss"
        ) {
            definirModo(
                "interface"
            );
        }


        if (
            notificarFim &&
            bossAnterior
        ) {
            notificar(
                `👹 ${bossAnterior.nome} saiu da tela.`,
                2500
            );
        }


        if (
            bossAnterior
        ) {
            window.dispatchEvent(
                new CustomEvent(
                    "rpg:mesa:boss-finalizado",
                    {
                        detail:
                            bossAnterior
                    }
                )
            );
        }
    }


    mesa.ativarBoss =
        ativarBoss;

    mesa.finalizarBoss =
        finalizarBoss;

    window.ativarBossMesa =
        ativarBoss;

    window.finalizarBossMesa =
        finalizarBoss;


    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    function abrirConfiguracoesMesa() {
        limparTela();

        mesa.telaAtual =
            "configuracoes";

        definirModo(
            "interface"
        );


        const tela =
            mesa.elementos.tela;


        const conteudo =
            criarElemento(
                "section",
                "mesa-settings-screen"
            );


        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );

        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "⚙️ CONFIGURAÇÕES"
            )
        );


        conteudo.append(
            header
        );


        if (
            usuarioEhMestre()
        ) {
            conteudo.append(
                criarConfiguracoesMestre()
            );
        } else {
            conteudo.append(
                criarConfiguracoesJogador()
            );
        }


        tela.appendChild(
            conteudo
        );
    }


    function criarConfiguracoesMestre() {
        const area =
            criarElemento(
                "div",
                "settings-panel"
            );


        area.append(
            criarElemento(
                "h3",
                "",
                "👑 CONTROLES DO MESTRE"
            )
        );


        area.append(
            criarBotaoConfig(
                "👥",
                "Jogadores",
                () => {
                    if (
                        typeof mesa.renderizarJogadores ===
                        "function"
                    ) {
                        mesa.renderizarJogadores();
                    }
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "🧙",
                "Personagens",
                () => {
                    mesa.renderizarPersonagem();
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "❤️",
                "Status",
                () => {
                    mesa.renderizarStatus();
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "🍖",
                "Necessidades",
                () => {
                    if (
                        typeof mesa.renderizarNecessidades ===
                        "function"
                    ) {
                        mesa.renderizarNecessidades();
                    }
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "🎒",
                "Inventário",
                () => {
                    mesa.renderizarInventario();
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "⚔️",
                "Iniciar combate",
                () => {
                    iniciarCombate();
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "🎭",
                "Criar CTE",
                () => {
                    iniciarCTE({
                        title:
                            "DESVIE!",

                        description:
                            "Uma ameaça se aproxima. Escolha rapidamente.",

                        options: [
                            "Esquerda",
                            "Direita"
                        ],

                        timeLimit:
                            10
                    });
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "🗺️",
                "Abrir mapa",
                () => {
                    if (
                        typeof mesa.renderizarMapa ===
                        "function"
                    ) {
                        mesa.renderizarMapa();
                    }
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "👹",
                "Testar BOSS",
                () => {
                    ativarBoss(
                        "Guardião do Vazio"
                    );
                }
            )
        );


        area.append(
            criarElemento(
                "h3",
                "settings-subtitle",
                "🖥️ Interface"
            )
        );


        area.append(
            criarControleConfiguracao(
                "Mostrar cards dos jogadores",
                mesa.configuracoes.mostrarCards,
                valor => {
                    mesa.configuracoes.mostrarCards =
                        valor;

                    mesa.atualizarListaJogadores();
                }
            )
        );


        area.append(
            criarControleConfiguracao(
                "Mostrar chat",
                mesa.configuracoes.mostrarChat,
                valor => {
                    mesa.configuracoes.mostrarChat =
                        valor;

                    renderizarInterface();
                }
            )
        );


        area.append(
            criarControleConfiguracao(
                "Animações",
                mesa.configuracoes.animacoes,
                valor => {
                    mesa.configuracoes.animacoes =
                        valor;

                    const painel =
                        mesa.elementos.painel;

                    if (painel) {
                        painel.classList.toggle(
                            "no-animations",
                            !valor
                        );
                    }
                }
            )
        );


        return area;
    }


    function criarConfiguracoesJogador() {
        const area =
            criarElemento(
                "div",
                "settings-panel"
            );


        area.append(
            criarElemento(
                "h3",
                "",
                "🎮 OPÇÕES DO JOGADOR"
            )
        );


        area.append(
            criarControleConfiguracao(
                "Mostrar cards",
                mesa.configuracoes.mostrarCards,
                valor => {
                    mesa.configuracoes.mostrarCards =
                        valor;

                    mesa.atualizarListaJogadores();
                }
            )
        );


        area.append(
            criarControleConfiguracao(
                "Mostrar chat",
                mesa.configuracoes.mostrarChat,
                valor => {
                    mesa.configuracoes.mostrarChat =
                        valor;

                    renderizarInterface();
                }
            )
        );


        area.append(
            criarControleConfiguracao(
                "Animações",
                mesa.configuracoes.animacoes,
                valor => {
                    mesa.configuracoes.animacoes =
                        valor;

                    const painel =
                        mesa.elementos.painel;

                    if (painel) {
                        painel.classList.toggle(
                            "no-animations",
                            !valor
                        );
                    }
                }
            )
        );


        area.append(
            criarBotaoConfig(
                "❓",
                "Ajuda",
                () => {
                    renderizarAjuda();
                }
            )
        );


        return area;
    }


    function criarBotaoConfig(
        icone,
        nome,
        acao
    ) {
        const botao =
            criarElemento(
                "button",
                "settings-action"
            );

        botao.type =
            "button";

        botao.append(
            criarElemento(
                "span",
                "settings-action-icon",
                icone
            ),

            criarElemento(
                "span",
                "",
                nome
            )
        );


        botao.addEventListener(
            "click",
            acao
        );


        return botao;
    }


    function criarControleConfiguracao(
        nome,
        valor,
        aoAlterar
    ) {
        const area =
            criarElemento(
                "label",
                "settings-toggle"
            );


        const texto =
            criarElemento(
                "span",
                "",
                nome
            );


        const input =
            document.createElement(
                "input"
            );

        input.type =
            "checkbox";

        input.checked =
            Boolean(valor);


        input.addEventListener(
            "change",
            () => {
                aoAlterar(
                    input.checked
                );
            }
        );


        area.append(
            texto,
            input
        );


        return area;
    }


    window.abrirConfiguracoesMesa =
        abrirConfiguracoesMesa;

    mesa.abrirConfiguracoes =
        abrirConfiguracoesMesa;


    /* =====================================================
       AJUDA
    ===================================================== */

    function renderizarAjuda() {
        limparTela();

        mesa.telaAtual =
            "ajuda";

        const tela =
            mesa.elementos.tela;


        const conteudo =
            criarElemento(
                "section",
                "mesa-module-screen"
            );


        const header =
            criarElemento(
                "div",
                "module-screen-header"
            );


        header.append(
            criarBotaoVoltar(),

            criarElemento(
                "h2",
                "",
                "❓ AJUDA"
            )
        );


        conteudo.append(
            header
        );


        const itens = [
            [
                "🧙",
                "Personagem",
                "Visualize os dados básicos dos personagens."
            ],

            [
                "❤️",
                "Status",
                "Consulte HP e recursos atuais."
            ],

            [
                "✦",
                "Afinidade",
                "Veja a afinidade de cada personagem."
            ],

            [
                "🎒",
                "Inventário",
                "Consulte os itens carregados."
            ],

            [
                "🗺️",
                "Mapa",
                "Explore o mapa e selecione regiões ou portais."
            ],

            [
                "⚔️",
                "Combate",
                "Acompanhe os combates ativos."
            ],

            [
                "🎭",
                "CTE",
                "Responda eventos que exigem uma decisão."
            ]
        ];


        const lista =
            criarElemento(
                "div",
                "help-list"
            );


        itens.forEach(
            ([icone, titulo, descricao]) => {
                const item =
                    criarElemento(
                        "article",
                        "help-item"
                    );


                item.append(
                    criarElemento(
                        "span",
                        "help-icon",
                        icone
                    ),

                    criarElemento(
                        "strong",
                        "",
                        titulo
                    ),

                    criarElemento(
                        "p",
                        "",
                        descricao
                    )
                );


                lista.append(
                    item
                );
            }
        );


        conteudo.append(
            lista
        );


        tela.appendChild(
            conteudo
        );


        definirModo(
            "interface"
        );
    }


    mesa.renderizarAjuda =
        renderizarAjuda;


    /* =====================================================
       ATUALIZAÇÃO DOS DADOS
    ===================================================== */

    function atualizarMesa() {
        const campanha =
            obterCampanhaAtual();


        if (campanha) {
            mesa.campanha =
                campanha;
        }


        if (
            mesa.campanha
        ) {
            mesa.mestre =
                obterMestreDaCampanha(
                    mesa.campanha
                );
        }


        if (
            typeof mesa.carregarJogadoresMesa ===
            "function"
        ) {
            mesa.carregarJogadoresMesa();
        }


        if (
            typeof mesa.atualizarListaJogadores ===
            "function"
        ) {
            mesa.atualizarListaJogadores();
        }


        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:atualizada",
                {
                    detail: {
                        campanha:
                            mesa.campanha,

                        jogadores:
                            mesa.jogadores
                    }
                }
            )
        );
    }


    function obterCampanhaAtual() {
        if (
            typeof window.obterCampanhaAtiva ===
            "function"
        ) {
            try {
                const campanha =
                    window.obterCampanhaAtiva();

                if (campanha) {
                    return campanha;
                }
            } catch (erro) {
                console.warn(
                    "Erro ao obter campanha:",
                    erro
                );
            }
        }


        if (
            window.rpgAuth?.campaign
        ) {
            return window.rpgAuth.campaign;
        }


        if (
            window.rpgAuth?.campanha
        ) {
            return window.rpgAuth.campanha;
        }


        if (
            window.campanhaAtual
        ) {
            return window.campanhaAtual;
        }


        return mesa.campanha;
    }


    function obterMestreDaCampanha(
        campanha
    ) {
        if (!campanha) {
            return null;
        }


        const mestre =
            campanha.master ||
            campanha.mestre ||
            campanha.masterData ||
            campanha.mestreData;


        if (mestre) {
            return mestre;
        }


        const id =
            primeiroValor(
                campanha,
                [
                    "master_id",
                    "masterId",
                    "mestre_id",
                    "mestreId"
                ],
                null
            );


        if (
            id !== null &&
            Array.isArray(
                campanha.members
            )
        ) {
            return campanha.members.find(
                membro =>
                    String(
                        obterId(
                            membro
                        )
                    ) ===
                    String(id)
            ) || null;
        }


        return null;
    }


    mesa.atualizarMesa =
        atualizarMesa;


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciarMesa() {
        if (
            mesa.inicializada
        ) {
            return mesa;
        }


        console.log(
            "Mesa RPG: iniciando..."
        );


        mesa.campanha =
            obterCampanhaAtual();


        if (
            mesa.campanha
        ) {
            mesa.mestre =
                obterMestreDaCampanha(
                    mesa.campanha
                );
        }


        if (
            typeof mesa.carregarJogadoresMesa ===
            "function"
        ) {
            mesa.carregarJogadoresMesa();
        }


        /* -------------------------------------------------
           CRIA A INTERFACE
        ------------------------------------------------- */

        if (
            typeof mesa.criarInterfaceMesa ===
            "function"
        ) {
            mesa.criarInterfaceMesa();
        }


        mesa.inicializada =
            true;


        /* -------------------------------------------------
           CONFIGURAÇÕES VISUAIS
        ------------------------------------------------- */

        const painel =
            mesa.elementos.painel;

        if (painel) {
            painel.classList.toggle(
                "no-animations",
                !mesa.configuracoes.animacoes
            );
        }


        /* -------------------------------------------------
           EVENTO
        ------------------------------------------------- */

        window.dispatchEvent(
            new CustomEvent(
                "rpg:mesa:iniciada",
                {
                    detail:
                        mesa
                }
            )
        );


        console.log(
            "Mesa RPG: iniciada com sucesso.",
            {
                campanha:
                    mesa.campanha,

                jogadores:
                    mesa.jogadores.length
            }
        );


        return mesa;
    }


    window.iniciarMesa =
        iniciarMesa;


    mesa.iniciar =
        iniciarMesa;


    /* =====================================================
       ATUALIZAÇÃO AUTOMÁTICA
    ===================================================== */

    function atualizarInterfaceMesa() {
        if (
            !mesa.inicializada
        ) {
            return;
        }


        atualizarMesa();


        if (
            mesa.telaAtual ===
            "inicio"
        ) {
            return;
        }


        if (
            mesa.telaAtual ===
            "interface"
        ) {
            renderizarInterfaceSeguro();
        }
    }


    function renderizarInterfaceSeguro() {
        if (
            typeof mesa.renderizarInterface ===
            "function"
        ) {
            mesa.renderizarInterface();
        }
    }


    window.atualizarMesaRPG =
        atualizarInterfaceMesa;


    /* =====================================================
       EVENTOS EXTERNOS
    ===================================================== */

    window.addEventListener(
        "rpg:personagem-confirmado",
        () => {
            atualizarMesa();
        }
    );


    window.addEventListener(
        "rpg:personagem-atualizado",
        () => {
            atualizarMesa();
        }
    );


    window.addEventListener(
        "rpg:status-atualizado",
        () => {
            atualizarMesa();
        }
    );


    window.addEventListener(
        "rpg:inventario-atualizado",
        () => {
            atualizarMesa();
        }
    );


    window.addEventListener(
        "rpg:jogadores-atualizados",
        () => {
            atualizarMesa();
        }
    );


    /* =====================================================
       API PÚBLICA DA MESA
    ===================================================== */

    mesa.api = {
        iniciar:
            iniciarMesa,

        atualizar:
            atualizarMesa,

        abrirModulo:
            mesa.abrirModulo,

        abrirJogador:
            mesa.abrirJogador,

        iniciarCombate:
            iniciarCombate,

        finalizarCombate:
            finalizarCombate,

        iniciarCTE:
            iniciarCTE,

        responderCTE:
            responderCTE,

        finalizarCTE:
            finalizarCTE,

        ativarBoss:
            ativarBoss,

        finalizarBoss:
            finalizarBoss,

        abrirConfiguracoes:
            abrirConfiguracoesMesa
    };


    /* =====================================================
       INICIALIZAÇÃO DOM
    ===================================================== */

    function iniciarQuandoPronto() {
        if (
            mesa.inicializada
        ) {
            return;
        }


        try {
            iniciarMesa();
        } catch (erro) {
            console.error(
                "Mesa RPG: erro durante inicialização.",
                erro
            );

            notificar(
                "Não foi possível carregar completamente a mesa.",
                5000,
                "error"
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            iniciarQuandoPronto,
            {
                once: true
            }
        );
    } else {
        iniciarQuandoPronto();
    }


    /* =====================================================
       ATALHOS GLOBAIS
    ===================================================== */

    window.mesaRPG = {
        abrir:
            iniciarMesa,

        atualizar:
            atualizarMesa,

        combate:
            iniciarCombate,

        encerrarCombate:
            finalizarCombate,

        cte:
            iniciarCTE,

        boss:
            ativarBoss
    };


    console.log(
        "Mesa RPG — Parte 3 carregada."
    );

})();
