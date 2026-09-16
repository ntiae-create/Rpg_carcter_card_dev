"use strict";

/* =========================================================
   ENTRADA DA MESA RPG

   Fluxo:

   INDEX
      ↓
   CONTINUAR CAMPANHA
      ↓
   salva campanha selecionada
      ↓
   mesa.html
========================================================= */


(function () {

    const CHAVE_CAMPANHA =
        "rpg_campanha_mesa";


    /* =====================================================
       OBTER CAMPANHA ATIVA
    ===================================================== */

    function obterCampanha() {

        if (
            typeof window.obterCampanhaAtiva ===
            "function"
        ) {

            const campanha =
                window.obterCampanhaAtiva();

            if (campanha) {

                return campanha;

            }

        }


        if (
            window.rpgCampaign &&
            window.rpgCampaign.activeCampaign
        ) {

            return (
                window.rpgCampaign.activeCampaign
            );

        }


        return null;

    }


    /* =====================================================
       ENTRAR NA MESA
    ===================================================== */

    function entrarNaMesa() {

        const campanha =
            obterCampanha();


        if (!campanha) {

            mostrarMensagem(
                "⚠️ Nenhuma campanha foi selecionada."
            );

            return;

        }


        try {

            localStorage.setItem(
                CHAVE_CAMPANHA,
                JSON.stringify(campanha)
            );

        }

        catch (erro) {

            mostrarMensagem(
                "❌ Não foi possível salvar a campanha."
            );

            return;

        }


        mostrarMensagem(
            "🎲 Entrando na Mesa..."
        );


        setTimeout(
            function () {

                window.location.href =
                    "mesa.html";

            },
            300
        );

    }


    /* =====================================================
       MENSAGEM VISUAL
    ===================================================== */

    function mostrarMensagem(texto) {

        let elemento =
            document.getElementById(
                "mesa-entrada-mensagem"
            );


        if (!elemento) {

            elemento =
                document.createElement(
                    "div"
                );


            elemento.id =
                "mesa-entrada-mensagem";


            Object.assign(
                elemento.style,
                {

                    position: "fixed",

                    left: "50%",

                    bottom: "20px",

                    transform:
                        "translateX(-50%)",

                    zIndex: "999999",

                    width:
                        "min(90vw, 420px)",

                    padding: "13px 16px",

                    borderRadius: "12px",

                    background:
                        "rgba(11, 9, 16, 0.97)",

                    border:
                        "1px solid #8b5cf6",

                    boxShadow:
                        "0 0 20px rgba(139,92,246,0.35)",

                    color: "#e9d5ff",

                    textAlign: "center",

                    fontFamily:
                        "Arial, sans-serif",

                    fontSize: "12px",

                    fontWeight: "bold"

                }

            );


            document.body.appendChild(
                elemento
            );

        }


        elemento.textContent =
            texto;

    }


    /* =====================================================
       LOCALIZAR BOTÃO
    ===================================================== */

    function procurarBotao() {

        const botoes =
            document.querySelectorAll(
                "button"
            );


        botoes.forEach(
            function (botao) {

                const texto =
                    (
                        botao.textContent ||
                        ""
                    )
                    .trim()
                    .toUpperCase();


                if (
                    texto.includes(
                        "CONTINUAR CAMPANHA"
                    )
                ) {

                    if (
                        botao.dataset.mesaEntradaConfigurada ===
                        "true"
                    ) {

                        return;

                    }


                    botao.dataset.mesaEntradaConfigurada =
                        "true";


                    botao.addEventListener(
                        "click",
                        function (evento) {

                            evento.preventDefault();

                            evento.stopImmediatePropagation();

                            entrarNaMesa();

                        },
                        true
                    );

                }

            }
        );

    }


    /* =====================================================
       OBSERVAR A PÁGINA

       O botão é criado dinamicamente pelo
       sistema da ficha, então precisamos
       observá-lo.
    ===================================================== */

    function iniciar() {

        procurarBotao();


        const observador =
            new MutationObserver(
                function () {

                    procurarBotao();

                }
            );


        observador.observe(
            document.body,
            {

                childList: true,

                subtree: true

            }
        );

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
            iniciar
        );

    }

    else {

        iniciar();

    }


    /* =====================================================
       API
    ===================================================== */

    window.rpgMesaEntrada = {

        entrar:
            entrarNaMesa,

        obterCampanha:
            obterCampanha

    };


})();
