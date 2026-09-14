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
        isMaster: false
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
                    lineHeight: "1.5"
                }
            );


            document.body.appendChild(
                elemento
            );

        }


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


        elemento.textContent =
            texto;

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

            const {
                data,
                error
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


            console.log(
                "Resultado da consulta campaigns:",
                {
                    data: data,
                    error: error
                }
            );


            // ==================================
            // ERRO
            // ==================================

            if (error) {

                console.error(
                    "❌ ERRO AO CONSULTAR CAMPAIGNS:",
                    error
                );


                mostrarDiagnostico(
                    `❌ Erro ao consultar campanhas: ${error.message}`,
                    "erro"
                );


                return false;
            }


            // ==================================
            // RESULTADO
            // ==================================

            window.rpgAuth.campaigns =
                data || [];


            console.log(
                "Quantidade de campanhas:",
                window.rpgAuth.campaigns.length
            );


            // ==================================
            // NENHUMA CAMPANHA
            // ==================================

            if (
                window.rpgAuth.campaigns.length === 0
            ) {

                window.rpgAuth.campaign =
                    null;


                window.rpgAuth.isMaster =
                    false;


                console.warn(
                    "⚠️ A consulta funcionou, mas retornou ZERO campanhas."
                );


                mostrarDiagnostico(
                    "⚠️ Usuário autenticado, mas a consulta retornou 0 campanhas.",
                    "aviso"
                );


                return true;
            }


            // ==================================
            // CAMPANHAS ENCONTRADAS
            // ==================================

            window.rpgAuth.isMaster =
                true;


            window.rpgAuth.campaign =
                window.rpgAuth.campaigns[0];


            console.log(
                "✅ CAMPANHAS ENCONTRADAS:",
                window.rpgAuth.campaigns
            );


            console.log(
                "✅ CAMPANHA SELECIONADA:",
                window.rpgAuth.campaign
            );


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


            window.rpgAuth.campaign =
                null;

            window.rpgAuth.campaigns =
                [];

            window.rpgAuth.isMaster =
                false;


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
