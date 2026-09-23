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

   MESTRE:
     public.campaigns.master_id
     ↓
     auth.users.id
     ↓
     comparação oficial no banco
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

                /*
                 * IMPORTANTE:
                 * isMaster continua sendo salvo apenas
                 * como informação de estado/cache.
                 *
                 * Ele NÃO é utilizado para decidir
                 * quem é Mestre.
                 */

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


        /*
         * ------------------------------------------------
         * MESTRE
         * ------------------------------------------------
         *
         * NÃO confiamos aqui em:
         *
         * auth.isMaster
         * salvo.isMaster
         *
         * A decisão oficial será feita por:
         *
         * public.campaigns.master_id
         *
         * através da função:
         *
         * confirmarMestrePeloBanco()
         *
         * Por segurança, começamos como false.
         */

        estado.isMaster = false;


        logDiagnostico(

            "Dados carregados",

            `Campanha:${estado.campanhaId || "?"} ` +
            `Mesa:${estado.mesaId || "?"} ` +
            `Usuário:${estado.usuarioId || "?"} ` +
            `Personagem:${estado.personagemId || "?"} ` +
            `Slot:${estado.slot ?? "auto"} ` +
            `Mestre:Aguardando banco`

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
       CONFIRMAR MESTRE PELO BANCO
       
       FONTE OFICIAL:

       public.campaigns.master_id

       A comparação é feita entre:

       campaigns.master_id
                 ↓
       session.user.id

       IMPORTANTE:
       localStorage.isMaster e auth.isMaster
       NÃO podem promover um usuário a Mestre.
    ===================================================== */

    async function confirmarMestrePeloBanco() {

        /*
         * Começa sempre como false.
         *
         * Somente o banco pode alterar para true.
         */

        estado.isMaster = false;


        if (!clienteSupabase) {

            logDiagnostico(
                "❌ Não foi possível confirmar Mestre",
                "Cliente Supabase indisponível"
            );


            return false;

        }


        if (!estado.campanhaId) {

            logDiagnostico(
                "❌ Não foi possível confirmar Mestre",
                "Campanha não identificada"
            );


            return false;

        }


        if (!estado.usuarioId) {

            logDiagnostico(
                "❌ Não foi possível confirmar Mestre",
                "Usuário não identificado"
            );


            return false;

        }


        try {

            logDiagnostico(
                "👑 Verificando Mestre no banco",
                `Campanha:${estado.campanhaId}`
            );


            const resultado =
                await clienteSupabase
                    .from("campaigns")
                    .select(
                        "id,master_id"
                    )
                    .eq(
                        "id",
                        estado.campanhaId
                    )
                    .maybeSingle();


            if (
                resultado.error
            ) {

                logDiagnostico(
                    "❌ Erro ao consultar Mestre",
                    textoErro(
                        resultado.error
                    )
                );


                estado.isMaster =
                    false;


                return false;

            }


            const campanha =
                resultado.data;


            if (!campanha) {

                logDiagnostico(
                    "⚠️ Campanha não encontrada no banco"
                );


                estado.isMaster =
                    false;


                return false;

            }


            if (
                !campanha.master_id
            ) {

                logDiagnostico(
                    "⚠️ A campanha ainda não possui Mestre definido"
                );


                estado.isMaster =
                    false;


                return false;

            }


            /*
             * COMPARAÇÃO OFICIAL
             */

            estado.isMaster =

                String(
                    campanha.master_id
                ) ===
                String(
                    estado.usuarioId
                );


            if (
                estado.isMaster
            ) {

                logDiagnostico(
                    "👑 MESTRE CONFIRMADO PELO BANCO",
                    `Master:${campanha.master_id}`
                );

            } else {

                logDiagnostico(
                    "🎮 JOGADOR CONFIRMADO PELO BANCO",
                    `Master:${campanha.master_id}`
                );

            }


            /*
             * Atualiza o cache apenas depois
             * de consultar o banco.
             */

            salvarMesaAtiva({

                isMaster:
                    estado.isMaster

            });


            /*
             * Mantém a campanha disponível para
             * outras partes do sistema.
             */

            if (
                window.rpgAuth
            ) {

                window.rpgAuth.isMaster =
                    estado.isMaster;

            }


            return estado.isMaster;

        } catch (erro) {

            estado.isMaster =
                false;


            logDiagnostico(
                "❌ Erro ao confirmar Mestre",
                textoErro(erro)
            );


            return false;

        }

    }


    /* =====================================================
       MESA ATIVA — LOCALIZAR MESA
       
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

        if (!can
