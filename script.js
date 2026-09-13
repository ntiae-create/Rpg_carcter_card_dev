/* =========================================================
   RPG CHARACTER CARD
   NAVEGAÇÃO ENTRE AS 4 DIMENSÕES
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const buttons = document.querySelectorAll(".dimension-button");
    const dimensions = document.querySelectorAll(".card-dimension");


    /* =====================================================
       TROCA DE DIMENSÃO
       ===================================================== */

    function abrirDimensao(nome) {

        /* Botões */

        buttons.forEach(button => {

            const dimension = button.dataset.dimension;

            button.classList.toggle(
                "active",
                dimension === nome
            );

        });


        /* Conteúdo */

        dimensions.forEach(dimension => {

            const content = dimension.dataset.dimensionContent;

            dimension.classList.toggle(
                "active",
                content === nome
            );

        });

    }


    /* =====================================================
       EVENTOS DOS BOTÕES
       ===================================================== */

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const dimension = button.dataset.dimension;

            abrirDimensao(dimension);

        });

    });


    /* =====================================================
       DIMENSÃO INICIAL
       ===================================================== */

    abrirDimensao("character");

});
