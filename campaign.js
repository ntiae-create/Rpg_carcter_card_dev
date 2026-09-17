/* =========================================================
   CAMPAIGN.JS
   SISTEMA DE CAMPANHAS / CÓDIGO DA MESA
========================================================= */

(() => {
    "use strict";

    window.rpgCampaign = {
        campaigns: [],
        activeCampaign: null,
        loaded: false
    };

    /* =====================================================
       NORMALIZAÇÃO
    ===================================================== */

    function normalizarCodigoMesa(codigo) {
        return String(codigo || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }

    /* =====================================================
       EVENTO DE CAMPANHA
    ===================================================== */

    function dispararEventoCampanha() {
        window.dispatchEvent(
            new CustomEvent("mesa:campanhaAlterada", {
                detail: {
                    campanha:
                        window.rpgCampaign.activeCampaign
                }
            })
        );
    }

    /* =====================================================
       CAMPANHAS
    ===================================================== */

    async function carregarCampanhas() {

        if (
            !window.supabase ||
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {
            return [];
        }

        const userId =
            window.rpgAuth.user.id;

        try {

            /*
             * Campanhas onde o usuário é MESTRE.
             */
            const {
                data: campanhasMestre,
                error: erroMestre
            } = await window.supabase
                .from("campaigns")
                .select(`
                    id,
                    name,
                    master_id,
                    codigo_mesa,
                    created_at
                `)
                .eq("master_id", userId);

            if (erroMestre) {
                console.error(
                    "[Campaign] Erro ao carregar campanhas do mestre:",
                    erroMestre
                );
            }

            /*
             * Campanhas onde o usuário é JOGADOR.
             */
            const {
                data: membros,
                error: erroMembros
            } = await window.supabase
                .from("campaign_members")
                .select("campaign_id")
                .eq("user_id", userId);

            if (erroMembros) {
                console.error(
                    "[Campaign] Erro ao carregar membros:",
                    erroMembros
                );
            }

            const idsCampanhasJogador =
                (membros || [])
                    .map(membro => membro.campaign_id)
                    .filter(Boolean);

            let campanhasJogador = [];

            if (
                idsCampanhasJogador.length > 0
            ) {

                const {
                    data,
                    error
                } = await window.supabase
                    .from("campaigns")
                    .select(`
                        id,
                        name,
                        master_id,
                        codigo_mesa,
                        created_at
                    `)
                    .in(
                        "id",
                        idsCampanhasJogador
                    );

                if (error) {
                    console.error(
                        "[Campaign] Erro ao carregar campanhas do jogador:",
                        error
                    );
                } else {
                    campanhasJogador =
                        data || [];
                }
            }

            /*
             * Junta as campanhas e remove duplicadas.
             */
            const mapa =
                new Map();

            [
                ...(campanhasMestre || []),
                ...campanhasJogador
            ].forEach(campanha => {

                if (campanha?.id) {
                    mapa.set(
                        campanha.id,
                        campanha
                    );
                }

            });

            const campanhas =
                Array.from(
                    mapa.values()
                );

            window.rpgCampaign.campaigns =
                campanhas;

            window.rpgCampaign.loaded =
                true;

            /*
             * IMPORTANTE:
             *
             * Carregar campanhas NÃO significa
             * selecionar uma delas.
             *
             * Se já houver uma campanha ativa,
             * tentamos mantê-la.
             *
             * Caso contrário, deixamos null.
             *
             * NÃO usamos mais campaigns[0].
             */
            const campanhaAnterior =
                window.rpgCampaign.activeCampaign;

            if (
                campanhaAnterior &&
                campanhas.some(
                    campanha =>
                        String(campanha.id) ===
                        String(campanhaAnterior.id)
                )
            ) {

                window.rpgCampaign.activeCampaign =
                    campanhas.find(
                        campanha =>
                            String(campanha.id) ===
                            String(campanhaAnterior.id)
                    );

            } else {

                window.rpgCampaign.activeCampaign =
                    null;
            }

            sincronizarCampanhaAuth();

            console.log(
                "[Campaign] Campanhas carregadas:",
                campanhas
            );

            return campanhas;

        } catch (erro) {

            console.error(
                "[Campaign] Erro inesperado:",
                erro
            );

            window.rpgCampaign.loaded =
                true;

            return [];
        }
    }

    /* =====================================================
       CAMPANHA ATIVA
    ===================================================== */

    function obterCampanhaAtiva() {
        return window.rpgCampaign.activeCampaign;
    }

    function obterCampanhas() {
        return (
            window.rpgCampaign.campaigns ||
            []
        );
    }

    function definirCampanhaAtiva(campanha) {

        if (!campanha) {

            window.rpgCampaign.activeCampaign =
                null;

            sincronizarCampanhaAuth();

            dispararEventoCampanha();

            return null;
        }

        window.rpgCampaign.activeCampaign =
            campanha;

        sincronizarCampanhaAuth();

        dispararEventoCampanha();

        console.log(
            "[Campaign] Campanha ativa:",
            campanha
        );

        return campanha;
    }

    /* =====================================================
       CÓDIGO DA MESA
    ===================================================== */

    function obterCodigoMesa(
        campanha = null
    ) {

        const alvo =
            campanha ||
            window.rpgCampaign.activeCampaign;

        if (!alvo) {
            return null;
        }

        return alvo.codigo_mesa || null;
    }

    async function buscarCampanhaPorCodigo(
        codigo
    ) {

        const codigoNormalizado =
            normalizarCodigoMesa(codigo);

        if (!codigoNormalizado) {
            return null;
        }

        if (!window.supabase) {

            console.error(
                "[Campaign] Supabase não disponível."
            );

            return null;
        }

        try {

            const {
                data,
                error
            } = await window.supabase
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
                    "[Campaign] Erro ao procurar código da mesa:",
                    error
                );

                return null;
            }

            return data || null;

        } catch (erro) {

            console.error(
                "[Campaign] Erro inesperado ao procurar mesa:",
                erro
            );

            return null;
        }
    }

    /* =====================================================
       SINCRONIZAÇÃO COM AUTH
    ===================================================== */

    function sincronizarCampanhaAuth() {

        if (!window.rpgAuth) {
            return;
        }

        window.rpgAuth.campaign =
            window.rpgCampaign.activeCampaign ||
            null;

        window.rpgAuth.campaigns =
            window.rpgCampaign.campaigns ||
            [];

        if (
            window.rpgAuth.user &&
            window.rpgAuth.campaign
        ) {

            window.rpgAuth.isMaster =
                String(
                    window.rpgAuth.campaign.master_id
                ) ===
                String(
                    window.rpgAuth.user.id
                );

        } else {

            window.rpgAuth.isMaster =
                false;
        }
    }

    /* =====================================================
       SELECIONAR CAMPANHA PELO ID
    ===================================================== */

    function encontrarCampanhaPorId(id) {

        if (!id) {
            return null;
        }

        return (
            window.rpgCampaign.campaigns ||
            []
        ).find(
            campanha =>
                String(campanha.id) ===
                String(id)
        ) || null;
    }

    async function selecionarCampanhaPorId(
        id
    ) {

        let campanha =
            encontrarCampanhaPorId(id);

        /*
         * Caso ainda não esteja carregada,
         * busca diretamente no Supabase.
         */
        if (
            !campanha &&
            window.supabase
        ) {

            const {
                data,
                error
            } = await window.supabase
                .from("campaigns")
                .select(`
                    id,
                    name,
                    master_id,
                    codigo_mesa,
                    created_at
                `)
                .eq("id", id)
                .maybeSingle();

            if (!error) {
                campanha =
                    data || null;
            }
        }

        if (!campanha) {
            return null;
        }

        definirCampanhaAtiva(
            campanha
        );

        return campanha;
    }

    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    async function inicializar() {

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {
            return;
        }

        await carregarCampanhas();
    }

    /*
     * Aguarda o auth.js.
     */
    let tentativas = 0;

    const intervaloInicializacao =
        setInterval(
            async () => {

                tentativas++;

                if (
                    window.rpgAuth &&
                    window.rpgAuth.user
                ) {

                    clearInterval(
                        intervaloInicializacao
                    );

                    await inicializar();

                    return;
                }

                if (
                    tentativas >= 40
                ) {

                    clearInterval(
                        intervaloInicializacao
                    );
                }

            },
            250
        );

    /* =====================================================
       API PÚBLICA
    ===================================================== */

    window.rpgCampaign.carregarCampanhas =
        carregarCampanhas;

    window.rpgCampaign.obterCampanhaAtiva =
        obterCampanhaAtiva;

    window.rpgCampaign.obterCampanhas =
        obterCampanhas;

    window.rpgCampaign.definirCampanhaAtiva =
        definirCampanhaAtiva;

    window.rpgCampaign.obterCodigoMesa =
        obterCodigoMesa;

    window.rpgCampaign.buscarCampanhaPorCodigo =
        buscarCampanhaPorCodigo;

    window.rpgCampaign.encontrarCampanhaPorId =
        encontrarCampanhaPorId;

    window.rpgCampaign.selecionarCampanhaPorId =
        selecionarCampanhaPorId;

    /*
     * Compatibilidade.
     */
    window.carregarCampanhas =
        carregarCampanhas;

    window.obterCampanhaAtiva =
        obterCampanhaAtiva;

    window.obterCodigoMesa =
        obterCodigoMesa;

    window.buscarCampanhaPorCodigo =
        buscarCampanhaPorCodigo;

    window.definirCampanhaAtiva =
        definirCampanhaAtiva;

})();
