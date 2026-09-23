/* =========================================================
   MESA — CLIQUES À PROVA DE FALHA (v3 - agressivo)
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
        el.style.cssText += ";display:none!important;pointer-events:none!important;visibility:hidden!important;opacity:0!important;";
    }

    function fecharTudoQueBloqueia() {
        fecharOverlay($("master-menu"));
        fecharOverlay($("mesa-diagnostico"));
        fecharOverlay($("ficha-overlay"));
        fecharOverlay($("ficha-modal"));

        // qualquer outro overlay que possa ter sido criado
        document.querySelectorAll(".master-menu, .mesa-diagnostico, .ficha-overlay, [data-overlay]").forEach(function (el) {
            if (el.id === "master-menu" || el.id === "mesa-diagnostico" || el.id === "ficha-overlay" || el.id === "ficha-modal") {
                fecharOverlay(el);
            }
        });
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
        if (grid) grid.style.pointerEvents = "none";

        document.querySelectorAll(".player-card, [data-player]").forEach(function (card) {
            card.style.pointerEvents = "auto";
        });

        // botões do cabeçalho
        document.querySelectorAll(
            "#btn-diagnostico, #btn-configuracoes, .mesa-settings-btn, .mesa-diagnostico-btn, [data-mesa-action], [data-master-action], #btn-fechar-diagnostico"
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

    function tratarClique(event) {
        var target = event.target;
        if (!target || !target.closest) return;

        try {
            // sempre libera a UI primeiro
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
                if (painel && !painel.hidden && painel.style.display !== "none") {
                    fecharOverlay(painel);
                } else if (painel) {
                    fecharTudoQueBloqueia();
                    painel.hidden = false;
                    painel.removeAttribute("hidden");
                    painel.style.display = "flex";
                    painel.style.pointerEvents = "auto";
                    painel.style.visibility = "visible";
                    painel.style.opacity = "1";
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
                if (menu && !menu.hidden && menu.style.display !== "none") {
                    fecharOverlay(menu);
                    liberarPointerEvents();
                } else if (menu) {
                    fecharTudoQueBloqueia();
                    menu.hidden = false;
                    menu.removeAttribute("hidden");
                    menu.style.display = "flex";
                    menu.style.pointerEvents = "auto";
                    menu.style.visibility = "visible";
                    menu.style.opacity = "1";
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
                        // libera de novo depois do clique do CTE
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

            // se algum overlay ainda estiver aberto, não processa card
            var menuAberto = \( ("master-menu") && ! \)("master-menu").hidden && $("master-menu").style.display !== "none";
            var diagAberto = \( ("mesa-diagnostico") && ! \)("mesa-diagnostico").hidden && $("mesa-diagnostico").style.display !== "none";
            if (menuAberto || diagAberto) {
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

        // a cada 1,5s força a UI livre (proteção extra)
        setInterval(liberarPointerEvents, 1500);

        // depois de 300ms (quando outros scripts terminam) força de novo
        setTimeout(forcarUILivre, 300);
        setTimeout(forcarUILivre, 1000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
