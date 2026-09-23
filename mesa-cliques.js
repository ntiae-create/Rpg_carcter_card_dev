/* =========================================================
   MESA — CLIQUES À PROVA DE FALHA (v3.2)
   Carregar por ÚLTIMO no mesa.html
========================================================= */

(function () {
    "use strict";

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
        el.style.opacity = "0";
    }

    function abrirOverlay(el, displayValue) {
        if (!el) return;
        el.hidden = false;
        el.removeAttribute("hidden");
        el.style.display = displayValue || "flex";
        el.style.pointerEvents = "auto";
        el.style.visibility = "visible";
        el.style.opacity = "1";
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

        var stage = $("mesa-stage") || document.querySelector(".mesa-stage");
        var screen = $("mesa-screen");
        var content = $("mesa-screen-content");
        [stage, screen, content].forEach(function (el) {
            if (el) el.style.pointerEvents = "auto";
        });

        var cteBtn = $("cte-click-button");
        if (cteBtn) {
            cteBtn.style.pointerEvents = "auto";
            cteBtn.style.cursor = "pointer";
            cteBtn.style.zIndex = "100";
            cteBtn.style.position = "relative";
        }

        var grid = $("jogadores");
        if (grid) grid.style.pointerEvents = "none";

        document.querySelectorAll(".player-card, [data-player]").forEach(function (card) {
            card.style.pointerEvents = "auto";
        });

        document.querySelectorAll(
            "#btn-diagnostico, #btn-configuracoes, #btn-fechar-diagnostico, button, a, [data-mesa-action]"
        ).forEach(function (btn) {
            if (btn) {
                btn.style.pointerEvents = "auto";
                btn.style.cursor = "pointer";
            }
        });
    }

    function forcarUILivre() {
        fecharTudoQueBloqueia();
        liberarPointerEvents();
    }

    function overlayVisivel(el) {
        if (!el) return false;
        if (el.hidden) return false;
        if (el.style.display === "none") return false;
        try {
            var st = window.getComputedStyle(el);
            return st.display !== "none" && st.visibility !== "hidden" && st.opacity !== "0";
        } catch (e) {
            return false;
        }
    }

    function tratarClique(event) {
        var target = event.target;
        if (!target || !target.closest) return;

        try {
            liberarPointerEvents();

            // botão fechar diagnóstico / config
            if (target.closest("#btn-fechar-diagnostico") || target.closest(".diagnostico-fechar")) {
                fecharTudoQueBloqueia();
                return;
            }

            // abrir diagnóstico
            if (target.closest("#btn-diagnostico")) {
                return;
            }

            // abrir configurações / menu mestre
            if (target.closest("#btn-configuracoes")) {
                return;
            }

            // clique fora de overlays abertos → fecha
            var menu = $("master-menu");
            var diag = $("mesa-diagnostico");
            if (overlayVisivel(menu) && !target.closest("#master-menu")) {
                fecharTudoQueBloqueia();
                return;
            }
            if (overlayVisivel(diag) && !target.closest("#mesa-diagnostico")) {
                fecharTudoQueBloqueia();
                return;
            }

            // CTE
            var cteBtn = target.closest("#cte-click-button, [data-cte-action='clique']");
            if (cteBtn) {
                event.preventDefault();
                event.stopPropagation();
                if (window.MesaRPG && typeof window.MesaRPG.executarCliqueCTE === "function") {
                    window.MesaRPG.executarCliqueCTE();
                }
                setTimeout(forcarUILivre, 50);
                return;
            }

            // ações data-mesa-action
            var actionEl = target.closest("[data-mesa-action]");
            if (actionEl) {
                var action = actionEl.getAttribute("data-mesa-action");
                if (action === "cte" && window.MesaRPG && typeof window.MesaRPG.iniciarCTE === "function") {
                    window.MesaRPG.iniciarCTE();
                }
                setTimeout(forcarUILivre, 50);
                return;
            }

            // card de jogador
            var card = target.closest(".player-card, [data-player]");
            if (card) {
                var slot = Number(card.getAttribute("data-player") || card.dataset.player);
                if (window.MesaRPG && typeof window.MesaRPG.selecionarJogador === "function") {
                    window.MesaRPG.selecionarJogador(slot);
                }
                return;
            }

            // qualquer clique solto: garante UI livre
            forcarUILivre();
        } catch (err) {
            try { forcarUILivre(); } catch (e2) {}
        }
    }

    function iniciar() {
        forcarUILivre();

        document.addEventListener("click", tratarClique, true);

        document.addEventListener("pointerdown", function () {
            liberarPointerEvents();
        }, true);

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                forcarUILivre();
            }
        }, true);

        setTimeout(forcarUILivre, 300);
        setTimeout(forcarUILivre, 1000);
        setInterval(forcarUILivre, 2000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
