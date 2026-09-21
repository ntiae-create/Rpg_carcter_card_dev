/* =========================================================
   MESA — CLIQUES À PROVA DE FALHA (v2)
   Carregar por ÚLTIMO no mesa.html

   Problema tratado:
   - 1º clique funciona
   - depois tudo "morre"
   Causa típica: overlay (menu mestre / diagnóstico / ficha)
   abre em tela cheia e engole os próximos toques.
========================================================= */

(function () {
    "use strict";

    var ULTIMO_LOG = 0;

    function log() {
        try {
            var agora = Date.now();
            if (agora - ULTIMO_LOG < 80) return;
            ULTIMO_LOG = agora;
            console.log.apply(console, ["[MesaCliques]"].concat([].slice.call(arguments)));
        } catch (e) {}
    }

    function $(id) {
        return document.getElementById(id);
    }

    function fecharOverlay(el) {
        if (!el) return;
        el.hidden = true;
        el.setAttribute("hidden", "");
        el.style.display = "none";
        el.style.pointerEvents = "none";
        el.style.visibility = "hidden";
    }

    function abrirOverlay(el, displayValue) {
        if (!el) return;
        el.hidden = false;
        el.removeAttribute("hidden");
        el.style.display = displayValue || "flex";
        el.style.pointerEvents = "auto";
        el.style.visibility = "visible";
    }

    function fecharTudoQueBloqueia() {
        fecharOverlay($("master-menu"));
        fecharOverlay($("mesa-diagnostico"));
        fecharOverlay($("ficha-overlay"));
        fecharOverlay($("ficha-modal"));
    }

    function liberarPointerEvents() {
        document.documentElement.style.pointerEvents = "auto";
        document.body.style.pointerEvents = "auto";

        var grid = $("jogadores");
        if (grid) {
            grid.style.pointerEvents = "none";
        }

        var cards = document.querySelectorAll(".player-card, [data-player]");
        for (var i = 0; i < cards.length; i++) {
            cards[i].style.pointerEvents = "auto";
        }

        var botoes = document.querySelectorAll(
            "#btn-diagnostico, #btn-configuracoes, .mesa-settings-btn, .mesa-diagnostico-btn, [data-mesa-action], [data-master-action], #btn-fechar-diagnostico, #btn-limpar-diagnostico"
        );
        for (var k = 0; k < botoes.length; k++) {
            botoes[k].style.pointerEvents = "auto";
            botoes[k].style.cursor = "pointer";
            if (botoes[k].id === "btn-diagnostico" || botoes[k].id === "btn-configuracoes") {
                botoes[k].style.zIndex = "10050";
                botoes[k].style.position = "fixed";
            }
        }

        var header = document.querySelector(".mesa-header-actions");
        if (header) {
            header.style.pointerEvents = "none";
            header.style.zIndex = "10040";
            var filhos = header.querySelectorAll("button, a");
            for (var f = 0; f < filhos.length; f++) {
                filhos[f].style.pointerEvents = "auto";
                filhos[f].style.zIndex = "10050";
            }
        }
    }

    function diagnosticoAberto() {
        var p = $("mesa-diagnostico");
        if (!p) return false;
        if (p.hidden) return false;
        if (p.style.display === "none") return false;
        var st = window.getComputedStyle(p);
        return st.display !== "none" && st.visibility !== "hidden";
    }

    function menuAberto() {
        var p = $("master-menu");
        if (!p) return false;
        if (p.hidden) return false;
        if (p.style.display === "none") return false;
        var st = window.getComputedStyle(p);
        return st.display !== "none" && st.visibility !== "hidden";
    }

    function fichaAberta() {
        var o = $("ficha-overlay");
        if (!o) return false;
        return o.style.display === "block" || o.style.display === "flex";
    }

    function abrirDiagnostico() {
        var painel = $("mesa-diagnostico");
        if (!painel) return;

        fecharOverlay($("master-menu"));
        fecharOverlay($("ficha-overlay"));
        fecharOverlay($("ficha-modal"));

        abrirOverlay(painel, "flex");

        if (window.MesaDiagnostico && typeof window.MesaDiagnostico.abrir === "function") {
            try {
                window.MesaDiagnostico.abrir();
            } catch (e) {
                log("MesaDiagnostico.abrir erro:", e);
            }
        }
        log("diagnostico aberto");
    }

    function fecharDiagnostico() {
        fecharOverlay($("mesa-diagnostico"));
        if (window.MesaDiagnostico && typeof window.MesaDiagnostico.fechar === "function") {
            try {
                window.MesaDiagnostico.fechar();
            } catch (e) {}
        }
        liberarPointerEvents();
        log("diagnostico fechado");
    }

    function toggleMenu() {
        var menu = $("master-menu");
        if (!menu) return;

        if (menuAberto()) {
            fecharOverlay(menu);
            liberarPointerEvents();
            log("menu fechado");
            return;
        }

        fecharOverlay($("mesa-diagnostico"));
        fecharOverlay($("ficha-overlay"));
        fecharOverlay($("ficha-modal"));
        abrirOverlay(menu, "flex");
        log("menu aberto");
    }

    function fecharMenu() {
        fecharOverlay($("master-menu"));
        liberarPointerEvents();
    }

    function fecharFicha() {
        fecharOverlay($("ficha-overlay"));
        fecharOverlay($("ficha-modal"));
        liberarPointerEvents();
        log("ficha fechada");
    }

    function tratarClique(event) {
        var target = event.target;
        if (!target || !target.closest) return;

        try {
            if (target.closest("#btn-fechar-diagnostico")) {
                event.preventDefault();
                event.stopPropagation();
                fecharDiagnostico();
                return;
            }

            if (target.closest("#btn-diagnostico")) {
                event.preventDefault();
                event.stopPropagation();
                if (diagnosticoAberto()) {
                    fecharDiagnostico();
                } else {
                    abrirDiagnostico();
                }
                return;
            }

            if (target.closest("#btn-configuracoes")) {
                event.preventDefault();
                event.stopPropagation();
                toggleMenu();
                return;
            }

            // fundo do menu mestre
            if (target.id === "master-menu") {
                event.preventDefault();
                event.stopPropagation();
                fecharMenu();
                return;
            }

            // fundo do diagnostico
            if (target.id === "mesa-diagnostico") {
                event.preventDefault();
                event.stopPropagation();
                fecharDiagnostico();
                return;
            }

            // fundo da ficha
            if (target.id === "ficha-overlay") {
                event.preventDefault();
                event.stopPropagation();
                fecharFicha();
                return;
            }

            var fecharFichaBtn = target.closest("#ficha-modal button");
            if (fecharFichaBtn) {
                var txt = (fecharFichaBtn.textContent || "").toLowerCase();
                if (txt.indexOf("fechar") !== -1 || txt.indexOf("x") !== -1 || txt.indexOf("✕") !== -1) {
                    event.preventDefault();
                    event.stopPropagation();
                    fecharFicha();
                    return;
                }
            }

            var masterAction = target.closest("[data-master-action]");
            if (masterAction) {
                var acaoMaster = masterAction.getAttribute("data-master-action");
                log("master-action:", acaoMaster);
                document.dispatchEvent(
                    new CustomEvent("mesa:masterAction", {
                        detail: { acao: acaoMaster, elemento: masterAction }
                    })
                );
                if (acaoMaster === "fechar" || acaoMaster === "close") {
                    fecharMenu();
                }
            }

            var mesaAction = target.closest("[data-mesa-action]");
            if (mesaAction) {
                var acao = mesaAction.getAttribute("data-mesa-action");
                log("mesa-action:", acao);

                if (acao === "voltar" && window.MesaRPG && typeof window.MesaRPG.voltarParaMesaNormal === "function") {
                    event.preventDefault();
                    window.MesaRPG.voltarParaMesaNormal();
                    return;
                }

                if (acao === "cte" && window.MesaRPG) {
                    var cteAcao = mesaAction.getAttribute("data-cte-action") || "iniciar";
                    if (cteAcao === "clique" && typeof window.MesaRPG.executarCliqueCTE === "function") {
                        event.preventDefault();
                        window.MesaRPG.executarCliqueCTE(mesaAction, event);
                        return;
                    }
                    if (cteAcao === "iniciar" && typeof window.MesaRPG.iniciarCTE === "function") {
                        event.preventDefault();
                        window.MesaRPG.iniciarCTE();
                        return;
                    }
                }
            }

            // com overlay aberto, nao processa card por baixo
            if (diagnosticoAberto() || menuAberto() || fichaAberta()) {
                return;
            }

            var card = target.closest("[data-player]");
            if (card && !target.closest("button, a, input, select, textarea")) {
                if (card.getAttribute("data-interactive") === "false") return;

                var slot = Number(card.getAttribute("data-player"));
                if (slot >= 1 && slot <= 8) {
                    log("player slot:", slot);

                    if (window.MesaRPG && typeof window.MesaRPG.selecionarJogador === "function") {
                        window.MesaRPG.selecionarJogador(slot);
                    } else {
                        document.dispatchEvent(
                            new CustomEvent("mesa:jogadorSelecionado", {
                                detail: { slot: slot }
                            })
                        );
                    }
                }
            }

        } catch (erro) {
            log("erro no clique (recuperando UI):", erro);
            fecharTudoQueBloqueia();
            liberarPointerEvents();
        }
    }

    function tratarTecla(event) {
        if (event.key === "Escape" || event.keyCode === 27) {
            fecharTudoQueBloqueia();
            liberarPointerEvents();
            log("ESC -> overlays fechados");
        }
    }

    function iniciar() {
        fecharTudoQueBloqueia();
        liberarPointerEvents();

        document.addEventListener("click", tratarClique, true);
        document.addEventListener("keydown", tratarTecla, true);

        setInterval(function () {
            liberarPointerEvents();
        }, 2000);

        log("v2 ativo - overlays controlados");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
