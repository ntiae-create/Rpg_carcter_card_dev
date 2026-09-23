/* =========================================================
   MESA — CLIQUES À PROVA DE FALHA (v3.1)
   Carregar por ÚLTIMO no mesa.html

   Problema tratado:
   - 1º clique funciona
   - depois tudo "morre"
   Causa típica: overlay (menu mestre / diagnóstico / ficha)
   fica invisível por cima e engole os próximos toques.
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

        // área central (CTE e tela principal)
        var stage = $("mesa-stage") || document.querySelector(".mesa-stage");
        var screen = $("mesa-screen");
        var content = $("mesa-screen-content");
        [stage, screen, content].forEach(function (el) {
            if (el) {
                el.style.pointerEvents = "auto";
            }
        });

        // botão do CTE
        var cteBtn = $("cte-click-button");
        if (cteBtn) {
            cteBtn.style.pointerEvents = "auto";
            cteBtn.style.cursor = "pointer";
            cteBtn.style.zIndex = "100";
            cteBtn.style.position = "relative";
        }

        // cards dos jogadores
        var grid = $("jogadores");
        if (grid) {
            grid.style.pointerEvents = "none";
        }

        document.querySelectorAll(".player-card, [data-player]").forEach(function (card) {
            card.style.pointerEvents = "auto";
        });

        // botões do cabeçalho e ações
        document.querySelectorAll(
            "#btn-diagnostico, #btn-configuracoes, .mesa-settings-btn, .mesa-diagnostico-btn, [data-mesa-action], [data-master-action], #btn-fechar-diagnostico, #btn-limpar-diagnostico"
        ).forEach(function (btn) {
            btn.style.pointerEvents = "auto";
            btn.style.cursor = "pointer";
        });

        var header = document.querySelector(".mesa-header-actions");
        if (header) {
            header.style.pointerEvents = "none";
            header.querySelectorAll("button, a").forEach(function (b) {
                b.style.pointerEvents = "auto";
                b.style.zIndex = "10050";
            });
        }
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
            // sempre libera pointer-events primeiro
            liberarPointerEvents();

            // fechar diagnóstico
            if (target.closest("#btn-fechar-diagnostico")) {
                event.preventDefault();
                event.stopPropagation();
                fecharOverlay($("mesa-diagnostico"));
                liberarPointerEvents();
                return;
            }

            // botão diagnóstico
            if (target.closest("#btn-diagnostico")) {
                event.preventDefault();
                event.stopPropagation();
                var painel = $("mesa-diagnostico");
                if (overlayVisivel(painel)) {
                    fecharOverlay(painel);
                    liberarPointerEvents();
                } else if (painel) {
                    fecharTudoQueBloqueia();
                    abrirOverlay(painel, "flex");
                    if (window.MesaDiagnostico && typeof window.MesaDiagnostico.abrir === "function") {
                        try { window.MesaDiagnostico.abrir(); } catch (e) {}
                    }
                }
                return;
            }

            // botão configurações
            if (target.closest("#btn-configuracoes")) {
                event.preventDefault();
                event.stopPropagation();
                var menu = $("master-menu");
                if (overlayVisivel(menu)) {
                    fecharOverlay(menu);
                    liberarPointerEvents();
                } else if (menu) {
                    fecharTudoQueBloqueia();
                    abrirOverlay(menu, "flex");
                }
                return;
            }

            // clique no fundo do menu / diagnóstico / ficha → fecha
            if (target.id === "master-menu" || target.id === "mesa-diagnostico" || target.id === "ficha-overlay") {
                event.preventDefault();
                event.stopPropagation();
                forcarUILivre();
                return;
            }

            // ações do mestre
            var masterAction = target.closest("[data-master-action]");
            if (masterAction) {
                var acaoMaster = masterAction.getAttribute("data-master-action");
                document.dispatchEvent(new CustomEvent("mesa:masterAction", {
                    detail: { acao: acaoMaster, elemento: masterAction }
                }));
                // fecha o menu depois da ação
                setTimeout(forcarUILivre, 50);
                return;
            }

            // ações da mesa / CTE
            var mesaAction = target.closest("[data-mesa-action]");
            if (mesaAction) {
                var acao = mesaAction.getAttribute("data-mesa-action");
                var cteAcao = mesaAction.getAttribute("data-cte-action");

                if (acao === "cte" || cteAcao === "clique") {
                    if (window.MesaRPG && typeof window.MesaRPG.executarCliqueCTE === "function") {
                        event.preventDefault();
                        window.MesaRPG.executarCliqueCTE(mesaAction, event);
                        setTimeout(liberarPointerEvents, 30);
                        return;
                    }
                }

                if (cteAcao === "iniciar" && window.MesaRPG && typeof window.MesaRPG.iniciarCTE === "function") {
                    event.preventDefault();
                    window.MesaRPG.iniciarCTE();
                    setTimeout(liberarPointerEvents, 30);
                    return;
                }

                if (acao === "voltar" && window.MesaRPG && typeof window.MesaRPG.voltarParaMesaNormal === "function") {
                    event.preventDefault();
                    window.MesaRPG.voltarParaMesaNormal();
                    forcarUILivre();
                    return;
                }
            }

            // se algum overlay ainda estiver aberto, não processa card por baixo
            if (overlayVisivel($("master-menu")) || overlayVisivel($("mesa-diagnostico")) || overlayVisivel($("ficha-overlay"))) {
                return;
            }

            // clique em card de jogador
            var card = target.closest("[data-player]");
            if (card && !target.closest("button, a, input, select, textarea")) {
                if (card.getAttribute("data-interactive") === "false") return;
                var slot = Number(card.getAttribute("data-player"));
                if (slot >= 1 && slot <= 8) {
                    if (window.MesaRPG && typeof window.MesaRPG.selecionarJogador === "function") {
                        window.MesaRPG.selecionarJogador(slot);
                    } else {
                        document.dispatchEvent(new CustomEvent("mesa:jogadorSelecionado", {
                            detail: { slot: slot }
                        }));
                    }
                }
            }

        } catch (erro) {
            forcarUILivre();
        }
    }

    function iniciar() {
        forcarUILivre();

        // capture = true → pega o clique antes de qualquer outro script
        document.addEventListener("click", tratarClique, true);

        document.addEventListener("pointerdown", function () {
            liberarPointerEvents();
        }, true);

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" || e.keyCode === 27) {
                forcarUILivre();
            }
        }, true);

        // proteção contínua
        setInterval(liberarPointerEvents, 1500);

        // depois que os outros scripts terminam de iniciar
        setTimeout(forcarUILivre, 300);
        setTimeout(forcarUILivre, 1000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
