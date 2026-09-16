/* =========================================================
   MESA-ENTRADA.JS
   ENTRADA NA MESA PELO CÓDIGO DA MESA
========================================================= */

(() => {
    "use strict";

    const MAX_JOGADORES = 8;

    /* =====================================================
       ELEMENTOS
    ===================================================== */

    let codigoInput = null;
    let entrarButton = null;
    let mensagem = null;

    /* =====================================================
       ELEMENTOS DA PÁGINA
    ===================================================== */

    function localizarElementos() {
        /*
         * Usa os elementos que já existem no index.html.
         */

        codigoInput =
            document.getElementById("campaign-code-input");

        entrarButton =
            document.getElementById("join-campaign-button");

        mensagem =
            document.getElementById("campaign-join-message");

        /*
         * Compatibilidade caso algum elemento ainda
         * esteja usando outro ID.
         */

        if (!codigoInput) {
            codigoInput =
                document.getElementById("mesa-code-input");
        }

        if (!entrarButton) {
            entrarButton =
                document.getElementById("entrar-mesa-button");
        }

        if (!mensagem) {
            mensagem =
                document.getElementById("mesa-entry-message");
        }
    }

    /* =====================================================
       MENSAGENS
    ===================================================== */

    function mostrarMensagem(texto, tipo = "info") {
        if (!mensagem) {
            console.log("[Mesa]", texto);
            return;
        }

        mensagem.textContent = texto;

        mensagem.dataset.tipo = tipo;

        mensagem.style.display = "block";
    }

    function limparMensagem() {
        if (!mensagem) {
            return;
        }

        mensagem.textContent = "";
        mensagem.style.display = "none";
        delete mensagem.dataset.tipo;
    }

    /* =====================================================
       CÓDIGO
    ===================================================== */

    function normalizarCodigo(codigo) {
        return String(codigo || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }

    /* =====================================================
       USUÁRIO
    ===================================================== */

    function obterUsuario() {
        if (
            window.rpgAuth &&
            window.rpgAuth.user
        ) {
            return window.rpgAuth.user;
        }

        return null;
    }

    /* =====================================================
       PERSONAGEM
    ===================================================== */

    async function obterPersonagemDoJogador(userId) {
        if (!window.supabase || !userId) {
            return null;
        }

        /*
         * Primeiro tentamos encontrar o personagem
         * que já pertence à campanha ativa.
         */

        let campanhaAtual = null;

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.obterCampanhaAtiva ===
                "function"
        ) {
            campanhaAtual =
                window.rpgCampaign.obterCampanhaAtiva();
        }

        if (
            campanhaAtual &&
            campanhaAtual.id
        ) {
            const { data, error } =
                await window.supabase
                    .from("characters")
                    .select("*")
                    .eq("campaign_id", campanhaAtual.id)
                    .eq("user_id", userId)
                    .maybeSingle();

            if (!error && data) {
                return data;
            }
        }

        /*
         * Caso ainda não esteja associado a uma campanha,
         * pega o personagem do usuário.
         *
         * Se houver mais de um personagem, usamos o mais
         * recentemente criado.
         */

        const { data, error } =
            await window.supabase
                .from("characters")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();

        if (error) {
            console.error(
                "[Mesa] Erro ao buscar personagem:",
                error
            );

            return null;
        }

        return data || null;
    }

    /* =====================================================
       PERSONAGEM CONFIRMADO
    ===================================================== */

    function personagemEstaConfirmado(personagem) {
        if (!personagem) {
            return false;
        }

        /*
         * O banco não possui uma coluna "confirmed"
         * atualmente.
         *
         * Portanto, consideramos o personagem válido
         * quando possui os dados básicos necessários.
         */

        const nomeValido =
            String(personagem.name || "").trim().length > 0;

        const racaValida =
            String(personagem.race || "").trim().length > 0;

        const classeValida =
            String(personagem.class || "").trim().length > 0;

        return (
            nomeValido &&
            racaValida &&
            classeValida
        );
    }

    /* =====================================================
       MEMBRO DA CAMPANHA
    ===================================================== */

    async function verificarMembro(
        campaignId,
        userId
    ) {
        if (!window.supabase) {
            return null;
        }

        const { data, error } =
            await window.supabase
                .from("campaign_members")
                .select("*")
                .eq("campaign_id", campaignId)
                .eq("user_id", userId)
                .maybeSingle();

        if (error) {
            console.error(
                "[Mesa] Erro ao verificar membro:",
                error
            );

            return null;
        }

        return data || null;
    }

    /* =====================================================
       ADICIONAR MEMBRO
    ===================================================== */

    async function adicionarMembro(
        campaignId,
        userId
    ) {
        if (!window.supabase) {
            return {
                sucesso: false,
                erro: "Supabase não disponível."
            };
        }

        const membroExistente =
            await verificarMembro(
                campaignId,
                userId
            );

        if (membroExistente) {
            return {
                sucesso: true,
                membro: membroExistente
            };
        }

        const { data, error } =
            await window.supabase
                .from("campaign_members")
                .insert({
                    campaign_id: campaignId,
                    user_id: userId
                })
                .select()
                .single();

        if (error) {
            console.error(
                "[Mesa] Erro ao adicionar membro:",
                error
            );

            return {
                sucesso: false,
                erro: error
            };
        }

        return {
            sucesso: true,
            membro: data
        };
    }

    /* =====================================================
       ENCONTRAR SLOT LIVRE
    ===================================================== */

    async function encontrarSlotLivre(campaignId) {
        if (!window.supabase) {
            return null;
        }

        const { data, error } =
            await window.supabase
                .from("characters")
                .select("slot")
                .eq("campaign_id", campaignId)
                .not("slot", "is", null);

        if (error) {
            console.error(
                "[Mesa] Erro ao verificar slots:",
                error
            );

            return null;
        }

        const ocupados =
            new Set(
                (data || [])
                    .map(personagem =>
                        Number(personagem.slot)
                    )
                    .filter(slot =>
                        Number.isInteger(slot) &&
                        slot >= 1 &&
                        slot <= MAX_JOGADORES
                    )
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
       ASSOCIAR PERSONAGEM À MESA
    ===================================================== */

    async function associarPersonagem(
        personagemId,
        campaignId,
        slot
    ) {
        if (!window.supabase) {
            return {
                sucesso: false,
                erro: "Supabase não disponível."
            };
        }

        const { data, error } =
            await window.supabase
                .from("characters")
                .update({
                    campaign_id: campaignId,
                    slot: slot
                })
                .eq("id", personagemId)
                .select()
                .single();

        if (error) {
            console.error(
                "[Mesa] Erro ao associar personagem:",
                error
            );

            return {
                sucesso: false,
                erro: error
            };
        }

        return {
            sucesso: true,
            personagem: data
        };
    }

    /* =====================================================
       SALVAR CAMPANHA LOCAL
    ===================================================== */

    function salvarMesaLocal(
        campanha,
        personagem,
        slot
    ) {
        try {
            localStorage.setItem(
                "rpg_mesa_ativa",
                JSON.stringify({
                    campaignId: campanha.id,
                    codigoMesa: campanha.codigo_mesa,
                    nomeMesa: campanha.name,
                    personagemId: personagem.id,
                    slot: slot,
                    timestamp: Date.now()
                })
            );
        } catch (erro) {
            console.warn(
                "[Mesa] Não foi possível salvar sessão local:",
                erro
            );
        }
    }

    /* =====================================================
       ENTRAR NA MESA
    ===================================================== */

    async function entrarPorCodigo(codigo) {
        const codigoNormalizado =
            normalizarCodigo(codigo);

        limparMensagem();

        if (!codigoNormalizado) {
            mostrarMensagem(
                "Digite o código da mesa.",
                "erro"
            );
            return false;
        }

        const usuario =
            obterUsuario();

        if (!usuario) {
            mostrarMensagem(
                "Você precisa estar logado para entrar na mesa.",
                "erro"
            );
            return false;
        }

        /*
         * Busca a campanha através do campaign.js.
         */

        mostrarMensagem(
            "Procurando a mesa...",
            "info"
        );

        let campanha = null;

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.buscarCampanhaPorCodigo ===
                "function"
        ) {
            campanha =
                await window.rpgCampaign
                    .buscarCampanhaPorCodigo(
                        codigoNormalizado
                    );
        }

        /*
         * Compatibilidade direta com Supabase.
         */

        if (!campanha && window.supabase) {
            const { data, error } =
                await window.supabase
                    .from("campaigns")
                    .select(`
                        id,
                        name,
                        master_id,
                        codigo_mesa,
                        created_at
                    `)
                    .eq(
                        "codigo_mesa",
                        codigoNormalizado
                    )
                    .maybeSingle();

            if (!error) {
                campanha = data || null;
            }
        }

        if (!campanha) {
            mostrarMensagem(
                "Código da mesa não encontrado.",
                "erro"
            );
            return false;
        }

        /*
         * Evita o próprio mestre entrar como jogador.
         */

        if (
            campanha.master_id ===
            usuario.id
        ) {
            if (
                window.rpgCampaign &&
                typeof window.rpgCampaign.definirCampanhaAtiva ===
                    "function"
            ) {
                window.rpgCampaign
                    .definirCampanhaAtiva(
                        campanha
                    );
            }

            salvarMesaLocal(
                campanha,
                {
                    id: null
                },
                null
            );

            window.location.href =
                "mesa.html";

            return true;
        }

        /*
         * Procura o personagem.
         */

        mostrarMensagem(
            "Verificando seu personagem...",
            "info"
        );

        const personagem =
            await obterPersonagemDoJogador(
                usuario.id
            );

        if (!personagem) {
            mostrarMensagem(
                "Você ainda não possui um personagem.",
                "erro"
            );
            return false;
        }

        if (
            !personagemEstaConfirmado(
                personagem
            )
        ) {
            mostrarMensagem(
                "Confirme seu personagem antes de entrar na mesa.",
                "erro"
            );
            return false;
        }

        /*
         * Verifica se já é membro.
         */

        const membro =
            await verificarMembro(
                campanha.id,
                usuario.id
            );

        /*
         * Se já está na mesa, reaproveita o slot.
         */

        if (membro) {
            let slotAtual =
                personagem.slot;

            /*
             * Se o personagem já tem slot, entra direto.
             */

            if (
                Number.isInteger(
                    Number(slotAtual)
                ) &&
                Number(slotAtual) >= 1 &&
                Number(slotAtual) <= MAX_JOGADORES
            ) {
                slotAtual =
                    Number(slotAtual);
            } else {
                /*
                 * Caso seja membro mas ainda não tenha slot,
                 * encontra uma vaga.
                 */

                slotAtual =
                    await encontrarSlotLivre(
                        campanha.id
                    );

                if (!slotAtual) {
                    mostrarMensagem(
                        "A mesa está cheia. Existem 8 jogadores.",
                        "erro"
                    );
                    return false;
                }

                const resultado =
                    await associarPersonagem(
                        personagem.id,
                        campanha.id,
                        slotAtual
                    );

                if (!resultado.sucesso) {
                    mostrarMensagem(
                        "Não foi possível reservar seu lugar na mesa.",
                        "erro"
                    );
                    return false;
                }
            }

            if (
                window.rpgCampaign &&
                typeof window.rpgCampaign.definirCampanhaAtiva ===
                    "function"
            ) {
                window.rpgCampaign
                    .definirCampanhaAtiva(
                        campanha
                    );
            }

            salvarMesaLocal(
                campanha,
                personagem,
                slotAtual
            );

            mostrarMensagem(
                `Entrando na mesa... Lugar ${slotAtual}.`,
                "sucesso"
            );

            setTimeout(() => {
                window.location.href =
                    "mesa.html";
            }, 300);

            return true;
        }

        /*
         * Ainda não é membro.
         *
         * Primeiro verifica se existe vaga.
         */

        mostrarMensagem(
            "Procurando um lugar na mesa...",
            "info"
        );

        const slot =
            await encontrarSlotLivre(
                campanha.id
            );

        if (!slot) {
            mostrarMensagem(
                "A mesa está cheia. Existem 8 jogadores.",
                "erro"
            );
            return false;
        }

        /*
         * Adiciona o jogador à campanha.
         */

        const resultadoMembro =
            await adicionarMembro(
                campanha.id,
                usuario.id
            );

        if (!resultadoMembro.sucesso) {
            mostrarMensagem(
                "Não foi possível entrar na mesa.",
                "erro"
            );
            return false;
        }

        /*
         * Associa o personagem ao slot.
         */

        const resultadoPersonagem =
            await associarPersonagem(
                personagem.id,
                campanha.id,
                slot
            );

        if (!resultadoPersonagem.sucesso) {
            mostrarMensagem(
                "O jogador foi registrado, mas não foi possível reservar o lugar.",
                "erro"
            );
            return false;
        }

        /*
         * Define campanha ativa.
         */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.definirCampanhaAtiva ===
                "function"
        ) {
            window.rpgCampaign
                .definirCampanhaAtiva(
                    campanha
                );
        }

        /*
         * Salva dados locais.
         */

        salvarMesaLocal(
            campanha,
            personagem,
            slot
        );

        /*
         * Entrada concluída.
         */

        mostrarMensagem(
            `Tudo certo! Você entrou no lugar ${slot}.`,
            "sucesso"
        );

        setTimeout(() => {
            window.location.href =
                "mesa.html";
        }, 400);

        return true;
    }

    /* =====================================================
       BOTÃO
    ===================================================== */

    function configurarBotao() {
        localizarElementos();

        if (
            !codigoInput ||
            !entrarButton
        ) {
            return;
        }

        /*
         * Evita registrar o evento duas vezes.
         */

        if (
            entrarButton.dataset.mesaEntradaConfigurado ===
            "true"
        ) {
            return;
        }

        entrarButton.dataset.mesaEntradaConfigurado =
            "true";

        entrarButton.addEventListener(
            "click",
            async () => {

                if (
                    entrarButton.disabled
                ) {
                    return;
                }

                entrarButton.disabled =
                    true;

                const codigo =
                    codigoInput.value;

                try {
                    await entrarPorCodigo(
                        codigo
                    );
                } catch (erro) {
                    console.error(
                        "[Mesa] Erro ao entrar:",
                        erro
                    );

                    mostrarMensagem(
                        "Ocorreu um erro ao entrar na mesa.",
                        "erro"
                    );
                }

                /*
                 * Só reativa se ainda estiver
                 * nesta página.
                 */

                if (
                    document.body.contains(
                        entrarButton
                    )
                ) {
                    entrarButton.disabled =
                        false;
                }
            }
        );

        /*
         * Enter no campo do código.
         */

        codigoInput.addEventListener(
            "keydown",
            evento => {
                if (
                    evento.key === "Enter"
                ) {
                    evento.preventDefault();

                    entrarButton.click();
                }
            }
        );

        /*
         * Formatação visual.
         */

        codigoInput.addEventListener(
            "input",
            () => {
                codigoInput.value =
                    codigoInput.value
                        .toUpperCase()
                        .replace(/\s+/g, "");
            }
        );
    }

    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function inicializar() {
        configurarBotao();
    }

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

    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.rpgMesaEntrada = {
        entrarPorCodigo,
        normalizarCodigo,
        encontrarSlotLivre
    };

    /*
     * Compatibilidade
     */

    window.entrarNaMesaPorCodigo =
        entrarPorCodigo;

})();
