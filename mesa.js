/* ==========================================================
   MESA ONLINE — RPG
   mesa.js
   VERSÃO 3/3 — DEFINITIVA
========================================================== */

(() => {
    "use strict";

    /* ======================================================
       CONFIGURAÇÃO
    ====================================================== */

    const STORAGE_CAMPANHA = "rpg_campanha_mesa";
    const TOTAL_ASSENTOS = 8;

    const MODULOS = {
        interface: {
            titulo: "Interface",
            icone: "🎮"
        },

        personagem: {
            titulo: "Personagem",
            icone: "🧙"
        },

        status: {
            titulo: "Status",
            icone: "❤️"
        },

        afinidade: {
            titulo: "Afinidade",
            icone: "✨"
        },

        inventario: {
            titulo: "Inventário",
            icone: "🎒"
        },

        mapa: {
            titulo: "Mapa",
            icone: "🗺️"
        },

        combate: {
            titulo: "Combate",
            icone: "⚔️"
        },

        cte: {
            titulo: "CTE",
            icone: "⏱️"
        },

        dungeon: {
            titulo: "Dungeon",
            icone: "🏰"
        },

        boss: {
            titulo: "Boss",
            icone: "👹"
        }
    };


    /* ======================================================
       ESTADO CENTRAL
    ====================================================== */

    const estado = {

        campanha: null,

        mestre: {
            id: null,
            nome: "Mestre"
        },

        jogadorAtual: null,

        jogadores: Array.from(
            { length: TOTAL_ASSENTOS },
            (_, indice) => ({
                slot: indice + 1,

                id: null,

                nome: null,

                personagem: null,

                raca: null,

                classe: null,

                afinidade: null,

                confirmado: false,

                status: {
                    hp: null,
                    mana: null
                },

                inventario: [],

                conectado: false
            })
        ),

        moduloAtual: "interface",

        modo: "normal",

        painelMestreAberto: false,

        combate: {
            ativo: false,
            turno: 0,
            personagemTurno: null,
            log: []
        },

        cte: {
            ativo: false,
            segundos: 0,
            segundosRestantes: 0,
            intervalo: null,
            titulo: "Evento em andamento",
            descricao: "A mesa está em um evento de tempo limitado."
        },

        dungeon: {
            ativa: false,
            nome: "Dungeon",
            descricao: "A exploração ainda não começou."
        },

        boss: {
            ativo: false,
            nome: "BOSS",
            descricao: "Um grande inimigo apareceu.",
            retornoAutomatico: null
        },

        configuracoes: {
            som: true,
            animacoes: true,
            notificacoes: true
        }
    };


    /* ======================================================
       REFERÊNCIAS
    ====================================================== */

    const $ = (seletor) =>
        document.querySelector(seletor);

    const $$ = (seletor) =>
        Array.from(document.querySelectorAll(seletor));


    /* ======================================================
       UTILIDADES
    ====================================================== */

    function textoSeguro(valor, fallback = "—") {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return fallback;
        }

        return String(valor);
    }


    function escaparHTML(valor) {

        return String(valor)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function mostrarNotificacao(mensagem) {

        if (!estado.configuracoes.notificacoes) {
            return;
        }

        const area = $("#mesa-notificacoes");

        if (!area) {
            return;
        }

        const notificacao =
            document.createElement("div");

        notificacao.className =
            "mesa-notificacao";

        notificacao.textContent =
            mensagem;

        area.appendChild(notificacao);

        setTimeout(() => {

            notificacao.remove();

        }, 3000);
    }


    function atualizarEstadoMesa(texto, classe = "") {

        const indicador =
            $("#mesa-estado-indicador");

        const textoEstado =
            $("#mesa-estado-texto");

        if (textoEstado) {
            textoEstado.textContent = texto;
        }

        const estadoElemento =
            $("#mesa-estado");

        if (estadoElemento) {

            estadoElemento.className =
                "";

            if (classe) {
                estadoElemento.classList.add(classe);
            }
        }

        if (indicador) {

            indicador.style.background = "";

        }
    }


    /* ======================================================
       CAMPANHA
    ====================================================== */

    function carregarCampanha() {

        let campanha = null;

        /*
         * Primeiro tenta a campanha salva pela entrada da mesa.
         */

        try {

            const salva =
                localStorage.getItem(
                    STORAGE_CAMPANHA
                );

            if (salva) {
                campanha = JSON.parse(salva);
            }

        } catch (erro) {

            console.warn(
                "Não foi possível ler a campanha salva."
            );
        }


        /*
         * Depois tenta a API antiga.
         */

        if (!campanha) {

            try {

                if (
                    typeof window.obterCampanhaAtiva ===
                    "function"
                ) {

                    campanha =
                        window.obterCampanhaAtiva();
                }

            } catch (erro) {
                console.warn(
                    "obterCampanhaAtiva indisponível."
                );
            }
        }


        /*
         * Compatibilidade com rpgAuth.
         */

        if (
            !campanha &&
            window.rpgAuth &&
            window.rpgAuth.campaign
        ) {

            campanha =
                window.rpgAuth.campaign;
        }


        estado.campanha =
            campanha || {
                id: null,
                nome: "Mesa RPG",
                mestre: null
            };


        atualizarCabecalhoCampanha();
    }


    function atualizarCabecalhoCampanha() {

        const elemento =
            $("#mesa-campanha-nome");

        if (!elemento) {
            return;
        }

        elemento.textContent =
            textoSeguro(
                estado.campanha.nome ||
                estado.campanha.titulo,
                "Mesa RPG"
            );
    }


    /* ======================================================
       MESTRE
    ====================================================== */

    function carregarMestre() {

        let mestre = null;

        if (
            estado.campanha &&
            estado.campanha.mestre
        ) {

            mestre =
                estado.campanha.mestre;
        }


        if (
            estado.campanha &&
            estado.campanha.master
        ) {

            mestre =
                estado.campanha.master;
        }


        if (
            window.rpgAuth &&
            window.rpgAuth.profile
        ) {

            const perfil =
                window.rpgAuth.profile;

            if (
                perfil.is_master ||
                perfil.isMaster
            ) {

                mestre = perfil;
            }
        }


        if (
            window.rpgAuth &&
            window.rpgAuth.user &&
            !mestre
        ) {

            mestre =
                window.rpgAuth.user;
        }


        if (mestre) {

            estado.mestre.id =
                mestre.id ||
                mestre.user_id ||
                null;

            estado.mestre.nome =
                mestre.nome ||
                mestre.name ||
                mestre.username ||
                "Mestre";
        }


        const elemento =
            $("#mesa-mestre-nome");

        if (elemento) {

            elemento.textContent =
                estado.mestre.nome;
        }
    }


    /* ======================================================
       IDENTIFICAR JOGADOR ATUAL
    ====================================================== */

    function identificarJogadorAtual() {

        let usuario = null;

        if (
            window.rpgAuth &&
            window.rpgAuth.user
        ) {

            usuario =
                window.rpgAuth.user;
        }


        if (!usuario) {
            return;
        }


        const id =
            usuario.id ||
            usuario.user_id ||
            null;


        if (!id) {
            return;
        }


        estado.jogadorAtual =
            estado.jogadores.find(
                jogador =>
                    jogador.id === id
            ) || null;
    }


    /* ======================================================
       JOGADORES
    ====================================================== */

    function carregarJogadores() {

        let membros = null;


        /*
         * Estrutura antiga.
         */

        if (
            window.rpgAuth &&
            Array.isArray(
                window.rpgAuth.campaignMembers
            )
        ) {

            membros =
                window.rpgAuth.campaignMembers;
        }


        /*
         * Estrutura de personagens.
         */

        if (
            !membros &&
            window.rpgAuth &&
            Array.isArray(
                window.rpgAuth.campaignCharacters
            )
        ) {

            membros =
                window.rpgAuth.campaignCharacters;
        }


        if (
            !Array.isArray(membros)
        ) {

            renderizarTodosAssentos();

            return;
        }


        membros
            .slice(0, TOTAL_ASSENTOS)
            .forEach(
                (membro, indice) => {

                    const jogador =
                        estado.jogadores[indice];

                    if (!jogador) {
                        return;
                    }


                    jogador.id =
                        membro.id ||
                        membro.user_id ||
                        null;

                    jogador.nome =
                        membro.nome ||
                        membro.name ||
                        membro.username ||
                        `Jogador ${indice + 1}`;


                    jogador.personagem =
                        membro.personagem ||
                        membro.character ||
                        membro.character_name ||
                        null;


                    jogador.raca =
                        membro.raca ||
                        membro.race ||
                        null;


                    jogador.classe =
                        membro.classe ||
                        membro.class ||
                        null;


                    jogador.afinidade =
                        membro.afinidade ||
                        membro.affinity ||
                        null;


                    jogador.confirmado =
                        Boolean(
                            membro.confirmado ??
                            membro.confirmed ??
                            membro.character_confirmed ??
                            true
                        );


                    jogador.conectado =
                        Boolean(
                            membro.conectado ??
                            membro.connected ??
                            true
                        );


                    jogador.status.hp =
                        membro.hp ??
                        membro.status?.hp ??
                        null;


                    jogador.status.mana =
                        membro.mana ??
                        membro.status?.mana ??
                        null;


                    if (
                        Array.isArray(
                            membro.inventario
                        )
                    ) {

                        jogador.inventario =
                            membro.inventario;
                    }
                }
            );


        identificarJogadorAtual();

        renderizarTodosAssentos();
    }


    /* ======================================================
       RENDERIZAR ASSENTOS
    ====================================================== */

    function renderizarTodosAssentos() {

        for (
            let slot = 1;
            slot <= TOTAL_ASSENTOS;
            slot++
        ) {

            renderizarAssento(slot);
        }
    }


    function renderizarAssento(slot) {

        const jogador =
            estado.jogadores[slot - 1];

        if (!jogador) {
            return;
        }


        const card =
            document.querySelector(
                `.jogador-card[data-slot="${slot}"]`
            );


        if (!card) {
            return;
        }


        const numero =
            card.querySelector(
                ".jogador-numero"
            );

        const nome =
            card.querySelector(
                ".jogador-nome"
            );

        const classe =
            card.querySelector(
                ".jogador-classe"
            );

        const status =
            card.querySelector(
                ".jogador-status"
            );


        if (numero) {

            numero.textContent =
                String(slot)
                    .padStart(2, "0");
        }


        /*
         * Assento vazio.
         */

        if (!jogador.nome) {

            card.classList.remove(
                "confirmado"
            );

            card.classList.add(
                "vazio"
            );

            if (nome) {
                nome.textContent =
                    `VAGA ${slot}`;
            }

            if (classe) {
                classe.textContent =
                    "Aguardando jogador";
            }

            if (status) {

                status.innerHTML = `
                    <span class="status-mini">❤️ —</span>
                    <span class="status-mini">💧 —</span>
                `;
            }

            return;
        }


        /*
         * Jogador ocupado.
         */

        card.classList.remove(
            "vazio"
        );


        if (jogador.confirmado) {

            card.classList.add(
                "confirmado"
            );

        } else {

            card.classList.remove(
                "confirmado"
            );
        }


        if (nome) {

            nome.textContent =
                jogador.nome;
        }


        if (classe) {

            const classeTexto =
                jogador.classe ||
                "Classe não definida";

            classe.textContent =
                jogador.personagem
                    ? `${jogador.personagem} • ${classeTexto}`
                    : classeTexto;
        }


        if (status) {

            const hp =
                jogador.status.hp ??
                "—";

            const mana =
                jogador.status.mana ??
                "—";


            status.innerHTML = `
                <span class="status-mini">
                    ❤️ ${escaparHTML(hp)}
                </span>

                <span class="status-mini">
                    💧 ${escaparHTML(mana)}
                </span>
            `;
        }
    }


    /* ======================================================
       MÓDULOS
    ====================================================== */

    function configurarModulos() {

        $$(".modulo-btn")
            .forEach(botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        const modulo =
                            botao.dataset.modulo;

                        if (!modulo) {
                            return;
                        }

                        abrirModulo(modulo);
                    }
                );
            });


        abrirModulo(
            estado.moduloAtual
        );
    }


    function abrirModulo(modulo) {

        if (!MODULOS[modulo]) {
            return;
        }


        estado.moduloAtual =
            modulo;


        $$(".modulo-btn")
            .forEach(botao => {

                botao.classList.toggle(
                    "ativo",
                    botao.dataset.modulo ===
                    modulo
                );
            });


        $$(".modulo-mesa")
            .forEach(elemento => {

                elemento.hidden =
                    elemento.id !==
                    `modulo-${modulo}`;
            });


        const configuracao =
            MODULOS[modulo];


        const titulo =
            $("#tela-mesa-titulo");


        if (titulo) {

            titulo.textContent =
                `${configuracao.icone} ${configuracao.titulo}`;
        }


        renderizarModulo(modulo);
    }


    function renderizarModulo(modulo) {

        switch (modulo) {

            case "interface":
                renderizarInterface();
                break;

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

            case "mapa":
                renderizarMapa();
                break;

            case "combate":
                renderizarCombate();
                break;

            case "cte":
                renderizarCTE();
                break;

            case "dungeon":
                renderizarDungeon();
                break;

            case "boss":
                renderizarBoss();
                break;
        }
    }


    /* ======================================================
       INTERFACE
    ====================================================== */

    function renderizarInterface() {

        const modulo =
            $("#modulo-interface");

        if (!modulo) {
            return;
        }


        const jogadores =
            estado.jogadores.filter(
                jogador =>
                    jogador.nome
            );


        const confirmados =
            jogadores.filter(
                jogador =>
                    jogador.confirmado
            ).length;


        const conectados =
            jogadores.filter(
                jogador =>
                    jogador.conectado
            ).length;


        modulo.innerHTML = `

            <div class="interface-grid">

                <div class="interface-box">
                    <span>JOGADORES</span>
                    <strong>
                        ${jogadores.length}/${TOTAL_ASSENTOS}
                    </strong>
                </div>

                <div class="interface-box">
                    <span>CONFIRMADOS</span>
                    <strong>
                        ${confirmados}
                    </strong>
                </div>

                <div class="interface-box">
                    <span>CONECTADOS</span>
                    <strong>
                        ${conectados}
                    </strong>
                </div>

                <div class="interface-box">
                    <span>ESTADO</span>
                    <strong>
                        ${textoSeguro(
                            estado.modo,
                            "normal"
                        )}
                    </strong>
                </div>

            </div>

            <div class="modulo-placeholder">

                <div class="modulo-icone">
                    🎮
                </div>

                <strong>
                    Mesa online
                </strong>

                <span>
                    A mesa está preparada para
                    jogadores, inventário, mapa,
                    combate e eventos.
                </span>

            </div>
        `;
    }


    /* ======================================================
       PERSONAGEM
    ====================================================== */

    function renderizarPersonagem() {

        const modulo =
            $("#modulo-personagem");

        if (!modulo) {
            return;
        }


        const jogador =
            estado.jogadorAtual;


        if (!jogador) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">
                    <div class="modulo-icone">🧙</div>
                    <strong>Nenhum personagem vinculado</strong>
                    <span>
                        O personagem aparecerá aqui
                        quando estiver confirmado.
                    </span>
                </div>
            `;

            return;
        }


        modulo.innerHTML = `

            <div class="personagem-detalhes">

                <div class="personagem-banner">

                    <h3>
                        ${escaparHTML(
                            jogador.personagem ||
                            jogador.nome
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            jogador.raca ||
                            "Raça não definida"
                        )}

                        • 

                        ${escaparHTML(
                            jogador.classe ||
                            "Classe não definida"
                        )}
                    </p>

                </div>

                <div class="interface-grid">

                    <div class="interface-box">
                        <span>NOME DO JOGADOR</span>
                        <strong>
                            ${escaparHTML(
                                jogador.nome
                            )}
                        </strong>
                    </div>

                    <div class="interface-box">
                        <span>AFINIDADE</span>
                        <strong>
                            ${escaparHTML(
                                jogador.afinidade
                            )}
                        </strong>
                    </div>

                </div>

            </div>
        `;
    }


    /* ======================================================
       STATUS
    ====================================================== */

    function renderizarStatus() {

        const modulo =
            $("#modulo-status");

        if (!modulo) {
            return;
        }


        const jogador =
            estado.jogadorAtual;


        if (!jogador) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">
                    <div class="modulo-icone">❤️</div>
                    <strong>Status indisponível</strong>
                    <span>
                        Nenhum personagem está vinculado
                        a este jogador.
                    </span>
                </div>
            `;

            return;
        }


        const hp =
            Number(jogador.status.hp) || 0;

        const mana =
            Number(jogador.status.mana) || 0;


        const hpPercent =
            Math.max(
                0,
                Math.min(100, hp)
            );


        const manaPercent =
            Math.max(
                0,
                Math.min(100, mana)
            );


        modulo.innerHTML = `

            <div class="status-barras">

                <div class="status-linha">

                    <div class="status-linha-header">
                        <span>❤️ Vida</span>
                        <strong>${hp}</strong>
                    </div>

                    <div class="status-bar">

                        <div
                            class="status-bar-fill"
                            style="width:${hpPercent}%"
                        ></div>

                    </div>

                </div>


                <div class="status-linha">

                    <div class="status-linha-header">
                        <span>💧 Mana</span>
                        <strong>${mana}</strong>
                    </div>

                    <div class="status-bar">

                        <div
                            class="status-bar-fill"
                            style="width:${manaPercent}%"
                        ></div>

                    </div>

                </div>

            </div>

            <div class="modulo-placeholder">

                <strong>
                    Status somente leitura
                </strong>

                <span>
                    Os valores são exibidos na mesa,
                    mas não podem ser alterados pelo
                    jogador.
                </span>

            </div>
        `;
    }


    /* ======================================================
       AFINIDADE
    ====================================================== */

    function renderizarAfinidade() {

        const modulo =
            $("#modulo-afinidade");

        if (!modulo) {
            return;
        }


        const jogador =
            estado.jogadorAtual;


        const afinidade =
            jogador?.afinidade ||
            "Não definida";


        modulo.innerHTML = `

            <div class="afinidade-card">

                <div class="afinidade-icone">
                    ✨
                </div>

                <h3>
                    ${escaparHTML(
                        afinidade
                    )}
                </h3>

                <p>
                    Afinidade atual do personagem
                </p>

            </div>
        `;
    }


    /* ======================================================
       INVENTÁRIO
    ====================================================== */

    function renderizarInventario() {

        const modulo =
            $("#modulo-inventario");

        if (!modulo) {
            return;
        }


        const jogador =
            estado.jogadorAtual;


        const itens =
            jogador?.inventario || [];


        if (!itens.length) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">

                    <div class="modulo-icone">
                        🎒
                    </div>

                    <strong>
                        Inventário vazio
                    </strong>

                    <span>
                        Itens entregues pelo Mestre
                        aparecerão aqui.
                    </span>

                </div>
            `;

            return;
        }


        modulo.innerHTML = `

            <div class="inventario-grid">

                ${itens.map(
                    (item, indice) => {

                        const nome =
                            typeof item === "string"
                                ? item
                                : item.nome ||
                                  item.name ||
                                  `Item ${indice + 1}`;


                        const quantidade =
                            typeof item === "object"
                                ? item.quantidade ||
                                  item.quantity ||
                                  1
                                : 1;


                        return `

                            <div class="item-inventario">

                                <span class="item-icone">
                                    🎁
                                </span>

                                <strong>
                                    ${escaparHTML(
                                        nome
                                    )}
                                </strong>

                                <small>
                                    x${quantidade}
                                </small>

                            </div>
                        `;
                    }
                ).join("")}

            </div>
        `;
    }


    /* ======================================================
       MAPA
    ====================================================== */

    function renderizarMapa() {

        const modulo =
            $("#modulo-mapa");

        if (!modulo) {
            return;
        }


        modulo.innerHTML = `

            <div class="mapa-area">

                <div class="mapa-placeholder">

                    🗺️

                    <br><br>

                    <strong>
                        Mapa do Mestre
                    </strong>

                    <br><br>

                    <span>
                        O mapa poderá ser controlado
                        pelo Mestre e visualizado
                        pelos jogadores.
                    </span>

                </div>

            </div>
        `;
    }


    /* ======================================================
       COMBATE
    ====================================================== */

    function iniciarCombate() {

        estado.combate.ativo =
            true;

        estado.combate.turno =
            1;

        estado.modo =
            "combate";


        estado.combate.log = [
            "⚔️ O combate começou."
        ];


        atualizarEstadoMesa(
            "COMBATE",
            "estado-combate"
        );


        $("#rpg-mesa")?.classList.remove(
            "modo-boss"
        );


        abrirModulo("combate");


        mostrarNotificacao(
            "⚔️ Combate iniciado!"
        );
    }


    function encerrarCombate() {

        estado.combate.ativo =
            false;

        estado.combate.turno =
            0;

        estado.modo =
            "normal";


        atualizarEstadoMesa(
            "MESA ONLINE"
        );


        renderizarCombate();


        mostrarNotificacao(
            "Combate encerrado."
        );
    }


    function adicionarLogCombate(mensagem) {

        estado.combate.log.push(
            mensagem
        );

        renderizarCombate();
    }


    function renderizarCombate() {

        const modulo =
            $("#modulo-combate");

        if (!modulo) {
            return;
        }


        if (!estado.combate.ativo) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">

                    <div class="modulo-icone">
                        ⚔️
                    </div>

                    <strong>
                        Nenhum combate ativo
                    </strong>

                    <span>
                        O Mestre poderá iniciar
                        um combate pela mesa.
                    </span>

                </div>
            `;

            return;
        }


        modulo.innerHTML = `

            <div class="combate-header">

                <strong>
                    ⚔️ COMBATE ATIVO
                </strong>

                <span>
                    Turno ${estado.combate.turno}
                </span>

            </div>


            <div class="combate-log">

                ${
                    estado.combate.log.length
                    ? estado.combate.log
                        .map(
                            item => `
                                <div class="combate-log-item">
                                    ${escaparHTML(item)}
                                </div>
                            `
                        )
                        .join("")
                    : `
                        <div class="combate-log-item">
                            Nenhuma ação registrada.
                        </div>
                    `
                }

            </div>

        `;
    }


    /* ======================================================
       CTE
    ====================================================== */

    function iniciarCTE(
        segundos = 30,
        titulo = "Evento em andamento",
        descricao =
            "A mesa está em um evento de tempo limitado."
    ) {

        pararCTE();


        estado.cte.ativo =
            true;

        estado.cte.segundos =
            segundos;

        estado.cte.segundosRestantes =
            segundos;

        estado.cte.titulo =
            titulo;

        estado.cte.descricao =
            descricao;

        estado.modo =
            "cte";


        atualizarEstadoMesa(
            "CTE",
            "estado-cte"
        );


        abrirModulo("cte");


        estado.cte.intervalo =
            setInterval(() => {

                estado.cte.segundosRestantes--;

                renderizarCTE();


                if (
                    estado.cte.segundosRestantes <= 0
                ) {

                    finalizarCTE();
                }

            }, 1000);


        mostrarNotificacao(
            `⏱️ ${titulo}`
        );
    }


    function pararCTE() {

        if (
            estado.cte.intervalo
        ) {

            clearInterval(
                estado.cte.intervalo
            );

            estado.cte.intervalo =
                null;
        }
    }


    function finalizarCTE() {

        pararCTE();


        estado.cte.ativo =
            false;

        estado.cte.segundosRestantes =
            0;

        estado.modo =
            "normal";


        atualizarEstadoMesa(
            "MESA ONLINE"
        );


        renderizarCTE();


        mostrarNotificacao(
            "⏱️ CTE encerrada."
        );
    }


    function renderizarCTE() {

        const modulo =
            $("#modulo-cte");

        if (!modulo) {
            return;
        }


        if (!estado.cte.ativo) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">

                    <div class="modulo-icone">
                        ⏱️
                    </div>

                    <strong>
                        Nenhum CTE ativo
                    </strong>

                    <span>
                        Eventos temporizados aparecerão aqui.
                    </span>

                </div>
            `;

            return;
        }


        const minutos =
            Math.floor(
                estado.cte.segundosRestantes /
                60
            );


        const segundos =
            estado.cte.segundosRestantes %
            60;


        const tempo =
            `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;


        modulo.innerHTML = `

            <div class="cte-circulo">

                <strong>
                    ${tempo}
                </strong>

                <span>
                    TEMPO
                </span>

            </div>


            <div class="cte-status">

                ${escaparHTML(
                    estado.cte.titulo
                )}

            </div>


            <div class="cte-opcoes">

                <div class="cte-opcao">
                    ${escaparHTML(
                        estado.cte.descricao
                    )}
                </div>

            </div>
        `;
    }


    /* ======================================================
       DUNGEON
    ====================================================== */

    function iniciarDungeon(
        nome = "Dungeon",
        descricao =
            "A exploração começou."
    ) {

        estado.dungeon.ativa =
            true;

        estado.dungeon.nome =
            nome;

        estado.dungeon.descricao =
            descricao;


        estado.modo =
            "dungeon";


        atualizarEstadoMesa(
            "DUNGEON"
        );


        abrirModulo(
            "dungeon"
        );


        mostrarNotificacao(
            `🏰 ${nome}`
        );
    }


    function renderizarDungeon() {

        const modulo =
            $("#modulo-dungeon");

        if (!modulo) {
            return;
        }


        if (!estado.dungeon.ativa) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">

                    <div class="modulo-icone">
                        🏰
                    </div>

                    <strong>
                        Dungeon inativa
                    </strong>

                    <span>
                        A exploração poderá ser iniciada
                        pelo Mestre.
                    </span>

                </div>
            `;

            return;
        }


        modulo.innerHTML = `

            <div class="modulo-placeholder">

                <div class="modulo-icone">
                    🏰
                </div>

                <strong>
                    ${escaparHTML(
                        estado.dungeon.nome
                    )}
                </strong>

                <span>
                    ${escaparHTML(
                        estado.dungeon.descricao
                    )}
                </span>

            </div>
        `;
    }


    /* ======================================================
       BOSS
    ====================================================== */

    function iniciarBoss(
        nome = "BOSS",
        descricao =
            "Um grande inimigo apareceu."
    ) {

        encerrarBoss();


        estado.boss.ativo =
            true;

        estado.boss.nome =
            nome;

        estado.boss.descricao =
            descricao;

        estado.modo =
            "boss";


        const mesa =
            $("#rpg-mesa");

        if (mesa) {

            mesa.classList.add(
                "modo-boss"
            );
        }


        atualizarEstadoMesa(
            "BOSS",
            "estado-combate"
        );


        abrirModulo(
            "boss"
        );


        mostrarNotificacao(
            `👹 ${nome} apareceu!`
        );


        /*
         * Retorno automático.
         */

        estado.boss.retornoAutomatico =
            setTimeout(() => {

                encerrarBoss();

            }, 15000);
    }


    function encerrarBoss() {

        if (
            estado.boss.retornoAutomatico
        ) {

            clearTimeout(
                estado.boss.retornoAutomatico
            );

            estado.boss.retornoAutomatico =
                null;
        }


        estado.boss.ativo =
            false;

        estado.modo =
            "normal";


        const mesa =
            $("#rpg-mesa");

        if (mesa) {

            mesa.classList.remove(
                "modo-boss"
            );
        }


        atualizarEstadoMesa(
            "MESA ONLINE"
        );


        renderizarBoss();
    }


    function renderizarBoss() {

        const modulo =
            $("#modulo-boss");

        if (!modulo) {
            return;
        }


        if (!estado.boss.ativo) {

            modulo.innerHTML = `
                <div class="modulo-placeholder">

                    <div class="modulo-icone">
                        👹
                    </div>

                    <strong>
                        Nenhum Boss ativo
                    </strong>

                    <span>
                        O Mestre poderá ativar um Boss
                        durante a aventura.
                    </span>

                </div>
            `;

            return;
        }


        modulo.innerHTML = `

            <div id="boss-alerta">
                ⚠️ BOSS APARECEU ⚠️
            </div>

            <h2 class="boss-nome">
                ${escaparHTML(
                    estado.boss.nome
                )}
            </h2>

            <p class="boss-descricao">
                ${escaparHTML(
                    estado.boss.descricao
                )}
            </p>

        `;
    }


    /* ======================================================
       PAINEL DO MESTRE
    ====================================================== */

    function verificarSeEhMestre() {

        if (
            window.rpgAuth &&
            window.rpgAuth.isMaster
        ) {

            return true;
        }


        const usuario =
            window.rpgAuth?.user;


        if (!usuario) {
            return false;
        }


        const id =
            usuario.id ||
            usuario.user_id;


        if (
            estado.mestre.id &&
            id === estado.mestre.id
        ) {

            return true;
        }


        return false;
    }


    function configurarPainelMestre() {

        const botao =
            $("#abrir-painel-mestre");


        const painel =
            $("#painel-mestre");


        if (!botao || !painel) {
            return;
        }


        if (!verificarSeEhMestre()) {

            botao.hidden =
                true;

            painel.hidden =
                true;

            return;
        }


        botao.hidden =
            false;


        painel.hidden =
            true;


        botao.addEventListener(
            "click",
            () => {

                estado.painelMestreAberto =
                    !estado.painelMestreAberto;


                painel.hidden =
                    !estado.painelMestreAberto;
            }
        );


        configurarBotoesMestre();
    }


    function configurarBotoesMestre() {

        /*
         * Os botões são encontrados pelo
         * data-acao para evitar dependência
         * de texto.
         */

        $("[data-acao='normal']
