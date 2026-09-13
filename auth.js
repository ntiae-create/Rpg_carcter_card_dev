// ==========================================
// AUTENTICAÇÃO — RPG CHARACTER CARD
// ==========================================

(function () {
    "use strict";

    function mostrarMensagem(texto, sucesso = false) {
        const mensagem = document.getElementById("auth-message");

        if (!mensagem) return;

        mensagem.textContent = texto;
        mensagem.style.color = sucesso ? "#86efac" : "#fca5a5";
    }

    async function entrarComEmailSenha(email, senha) {

        if (!window.supabaseClient) {
            mostrarMensagem("Supabase não está disponível.");
            return false;
        }

        if (!email || !senha) {
            mostrarMensagem("Preencha e-mail e senha.");
            return false;
        }

        mostrarMensagem("Entrando...");

        const { data, error } =
            await window.supabaseClient.auth.signInWithPassword({
                email: email.trim(),
                password: senha
            });

        if (error) {
            console.error("Erro de autenticação:", error);
            mostrarMensagem(
                "Não foi possível entrar. Verifique e-mail e senha."
            );
            return false;
        }

        console.log("Usuário autenticado:", data.user);

        mostrarMensagem(
            "Login realizado com sucesso!",
            true
        );

        return true;
    }

    window.entrarComEmailSenha = entrarComEmailSenha;


    // ==========================================
    // PAINEL DE LOGIN
    // ==========================================

    function criarPainelLogin() {

        if (document.getElementById("auth-login-panel")) {
            return;
        }

        const painel = document.createElement("div");

        painel.id = "auth-login-panel";

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

        Object.assign(painel.style, {
            position: "fixed",
            inset: "0",
            zIndex: "99999",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(5, 4, 9, 0.94)",
            fontFamily: "Arial, sans-serif"
        });

        document.body.appendChild(painel);


        const botao =
            document.getElementById("auth-login-button");

        const email =
            document.getElementById("auth-email");

        const senha =
            document.getElementById("auth-password");


        botao.addEventListener("click", async function () {

            const sucesso =
                await entrarComEmailSenha(
                    email.value,
                    senha.value
                );

            if (sucesso) {
                painel.remove();
            }

        });


        senha.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {
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


        const { data } =
            await window.supabaseClient.auth.getSession();


        if (data.session) {

            console.log(
                "Sessão existente encontrada."
            );

            return;
        }


        criarPainelLogin();
    }


    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            iniciarAutenticacao
        );

    } else {

        iniciarAutenticacao();

    }

})();
