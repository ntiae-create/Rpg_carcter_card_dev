/* =========================================================
   MESA RPG — ENTRADA NA CAMPANHA
   =========================================================

   FLUXO:

   PERSONAGEM CONFIRMADO
          ↓
      CÓDIGO DA MESA
          ↓
      VALIDAR CAMPANHA
          ↓
      ┌───────────────┐
      │ É o Mestre?   │
      └───────┬───────┘
          SIM │ NÃO
              │
              ├───────────────┐
              ↓               ↓
           MESTRE          JOGADOR
                              ↓
                       PERSONAGEM
                         CONFIRMADO
                              ↓
                           SLOT
                              ↓
                     CAMPANHA ATIVA
                              ↓
                         mesa.html

   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

    const MAX_JOGADORES = 8;

    const STORAGE_KEY = "rpg_mesa_ativa";


    /* =====================================================
       ESTADO
    ===================================================== */

    let elementos = {};

    let processandoEntrada = false;


    /* =====================================================
       SUPABASE
    ===================================================== */

    function obterSupabase() {

        return (
            window.supabaseClient ||
            window.supabase ||
            null
        );

    }


    /* =====================================================
       USUÁRIO
    ===================================================== */

    function obterUsuario() {

        return window.rpgAuth?.user || null;

    }


    /* =====================================================
       NORMALIZAÇÃO DO CÓDIGO
    ===================================================== */

    function normalizarCodigo(codigo) {

        return String(codigo || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

    }


    /* =====================================================
       MENSAGEM
    ===================================================== */

    function mostrarMensagem(texto, tipo = "info") {

        const elemento =
            elementos.mensagem ||
            document.getElementById(
                "campaign-join-message"
            );

        if (!elemento) {
            return;
        }

        elemento.textContent = texto;

        elemento.dataset.type = tipo;

        elemento.style.display = texto
            ? "block"
            : "none";

    }


    /* =====================================================
       ESTADO DOS BOTÕES
    ===================================================== */

    function definirProcessando(valor) {

        processandoEntrada = Boolean(valor);

        const botao =
            elementos.entrar ||
            document.getElementById(
                "join-campaign-button"
            );

        const input =
            elementos.codigo ||
            document.getElementById(
                "campaign-code-input"
            );

        if (botao) {

            botao.disabled =
                processandoEntrada;

            botao.textContent =
                processandoEntrada
                    ? "⏳ ENTRANDO..."
                    : "⚔️ ENTRAR";

        }

        if (input) {

            input.disabled =
                processandoEntrada;

        }

    }


    /* =====================================================
       PERSONAGEM CONFIRMADO
    ===================================================== */

    function personagemEstaConfirmado(personagem) {

        if (!personagem) {
            return false;
        }

        const nome =
            personagem.nome ??
            personagem.name;

        const raca =
            personagem.raca ??
            personagem.race;

        const classe =
            personagem.classe ??
            personagem.class;

        return Boolean(
            String(nome || "").trim() &&
            String(raca || "").trim() &&
            String(classe || "").trim()
        );

    }


    /* =====================================================
       BUSCAR CAMPANHA POR CÓDIGO
    ===================================================== */

    async function buscarCampanha(codigo) {

        const codigoNormalizado =
            normalizarCodigo(codigo);

        if (!codigoNormalizado) {
            return null;
        }


        /* -------------------------------------------------
           PRIMEIRO: campaign.js
        ------------------------------------------------- */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.buscarCampanhaPorCodigo ===
                "function"
        ) {

            try {

                const campanha =
                    await window.rpgCampaign
                        .buscarCampanhaPorCodigo(
                            codigoNormalizado
                        );

                if (campanha) {
                    return campanha;
                }

            } catch (erro) {

                console.warn(
                    "Falha ao buscar campanha via campaign.js:",
                    erro
                );

            }

        }


        /* -------------------------------------------------
           FALLBACK DIRETO NO SUPABASE
        ------------------------------------------------- */

        const supabase =
            obterSupabase();

        if (!supabase) {
            throw new Error(
                "Supabase não está disponível."
            );
        }


        const { data, error } =
            await supabase
                .from("campaigns")
                .select("*")
                .eq(
                    "codigo_mesa",
                    codigoNormalizado
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data || null;

    }


    /* =====================================================
       PERSONAGEM DO USUÁRIO
       ===================================================== */

    async function encontrarPersonagem(campanha) {

        const usuario =
            obterUsuario();

        const supabase =
            obterSupabase();

        if (!usuario || !supabase) {
            return null;
        }


        /* -------------------------------------------------
           1. PERSONAGEM JÁ VINCULADO À CAMPANHA
        ------------------------------------------------- */

        const { data: personagensCampanha, error: erroCampanha } =
            await supabase
                .from("characters")
                .select("*")
                .eq(
                    "user_id",
                    usuario.id
                )
                .eq(
                    "campaign_id",
                    campanha.id
                )
                .limit(20);


        if (erroCampanha) {
            console.warn(
                "Erro buscando personagem da campanha:",
                erroCampanha
            );
        }


        if (
            personagensCampanha &&
            personagensCampanha.length
        ) {

            const confirmado =
                personagensCampanha.find(
                    personagemEstaConfirmado
                );

            if (confirmado) {
                return confirmado;
            }

        }


        /* -------------------------------------------------
           2. PERSONAGEM INDEPENDENTE
        ------------------------------------------------- */

        const { data: personagensIndependentes, error: erroIndependente } =
            await supabase
                .from("characters")
                .select("*")
                .eq(
                    "user_id",
                    usuario.id
                )
                .is(
                    "campaign_id",
                    null
                )
                .limit(20);


        if (erroIndependente) {
            console.warn(
                "Erro buscando personagem independente:",
                erroIndependente
            );
        }


        if (
            personagensIndependentes &&
            personagensIndependentes.length
        ) {

            const confirmado =
                personagensIndependentes.find(
                    personagemEstaConfirmado
                );

            if (confirmado) {
                return confirmado;
            }

        }


        /* -------------------------------------------------
           3. FALLBACK PARA rpgAuth
        ------------------------------------------------- */

        const personagemAuth =
            window.rpgAuth?.currentCharacter ||
            window.rpgAuth?.campaignCharacter ||
            null;


        if (
            personagemAuth &&
            personagemEstaConfirmado(
                personagemAuth
            )
        ) {

            return personagemAuth;

        }


        return null;

    }


    /* =====================================================
       VERIFICAR MEMBRO
       ===================================================== */

    async function usuarioJaEhMembro(campanhaId, usuarioId) {

        const supabase =
            obterSupabase();

        if (!supabase) {
            throw new Error(
                "Supabase não está disponível."
            );
        }


        const { data, error } =
            await supabase
                .from("campaign_members")
                .select("id, user_id, role")
                .eq(
                    "campaign_id",
                    campanhaId
                )
                .eq(
                    "user_id",
                    usuarioId
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        return data || null;

    }


    /* =====================================================
       ADICIONAR MEMBRO
       ===================================================== */

    async function adicionarMembro(
        campanhaId,
        usuarioId
    ) {

        const existente =
            await usuarioJaEhMembro(
                campanhaId,
                usuarioId
            );


        if (existente) {
            return existente;
        }


        const supabase =
            obterSupabase();


        const { data, error } =
            await supabase
                .from("campaign_members")
                .insert({
                    campaign_id: campanhaId,
                    user_id: usuarioId,
                    role: "player"
                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        return data;

    }


    /* =====================================================
       SLOTS OCUPADOS
       ===================================================== */

    async function obterSlotsOcupados(campanhaId) {

        const supabase =
            obterSupabase();


        const slots = new Set();


        /* -------------------------------------------------
           PERSONAGENS
        ------------------------------------------------- */

        const { data: personagens, error: erroPersonagens } =
            await supabase
                .from("characters")
                .select("slot")
                .eq(
                    "campaign_id",
                    campanhaId
                );


        if (
            !erroPersonagens &&
            personagens
        ) {

            personagens.forEach(
                personagem => {

                    const slot =
                        Number(
                            personagem.slot
                        );

                    if (
                        Number.isInteger(slot) &&
                        slot >= 1 &&
                        slot <= MAX_JOGADORES
                    ) {

                        slots.add(slot);

                    }

                }
            );

        }


        /* -------------------------------------------------
           MEMBROS
           -------------------------------------------------

           Alguns projetos podem não ter slot em
           campaign_members. Por isso tratamos como
           complemento, sem exigir essa coluna.
        ------------------------------------------------- */

        try {

            const { data: membros } =
                await supabase
                    .from("campaign_members")
                    .select("slot")
                    .eq(
                        "campaign_id",
                        campanhaId
                    );


            if (membros) {

                membros.forEach(
                    membro => {

                        const slot =
                            Number(
                                membro.slot
                            );

                        if (
                            Number.isInteger(slot) &&
                            slot >= 1 &&
                            slot <= MAX_JOGADORES
                        ) {

                            slots.add(slot);

                        }

                    }
                );

            }

        } catch (erro) {

            console.warn(
                "Não foi possível consultar slot dos membros:",
                erro
            );

        }


        return slots;

    }


    /* =====================================================
       ENCONTRAR PRIMEIRO SLOT
       ===================================================== */

    async function encontrarPrimeiroSlot(
        campanhaId
    ) {

        const ocupados =
            await obterSlotsOcupados(
                campanhaId
            );


        for (
            let slot = 1;
            slot <= MAX_JOGADORES;
            slot++
        ) {

            if (!ocupados.has(slot)) {
                return slot;
            }

        }


        return null;

    }


    /* =====================================================
       SLOT DO PERSONAGEM
       ===================================================== */

    function obterSlotPersonagem(personagem) {

        if (!personagem) {
            return null;
        }


        const slot =
            Number(
                personagem.slot
            );


        if (
            Number.isInteger(slot) &&
            slot >= 1 &&
            slot <= MAX_JOGADORES
        ) {

            return slot;

        }


        return null;

    }


    /* =====================================================
       ASSOCIAR PERSONAGEM À CAMPANHA
       ===================================================== */

    async function associarPersonagem(
        personagem,
        campanha,
        slot
    ) {

        const supabase =
            obterSupabase();


        if (!personagem?.id) {

            throw new Error(
                "Personagem inválido."
            );

        }


        const atualizacao = {
            campaign_id: campanha.id,
            slot: slot
        };


        const { data, error } =
            await supabase
                .from("characters")
                .update(atualizacao)
                .eq(
                    "id",
                    personagem.id
                )
                .select()
                .single();


        if (error) {
            throw error;
        }


        return data;

    }


    /* =====================================================
       SALVAR MESA ATIVA
       ===================================================== */

    function salvarMesaAtiva(
        campanha,
        personagem = null,
        slot = null
    ) {

        const usuario =
            obterUsuario();


        if (!campanha?.id) {
            return;
        }


        const dados = {

            campaignId:
                campanha.id,

            campaign_id:
                campanha.id,

            campaignCode:
                campanha.codigo_mesa ||
                campanha.codigoMesa ||
                "",

            campaignName:
                campanha.nome ||
                campanha.name ||
                "Campanha",

            masterId:
                campanha.master_id ||
                campanha.masterId ||
                null,

            userId:
                usuario?.id ||
                null,

            characterId:
                personagem?.id ||
                null,

            slot:
                slot ||
                null,

            savedAt:
                Date.now()

        };


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(dados)
        );

    }


    /* =====================================================
       OBTER MESA ATIVA LOCAL
       ===================================================== */

    function obterMesaAtivaLocal() {

        try {

            const salvo =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!salvo) {
                return null;
            }


            return JSON.parse(
                salvo
            );

        } catch (erro) {

            console.warn(
                "Mesa ativa local inválida:",
                erro
            );

            return null;

        }

    }


    /* =====================================================
       LIMPAR MESA ATIVA
       ===================================================== */

    function limparMesaAtivaLocal() {

        localStorage.removeItem(
            STORAGE_KEY
        );

    }


    /* =====================================================
       ATUALIZAR AUTENTICAÇÃO
       ===================================================== */

    async function atualizarAuth(
        campanha,
        ehMestre,
        personagem = null,
        slot = null
    ) {

        if (!window.rpgAuth) {
            return;
        }


        /* -------------------------------------------------
           PRIMEIRO: sincronização oficial
        ------------------------------------------------- */

        if (
            typeof window.sincronizarCampanhaAuth ===
            "function"
        ) {

            try {

                await window.sincronizarCampanhaAuth(
                    campanha
                );

            } catch (erro) {

                console.warn(
                    "Falha na sincronização oficial da autenticação:",
                    erro
                );

            }

        }


        /* -------------------------------------------------
           GARANTIA LOCAL DO CONTEXTO
        ------------------------------------------------- */

        window.rpgAuth.campaign =
            campanha;


        window.rpgAuth.isMaster =
            Boolean(ehMestre);


        if (personagem) {

            window.rpgAuth.campaignCharacter =
                personagem;

            window.rpgAuth.currentCharacter =
                personagem;

        }


        if (
            slot !== null &&
            slot !== undefined
        ) {

            window.rpgAuth.campaignSlot =
                slot;

        }


        /* -------------------------------------------------
           CAMPANHA GLOBAL
        ------------------------------------------------- */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.definirCampanhaAtiva ===
            "function"
        ) {

            try {

                await window.rpgCampaign
                    .definirCampanhaAtiva(
                        campanha
                    );

            } catch (erro) {

                console.warn(
                    "Falha ao definir campanha ativa:",
                    erro
                );

            }

        }


        /* -------------------------------------------------
           GARANTIA FINAL DO MESTRE
        ------------------------------------------------- */

        const usuario =
            obterUsuario();


        const masterId =
            campanha.master_id ||
            campanha.masterId ||
            null;


        if (
            usuario?.id &&
            masterId
        ) {

            window.rpgAuth.isMaster =
                String(usuario.id) ===
                String(masterId);

        }

    }


    /* =====================================================
       REDIRECIONAR PARA A MESA
       ===================================================== */

    function entrarNaMesa() {

        /*
         * Pequeno atraso para permitir que:
         *
         * - localStorage seja gravado;
         * - eventos de campanha sejam disparados;
         * - rpgAuth seja atualizado.
         */

        setTimeout(
            function () {

                window.location.href =
                    "mesa.html";

            },
            100
        );

    }


    /* =====================================================
       ENTRAR POR CÓDIGO
       ===================================================== */

    async function entrarPorCodigo() {

        if (processandoEntrada) {
            return;
        }


        const usuario =
            obterUsuario();


        if (!usuario?.id) {

            mostrarMensagem(
                "Você precisa estar conectado.",
                "error"
            );

            return;

        }


        const codigo =
            normalizarCodigo(
                elementos.codigo?.value
            );


        if (!codigo) {

            mostrarMensagem(
                "Digite o código da mesa.",
                "error"
            );

            elementos.codigo?.focus();

            return;

        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            mostrarMensagem(
                "Conexão com o servidor não encontrada.",
                "error"
            );

            return;

        }


        definirProcessando(true);

        mostrarMensagem(
            "Verificando a mesa...",
            "info"
        );


        try {

            /* =============================================
               1. BUSCAR CAMPANHA
            ============================================= */

            const campanha =
                await buscarCampanha(
                    codigo
                );


            if (!campanha) {

                throw new Error(
                    "Nenhuma mesa foi encontrada com esse código."
                );

            }


            /* =============================================
               2. IDENTIFICAR MESTRE
            ============================================= */

            const masterId =
                campanha.master_id ||
                campanha.masterId ||
                null;


            const ehMestre =
                Boolean(
                    masterId &&
                    String(masterId) ===
                    String(usuario.id)
                );


            /* =============================================
               3. MESTRE
            ============================================= */

            if (ehMestre) {

                salvarMesaAtiva(
                    campanha,
                    null,
                    null
                );


                await atualizarAuth(
                    campanha,
                    true,
                    null,
                    null
                );


                mostrarMensagem(
                    "Mesa encontrada. Entrando como Mestre...",
                    "success"
                );


                entrarNaMesa();

                return;

            }


            /* =============================================
               4. JOGADOR — ENCONTRAR PERSONAGEM
            ============================================= */

            const personagem =
                await encontrarPersonagem(
                    campanha
                );


            if (!personagem) {

                throw new Error(
                    "Você precisa ter um personagem confirmado para entrar nessa mesa."
                );

            }


            if (
                !personagemEstaConfirmado(
                    personagem
                )
            ) {

                throw new Error(
                    "Seu personagem ainda não está confirmado."
                );

            }


            /* =============================================
               5. VERIFICAR MEMBRO
            ============================================= */

            await adicionarMembro(
                campanha.id,
                usuario.id
            );


            /* =============================================
               6. RECUPERAR SLOT EXISTENTE
            ============================================= */

            let slot =
                obterSlotPersonagem(
                    personagem
                );


            /* =============================================
               7. SE NÃO TIVER SLOT, RESERVAR
            ============================================= */

            if (!slot) {

                slot =
                    await encontrarPrimeiroSlot(
                        campanha.id
                    );


                if (!slot) {

                    throw new Error(
                        "A mesa já está cheia. O limite é de 8 jogadores."
                    );

                }


                /* -----------------------------------------
                   Associar personagem
                ----------------------------------------- */

                const personagemAtualizado =
                    await associarPersonagem(
                        personagem,
                        campanha,
                        slot
                    );


                if (personagemAtualizado) {

                    Object.assign(
                        personagem,
                        personagemAtualizado
                    );

                }

            }


            /* =============================================
               8. GARANTIR CONTEXTO DO PERSONAGEM
            ============================================= */

            personagem.campaign_id =
                campanha.id;

            personagem.campaignId =
                campanha.id;

            personagem.slot =
                slot;


            /* =============================================
               9. SALVAR MESA ATIVA
            ============================================= */

            salvarMesaAtiva(
                campanha,
                personagem,
                slot
            );


            /* =============================================
               10. SINCRONIZAR AUTENTICAÇÃO
            ============================================= */

            await atualizarAuth(
                campanha,
                false,
                personagem,
                slot
            );


            /* =============================================
               11. ENTRAR NA MESA
            ============================================= */

            mostrarMensagem(
                `Mesa encontrada. Entrando no slot ${slot}...`,
                "success"
            );


            entrarNaMesa();


        } catch (erro) {

            console.error(
                "Erro ao entrar na mesa:",
                erro
            );


            let mensagem =
                erro?.message ||
                "Não foi possível entrar na mesa.";


            /* ---------------------------------------------
               Mensagens mais amigáveis
            --------------------------------------------- */

            if (
                mensagem.includes(
                    "duplicate"
                ) ||
                mensagem.includes(
                    "unique"
                )
            ) {

                mensagem =
                    "Você já está vinculado a essa mesa.";

            }


            mostrarMensagem(
                mensagem,
                "error"
            );


            definirProcessando(false);

        }

    }


    /* =====================================================
       CONTINUAR CAMPANHA
       ===================================================== */

    async function continuarCampanha() {

        if (processandoEntrada) {
            return;
        }


        const salvo =
            obterMesaAtivaLocal();


        if (!salvo?.campaignId) {

            mostrarMensagem(
                "Nenhuma campanha ativa foi encontrada.",
                "error"
            );

            return;

        }


        const usuario =
            obterUsuario();


        if (!usuario?.id) {

            mostrarMensagem(
                "Você precisa estar conectado.",
                "error"
            );

            return;

        }


        const supabase =
            obterSupabase();


        if (!supabase) {

            mostrarMensagem(
                "Conexão com o servidor não encontrada.",
                "error"
            );

            return;

        }


        definirProcessando(true);

        mostrarMensagem(
            "Recuperando sua mesa...",
            "info"
        );


        try {

            /* =============================================
               BUSCAR CAMPANHA NOVAMENTE NO BANCO
            ============================================= */

            const { data: campanha, error } =
                await supabase
                    .from("campaigns")
                    .select("*")
                    .eq(
                        "id",
                        salvo.campaignId
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!campanha) {

                limparMesaAtivaLocal();

                throw new Error(
                    "A campanha salva não existe mais."
                );

            }


            const masterId =
                campanha.master_id ||
                campanha.masterId ||
                null;


            const ehMestre =
                Boolean(
                    masterId &&
                    String(masterId) ===
                    String(usuario.id)
                );


            /* =============================================
               MESTRE
            ============================================= */

            if (ehMestre) {

                salvarMesaAtiva(
                    campanha,
                    null,
                    null
                );


                await atualizarAuth(
                    campanha,
                    true,
                    null,
                    null
                );


                entrarNaMesa();

                return;

            }


            /* =============================================
               JOGADOR
            ============================================= */

            let personagem = null;


            if (salvo.characterId) {

                const resultado =
                    await supabase
                        .from("characters")
                        .select("*")
                        .eq(
                            "id",
                            salvo.characterId
                        )
                        .eq(
                            "user_id",
                            usuario.id
                        )
                        .maybeSingle();


                if (!resultado.error) {
                    personagem =
                        resultado.data;
                }

            }


            /* ---------------------------------------------
               Fallback: procurar personagem na campanha
            --------------------------------------------- */

            if (!personagem) {

                personagem =
                    await encontrarPersonagem(
                        campanha
                    );

            }


            if (!personagem) {

                throw new Error(
                    "Seu personagem não foi encontrado nessa mesa."
                );

            }


            if (
                !personagemEstaConfirmado(
                    personagem
                )
            ) {

                throw new Error(
                    "Seu personagem ainda não está confirmado."
                );

            }


            let slot =
                obterSlotPersonagem(
                    personagem
                );


            if (!slot) {

                slot =
                    Number(
                        salvo.slot
                    );

            }


            if (
                !Number.isInteger(slot) ||
                slot < 1 ||
                slot > MAX_JOGADORES
            ) {

                slot =
                    await encontrarPrimeiroSlot(
                        campanha.id
                    );

            }


            if (!slot) {

                throw new Error(
                    "Não há slots disponíveis nessa mesa."
                );

            }


            /* =============================================
               GARANTIR VÍNCULO DO PERSONAGEM
            ============================================= */

            if (
                String(
                    personagem.campaign_id
                ) !== String(
                    campanha.id
                ) ||
                Number(
                    personagem.slot
                ) !== Number(slot)
            ) {

                personagem =
                    await associarPersonagem(
                        personagem,
                        campanha,
                        slot
                    );

            }


            /* =============================================
               GARANTIR MEMBRO
            ============================================= */

            await adicionarMembro(
                campanha.id,
                usuario.id
            );


            /* =============================================
               SALVAR E SINCRONIZAR
            ============================================= */

            salvarMesaAtiva(
                campanha,
                personagem,
                slot
            );


            await atualizarAuth(
                campanha,
                false,
                personagem,
                slot
            );


            entrarNaMesa();


        } catch (erro) {

            console.error(
                "Erro ao continuar campanha:",
                erro
            );


            mostrarMensagem(
                erro?.message ||
                "Não foi possível continuar a campanha.",
                "error"
            );


            definirProcessando(false);

        }

    }


    /* =====================================================
       MOSTRAR FORMULÁRIO DE CÓDIGO
    ===================================================== */

    function abrirFormularioCodigo() {

        const container =
            elementos.formContainer ||
            document.getElementById(
                "campaign-join-form-container"
            );


        if (!container) {
            return;
        }


        container.hidden = false;


        const input =
            elementos.codigo ||
            document.getElementById(
                "campaign-code-input"
            );


        if (input) {

            input.focus();

        }


        mostrarMensagem(
            "",
            "info"
        );

    }


    /* =====================================================
       ESCONDER FORMULÁRIO
    ===================================================== */

    function esconderFormularioCodigo() {

        const container =
            elementos.formContainer ||
            document.getElementById(
                "campaign-join-form-container"
            );


        if (container) {
            container.hidden = true;
        }

    }


    /* =====================================================
       COPIAR CÓDIGO
    ===================================================== */

    async function copiarCodigoCampanha() {

        const salvo =
            obterMesaAtivaLocal();


        const codigo =
            salvo?.campaignCode ||
            salvo?.codigoMesa ||
            "";


        if (!codigo) {

            mostrarMensagem(
                "Nenhum código de mesa disponível.",
                "error"
            );

            return;

        }


        try {

            await navigator.clipboard.writeText(
                codigo
            );


            mostrarMensagem(
                "Código da mesa copiado!",
                "success"
            );

        } catch (erro) {

            console.warn(
                "Não foi possível copiar:",
                erro
            );


            mostrarMensagem(
                `Código da mesa: ${codigo}`,
                "info"
            );

        }

    }


    /* =====================================================
       VERIFICAR MESA ATIVA
    ===================================================== */

    async function verificarMesaAtiva() {

        const salvo =
            obterMesaAtivaLocal();


        if (!salvo?.campaignId) {
            return false;
        }


        const usuario =
            obterUsuario();


        if (!usuario?.id) {
            return false;
        }


        const supabase =
            obterSupabase();


        if (!supabase) {
            return false;
        }


        try {

            const { data: campanha, error } =
                await supabase
                    .from("campaigns")
                    .select("*")
                    .eq(
                        "id",
                        salvo.campaignId
                    )
                    .maybeSingle();


            if (
                error ||
                !campanha
            ) {

                limparMesaAtivaLocal();

                return false;

            }


            const masterId =
                campanha.master_id ||
                campanha.masterId ||
                null;


            const ehMestre =
                Boolean(
                    masterId &&
                    String(masterId) ===
                    String(usuario.id)
                );


            /* =============================================
               MESTRE
            ============================================= */

            if (ehMestre) {

                await atualizarAuth(
                    campanha,
                    true,
                    null,
                    null
                );


                return true;

            }


            /* =============================================
               JOGADOR
            ============================================= */

            let personagem = null;


            if (salvo.characterId) {

                const resultado =
                    await supabase
                        .from("characters")
                        .select("*")
                        .eq(
                            "id",
                            salvo.characterId
                        )
                        .eq(
                            "user_id",
                            usuario.id
                        )
                        .maybeSingle();


                if (!resultado.error) {

                    personagem =
                        resultado.data;

                }

            }


            if (!personagem) {

                personagem =
                    await encontrarPersonagem(
                        campanha
                    );

            }


            if (!personagem) {
                return false;
            }


            const slot =
                obterSlotPersonagem(
                    personagem
                ) ||
                Number(
                    salvo.slot
                ) ||
                null;


            if (!slot) {
                return false;
            }


            await atualizarAuth(
                campanha,
                false,
                personagem,
                slot
            );


            salvarMesaAtiva(
                campanha,
                personagem,
                slot
            );


            return true;


        } catch (erro) {

            console.warn(
                "Erro verificando mesa ativa:",
                erro
            );

            return false;

        }

    }


    /* =====================================================
       REGISTRAR EVENTOS
    ===================================================== */

    function registrarEventos() {

        /* -------------------------------------------------
           ABRIR CÓDIGO
        ------------------------------------------------- */

        const abrir =
            elementos.abrirCodigo ||
            document.getElementById(
                "open-campaign-code-button"
            );


        if (abrir) {

            abrir.addEventListener(
                "click",
                abrirFormularioCodigo
            );

        }


        /* -------------------------------------------------
           ENTRAR
        ------------------------------------------------- */

        const entrar =
            elementos.entrar ||
            document.getElementById(
                "join-campaign-button"
            );


        if (entrar) {

            entrar.addEventListener(
                "click",
                entrarPorCodigo
            );

        }


        /* -------------------------------------------------
           ENTER NO INPUT
        ------------------------------------------------- */

        const codigo =
            elementos.codigo ||
            document.getElementById(
                "campaign-code-input"
            );


        if (codigo) {

            codigo.addEventListener(
                "input",
                function () {

                    this.value =
                        normalizarCodigo(
                            this.value
                        );

                }
            );


            codigo.addEventListener(
                "keydown",
                function (evento) {

                    if (
                        evento.key ===
                        "Enter"
                    ) {

                        evento.preventDefault();

                        entrarPorCodigo();

                    }

                }
            );

        }


        /* -------------------------------------------------
           CONTINUAR CAMPANHA
        ------------------------------------------------- */

        const continuar =
            elementos.continuar ||
            document.getElementById(
                "continue-campaign-button"
            );


        if (continuar) {

            continuar.addEventListener(
                "click",
                continuarCampanha
            );

        }


        /* -------------------------------------------------
           BOTÃO DE CONTINUAR DO PLAYER
        ------------------------------------------------- */

        const continuarPlayer =
            document.getElementById(
                "continue-campaign-button-player"
            );


        if (continuarPlayer) {

            continuarPlayer.addEventListener(
                "click",
                continuarCampanha
            );

        }


        /* -------------------------------------------------
           COPIAR CÓDIGO
        ------------------------------------------------- */

        const copiar =
            document.getElementById(
                "copy-campaign-code"
            );


        if (copiar) {

            copiar.addEventListener(
                "click",
                copiarCodigoCampanha
            );

        }

    }


    /* =====================================================
       ATUALIZAR INTERFACE INICIAL
    ===================================================== */

    function atualizarInterfaceInicial() {

        const salvo =
            obterMesaAtivaLocal();


        const continuar =
            elementos.continuar ||
            document.getElementById(
                "continue-campaign-button"
            );


        /*
         * O botão continuar só fica disponível
         * quando existe uma mesa salva localmente.
         */

        if (continuar) {

            continuar.style.display =
                salvo?.campaignId
                    ? ""
                    : "none";

        }

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    async function inicializar() {

        elementos = {

            codigo:
                document.getElementById(
                    "campaign-code-input"
                ),

            entrar:
                document.getElementById(
                    "join-campaign-button"
                ),

            mensagem:
                document.getElementById(
                    "campaign-join-message"
                ),

            formContainer:
                document.getElementById(
                    "campaign-join-form-container"
                ),

            abrirCodigo:
                document.getElementById(
                    "open-campaign-code-button"
                ),

            continuar:
                document.getElementById(
                    "continue-campaign-button"
                )

        };


        registrarEventos();

        atualizarInterfaceInicial();


        /* -------------------------------------------------
           AGUARDAR AUTENTICAÇÃO
        ------------------------------------------------- */

        let tentativas = 0;

        const maxTentativas = 40;


        const aguardarUsuario =
            setInterval(
                async function () {

                    tentativas++;


                    const usuario =
                        obterUsuario();


                    if (usuario?.id) {

                        clearInterval(
                            aguardarUsuario
                        );


                        /*
                         * Apenas verifica a mesa salva.
                         *
                         * NÃO redireciona automaticamente.
                         *
                         * O usuário escolhe continuar.
                         */

                        await verificarMesaAtiva();

                        atualizarInterfaceInicial();

                        return;

                    }


                    if (
                        tentativas >=
                        maxTentativas
                    ) {

                        clearInterval(
                            aguardarUsuario
                        );

                    }

                },
                250
            );

    }


    /* =====================================================
       API GLOBAL
    ===================================================== */

    window.rpgMesaEntrada = {

        entrarPorCodigo,

        continuarCampanha,

        abrirFormularioCodigo,

        esconderFormularioCodigo,

        copiarCodigoCampanha,

        verificarMesaAtiva,

        salvarMesaAtiva,

        obterMesaAtivaLocal,

        limparMesaAtivaLocal,

        personagemEstaConfirmado,

        buscarCampanha

    };


    /* =====================================================
       DOM READY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }

})();
