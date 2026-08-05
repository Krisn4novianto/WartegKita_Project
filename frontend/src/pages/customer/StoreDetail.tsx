import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Clock3,
  MapPin,
  MessageCircle,
  ShoppingCart,
  Star,
} from "lucide-react";

import MenuCard from "./MenuCard";

import api from "../../services/api";

import {
  Menu,
} from "../../types";

import {
  useCartStore,
} from "../../store/cartStore";

import {
  useCheckoutStore,
} from "../../store/checkoutStore";

import "../../styles/store-detail.css";


/* =====================================================
   CUSTOMER SELLER
===================================================== */

interface CustomerSeller {
  id: string;

  store_name: string;

  description: string;

  address: string;

  owner: string;

  phone: string;

  rating: number;

  is_open: boolean;

  distance_km: number;

  total_menu: number;

  opening_time: string;

  closing_time: string;

  image: string;
}


/* =====================================================
   IMAGE URL HELPER
===================================================== */

const getImageUrl = (
  image?: string | null,
): string => {

  if (!image) {
    return "";
  }

  const value =
    String(image).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  const baseURL =
    api.defaults.baseURL || "";

  let origin =
    baseURL;

  try {

    if (
      baseURL.startsWith("http://") ||
      baseURL.startsWith("https://")
    ) {

      origin =
        new URL(
          baseURL,
        ).origin;
    }

  } catch {

    origin =
      baseURL;
  }

  origin =
    origin.replace(
      /\/+$/,
      "",
    );

  const cleanPath =
    value.replace(
      /^\/+/,
      "",
    );

  const encodedPath =
    cleanPath
      .split("/")
      .map(
        (
          part,
        ) =>
          encodeURIComponent(
            part,
          ),
      )
      .join("/");

  return `${origin}/${encodedPath}`;
};


/* =====================================================
   TIME FORMAT
===================================================== */

/*
  Backend menjadi sumber data jam.

  Fungsi ini HANYA bertugas mengubah format tampilan.

  Contoh:

  08:00:00
  -> 08.00

  17:30:00
  -> 17.30

  08:00
  -> 08.00

  2026-08-02T08:00:00Z
  -> 08.00

  2026-08-02T17:30:00+07:00
  -> 17.30
*/

const formatOpeningTime = (
  value?: string | null,
): string => {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const raw =
    String(value).trim();

  if (!raw) {
    return "";
  }


  /* =================================================
     ISO DATETIME
     CONTOH:
     2026-08-02T08:00:00Z
     2026-08-02T17:30:00+07:00
  ================================================= */

  const isoMatch =
    raw.match(
      /T(\d{1,2}):(\d{2})/,
    );

  if (isoMatch) {

    const hour =
      isoMatch[1].padStart(
        2,
        "0",
      );

    const minute =
      isoMatch[2];

    return `${hour}.${minute}`;
  }


  /* =================================================
     HH:mm:ss
     HH:mm

     CONTOH:
     08:00:00
     17:30:00
     08:00
     17:30
  ================================================= */

  const colonMatch =
    raw.match(
      /^(\d{1,2}):(\d{2})(?::\d{2})?/,
    );

  if (colonMatch) {

    const hour =
      colonMatch[1].padStart(
        2,
        "0",
      );

    const minute =
      colonMatch[2];

    return `${hour}.${minute}`;
  }


  /* =================================================
     HH.mm

     CONTOH:
     08.00
     17.30
  ================================================= */

  const dotMatch =
    raw.match(
      /^(\d{1,2})\.(\d{2})$/,
    );

  if (dotMatch) {

    const hour =
      dotMatch[1].padStart(
        2,
        "0",
      );

    const minute =
      dotMatch[2];

    return `${hour}.${minute}`;
  }


  /* =================================================
     FALLBACK
  ================================================= */

  return raw;
};


/* =====================================================
   SAFE NUMBER
===================================================== */

const safeNumber = (
  value: unknown,
  fallback = 0,
): number => {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


/* =====================================================
   COMPONENT
===================================================== */

export default function StoreDetail() {

  /* =================================================
     ROUTE
  ================================================= */

  const {
    id,
  } =
    useParams<{
      id: string;
    }>();


  /* =================================================
     NAVIGATION
  ================================================= */

  const navigate =
    useNavigate();


  /* =================================================
     CART STORE
  ================================================= */

  const addItem =
    useCartStore(
      (
        state,
      ) =>
        state.addItem,
    );

  const setStoreId =
    useCartStore(
      (
        state,
      ) =>
        state.setStoreId,
    );

  const clearCart =
    useCartStore(
      (
        state,
      ) =>
        state.clear,
    );

  const cartItems =
    useCartStore(
      (
        state,
      ) =>
        state.items,
    );

  const cartStoreId =
    useCartStore(
      (
        state,
      ) =>
        state.storeId,
    );


  /* =================================================
     CHECKOUT STORE
  ================================================= */

  const resetCheckout =
    useCheckoutStore(
      (
        state,
      ) =>
        state.resetCheckout,
    );


  /* =================================================
     SELLER
  ================================================= */

  const [
    store,
    setStore,
  ] =
    useState<CustomerSeller | null>(
      null,
    );


  /* =================================================
     MENUS
  ================================================= */

  const [
    menus,
    setMenus,
  ] =
    useState<Menu[]>(
      [],
    );


  /* =================================================
     LOADING
  ================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /* =================================================
     ERROR
  ================================================= */

  const [
    error,
    setError,
  ] =
    useState("");


  /* =================================================
     ACTIVE CATEGORY
  ================================================= */

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState("Semua");


  /* =================================================
     QUANTITY
  ================================================= */

  const [
    quantities,
    setQuantities,
  ] =
    useState<
      Record<string, number>
    >({});


  /* =====================================================
     LOAD STORE
  ===================================================== */

  useEffect(() => {

    let cancelled =
      false;


    const loadStore =
      async () => {

        /* =============================================
           VALIDATE ID
        ============================================= */

        const sellerID =
          String(
            id ?? "",
          ).trim();

        if (!sellerID) {

          setStore(null);

          setMenus([]);

          setError(
            "ID warteg tidak ditemukan.",
          );

          setLoading(false);

          return;
        }


        try {

          setLoading(true);

          setError("");

          setStore(null);

          setMenus([]);

          setQuantities({});

          setActiveCategory(
            "Semua",
          );


          /* =========================================
             GET SELLER
          ========================================= */

          const sellerResponse =
            await api.get(
              `/sellers/${encodeURIComponent(
                sellerID,
              )}`,
            );


          if (cancelled) {
            return;
          }


          const sellerPayload =
            sellerResponse.data;


          /* =========================================
             VALIDATE RESPONSE
          ========================================= */

          if (
            sellerPayload?.success === false
          ) {

            throw new Error(
              sellerPayload?.message ??
              "Warteg tidak ditemukan.",
            );
          }


          const sellerData =
            sellerPayload?.data ??
            sellerPayload ??
            null;


          if (
            !sellerData ||
            typeof sellerData !== "object"
          ) {

            throw new Error(
              "Data warteg tidak ditemukan.",
            );
          }


          /* =========================================
             OPENING TIME
          ========================================= */

          const openingTime =
            String(
              sellerData?.opening_time ??
              sellerData?.jam_buka ??
              sellerData?.open_time ??
              "",
            ).trim();


          /* =========================================
             CLOSING TIME
          ========================================= */

          const closingTime =
            String(
              sellerData?.closing_time ??
              sellerData?.jam_tutup ??
              sellerData?.close_time ??
              "",
            ).trim();


          /*
            DEBUG:

            Kalau perlu cek response backend,
            buka DevTools -> Console.

            Akan muncul data asli dari backend.
          */

          console.log(
            "STORE DETAIL - SELLER DATA:",
            sellerData,
          );

          console.log(
            "OPENING TIME:",
            openingTime,
          );

          console.log(
            "CLOSING TIME:",
            closingTime,
          );

          console.log(
            "IS OPEN:",
            sellerData?.is_open,
          );


          /* =========================================
             OPEN STATUS

             PENTING:

             Frontend TIDAK menghitung jam buka/tutup.

             Backend adalah sumber kebenaran.

             Backend mengirim:
             is_open: true / false
          ========================================= */

          const backendIsOpen =
            sellerData?.is_open === true;


          /* =========================================
             SELLER NORMALIZATION
          ========================================= */

          const normalizedSeller:
            CustomerSeller = {

            id:
              String(
                sellerData?.seller_id ??
                sellerData?.id ??
                sellerID,
              ),

            store_name:
              String(
                sellerData?.nama_warteg ??
                sellerData?.store_name ??
                sellerData?.name ??
                "Warteg",
              ).trim(),

            description:
              String(
                sellerData?.deskripsi ??
                sellerData?.description ??
                "",
              ).trim(),

            address:
              String(
                sellerData?.alamat ??
                sellerData?.address ??
                "",
              ).trim(),

            owner:
              String(
                sellerData?.nama_pemilik ??
                sellerData?.owner ??
                "",
              ).trim(),

            phone:
              String(
                sellerData?.nomor_hp ??
                sellerData?.phone ??
                "",
              ).trim(),

            rating:
              safeNumber(
                sellerData?.rating,
                0,
              ),

            is_open:
              backendIsOpen,

            distance_km:
              safeNumber(
                sellerData?.distance_km,
                0,
              ),

            total_menu:
              safeNumber(
                sellerData?.total_menu,
                0,
              ),

            opening_time:
              openingTime,

            closing_time:
              closingTime,

            image:
              getImageUrl(
                sellerData?.image ??
                sellerData?.image_url ??
                sellerData?.foto ??
                sellerData?.foto_warteg ??
                "",
              ),
          };


          setStore(
            normalizedSeller,
          );


          /* =========================================
             GET MENUS
          ========================================= */

          const menuResponse =
            await api.get(
              `/menus?seller_id=${encodeURIComponent(
                sellerID,
              )}`,
            );


          if (cancelled) {
            return;
          }


          const menuPayload =
            menuResponse.data;


          if (
            menuPayload?.success === false
          ) {

            throw new Error(
              menuPayload?.message ??
              "Gagal memuat menu.",
            );
          }


          const menuData =
            menuPayload?.data ??
            menuPayload ??
            [];


          const menuArray =
            Array.isArray(
              menuData,
            )
              ? menuData
              : [];


          /* =========================================
             NORMALIZE MENUS
          ========================================= */

          const normalizedMenus:
            Menu[] =
            menuArray
              .map(
                (
                  item: any,
                ) => {

                  const menuID =
                    String(
                      item?.id ??
                      item?.menu_id ??
                      "",
                    ).trim();


                  const stock =
                    Math.max(
                      0,
                      safeNumber(
                        item?.stock ??
                        item?.stok,
                        0,
                      ),
                    );


                  const available =
                    item?.available !== false &&
                    item?.is_available !== false &&
                    item?.tersedia !== false;


                  return {

                    id:
                      menuID,

                    seller_id:
                      String(
                        item?.seller_id ??
                        sellerID,
                      ),

                    name:
                      String(
                        item?.name ??
                        item?.nama_menu ??
                        "",
                      ).trim(),

                    description:
                      String(
                        item?.description ??
                        item?.deskripsi ??
                        "",
                      ).trim(),

                    price:
                      Math.max(
                        0,
                        safeNumber(
                          item?.price ??
                          item?.harga,
                          0,
                        ),
                      ),

                    stock,

                    category:
                      String(
                        item?.category ??
                        item?.kategori ??
                        "",
                      ).trim(),

                    image:
                      getImageUrl(
                        item?.image ??
                        item?.image_url ??
                        item?.foto ??
                        "",
                      ),

                    available:
                      available &&
                      stock > 0,

                    created_at:
                      String(
                        item?.created_at ??
                        "",
                      ),

                    updated_at:
                      String(
                        item?.updated_at ??
                        "",
                      ),
                  };
                },
              )
              .filter(
                (
                  menu,
                ) =>
                  Boolean(
                    menu.id,
                  ),
              );


          setMenus(
            normalizedMenus,
          );


          /* =========================================
             UPDATE TOTAL MENU
          ========================================= */

          setStore(
            (
              previous,
            ) =>
              previous
                ? {
                  ...previous,

                  total_menu:
                    normalizedMenus.length,
                }
                : previous,
          );


          /* =========================================
             RESET CHECKOUT
          ========================================= */

          resetCheckout();

        } catch (
        err: any
        ) {

          console.error(
            "StoreDetail error:",
            err,
          );


          if (!cancelled) {

            setStore(null);

            setMenus([]);

            setError(
              err?.response?.data?.message ??
              err?.response?.data?.error ??
              err?.message ??
              "Gagal memuat data warteg.",
            );
          }

        } finally {

          if (!cancelled) {

            setLoading(false);
          }
        }
      };


    loadStore();


    return () => {

      cancelled =
        true;
    };

  }, [
    id,
    resetCheckout,
  ]);


  /* =====================================================
     REFRESH OPEN STATUS
  ===================================================== */

  useEffect(() => {

    const sellerID =
      String(
        id ?? "",
      ).trim();

    if (!sellerID) {
      return;
    }


    const refreshSellerStatus =
      async () => {

        try {

          const response =
            await api.get(
              `/sellers/${encodeURIComponent(
                sellerID,
              )}`,
            );


          const payload =
            response.data;


          const data =
            payload?.data ??
            payload ??
            null;


          if (
            !data ||
            typeof data !== "object"
          ) {
            return;
          }


          console.log(
            "REFRESH SELLER STATUS:",
            {
              opening_time:
                data?.opening_time,

              closing_time:
                data?.closing_time,

              is_open:
                data?.is_open,
            },
          );


          setStore(
            (
              previous,
            ) => {

              if (!previous) {
                return previous;
              }


              return {

                ...previous,

                /*
                  Backend tetap menjadi
                  sumber status buka/tutup.
                */

                is_open:
                  data?.is_open === true,

                /*
                  Sekalian refresh jam apabila
                  backend mengirim perubahan.
                */

                opening_time:
                  String(
                    data?.opening_time ??
                    data?.jam_buka ??
                    previous.opening_time ??
                    "",
                  ).trim(),

                closing_time:
                  String(
                    data?.closing_time ??
                    data?.jam_tutup ??
                    previous.closing_time ??
                    "",
                  ).trim(),
              };
            },
          );

        } catch (
        refreshError
        ) {

          console.error(
            "Gagal refresh status warteg:",
            refreshError,
          );
        }
      };


    const interval =
      window.setInterval(
        refreshSellerStatus,
        30_000,
      );


    return () => {

      window.clearInterval(
        interval,
      );
    };

  }, [
    id,
  ]);


  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories =
    useMemo(
      () => {

        const categoryList =
          menus
            .map(
              (
                menu,
              ) =>
                menu.category?.trim(),
            )
            .filter(
              (
                category,
              ): category is string =>
                Boolean(
                  category,
                ),
            );


        const uniqueCategories =
          Array.from(
            new Set(
              categoryList,
            ),
          );


        return [
          "Semua",
          ...uniqueCategories,
        ];

      },
      [
        menus,
      ],
    );


  /* =====================================================
     FIX ACTIVE CATEGORY
  ===================================================== */

  useEffect(() => {

    if (
      activeCategory !== "Semua" &&
      !categories.includes(
        activeCategory,
      )
    ) {

      setActiveCategory(
        "Semua",
      );
    }

  }, [
    categories,
    activeCategory,
  ]);


  /* =====================================================
     FILTERED MENUS
  ===================================================== */

  const filteredMenus =
    useMemo(
      () => {

        if (
          activeCategory ===
          "Semua"
        ) {

          return menus;
        }


        return menus.filter(
          (
            menu,
          ) =>
            menu.category?.trim() ===
            activeCategory,
        );

      },
      [
        menus,
        activeCategory,
      ],
    );


  /* =====================================================
     CART TOTAL
  ===================================================== */

  const cartTotal =
    cartItems.reduce(
      (
        total,
        item,
      ) =>
        total +
        Math.max(
          0,
          Number(
            item.menu.price,
          ),
        ) *
        Math.max(
          0,
          Number(
            item.quantity,
          ),
        ),
      0,
    );


  /* =====================================================
     TOTAL ITEMS
  ===================================================== */

  const totalItems =
    cartItems.reduce(
      (
        total,
        item,
      ) =>
        total +
        Math.max(
          0,
          Number(
            item.quantity,
          ),
        ),
      0,
    );


  /* =====================================================
     GET QUANTITY
  ===================================================== */

  const getQuantity =
    (
      menuId: string,
    ): number => {

      return Math.max(
        0,
        quantities[menuId] ?? 0,
      );
    };


  /* =====================================================
     INCREASE
  ===================================================== */

  const increaseQuantity =
    (
      menu: Menu,
    ) => {

      if (!menu.available) {
        return;
      }


      const stock =
        Math.max(
          0,
          Number(
            menu.stock,
          ),
        );


      if (stock <= 0) {
        return;
      }


      setQuantities(
        (
          previous,
        ) => {

          const current =
            Math.max(
              0,
              previous[menu.id] ?? 0,
            );


          if (
            current >= stock
          ) {

            return previous;
          }


          return {

            ...previous,

            [menu.id]:
              current + 1,
          };
        },
      );
    };


  /* =====================================================
     DECREASE
  ===================================================== */

  const decreaseQuantity =
    (
      menuId: string,
    ) => {

      setQuantities(
        (
          previous,
        ) => {

          const current =
            Math.max(
              0,
              previous[menuId] ?? 0,
            );


          if (
            current <= 0
          ) {

            return previous;
          }


          return {

            ...previous,

            [menuId]:
              current - 1,
          };
        },
      );
    };


  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart =
    (
      menu: Menu,
    ) => {

      const sellerID =
        String(
          id ?? "",
        ).trim();


      if (!sellerID) {

        window.alert(
          "ID warteg tidak ditemukan.",
        );

        return;
      }


      /* =============================================
         SELLER VALIDATION
      ============================================= */

      if (
        String(
          menu.seller_id,
        ) !== sellerID
      ) {

        window.alert(
          "Menu tidak berasal dari warteg ini.",
        );

        return;
      }


      /* =============================================
         AVAILABILITY
      ============================================= */

      if (!menu.available) {

        window.alert(
          "Menu sedang tidak tersedia.",
        );

        return;
      }


      const stock =
        Math.max(
          0,
          Number(
            menu.stock,
          ),
        );


      if (stock <= 0) {

        window.alert(
          "Stok menu sedang habis.",
        );

        return;
      }


      /* =============================================
         QUANTITY
      ============================================= */

      const quantity =
        Math.min(
          stock,
          getQuantity(
            menu.id,
          ),
        );


      if (quantity <= 0) {

        window.alert(
          "Pilih jumlah menu terlebih dahulu.",
        );

        return;
      }


      /* =============================================
         DIFFERENT SELLER
      ============================================= */

      if (
        cartStoreId &&
        String(cartStoreId) !== sellerID &&
        cartItems.length > 0
      ) {

        const confirmChange =
          window.confirm(
            "Keranjang berisi menu dari warteg lain. Kosongkan keranjang dan ganti warteg?",
          );


        if (!confirmChange) {
          return;
        }


        clearCart();
      }


      /* =============================================
         SET CURRENT SELLER
      ============================================= */

      setStoreId(
        sellerID,
      );


      /* =============================================
         ADD ITEM
      ============================================= */

      for (
        let index = 0;
        index < quantity;
        index += 1
      ) {

        addItem(
          menu,
        );
      }


      /* =============================================
         RESET LOCAL QUANTITY
      ============================================= */

      setQuantities(
        (
          previous,
        ) => ({

          ...previous,

          [menu.id]:
            0,
        }),
      );

    };


  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (loading) {

    return (

      <div
        className="store-loading"
      >

        <div
          className="store-loading-spinner"
        />

        <h2>
          Memuat Warteg...
        </h2>

        <p>
          Sedang mengambil informasi
          warteg dan menu.
        </p>

      </div>
    );
  }


  /* =====================================================
     ERROR SCREEN
  ===================================================== */

  if (error) {

    return (

      <div
        className="store-error"
      >

        <div
          className="store-error-card"
        >

          <span
            className="store-error-icon"
          >
            !
          </span>

          <h2>
            Oops, terjadi kesalahan
          </h2>

          <p>
            {error}
          </p>

          <div
            className="store-error-actions"
          >

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/explore",
                )
              }
            >
              Kembali
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
            >
              Coba Lagi
            </button>

          </div>

        </div>

      </div>
    );
  }


  /* =====================================================
     STORE NOT FOUND
  ===================================================== */

  if (!store) {

    return (

      <div
        className="store-error"
      >

        <div
          className="store-error-card"
        >

          <h2>
            Warteg tidak ditemukan
          </h2>

          <p>
            Warteg yang kamu cari
            tidak tersedia.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/explore",
              )
            }
          >
            Kembali ke Explore
          </button>

        </div>

      </div>
    );
  }


  /* =====================================================
     OPENING HOURS
  ===================================================== */

  const openingTime =
    formatOpeningTime(
      store.opening_time,
    );


  const closingTime =
    formatOpeningTime(
      store.closing_time,
    );


  const openingHours =
    openingTime &&
      closingTime
      ? `${openingTime} - ${closingTime}`
      : "Jam buka belum tersedia";


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div
      className="store-detail-page"
    >

      {/* =================================================
          HERO
      ================================================= */}

      <section
        className="store-hero"

        style={{
          backgroundImage:
            store.image
              ? `
                linear-gradient(
                  180deg,
                  rgba(0, 0, 0, 0.08) 0%,
                  rgba(0, 0, 0, 0.20) 38%,
                  rgba(0, 0, 0, 0.78) 100%
                ),
                url("${store.image}")
              `
              : undefined,
        }}
      >

        {
          !store.image && (

            <div
              className="store-hero-fallback"
            />

          )
        }


        {/* =================================================
            BACK
        ================================================= */}

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(
              "/explore",
            )
          }
          aria-label="Kembali ke Explore"
        >

          <ArrowLeft
            size={19}
          />

          <span>
            Kembali
          </span>

        </button>


        {/* =================================================
            HEADER CONTENT
        ================================================= */}

        <div
          className="store-header-content"
        >

          <span
            className="eyebrow"
          >
            WARTEGKITA
          </span>


          <h1>
            {
              store.store_name ||
              "Warteg"
            }
          </h1>


          {
            store.description && (

              <p>
                {store.description}
              </p>

            )
          }


          {/* =================================================
              META
          ================================================= */}

          <div
            className="store-meta"
          >

            {/* RATING */}

            <div
              className="meta-card"
            >

              <Star
                size={18}
              />

              <strong>
                {
                  store.rating > 0
                    ? store.rating.toFixed(
                      1,
                    )
                    : "0.0"
                }
              </strong>

            </div>


            {/* DISTANCE */}

            {
              store.distance_km > 0 && (

                <div
                  className="meta-card"
                >

                  <MapPin
                    size={18}
                  />

                  <strong>
                    {
                      store.distance_km.toFixed(
                        1,
                      )
                    }{" "}
                    km
                  </strong>

                </div>

              )
            }


            {/* HOURS */}

            <div
              className="meta-card"
            >

              <Clock3
                size={18}
              />

              <strong>
                {openingHours}
              </strong>

            </div>

          </div>


          {/* =================================================
              ADDRESS
          ================================================= */}

          <div
            className="store-address"
          >

            <MapPin
              size={18}
            />

            <span>
              {
                store.address ||
                "Alamat belum tersedia"
              }
            </span>

          </div>


          {/* =================================================
              Kirim Pesan
          ================================================= */}
          <button
            type="button"
            className="store-chat-button"
            onClick={() =>
              navigate(
                `/chat?seller_id=${encodeURIComponent(store.id)}`
              )
            }
          >
            <MessageCircle size={18} />

            <span>
              Chat Penjual
            </span>
          </button>

        </div>


        {/* =================================================
            STATUS
        ================================================= */}

        <div
          className={
            store.is_open
              ? "store-status open"
              : "store-status closed"
          }
        >

          <span
            className="store-status-dot"
          />

          {
            store.is_open
              ? "Sedang buka"
              : "Sedang tutup"
          }

        </div>

      </section>


      {/* =================================================
          MENU
      ================================================= */}

      <main
        className="store-menu-section"
      >

        <div
          className="menu-section-header"
        >

          <div>

            <span
              className="menu-section-eyebrow"
            >
              MENU WARTEG
            </span>

            <h2>
              Pilih makanan favoritmu
            </h2>

            <p>
              Nikmati berbagai pilihan
              makanan rumahan favorit.
            </p>

          </div>

        </div>


        {/* =================================================
            CATEGORY
        ================================================= */}

        {
          categories.length > 1 && (

            <div
              className="category-list"
            >

              {
                categories.map(
                  (
                    category,
                  ) => (

                    <button
                      key={
                        category
                      }
                      type="button"
                      className={
                        activeCategory ===
                          category
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveCategory(
                          category,
                        )
                      }
                    >
                      {category}
                    </button>

                  ),
                )
              }

            </div>

          )
        }


        {/* =================================================
            MENU GRID
        ================================================= */}

        <section
          className="menu-grid"
        >

          {
            filteredMenus.length ===
              0 ? (

              <div
                className="store-empty-menu"
              >

                <div
                  className="store-empty-icon"
                >
                  🍽️
                </div>

                <h3>
                  Belum ada menu
                </h3>

                <p>
                  Warteg ini belum memiliki
                  menu untuk ditampilkan.
                </p>

              </div>

            ) : (

              filteredMenus.map(
                (
                  menu,
                ) => (

                  <MenuCard
                    key={
                      menu.id
                    }

                    menu={
                      menu
                    }

                    quantity={
                      getQuantity(
                        menu.id,
                      )
                    }

                    onIncrease={() =>
                      increaseQuantity(
                        menu,
                      )
                    }

                    onDecrease={() =>
                      decreaseQuantity(
                        menu.id,
                      )
                    }

                    onAdd={() =>
                      addToCart(
                        menu,
                      )
                    }

                  />

                ),
              )

            )
          }

        </section>

      </main>


      {/* =================================================
          FLOATING CART
      ================================================= */}

      {
        cartItems.length > 0 && (

          <button
            type="button"
            className="floating-cart-bar"
            onClick={() =>
              navigate(
                `/cart/${id}`,
              )
            }
            aria-label="Lihat keranjang"
          >

            <div
              className="floating-cart-icon"
            >

              <ShoppingCart
                size={22}
              />

              <span>
                {totalItems}
              </span>

            </div>


            <div
              className="floating-left"
            >

              <strong>
                {totalItems} Item
              </strong>

              <span>
                Rp{" "}
                {
                  cartTotal.toLocaleString(
                    "id-ID",
                  )
                }
              </span>

            </div>


            <div
              className="floating-right"
            >

              <span>
                Lihat Keranjang
              </span>

              <span>
                →
              </span>

            </div>

          </button>

        )
      }

    </div>
  );
}