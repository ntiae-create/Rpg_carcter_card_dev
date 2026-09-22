/* =========================================================
   MESA ONLINE — SUPABASE REALTIME | VERSÃO COMPLETA
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ESTADO
    ===================================================== */

    let clienteSupabase = null;

    let canal = null;

    let tentativaConexao = false;

    let campanhaConectada = null;


    const estado = {

        conectado: false,

        campanhaId: null,

        usuarioId: null,

        personagemId: null,

        slot: null,

        nome: null,

        isMaster: false,

        canal: null

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


        /*
         * Remove mensagem vazia inicial.
         */

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
       STATUS DO REALTIME
    ===================================================== */

    function atualizarStatusRealtime(
        texto
    ) {

        const el =
            document.querySelector(
                '[data-diagnostico="realtime"]'
            );


        if (!el) {
            return;
        }


        el.textContent = texto;

    }


    /* =====================================================
       MESA ATIVA
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
       DADOS DA MESA
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


        estado.campanhaId =

            salvo.campaignId ||
            salvo.campaign_id ||
            campanha.id ||
            window.rpgCampaign
                ?.activeCampaign
                ?.id ||
            null;


        estado.usuarioId =

            salvo.userId ||
            usuario.id ||
            null;


        estado.personagemId =

            salvo.characterId ||
            jogador.id ||
            null;


        estado.slot =

            salvo.slot ||
            auth.campaignSlot ||
            jogador.slot ||
            null;


        estado.nome =

            jogador.name ||
            jogador.nome ||
            salvo.characterName ||
            usuario.email
                ?.split("@")[0] ||
            "Jogador";


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
            `Campanha:${estado.campanhaId} Usuário:${estado.usuarioId} Slot:${estado.slot}`
        );


        return estado;

    }


    /* =====================================================
       CLIENTE SUPABASE
    ===================================================== */

    async function obterClienteSupabase() {


        /*
         * Primeiro tenta o cliente oficial
         * usado pelo projeto.
         */

        if (
            window.SupabaseMesa?.obterCliente
        ) {

            const cli =
                window.SupabaseMesa
                    .obterCliente();


            if (cli) {

                logDiagnostico(
                    "✅ Cliente via SupabaseMesa"
                );


                return cli;

            }

        }


        /*
         * Cliente principal do projeto.
         */

        if (
            window.supabaseClient
        ) {

            if (
                window.supabaseClient.auth
            ) {

                logDiagnostico(
                    "✅ Cliente via window.supabaseClient"
                );


                return window.supabaseClient;

            }

        }


        /*
         * Compatibilidade.
         */

        if (
            window.supabase?.auth
        ) {

            logDiagnostico(
                "✅ Cliente via window.supabase"
            );


            return window.supabase;

        }


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
                "✅ Sessão Supabase confirmada"
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
       PRESENÇA
    ===================================================== */

    async function atualizarPresenca() {

        if (!canal) {
            return;
        }


        try {

            const resultado =
                await canal.track({

                    usuarioId:
                        estado.usuarioId,

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


            if (resultado !== "ok") {

                logDiagnostico(
                    "⚠️ Presença não confirmada",
                    String(resultado)
                );


                return;

            }


            logDiagnostico(
                "✅ Presença registrada"
            );


            await atualizarListaJogadores();


        } catch (erro) {

            logDiagnostico(
                "⚠️ Erro presença",
                textoErro(erro)
            );

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
            ).forEach((chave) => {

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

            });


            logDiagnostico(
                `👥 Jogadores online: ${jogadores.length}`
            );


            window.dispatchEvent(

                new CustomEvent(
                    "mesa:multiplayerJogadoresAtualizados",
                    {
                        detail: {
                            jogadores:
                                jogadores
                        }
                    }
                )

            );


        } catch (erro) {

            logDiagnostico(
                "⚠️ Erro ao obter presença",
                textoErro(erro)
            );

        }

    }


    /* =====================================================
       EVENTO — PLAYER ENTROU
    ===================================================== */

    function jogadorEntrou(
        payload
    ) {

        logDiagnostico(
            "🟢 Jogador entrou",
            payload?.key || "desconhecido"
        );


        atualizarListaJogadores();

    }


    /* =====================================================
       EVENTO — PLAYER SAIU
    ===================================================== */

    function jogadorSaiu(
        payload
    ) {

        logDiagnostico(
            "🔴 Jogador saiu",
            payload?.key || "desconhecido"
        );


        atualizarListaJogadores();

    }


    /* =====================================================
       BROADCAST
       
       Comunicação instantânea entre os participantes.

       Exemplos:
       - ações do Mestre
       - atualização da tela
       - combate
       - mapa
       - Boss
       - Dungeon
       - CTE
       - eventos
    ===================================================== */

    function configurarBroadcast() {

        if (!canal) {
            return;
        }


        canal.on(

            "broadcast",

            {
                event: "mesa-evento"

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
                            detail: dados
                        }
                    )

                );


                /*
                 * Compatibilidade com sistemas
                 * que eventualmente escutem
                 * diretamente pelo nome do evento.
                 */

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
       
       Permite receber alterações reais das tabelas
       Supabase quando o Realtime estiver habilitado.

       O sistema fica preparado para:
       - characters
       - campaign_members
       - campanhas
       - outras tabelas futuras
    ===================================================== */

    function configurarPostgresChanges() {

        if (!canal) {
            return;
        }


        /*
         * PERSONAGENS
         */

        canal.on(

            "postgres_changes",

            {
                event: "*",

                schema: "public",

                table: "characters",

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
         * MEMBROS DA CAMPANHA
         */

        canal.on(

            "postgres_changes",

            {
                event: "*",

                schema: "public",

                table: "campaign_members",

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
       CRIAR CANAL
    ===================================================== */

    function criarCanal() {

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


        const nomeCanal =
            `rpg:mesa:${estado.campanhaId}`;


        estado.canal =
            nomeCanal;


        logDiagnostico(
            "📡 Criando canal",
            nomeCanal
        );


        canal =
            clienteSupabase.channel(
                nomeCanal,
                {

                    config: {

                        presence: {

                            key:
                                estado.usuarioId ||
                                crypto.randomUUID()

                        },

                        broadcast: {

                            self: false,

                            ack: true

                        }

                    }

                }

            );


        configurarBroadcast();

        configurarPostgresChanges();


        /*
         * PRESENCE — ENTRADA
         */

        canal.on(

            "presence",

            {
                event: "join"

            },

            jogadorEntrou

        );


        /*
         * PRESENCE — SAÍDA
         */

        canal.on(

            "presence",

            {
                event: "leave"

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

            return;

        }


        if (
            estado.conectado
        ) {

            return;

        }


        tentativaConexao = true;


        atualizarStatusRealtime(
            "Conectando..."
        );


        try {

            /*
             * Dados da campanha.
             */

            obterDadosMesa();


            if (
                !estado.campanhaId
            ) {

                atualizarStatusRealtime(
                    "Sem campanha"
                );


                logDiagnostico(
                    "❌ Campanha não identificada"
                );


                return;

            }


            /*
             * Usuário.
             */

            if (
                !estado.usuarioId
            ) {

                atualizarStatusRealtime(
                    "Sem usuário"
                );


                logDiagnostico(
                    "❌ Usuário não identificado"
                );


                return;

            }


            /*
             * Cliente.
             */

            clienteSupabase =
                await obterClienteSupabase();


            if (!clienteSupabase) {

                atualizarStatusRealtime(
                    "Supabase indisponível"
                );


                return;

            }


            /*
             * Sessão.
             */

            const session =
                await verificarSessao();


            if (!session) {

                atualizarStatusRealtime(
                    "Sem sessão"
                );


                return;

            }


            /*
             * Evita duplicar canal.
             */

            if (canal) {

                try {

                    await clienteSupabase
                        .removeChannel(
                            canal
                        );

                } catch {}

                canal = null;

            }


            /*
             * Cria canal.
             */

            criarCanal();


            atualizarStatusRealtime(
                "Entrando..."
            );


            /*
             * Inscrição.
             */

            await new Promise(
                (resolve, reject) => {

                    canal.subscribe(
                        (status, erro) => {

                            logDiagnostico(
                                "📡 Supabase Realtime",
                                status
                            );


                            /*
                             * SUBSCRIBED
                             */

                            if (
                                status ===
                                "SUBSCRIBED"
                            ) {

                                estado.conectado =
                                    true;


                                campanhaConectada =
                                    estado.campanhaId;


                                atualizarStatusRealtime(
                                    "🟢 Online"
                                );


                                logDiagnostico(
                                    "🎉 CONECTADO AO MULTIPLAYER!"
                                );


                                atualizarPresenca();


                                window.dispatchEvent(

                                    new CustomEvent(
                                        "mesa:multiplayerConectado",
                                        {
                                            detail:
                                                {
                                                    estado:
                                                        estado
                                                }
                                        }
                                    )

                                );


                                resolve();

                                return;

                            }


                            /*
                             * CHANNEL ERROR
                             */

                            if (
                                status ===
                                "CHANNEL_ERROR"
                            ) {

                                estado.conectado =
                                    false;


                                atualizarStatusRealtime(
                                    "🔴 Erro"
                                );


                                logDiagnostico(
                                    "❌ Erro no canal",
                                    textoErro(
                                        erro
                                    )
                                );


                                reject(
                                    erro ||
                                    new Error(
                                        "CHANNEL_ERROR"
                                    )
                                );


                                return;

                            }


                            /*
                             * TIMED OUT
                             */

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


                                reject(
                                    new Error(
                                        "Realtime timeout"
                                    )
                                );


                                return;

                            }


                            /*
                             * CLOSED
                             */

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


            atualizarStatusRealtime(
                "🔴 Erro"
            );


            logDiagnostico(
                "❌ Erro conexão",
                textoErro(erro)
            );


        } finally {

            tentativaConexao =
                false;

        }

    }


    /* =====================================================
       ENVIAR EVENTO PARA A MESA
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

            tipo: tipo,

            dados: dados,

            usuarioId:
                estado.usuarioId,

            personagemId:
                estado.personagemId,

            slot:
                estado.slot,

            nome:
                estado.nome,

            isMaster:
                estado.isMaster,

            timestamp:
                Date.now()

        };


        try {

            const resultado =
                await canal.send({

                    type: "broadcast",

                    event: "mesa-evento",

                    payload:
                        evento

                });


            if (
                resultado !== "ok"
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
       SINCRONIZAÇÃO MANUAL
    ===================================================== */

    async function sincronizar() {

        if (!canal) {

            logDiagnostico(
                "⚠️ Não existe canal para sincronizar"
            );


            return false;

        }


        try {

            await atualizarPresenca();

            await atualizarListaJogadores();


            /*
             * Solicita aos demais participantes
             * que enviem seu estado atual.
             */

            await enviarEvento(
                "solicitar-sincronizacao",
                {

                    solicitante:
                        estado.usuarioId

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

            if (
                canal &&
                estado.conectado
            ) {

                try {

                    await canal.untrack();

                } catch {}


                await clienteSupabase
                    ?.removeChannel(
                        canal
                    );

            }

        } catch (erro) {

            console.warn(
                "[MESA-ONLINE] Erro ao desconectar:",
                erro
            );

        }


        canal = null;

        estado.conectado =
            false;

        estado.canal =
            null;


        campanhaConectada =
            null;


        atualizarStatusRealtime(
            "Desconectado"
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
       VISIBILIDADE DA PÁGINA
       
       Quando o usuário volta para a Mesa,
       verificamos o estado da conexão.
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
                !estado.conectado
            ) {

                logDiagnostico(
                    "🔄 Página voltou ao primeiro plano — reconectando"
                );


                await conectarSupabaseRealtime();


                return;

            }


            await atualizarPresenca();

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
       
       Mantemos os mesmos nomes básicos que o restante
       do projeto pode estar utilizando.
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

        estado:
            estado,

        canal:
            () => canal,

        cliente:
            () => clienteSupabase

    };


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


        await conectarSupabaseRealtime();

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar,
            {
                once: true
            }
        );

    } else {

        iniciar();

    }


})();
