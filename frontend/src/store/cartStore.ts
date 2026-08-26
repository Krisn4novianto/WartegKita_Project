import { create } from "zustand";


/* =====================================================
   CART MENU
===================================================== */

export interface CartMenu {
  id: string | number;

  name: string;

  price: number;

  image: string;

  seller_id?: string | number;

  seller_name?: string;

  stock?: number;

  available?: boolean;

  category?: string;

  description?: string;
}


/* =====================================================
   CART ITEM
===================================================== */

export interface CartItem {

  /*
    ID unik item di cart.

    Jangan menggunakan menu_id sebagai ID utama
    karena satu menu bisa memiliki note berbeda.

    Contoh:

    Nasi Goreng
    - Note: Pedas
    - Note: Tidak pedas

    Keduanya harus bisa menjadi cart item berbeda.
  */

  id: string;


  /*
    ID menu dari backend.
  */

  menu_id: string | number;


  /*
    Snapshot data menu.
  */

  menu: CartMenu;


  /*
    Jumlah item.
  */

  quantity: number;


  /*
    Catatan khusus item.

    Contoh:

    "Pedas"
    "Jangan pakai bawang"
    "Sambalnya dipisah"
  */

  note: string;
}


/* =====================================================
   ADD CART ITEM INPUT
===================================================== */

export interface AddCartItemInput {

  id: string | number;

  name: string;

  price: number;

  image?: string;

  seller_id?: string | number;

  seller_name?: string;

  stock?: number;

  available?: boolean;

  category?: string;

  description?: string;

  quantity?: number;

  note?: string;
}


/* =====================================================
   CART STORE
===================================================== */

interface CartStore {

  /* =================================================
     ITEMS
  ================================================= */

  items: CartItem[];


  /* =================================================
     SELLER / STORE
  ================================================= */

  /*
    Satu cart hanya boleh berisi satu seller.

    UUID backend disimpan sebagai string.
  */

  storeId: string | null;


  /* =================================================
     ORDER NOTE
  ================================================= */

  /*
    Catatan umum untuk seluruh pesanan.

    Contoh:

    "Tolong antar ke satpam."

    Berbeda dengan item.note:

    item.note:
    "Nasi goreng jangan pedas."

    orderNote:
    "Antar ke satpam."
  */

  orderNote: string;


  /* =================================================
     ACTIONS
  ================================================= */

  setStoreId: (
    id: string | number
  ) => void;


  addItem: (
    item: AddCartItemInput
  ) => void;


  increase: (
    cartItemId: string
  ) => void;


  decrease: (
    cartItemId: string
  ) => void;


  remove: (
    cartItemId: string
  ) => void;


  setItemNote: (
    cartItemId: string,
    note: string
  ) => void;


  setOrderNote: (
    note: string
  ) => void;


  clear: () => void;


  total: () => number;
}


/* =====================================================
   HELPER
===================================================== */

/*
  Membuat ID unik untuk cart item.

  menu_id tetap disimpan terpisah.

  ID cart item dipakai untuk:

  - increase
  - decrease
  - remove
  - setItemNote
*/

const createCartItemId = (
  menuId: string | number,
): string => {

  return [
    String(menuId),
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 9),
  ].join("-");

};


/* =====================================================
   NORMALIZE NOTE
===================================================== */

const normalizeNote = (
  note?: string | null,
): string => {

  return String(
    note ?? "",
  )
    .trim()
    .slice(
      0,
      200,
    );

};


/* =====================================================
   NORMALIZE ORDER NOTE
===================================================== */

const normalizeOrderNote = (
  note?: string | null,
): string => {

  return String(
    note ?? "",
  )
    .trim()
    .slice(
      0,
      500,
    );

};


/* =====================================================
   NORMALIZE QUANTITY
===================================================== */

const normalizeQuantity = (
  quantity?: number,
): number => {

  const value =
    Number(
      quantity ?? 1,
    );


  if (
    !Number.isFinite(
      value,
    )
  ) {

    return 1;

  }


  return Math.max(
    1,
    Math.floor(
      value,
    ),
  );

};


/* =====================================================
   NORMALIZE STOCK
===================================================== */

const normalizeStock = (
  stock?: number | null,
): number => {

  const value =
    Number(
      stock ?? 0,
    );


  if (
    !Number.isFinite(
      value,
    )
  ) {

    return 0;

  }


  return Math.max(
    0,
    Math.floor(
      value,
    ),
  );

};


/* =====================================================
   NORMALIZE SELLER ID
===================================================== */

const normalizeSellerId = (
  sellerId?: string | number | null,
): string => {

  return String(
    sellerId ?? "",
  ).trim();

};


/* =====================================================
   LIMIT QUANTITY BY STOCK
===================================================== */

const limitQuantityByStock = (
  quantity: number,
  stock: number,
): number => {

  /*
    stock > 0:
    batasi quantity sesuai stok.

    stock === 0:
    jangan otomatis dianggap unlimited.

    Namun fungsi ini hanya membatasi jika stock > 0.
    Validasi available tetap dilakukan oleh UI/backend.
  */

  if (
    stock > 0
  ) {

    return Math.min(
      quantity,
      stock,
    );

  }


  return quantity;

};


/* =====================================================
   STORE
===================================================== */

export const useCartStore =
  create<CartStore>(
    (set, get) => ({

      /* =================================================
         INITIAL STATE
      ================================================= */

      /*
        PENTING:

        TIDAK menggunakan persist.

        Tidak ada:

        localStorage
        sessionStorage
        persist()

        Jadi perilakunya:

        Pindah halaman:
        - cart tetap ada

        React route berubah:
        - cart tetap ada

        Checkout:
        - cart tetap ada

        Payment:
        - cart tetap ada sampai di-clear

        Refresh/F5:
        - cart hilang

        Tutup browser:
        - cart hilang

        Ini memang behavior yang kita inginkan.
      */

      items: [],

      storeId: null,

      orderNote: "",


      /* =================================================
         SET STORE ID
      ================================================= */

      setStoreId: (
        id,
      ) => {

        const normalizedId =
          normalizeSellerId(
            id,
          );


        /*
          Seller ID kosong tidak boleh
          dimasukkan ke cart.
        */

        if (
          !normalizedId
        ) {

          return;

        }


        set({
          storeId:
            normalizedId,
        });

      },


      /* =================================================
         ADD ITEM
      ================================================= */

      addItem: (
        newItem,
      ) => {

        set(
          (
            state,
          ) => {

            /* =========================================
               MENU ID
            ========================================= */

            const menuId =
              String(
                newItem.id,
              ).trim();


            if (
              !menuId
            ) {

              return state;

            }


            /* =========================================
               SELLER ID
            ========================================= */

            const newSellerId =
              normalizeSellerId(
                newItem.seller_id,
              );


            /*
              Seller ID wajib tersedia.

              Jangan memasukkan item tanpa seller ID
              karena nanti cart tidak bisa mengetahui
              item berasal dari warteg mana.
            */

            if (
              !newSellerId
            ) {

              return state;

            }


            /* =========================================
               QUANTITY
            ========================================= */

            const quantity =
              normalizeQuantity(
                newItem.quantity,
              );


            /* =========================================
               NOTE
            ========================================= */

            const note =
              normalizeNote(
                newItem.note,
              );


            /* =========================================
               STOCK
            ========================================= */

            const stock =
              normalizeStock(
                newItem.stock,
              );


            /* =========================================
               SELLER VALIDATION
            ========================================= */

            /*
              Cart hanya boleh berisi satu seller.

              Contoh:

              Cart:
              Seller A

              User buka Seller B
              lalu klik menu B

              Item TIDAK langsung dimasukkan.

              StoreDetail akan menampilkan modal
              "Ganti warteg?"
            */

            if (

              state.storeId &&

              String(
                state.storeId,
              ) !== newSellerId

            ) {

              return state;

            }


            /* =========================================
               FINAL QUANTITY
            ========================================= */

            const finalQuantity =
              limitQuantityByStock(
                quantity,
                stock,
              );


            /* =========================================
               FIND EXISTING ITEM
            ========================================= */

            /*
              Item dianggap sama jika:

              menu_id sama
              DAN
              note sama.

              Contoh:

              Nasi Goreng
              note: "Pedas"

              Nasi Goreng
              note: "Pedas"

              => DIGABUNG.

              Sedangkan:

              Nasi Goreng
              note: "Pedas"

              Nasi Goreng
              note: "Tidak pedas"

              => ITEM BERBEDA.
            */

            const existingItem =
              state.items.find(
                (
                  item,
                ) =>
                  String(
                    item.menu_id,
                  ) === menuId &&
                  normalizeNote(
                    item.note,
                  ) === note &&
                  normalizeSellerId(
                    item.menu.seller_id,
                  ) === newSellerId,
              );


            /* =========================================
               EXISTING ITEM
            ========================================= */

            if (
              existingItem
            ) {

              const existingStock =
                normalizeStock(
                  existingItem.menu.stock,
                );


              /*
                Prioritaskan stock baru
                jika tersedia.

                Kalau stock baru 0,
                gunakan stock lama.
              */

              const effectiveStock =
                stock > 0
                  ? stock
                  : existingStock;


              const nextQuantity =
                existingItem.quantity +
                finalQuantity;


              const finalMergedQuantity =
                limitQuantityByStock(
                  nextQuantity,
                  effectiveStock,
                );


              return {

                ...state,

                items:
                  state.items.map(
                    (
                      item,
                    ) => {

                      if (
                        item.id !==
                        existingItem.id
                      ) {

                        return item;

                      }


                      return {

                        ...item,

                        quantity:
                          finalMergedQuantity,

                        menu: {

                          ...item.menu,

                          id:
                            newItem.id,

                          name:
                            String(
                              newItem.name ??
                              item.menu.name ??
                              "",
                            ),

                          price:
                            Number(
                              newItem.price ??
                              item.menu.price ??
                              0,
                            ) || 0,

                          image:
                            String(
                              newItem.image ??
                              item.menu.image ??
                              "",
                            ),

                          seller_id:
                            newSellerId,

                          seller_name:
                            newItem.seller_name ??
                            item.menu.seller_name,

                          stock:
                            stock > 0
                              ? stock
                              : item.menu.stock,

                          available:
                            newItem.available ??
                            item.menu.available,

                          category:
                            newItem.category ??
                            item.menu.category,

                          description:
                            newItem.description ??
                            item.menu.description,

                        },

                      };

                    },
                  ),

              };

            }


            /* =========================================
               NEW CART ITEM
            ========================================= */

            const cartItemId =
              createCartItemId(
                menuId,
              );


            const cartItem:
              CartItem = {

              id:
                cartItemId,

              menu_id:
                menuId,

              menu: {

                id:
                  menuId,

                name:
                  String(
                    newItem.name ??
                    "",
                  ),

                price:
                  Number(
                    newItem.price,
                  ) || 0,

                image:
                  String(
                    newItem.image ??
                    "",
                  ),

                seller_id:
                  newSellerId,

                seller_name:
                  newItem.seller_name,

                stock:
                  stock,

                available:
                  newItem.available,

                category:
                  newItem.category,

                description:
                  newItem.description,

              },

              quantity:
                finalQuantity,

              note:
                note,

            };


            return {

              ...state,

              /*
                Jika cart kosong,
                seller pertama menjadi seller cart.

                Kalau sudah ada seller,
                seller tidak berubah.
              */

              storeId:
                state.storeId ??
                newSellerId,

              items: [
                ...state.items,
                cartItem,
              ],

            };

          },
        );

      },


      /* =================================================
         INCREASE
      ================================================= */

      increase: (
        cartItemId,
      ) => {

        set(
          (
            state,
          ) => {

            const updatedItems =
              state.items.map(
                (
                  item,
                ) => {

                  if (
                    item.id !==
                    cartItemId
                  ) {

                    return item;

                  }


                  const stock =
                    normalizeStock(
                      item.menu.stock,
                    );


                  const nextQuantity =
                    item.quantity +
                    1;


                  /*
                    Jangan melebihi stock
                    kalau stock tersedia.
                  */

                  if (

                    stock > 0 &&

                    nextQuantity >
                    stock

                  ) {

                    return item;

                  }


                  return {

                    ...item,

                    quantity:
                      nextQuantity,

                  };

                },
              );


            return {

              ...state,

              items:
                updatedItems,

            };

          },
        );

      },


      /* =================================================
         DECREASE
      ================================================= */

      decrease: (
        cartItemId,
      ) => {

        set(
          (
            state,
          ) => {

            const updatedItems =
              state.items
                .map(
                  (
                    item,
                  ) => {

                    if (
                      item.id !==
                      cartItemId
                    ) {

                      return item;

                    }


                    return {

                      ...item,

                      quantity:
                        Math.max(
                          0,
                          item.quantity -
                          1,
                        ),

                    };

                  },
                )
                .filter(
                  (
                    item,
                  ) =>
                    item.quantity >
                    0,
                );


            /*
              Kalau semua item sudah dihapus,
              seller dan order note juga harus
              di-reset.
            */

            if (
              updatedItems.length ===
              0
            ) {

              return {

                items: [],

                storeId: null,

                orderNote: "",

              };

            }


            return {

              ...state,

              items:
                updatedItems,

            };

          },
        );

      },


      /* =================================================
         REMOVE
      ================================================= */

      remove: (
        cartItemId,
      ) => {

        set(
          (
            state,
          ) => {

            const updatedItems =
              state.items.filter(
                (
                  item,
                ) =>
                  item.id !==
                  cartItemId,
              );


            /*
              Cart benar-benar kosong.
            */

            if (
              updatedItems.length ===
              0
            ) {

              return {

                items: [],

                storeId: null,

                orderNote: "",

              };

            }


            return {

              ...state,

              items:
                updatedItems,

            };

          },
        );

      },


      /* =================================================
         SET ITEM NOTE
      ================================================= */

      setItemNote: (
        cartItemId,
        note,
      ) => {

        const normalizedNote =
          normalizeNote(
            note,
          );


        set(
          (
            state,
          ) => {

            /*
              Cari item yang akan diubah.
            */

            const targetItem =
              state.items.find(
                (
                  item,
                ) =>
                  item.id ===
                  cartItemId,
              );


            if (
              !targetItem
            ) {

              return state;

            }


            /*
              Update note item.

              Kita TIDAK mengubah menu_id,
              quantity, seller_id, atau data menu.
            */

            return {

              ...state,

              items:
                state.items.map(
                  (
                    item,
                  ) =>
                    item.id ===
                      cartItemId
                      ? {

                        ...item,

                        note:
                          normalizedNote,

                      }
                      : item,
                ),

            };

          },
        );

      },


      /* =================================================
         SET ORDER NOTE
      ================================================= */

      setOrderNote: (
        note,
      ) => {

        set({

          orderNote:
            normalizeOrderNote(
              note,
            ),

        });

      },


      /* =================================================
         CLEAR CART
      ================================================= */

      clear: () => {

        set({

          items: [],

          storeId: null,

          orderNote: "",

        });

      },


      /* =================================================
         TOTAL
      ================================================= */

      total: () => {

        return get().items.reduce(

          (
            sum,
            item,
          ) => {

            const price =
              Number(
                item.menu?.price,
              ) || 0;


            const quantity =
              Number(
                item.quantity,
              ) || 0;


            return (
              sum +
              price *
              quantity
            );

          },

          0,

        );

      },

    }),
  );