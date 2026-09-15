// ==========================================
// AUTENTICAÇÃO — RPG CHARACTER CARD
// ==========================================

(function () {
    "use strict";


    // ==========================================
    // ESTADO DA AUTENTICAÇÃO
    // ==========================================

    window.rpgAuth = {
        user: null,
        session: null,
        campaign: null,
        campaigns: [],
        isMaster: false,

        // ==================================
        // NOVOS DADOS DA CAMPANHA
        // ==================================

        campaignMembers: [],
        campaignCharacters: []
    };


    // ==========================================
    // MENSAGEM DE LOGIN
    // ==========================================

    function mostrarMensagem(texto, sucesso = false) {

        const mensagem =
            document.getElementById("auth-message");

        if (!mensagem) return;

        mensagem.textContent =
            texto;

        mensagem.style.color =
            sucesso
                ? "#86efac"
                : "#fca5a5";
    }


    // ==========================================
    // DIAGNÓSTICO VISUAL
    // ==========================================

    function mostrarDiagnostico(texto, tipo = "info") {

        let elemento =
            document.getElementById(
                "auth-diagnostic"
            );


        if (!elemento) {

            elemento =
                document.createElement("div");


            elemento.id =
                "auth-diagnostic";


            Object.assign(
                elemento.style,
                {
                    position: "fixed",
                    bottom: "15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: "99999",
                    width: "min(92vw, 520px)",
                    padding: "12px 15px",
                    borderRadius: "12px",
                    background: "rgba(11, 9, 16, 0.97)",
                    border: "1px solid #6f3aa8",
                    boxShadow:
                        "0 0 20px rgba(124, 58, 237, 0.30)",
                    textAlign: "center",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    opacity: "1",
                    transition: "opacity 0.4s ease"
                }
            );


            document.body.appendChild(
                elemento
            );

        }


        // ==================================
        // CANCELAR REMOÇÃO ANTERIOR
        // ==================================

        if (elemento._diagnosticoTimer) {

            clearTimeout(
                elemento._diagnosticoTimer
            );

        }


        // ==================================
        // DEFINIR COR
        // ==================================

        if (tipo === "sucesso") {

            elemento.style.color =
                "#86efac";

        }

        else if (tipo === "erro") {

            elemento.style.color =
                "#fca5a5";

        }

        else if (tipo === "aviso") {

            elemento.style.color =
                "#fde68a";

        }

        else {

            elemento.style.color =
                "#c4b5fd";

        }


        // ==================================
        // MOSTRAR
        // ==================================

        elemento.style.opacity =
            "1";

        elemento.textContent =
            texto;


        // ==================================
        // TEMPO DE EXIBIÇÃO
        // ==================================

        let tempo = 3000;


        if (tipo === "erro") {

            tempo = 6000;

        }

        else if (tipo === "aviso") {

            tempo = 4500;

        }

        else if (tipo === "info") {

            tempo = 2500;

        }


        // ==================================
        // REMOVER AUTOMATICAMENTE
        // ==================================

        elemento._diagnosticoTimer =
            setTimeout(
                function () {

                    elemento.style.opacity =
                        "0";


                    setTimeout(
                        function () {

                            if (
                                elemento &&
                                elemento.parentNode
                            ) {

                                elemento.remove();

                            }

                        },
                        400
                    );

                },
                tempo
            );

    }


    // ==========================================
    // LIMPAR DADOS DA CAMPANHA
    // ==========================================

    function limparDadosCampanha() {

        window.rpgAuth.campaign =
            null;

        window.rpgAuth.campaigns =
            [];

        window.rpgAuth.isMaster =
            false;

        window.rpgAuth.campaignMembers =
            [];

        window.rpgAuth.campaignCharacters =
            [];

    }


    // ==========================================
    // CARREGAR MEMBROS DA CAMPANHA
    // ==========================================

    async function carregarMembrosCampanha(
        campaignId
    ) {

        if (!window.supabaseClient) {

            console.error(
                "❌ Supabase Client não encontrado ao carregar membros."
            );

            return false;
        }


        if (!campaignId) {

            console.warn(
                "⚠️ Campaign ID não informado."
            );

            window.rpgAuth.campaignMembers =
                [];

            return false;
        }


        console.log(
            "========== CARREGANDO MEMBROS DA CAMPANHA =========="
        );


        console.log(
            "Campaign ID:",
            campaignId
        );


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("campaign_members")
                    .select(
                        "id, campaign_id, user_id"
                    )
                    .eq(
                        "campaign_id",
                        campaignId
                    );


            console.log(
                "Resultado campaign_members:",
                {
                    data: data,
                    error: error
                }
            );


            if (error) {

                console.error(
                    "❌ ERRO AO CONSULTAR CAMPAIGN_MEMBERS:",
                    error
                );


                mostrarDiagnostico(
                    `❌ Erro ao carregar jogadores: ${error.message}`,
                    "erro"
                );


                window.rpgAuth.campaignMembers =
                    [];

                return false;
            }


            window.rpgAuth.campaignMembers =
                data || [];


            console.log(
                "✅ Membros encontrados:",
                window.rpgAuth.campaignMembers
            );


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR MEMBROS:",
                error
            );


            window.rpgAuth.campaignMembers =
                [];

            return false;
        }

    }


    // ==========================================
    // CARREGAR PERSONAGENS DA CAMPANHA
    // ==========================================

    async function carregarPersonagensCampanha(
        campaignId
    ) {

        if (!window.supabaseClient) {

            console.error(
                "❌ Supabase Client não encontrado ao carregar personagens."
            );

            return false;
        }


        if (!campaignId) {

            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }


        console.log(
            "========== CARREGANDO PERSONAGENS DA CAMPANHA =========="
        );


        // ==================================
        // OBTER IDS DOS MEMBROS
        // ==================================

        const membros =
            window.rpgAuth.campaignMembers || [];


        const userIds =
            membros
                .map(
                    membro =>
                        membro.user_id
                )
                .filter(
                    id =>
                        !!id
                );


        // ==================================
        // GARANTIR QUE O MESTRE TAMBÉM
        // POSSA SER ENCONTRADO
        // ==================================

        if (
            window.rpgAuth.campaign &&
            window.rpgAuth.campaign.master_id
        ) {

            if (
                !userIds.includes(
                    window.rpgAuth.campaign.master_id
                )
            ) {

                userIds.push(
                    window.rpgAuth.campaign.master_id
                );

            }

        }


        console.log(
            "Usuários que serão consultados:",
            userIds
        );


        // ==================================
        // NENHUM USUÁRIO
        // ==================================

        if (
            userIds.length === 0
        ) {

            window.rpgAuth.campaignCharacters =
                [];

            console.warn(
                "⚠️ Nenhum usuário encontrado para consultar personagens."
            );

            return true;
        }


        try {

            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("characters")
                    .select("*")
                    .eq(
                        "campaign_id",
                        campaignId
                    )
                    .in(
                        "user_id",
                        userIds
                    );


            console.log(
                "Resultado characters:",
                {
                    data: data,
                    error: error
                }
            );


            if (error) {

                console.error(
                    "❌ ERRO AO CONSULTAR CHARACTERS:",
                    error
                );


                mostrarDiagnostico(
                    `❌ Erro ao carregar personagens: ${error.message}`,
                    "erro"
                );


                window.rpgAuth.campaignCharacters =
                    [];

                return false;
            }


            window.rpgAuth.campaignCharacters =
                data || [];


            console.log(
                "✅ Personagens encontrados:",
                window.rpgAuth.campaignCharacters
            );


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR PERSONAGENS:",
                error
            );


            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }

    }


    // ==========================================
    // CARREGAR DADOS COMPLETOS DA CAMPANHA
    // ==========================================

    async function carregarDadosCampanha() {

        if (
            !window.rpgAuth.campaign
        ) {

            window.rpgAuth.campaignMembers =
                [];

            window.rpgAuth.campaignCharacters =
                [];

            return false;
        }


        const campaignId =
            window.rpgAuth.campaign.id;


        const membrosCarregados =
            await carregarMembrosCampanha(
                campaignId
            );


        if (!membrosCarregados) {

            return false;
        }


        await carregarPersonagensCampanha(
            campaignId
        );


        console.log(
            "=========================================="
        );

        console.log(
            "📋 DADOS DA CAMPANHA PRONTOS"
        );

        console.log(
            "Campanha:",
            window.rpgAuth.campaign
        );

        console.log(
            "Membros:",
            window.rpgAuth.campaignMembers
        );

        console.log(
            "Personagens:",
            window.rpgAuth.campaignCharacters
        );

        console.log(
            "=========================================="
        );


        return true;

    }


    // ==========================================
    // CARREGAR CAMPANHAS DO USUÁRIO
    // ==========================================

    async function carregarCampanhas(user) {

        console.log(
            "========== CARREGANDO CAMPANHAS =========="
        );


        if (!window.supabaseClient) {

            console.error(
                "❌ Supabase Client não encontrado."
            );


            mostrarDiagnostico(
                "❌ Supabase Client não encontrado.",
                "erro"
            );


            return false;
        }


        if (!user) {

            console.error(
                "❌ Usuário não encontrado."
            );


            mostrarDiagnostico(
                "❌ Usuário não encontrado.",
                "erro"
            );


            return false;
        }


        console.log(
            "Usuário:",
            user
        );


        console.log(
            "ID do usuário:",
            user.id
        );


        mostrarDiagnostico(
            "🔎 Usuário encontrado. Consultando campanhas...",
            "info"
        );


        try {

            // ==================================
            // 1. CAMPANHAS ONDE É MESTRE
            // ==================================

            const {
                data: campanhasMestre,
                error: erroMestre
            } =
                await window.supabaseClient
                    .from("campaigns")
                    .select(
                        "id, name, master_id, created_at"
                    )
                    .eq(
                        "master_id",
                        user.id
                    );


            if (erroMestre) {

                console.error(
                    "❌ ERRO AO CONSULTAR CAMPANHAS DO MESTRE:",
                    erroMestre
                );


                mostrarDiagnostico(
                    `❌ Erro ao consultar campanhas: ${erroMestre.message}`,
                    "erro"
                );


                return false;
            }


            console.log(
                "Campanhas onde é Mestre:",
                campanhasMestre
            );


            // ==================================
            // 2. CAMPANHAS ONDE É MEMBRO
            // ==================================

            const {
                data: participacoes,
                error: erroParticipacoes
            } =
                await window.supabaseClient
                    .from("campaign_members")
                    .select(
                        "id, campaign_id, user_id"
                    )
                    .eq(
                        "user_id",
                        user.id
                    );


            if (erroParticipacoes) {

                console.error(
                    "❌ ERRO AO CONSULTAR PARTICIPAÇÕES:",
                    erroParticipacoes
                );


                mostrarDiagnostico(
                    `❌ Erro ao consultar participações: ${erroParticipacoes.message}`,
                    "erro"
                );


                return false;
            }


            console.log(
                "Participações do usuário:",
                participacoes
            );


            // ==================================
            // 3. IDS DAS CAMPANHAS DOS MEMBROS
            // ==================================

            const campaignIds =
                (participacoes || [])
                    .map(
                        membro =>
                            membro.campaign_id
                    )
                    .filter(
                        id =>
                            !!id
                    );


            // ==================================
            // 4. BUSCAR CAMPANHAS DOS MEMBROS
            // ==================================

            let campanhasMembro =
                [];


            if (
                campaignIds.length > 0
            ) {

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .from("campaigns")
                        .select(
                            "id, name, master_id, created_at"
                        )
                        .in(
                            "id",
                            campaignIds
                        );


                if (error) {

                    console.error(
                        "❌ ERRO AO CONSULTAR CAMPANHAS DOS MEMBROS:",
                        error
                    );


                    mostrarDiagnostico(
                        `❌ Erro ao consultar campanhas: ${error.message}`,
                        "erro"
                    );


                    return false;
                }


                campanhasMembro =
                    data || [];

            }


            console.log(
                "Campanhas onde participa:",
                campanhasMembro
            );


            // ==================================
            // 5. JUNTAR CAMPANHAS
            // ==================================

            const todasCampanhas = [
                ...(campanhasMestre || []),
                ...(campanhasMembro || [])
            ];


            // ==================================
            // REMOVER DUPLICADAS
            // ==================================

            const campanhasUnicas =
                [];


            const idsAdicionados =
                new Set();


            for (
                const campanha
                of todasCampanhas
            ) {

                if (
                    !campanha ||
                    !campanha.id
                ) {

                    continue;
                }


                if (
                    idsAdicionados.has(
                        campanha.id
                    )
                ) {

                    continue;
                }


                idsAdicionados.add(
                    campanha.id
                );


                campanhasUnicas.push(
                    campanha
                );

            }


            window.rpgAuth.campaigns =
                campanhasUnicas;


            console.log(
                "Quantidade total de campanhas:",
                window.rpgAuth.campaigns.length
            );


            // ==================================
            // NENHUMA CAMPANHA
            // ==================================

            if (
                window.rpgAuth.campaigns.length === 0
            ) {

                limparDadosCampanha();


                console.warn(
                    "⚠️ Usuário autenticado, mas não pertence a nenhuma campanha."
                );


                mostrarDiagnostico(
                    "⚠️ Usuário autenticado, mas nenhuma campanha foi encontrada.",
                    "aviso"
                );


                return true;
            }


            // ==================================
            // SELECIONAR CAMPANHA
            // ==================================

            window.rpgAuth.campaign =
                window.rpgAuth.campaigns[0];


            // ==================================
            // VERIFICAR SE É MESTRE
            // ==================================

            window.rpgAuth.isMaster =
                window.rpgAuth.campaign.master_id ===
                user.id;


            console.log(
                "✅ CAMPANHAS ENCONTRADAS:",
                window.rpgAuth.campaigns
            );


            console.log(
                "✅ CAMPANHA SELECIONADA:",
                window.rpgAuth.campaign
            );


            console.log(
                "👑 É Mestre:",
                window.rpgAuth.isMaster
            );


            // ==================================
            // CARREGAR JOGADORES E PERSONAGENS
            // ==================================

            await carregarDadosCampanha();


            mostrarDiagnostico(
                `✅ Campanha encontrada: ${window.rpgAuth.campaign.name}`,
                "sucesso"
            );


            return true;

        }

        catch (error) {

            console.error(
                "❌ EXCEÇÃO AO CARREGAR CAMPANHAS:",
                error
            );


            mostrarDiagnostico(
                `❌ Falha ao carregar campanhas: ${error.message}`,
                "erro"
            );


            return false;
        }

    }


    // ==========================================
    // ATUALIZAR ESTADO DA SESSÃO
    // ==========================================

    async function atualizarEstadoSessao(session) {

        console.log(
            "========== ATUALIZANDO SESSÃO =========="
        );


        window.rpgAuth.session =
            session || null;


        window.rpgAuth.user =
            session?.user || null;


        if (!session?.user) {

            console.log(
                "Nenhuma sessão ativa."
            );


            limparDadosCampanha();


            return;
        }


        console.log(
            "Sessão ativa para:",
            session.user.email
        );


        await carregarCampanhas(
            session.user
        );

    }


    // ==========================================
    // LOGIN
    // ==========================================

    async function entrarComEmailSenha(
        email,
        senha
    ) {

        if (!window.supabaseClient) {

            mostrarMensagem(
                "Supabase não está disponível."
            );

            return false;
        }


        if (!email || !senha) {

            mostrarMensagem(
                "Preencha e-mail e senha."
            );

            return false;
        }


        mostrarMensagem(
            "Entrando..."
        );


        const {
            data,
            error
        } =
            await window.supabaseClient.auth
                .signInWithPassword({

                    email:
                        email.trim(),

                    password:
                        senha

                });


        if (error) {

            console.error(
                "Erro de autenticação:",
                error
            );


            mostrarMensagem(
                "Não foi possível entrar. Verifique e-mail e senha."
            );


            return false;
        }


        console.log(
            "Usuário autenticado:",
            data.user
        );


        await atualizarEstadoSessao(
            data.session
        );


        mostrarMensagem(
            "Login realizado com sucesso!",
            true
        );


        return true;

    }


    window.entrarComEmailSenha =
        entrarComEmailSenha;


    // ==========================================
    // PAINEL DE LOGIN
    // ==========================================

    function criarPainelLogin() {

        if (
            document.getElementById(
                "auth-login-panel"
            )
        ) {

            return;

        }


        const painel =
            document.createElement("div");


        painel.id =
            "auth-login-panel";


        painel.innerHTML = `

            <div style="
                width: min(92vw, 380px);
                padding: 28px;
                border-radius: 20px;
                background:
                    linear-gradient(
                        160deg,
                        #171020,
                        #0b0910
                    );
                border: 1px solid #6f3aa8;
                box-shadow:
                    0 0 35px
                    rgba(124, 58, 237, 0.30);
                color: #f5f0ff;
                text-align: center;
            ">

                <h2 style="
                    margin: 0 0 8px;
                ">
                    RPG CHARACTER CARD
                </h2>

                <p style="
                    margin: 0 0 22px;
                    color: #aaa0bd;
                ">
                    Entre na sua conta
                </p>

                <input
                    id="auth-email"
                    type="email"
                    autocomplete="email"
                    placeholder="E-mail"
                    style="
                        width: 100%;
                        box-sizing: border-box;
                        padding: 12px;
                        margin-bottom: 10px;
                        border: 1px solid #68408a;
                        border-radius: 10px;
                        background: #100b18;
                        color: #f5f0ff;
                        outline: none;
                    "
                >

                <input
                    id="auth-password"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Senha"
                    style="
                        width: 100%;
                        box-sizing: border-box;
                        padding: 12px;
                        margin-bottom: 14px;
                        border: 1px solid #68408a;
                        border-radius: 10px;
                        background: #100b18;
                        color: #f5f0ff;
                        outline: none;
                    "
                >

                <button
                    id="auth-login-button"
                    type="button"
                    style="
                        width: 100%;
                        padding: 12px;
                        border: 1px solid #8b5cf6;
                        border-radius: 10px;
                        background: #241633;
                        color: #f5f0ff;
                        font-weight: bold;
                        cursor: pointer;
                    "
                >
                    ENTRAR
                </button>

                <p
                    id="auth-message"
                    style="
                        min-height: 18px;
                        margin: 14px 0 0;
                        font-size: 12px;
                        color: #8f839d;
                    "
                ></p>

            </div>
        `;


        Object.assign(
            painel.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "99999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "rgba(5, 4, 9, 0.94)",
                fontFamily: "Arial, sans-serif"
            }
        );


        document.body.appendChild(
            painel
        );


        const botao =
            document.getElementById(
                "auth-login-button"
            );


        const email =
            document.getElementById(
                "auth-email"
            );


        const senha =
            document.getElementById(
                "auth-password"
            );


        botao.addEventListener(
            "click",
            async function () {

                const sucesso =
                    await entrarComEmailSenha(
                        email.value,
                        senha.value
                    );


                if (sucesso) {

                    painel.remove();

                }

            }
        );


        senha.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    botao.click();

                }

            }
        );


        email.focus();

    }


    // ==========================================
    // INICIAR AUTENTICAÇÃO
    // ==========================================

    async function iniciarAutenticacao() {

        console.log(
            "========== INICIANDO AUTENTICAÇÃO =========="
        );


        if (!window.supabaseClient) {

            console.error(
                "Supabase Client não encontrado."
            );


            mostrarDiagnostico(
                "❌ Supabase Client não encontrado.",
                "erro"
            );


            return;

        }


        const {
            data,
            error
        } =
            await window.supabaseClient.auth
                .getSession();


        if (error) {

            console.error(
                "Erro ao recuperar sessão:",
                error
            );


            mostrarDiagnostico(
                `❌ Erro ao recuperar sessão: ${error.message}`,
                "erro"
            );


            criarPainelLogin();


            return;

        }


        if (data.session) {

            console.log(
                "Sessão existente encontrada."
            );


            await atualizarEstadoSessao(
                data.session
            );


            return;

        }


        console.log(
            "Nenhuma sessão encontrada."
        );


        criarPainelLogin();

    }


    // ==========================================
    // OBSERVAR ALTERAÇÕES DE AUTENTICAÇÃO
    // ==========================================

    window.supabaseClient?.auth
        .onAuthStateChange(
            function (
                event,
                session
            ) {

                console.log(
                    "Evento de autenticação:",
                    event
                );


                /*
                   Não usamos await diretamente
                   dentro do callback do Supabase.

                   Colocamos o processamento em
                   uma tarefa separada.
                */

                setTimeout(
                    () => {

                        atualizarEstadoSessao(
                            session
                        );

                    },
                    0
                );

            }
        );


    // ==========================================
    // FUNÇÕES PÚBLICAS
    // ==========================================

    window.obterMembrosCampanha =
        function () {

            return (
                window.rpgAuth
                    .campaignMembers || []
            );

        };


    window.obterPersonagensCampanha =
        function () {

            return (
                window.rpgAuth
                    .campaignCharacters || []
            );

        };


    window.obterCampanhaAtual =
        function () {

            return (
                window.rpgAuth
                    .campaign || null
            );

        };


    window.usuarioEhMestre =
        function () {

            return (
                window.rpgAuth
                    .isMaster === true
            );

        };


    window.recarregarDadosCampanha =
        carregarDadosCampanha;


    // ==========================================
    // INICIAR QUANDO O DOM ESTIVER PRONTO
    // ==========================================

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarAutenticacao
        );

    }

    else {

        iniciarAutenticacao();

    }

})();
