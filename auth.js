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

        mensagem.textContent = texto;

        mensagem.style.color =
            sucesso
                ? "#86efac"
                : "#fca5a5";
    }


    // ==========================================
    // CARREGAR CAMPANHAS DO USUÁRIO
    // ==========================================

    async function carregarCampanhas(user) {

        if (!window.supabaseClient) {
            console.error(
                "Supabase Client não encontrado."
            );

            return false;
        }

        if (!user) {
            return false;
        }

        try {

            const { data, error } =
                await window.supabaseClient
                    .from("campaigns")
                    .select(
                        "id, name, master_id, created_at"
                    )
                    .eq("master_id", user.id);

            if (error) {

                console.error(
                    "Erro ao carregar campanhas:",
                    error
                );

                return false;
            }


            window.rpgAuth.campaigns =
                data || [];


            window.rpgAuth.isMaster =
                window.rpgAuth.campaigns.length > 0;


            // ==================================
            // CAMPANHA PRINCIPAL
            // ==================================

            if (window.rpgAuth.campaigns.length > 0) {

                window.rpgAuth.campaign =
                    window.rpgAuth.campaigns[0];

            } else {

                window.rpgAuth.campaign = null;
            }


            console.log(
                "Campanhas do usuário:",
                window.rpgAuth.campaigns
            );


            console.log(
                "Campanha selecionada:",
                window.rpgAuth.campaign
            );


            console.log(
                "Usuário é Mestre:",
                window.rpgAuth.isMaster
            );


            return true;

        } catch (error) {

            console.error(
                "Falha ao carregar campanhas:",
                error
            );

            return false;
        }
    }


    // ==========================================
    // ATUALIZAR ESTADO DA SESSÃO
    // ==========================================

    async function atualizarEstadoSessao(session) {

        window.rpgAuth.session =
            session || null;

        window.rpgAuth.user =
            session?.user || null;


        if (!session?.user) {

            window.rpgAuth.campaign = null;
            window.rpgAuth.campaigns = [];
            window.rpgAuth.isMaster = false;

            return;
        }


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


        const { data, error } =
            await window.supabaseClient.auth
                .signInWithPassword({

                    email: email.trim(),

                    password: senha

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

        if (!window.supabaseClient) {

            console.error(
                "Supabase Client não encontrado."
            );

            return;
        }


        const { data, error } =
            await window.supabaseClient.auth
                .getSession();


        if (error) {

            console.error(
                "Erro ao recuperar sessão:",
                error
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


        criarPainelLogin();
    }


    // ==========================================
    // OBSERVAR ALTERAÇÕES DE AUTENTICAÇÃO
    // ==========================================

    window.supabaseClient?.auth
        .onAuthStateChange(
            async function (
                event,
                session
            ) {

                console.log(
                    "Evento de autenticação:",
                    event
                );


                await atualizarEstadoSessao(
                    session
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

    } else {

        iniciarAutenticacao();

    }

})();
