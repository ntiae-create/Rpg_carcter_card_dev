/* =========================================================
   RPG CAMPAIGNS
   MÓDULO: CAMPAIGNS
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       ESTADO
    ===================================================== */

    window.rpgCampaign = {

        campaigns: [],

        activeCampaign: null,

        loaded: false

    };


    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    const INVITE_CHARACTERS =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    const INVITE_GROUP_SIZE = 4;

    const INVITE_GROUPS = 2;


    /* =====================================================
       GERAR CÓDIGO DE CONVITE
       
       Exemplo:
       A7K4-X92B
    ===================================================== */

    function gerarCodigoConvite() {

        let codigo = "";

        for (
            let i = 0;
            i < INVITE_GROUP_SIZE * INVITE_GROUPS;
            i++
        ) {

            const indice =
                Math.floor(
                    Math.random() *
                    INVITE_CHARACTERS.length
                );

            codigo +=
                INVITE_CHARACTERS[indice];

        }


        return (
            codigo.substring(0, INVITE_GROUP_SIZE) +
            "-" +
            codigo.substring(INVITE_GROUP_SIZE)
        );

    }


    /* =====================================================
       NORMALIZAR CÓDIGO
       
       Aceita:
       A7K4-X92B
       a7k4-x92b
       A7K4 X92B
    ===================================================== */

    function normalizarCodigoConvite(codigo) {

        if (!codigo) {

            return "";

        }


        return String(codigo)
            .toUpperCase()
            .replace(/\s+/g, "")
            .trim();

    }


    /* =====================================================
       GARANTIR CÓDIGO DE CONVITE
       
       Usado principalmente para campanhas antigas
       que foram criadas antes da existência do
       invite_code.
    ===================================================== */

    async function garantirCodigoConvite(campanha) {

        if (!campanha) {

            return null;

        }


        /*
           A campanha já possui código.
        */

        if (campanha.invite_code) {

            return campanha;

        }


        if (!window.supabaseClient) {

            console.error(
                "❌ Campaign.js: Supabase Client não encontrado."
            );

            return campanha;

        }


        /*
           Tenta gerar um código único.
        */

        for (let tentativa = 0; tentativa < 10; tentativa++) {

            const codigo =
                gerarCodigoConvite();


            const {
                data: existente,
                error: erroBusca
            } =
                await window.supabaseClient
                    .from("campaigns")
                    .select("id")
                    .eq(
                        "invite_code",
                        codigo
                    )
                    .maybeSingle();


            if (erroBusca) {

                console.error(
                    "❌ Campaign.js: erro verificando código:",
                    erroBusca
                );

                return campanha;

            }


            /*
               Código já utilizado.
            */

            if (existente) {

                continue;

            }


            /*
               Código livre.
            */

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("campaigns")
                    .update({

                        invite_code:
                            codigo

                    })
                    .eq(
                        "id",
                        campanha.id
                    )
                    .select(
                        "id, name, master_id, invite_code, created_at"
                    )
                    .single();


            if (error) {

                /*
                   Pode acontecer uma colisão rara
                   mesmo depois da verificação.
                */

                console.error(
                    "❌ Campaign.js: erro adicionando código:",
                    error
                );

                continue;

            }


            console.log(
                "🎟️ Código de convite criado:",
                data.invite_code
            );


            return data;

        }


        console.error(
            "❌ Campaign.js: não foi possível gerar código de convite."
        );


        return campanha;

    }


    /* =====================================================
       CARREGAR CAMPANHAS DO MESTRE
    ===================================================== */

    async function carregarCampanhas() {

        console.log(
            "📚 Campaign.js: iniciando carregamento..."
        );


        if (!window.supabaseClient) {

            console.error(
                "❌ Campaign.js: Supabase Client não encontrado."
            );

            return false;

        }


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


        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("campaigns")
                .select(
                    "id, name, master_id, invite_code, created_at"
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


        if (error) {

            console.error(
                "❌ Campaign.js: erro ao carregar campanhas:",
                error
            );

            return false;

        }


        /*
           Garante código para campanhas antigas.
        */

        const campanhasCarregadas =
            data || [];


        const campanhasAtualizadas = [];


        for (
            const campanha of campanhasCarregadas
        ) {

            const campanhaAtualizada =
                await garantirCodigoConvite(
                    campanha
                );


            campanhasAtualizadas.push(
                campanhaAtualizada
            );

        }


        window.rpgCampaign.campaigns =
            campanhasAtualizadas;


        window.rpgCampaign.loaded =
            true;


        /*
           Mantém a campanha anteriormente
           selecionada quando possível.
        */

        const campanhaAnterior =
            window.rpgCampaign.activeCampaign;


        if (campanhaAnterior) {

            const encontrada =
                campanhasAtualizadas.find(
                    campanha =>
                        campanha.id ===
                        campanhaAnterior.id
                );


            if (encontrada) {

                window.rpgCampaign.activeCampaign =
                    encontrada;

            }

        }


        /*
           Se ainda não existe campanha ativa,
           usa a primeira campanha do Mestre.
        */

        if (
            !window.rpgCampaign.activeCampaign &&
            campanhasAtualizadas.length > 0
        ) {

            window.rpgCampaign.activeCampaign =
                campanhasAtualizadas[0];

        }


        /*
           Se não existem campanhas,
           limpa a campanha ativa.
        */

        if (
            campanhasAtualizadas.length === 0
        ) {

            window.rpgCampaign.activeCampaign =
                null;

        }


        /*
           Sincroniza com rpgAuth.
        */

        sincronizarCampanhaAuth();


        console.log(
            "📚 Campaign.js: campanhas encontradas:",
            window.rpgCampaign.campaigns
        );


        console.log(
            "🎯 Campaign.js: campanha ativa:",
            window.rpgCampaign.activeCampaign
        );


        if (
            campanhasAtualizadas.length === 0
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


    /* =====================================================
       CAMPANHA ATIVA
    ===================================================== */

    function obterCampanhaAtiva() {

        return (
            window.rpgCampaign.activeCampaign ||
            null
        );

    }


    window.obterCampanhaAtiva =
        obterCampanhaAtiva;


    /* =====================================================
       TODAS AS CAMPANHAS
    ===================================================== */

    function obterCampanhas() {

        return [
            ...window.rpgCampaign.campaigns
        ];

    }


    window.obterCampanhas =
        obterCampanhas;


    /* =====================================================
       DEFINIR CAMPANHA ATIVA
    ===================================================== */

    function definirCampanhaAtiva(campanha) {

        if (!campanha) {

            window.rpgCampaign.activeCampaign =
                null;

            sincronizarCampanhaAuth();

            return null;

        }


        /*
           Permite receber:

           - objeto da campanha
           - ID da campanha
        */

        let encontrada = null;


        if (
            typeof campanha === "object"
        ) {

            encontrada =
                window.rpgCampaign.campaigns.find(
                    item =>
                        item.id === campanha.id
                ) || campanha;

        } else {

            encontrada =
                window.rpgCampaign.campaigns.find(
                    item =>
                        item.id === campanha
                );

        }


        if (!encontrada) {

            console.warn(
                "⚠️ Campaign.js: campanha não encontrada:",
                campanha
            );

            return null;

        }


        window.rpgCampaign.activeCampaign =
            encontrada;


        sincronizarCampanhaAuth();


        console.log(
            "🎯 Campaign.js: campanha ativa alterada:",
            encontrada
        );


        return encontrada;

    }


    window.definirCampanhaAtiva =
        definirCampanhaAtiva;


    /* =====================================================
       OBTER CÓDIGO DA CAMPANHA ATIVA
    ===================================================== */

    function obterCodigoConvite() {

        const campanha =
            obterCampanhaAtiva();


        if (!campanha) {

            return null;

        }


        return (
            campanha.invite_code ||
            null
        );

    }


    window.obterCodigoConvite =
        obterCodigoConvite;


    /* =====================================================
       SINCRONIZAR CAMPANHA COM RPG AUTH
       
       Isso resolve a diferença entre:

       rpgCampaign.activeCampaign

       e

       rpgAuth.campaign
    ===================================================== */

    function sincronizarCampanhaAuth() {

        if (!window.rpgAuth) {

            return;

        }


        window.rpgAuth.campaign =
            window.rpgCampaign.activeCampaign ||
            null;


        console.log(
            "🔗 Campaign.js: rpgAuth.campaign sincronizada:",
            window.rpgAuth.campaign
        );

    }


    /* =====================================================
       BUSCAR CAMPANHA PELO CÓDIGO
       
       A entrada do jogador será usada na próxima etapa.
       
       Esta função NÃO coloca o jogador na campanha.
       Apenas localiza a campanha.
    ===================================================== */

    async function buscarCampanhaPorCodigo(codigo) {

        const codigoNormalizado =
            normalizarCodigoConvite(
                codigo
            );


        if (!codigoNormalizado) {

            return {

                data: null,

                error: new Error(
                    "Código de campanha vazio."
                )

            };

        }


        if (!window.supabaseClient) {

            return {

                data: null,

                error: new Error(
                    "Supabase Client não encontrado."
                )

            };

        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("campaigns")
                    .select(
                        "id, name, master_id, invite_code, created_at"
                    )
                    .eq(
                        "invite_code",
                        codigoNormalizado
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "❌ Campaign.js: erro buscando campanha:",
                    error
                );

                return {

                    data: null,

                    error

                };

            }


            if (!data) {

                console.log(
                    "ℹ️ Campaign.js: nenhum campanha encontrada para:",
                    codigoNormalizado
                );

                return {

                    data: null,

                    error: null

                };

            }


            console.log(
                "🎯 Campaign.js: campanha encontrada:",
                data
            );


            return {

                data,

                error: null

            };

        } catch (error) {

            console.error(
                "❌ Campaign.js: falha ao buscar campanha:",
                error
            );


            return {

                data: null,

                error

            };

        }

    }


    window.buscarCampanhaPorCodigo =
        buscarCampanhaPorCodigo;


    /* =====================================================
       INICIAR CAMPAIGNS
    ===================================================== */

    async function iniciarCampanhas() {

        console.log(
            "🚀 Campaign.js carregado."
        );


        let tentativas = 0;

        const limite = 40;


        /*
           Espera o módulo de autenticação
           disponibilizar o usuário.
        */

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


        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            console.log(
                "ℹ️ Campaign.js: nenhum usuário disponível para carregar campanhas."
            );

            return;

        }


        await carregarCampanhas();

    }


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

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


    /* =====================================================
       API GLOBAL
    ===================================================== */

    window.carregarCampanhas =
        carregarCampanhas;


    window.garantirCodigoConvite =
        garantirCodigoConvite;


    window.gerarCodigoConvite =
        gerarCodigoConvite;


    window.normalizarCodigoConvite =
        normalizarCodigoConvite;


})();
