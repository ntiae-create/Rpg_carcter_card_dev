"use strict";

/*
============================================================
 MESA — ENTRADA POR CÓDIGO
============================================================

 Responsável por:

 - Ler o código digitado pelo jogador
 - Encontrar a campanha
 - Verificar o usuário
 - Encontrar o personagem
 - Confirmar se o personagem está definido
 - Adicionar o jogador à campanha
 - Reservar um dos 8 slots
 - Salvar a mesa ativa
 - Atualizar a interface da campanha
 - Entrar na mesa.html somente ao clicar
   em "CONTINUAR CAMPANHA"

 Código oficial:
 campaigns.codigo_mesa
============================================================
*/


(function () {

    const MAX_JOGADORES = 8;

    const STORAGE_KEY = "rpg_mesa_ativa";


    /*
    ========================================================
     ELEMENTOS
    ========================================================
    */

    let inputCodigo = null;
    let botaoEntrar = null;
    let mensagem = null;

    let estadoInicial = null;
    let formularioCodigo = null;
    let estadoConectado = null;

    let botaoContinuarJogador = null;
    let botaoContinuarMestre = null;

    let campanhaAtual = null;



    /*
    ========================================================
     UTILITÁRIOS
    ========================================================
    */

    function obterSupabase() {

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window.supabase) {
            return window.supabase;
        }

        return null;
    }


    function obterUsuario() {

        if (
            window.rpgAuth &&
            window.rpgAuth.user
        ) {
            return window.rpgAuth.user;
        }

        return null;
    }


    function normalizarCodigo(valor) {

        return String(valor || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }


    function mostrarMensagem(texto, tipo = "") {

        if (!mensagem) return;

        mensagem.textContent = texto;

        mensagem.className = "campaign-message";

        if (tipo) {
            mensagem.classList.add(tipo);
        }
    }


    function bloquearEntrada(bloquear) {

        if (inputCodigo) {
            inputCodigo.disabled = bloquear;
        }

        if (botaoEntrar) {
            botaoEntrar.disabled = bloquear;
        }

    }



    /*
    ========================================================
     INTERFACE — ENTRADA
    ========================================================
    */

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

        if (inputCodigo) {

            setTimeout(() => {

                inputCodigo.focus();

            }, 50);

        }

    }



    /*
    ========================================================
     INTERFACE — CAMPANHA CONECTADA
    ========================================================
    */

    function mostrarCampanhaConectada() {

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



    /*
    ========================================================
     PERSONAGEM
    ========================================================
    */

    function personagemEstaConfirmado(personagem) {

        if (!personagem) {
            return false;
        }

        const nome =
            String(personagem.name || "")
                .trim();

        const raca =
            String(personagem.race || "")
                .trim();

        const classe =
            String(personagem.class || "")
                .trim();

        return Boolean(
            nome &&
            raca &&
            classe
        );

    }



    /*
    ========================================================
     ENCONTRAR PERSONAGEM
    ========================================================
    */

    async function encontrarPersonagem(
        supabase,
        usuario,
        campanhaId
    ) {

        /*
        ----------------------------------------------------
         Primeiro tenta encontrar um personagem
         já pertencente à campanha.
        ----------------------------------------------------
        */

        const {
            data: personagemCampanha,
            error: erroCampanha
        } =
            await supabase
                .from("characters")
                .select("*")
                .eq("campaign_id", campanhaId)
                .eq("user_id", usuario.id)
                .order("created_at", {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();


        if (
            !erroCampanha &&
            personagemCampanha
        ) {

            return personagemCampanha;

        }



        /*
        ----------------------------------------------------
         Caso ainda não esteja associado à campanha,
         procura o personagem mais recente do usuário.
        ----------------------------------------------------
        */

        const {
            data: personagemUsuario,
            error: erroUsuario
        } =
            await supabase
                .from("characters")
                .select("*")
                .eq("user_id", usuario.id)
                .order("created_at", {
                    ascending: false
                })
                .limit(1)
                .maybeSingle();


        if (erroUsuario) {

            throw erroUsuario;

        }


        return personagemUsuario || null;

    }



    /*
    ========================================================
     BUSCAR CAMPANHA PELO CÓDIGO
    ========================================================
    */

    async function buscarCampanha(codigo) {

        /*
        ----------------------------------------------------
         Primeiro usamos o campaign.js,
         caso ele esteja disponível.
        ----------------------------------------------------
        */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.buscarCampanhaPorCodigo === "function"
        ) {

            const campanha =
                await window.rpgCampaign
                    .buscarCampanhaPorCodigo(codigo);

            if (campanha) {
                return campanha;
            }

        }



        /*
        ----------------------------------------------------
         Fallback direto no Supabase.
        ----------------------------------------------------
        */

        const supabase =
            obterSupabase();


        if (!supabase) {

            throw new Error(
                "Conexão com o Supabase não encontrada."
            );

        }


        const {
            data,
            error
        } =
            await supabase
                .from("campaigns")
                .select(`
                    id,
                    name,
                    master_id,
                    codigo_mesa,
                    created_at
                `)
                .eq("codigo_mesa", codigo)
                .maybeSingle();


        if (error) {

            throw error;

        }


        return data || null;

    }



    /*
    ========================================================
     VERIFICAR MEMBRO
    ========================================================
    */

    async function usuarioJaEhMembro(
        supabase,
        campanhaId,
        usuarioId
    ) {

        const {
            data,
            error
        } =
            await supabase
                .from("campaign_members")
                .select("id")
                .eq("campaign_id", campanhaId)
                .eq("user_id", usuarioId)
                .maybeSingle();


        if (error) {

            throw error;

        }


        return Boolean(data);

    }



    /*
    ========================================================
     ADICIONAR MEMBRO
    ========================================================
    */

    async function adicionarMembro(
        supabase,
        campanhaId,
        usuarioId
    ) {

        const {
            error
        } =
            await supabase
                .from("campaign_members")
                .insert({

                    campaign_id:
                        campanhaId,

                    user_id:
                        usuarioId,

                    role:
                        "player"

                });


        if (error) {

            /*
            ------------------------------------------------
             Se já existe, não precisamos
             considerar isso um erro fatal.
            ------------------------------------------------
            */

            if (
                error.code === "23505"
            ) {

                return;

            }

            throw error;

        }

    }



    /*
    ========================================================
     OBTER SLOTS OCUPADOS
    ========================================================
    */

    async function obterSlotsOcupados(
        supabase,
        campanhaId
    ) {

        const {
            data,
            error
        } =
            await supabase
                .from("characters")
                .select("slot")
                .eq("campaign_id", campanhaId)
                .not("slot", "is", null);


        if (error) {

            throw error;

        }


        return new Set(

            (data || [])

                .map(
                    personagem =>
                        personagem.slot
                )

                .filter(
                    slot =>
                        Number.isInteger(slot)
                )

        );

    }



    /*
    ========================================================
     ENCONTRAR PRIMEIRO SLOT
    ========================================================
    */

    function encontrarPrimeiroSlot(
        slotsOcupados
    ) {

        for (
            let slot = 1;
            slot <= MAX_JOGADORES;
            slot++
        ) {

            if (
                !slotsOcupados.has(slot)
            ) {

                return slot;

            }

        }


        return null;

    }



    /*
    ========================================================
     ATUALIZAR PERSONAGEM
    ========================================================
    */

    async function associarPersonagem(
        supabase,
        personagem,
        campanhaId,
        slot
    ) {

        const {
            data,
            error
        } =
            await supabase
                .from("characters")
                .update({

                    campaign_id:
                        campanhaId,

                    slot:
                        slot

                })
                .eq(
                    "id",
                    personagem.id
                )
                .eq(
                    "user_id",
                    personagem.user_id
                )
                .select()
                .single();


        if (error) {

            throw error;

        }


        return data;

    }



    /*
    ========================================================
     SALVAR MESA LOCAL
    ========================================================
    */

    function salvarMesaAtiva(
        campanha,
        personagem,
        slot
    ) {

        const mesa = {

            campaignId:
                campanha.id,

            campaignName:
                campanha.name,

            codigoMesa:
                campanha.codigo_mesa,

            characterId:
                personagem?.id || null,

            slot:
                slot ?? null,

            joinedAt:
                new Date().toISOString()

        };


        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(mesa)
        );


        return mesa;

    }



    /*
    ========================================================
     ATUALIZAR AUTH
    ========================================================
    */

    function atualizarAuth(
        campanha,
        isMaster
    ) {

        if (!window.rpgAuth) {
            return;
        }

        window.rpgAuth.campaign =
            campanha;

        window.rpgAuth.isMaster =
            Boolean(isMaster);

    }



    /*
    ========================================================
     ENTRAR NA MESA
    ========================================================
    */

    async function entrarPorCodigo() {

        const codigo =
            normalizarCodigo(
                inputCodigo?.value
            );


        /*
        ----------------------------------------------------
         Código vazio
        ----------------------------------------------------
        */

        if (!codigo) {

            mostrarMensagem(
                "Digite o código da mesa.",
                "error"
            );

            return;

        }



        /*
        ----------------------------------------------------
         Usuário
        ----------------------------------------------------
        */

        const usuario =
            obterUsuario();


        if (!usuario) {

            mostrarMensagem(
                "Você precisa estar conectado para entrar na mesa.",
                "error"
            );

            return;

        }



        /*
        ----------------------------------------------------
         Supabase
        ----------------------------------------------------
        */

        const supabase =
            obterSupabase();


        if (!supabase) {

            mostrarMensagem(
                "Não foi possível conectar ao servidor.",
                "error"
            );

            return;

        }



        bloquearEntrada(true);

        mostrarMensagem(
            "Procurando a mesa...",
            "loading"
        );



        try {

            /*
            ==================================================
             1. ENCONTRAR CAMPANHA
            ==================================================
            */

            const campanha =
                await buscarCampanha(
                    codigo
                );


            if (!campanha) {

                throw new Error(
                    "Nenhuma mesa encontrada com esse código."
                );

            }


            campanhaAtual =
                campanha;



            /*
            ==================================================
             2. MESTRE
            ==================================================
            */

            if (
                campanha.master_id === usuario.id
            ) {

                salvarMesaAtiva(
                    campanha,
                    null,
                    null
                );


                atualizarAuth(
                    campanha,
                    true
                );


                mostrarMensagem(
                    "Mesa encontrada! Você é o Mestre desta campanha.",
                    "success"
                );


                /*
                ------------------------------------------------
                 Mestre não precisa digitar código novamente.
                 ------------------------------------------------
                */

                mostrarCampanhaConectada();

                return;

            }



            /*
            ==================================================
             3. PERSONAGEM
            ==================================================
            */

            mostrarMensagem(
                "Verificando seu personagem...",
                "loading"
            );


            const personagem =
                await encontrarPersonagem(
                    supabase,
                    usuario,
                    campanha.id
                );


            if (!personagem) {

                throw new Error(
                    "Você ainda não possui um personagem."
                );

            }



            /*
            ==================================================
             4. PERSONAGEM CONFIRMADO
            ==================================================
            */

            if (
                !personagemEstaConfirmado(
                    personagem
                )
            ) {

                throw new Error(
                    "Finalize seu personagem antes de entrar na mesa."
                );

            }



            /*
            ==================================================
             5. MEMBRO
            ==================================================
            */

            const jaEhMembro =
                await usuarioJaEhMembro(
                    supabase,
                    campanha.id,
                    usuario.id
                );


            if (!jaEhMembro) {

                mostrarMensagem(
                    "Entrando na mesa...",
                    "loading"
                );


                await adicionarMembro(
                    supabase,
                    campanha.id,
                    usuario.id
                );

            }



            /*
            ==================================================
             6. SLOT
            ==================================================
            */

            let slot =
                personagem.slot;


            /*
            ------------------------------------------------
             Se já possui slot nessa campanha,
             mantém o mesmo.
            ------------------------------------------------
            */

            if (
                !slot ||
                slot < 1 ||
                slot > MAX_JOGADORES
            ) {

                const slotsOcupados =
                    await obterSlotsOcupados(
                        supabase,
                        campanha.id
                    );


                slot =
                    encontrarPrimeiroSlot(
                        slotsOcupados
                    );


                if (!slot) {

                    throw new Error(
                        "A mesa já possui os 8 slots ocupados."
                    );

                }


                mostrarMensagem(
                    `Reservando o jogador ${slot}...`,
                    "loading"
                );


                await associarPersonagem(
                    supabase,
                    personagem,
                    campanha.id,
                    slot
                );

            }



            /*
            ==================================================
             7. SALVAR MESA
            ==================================================
            */

            salvarMesaAtiva(
                campanha,
                personagem,
                slot
            );



            /*
            ==================================================
             8. ATUALIZAR AUTH
            ==================================================
            */

            atualizarAuth(
                campanha,
                false
            );



            /*
            ==================================================
             9. MOSTRAR CAMPANHA CONECTADA
            ==================================================
            */

            mostrarMensagem(
                `Mesa encontrada! Você ocupará o jogador ${slot}.`,
                "success"
            );


            mostrarCampanhaConectada();

        } catch (error) {

            console.error(
                "[Mesa Entrada]",
                error
            );


            mostrarMensagem(
                error.message ||
                "Não foi possível entrar na mesa.",
                "error"
            );


            bloquearEntrada(false);

        }

    }



    /*
    ========================================================
     COPIAR CÓDIGO DO MESTRE
    ========================================================
    */

    async function copiarCodigoMesa() {

        let codigo = "";


        /*
        ----------------------------------------------------
         Primeiro tenta campanha ativa.
        ----------------------------------------------------
        */

        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.obterCampanhaAtiva === "function"
        ) {

            const campanha =
                window.rpgCampaign
                    .obterCampanhaAtiva();


            if (campanha) {

                codigo =
                    campanha.codigo_mesa ||
                    "";

            }

        }



        /*
        ----------------------------------------------------
         Fallback para auth.
        ----------------------------------------------------
        */

        if (
            !codigo &&
            window.rpgAuth &&
            window.rpgAuth.campaign
        ) {

            codigo =
                window.rpgAuth
                    .campaign
                    .codigo_mesa ||
                "";

        }


        codigo =
            normalizarCodigo(
                codigo
            );


        if (!codigo) {

            mostrarMensagem(
                "Nenhum código de mesa foi encontrado.",
                "error"
            );

            return;

        }



        try {

            await navigator.clipboard.writeText(
                codigo
            );


            mostrarMensagem(
                "Código da mesa copiado!",
                "success"
            );

        } catch (error) {

            console.error(
                error
            );


            /*
            ------------------------------------------------
             Fallback simples.
            ------------------------------------------------
            */

            const area =
                document.createElement(
                    "textarea"
                );


            area.value =
                codigo;


            area.style.position =
                "fixed";


            area.style.opacity =
                "0";


            document.body.appendChild(
                area
            );


            area.select();


            document.execCommand(
                "copy"
            );


            area.remove();


            mostrarMensagem(
                "Código da mesa copiado!",
                "success"
            );

        }

    }



    /*
    ========================================================
     CONTINUAR CAMPANHA
    ========================================================
    */

    function continuarCampanha() {

        const usuario =
            obterUsuario();


        if (!usuario) {

            mostrarMensagem(
                "Você precisa estar conectado.",
                "error"
            );

            return;

        }


        const mesaSalva =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!mesaSalva) {

            mostrarMensagem(
                "Nenhuma campanha ativa foi encontrada.",
                "error"
            );

            return;

        }


        window.location.href =
            "mesa.html";

    }



    /*
    ========================================================
     CARREGAR CÓDIGO DO MESTRE
    ========================================================
    */

    function atualizarCodigoVisual() {

        const elemento =
            document.getElementById(
                "campaign-code-display"
            );


        if (!elemento) {
            return;
        }


        let codigo = "";


        if (
            window.rpgCampaign &&
            typeof window.rpgCampaign.obterCampanhaAtiva === "function"
        ) {

            const campanha =
                window.rpgCampaign
                    .obterCampanhaAtiva();


            if (campanha) {

                codigo =
                    campanha.codigo_mesa ||
                    "";

            }

        }


        if (
            !codigo &&
            window.rpgAuth &&
            window.rpgAuth.campaign
        ) {

            codigo =
                window.rpgAuth
                    .campaign
                    .codigo_mesa ||
                "";

        }


        elemento.textContent =
            codigo ||
            "------";

    }



    /*
    ========================================================
     VERIFICAR MESA JÁ SALVA
    ========================================================
    */

    function verificarMesaAtiva() {

        const usuario =
            obterUsuario();


        if (!usuario) {
            return;
        }


        const dados =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!dados) {
            return;
        }


        try {

            const mesa =
                JSON.parse(
                    dados
                );


            if (
                mesa &&
                mesa.campaignId
            ) {

                mostrarCampanhaConectada();

            }

        } catch (error) {

            console.error(
                "[Mesa Entrada] Erro ao ler mesa ativa:",
                error
            );

        }

    }



    /*
    ========================================================
     INICIALIZAÇÃO
    ========================================================
    */

    function inicializar() {

        /*
        ----------------------------------------------------
         Elementos da entrada
        ----------------------------------------------------
        */

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



        /*
        ----------------------------------------------------
         Abrir formulário de código
        ----------------------------------------------------
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
        ----------------------------------------------------
         Entrar
        ----------------------------------------------------
        */

        if (
            inputCodigo &&
            botaoEntrar
        ) {

            botaoEntrar.addEventListener(
                "click",
                entrarPorCodigo
            );


            inputCodigo.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

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
        ----------------------------------------------------
         Copiar código
        ----------------------------------------------------
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



        /*
        ----------------------------------------------------
         Continuar campanha — Mestre
        ----------------------------------------------------
        */

        if (botaoContinuarMestre) {

            botaoContinuarMestre.addEventListener(
                "click",
                continuarCampanha
            );

        }



        /*
        ----------------------------------------------------
         Continuar campanha — Jogador
        ----------------------------------------------------
        */

        if (botaoContinuarJogador) {

            botaoContinuarJogador.addEventListener(
                "click",
                continuarCampanha
            );

        }



        /*
        ----------------------------------------------------
         Código visual
        ----------------------------------------------------
        */

        atualizarCodigoVisual();


        setTimeout(
            atualizarCodigoVisual,
            300
        );


        setTimeout(
            atualizarCodigoVisual,
            1000
        );


        setTimeout(
            atualizarCodigoVisual,
            2000
        );



        /*
        ----------------------------------------------------
         Verificar se já existe uma mesa salva
        ----------------------------------------------------
        */

        setTimeout(
            verificarMesaAtiva,
            500
        );

    }



    /*
    ========================================================
     API PÚBLICA
    ========================================================
    */

    window.rpgMesaEntrada = {

        entrarPorCodigo,

        copiarCodigoMesa,

        continuarCampanha,

        atualizarCodigoVisual,

        mostrarFormularioCodigo,

        mostrarCampanhaConectada,

        normalizarCodigo

    };



    /*
    ========================================================
     DOM
    ========================================================
    */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            inicializar
        );

    } else {

        inicializar();

    }

})();
