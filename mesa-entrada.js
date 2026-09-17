/* =========================================================
   MESA-ENTRADA.JS
   ENTRADA NA MESA / CÓDIGO DA CAMPANHA
========================================================= */

(() => {
    "use strict";

    const MAX_JOGADORES = 8;
    const STORAGE_KEY = "rpg_mesa_ativa";

    let campanhaAtual = null;

    let inputCodigo = null;
    let botaoEntrar = null;
    let mensagem = null;

    let estadoInicial = null;
    let formularioCodigo = null;
    let estadoConectado = null;

    let botaoContinuarJogador = null;
    let botaoContinuarMestre = null;

    /* =====================================================
       UTILITÁRIOS
    ===================================================== */

    function obterSupabase() {
        return window.supabaseClient || window.supabase || null;
    }

    function obterUsuario() {
        return window.rpgAuth?.user || null;
    }

    function normalizarCodigo(codigo) {
        return String(codigo || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }

    function mostrarMensagem(texto, tipo = "info") {
        if (!mensagem) return;

        mensagem.textContent = texto;
        mensagem.dataset.tipo = tipo;
        mensagem.hidden = false;
    }

    function limparMensagem() {
        if (!mensagem) return;

        mensagem.textContent = "";
        mensagem.hidden = true;
        mensagem.dataset.tipo = "";
    }

    function bloquearEntrada(bloquear) {
        if (inputCodigo) {
            inputCodigo.disabled = bloquear;
        }

        if (botaoEntrar) {
            botaoEntrar.disabled = bloquear;
        }
    }

    /* =====================================================
       ESTADOS DA INTERFACE
    ===================================================== */

    function mostrarEstadoInicial() {
        if (estadoInicial) {
            estadoInicial.hidden = false;
        }

        if (formularioCodigo) {
            formularioCodigo.hidden = true;
        }

        if (estadoConectado) {
            estadoConectado.hidden = true;
        }

        if (inputCodigo) {
            inputCodigo.disabled = false;
            inputCodigo.value = "";
        }

        if (botaoEntrar) {
            botaoEntrar.disabled = false;
        }

        limparMensagem();
    }

    function mostrarFormularioCodigo() {
        if (estadoInicial) {
            estadoInicial.hidden = true;
        }

        if (formularioCodigo) {
            formularioCodigo.hidden = false;
        }

        if (estadoConectado) {
            estadoConectado.hidden = true;
        }

        limparMensagem();

        if (inputCodigo) {
            inputCodigo.disabled = false;
            inputCodigo.focus();
        }

        if (botaoEntrar) {
            botaoEntrar.disabled = false;
        }
    }

    function mostrarCampanhaConectada() {
        /*
         * Depois que entrou:
         *
         * ENTAR NA MESA       -> some
         * CAMPO DO CÓDIGO     -> some
         * CONTINUAR CAMPANHA  -> fica
         */

        if (estadoInicial) {
            estadoInicial.hidden = true;
        }

        if (formularioCodigo) {
            formularioCodigo.hidden = true;
        }

        if (estadoConectado) {
            estadoConectado.hidden = false;
        }

        if (inputCodigo) {
            inputCodigo.disabled = true;
        }

        if (botaoEntrar) {
            botaoEntrar.disabled = true;
        }
    }

    /* =====================================================
       PERSONAGEM
    ===================================================== */

    function personagemEstaConfirmado(personagem) {
        if (!personagem) {
            return false;
        }

        const nome = String(
            personagem.name ??
            personagem.nome ??
            ""
        ).trim();

        const raca = String(
            personagem.race ??
            personagem.raca ??
            ""
        ).trim();

        const classe = String(
            personagem.class ??
            personagem.classe ??
            ""
        ).trim();

        return Boolean(
            nome &&
            raca &&
            classe
        );
    }

    async function encontrarPersonagem(campanha) {
        const supabase = obterSupabase();
        const usuario = obterUsuario();

        if (!supabase || !usuario || !campanha) {
            return null;
        }

        /*
         * Primeiro: personagem que já pertence
         * especificamente a esta campanha.
         */
        const resultadoCampanha =
            await supabase
                .from("characters")
                .select("*")
                .eq("campaign_id", campanha.id)
                .eq("user_id", usuario.id)
                .order("created_at", {
                    ascending: false
                })
                .limit(1);

        if (!resultadoCampanha.error) {
            const personagem =
                resultadoCampanha.data?.[0] || null;

            if (personagem) {
                return personagem;
            }
        }

        /*
         * Depois procura o personagem do usuário
         * que ainda não pertence a nenhuma campanha.
         *
         * Isso evita pegar personagem de outra campanha.
         */
        const resultadoDisponivel =
            await supabase
                .from("characters")
                .select("*")
                .eq("user_id", usuario.id)
                .is("campaign_id", null)
                .order("created_at", {
                    ascending: false
                })
                .limit(1);

        if (resultadoDisponivel.error) {
            console.error(
                "[Mesa Entrada] Erro ao procurar personagem:",
                resultadoDisponivel.error
            );

            return null;
        }

        return resultadoDisponivel.data?.[0] || null;
    }

    /* =====================================================
       CAMPANHA
    ===================================================== */

    async function buscarCampanha(codigo) {
        const codigoNormalizado =
            normalizarCodigo(codigo);

        if (!codigoNormalizado) {
            return null;
        }

        /*
         * Usa primeiro o sistema oficial de campanhas.
         */
        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.buscarCampanhaPorCodigo ===
                "function"
        ) {
            const campanha =
                await window.rpgCampaign.buscarCampanhaPorCodigo(
                    codigoNormalizado
                );

            if (campanha) {
                return campanha;
            }
        }

        /*
         * Fallback direto no Supabase.
         */
        const supabase = obterSupabase();

        if (!supabase) {
            return null;
        }

        const { data, error } =
            await supabase
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

        if (error) {
            console.error(
                "[Mesa Entrada] Erro ao procurar campanha:",
                error
            );

            return null;
        }

        return data || null;
    }

    /* =====================================================
       MEMBROS
    ===================================================== */

    async function usuarioJaEhMembro(campanhaId, usuarioId) {
        const supabase = obterSupabase();

        if (!supabase) {
            return false;
        }

        const { data, error } =
            await supabase
                .from("campaign_members")
                .select("campaign_id")
                .eq("campaign_id", campanhaId)
                .eq("user_id", usuarioId)
                .maybeSingle();

        if (error) {
            /*
             * Se não encontrou registro, simplesmente
             * consideramos que ainda não é membro.
             */
            if (error.code === "PGRST116") {
                return false;
            }

            console.error(
                "[Mesa Entrada] Erro ao verificar membro:",
                error
            );

            return false;
        }

        return Boolean(data);
    }

    async function adicionarMembro(campanhaId, usuarioId) {
        const supabase = obterSupabase();

        if (!supabase) {
            throw new Error(
                "Supabase não está disponível."
            );
        }

        const { error } =
            await supabase
                .from("campaign_members")
                .insert({
                    campaign_id: campanhaId,
                    user_id: usuarioId,
                    role: "player"
                });

        /*
         * 23505 = registro já existente.
         * Nesse caso está tudo certo.
         */
        if (
            error &&
            error.code !== "23505"
        ) {
            throw error;
        }
    }

    /* =====================================================
       SLOTS
    ===================================================== */

    async function obterSlotsOcupados(campanhaId) {
        const supabase = obterSupabase();

        if (!supabase) {
            return [];
        }

        const { data, error } =
            await supabase
                .from("characters")
                .select("id, slot")
                .eq("campaign_id", campanhaId)
                .not("slot", "is", null);

        if (error) {
            console.error(
                "[Mesa Entrada] Erro ao obter slots:",
                error
            );

            throw error;
        }

        return (data || [])
            .map(personagem =>
                Number(personagem.slot)
            )
            .filter(slot =>
                Number.isInteger(slot) &&
                slot >= 1 &&
                slot <= MAX_JOGADORES
            );
    }

    function encontrarPrimeiroSlot(slotsOcupados) {
        for (
            let slot = 1;
            slot <= MAX_JOGADORES;
            slot++
        ) {
            if (!slotsOcupados.includes(slot)) {
                return slot;
            }
        }

        return null;
    }

    async function associarPersonagem(
        personagemId,
        usuarioId,
        campanhaId,
        slot
    ) {
        const supabase = obterSupabase();

        if (!supabase) {
            throw new Error(
                "Supabase não está disponível."
            );
        }

        const { data, error } =
            await supabase
                .from("characters")
                .update({
                    campaign_id: campanhaId,
                    slot: slot
                })
                .eq("id", personagemId)
                .eq("user_id", usuarioId)
                .select()
                .single();

        if (error) {
            throw error;
        }

        return data;
    }

    /* =====================================================
       MESA ATIVA LOCAL
    ===================================================== */

    function salvarMesaAtiva(
        campanha,
        personagem,
        slot
    ) {
        const dados = {
            campaignId: campanha.id,
            campaignName: campanha.name,
            codigoMesa: campanha.codigo_mesa,
            masterId: campanha.master_id,
            characterId: personagem?.id || null,
            slot: slot || null,
            joinedAt: Date.now()
        };

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(dados)
        );

        return dados;
    }

    function obterMesaAtivaLocal() {
        try {
            const bruto =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (!bruto) {
                return null;
            }

            return JSON.parse(bruto);

        } catch (erro) {
            console.error(
                "[Mesa Entrada] Erro ao ler mesa ativa:",
                erro
            );

            return null;
        }
    }

    function limparMesaAtivaLocal() {
        localStorage.removeItem(
            STORAGE_KEY
        );
    }

    /* =====================================================
       AUTH
    ===================================================== */

    function atualizarAuth(
        campanha,
        isMaster,
        personagem = null,
        slot = null
    ) {
        if (!window.rpgAuth) {
            return;
        }

        window.rpgAuth.campaign =
            campanha;

        window.rpgAuth.isMaster =
            Boolean(isMaster);

        window.rpgAuth.campaignCharacter =
            personagem || null;

        window.rpgAuth.currentCharacter =
            personagem || null;

        window.rpgAuth.campaignSlot =
            slot || null;
    }

    /* =====================================================
       ENTRAR POR CÓDIGO
    ===================================================== */

    async function entrarPorCodigo() {
        const codigo =
            normalizarCodigo(
                inputCodigo?.value
            );

        const usuario =
            obterUsuario();

        const supabase =
            obterSupabase();

        limparMensagem();

        if (!codigo) {
            mostrarMensagem(
                "Digite o código da mesa.",
                "erro"
            );
            return;
        }

        if (!usuario) {
            mostrarMensagem(
                "Você precisa estar conectado à conta.",
                "erro"
            );
            return;
        }

        if (!supabase) {
            mostrarMensagem(
                "Não foi possível conectar ao servidor.",
                "erro"
            );
            return;
        }

        bloquearEntrada(true);

        try {
            mostrarMensagem(
                "Verificando código da mesa...",
                "info"
            );

            const campanha =
                await buscarCampanha(codigo);

            if (!campanha) {
                throw new Error(
                    "Código da mesa inválido."
                );
            }

            campanhaAtual = campanha;

            const ehMestre =
                String(campanha.master_id) ===
                String(usuario.id);

            /* =========================================
               MESTRE
            ========================================= */

            if (ehMestre) {
                salvarMesaAtiva(
                    campanha,
                    null,
                    null
                );

                atualizarAuth(
                    campanha,
                    true,
                    null,
                    null
                );

                if (
                    window.rpgCampaign &&
                    typeof window.rpgCampaign.definirCampanhaAtiva ===
                        "function"
                ) {
                    window.rpgCampaign.definirCampanhaAtiva(
                        campanha
                    );
                }

                mostrarCampanhaConectada();

                return;
            }

            /* =========================================
               JOGADOR
            ========================================= */

            mostrarMensagem(
                "Verificando seu personagem...",
                "info"
            );

            const personagem =
                await encontrarPersonagem(
                    campanha
                );

            if (!personagem) {
                throw new Error(
                    "Você ainda não possui um personagem disponível para entrar nesta campanha."
                );
            }

            if (
                !personagemEstaConfirmado(
                    personagem
                )
            ) {
                throw new Error(
                    "Seu personagem ainda não está confirmado. Termine sua ficha antes de entrar."
                );
            }

            /*
             * Garante que o personagem não esteja
             * preso a outra campanha.
             */
            if (
                personagem.campaign_id &&
                String(personagem.campaign_id) !==
                    String(campanha.id)
            ) {
                throw new Error(
                    "Seu personagem já pertence a outra campanha."
                );
            }

            mostrarMensagem(
                "Verificando vaga na mesa...",
                "info"
            );

            const jaEhMembro =
                await usuarioJaEhMembro(
                    campanha.id,
                    usuario.id
                );

            if (!jaEhMembro) {
                await adicionarMembro(
                    campanha.id,
                    usuario.id
                );
            }

            /*
             * Se já estiver nesta campanha e já possuir
             * slot válido, preservamos o slot.
             *
             * Caso contrário, procuramos uma vaga.
             */
            let slot =
                Number(personagem.slot);

            const slotsOcupados =
                await obterSlotsOcupados(
                    campanha.id
                );

            const slotValido =
                Number.isInteger(slot) &&
                slot >= 1 &&
                slot <= MAX_JOGADORES;

            /*
             * Se o slot do personagem não é válido,
             * pegamos o primeiro livre.
             */
            if (!slotValido) {
                slot =
                    encontrarPrimeiroSlot(
                        slotsOcupados
                    );
            } else {
                /*
                 * O próprio personagem pode ocupar seu slot.
                 * Por isso não consideramos conflito com ele mesmo.
                 */
                const outroPersonagemNoSlot =
                    await supabase
                        .from("characters")
                        .select("id")
                        .eq(
                            "campaign_id",
                            campanha.id
                        )
                        .eq("slot", slot)
                        .neq("id", personagem.id)
                        .limit(1);

                if (
                    outroPersonagemNoSlot.data &&
                    outroPersonagemNoSlot.data.length > 0
                ) {
                    slot =
                        encontrarPrimeiroSlot(
                            slotsOcupados
                        );
                }
            }

            if (!slot) {
                throw new Error(
                    "A mesa já possui 8 jogadores."
                );
            }

            /*
             * Associa definitivamente o personagem
             * à campanha e ao slot.
             */
            const personagemAtualizado =
                await associarPersonagem(
                    personagem.id,
                    usuario.id,
                    campanha.id,
                    slot
                );

            salvarMesaAtiva(
                campanha,
                personagemAtualizado ||
                    personagem,
                slot
            );

            atualizarAuth(
                campanha,
                false,
                personagemAtualizado ||
                    personagem,
                slot
            );

            if (
                window.rpgCampaign &&
                typeof window.rpgCampaign.definirCampanhaAtiva ===
                    "function"
            ) {
                window.rpgCampaign.definirCampanhaAtiva(
                    campanha
                );
            }

            mostrarCampanhaConectada();

        } catch (erro) {
            console.error(
                "[Mesa Entrada] Erro ao entrar:",
                erro
            );

            mostrarMensagem(
                erro?.message ||
                    "Não foi possível entrar na mesa.",
                "erro"
            );

            bloquearEntrada(false);
        }
    }

    /* =====================================================
       COPIAR CÓDIGO
    ===================================================== */

    async function copiarCodigoMesa() {
        const campanha =
            campanhaAtual ||
            window.rpgCampaign?.obterCampanhaAtiva?.() ||
            window.rpgAuth?.campaign;

        const codigo =
            campanha?.codigo_mesa;

        if (!codigo) {
            return;
        }

        try {
            await navigator.clipboard.writeText(
                codigo
            );

            mostrarMensagem(
                "Código da mesa copiado!",
                "sucesso"
            );

        } catch (erro) {
            /*
             * Fallback para navegadores que bloqueiam
             * navigator.clipboard.
             */
            try {
                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value = codigo;
                textarea.style.position =
                    "fixed";
                textarea.style.opacity = "0";

                document.body.appendChild(
                    textarea
                );

                textarea.select();
                document.execCommand(
                    "copy"
                );

                textarea.remove();

                mostrarMensagem(
                    "Código da mesa copiado!",
                    "sucesso"
                );

            } catch (fallbackErro) {
                console.error(
                    "[Mesa Entrada] Erro ao copiar:",
                    fallbackErro
                );

                mostrarMensagem(
                    "Não foi possível copiar o código.",
                    "erro"
                );
            }
        }
    }

    /* =====================================================
       CONTINUAR CAMPANHA
    ===================================================== */

    async function continuarCampanha() {
        const usuario =
            obterUsuario();

        if (!usuario) {
            mostrarMensagem(
                "Você precisa estar conectado.",
                "erro"
            );
            return;
        }

        const mesaLocal =
            obterMesaAtivaLocal();

        if (!mesaLocal?.campaignId) {
            mostrarMensagem(
                "Entre em uma mesa antes de continuar.",
                "erro"
            );
            return;
        }

        /*
         * Confirma a campanha diretamente no Supabase.
         * O localStorage não é tratado como autoridade.
         */
        const supabase =
            obterSupabase();

        if (!supabase) {
            mostrarMensagem(
                "Não foi possível verificar a campanha.",
                "erro"
            );
            return;
        }

        try {
            const { data: campanha, error } =
                await supabase
                    .from("campaigns")
                    .select(`
                        id,
                        name,
                        master_id,
                        codigo_mesa,
                        created_at
                    `)
                    .eq(
                        "id",
                        mesaLocal.campaignId
                    )
                    .maybeSingle();

            if (error || !campanha) {
                limparMesaAtivaLocal();

                mostrarEstadoInicial();

                mostrarMensagem(
                    "Essa campanha não está mais disponível.",
                    "erro"
                );

                return;
            }

            /*
             * Atualiza o estado global antes de ir
             * para a mesa.
             */
            campanhaAtual =
                campanha;

            const ehMestre =
                String(campanha.master_id) ===
                String(usuario.id);

            atualizarAuth(
                campanha,
                ehMestre
            );

            if (
                window.rpgCampaign &&
                typeof window.rpgCampaign.definirCampanhaAtiva ===
                    "function"
            ) {
                window.rpgCampaign.definirCampanhaAtiva(
                    campanha
                );
            }

            window.location.href =
                "mesa.html";

        } catch (erro) {
            console.error(
                "[Mesa Entrada] Erro ao continuar:",
                erro
            );

            mostrarMensagem(
                "Não foi possível abrir a mesa.",
                "erro"
            );
        }
    }

    /* =====================================================
       CÓDIGO VISUAL DO MESTRE
    ===================================================== */

    function atualizarCodigoVisual() {
        const elemento =
            document.getElementById(
                "campaign-code-display"
            );

        if (!elemento) {
            return;
        }

        const campanha =
            campanhaAtual ||
            window.rpgCampaign?.obterCampanhaAtiva?.() ||
            window.rpgAuth?.campaign;

        if (campanha?.codigo_mesa) {
            elemento.textContent =
                campanha.codigo_mesa;
        }
    }

    /* =====================================================
       VERIFICAR MESA ATIVA
    ===================================================== */

    async function verificarMesaAtiva() {
        const usuario =
            obterUsuario();

        const mesaLocal =
            obterMesaAtivaLocal();

        if (!usuario || !mesaLocal?.campaignId) {
            mostrarEstadoInicial();
            return;
        }

        const supabase =
            obterSupabase();

        if (!supabase) {
            mostrarEstadoInicial();
            return;
        }

        try {
            const { data: campanha, error } =
                await supabase
                    .from("campaigns")
                    .select(`
                        id,
                        name,
                        master_id,
                        codigo_mesa,
                        created_at
                    `)
                    .eq(
                        "id",
                        mesaLocal.campaignId
                    )
                    .maybeSingle();

            if (
                error ||
                !campanha
            ) {
                limparMesaAtivaLocal();
                mostrarEstadoInicial();
                return;
            }

            const ehMestre =
                String(campanha.master_id) ===
                String(usuario.id);

            /*
             * Mestre:
             * basta a campanha existir e pertencer a ele.
             */
            if (ehMestre) {
                campanhaAtual =
                    campanha;

                atualizarAuth(
                    campanha,
                    true
                );

                mostrarCampanhaConectada();
                atualizarCodigoVisual();

                return;
            }

            /*
             * Jogador:
             * além da campanha existir, precisa continuar
             * registrado como membro.
             */
            const membro =
                await usuarioJaEhMembro(
                    campanha.id,
                    usuario.id
                );

            if (!membro) {
                limparMesaAtivaLocal();
                mostrarEstadoInicial();
                return;
            }

            campanhaAtual =
                campanha;

            atualizarAuth(
                campanha,
                false
            );

            mostrarCampanhaConectada();
            atualizarCodigoVisual();

        } catch (erro) {
            console.error(
                "[Mesa Entrada] Erro ao verificar mesa:",
                erro
            );

            mostrarEstadoInicial();
        }
    }

    /* =====================================================
       EVENTOS
    ===================================================== */

    function registrarEventos() {
        /*
         * Botão inicial:
         * ENTRAR NA MESA
         */
        const botaoAbrirCodigo =
            document.getElementById(
                "open-campaign-code-button"
            );

        if (botaoAbrirCodigo) {
            botaoAbrirCodigo.addEventListener(
                "click",
                mostrarFormularioCodigo
            );
        }

        /*
         * Confirmar código.
         */
        if (botaoEntrar) {
            botaoEntrar.addEventListener(
                "click",
                entrarPorCodigo
            );
        }

        /*
         * Enter no campo.
         */
        if (inputCodigo) {
            inputCodigo.addEventListener(
                "keydown",
                evento => {
                    if (
                        evento.key === "Enter"
                    ) {
                        evento.preventDefault();
                        entrarPorCodigo();
                    }
                }
            );

            inputCodigo.addEventListener(
                "input",
                () => {
                    inputCodigo.value =
                        normalizarCodigo(
                            inputCodigo.value
                        );
                }
            );
        }

        /*
         * Continuar como jogador.
         */
        if (botaoContinuarJogador) {
            botaoContinuarJogador.addEventListener(
                "click",
                continuarCampanha
            );
        }

        /*
         * Continuar como mestre.
         */
        if (botaoContinuarMestre) {
            botaoContinuarMestre.addEventListener(
                "click",
                continuarCampanha
            );
        }

        /*
         * Copiar código do mestre.
         */
        const botaoCopiar =
            document.getElementById(
                "copy-campaign-code"
            );

        if (botaoCopiar) {
            botaoCopiar.addEventListener(
                "click",
                copiarCodigoMesa
            );
        }
    }

    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function obterElementos() {
        inputCodigo =
            document.getElementById(
                "campaign-code-input"
            );

        botaoEntrar =
            document.getElementById(
                "join-campaign-button"
            );

        mensagem =
            document.getElementById(
                "campaign-join-message"
            );

        estadoInicial =
            document.getElementById(
                "campaign-join-start"
            );

        formularioCodigo =
            document.getElementById(
                "campaign-join-form-container"
            );

        estadoConectado =
            document.getElementById(
                "campaign-joined-state"
            );

        botaoContinuarJogador =
            document.getElementById(
                "continue-campaign-button-player"
            );

        botaoContinuarMestre =
            document.getElementById(
                "continue-campaign-button"
            );
    }

    async function inicializar() {
        obterElementos();

        registrarEventos();

        /*
         * Estado inicial enquanto verificamos
         * se já existe uma mesa conectada.
         */
        if (estadoInicial) {
            estadoInicial.hidden = false;
        }

        if (formularioCodigo) {
            formularioCodigo.hidden = true;
        }

        if (estadoConectado) {
            estadoConectado.hidden = true;
        }

        atualizarCodigoVisual();

        /*
         * O auth/campaign pode terminar de carregar
         * alguns instantes depois do DOM.
         */
        let tentativas = 0;

        const intervalo =
            setInterval(async () => {
                tentativas++;

                const usuario =
                    obterUsuario();

                if (usuario) {
                    clearInterval(
                        intervalo
                    );

                    await verificarMesaAtiva();
                    atualizarCodigoVisual();

                    return;
                }

                if (tentativas >= 40) {
                    clearInterval(
                        intervalo
                    );

                    mostrarEstadoInicial();
                }
            }, 250);
    }

    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.rpgMesaEntrada = {
        entrarPorCodigo,
        continuarCampanha,
        copiarCodigoMesa,
        mostrarFormularioCodigo,
        mostrarCampanhaConectada,
        verificarMesaAtiva,
        obterMesaAtivaLocal,
        limparMesaAtivaLocal
    };

    /*
     * Inicia quando o DOM estiver pronto.
     */
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
