// ==========================================
// CAMPANHAS — RPG CHARACTER CARD
// ==========================================

(function () {
    "use strict";


    // ==========================================
    // ESTADO DAS CAMPANHAS
    // ==========================================

    window.rpgCampaign = {

        campaigns: [],

        activeCampaign: null,

        loaded: false

    };


    // ==========================================
    // CARREGAR CAMPANHAS DO MESTRE
    // ==========================================

    async function carregarCampanhas() {

        console.log(
            "📚 Campaign.js: iniciando carregamento..."
        );


        // --------------------------------------
        // VERIFICAR SUPABASE
        // --------------------------------------

        if (!window.supabaseClient) {

            console.error(
                "❌ Campaign.js: Supabase Client não encontrado."
            );

            return false;
        }


        // --------------------------------------
        // VERIFICAR USUÁRIO
        // --------------------------------------

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            console.log(
                "ℹ️ Campaign.js: nenhum usuário logado."
            );

            return false;
        }


        const user =
            window.rpgAuth.user;


        console.log(
            "👤 Campaign.js: usuário encontrado:",
            user.id
        );


        // --------------------------------------
        // BUSCAR CAMPANHAS
        // --------------------------------------

        const { data, error } =
            await window.supabaseClient

                .from("campaigns")

                .select(
                    "id, name, master_id, created_at"
                )

                .eq(
                    "master_id",
                    user.id
                )

                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        // --------------------------------------
        // TRATAR ERRO
        // --------------------------------------

        if (error) {

            console.error(
                "❌ Campaign.js: erro ao carregar campanhas:",
                error
            );

            return false;
        }


        // --------------------------------------
        // SALVAR RESULTADO
        // --------------------------------------

        window.rpgCampaign.campaigns =
            data || [];


        window.rpgCampaign.loaded =
            true;


        // --------------------------------------
        // CAMPANHA PRINCIPAL
        // --------------------------------------

        if (
            window.rpgCampaign.campaigns.length > 0
        ) {

            window.rpgCampaign.activeCampaign =
                window.rpgCampaign.campaigns[0];

        } else {

            window.rpgCampaign.activeCampaign =
                null;
        }


        // --------------------------------------
        // RESULTADO NO CONSOLE
        // --------------------------------------

        console.log(
            "📚 Campaign.js: campanhas encontradas:",
            window.rpgCampaign.campaigns
        );


        console.log(
            "🎯 Campaign.js: campanha ativa:",
            window.rpgCampaign.activeCampaign
        );


        // --------------------------------------
        // NENHUMA CAMPANHA
        // --------------------------------------

        if (
            window.rpgCampaign.campaigns.length === 0
        ) {

            console.log(
                "ℹ️ Campaign.js: o usuário ainda não possui campanhas."
            );

        } else {

            console.log(
                "✅ Campaign.js: campanhas carregadas com sucesso."
            );

        }


        return true;
    }


    // ==========================================
    // OBTER CAMPANHA ATIVA
    // ==========================================

    function obterCampanhaAtiva() {

        return (
            window.rpgCampaign.activeCampaign
            || null
        );
    }


    window.obterCampanhaAtiva =
        obterCampanhaAtiva;


    // ==========================================
    // OBTER TODAS AS CAMPANHAS
    // ==========================================

    function obterCampanhas() {

        return [
            ...window.rpgCampaign.campaigns
        ];
    }


    window.obterCampanhas =
        obterCampanhas;


    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    async function iniciarCampanhas() {

        console.log(
            "🚀 Campaign.js carregado."
        );


        // --------------------------------------
        // ESPERAR AUTENTICAÇÃO
        // --------------------------------------

        let tentativas = 0;

        const limite = 40;


        while (
            tentativas < limite
        ) {

            if (
                window.rpgAuth &&
                window.rpgAuth.user
            ) {

                break;
            }


            await new Promise(
                function (resolve) {

                    setTimeout(
                        resolve,
                        250
                    );

                }
            );


            tentativas++;
        }


        // --------------------------------------
        // VERIFICAR RESULTADO
        // --------------------------------------

        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            console.log(
                "ℹ️ Campaign.js: nenhum usuário disponível para carregar campanhas."
            );

            return;
        }


        // --------------------------------------
        // CARREGAR
        // --------------------------------------

        await carregarCampanhas();

    }


    // ==========================================
    // DOM PRONTO
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarCampanhas
        );

    } else {

        iniciarCampanhas();

    }


    // ==========================================
    // EXPOR FUNÇÃO
    // ==========================================

    window.carregarCampanhas =
        carregarCampanhas;


})();
