/* =========================================================
   MESA — CLIQUES À PROVA DE FALHA
   Carregar por ÚLTIMO no mesa.html
   Não depende de Supabase, Realtime, auth ou mesa.js
========================================================= */

(function () {
    "use strict";

    function log() {
        try {
            console.log.apply(console, ["[MesaCliques]"].concat([].slice.call(arguments)));
        } catch (e) {}
    }

    function forcarOverlaysFechados() {
        var ids = ["master-menu", "mesa-diagnostico", "ficha-overlay", "ficha-modal"];
        for (var i = 0; i < ids.length; i++) {
            var el = document.getElementById(ids[i]);
            if (!el) continue;
            el.hidden = true;
            el.style.display = "none";
            el.style.pointerEvents = "none";
        }

        // qualquer overlay full-screen residual
        var fixed = document.querySelectorAll("[style*='position: fixed'], [style*='position:fixed']");
        for (var j = 0; j < fixed.length; j++) {
            var node = fixed[j];
            if (node.id === "auth-diagnostic") continue;
            var style = window.getComputedStyle(node);
            if (style.position === "fixed" && style.inset === "0px" && style.display !== "none") {
                // não fecha tudo automaticamente — só se estiver bloqueando e for ficha/diagnostico
                if (node.id && (node.id.indexOf("ficha") !== -1 || node.id.indexOf("diagnostico") !== -1 || node.id.indexOf("master") !== -1)) {
                    node.style.display = "none";
                    node.style.pointerEvents = "none";
                }
            }
        }
    }

    function liberarPointerEvents() {
        var grid = document.getElementById("jogadores");
        if (grid) {
            grid.style.pointerEvents = "auto";
        }

        var cards = document.querySelectorAll(".player-card, [data-player]");
        for (var i = 0; i < cards.length; i++) {
            cards[i].style.pointerEvents = "auto";
        }

        var btns = document.querySelectorAll(
            "#btn-diagnostico, #btn-configuracoes, .mesa-settings-btn, .mesa-diagnostico-btn, [data-mesa-action], [data-master-action]"
        );
        for (var k = 0; k < btns.length; k++) {
            btns[k].style.pointerEvents = "auto";
            btns[k].style.cursor = "pointer";
        }

        var header = document.querySelector(".mesa-header-actions");
        if (header) {
            header.style.pointerEvents = "none"; // container
            var filhos = header.querySelectorAll("button, a, [data-mesa-action]");
            for (var f = 0; f < filhos.length; f++) {
                filhos[f].style.pointerEvents = "auto";
            }
        }
    }

    function abrirDiagnostico() {
        var painel = document.getElementById("mesa-diagnostico");
        if (!painel) {
            log("Painel de diagnóstico não encontrado");
            return;
        }
        painel.hidden = false;
        painel.style.display = "flex";
        painel.style.pointerEvents = "auto";
        if (window.MesaDiagnostico && typeof window.MesaDiagnostico.abrir === "function") {
            try {
                window.MesaDiagnostico.abrir();
            } catch (e) {
                log("MesaDiagnostico.abrir falhou, painel aberto manualmente", e);
            }
        }
    }

    function fecharDiagnostico() {
        var painel = document.getElementById("mesa-diagnostico");
        if (!painel) return;
        painel.hidden = true;
        painel.style.display = "none";
        painel.style.pointerEvents = "none";
        if (window.MesaDiagnostico && typeof window.MesaDiagnostico.fechar === "function") {
            try {
                window.MesaDiagnostico.fechar();
            } catch (e) {}
        }
    }

    function abrirConfig() {
        var menu = document.getElementById("master-menu");
        if (!menu) {
            log("Menu master não encontrado");
            return;
        }
        var aberto = !menu.hidden && menu.style.display !== "none";
        if (aberto) {
            menu.hidden = true;
            menu.style.display = "none";
            menu.style.pointerEvents = "none";
        } else {
            menu.hidden = false;
            menu.style.display = "flex";
            menu.style.pointerEvents = "auto";
        }
    }

    function tratarClique(event) {
        var target = event.target;
        if (!target || !target.closest) return;

        // Fechar diagnóstico
        if (target.closest("#btn-fechar-diagnostico")) {
            event.preventDefault();
            event.stopPropagation();
            fecharDiagnostico();
            return;
        }

        // Abrir diagnóstico
        if (target.closest("#btn-diagnostico")) {
            event.preventDefault();
            event.stopPropagation();
            abrirDiagnostico();
            return;
        }

        // Configurações / menu mestre
        if (target.closest("#btn-configuracoes")) {
            event.preventDefault();
            event.stopPropagation();
            abrirConfig();
            return;
        }

        // Clique no fundo do menu mestre fecha
        if (target.id === "master-menu") {
            event.preventDefault();
            var menu = document.getElementById("master-menu");
            if (menu) {
                menu.hidden = true;
                menu.style.display = "none";
                menu.style.pointerEvents = "none";
            }
            return;
        }

        // Ações do mestre
        var masterAction = target.closest("[data-master-action]");
        if (masterAction) {
            var acaoMaster = masterAction.getAttribute("data-master-action");
            log("master-action:", acaoMaster);
            document.dispatchEvent(
                new CustomEvent("mesa:masterAction", {
                    detail: { acao: acaoMaster, elemento: masterAction }
                })
            );
            // não bloqueia outros handlers
        }

        // data-mesa-action
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

        // Card do jogador
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
    }

    function iniciar() {
        forcarOverlaysFechados();
        liberarPointerEvents();

        // captura = pega o clique mesmo com overlays estranhos
        document.addEventListener("click", tratarClique, true);

        // re-libera pointer-events depois do Realtime atualizar DOM
        setInterval(function () {
            liberarPointerEvents();
        }, 3000);

        log("Ativo. Cliques delegados no document (capture).");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
