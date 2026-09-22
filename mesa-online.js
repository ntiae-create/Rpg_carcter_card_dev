/* =========================================================
   MESA ONLINE — SUPABASE REALTIME
   ARQUITETURA:

   AUTH
     ↓
   CAMPANHA
     ↓
   MESA
     ↓
   ENTRAR_NA_MESA
     ↓
   MESA_JOGADORES
     ↓
   REALTIME
     ↓
   PRESENCE + BROADCAST

   NÃO UTILIZA ABLY
   NÃO UTILIZA PAT
   NÃO UTILIZA SERVICE_ROLE
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ESTADO INTERNO
    ===================================================== */

    let clienteSupabase = null;

    let canal = null;

    let tentativaConexao = false;

    let campanhaConectada = null;

    let mesaConectada = null;


    /* =====================================================
       ESTADO PÚBLICO
    ===================================================== */

    const estado = {

        conectado: false,

        campanhaId: null,

        mesaId: null,

        usuarioId: null,

        personagemId: null,

        slot: null,

        nome: null,

        isMaster: false,

        canal: null,

        realtimeStatus: "CLOSED"

    };


    /* =====================================================
       UTILITÁRIO — ERROS
    ===================================================== */

    function textoErro(valor) {

        if (!valor) {
            return "Sem motivo.";
        }


        if (typeof valor === "string") {
            return valor;
        }


        if (valor.message) {
            return valor.message;
        }


        try {

            return JSON.stringify(valor);

        } catch {

            return String(valor);

        }

    }


    /* =====================================================
       DIAGNÓSTICO
    ===================================================== */

    function logDiagnostico(
        texto,
        detalhe = ""
    ) {

        console.log(
            "[MESA-ONLINE]",
            texto,
            detalhe
        );


        const log =
            document.querySelector(
                "#diagnostico-log"
            );


        if (!log) {
            return;
        }


        const vazio =
            log.querySelector(
                ".diagnostico-log-vazio"
            );


        if (vazio) {
            vazio.remove();
        }


        const linha =
            document.createElement("div");


        linha.textContent =
            `[ONLINE] ${texto}${detalhe ? ` | ${detalhe}` : ""}`;


        log.appendChild(linha);


        log.scrollTop =
            log.scrollHeight;

    }


    /* =====================================================
       STATUS VISUAL DO REALTIME
    ===================================================== */

    function atualizarStatusRealtime(
        texto
    ) {

        const el =
            document.querySelector(
                '[data-diagnostico="realtime"]'
            );


        if (el) {

            el.textContent =
                texto;

        }


        window.dispatchEvent(

            new CustomEvent(
                "mesa:realtimeStatus",
                {
                    detail: {

                        texto: texto,

                        status:
                            estado.realtimeStatus,

                        conectado:
                            estado.conectado,

                        mesaId:
                            estado.mesaId,

                        campanhaId:
                            estado.campanhaId,

                        canal:
                            estado.canal

                    }
                }
            )

        );

    }


    /* =====================================================
       MESA ATIVA — LOCAL STORAGE
    ===================================================== */

    function obterMesaAtiva() {

        try {

            const salvo =
                localStorage.getItem(
                    "rpg_mesa_ativa"
                );


            return salvo
                ? JSON.parse(salvo)
                : null;

        } catch {

            return null;

        }

    }


    /* =====================================================
       SALVAR MESA ATIVA
    ===================================================== */

    function salvarMesaAtiva(
        dados = {}
    ) {

        try {

            const atual =
                obterMesaAtiva() || {};


            const novo = {

                ...atual,

                ...dados,

                campaignId:
                    dados.campaignId ||
                    atual.campaignId ||
                    estado.campanhaId,

                mesaId:
                    dados.mesaId ||
                    atual.mesaId ||
                    estado.mesaId,

                userId:
                    dados.userId ||
                    atual.userId ||
                    estado.usuarioId,

                characterId:
                    dados.characterId ||
                    atual.characterId ||
                    estado.personagemId,

                slot:
                    dados.slot ??
                    atual.slot ??
                    estado.slot,

                isMaster:
                    dados.isMaster ??
                    atual.isMaster ??
                    estado.isMaster

            };


            localStorage.setItem(

                "rpg_mesa_ativa",

                JSON.stringify(novo)

            );


            logDiagnostico(
                "💾 Mesa ativa salva",
                `Mesa:${novo.mesaId || "?"}`
            );


        } catch (erro) {

            logDiagnostico(
                "⚠️ Não foi possível salvar Mesa ativa",
                textoErro(erro)
            );

        }

    }


    /* =====================================================
       DADOS DA CAMPANHA / USUÁRIO
    ===================================================== */

    function obterDadosMesa() {

        const salvo =
            obterMesaAtiva() || {};


        const auth =
            window.rpgAuth || {};


        const campanha =
            auth.campaign || {};


        const usuario =
            auth.user || {};


        const jogador =
            auth.campaignCharacter ||
            auth.currentCharacter ||
            {};


        /* -----------------------------------------------
           CAMPANHA
        ------------------------------------------------ */

        estado.campanhaId =

            salvo.campaignId ||

            salvo.campaign_id ||

            campanha.id ||

            window.rpgCampaign
                ?.activeCampaign
                ?.id ||

            null;


        /* -----------------------------------------------
           USUÁRIO
        ------------------------------------------------ */

        estado.usuarioId =

            salvo.userId ||

            usuario.id ||

            null;


        /* -----------------------------------------------
           PERSONAGEM
        ------------------------------------------------ */

        estado.personagemId =

            salvo.characterId ||

            jogador.id ||

            null;


        /* -----------------------------------------------
           SLOT
        ------------------------------------------------ */

        if (
            salvo.slot !== undefined &&
            salvo.slot !== null
        ) {

            estado.slot =
                salvo.slot;

        } else if (
            auth.campaignSlot !== undefined &&
            auth.campaignSlot !== null
        ) {

            estado.slot =
                auth.campaignSlot;

        } else if (
            jogador.slot !== undefined &&
            jogador.slot !== null
        ) {

            estado.slot =
                jogador.slot;

        } else {

            estado.slot =
                null;

        }


        /* -----------------------------------------------
           MESA JÁ SALVA
        ------------------------------------------------ */

        if (
            salvo.mesaId
        ) {

            estado.mesaId =
                salvo.mesaId;

        }


        /* -----------------------------------------------
           NOME
        ------------------------------------------------ */

        estado.nome =

            jogador.name ||

            jogador.nome ||

            salvo.characterName ||

            usuario.user_metadata
                ?.name ||

            usuario.user_metadata
                ?.nome ||

            usuario.email
                ?.split("@")[0] ||

            "Jogador";


        /* -----------------------------------------------
           MESTRE
        ------------------------------------------------ */

        estado.isMaster =

            auth.isMaster === true ||

            salvo.isMaster === true ||

            Boolean(

                campanha.master_id &&

                usuario.id &&

                String(
                    campanha.master_id
                ) === String(
                    usuario.id
                )

            );


        logDiagnostico(

            "Dados carregados",

            `Campanha:${estado.campanhaId || "?"} ` +
            `Mesa:${estado.mesaId || "?"} ` +
            `Usuário:${estado.usuarioId || "?"} ` +
            `Personagem:${estado.personagemId || "?"} ` +
            `Slot:${estado.slot ?? "auto"} ` +
            `Mestre:${estado.isMaster}`

        );


        return estado;

    }


    /* =====================================================
       CLIENTE SUPABASE
    ===================================================== */

    async function obterClienteSupabase() {


        /* -----------------------------------------------
           SupabaseMesa
        ------------------------------------------------ */

        if (
            window.SupabaseMesa?.obterCliente
        ) {

            try {

                const cli =
                    window.SupabaseMesa
                        .obterCliente();


                if (cli) {

                    logDiagnostico(
                        "✅ Cliente via SupabaseMesa"
                    );


                    return cli;

                }

            } catch (erro) {

                logDiagnostico(
                    "⚠️ SupabaseMesa falhou",
                    textoErro(erro)
                );

            }

        }


        /* -----------------------------------------------
           supabaseClient
        ------------------------------------------------ */

        if (
            window.supabaseClient?.auth
        ) {

            logDiagnostico(
                "✅ Cliente via window.supabaseClient"
            );


            return window.supabaseClient;

        }


        /* -----------------------------------------------
           window.supabase
        ------------------------------------------------ */

        if (
            window.supabase?.auth
        ) {

            logDiagnostico(
                "✅ Cliente via window.supabase"
            );


            return window.supabase;

        }


        /* -----------------------------------------------
           window.sb
        ------------------------------------------------ */

        if (
            window.sb?.auth
        ) {

            logDiagnostico(
                "✅ Cliente via window.sb"
            );


            return window.sb;

        }


        logDiagnostico(
            "❌ Nenhum cliente Supabase encontrado"
        );


        return null;

    }


    /* =====================================================
       VERIFICAR SESSÃO
    ===================================================== */

    async function verificarSessao() {

        if (!clienteSupabase) {
            return null;
        }


        try {

            const resultado =
                await clienteSupabase
                    .auth
                    .getSession();


            if (
                resultado.error
            ) {

                logDiagnostico(
                    "❌ Erro ao obter sessão",
                    textoErro(
                        resultado.error
                    )
                );


                return null;

            }


            const session =
                resultado
                    ?.data
                    ?.session;


            if (!session) {

                logDiagnostico(
                    "❌ Nenhuma sessão autenticada"
                );


                return null;

            }


            estado.usuarioId =
                session.user?.id ||
                estado.usuarioId;


            logDiagnostico(
                "✅ Sessão Supabase confirmada",
                estado.usuarioId
            );


            return session;

        } catch (erro) {

            logDiagnostico(
                "❌ Erro ao verificar sessão",
                textoErro(erro)
            );


            return null;

        }

    }


    /* =====================================================
       LOCALIZAR MESA
       
       Procura a Mesa vinculada à campanha atual.
    ===================================================== */

    async function localizarMesa() {

        if (!clienteSupabase) {

            throw new Error(
                "Cliente Supabase não disponível."
            );

        }


        if (!estado.campanhaId) {

            throw new Error(
                "Campanha não identificada."
            );

        }


        logDiagnostico(
            "🔎 Procurando Mesa",
            `Campanha:${estado.campanhaId}`
        );


        /*
         * Se já temos uma mesa salva, primeiro
         * verificamos se ela ainda existe.
         */

        if (estado.mesaId) {

            try {

                const resultado =
                    await clienteSupabase
                        .from("mesas")
                        .select(
                            "id,campaign_id,codigo_mesa,status,mestre_id"
                        )
                        .eq(
                            "id",
                            estado.mesaId
                        )
                        .eq(
                            "campaign_id",
                            estado.campanhaId
                        )
                        .maybeSingle();


                if (
                    resultado.error
                ) {

                    logDiagnostico(
                        "⚠️ Não foi possível validar Mesa salva",
                        textoErro(
                            resultado.error
                        )
                    );

                } else if (
                    resultado.data
                ) {

                    logDiagnostico(
                        "✅ Mesa encontrada pelo ID salvo",
                        resultado.data.id
                    );


                    return resultado.data;

                }

            } catch (erro) {

                logDiagnostico(
                    "⚠️ Erro verificando Mesa salva",
                    textoErro(erro)
                );

            }

        }


        /*
         * Procura uma Mesa pertencente à campanha.
         */

        try {

            const resultado =
                await clienteSupabase
                    .from("mesas")
                    .select(
                        "id,campaign_id,codigo_mesa,status,mestre_id"
                    )
                    .eq(
                        "campaign_id",
                        estado.campanhaId
                    )
                    .limit(1)
                    .maybeSingle();


            if (
                resultado.error
            ) {

                throw resultado.error;

            }


            if (
                resultado.data
            ) {

                estado.mesaId =
                    resultado.data.id;


                salvarMesaAtiva({

                    mesaId:
                        estado.mesaId

                });


                logDiagnostico(
                    "✅ Mesa localizada",
                    `Mesa:${estado.mesaId}`
                );


                return resultado.data;

            }


            logDiagnostico(
                "ℹ️ Nenhuma Mesa encontrada"
            );


            return null;

        } catch (erro) {

            logDiagnostico(
                "❌ Erro ao localizar Mesa",
                textoErro(erro)
            );


            throw erro;

        }

    }


    /* =====================================================
       CRIAR MESA — SOMENTE MESTRE
       
       Usa a RPC criada pela IA do Supabase:

       criar_mesa(
           p_campaign_id,
           p_codigo_mesa
       )
    ===================================================== */

    async function criarMesaSeNecessario() {

        if (!estado.isMaster) {

            logDiagnostico(
                "ℹ️ Usuário não é Mestre — não criará Mesa"
            );


            return null;

        }


        logDiagnostico(
            "👑 Mestre — criando Mesa"
        );


        const ativa =
            obterMesaAtiva() || {};


        /*
         * Tenta recuperar o código da Mesa
         * já utilizado pelo sistema.
         */

        const codigoMesa =

            ativa.codigoMesa ||

            ativa.codigo_mesa ||

            window.rpgAuth
                ?.campaign
                ?.codigo_mesa ||

            window.rpgAuth
                ?.campaign
                ?.codigoMesa ||

            null;


        try {

            const resultado =
                await clienteSupabase
                    .rpc(
                        "criar_mesa",
                        {
                            p_campaign_id:
                                estado.campanhaId,

                            p_codigo_mesa:
                                codigoMesa
                        }
                    );


            if (
                resultado.error
            ) {

                throw resultado.error;

            }


            const dados =
                resultado.data;


            logDiagnostico(
                "✅ RPC criar_mesa executada"
            );


            /*
             * A RPC pode retornar:
             *
             * { id: "..." }
             *
             * ou:
             *
             * [{ id: "..." }]
             *
             * ou simplesmente um UUID.
             */

            let mesa = null;


            if (
                Array.isArray(dados)
            ) {

                mesa =
                    dados[0] || null;

            } else if (
                dados &&
                typeof dados === "object"
            ) {

                mesa =
                    dados;

            } else if (
                dados
            ) {

                mesa = {
                    id: dados
                };

            }


            if (
                mesa?.id
            ) {

                estado.mesaId =
                    mesa.id;


                salvarMesaAtiva({

                    mesaId:
                        mesa.id,

                    codigoMesa:
                        mesa.codigo_mesa ||
                        codigoMesa

                });


                logDiagnostico(
                    "🎯 Mesa criada",
                    `Mesa:${mesa.id}`
                );


                return mesa;

            }


            /*
             * Caso a RPC tenha criado a Mesa
             * mas retornado pouco/nada,
             * fazemos nova busca.
             */

            logDiagnostico(
                "ℹ️ Mesa criada — procurando registro"
            );


            return await localizarMesa();

        } catch (erro) {

            logDiagnostico(
                "❌ Erro ao criar Mesa",
                textoErro(erro)
            );


            throw erro;

        }

    }


    /* =====================================================
       GARANTIR QUE EXISTE UMA MESA
    ===================================================== */

    async function garantirMesa() {

        let mesa =
            await localizarMesa();


        /*
         * Se não existe:
         *
         * Mestre → cria
         * Jogador → aguarda / erro
         */

        if (!mesa) {

            if (!estado.isMaster) {

                throw new Error(
                    "Nenhuma Mesa foi encontrada para esta campanha. O Mestre precisa criar a Mesa primeiro."
                );

            }


            mesa =
                await criarMesaSeNecessario();


            /*
             * Se a RPC retornou algo, usamos.
             */

            if (
                mesa
            ) {

                return mesa;

            }


            /*
             * Última tentativa de localização.
             */

            mesa =
                await localizarMesa();


            if (!mesa) {

                throw new Error(
                    "Não foi possível localizar ou criar a Mesa."
                );

            }

        }


        estado.mesaId =
            mesa.id;


        salvarMesaAtiva({

            mesaId:
                mesa.id

        });


        logDiagnostico(
            "🎯 Mesa definida",
            `Mesa:${mesa.id}`
        );


        return mesa;

    }


    /* =====================================================
       ENTRAR NA MESA
       
       RPC:

       entrar_na_mesa(
           p_mesa_id,
           p_character_id,
           p_slot
       )

       O banco atribui automaticamente
       o primeiro slot disponível entre 1 e 8
       quando p_slot = null.
    ===================================================== */

    async function entrarNaMesa() {

        if (!estado.mesaId) {

            throw new Error(
                "Mesa não identificada."
            );

        }


        logDiagnostico(
            "🚪 Entrando na Mesa",
            `Mesa:${estado.mesaId}`
        );


        /*
         * Para o Mestre:
         *
         * p_character_id = null
         *
         * Para jogador:
         *
         * p_character_id = personagem
         */

        const characterId =
            estado.isMaster
                ? null
                : estado.personagemId;


        if (
            !estado.isMaster &&
            !characterId
        ) {

            throw new Error(
                "O jogador não possui personagem válido para entrar na Mesa."
            );

        }


        try {

            const resultado =
                await clienteSupabase
                    .rpc(
                        "entrar_na_mesa",
                        {

                            p_mesa_id:
                                estado.mesaId,

                            p_character_id:
                                characterId,

                            p_slot:
                                null

                        }
                    );


            if (
                resultado.error
            ) {

                throw resultado.error;

            }


            const dados =
                resultado.data;


            logDiagnostico(
                "✅ RPC entrar_na_mesa executada"
            );


            /*
             * Tenta descobrir o slot retornado
             * pela função.
             */

            let participacao =
                null;


            if (
                Array.isArray(dados)
            ) {

                participacao =
                    dados[0] || null;

            } else if (
                dados &&
                typeof dados === "object"
            ) {

                participacao =
                    dados;

            }


            if (
                participacao
            ) {

                const novoSlot =

                    participacao.slot ??

                    participacao.p_slot ??

                    participacao.mesa_slot ??

                    null;


                if (
                    novoSlot !== null &&
                    novoSlot !== undefined
                ) {

                    estado.slot =
                        novoSlot;

                }

            }


            /*
             * Se a RPC não retornou o slot,
             * tentamos descobrir através da tabela.
             */

            if (
                estado.slot === null &&
                !estado.isMaster
            ) {

                await descobrirParticipacao();

            }


            salvarMesaAtiva({

                mesaId:
                    estado.mesaId,

                characterId:
                    estado.personagemId,

                slot:
                    estado.slot,

                isMaster:
                    estado.isMaster

            });


            logDiagnostico(
                "🎯 Entrada na Mesa confirmada",
                `Slot:${estado.slot ?? "Mestre"}`
            );


            window.dispatchEvent(

                new CustomEvent(
                    "mesa:entradaConfirmada",
                    {
                        detail: {

                            mesaId:
                                estado.mesaId,

                            slot:
                                estado.slot,

                            isMaster:
                                estado.isMaster

                        }
                    }
                )

            );


            return participacao;

        } catch (erro) {

            logDiagnostico(
                "❌ Erro ao entrar na Mesa",
                textoErro(erro)
            );


            throw erro;

        }

    }


    /* =====================================================
       DESCOBRIR PARTICIPAÇÃO
       
       Usado quando a RPC não retorna claramente
       o slot.
    ===================================================== */

    async function descobrirParticipacao() {

        if (!estado.mesaId) {
            return null;
        }


        try {

            let consulta =
                clienteSupabase
                    .from("mesa_jogadores")
                    .select(
                        "id,mesa_id,user_id,character_id,slot,online"
                    )
                    .eq(
                        "mesa_id",
                        estado.mesaId
                    )
                    .eq(
                        "user_id",
                        estado.usuarioId
                    )
                    .limit(1)
                    .maybeSingle();


            if (
                estado.personagemId
            ) {

                consulta =
                    clienteSupabase
                        .from("mesa_jogadores")
                        .select(
                            "id,mesa_id,user_id,character_id,slot,online"
                        )
                        .eq(
                            "mesa_id",
                            estado.mesaId
                        )
                        .eq(
                            "user_id",
                            estado.usuarioId
                        )
                        .eq(
                            "character_id",
                            estado.personagemId
                        )
                        .limit(1)
                        .maybeSingle();

            }


            const resultado =
                await consulta;


            if (
                resultado.error
            ) {

                logDiagnostico(
                    "⚠️ Não foi possível consultar participação",
                    textoErro(
                        resultado.error
                    )
                );


                return null;

            }


            if (
                resultado.data
            ) {

                estado.slot =
                    resultado.data.slot;


                salvarMesaAtiva({

                    slot:
                        estado.slot

                });


                logDiagnostico(
                    "📍 Participação localizada",
                    `Slot:${estado.slot ?? "?"}`
                );


                return resultado.data;

            }


            return null;

        } catch (erro) {

            logDiagnostico(
                "⚠️ Erro ao descobrir participação",
                textoErro(erro)
            );


            return null;

        }

    }


    /* =====================================================
       PRESENCE
    ===================================================== */

    async function atualizarPresenca() {

        if (!canal) {
            return;
        }


        try {

            const resultado =
                await canal.track({

                    user_id:
                        estado.usuarioId,

                    usuarioId:
                        estado.usuarioId,

                    character_id:
                        estado.personagemId,

                    personagemId:
                        estado.personagemId,

                    nome:
                        estado.nome,

                    slot:
                        estado.slot,

                    isMaster:
                        estado.isMaster,

                    role:
                        estado.isMaster
                            ? "master"
                            : "player"

                });


            if (
                resultado !== "ok"
            ) {

                logDiagnostico(
                    "⚠️ Presença não confirmada",
                    String(resultado)
                );


                return false;

            }


            logDiagnostico(
                "✅ Presença registrada",
                `Slot:${estado.slot ?? "Mestre"}`
            );


            await atualizarListaJogadores();


            return true;

        } catch (erro) {

            logDiagnostico(
                "⚠️ Erro presença",
                textoErro(erro)
            );


            return false;

        }

    }


    /* =====================================================
       LISTA DE JOGADORES ONLINE
    ===================================================== */

    async function atualizarListaJogadores() {

        if (!canal) {
            return;
        }


        try {

            const estadoPresenca =
                canal.presenceState();


            const jogadores = [];


            Object.keys(
                estadoPresenca
            ).forEach(
                (chave) => {

                    const registros =
                        estadoPresenca[chave];


                    if (
                        !Array.isArray(
                            registros
                        )
                    ) {

                        return;

                    }


                    registros.forEach(
                        (presenca) => {

                            if (
                                presenca
                            ) {

                                jogadores.push(
                                    presenca
                                );

                            }

                        }
                    );

                }
            );


            logDiagnostico(
                `👥 Jogadores online: ${jogadores.length}`
            );


            window.dispatchEvent(

                new CustomEvent(
                    "mesa:multiplayerJogadoresAtualizados",
                    {
                        detail: {

                            jogadores:
                                jogadores,

                            mesaId:
                                estado.mesaId

                        }
                    }
                )

            );


            return jogadores;

        } catch (erro) {

            logDiagnostico(
                "⚠️ Erro ao obter presença",
                textoErro(erro)
            );


            return [];

        }

    }


    /* =====================================================
       PLAYER ENTROU
    ===================================================== */

    function jogadorEntrou(
        payload
    ) {

        logDiagnostico(
            "🟢 Jogador entrou",
            payload?.key ||
            "desconhecido"
        );


        atualizarListaJogadores();

    }


    /* =====================================================
       PLAYER SAIU
    ===================================================== */

    function jogadorSaiu(
        payload
    ) {

        logDiagnostico(
            "🔴 Jogador saiu",
            payload?.key ||
            "desconhecido"
        );


        atualizarListaJogadores();

    }


    /* =====================================================
       BROADCAST
    ===================================================== */

    function configurarBroadcast() {

        if (!canal) {
            return;
        }


        canal.on(

            "broadcast",

            {
                event:
                    "mesa-evento"

            },

            (payload) => {

                const dados =
                    payload?.payload ||
                    payload;


                logDiagnostico(
                    "📨 Evento recebido",
                    dados?.tipo ||
                    "mesa-evento"
                );


                window.dispatchEvent(

                    new CustomEvent(
                        "mesa:multiplayerEvento",
                        {
                            detail:
                                dados
                        }
                    )

                );


                if (
                    dados?.tipo
                ) {

                    window.dispatchEvent(

                        new CustomEvent(
                            `mesa:online:${dados.tipo}`,
                            {
                                detail:
                                    dados
                            }
                        )

                    );

                }

            }

        );

    }


    /* =====================================================
       POSTGRES CHANGES
       
       Mantido para sincronizações futuras.
    ===================================================== */

    function configurarPostgresChanges() {

        if (!canal) {
            return;
        }


        /*
         * CHARACTERS
         */

        canal.on(

            "postgres_changes",

            {

                event:
                    "*",

                schema:
                    "public",

                table:
                    "characters",

                filter:
                    `campaign_id=eq.${estado.campanhaId}`

            },

            (payload) => {

                logDiagnostico(
                    "🧙 Alteração em personagem",
                    payload.eventType
                );


                window.dispatchEvent(

                    new CustomEvent(
                        "mesa:personagemAtualizado",
                        {
                            detail:
                                payload
                        }
                    )

                );


                window.dispatchEvent(

                    new CustomEvent(
                        "mesa:multiplayerAtualizacao",
                        {
                            detail:
                                payload
                        }
                    )

                );

            }

        );


        /*
         * CAMPAIGN MEMBERS
         */

        canal.on(

            "postgres_changes",

            {

                event:
                    "*",

                schema:
                    "public",

                table:
                    "campaign_members",

                filter:
                    `campaign_id=eq.${estado.campanhaId}`

            },

            (payload) => {

                logDiagnostico(
                    "👥 Alteração em membros",
                    payload.eventType
                );


                window.dispatchEvent(

                    new CustomEvent(
                        "mesa:membrosAtualizados",
                        {
                            detail:
                                payload
                        }
                    )

                );


                atualizarListaJogadores();

            }

        );

    }


    /* =====================================================
       CRIAR CANAL REALTIME
       
       IMPORTANTE:
       Agora utiliza mesaId, NÃO campaignId.
    ===================================================== */

    function criarCanal() {

        if (!clienteSupabase) {

            throw new Error(
                "Cliente Supabase não disponível."
            );

        }


        if (!estado.mesaId) {

            throw new Error(
                "Mesa não identificada."
            );

        }


        const nomeCanal =
            `rpg:mesa:${estado.mesaId}`;


        estado.canal =
            nomeCanal;


        logDiagnostico(
            "📡 Criando canal privado",
            nomeCanal
        );


        /*
         * CANAL PRIVADO
         */

        canal =
            clienteSupabase.channel(

                nomeCanal,

                {

                    config: {

                        private:
                            true,

                        presence: {

                            key:
                                estado.usuarioId ||
                                (
                                    typeof crypto !==
                                    "undefined" &&
                                    crypto.randomUUID
                                )
                                    ? crypto.randomUUID()
                                    : String(
                                        Date.now()
                                    )

                        },

                        broadcast: {

                            self:
                                false,

                            ack:
                                true

                        }

                    }

                }

            );


        configurarBroadcast();

        configurarPostgresChanges();


        /* -----------------------------------------------
           PRESENCE — JOIN
        ------------------------------------------------ */

        canal.on(

            "presence",

            {
                event:
                    "join"

            },

            jogadorEntrou

        );


        /* -----------------------------------------------
           PRESENCE — LEAVE
        ------------------------------------------------ */

        canal.on(

            "presence",

            {
                event:
                    "leave"

            },

            jogadorSaiu

        );


        return canal;

    }


    /* =====================================================
       CONECTAR AO SUPABASE REALTIME
    ===================================================== */

    async function conectarSupabaseRealtime() {

        if (
            tentativaConexao
        ) {

            logDiagnostico(
                "⏳ Conexão já está em andamento"
            );


            return;

        }


        if (
            estado.conectado
        ) {

            logDiagnostico(
                "🟢 Já conectado",
                `Mesa:${estado.mesaId}`
            );


            return;

        }


        tentativaConexao =
            true;


        estado.realtimeStatus =
            "CONNECTING";


        atualizarStatusRealtime(
            "🟡 Conectando..."
        );


        try {

            /* -------------------------------------------
               1. DADOS DA MESA
            ------------------------------------------- */

            obterDadosMesa();


            if (
                !estado.campanhaId
            ) {

                throw new Error(
                    "Campanha não identificada."
                );

            }


            if (
                !estado.usuarioId
            ) {

                throw new Error(
                    "Usuário não identificado."
                );

            }


            /* -------------------------------------------
               2. CLIENTE SUPABASE
            ------------------------------------------- */

            clienteSupabase =
                await obterClienteSupabase();


            if (!clienteSupabase) {

                throw new Error(
                    "Supabase indisponível."
                );

            }


            /* -------------------------------------------
               3. SESSÃO
            ------------------------------------------- */

            const session =
                await verificarSessao();


            if (!session) {

                throw new Error(
                    "Nenhuma sessão Supabase ativa."
                );

            }


            /*
             * Garante que o ID utilizado pelo
             * Presence é o mesmo usuário da sessão.
             */

            estado.usuarioId =
                session.user.id;


            /* -------------------------------------------
               4. LOCALIZAR / CRIAR MESA
            ------------------------------------------- */

            const mesa =
                await garantirMesa();


            if (
                !mesa?.id
            ) {

                throw new Error(
                    "Mesa não possui ID válido."
                );

            }


            estado.mesaId =
                mesa.id;


            /* -------------------------------------------
               5. ENTRAR NA MESA
            ------------------------------------------- */

            await entrarNaMesa();


            /* -------------------------------------------
               6. REMOVER CANAL ANTERIOR
            ------------------------------------------- */

            if (canal) {

                try {

                    await clienteSupabase
                        .removeChannel(
                            canal
                        );

                } catch {}

                canal =
                    null;

            }


            /* -------------------------------------------
               7. CRIAR CANAL DA MESA
            ------------------------------------------- */

            criarCanal();


            atualizarStatusRealtime(
                "🟡 Entrando na Mesa..."
            );


            /* -------------------------------------------
               8. SUBSCRIBE
            ------------------------------------------- */

            await new Promise(

                (resolve, reject) => {

                    let finalizado =
                        false;


                    canal.subscribe(

                        (status, erro) => {

                            estado.realtimeStatus =
                                status;


                            logDiagnostico(
                                "📡 Supabase Realtime",
                                status
                            );


                            /*
                             * DISPONIBILIZA O STATUS
                             * PARA O DIAGNÓSTICO.
                             */

                            window.dispatchEvent(

                                new CustomEvent(
                                    "mesa:realtimeStatus",
                                    {
                                        detail: {

                                            status:
                                                status,

                                            erro:
                                                erro,

                                            mesaId:
                                                estado.mesaId,

                                            canal:
                                                estado.canal

                                        }
                                    }
                                )

                            );


                            /* --------------------------------
                               SUBSCRIBED
                            -------------------------------- */

                            if (
                                status ===
                                "SUBSCRIBED"
                            ) {

                                if (
                                    finalizado
                                ) {
                                    return;
                                }


                                finalizado =
                                    true;


                                estado.conectado =
                                    true;


                                campanhaConectada =
                                    estado.campanhaId;


                                mesaConectada =
                                    estado.mesaId;


                                atualizarStatusRealtime(
                                    "🟢 Online"
                                );


                                logDiagnostico(
                                    "🎉 CONECTADO À MESA!",
                                    `Mesa:${estado.mesaId}`
                                );


                                /*
                                 * Registra Presence.
                                 */

                                atualizarPresenca();


                                /*
                                 * Eventos internos.
                                 */

                                window.dispatchEvent(

                                    new CustomEvent(
                                        "mesa:multiplayerConectado",
                                        {
                                            detail: {

                                                estado:
                                                    estado,

                                                mesa:
                                                    mesa

                                            }
                                        }
                                    )

                                );


                                resolve();

                                return;

                            }


                            /* --------------------------------
                               CHANNEL ERROR
                            -------------------------------- */

                            if (
                                status ===
                                "CHANNEL_ERROR"
                            ) {

                                estado.conectado =
                                    false;


                                atualizarStatusRealtime(
                                    "🔴 Erro no canal"
                                );


                                logDiagnostico(
                                    "❌ Erro no canal",
                                    textoErro(
                                        erro
                                    )
                                );


                                if (
                                    !finalizado
                                ) {

                                    finalizado =
                                        true;


                                    reject(

                                        erro ||
                                        new Error(
                                            "CHANNEL_ERROR"
                                        )

                                    );

                                }


                                return;

                            }


                            /* --------------------------------
                               TIMED OUT
                            -------------------------------- */

                            if (
                                status ===
                                "TIMED_OUT"
                            ) {

                                estado.conectado =
                                    false;


                                atualizarStatusRealtime(
                                    "⏱️ Timeout"
                                );


                                logDiagnostico(
                                    "⏱️ Supabase Realtime timeout"
                                );


                                if (
                                    !finalizado
                                ) {

                                    finalizado =
                                        true;


                                    reject(

                                        new Error(
                                            "Realtime timeout"
                                        )

                                    );

                                }


                                return;

                            }


                            /* --------------------------------
                               CLOSED
                            -------------------------------- */

                            if (
                                status ===
                                "CLOSED"
                            ) {

                                estado.conectado =
                                    false;


                                atualizarStatusRealtime(
                                    "⚪ Desconectado"
                                );


                                logDiagnostico(
                                    "⚪ Canal fechado"
                                );

                            }

                        }

                    );

                }

            );


        } catch (erro) {

            estado.conectado =
                false;


            estado.realtimeStatus =
                "CHANNEL_ERROR";


            atualizarStatusRealtime(
                "🔴 Erro"
            );


            logDiagnostico(
                "❌ Erro na conexão",
                textoErro(erro)
            );


            window.dispatchEvent(

                new CustomEvent(
                    "mesa:multiplayerErro",
                    {
                        detail: {

                            erro:
                                erro,

                            mesaId:
                                estado.mesaId

                        }
                    }
                )

            );


        } finally {

            tentativaConexao =
                false;

        }

    }


    /* =====================================================
       ENVIAR EVENTO
    ===================================================== */

    async function enviarEvento(

        tipo,

        dados = {}

    ) {

        if (!canal) {

            logDiagnostico(
                "⚠️ Tentativa de enviar sem canal"
            );


            return false;

        }


        if (!estado.conectado) {

            logDiagnostico(
                "⚠️ Tentativa de enviar offline"
            );


            return false;

        }


        const evento = {

            tipo:
                tipo,

            dados:
                dados,

            user_id:
                estado.usuarioId,

            usuarioId:
                estado.usuarioId,

            character_id:
                estado.personagemId,

            personagemId:
                estado.personagemId,

            mesa_id:
                estado.mesaId,

            mesaId:
                estado.mesaId,

            slot:
                estado.slot,

            nome:
                estado.nome,

            isMaster:
                estado.isMaster,

            timestamp:
                new Date()
                    .toISOString()

        };


        try {

            const resultado =
                await canal.send({

                    type:
                        "broadcast",

                    event:
                        "mesa-evento",

                    payload:
                        evento

                });


            if (
                resultado !==
                "ok"
            ) {

                logDiagnostico(
                    "⚠️ Falha ao enviar evento",
                    String(resultado)
                );


                return false;

            }


            logDiagnostico(
                "📤 Evento enviado",
                tipo
            );


            return true;

        } catch (erro) {

            logDiagnostico(
                "❌ Erro ao enviar evento",
                textoErro(erro)
            );


            return false;

        }

    }


    /* =====================================================
       SINCRONIZAÇÃO
    ===================================================== */

    async function sincronizar() {

        if (!canal) {

            logDiagnostico(
                "⚠️ Não existe canal para sincronizar"
            );


            return false;

        }


        if (!estado.conectado) {

            logDiagnostico(
                "⚠️ Mesa offline"
            );


            return false;

        }


        try {

            await atualizarPresenca();

            await atualizarListaJogadores();


            await enviarEvento(

                "solicitar-sincronizacao",

                {

                    solicitante:
                        estado.usuarioId,

                    mesaId:
                        estado.mesaId

                }

            );


            logDiagnostico(
                "🔄 Sincronização solicitada"
            );


            window.dispatchEvent(

                new CustomEvent(
                    "mesa:sincronizada",
                    {
                        detail: {

                            estado:
                                estado

                        }
                    }
                )

            );


            return true;

        } catch (erro) {

            logDiagnostico(
                "❌ Erro sincronização",
                textoErro(erro)
            );


            return false;

        }

    }


    /* =====================================================
       DESCONECTAR
    ===================================================== */

    async function desconectarSupabase() {

        try {

            if (canal) {

                try {

                    await canal.untrack();

                } catch {}


                if (
                    clienteSupabase
                ) {

                    try {

                        await clienteSupabase
                            .removeChannel(
                                canal
                            );

                    } catch {}

                }

            }

        } catch (erro) {

            console.warn(
                "[MESA-ONLINE] Erro ao desconectar:",
                erro
            );

        }


        canal =
            null;


        estado.conectado =
            false;


        estado.canal =
            null;


        estado.realtimeStatus =
            "CLOSED";


        campanhaConectada =
            null;


        mesaConectada =
            null;


        atualizarStatusRealtime(
            "⚪ Desconectado"
        );


        logDiagnostico(
            "⚪ Multiplayer desconectado"
        );


        window.dispatchEvent(

            new CustomEvent(
                "mesa:multiplayerDesconectado"
            )

        );

    }


    /* =====================================================
       MUDANÇA DE CAMPANHA
    ===================================================== */

    window.addEventListener(

        "mesa:campanhaAlterada",

        async () => {

            logDiagnostico(
                "🔄 Campanha alterada"
            );


            await desconectarSupabase();


            obterDadosMesa();


            await conectarSupabaseRealtime();

        }

    );


    /* =====================================================
       VISIBILIDADE
    ===================================================== */

    document.addEventListener(

        "visibilitychange",

        async () => {

            if (
                document.visibilityState !==
                "visible"
            ) {

                return;

            }


            if (
                !estado.conectado &&
                !tentativaConexao
            ) {

                logDiagnostico(
                    "🔄 Página voltou ao primeiro plano — reconectando"
                );


                await conectarSupabaseRealtime();


                return;

            }


            if (
                estado.conectado
            ) {

                await atualizarPresenca();

            }

        }

    );


    /* =====================================================
       ANTES DE SAIR
    ===================================================== */

    window.addEventListener(

        "beforeunload",

        () => {

            try {

                if (
                    canal
                ) {

                    canal.untrack();

                }

            } catch {}

        }

    );


    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.mesaOnline = {

        conectar:
            conectarSupabaseRealtime,

        desconectar:
            desconectarSupabase,

        sincronizar:
            sincronizar,

        enviar:
            enviarEvento,

        obterDados:
            obterDadosMesa,

        localizarMesa:
            localizarMesa,

        garantirMesa:
            garantirMesa,

        entrarNaMesa:
            entrarNaMesa,

        obterCanal:
            () => canal,

        obterCliente:
            () => clienteSupabase,

        estado:
            estado

    };


    /* =====================================================
       COMPATIBILIDADE
       
       Permite:

       window.mesaOnline.canal

       window.mesaOnline.cliente
    ===================================================== */

    Object.defineProperty(

        window.mesaOnline,

        "canal",

        {

            configurable:
                true,

            enumerable:
                true,

            get() {

                return canal;

            }

        }

    );


    Object.defineProperty(

        window.mesaOnline,

        "cliente",

        {

            configurable:
                true,

            enumerable:
                true,

            get() {

                return clienteSupabase;

            }

        }

    );


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    async function iniciar() {

        logDiagnostico(
            "================================"
        );


        logDiagnostico(
            "MESA ONLINE — SUPABASE REALTIME"
        );


        logDiagnostico(
            "=== SCRIPT CARREGADO ==="
        );


        logDiagnostico(
            "Ably: DESATIVADA"
        );


        logDiagnostico(
            "Realtime: SUPABASE"
        );


        logDiagnostico(
            "Arquitetura: CAMPANHA → MESA → JOGADORES → REALTIME"
        );


        await conectarSupabaseRealtime();

    }


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(

            "DOMContentLoaded",

            iniciar,

            {
                once:
                    true
            }

        );

    } else {

        iniciar();

    }


})();
