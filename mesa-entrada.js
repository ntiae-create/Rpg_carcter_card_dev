"use strict";

/* =========================================================
   ENTRADA DA MESA RPG

   FLUXOS:

   MESTRE
      ↓
   CONTINUAR CAMPANHA
      ↓
   mesa.html

   JOGADOR
      ↓
   código da sala
      ↓
   encontra campanha
      ↓
   encontra personagem
      ↓
   atribui slot 1–8
      ↓
   mesa.html
========================================================= */

(function () {

    const CHAVE_CAMPANHA = "rpg_campanha_mesa";

    const MAX_SLOTS = 8;


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function mostrarMensagem(texto) {

        let elemento =
            document.getElementById(
                "mesa-entrada-mensagem"
            );


        if (!elemento) {

            elemento =
                document.createElement("div");

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

                    padding: "14px 16px",

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

                    fontSize: "13px",

                    fontWeight: "bold"

                }
            );


            document.body.appendChild(
                elemento
            );

        }


        elemento.textContent = texto;


        clearTimeout(
            elemento._timer
        );


        elemento._timer =
            setTimeout(
                function () {

                    if (elemento) {
                        elemento.remove();
                    }

                },
                3500
            );

    }


    function normalizarCodigo(codigo) {

        return String(codigo || "")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

    }


    function formatarCodigo(codigo) {

        const limpo =
            normalizarCodigo(codigo)
                .slice(0, 8);

        if (limpo.length <= 4) {
            return limpo;
        }

        return (
            limpo.slice(0, 4) +
            "-" +
            limpo.slice(4)
        );

    }


    /* =====================================================
       CAMPANHA ATIVA
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
       SALVAR CAMPANHA LOCALMENTE
    ===================================================== */

    function salvarCampanha(campanha) {

        try {

            localStorage.setItem(
                CHAVE_CAMPANHA,
                JSON.stringify(campanha)
            );

            return true;

        }

        catch (erro) {

            console.error(
                "Erro ao salvar campanha:",
                erro
            );

            return false;

        }

    }


    /* =====================================================
       CONTINUAR CAMPANHA — MESTRE
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


        if (
            !salvarCampanha(campanha)
        ) {

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
       BUSCAR CAMPANHA PELO CÓDIGO
    ===================================================== */

    async function buscarCampanhaPorCodigo(codigo) {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        const codigoNormalizado =
            normalizarCodigo(codigo);


        if (
            codigoNormalizado.length !== 8
        ) {

            throw new Error(
                "O código deve ter 8 caracteres."
            );

        }


        /*
         * O banco guarda o código no formato
         * XXXX-XXXX.
         *
         * Primeiro tentamos o formato normal.
         */

        const codigoFormatado =
            formatarCodigo(
                codigoNormalizado
            );


        let resultado =
            await window.supabaseClient
                .from("campaigns")
                .select(
                    "id, name, master_id, invite_code, created_at"
                )
                .eq(
                    "invite_code",
                    codigoFormatado
                )
                .maybeSingle();


        /*
         * Caso o banco tenha um código antigo
         * sem o hífen, tentamos também.
         */

        if (
            resultado.error &&
            !resultado.data
        ) {

            resultado =
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

        }


        if (resultado.error) {

            console.error(
                "Erro ao procurar campanha:",
                resultado.error
            );

            throw new Error(
                "Não foi possível procurar a sala."
            );

        }


        if (!resultado.data) {

            throw new Error(
                "❌ Nenhuma sala encontrada com esse código."
            );

        }


        return resultado.data;

    }


    /* =====================================================
       OBTER PERSONAGEM DO JOGADOR
    ===================================================== */

    async function obterPersonagemDoJogador() {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabase não está disponível."
            );

        }


        if (
            !window.rpgAuth ||
            !window.rpgAuth.user
        ) {

            throw new Error(
                "Você precisa estar conectado."
            );

        }


        const user =
            window.rpgAuth.user;


        /*
         * Procuramos primeiro um personagem
         * pertencente ao usuário.
         *
         * Não filtramos campaign_id aqui,
         * pois justamente estamos entrando
         * em uma nova campanha.
         */

        const resultado =
            await window.supabaseClient
                .from("characters")
                .select("*")
                .eq(
                    "user_id",
                    user.id
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(1)
                .maybeSingle();


        if (resultado.error) {

            console.error(
                "Erro ao procurar personagem:",
                resultado.error
            );

            throw new Error(
                "Não foi possível encontrar seu personagem."
            );

        }


        if (!resultado.data) {

            throw new Error(
                "⚠️ Você ainda não possui um personagem."
            );

        }


        return resultado.data;

    }


    /* =====================================================
       VERIFICAR SE PERSONAGEM ESTÁ CONFIRMADO
    ===================================================== */

    function personagemEstaConfirmado() {

        /*
         * O CharacterModule mantém a confirmação
         * localmente.
         */

        if (
            typeof window.CharacterModule !==
            "undefined" &&
            window.CharacterModule
        ) {

            if (
                typeof window.CharacterModule
                    .personagemConfirmado ===
                "function"
            ) {

                return (
                    window.CharacterModule
                        .personagemConfirmado()
                );

            }

        }


        /*
         * Se não houver CharacterModule público,
         * deixamos a validação para o registro
         * existente no banco.
         */

        return true;

    }


    /* =====================================================
       ENCONTRAR SLOT LIVRE
    ===================================================== */

    async function encontrarSlotLivre(campaignId) {

        const resultado =
            await window.supabaseClient
                .from("characters")
                .select("slot")
                .eq(
                    "campaign_id",
                    campaignId
                )
                .not(
                    "slot",
                    "is",
                    null
                );


        if (resultado.error) {

            console.error(
                "Erro ao verificar slots:",
                resultado.error
            );

            throw new Error(
                "Não foi possível verificar os lugares da sala."
            );

        }


        const ocupados =
            new Set();


        (resultado.data || [])
            .forEach(
                function (item) {

                    const slot =
                        Number(item.slot);

                    if (
                        slot >= 1 &&
                        slot <= MAX_SLOTS
                    ) {

                        ocupados.add(slot);

                    }

                }
            );


        for (
            let slot = 1;
            slot <= MAX_SLOTS;
            slot++
        ) {

            if (
                !ocupados.has(slot)
            ) {

                return slot;

            }

        }


        return null;

    }


    /* =====================================================
       ENTRAR POR CÓDIGO
    ===================================================== */

    async function entrarPorCodigo(codigo) {

        try {

            mostrarMensagem(
                "🔎 Procurando a sala..."
            );


            if (
                !window.rpgAuth ||
                !window.rpgAuth.user
            ) {

                throw new Error(
                    "⚠️ Você precisa estar conectado para entrar em uma sala."
                );

            }


            /*
             * 1 — Procura a campanha
             */

            const campanha =
                await buscarCampanhaPorCodigo(
                    codigo
                );


            /*
             * 2 — Verifica personagem
             */

            if (
                !personagemEstaConfirmado()
            ) {

                throw new Error(
                    "⚠️ Confirme seu personagem antes de entrar na Mesa."
                );

            }


            const personagem =
                await obterPersonagemDoJogador();


            /*
             * 3 — Verifica se esse personagem
             * já está nessa campanha.
             */

            if (
                personagem.campaign_id ===
                campanha.id
            ) {

                if (
                    personagem.slot
                ) {

                    salvarCampanha(
                        campanha
                    );


                    mostrarMensagem(
                        "✅ Você já está nessa sala. Entrando..."
                    );


                    setTimeout(
                        function () {

                            window.location.href =
                                "mesa.html";

                        },
                        500
                    );


                    return campanha;

                }

            }


            /*
             * 4 — Verifica se a sala está cheia
             */

            const slot =
                await encontrarSlotLivre(
                    campanha.id
                );


            if (!slot) {

                throw new Error(
                    "❌ Essa sala já possui 8 jogadores."
                );

            }


            /*
             * 5 — Vincula personagem
             * à campanha e ao slot.
             */

            mostrarMensagem(
                `🎲 Entrando como jogador ${slot}...`
            );


            const atualizacao =
                await window.supabaseClient
                    .from("characters")
                    .update({
                        campaign_id:
                            campanha.id,

                        slot:
                            slot
                    })
                    .eq(
                        "id",
                        personagem.id
                    );


            if (atualizacao.error) {

                console.error(
                    "Erro ao vincular personagem:",
                    atualizacao.error
                );

                throw new Error(
                    "❌ Não foi possível vincular seu personagem à sala."
                );

            }


            /*
             * 6 — Salva campanha atual
             */

            salvarCampanha(
                {
                    ...campanha,
                    slot: slot,
                    character_id:
                        personagem.id
                }
            );


            /*
             * 7 — Sincroniza com campaign.js
             */

            if (
                typeof window.definirCampanhaAtiva ===
                "function"
            ) {

                window.definirCampanhaAtiva(
                    campanha
                );

            }


            /*
             * 8 — Vai para a Mesa
             */

            mostrarMensagem(
                "✅ Sala encontrada! Entrando na Mesa..."
            );


            setTimeout(
                function () {

                    window.location.href =
                        "mesa.html";

                },
                700
            );


            return campanha;

        }

        catch (erro) {

            console.error(
                "❌ Entrada na mesa:",
                erro
            );


            mostrarMensagem(
                erro.message ||
                "❌ Não foi possível entrar na sala."
            );


            return null;

        }

    }


    /* =====================================================
       CRIAR INTERFACE DE ENTRADA
       Caso ela ainda não exista no HTML.
    ===================================================== */

    function criarInterfaceEntrada() {

        /*
         * Se você já criou a interface no HTML,
         * não criamos outra.
         */

        if (
            document.getElementById(
                "mesa-entrada"
            )
        ) {

            configurarInterfaceExistente();

            return;

        }


        /*
         * Procuramos o local onde colocar
         * a entrada da mesa.
         */

        const nav =
            document.querySelector(
                ".dimension-nav"
            );


        if (!nav) {
            return;
        }


        const painel =
            document.createElement("section");


        painel.id =
            "mesa-entrada";


        painel.className =
            "mesa-entrada-panel";


        painel.innerHTML = `

            <div class="mesa-entrada-header">

                <span class="mesa-entrada-label">
                    🎲 MESA RPG ONLINE
                </span>

                <h2>
                    Entrar em uma Mesa
                </h2>

                <p>
                    Digite o código da sala enviado pelo Mestre.
                </p>

            </div>


            <div class="mesa-entrada-form">

                <input
                    id="mesa-codigo-input"
                    type="text"
                    maxlength="9"
                    placeholder="XXXX-XXXX"
                    autocomplete="off"
                    inputmode="text"
                >

                <button
                    id="mesa-entrar-codigo"
                    type="button"
                    class="mesa-entrada-button"
                >
                    🎲 ENTRAR NA MESA
                </button>

            </div>


            <p
                id="mesa-entrada-status"
                class="mesa-entrada-status"
            ></p>

        `;


        nav.insertAdjacentElement(
            "afterend",
            painel
        );


        configurarInterfaceExistente();

    }


    /* =====================================================
       CONFIGURAR INTERFACE
    ===================================================== */

    function configurarInterfaceExistente() {

        const input =
            document.getElementById(
                "mesa-codigo-input"
            );


        const botao =
            document.getElementById(
                "mesa-entrar-codigo"
            );


        if (
            !input ||
            !botao
        ) {

            return;

        }


        if (
            botao.dataset.mesaEntradaConfigurada ===
            "true"
        ) {

            return;

        }


        botao.dataset.mesaEntradaConfigurada =
            "true";


        input.addEventListener(
            "input",
            function () {

                const cursor =
                    input.selectionStart;


                const antes =
                    input.value;


                input.value =
                    formatarCodigo(
                        input.value
                    );


                /*
                 * Mantém a experiência
                 * agradável no celular.
                 */

                if (
                    antes.length <= 9 &&
                    cursor !== null
                ) {

                    input.setSelectionRange(
                        input.value.length,
                        input.value.length
                    );

                }

            }
        );


        input.addEventListener(
            "keydown",
            function (evento) {

                if (
                    evento.key ===
                    "Enter"
                ) {

                    evento.preventDefault();

                    entrarPorCodigo(
                        input.value
                    );

                }

            }
        );


        botao.addEventListener(
            "click",
            function () {

                entrarPorCodigo(
                    input.value
                );

            }
        );

    }


    /* =====================================================
       PROCURAR BOTÃO
       "CONTINUAR CAMPANHA"
    ===================================================== */

    function procurarBotaoContinuar() {

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
                        botao.dataset
                            .mesaEntradaConfigurada ===
                        "true"
                    ) {

                        return;

                    }


                    botao.dataset
                        .mesaEntradaConfigurada =
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
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        criarInterfaceEntrada();

        procurarBotaoContinuar();


        const observador =
            new MutationObserver(
                function () {

                    criarInterfaceEntrada();

                    procurarBotaoContinuar();

                }
            );


        if (document.body) {

            observador.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );

        }

    }


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
       API PÚBLICA
    ===================================================== */

    window.rpgMesaEntrada = {

        entrar:
            entrarNaMesa,

        entrarPorCodigo:
            entrarPorCodigo,

        buscarCampanhaPorCodigo:
            buscarCampanhaPorCodigo,

        obterCampanha:
            obterCampanha

    };


})();
