import { create } from "zustand";

export interface CartItem {
    id: number;

    menu_id: number;

    menu: {
        id: number;
        name: string;
        price: number;
        image: string;
    };

    quantity: number;

    // Optional kalau nanti mau catatan per-menu
    notes?: string;
}

interface CartStore {

    /* =====================================================
       CART
    ===================================================== */

    items: CartItem[];

    storeId: number | null;

    /* =====================================================
       ORDER NOTE
    ===================================================== */

    orderNote: string;

    setOrderNote: (note: string) => void;

    /* =====================================================
       STORE
    ===================================================== */

    setStoreId: (id: number) => void;

    /* =====================================================
       CART ACTION
    ===================================================== */

    addItem: (item: CartItem) => void;

    increase: (menuId: number) => void;

    decrease: (menuId: number) => void;

    remove: (menuId: number) => void;

    clear: () => void;

    total: () => number;
}


export const useCartStore =
    create<CartStore>((set, get) => ({

        /* =================================================
           INITIAL STATE
        ================================================= */

        items: [],

        storeId: null,

        orderNote: "",


        /* =================================================
           STORE ID
        ================================================= */

        setStoreId: (id) =>
            set({
                storeId: id,
            }),


        /* =================================================
           ORDER NOTE
        ================================================= */

        setOrderNote: (note) =>
            set({
                orderNote: note.slice(0, 500),
            }),


        /* =================================================
           ADD ITEM
        ================================================= */

        addItem: (newItem) =>
            set((state) => {

                const existingItem =
                    state.items.find(
                        (item) =>
                            item.menu_id ===
                            newItem.menu_id
                    );


                /* -----------------------------------------
                   ITEM SUDAH ADA
                ----------------------------------------- */

                if (existingItem) {

                    return {

                        items:
                            state.items.map(
                                (item) =>
                                    item.menu_id ===
                                        newItem.menu_id
                                        ? {
                                            ...item,

                                            quantity:
                                                item.quantity +
                                                newItem.quantity,
                                        }
                                        : item
                            ),

                    };
                }


                /* -----------------------------------------
                   ITEM BARU
                ----------------------------------------- */

                return {

                    items: [
                        ...state.items,
                        newItem,
                    ],

                };

            }),


        /* =================================================
           INCREASE
        ================================================= */

        increase: (menuId) =>
            set((state) => ({

                items:
                    state.items.map(
                        (item) =>
                            item.menu_id ===
                                menuId
                                ? {
                                    ...item,

                                    quantity:
                                        item.quantity +
                                        1,
                                }
                                : item
                    ),

            })),


        /* =================================================
           DECREASE
        ================================================= */

        decrease: (menuId) =>
            set((state) => ({

                items:
                    state.items
                        .map(
                            (item) =>
                                item.menu_id ===
                                    menuId
                                    ? {
                                        ...item,

                                        quantity:
                                            item.quantity -
                                            1,
                                    }
                                    : item
                        )
                        .filter(
                            (item) =>
                                item.quantity > 0
                        ),

            })),


        /* =================================================
           REMOVE
        ================================================= */

        remove: (menuId) =>
            set((state) => ({

                items:
                    state.items.filter(
                        (item) =>
                            item.menu_id !==
                            menuId
                    ),

            })),


        /* =================================================
           CLEAR CART
        ================================================= */

        clear: () =>
            set({

                items: [],

                storeId: null,

                orderNote: "",

            }),


        /* =================================================
           TOTAL
        ================================================= */

        total: () =>
            get().items.reduce(

                (sum, item) =>
                    sum +
                    item.menu.price *
                    item.quantity,

                0

            ),

    }));