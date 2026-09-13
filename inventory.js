/* =========================================================
   RPG CHARACTER CARD
   MÓDULO: INVENTÁRIO
========================================================= */

const InventoryModule = (() => {

    /* =====================================================
       CONFIGURAÇÕES
    ===================================================== */

    const BASE_SLOTS = 50;

    const EXTRA_SLOTS_PER_LEVEL_BLOCK = 50;

    const LEVEL_BLOCK = 10;


    /* =====================================================
       INICIALIZAÇÃO
    ===================================================== */

    function iniciar() {

        garantirInventario();

        configurarEquipamentos();

        atualizar();

    }


    /* =====================================================
       GARANTIR ESTRUTURA
    ===================================================== */

    function garantirInventario() {

        if (!character.inventory) {

            character.inventory = {
                items: [],
                equipment: {
                    weapon: "",
                    armor: "",
                    accessory: "",
                    relic: ""
                }
            };

        }


        if (
            !Array.isArray(
                character.inventory.items
            )
        ) {

            character.inventory.items = [];

        }


        if (
            !character.inventory.equipment
        ) {

            character.inventory.equipment = {
                weapon: "",
                armor: "",
                accessory: "",
                relic: ""
            };

        }

    }


    /* =====================================================
       CAPACIDADE
    ===================================================== */

    function obterCapacidade() {

        const level =
            Number(character.level) || 1;


        const blocos =
            Math.floor(
                level / LEVEL_BLOCK
            );


        return (
            BASE_SLOTS +
            (
                blocos *
                EXTRA_SLOTS_PER_LEVEL_BLOCK
            )
        );

    }


    /* =====================================================
       EQUIPAMENTOS
    ===================================================== */

    function configurarEquipamentos() {

        const fields = {

            weapon:
                get("equipment-weapon"),

            armor:
                get("equipment-armor"),

            accessory:
                get("equipment-accessory"),

            relic:
                get("equipment-relic")

        };


        Object.entries(fields)
            .forEach(
                ([type, field]) => {

                    if (!field) {

                        return;

                    }


                    if (
                        field.dataset
                            .inventoryConfigured ===
                        "true"
                    ) {

                        return;

                    }


                    field.dataset
                        .inventoryConfigured =
                        "true";


                    field.value =
                        character.inventory
                            .equipment[type] ||
                        "";


                    field.addEventListener(
                        "input",
                        () => {

                            character.inventory
                                .equipment[type] =
                                field.value;


                            salvarPersonagem();

                        }
                    );

                }
            );

    }


    /* =====================================================
       ADICIONAR ITEM
    ===================================================== */

    function adicionarItem(
        nome,
        quantidade = 1
    ) {

        garantirInventario();


        nome =
            String(nome || "")
                .trim();


        quantidade =
            Number(quantidade);


        if (
            !nome ||
            !Number.isFinite(
                quantidade
            ) ||
            quantidade <= 0
        ) {

            return false;

        }


        const capacidade =
            obterCapacidade();


        if (
            character.inventory.items
                .length >= capacidade
        ) {

            return false;

        }


        character.inventory.items.push({

            name: nome,

            quantity:
                Math.floor(
                    quantidade
                )

        });


        atualizar();

        salvarPersonagem();


        return true;

    }


    /* =====================================================
       REMOVER ITEM
    ===================================================== */

    function removerItem(index) {

        garantirInventario();


        if (
            index < 0 ||
            index >=
            character.inventory.items
                .length
        ) {

            return false;

        }


        character.inventory.items
            .splice(index, 1);


        atualizar();

        salvarPersonagem();


        return true;

    }


    /* =====================================================
       ALTERAR QUANTIDADE
    ===================================================== */

    function alterarQuantidade(
        index,
        quantidade
    ) {

        garantirInventario();


        const item =
            character.inventory.items[
                index
            ];


        if (!item) {

            return false;

        }


        quantidade =
            Number(quantidade);


        if (
            !Number.isFinite(
                quantidade
            ) ||
            quantidade <= 0
        ) {

            removerItem(index);

            return true;

        }


        item.quantity =
            Math.floor(
                quantidade
            );


        atualizar();

        salvarPersonagem();


        return true;

    }


    /* =====================================================
       ATUALIZAR INTERFACE
    ===================================================== */

    function atualizar() {

        if (!character) {

            return;

        }


        garantirInventario();


        const capacidade =
            obterCapacidade();


        definirTexto(
            "inventory-capacity",
            capacidade
        );


        definirTexto(
            "inventory-slots",
            `${character.inventory.items.length}/${capacidade}`
        );


        atualizarLista();

        sincronizarEquipamentos();

    }


    /* =====================================================
       LISTA DE ITENS
    ===================================================== */

    function atualizarLista() {

        const list =
            get("inventory-list");


        if (!list) {

            return;

        }


        list.innerHTML = "";


        if (
            !character.inventory.items
                .length
        ) {

            list.innerHTML = `
                <div class="inventory-empty">
                    <span>🎒</span>
                    <p>Inventário vazio.</p>
                </div>
            `;


            return;

        }


        character.inventory.items
            .forEach(
                (item, index) => {

                    const element =
                        document.createElement(
                            "div"
                        );


                    element.className =
                        "inventory-item";


                    element.innerHTML = `

                        <div class="inventory-item-info">

                            <strong>
                                ${escaparHTML(
                                    item.name
                                )}
                            </strong>

                            <small>
                                Quantidade:
                                ${item.quantity}
                            </small>

                        </div>

                        <button
                            type="button"
                            class="inventory-remove-button"
                            data-inventory-index="${index}"
                        >
                            REMOVER
                        </button>

                    `;


                    const removeButton =
                        element.querySelector(
                            ".inventory-remove-button"
                        );


                    removeButton.addEventListener(
                        "click",
                        event => {

                            event.stopPropagation();


                            removerItem(
                                index
                            );

                        }
                    );


                    list.appendChild(
                        element
                    );

                }
            );

    }


    /* =====================================================
       SINCRONIZAR EQUIPAMENTOS
    ===================================================== */

    function sincronizarEquipamentos() {

        const equipment =
            character.inventory
                .equipment;


        const fields = {

            weapon:
                get(
                    "equipment-weapon"
                ),

            armor:
                get(
                    "equipment-armor"
                ),

            accessory:
                get(
                    "equipment-accessory"
                ),

            relic:
                get(
                    "equipment-relic"
                )

        };


        Object.entries(fields)
            .forEach(
                ([type, field]) => {

                    if (
                        field &&
                        document.activeElement !==
                        field
                    ) {

                        field.value =
                            equipment[type] ||
                            "";

                    }

                }
            );

    }


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function get(id) {

        return document.getElementById(id);

    }


    function definirTexto(
        id,
        value
    ) {

        const element =
            get(id);


        if (element) {

            element.textContent =
                value;

        }

    }


    function escaparHTML(
        text
    ) {

        return String(text)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );

    }


    /* =====================================================
       API
    ===================================================== */

    return {

        iniciar,

        atualizar,

        obterCapacidade,

        adicionarItem,

        removerItem,

        alterarQuantidade

    };

})();
