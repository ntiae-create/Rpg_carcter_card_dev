/* =========================================================
   MESA ONLINE — DIAGNÓSTICO
   RPG MASTER CAOS

   VERSÃO:
   - SUPABASE REALTIME
   - SEM ABLY

   Responsabilidades:
   - Diagnóstico do ambiente
   - Diagnóstico Supabase
   - Diagnóstico campanha
   - Diagnóstico usuário
   - Diagnóstico personagens
   - Diagnóstico slots
   - Diagnóstico Supabase Realtime
   - Diagnóstico Multiplayer Supabase
   - Logs da Mesa
   - Sincronização manual
   - Monitoramento de eventos
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ESTADO
    ===================================================== */

    const Diagnostico = {

        aberto: false,

        logs: [],

        maxLogs: 150,

        ultimoRealtime: null,

        ultimoMultiplayer: null,

        ultimaQuantidadePersonagens: null,

        jogadoresOnline: 0,

        inicializado: false,

        testes: {},

        ultimoDiagnostico: null,

        intervalo: null

    };


    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    function obterEstadoMesa() {

        try {

            if (
                window.MesaRPG &&
                typeof window.MesaRPG === "object"
            ) {

                return window.MesaRPG;

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter MesaRPG:",
                erro
            );

        }

        return null;

    }


    /* =====================================================
       CLIENTE SUPABASE
    ===================================================== */

    function obterSupabaseCliente() {

        try {

            /* ---------------------------------------------
               Prioridade: SupabaseMesa
            --------------------------------------------- */

            if (
                window.SupabaseMesa &&
                typeof window.SupabaseMesa.obterCliente ===
                "function"
            ) {

                const cliente =
                    window.SupabaseMesa.obterCliente();

                if (cliente) {

                    return cliente;

                }

            }


            /* ---------------------------------------------
               supabaseClient
            --------------------------------------------- */

            if (
                window.supabaseClient &&
                typeof window.supabaseClient === "object" &&
                window.supabaseClient.auth
            ) {

                return window.supabaseClient;

            }


            /* ---------------------------------------------
               sb
            --------------------------------------------- */

            if (
                window.sb &&
                typeof window.sb === "object" &&
                window.sb.auth
            ) {

                return window.sb;

            }


            /* ---------------------------------------------
               supabaseMesa.cliente
            --------------------------------------------- */

            if (
                window.supabaseMesa &&
                window.supabaseMesa.cliente
            ) {

                return window.supabaseMesa.cliente;

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter cliente Supabase:",
                erro
            );

        }

        return null;

    }


    /* =====================================================
       SUPABASE GLOBAL / SDK
    ===================================================== */

    function obterSupabase() {

        try {

            /*
             * ATENÇÃO:
             * window.supabase pode ser:
             *
             * 1. O SDK carregado pelo CDN
             * 2. Um cliente criado pelo projeto
             *
             * Por isso verificamos ambos.
             */

            if (
                window.supabase &&
                typeof window.supabase === "object"
            ) {

                return window.supabase;

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter Supabase:",
                erro
            );

        }

        return null;

    }


    /* =====================================================
       SUPABASE MESA
    ===================================================== */

    function obterSupabaseMesa() {

        try {

            if (
                window.supabaseMesa &&
                typeof window.supabaseMesa === "object"
            ) {

                return window.supabaseMesa;

            }

            if (
                window.SupabaseMesa &&
                typeof window.SupabaseMesa === "object"
            ) {

                return window.SupabaseMesa;

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter Supabase Mesa:",
                erro
            );

        }

        return null;

    }


    /* =====================================================
       AUTH
    ===================================================== */

    function obterAuth() {

        try {

            if (
                window.rpgAuth &&
                typeof window.rpgAuth === "object"
            ) {

                return window.rpgAuth;

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter rpgAuth:",
                erro
            );

        }

        return null;

    }


    /* =====================================================
       PERSONAGENS
    ===================================================== */

    function obterPersonagens() {

        try {

            if (
                window.MesaRPG &&
                Array.isArray(
                    window.MesaRPG.personagens
                )
            ) {

                return window.MesaRPG.personagens;

            }


            if (
                window.rpgAuth &&
                Array.isArray(
                    window.rpgAuth.personagens
                )
            ) {

                return window.rpgAuth.personagens;

            }


            if (
                window.personagensMesa &&
                Array.isArray(
                    window.personagensMesa
                )
            ) {

                return window.personagensMesa;

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter personagens:",
                erro
            );

        }

        return [];

    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    function obterCampanha() {

        try {

            const auth =
                obterAuth();


            /* ---------------------------------------------
               rpgAuth
            --------------------------------------------- */

            if (
                auth &&
                auth.campaign
            ) {

                return auth.campaign;

            }


            /* ---------------------------------------------
               rpgCampaign
            --------------------------------------------- */

            if (
                window.rpgCampaign &&
                window.rpgCampaign.activeCampaign
            ) {

                return window.rpgCampaign.activeCampaign;

            }


            /* ---------------------------------------------
               MesaRPG.campanha()
            --------------------------------------------- */

            if (
                window.MesaRPG &&
                typeof window.MesaRPG.campanha ===
                "function"
            ) {

                const campanha =
                    window.MesaRPG.campanha();

                if (
                    campanha &&
                    (
                        campanha.id ||
                        campanha.campaignId
                    )
                ) {

                    return campanha;

                }

            }


            /* ---------------------------------------------
               MesaRPG.estado
            --------------------------------------------- */

            if (
                window.MesaRPG &&
                window.MesaRPG.estado
            ) {

                const estado =
                    typeof window.MesaRPG.estado ===
                    "function"

                        ? window.MesaRPG.estado()

                        : window.MesaRPG.estado;


                if (
                    estado &&
                    estado.campanha &&
                    estado.campanha.id
                ) {

                    return estado.campanha;

                }

            }


            /* ---------------------------------------------
               localStorage
            --------------------------------------------- */

            const salvo =
                localStorage.getItem(
                    "rpg_mesa_ativa"
                );


            if (salvo) {

                const dados =
                    JSON.parse(salvo);


                if (
                    dados &&
                    dados.campaignId
                ) {

                    return {

                        id:
                            dados.campaignId,

                        name:
                            dados.campaignName ||
                            "Campanha",

                        codigo_mesa:
                            dados.campaignCode ||
                            null,

                        master_id:
                            dados.masterId ||
                            null

                    };

                }

            }

        } catch (erro) {

            console.warn(
                "[MESA DIAGNÓSTICO] Erro ao obter campanha:",
                erro
            );

        }

        return null;

    }


    /* =====================================================
       MENSAGEM DE ERRO
    ===================================================== */

    function obterMensagemErro(erro) {

        if (!erro) {

            return "Erro desconhecido.";

        }


        if (
            typeof erro === "string"
        ) {

            return erro;

        }


        if (
            erro.message
        ) {

            return erro.message;

        }


        try {

            return JSON.stringify(
                erro
            );

        } catch {

            return String(
                erro
            );

        }

    }


    /* =====================================================
       ESCAPAR HTML
    ===================================================== */

    function escaparHTML(valor) {

        return String(
            valor ?? ""
        )

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    /* =====================================================
       TESTES
    ===================================================== */

    function definirTeste(
        chave,
        status,
        titulo,
        mensagem,
        detalhes = "",
        impacto = "",
        causas = [],
        acao = ""
    ) {

        Diagnostico.testes[chave] = {

            chave,

            status,

            titulo,

            mensagem,

            detalhes,

            impacto,

            causas:
                Array.isArray(causas)
                    ? causas
                    : [causas],

            acao,

            timestamp:
                new Date()

        };

    }


    function registrarDiagnosticoTeste(
        chave
    ) {

        const teste =
            Diagnostico.testes[chave];


        if (!teste) {

            return;

        }


        const prefixos = {

            sucesso: "🟢",

            aviso: "🟡",

            erro: "🔴",

            info: "🔵"

        };


        const icone =
            prefixos[
                teste.status
            ] || "⚪";


        registrar(

            teste.status,

            `${icone} ${teste.titulo}: ${teste.mensagem}`

        );

    }


    /* =====================================================
       LOG
    ===================================================== */

    function registrar(
        tipo,
        mensagem
    ) {

        const entrada = {

            tipo:
                tipo ||
                "info",

            mensagem:
                String(
                    mensagem ?? ""
                ),

            data:
                new Date()

        };


        Diagnostico.logs.push(
            entrada
        );


        if (
            Diagnostico.logs.length >
            Diagnostico.maxLogs
        ) {

            Diagnostico.logs.shift();

        }


        atualizarLog();

    }


    function atualizarLog() {

        const elemento =
            document.getElementById(
                "diagnostico-log"
            );


        if (!elemento) {

            return;

        }


        if (
            !Diagnostico.logs.length
        ) {

            elemento.innerHTML =
                "Nenhum evento registrado.";

            return;

        }


        elemento.innerHTML =

            Diagnostico.logs

                .slice()

                .reverse()

                .map(
                    (item) => {

                        const hora =

                            item.data instanceof Date

                                ? item.data.toLocaleTimeString(
                                    "pt-BR"
                                )

                                : "";


                        return `

                            <div class="diagnostico-log-item diagnostico-log-${escaparHTML(item.tipo)}">

                                <span class="diagnostico-log-hora">
                                    [${escaparHTML(hora)}]
                                </span>

                                <span class="diagnostico-log-mensagem">
                                    ${escaparHTML(item.mensagem)}
                                </span>

                            </div>

                        `;

                    }
                )

                .join("");

    }


    /* =====================================================
       STATUS VISUAL
    ===================================================== */

    function definirStatus(
        chave,
        texto
    ) {

        const elemento =
            document.querySelector(
                `[data-diagnostico="${chave}"]`
            );


        if (!elemento) {

            return;

        }


        elemento.textContent =
            texto;

    }


    /* =====================================================
       AMBIENTE
    ===================================================== */

    function diagnosticarAmbiente() {

        const sdkSupabase =
            !!window.supabase;


        const clienteSupabase =
            !!obterSupabaseCliente();


        const mesaRPG =
            !!window.MesaRPG;


        const mesaOnline =
            !!window.mesaOnline;


        const realtime =
            !!(
                window.supabase &&
                typeof window.supabase.createClient ===
                "function"
            );


        const diagnostico =
            !!window.MesaDiagnostico;


        const detalhes = [

            `SDK Supabase: ${
                sdkSupabase
                    ? "OK"
                    : "ausente"
            }`,

            `Cliente Supabase: ${
                clienteSupabase
                    ? "OK"
                    : "ausente"
            }`,

            `MesaRPG: ${
                mesaRPG
                    ? "OK"
                    : "ausente"
            }`,

            `mesaOnline: ${
                mesaOnline
                    ? "OK"
                    : "ausente"
            }`,

            `Realtime SDK: ${
                realtime
                    ? "OK"
                    : "ausente"
            }`,

            `Diagnóstico: ${
                diagnostico
                    ? "OK"
                    : "inicializando"
            }`

        ];


        definirTeste(

            "ambiente",

            sdkSupabase &&
            clienteSupabase &&
            mesaRPG &&
            mesaOnline

                ? "sucesso"

                : "aviso",

            "Ambiente",

            sdkSupabase &&
            clienteSupabase &&
            mesaRPG &&
            mesaOnline

                ? "Ambiente principal carregado."

                : "Alguns componentes ainda não foram encontrados.",

            detalhes.join(
                " | "
            ),

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "ambiente"
        );

    }


    /* =====================================================
       SUPABASE
    ===================================================== */

    function diagnosticarSupabase() {

        const cliente =
            obterSupabaseCliente();


        if (!cliente) {

            definirStatus(
                "supabase",
                "🔴 Ausente"
            );


            definirTeste(

                "supabase",

                "erro",

                "Supabase",

                "O cliente Supabase não foi encontrado.",

                "Nenhum cliente Supabase válido foi localizado.",

                "A Mesa não poderá acessar autenticação, banco ou Realtime.",

                [

                    "supabase.js pode não ter carregado.",

                    "O cliente pode não ter sido criado.",

                    "O nome global do cliente pode ser diferente."

                ],

                "Verifique o supabase.js e a ordem dos scripts."

            );


            registrarDiagnosticoTeste(
                "supabase"
            );


            return;

        }


        definirStatus(
            "supabase",
            "🟢 Carregado"
        );


        definirTeste(

            "supabase",

            "sucesso",

            "Supabase",

            "Cliente Supabase encontrado.",

            "O cliente possui acesso ao módulo de autenticação.",

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "supabase"
        );

    }


    /* =====================================================
       SUPABASE MESA
    ===================================================== */

    function diagnosticarSupabaseMesa() {

        const mesa =
            obterSupabaseMesa();


        if (!mesa) {

            definirTeste(

                "supabaseMesa",

                "aviso",

                "Supabase Mesa",

                "O módulo específico da Mesa não foi encontrado.",

                "Isso não significa necessariamente que o Supabase esteja quebrado.",

                "",

                [

                    "O módulo pode utilizar outro nome global.",

                    "O script pode ainda estar carregando."

                ],

                "Verifique se supabase.js está sendo carregado."

            );


            registrarDiagnosticoTeste(
                "supabaseMesa"
            );


            return;

        }


        definirTeste(

            "supabaseMesa",

            "sucesso",

            "Supabase Mesa",

            "Módulo Supabase da Mesa encontrado.",

            "O módulo está disponível no navegador.",

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "supabaseMesa"
        );

    }


    /* =====================================================
       USUÁRIO
    ===================================================== */

    async function diagnosticarUsuario(
        cliente
    ) {

        const auth =
            obterAuth();


        let usuario =
            null;


        try {

            if (

                cliente &&

                cliente.auth &&

                typeof cliente.auth.getUser ===
                "function"

            ) {

                const resposta =
                    await cliente.auth.getUser();


                usuario =
                    resposta?.data?.user ||
                    null;

            }

        } catch (erro) {

            registrar(

                "erro",

                "Erro ao consultar usuário Supabase: " +
                obterMensagemErro(erro)

            );

        }


        const userId =

            usuario?.id ||

            auth?.user?.id ||

            auth?.userId ||

            auth?.usuario?.id ||

            null;


        if (!userId) {

            definirStatus(
                "usuario",
                "🟡 Não identificado"
            );


            definirTeste(

                "usuario",

                "aviso",

                "Usuário",

                "Nenhum usuário autenticado foi identificado.",

                "Não foi possível encontrar o UUID do usuário.",

                "A entrada na campanha pode ainda não ter sido concluída.",

                [

                    "Sessão Supabase ainda não carregada.",

                    "rpgAuth ainda não recebeu o usuário."

                ],

                "Verifique a autenticação e aguarde o carregamento da Mesa."

            );


            registrarDiagnosticoTeste(
                "usuario"
            );


            return;

        }


        definirStatus(
            "usuario",
            "🟢 Identificado"
        );


        definirTeste(

            "usuario",

            "sucesso",

            "Usuário",

            "Usuário autenticado identificado.",

            `UUID: ${userId}`,

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "usuario"
        );

    }


    /* =====================================================
       CAMPANHA
    ===================================================== */

    function diagnosticarCampanha() {

        const campanha =
            obterCampanha();


        if (!campanha) {

            definirStatus(
                "campanha",
                "🔴 Ausente"
            );


            definirTeste(

                "campanha",

                "erro",

                "Campanha",

                "Nenhuma campanha foi encontrada.",

                "rpgAuth.campaign / rpgCampaign não estão disponíveis.",

                "A Mesa não sabe qual campanha deve sincronizar.",

                [

                    "A entrada da Mesa ainda não terminou.",

                    "O contexto da campanha não foi carregado."

                ],

                "Volte à entrada da Mesa e carregue a campanha novamente."

            );


            registrarDiagnosticoTeste(
                "campanha"
            );


            return;

        }


        const id =

            campanha.id ||

            campanha.campaign_id ||

            campanha.campaignId ||

            null;


        const nome =

            campanha.nome ||

            campanha.name ||

            campanha.titulo ||

            "Sem nome";


        definirStatus(

            "campanha",

            id

                ? "🟢 Encontrada"

                : "🟡 Sem ID"

        );


        definirTeste(

            "campanha",

            id

                ? "sucesso"

                : "aviso",

            "Campanha",

            id

                ? `Campanha "${nome}" encontrada.`

                : "Campanha encontrada, mas sem ID.",

            id

                ? `ID: ${id}`

                : "Não foi possível localizar o ID da campanha.",

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "campanha"
        );


        atualizarDadosCampanha();

    }


    /* =====================================================
       DADOS DA CAMPANHA
    ===================================================== */

    function atualizarDadosCampanha() {

        const campanha =
            obterCampanha();


        if (!campanha) {

            return;

        }


        const id =

            campanha.id ||

            campanha.campaign_id ||

            campanha.campaignId ||

            "—";


        const nome =

            campanha.nome ||

            campanha.name ||

            campanha.titulo ||

            "—";


        const masterId =

            campanha.master_id ||

            campanha.masterId ||

            "—";


        const campoId =
            document.getElementById(
                "diagnostico-campanha-id"
            );


        const campoNome =
            document.getElementById(
                "diagnostico-campanha-nome"
            );


        const campoMaster =
            document.getElementById(
                "diagnostico-master-id"
            );


        if (campoId) {

            campoId.textContent =
                id;

        }


        if (campoNome) {

            campoNome.textContent =
                nome;

        }


        if (campoMaster) {

            campoMaster.textContent =
                masterId;

        }

    }


    /* =====================================================
       PERSONAGENS
    ===================================================== */

    function diagnosticarPersonagens() {

        const personagens =
            obterPersonagens();


        const quantidade =
            personagens.length;


        Diagnostico.ultimaQuantidadePersonagens =
            quantidade;


        definirStatus(

            "personagens",

            `🟢 ${quantidade}`

        );


        definirTeste(

            "personagens",

            "sucesso",

            "Personagens",

            `${quantidade} personagem(ns) encontrados.`,

            quantidade

                ? "A Mesa recebeu personagens para sincronização."

                : "Nenhum personagem foi encontrado no contexto atual.",

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "personagens"
        );


        atualizarSlots(
            personagens
        );

    }


    /* =====================================================
       SLOTS
    ===================================================== */

    function atualizarSlots(
        personagens
    ) {

        const quantidade =

            Array.isArray(
                personagens
            )

                ? personagens.length

                : 0;


        const elemento =
            document.getElementById(
                "diagnostico-slots"
            );


        if (elemento) {

            elemento.textContent =
                String(
                    quantidade
                );

        }


        const campanha =
            obterCampanha();


        let texto =
            `${quantidade} personagem(ns)`;


        if (campanha) {

            texto +=
                " carregados na campanha.";

        }


        const testeExistente =
            Diagnostico.testes.slots;


        if (!testeExistente) {

            definirTeste(

                "slots",

                "sucesso",

                "Slots",

                texto,

                "A quantidade representa os personagens encontrados no contexto atual.",

                "",

                [],

                ""

            );

        } else {

            testeExistente.mensagem =
                texto;

            testeExistente.timestamp =
                new Date();

        }


        definirStatus(

            "slots",

            `🟢 ${quantidade}`

        );


        registrarDiagnosticoTeste(
            "slots"
        );

    }


    /* =====================================================
       SUPABASE REALTIME
    ===================================================== */

    async function diagnosticarRealtime() {

        const multiplayer =
            window.mesaOnline || null;


        const canal =
            multiplayer?.canal ||
            multiplayer?.channel ||
            null;


        const campanha =
            obterCampanha();


        /* ---------------------------------------------
           SEM MESA ONLINE
        --------------------------------------------- */

        if (!multiplayer) {

            definirStatus(
                "realtime",
                "🔴 mesaOnline ausente"
            );


            definirTeste(

                "realtime",

                "erro",

                "Supabase Realtime",

                "A camada mesaOnline não foi encontrada.",

                "Não existe uma camada Realtime disponível para diagnóstico.",

                "A sincronização em tempo real não pode ser verificada.",

                [

                    "mesa-online.js pode não ter carregado.",

                    "Pode existir um erro JavaScript antes da inicialização."

                ],

                "Verifique se mesa-online.js está no mesa.html."

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            return;

        }


        /* ---------------------------------------------
           SEM CAMPANHA
        --------------------------------------------- */

        if (!campanha) {

            definirStatus(

                "realtime",

                "🟡 Aguardando campanha"

            );


            definirTeste(

                "realtime",

                "aviso",

                "Supabase Realtime",

                "O Realtime está aguardando o contexto da campanha.",

                "Nenhuma campanha disponível para definir o canal.",

                "",

                [

                    "A entrada da Mesa ainda pode estar carregando."

                ],

                "Aguarde o carregamento da campanha."

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            return;

        }


        /* ---------------------------------------------
           SEM CANAL
        --------------------------------------------- */

        if (!canal) {

            definirStatus(

                "realtime",

                "🟡 Canal ausente"

            );


            definirTeste(

                "realtime",

                "aviso",

                "Supabase Realtime",

                "mesaOnline existe, mas nenhum canal Realtime foi encontrado.",

                `Campanha: ${
                    campanha.id ||
                    campanha.campaign_id ||
                    campanha.campaignId ||
                    "sem ID"
                }`,

                "A Mesa ainda não possui um canal Realtime ativo.",

                [

                    "A conexão pode ainda estar iniciando.",

                    "mesa-online.js pode não ter criado o canal.",

                    "A campanha pode ter sido carregada depois da inicialização."

                ],

                "Aguarde a conexão ou sincronize novamente."

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            return;

        }


        /* ---------------------------------------------
           DADOS DO CANAL
        --------------------------------------------- */

        let estadoCanal =
            "desconhecido";


        let nomeCanal =
            "sem nome";


        try {

            estadoCanal =
                canal.state ||
                "desconhecido";


            nomeCanal =
                canal.topic ||
                canal.name ||
                "sem nome";

        } catch (erro) {

            registrar(

                "erro",

                "Erro ao consultar estado do canal Supabase: " +
                obterMensagemErro(erro)

            );

        }


        const detalhes = [

            `Canal: ${nomeCanal}`,

            `Estado: ${estadoCanal}`,

            `Campanha: ${
                campanha.id ||
                campanha.campaign_id ||
                campanha.campaignId ||
                "sem ID"
            }`

        ];


        /* ---------------------------------------------
           PRESENCE
        --------------------------------------------- */

        let quantidadePresenca =
            Diagnostico.jogadoresOnline || 0;


        if (
            typeof canal.presenceState ===
            "function"
        ) {

            try {

                const estado =
                    canal.presenceState();


                const chaves =
                    estado &&
                    typeof estado === "object"

                        ? Object.keys(
                            estado
                        )

                        : [];


                quantidadePresenca =
                    chaves.reduce(

                        function (
                            total,
                            chave
                        ) {

                            const membros =
                                Array.isArray(
                                    estado[chave]
                                )

                                    ? estado[chave]

                                    : [];


                            return (
                                total +
                                membros.length
                            );

                        },

                        0

                    );


                Diagnostico.jogadoresOnline =
                    quantidadePresenca;


                detalhes.push(

                    `Jogadores online: ${quantidadePresenca}`

                );

            } catch (erro) {

                detalhes.push(
                    "Presença: erro ao consultar."
                );


                registrar(

                    "aviso",

                    "Não foi possível consultar a presença Supabase: " +
                    obterMensagemErro(erro)

                );

            }

        } else {

            detalhes.push(
                "Presence: API indisponível"
            );

        }


        Diagnostico.ultimoRealtime =
            new Date();


        Diagnostico.ultimoMultiplayer =
            new Date();


        /* ---------------------------------------------
           SUBSCRIBED
        --------------------------------------------- */

        if (
            estadoCanal ===
            "SUBSCRIBED"
        ) {

            definirStatus(

                "realtime",

                `🟢 Conectado (${quantidadePresenca})`

            );


            definirStatus(

                "multiplayer",

                `🟢 Conectado (${quantidadePresenca})`

            );


            definirTeste(

                "realtime",

                "sucesso",

                "Supabase Realtime",

                "Canal Realtime conectado com sucesso.",

                detalhes.join(
                    " | "
                ),

                "A Mesa está conectada ao canal multiplayer do Supabase.",

                [],

                ""

            );


            definirTeste(

                "multiplayer",

                "sucesso",

                "Multiplayer Supabase",

                "Multiplayer Supabase Realtime conectado.",

                detalhes.join(
                    " | "
                ),

                "A presença dos jogadores pode ser sincronizada em tempo real.",

                [],

                ""

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            registrarDiagnosticoTeste(
                "multiplayer"
            );


            return;

        }


        /* ---------------------------------------------
           CHANNEL ERROR
        --------------------------------------------- */

        if (
            estadoCanal ===
            "CHANNEL_ERROR"
        ) {

            definirStatus(

                "realtime",

                "🔴 Erro no canal"

            );


            definirStatus(

                "multiplayer",

                "🔴 Erro"

            );


            definirTeste(

                "realtime",

                "erro",

                "Supabase Realtime",

                "O canal Realtime apresentou um erro.",

                detalhes.join(
                    " | "
                ),

                "A sincronização em tempo real pode não funcionar.",

                [

                    "Problema de conexão com o Realtime.",

                    "Problema de configuração do canal.",

                    "Problema de autenticação ou RLS.",

                    "Configuração de Realtime da tabela pode estar incompleta."

                ],

                "Verifique o console do navegador e o estado do canal."

            );


            definirTeste(

                "multiplayer",

                "erro",

                "Multiplayer Supabase",

                "O canal multiplayer apresentou erro.",

                detalhes.join(
                    " | "
                ),

                "Os jogadores podem não aparecer em tempo real.",

                [],

                "Verifique a conexão Supabase Realtime."

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            registrarDiagnosticoTeste(
                "multiplayer"
            );


            return;

        }


        /* ---------------------------------------------
           TIMED OUT
        --------------------------------------------- */

        if (
            estadoCanal ===
            "TIMED_OUT"
        ) {

            definirStatus(

                "realtime",

                "🟡 Timeout"

            );


            definirStatus(

                "multiplayer",

                "🟡 Timeout"

            );


            definirTeste(

                "realtime",

                "aviso",

                "Supabase Realtime",

                "O canal Realtime excedeu o tempo de conexão.",

                detalhes.join(
                    " | "
                ),

                "A conexão pode ser estabelecida novamente automaticamente.",

                [

                    "Conexão de internet instável.",

                    "Servidor Realtime demorou para responder.",

                    "Problema temporário de rede."

                ],

                "Aguarde alguns segundos e tente sincronizar novamente."

            );


            definirTeste(

                "multiplayer",

                "aviso",

                "Multiplayer Supabase",

                "A conexão multiplayer atingiu timeout.",

                detalhes.join(
                    " | "
                ),

                "Os jogadores podem não estar sincronizados temporariamente.",

                [],

                "Aguarde a reconexão."

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            registrarDiagnosticoTeste(
                "multiplayer"
            );


            return;

        }


        /* ---------------------------------------------
           CLOSED
        --------------------------------------------- */

        if (
            estadoCanal ===
            "CLOSED"
        ) {

            definirStatus(

                "realtime",

                "🟡 Fechado"

            );


            definirStatus(

                "multiplayer",

                "🟡 Desconectado"

            );


            definirTeste(

                "realtime",

                "aviso",

                "Supabase Realtime",

                "O canal Realtime está fechado.",

                detalhes.join(
                    " | "
                ),

                "Nenhum evento multiplayer será recebido enquanto o canal estiver fechado.",

                [

                    "A Mesa pode ter sido desconectada.",

                    "A campanha pode ter mudado.",

                    "O canal pode ter sido encerrado manualmente."

                ],

                "Reconecte a Mesa."

            );


            definirTeste(

                "multiplayer",

                "aviso",

                "Multiplayer Supabase",

                "O multiplayer está desconectado.",

                detalhes.join(
                    " | "
                ),

                "A sincronização em tempo real está pausada.",

                [],

                "Reconecte a Mesa."

            );


            registrarDiagnosticoTeste(
                "realtime"
            );


            registrarDiagnosticoTeste(
                "multiplayer"
            );


            return;

        }


        /* ---------------------------------------------
           OUTROS ESTADOS
        --------------------------------------------- */

        definirStatus(

            "realtime",

            `🟡 ${estadoCanal}`

        );


        definirStatus(

            "multiplayer",

            `🟡 ${estadoCanal}`

        );


        definirTeste(

            "realtime",

            "aviso",

            "Supabase Realtime",

            `O canal está em estado "${estadoCanal}".`,

            detalhes.join(
                " | "
            ),

            "O Realtime ainda não está confirmado como conectado.",

            [],

            "Aguarde a conexão terminar."

        );


        definirTeste(

            "multiplayer",

            "aviso",

            "Multiplayer Supabase",

            `O multiplayer está em estado "${estadoCanal}".`,

            detalhes.join(
                " | "
            ),

            "A sincronização ainda não está confirmada.",

            [],

            "Aguarde a conexão."

        );


        registrarDiagnosticoTeste(
            "realtime"
        );


        registrarDiagnosticoTeste(
            "multiplayer"
        );

    }


    /* =====================================================
       FUNÇÕES DA MESA
    ===================================================== */

    function diagnosticarFuncoesMesa() {

        const mesa =
            obterEstadoMesa();


        const funcoes = {

            carregarJogadores:

                !!(

                    mesa &&

                    typeof mesa
                        .carregarJogadoresDaCampanha ===
                    "function"

                ),


            sincronizar:

                typeof window
                    .sincronizarPersonagensMesa ===
                "function",


            conectarRealtime:

                !!(

                    window.mesaOnline &&

                    typeof window.mesaOnline
                        .conectar ===
                    "function"

                ),


            desconectarRealtime:

                !!(

                    window.mesaOnline &&

                    typeof window.mesaOnline
                        .desconectar ===
                    "function"

                ),


            enviarEvento:

                !!(

                    window.mesaOnline &&

                    typeof window.mesaOnline
                        .enviar ===
                    "function"

                )

        };


        const quantidade =
            Object.values(
                funcoes
            )
                .filter(Boolean)
                .length;


        definirTeste(

            "funcoesMesa",

            quantidade ===
            Object.keys(funcoes).length

                ? "sucesso"

                : "aviso",

            "Funções da Mesa",

            `${quantidade}/${Object.keys(funcoes).length} funções principais disponíveis.`,

            Object.entries(
                funcoes
            )

                .map(

                    ([nome, ativa]) =>

                        `${nome}: ${
                            ativa
                                ? "OK"
                                : "ausente"
                        }`

                )

                .join(
                    " | "
                ),

            "",

            [],

            ""

        );


        registrarDiagnosticoTeste(
            "funcoesMesa"
        );

    }


    /* =====================================================
       RESUMO
    ===================================================== */

    function atualizarResumoDiagnostico() {

        const testes =
            Object.values(
                Diagnostico.testes
            );


        const sucessos =
            testes.filter(

                (teste) =>

                    teste.status ===
                    "sucesso"

            ).length;


        const avisos =
            testes.filter(

                (teste) =>

                    teste.status ===
                    "aviso"

            ).length;


        const erros =
            testes.filter(

                (teste) =>

                    teste.status ===
                    "erro"

            ).length;


        const resumo =
            document.getElementById(
                "diagnostico-resumo"
            );


        if (resumo) {

            resumo.textContent =

                `${sucessos} OK • ${avisos} avisos • ${erros} erros`;

        }


        Diagnostico.ultimoDiagnostico = {

            data:
                new Date(),

            sucessos,

            avisos,

            erros,

            total:
                testes.length

        };

    }


    /* =====================================================
       RELATÓRIO
    ===================================================== */

    function gerarRelatorio() {

        const detalhes =
            document.getElementById(
                "diagnostico-detalhes"
            );


        if (!detalhes) {

            return;

        }


        const testes =
            Object.values(
                Diagnostico.testes
            );


        if (!testes.length) {

            detalhes.innerHTML =
                "<p>Nenhum diagnóstico executado.</p>";

            return;

        }


        detalhes.innerHTML =

            testes

                .map(
                    (teste) => {

                        const classe =

                            `diagnostico-teste-${escaparHTML(
                                teste.status
                            )}`;


                        const causas =

                            Array.isArray(
                                teste.causas
                            ) &&

                            teste.causas.length

                                ? `

                                    <ul>

                                        ${
                                            teste.causas

                                                .map(

                                                    (causa) =>

                                                        `<li>${escaparHTML(causa)}</li>`

                                                )

                                                .join("")

                                        }

                                    </ul>

                                  `

                                : "";


                        return `

                            <div class="diagnostico-teste ${classe}">

                                <div class="diagnostico-teste-titulo">

                                    ${escaparHTML(
                                        teste.titulo
                                    )}

                                </div>


                                <div class="diagnostico-teste-mensagem">

                                    ${escaparHTML(
                                        teste.mensagem
                                    )}

                                </div>


                                ${
                                    teste.detalhes

                                        ? `

                                            <div class="diagnostico-teste-detalhes">

                                                ${escaparHTML(
                                                    teste.detalhes
                                                )}

                                            </div>

                                          `

                                        : ""

                                }


                                ${
                                    teste.impacto

                                        ? `

                                            <div class="diagnostico-teste-impacto">

                                                <strong>
                                                    Impacto:
                                                </strong>

                                                ${escaparHTML(
                                                    teste.impacto
                                                )}

                                            </div>

                                          `

                                        : ""

                                }


                                ${
                                    causas

                                        ? `

                                            <div class="diagnostico-teste-causas">

                                                <strong>
                                                    Possíveis causas:
                                                </strong>

                                                ${causas}

                                            </div>

                                          `

                                        : ""

                                }


                                ${
                                    teste.acao

                                        ? `

                                            <div class="diagnostico-teste-acao">

                                                <strong>
                                                    Ação:
                                                </strong>

                                                ${escaparHTML(
                                                    teste.acao
                                                )}

                                            </div>

                                          `

                                        : ""

                                }

                            </div>

                        `;

                    }
                )

                .join("");

    }


    /* =====================================================
       DIAGNÓSTICO COMPLETO
    ===================================================== */

    async function atualizarDiagnostico() {

        registrar(

            "info",

            "Iniciando diagnóstico completo da Mesa."

        );


        /* ---------------------------------------------
           Ambiente
        --------------------------------------------- */

        diagnosticarAmbiente();


        /* ---------------------------------------------
           Supabase
        --------------------------------------------- */

        diagnosticarSupabase();


        /* ---------------------------------------------
           Supabase Mesa
        --------------------------------------------- */

        diagnosticarSupabaseMesa();


        /* ---------------------------------------------
           Usuário
        --------------------------------------------- */

        await diagnosticarUsuario(

            obterSupabaseCliente()

        );


        /* ---------------------------------------------
           Campanha
        --------------------------------------------- */

        diagnosticarCampanha();


        /* ---------------------------------------------
           Personagens
        --------------------------------------------- */

        diagnosticarPersonagens();


        /* ---------------------------------------------
           Realtime Supabase
        --------------------------------------------- */

        await diagnosticarRealtime();


        /* ---------------------------------------------
           Funções da Mesa
        --------------------------------------------- */

        diagnosticarFuncoesMesa();


        /* ---------------------------------------------
           Resumo
        --------------------------------------------- */

        atualizarResumoDiagnostico();


        gerarRelatorio();


        registrar(

            "sucesso",

            "Diagnóstico completo finalizado."

        );

    }


    /* =====================================================
       SINCRONIZAR AGORA
    ===================================================== */

    async function sincronizarAgora() {

        registrar(

            "info",

            "Sincronização manual solicitada."

        );


        try {

            if (

                window.MesaRPG &&

                typeof window.MesaRPG
                    .carregarJogadoresDaCampanha ===
                "function"

            ) {

                await window.MesaRPG
                    .carregarJogadoresDaCampanha();


                registrar(

                    "sucesso",

                    "Jogadores da campanha sincronizados."

                );

            }

            else if (

                typeof window
                    .sincronizarPersonagensMesa ===
                "function"

            ) {

                await window
                    .sincronizarPersonagensMesa();


                registrar(

                    "sucesso",

                    "Personagens da Mesa sincronizados."

                );

            }

            else {

                registrar(

                    "aviso",

                    "Nenhuma função de sincronização disponível."

                );

            }


            /* -----------------------------------------
               Revalidar Realtime
            ----------------------------------------- */

            await diagnosticarRealtime();


        } catch (erro) {

            registrar(

                "erro",

                "Erro na sincronização: " +
                obterMensagemErro(
                    erro
                )

            );

        }


        await atualizarDiagnostico();

    }


    /* =====================================================
       EVENTOS
    ===================================================== */

    function registrarEventos() {

        /* ---------------------------------------------
           Jogadores atualizados
        --------------------------------------------- */

        window.addEventListener(

            "mesa:jogadoresAtualizados",

            function (evento) {

                registrar(

                    "sucesso",

                    "Evento mesa:jogadoresAtualizados recebido."

                );


                if (
                    evento &&
                    evento.detail
                ) {

                    registrar(

                        "info",

                        "Dados de jogadores atualizados."

                    );

                }


                diagnosticarPersonagens();


                atualizarResumoDiagnostico();

            }

        );


        /* ---------------------------------------------
           Estado dos jogadores
        --------------------------------------------- */

        window.addEventListener(

            "mesa:estadoJogadoresAtualizado",

            function () {

                registrar(

                    "info",

                    "Estado dos jogadores atualizado."

                );

            }

        );


        /* ---------------------------------------------
           Jogador individual
        --------------------------------------------- */

        window.addEventListener(

            "mesa:jogadorAtualizado",

            function () {

                registrar(

                    "info",

                    "Dados de um jogador foram atualizados."

                );

            }

        );


        /* ---------------------------------------------
           Campanha
        --------------------------------------------- */

        window.addEventListener(

            "rpg:campanhaAtualizada",

            function () {

                registrar(

                    "sucesso",

                    "Contexto da campanha atualizado."

                );


                diagnosticarCampanha();


                diagnosticarRealtime();

            }

        );


        /* ---------------------------------------------
           Personagens sincronizados
        --------------------------------------------- */

        window.addEventListener(

            "mesa:jogadores:personagensSincronizados",

            function () {

                registrar(

                    "sucesso",

                    "Personagens sincronizados."

                );


                diagnosticarPersonagens();

            }

        );


        /* ---------------------------------------------
           Supabase Mesa pronto
        --------------------------------------------- */

        window.addEventListener(

            "supabase:mesaPronto",

            function () {

                registrar(

                    "sucesso",

                    "Supabase Mesa informou que está pronto."

                );


                diagnosticarSupabaseMesa();


                diagnosticarRealtime();

            }

        );


        /* ---------------------------------------------
           Contexto recebido
        --------------------------------------------- */

        window.addEventListener(

            "supabase:mesaContextoRecebido",

            function () {

                registrar(

                    "sucesso",

                    "Contexto da Mesa recebido do Supabase."

                );


                diagnosticarCampanha();


                diagnosticarRealtime();

            }

        );


        /* ---------------------------------------------
           Entrada pronta
        --------------------------------------------- */

        window.addEventListener(

            "supabase:entradaPronta",

            function () {

                registrar(

                    "sucesso",

                    "Entrada da Mesa concluída."

                );


                atualizarDiagnostico();

            }

        );


        /* =================================================
           SUPABASE REALTIME — CONECTADO
        ================================================= */

        window.addEventListener(

            "mesa:multiplayerConectado",

            function (evento) {

                registrar(

                    "sucesso",

                    "Multiplayer Supabase Realtime conectado."

                );


                if (
                    evento?.detail
                ) {

                    try {

                        registrar(

                            "info",

                            JSON.stringify(
                                evento.detail
                            )

                        );

                    } catch {

                        /* Ignora */

                    }

                }


                atualizarDiagnostico();

            }

        );


        /* =================================================
           SUPABASE REALTIME — JOGADORES
        ================================================= */

        window.addEventListener(

            "mesa:multiplayerJogadoresAtualizados",

            function (evento) {

                registrar(

                    "sucesso",

                    "Presença multiplayer atualizada."

                );


                if (
                    evento?.detail
                ) {

                    const quantidade =

                        evento.detail.quantidade ??

                        evento.detail.count ??

                        evento.detail.jogadoresOnline;


                    if (
                        typeof quantidade ===
                        "number"
                    ) {

                        Diagnostico.jogadoresOnline =
                            quantidade;

                    }

                }


                diagnosticarRealtime();

            }

        );


        /* =================================================
           SUPABASE REALTIME — DESCONECTADO
        ================================================= */

        window.addEventListener(

            "mesa:multiplayerDesconectado",

            function (evento) {

                registrar(

                    "aviso",

                    "Multiplayer Supabase Realtime desconectado."

                );


                if (
                    evento?.detail
                ) {

                    try {

                        registrar(

                            "aviso",

                            JSON.stringify(
                                evento.detail
                            )

                        );

                    } catch {

                        /* Ignora */

                    }

                }


                diagnosticarRealtime();

            }

        );


        /* =================================================
           SUPABASE REALTIME — ERRO
        ================================================= */

        window.addEventListener(

            "mesa:multiplayerErro",

            function (evento) {

                const detalhe =
                    evento?.detail;


                registrar(

                    "erro",

                    "Erro no multiplayer Supabase: " +

                    (

                        detalhe?.message ||

                        detalhe?.error ||

                        obterMensagemErro(
                            detalhe
                        )

                    )

                );


                diagnosticarRealtime();

            }

        );


        /* =================================================
           EVENTO MULTIPLAYER GENÉRICO
        ================================================= */

        window.addEventListener(

            "mesa:multiplayerEvento",

            function (evento) {

                registrar(

                    "info",

                    "Evento multiplayer recebido."

                );


                if (
                    evento?.detail
                ) {

                    try {

                        const detalhe =
                            evento.detail;


                        registrar(

                            "info",

                            JSON.stringify(
                                detalhe
                            )

                        );

                    } catch {

                        /* Ignora */

                    }

                }

            }

        );


        /* =================================================
           EVENTOS ESPECÍFICOS DO NOVO mesa-online.js
        ================================================= */

        window.addEventListener(

            "mesa:online:presence",

            function () {

                registrar(

                    "info",

                    "Evento de Presence recebido pelo Supabase."

                );


                diagnosticarRealtime();

            }

        );


        window.addEventListener(

            "mesa:online:broadcast",

            function (evento) {

                registrar(

                    "info",

                    "Broadcast multiplayer recebido."

                );


                if (
                    evento?.detail
                ) {

                    try {

                        registrar(

                            "info",

                            JSON.stringify(
                                evento.detail
                            )

                        );

                    } catch {

                        /* Ignora */

                    }

                }

            }

        );


        /* =================================================
           ERRO GLOBAL
        ================================================= */

        window.addEventListener(

            "error",

            function (evento) {

                registrar(

                    "erro",

                    `Erro JavaScript: ${
                        evento.message ||
                        "erro desconhecido"
                    }`

                );

            }

        );


        /* =================================================
           PROMISE REJEITADA
        ================================================= */

        window.addEventListener(

            "unhandledrejection",

            function (evento) {

                registrar(

                    "erro",

                    "Promise rejeitada: " +

                    obterMensagemErro(
                        evento.reason
                    )

                );

            }

        );

    }


    /* =====================================================
       ABRIR
    ===================================================== */

    function abrir() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );


        if (!painel) {

            registrar(

                "erro",

                "Painel de diagnóstico não encontrado."

            );


            return;

        }


        Diagnostico.aberto =
            true;


        painel.hidden =
            false;


        painel.style.display =
            "flex";


        atualizarDiagnostico();


        if (
            !Diagnostico.intervalo
        ) {

            Diagnostico.intervalo =

                setInterval(

                    function () {

                        if (
                            Diagnostico.aberto
                        ) {

                            atualizarDiagnostico();

                        }

                    },

                    5000

                );

        }

    }


    /* =====================================================
       FECHAR
    ===================================================== */

    function fechar() {

        const painel =
            document.getElementById(
                "mesa-diagnostico"
            );


        Diagnostico.aberto =
            false;


        if (painel) {

            painel.hidden =
                true;


            painel.style.display =
                "none";

        }


        if (
            Diagnostico.intervalo
        ) {

            clearInterval(
                Diagnostico.intervalo
            );


            Diagnostico.intervalo =
                null;

        }

    }


    /* =====================================================
       LIMPAR LOGS
    ===================================================== */

    function limparLogs() {

        Diagnostico.logs =
            [];


        atualizarLog();


        registrar(

            "info",

            "Logs limpos."

        );

    }


    /* =====================================================
       EVENTOS DA INTERFACE
    ===================================================== */

    function registrarEventosInterface() {

        /* ---------------------------------------------
           Abrir diagnóstico
        --------------------------------------------- */

        document.addEventListener(

            "click",

            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-diagnostico"
                    );


                if (!botao) {

                    return;

                }


                evento.preventDefault();


                abrir();

            }

        );


        /* ---------------------------------------------
           Fechar
        --------------------------------------------- */

        document.addEventListener(

            "click",

            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-fechar-diagnostico"
                    );


                if (!botao) {

                    return;

                }


                evento.preventDefault();


                fechar();

            }

        );


        /* ---------------------------------------------
           Limpar
        --------------------------------------------- */

        document.addEventListener(

            "click",

            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-limpar-diagnostico"
                    );


                if (!botao) {

                    return;

                }


                evento.preventDefault();


                limparLogs();

            }

        );


        /* ---------------------------------------------
           Sincronizar
        --------------------------------------------- */

        document.addEventListener(

            "click",

            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-sincronizar-diagnostico"
                    );


                if (!botao) {

                    return;

                }


                evento.preventDefault();


                sincronizarAgora();

            }

        );


        /* ---------------------------------------------
           Atualizar
        --------------------------------------------- */

        document.addEventListener(

            "click",

            function (evento) {

                const botao =
                    evento.target.closest(
                        "#btn-atualizar-diagnostico"
                    );


                if (!botao) {

                    return;

                }


                evento.preventDefault();


                atualizarDiagnostico();

            }

        );

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function inicializar() {

        if (
            Diagnostico.inicializado
        ) {

            return;

        }


        Diagnostico.inicializado =
            true;


        registrar(

            "info",

            "Sistema de diagnóstico da Mesa iniciado."

        );


        registrarEventos();


        registrarEventosInterface();


        /* ---------------------------------------------
           Primeiro diagnóstico
        --------------------------------------------- */

        setTimeout(

            function () {

                atualizarDiagnostico();

            },

            300

        );

    }


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.MesaDiagnostico = {

        abrir,

        fechar,

        registrar,

        atualizar:
            atualizarDiagnostico,

        sincronizar:
            sincronizarAgora,

        relatorio:
            gerarRelatorio,

        limpar:
            limparLogs,

        diagnosticarRealtime,

        diagnosticarMultiplayer:
            diagnosticarRealtime,

        estado:
            Diagnostico

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(

            "DOMContentLoaded",

            inicializar,

            {
                once: true
            }

        );

    } else {

        inicializar();

    }


})();
