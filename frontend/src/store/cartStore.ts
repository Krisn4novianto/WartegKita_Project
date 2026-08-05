import { create } from "zustand";
import { Menu } from "../types";

export interface CartItem {
  menu: Menu;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  storeId?: number | string;
  setStoreId: (id?: number | string) => void;

  addItem: (menu: Menu) => void;

  increase: (menuId: number | string) => void;

  decrease: (menuId: number | string) => void;

  remove: (menuId: number | string) => void;

  clear: () => void;

  total: () => number;
}

export const useCartStore =
  create<CartState>((set, get) => ({

    items: [],
    storeId: undefined,
    setStoreId: (id) => set({ storeId: id }),


    // TAMBAH MENU KE KERANJANG
    addItem: (menu) => {

      const existing =
        get().items.find(
          (item) =>
            item.menu.id === menu.id
        );

      if (existing) {

        set({
          items: get().items.map(
            (item) =>
              item.menu.id === menu.id
                ? {
                  ...item,
                  quantity:
                    item.quantity + 1,
                }
                : item
          ),
        });

        return;
      }

      set({
        items: [
          ...get().items,
          {
            menu,
            quantity: 1,
          },
        ],
      });

    },


    // TAMBAH JUMLAH
    increase: (menuId) => {

      set({
        items: get().items.map(
          (item) =>
            item.menu.id === menuId
              ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
              : item
        ),
      });

    },


    // KURANGI JUMLAH
    decrease: (menuId) => {

      set({
        items: get()
          .items
          .map(
            (item) =>
              item.menu.id === menuId
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
      });

    },


    // HAPUS ITEM
    remove: (menuId) => {

      set({
        items: get().items.filter(
          (item) =>
            item.menu.id !== menuId
        ),
      });

    },


    // KOSONGKAN KERANJANG
    clear: () => {

      set({
        items: [],
      });

    },


    // HITUNG TOTAL
    total: () => {

      return get().items.reduce(
        (sum, item) =>
          sum +
          item.menu.price *
          item.quantity,

        0
      );

    },

  }));