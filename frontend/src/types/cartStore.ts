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

    notes?: string;

}



interface CartStore {

    items: CartItem[];

    storeId: number | null;

    setStoreId: (id: number) => void;

    addItem: (item: CartItem) => void;

    increase: (menuId: number) => void;

    decrease: (menuId: number) => void;

    remove: (menuId: number) => void;

    clear: () => void;

    total: () => number;

}



export const useCartStore = create<CartStore>((set, get) => ({

    items: [],

    storeId: null,


    setStoreId: (id) =>
        set({
            storeId: id
        }),



    addItem: (newItem) =>
        set((state) => {

            const existingItem = state.items.find(
                (item) =>
                    item.menu_id === newItem.menu_id
            );


            if (existingItem) {

                return {

                    items: state.items.map((item) =>
                        item.menu_id === newItem.menu_id
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


            return {

                items: [
                    ...state.items,
                    newItem
                ],

            };

        }),



    increase: (menuId) =>
        set((state) => ({

            items: state.items.map((item) =>
                item.menu_id === menuId
                    ? {
                        ...item,
                        quantity:
                            item.quantity + 1,
                    }
                    : item
            ),

        })),



    decrease: (menuId) =>
        set((state) => ({

            items: state.items
                .map((item) =>
                    item.menu_id === menuId
                        ? {
                            ...item,
                            quantity:
                                item.quantity - 1,
                        }
                        : item
                )
                .filter(
                    (item) =>
                        item.quantity > 0
                ),

        })),



    remove: (menuId) =>
        set((state) => ({

            items: state.items.filter(
                (item) =>
                    item.menu_id !== menuId
            ),

        })),



    clear: () =>
        set({

            items: [],

            storeId: null,

        }),



    total: () =>
        get().items.reduce(

            (sum, item) =>
                sum +
                item.menu.price *
                item.quantity,

            0

        ),


}));