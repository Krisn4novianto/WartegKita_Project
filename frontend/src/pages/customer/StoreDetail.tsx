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
  Search,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";

import MenuCard from "./MenuCard";

import api from "../../services/api";

import {
  Menu,
} from "../../types";

import {
  useCartStore,
} from "../../store/cartStore";

import "../../styles/store-detail.css";

/* =====================================================
   TYPE
===================================================== */

interface CustomerSeller {
  id: string;
  store_name: string;
  description: string;
  address: string;
  owner: string;
  phone: string;
  rating: number;
  distance_km: number;
  total_menu: number;
  opening_time: string;
  closing_time: string;
  is_open: boolean;
  image: string;
}

/* =====================================================
   HELPERS
===================================================== */

const numberValue = (
  value: unknown,
): number => {
  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
};

/* =====================================================
   IMAGE URL
===================================================== */

const getImageUrl = (
  image?: string | null,
): string => {
  if (!image) {
    return "";
  }

  const value = String(image).trim();

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
    api.defaults.baseURL ?? "";

  let origin = baseURL;

  try {
    if (
      baseURL.startsWith("http://") ||
      baseURL.startsWith("https://")
    ) {
      origin = new URL(baseURL).origin;
    }
  } catch {
    origin = baseURL;
  }

  return `${origin.replace(
    /\/$/,
    "",
  )}/${value.replace(
    /^\//,
    "",
  )}`;
};

/* =====================================================
   TIME PARSER
===================================================== */

const timeToMinute = (
  value?: string | null,
): number | null => {
  if (!value) {
    return null;
  }

  const match = String(value).match(
    /(\d{1,2}):(\d{2})/,
  );

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return (
    hour * 60 +
    minute
  );
};

/* =====================================================
   JAKARTA TIME
===================================================== */

const getJakartaMinute = (): number => {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Jakarta",
        hour:
          "2-digit",
        minute:
          "2-digit",
        hourCycle:
          "h23",
      },
    ).formatToParts(
      new Date(),
    );

  const hour = Number(
    parts.find(
      item =>
        item.type === "hour",
    )?.value ?? 0,
  );

  const minute = Number(
    parts.find(
      item =>
        item.type === "minute",
    )?.value ?? 0,
  );

  return (
    hour * 60 +
    minute
  );
};

/* =====================================================
   OPEN STATUS
===================================================== */

const calculateOpen = (
  open?: string,
  close?: string,
): boolean => {
  const start =
    timeToMinute(open);

  const end =
    timeToMinute(close);

  if (
    start === null ||
    end === null
  ) {
    return false;
  }

  /*
    Jika jam buka dan tutup sama,
    anggap toko buka 24 jam.
  */
  if (start === end) {
    return true;
  }

  const now =
    getJakartaMinute();

  /*
    Normal:
    08:00 - 22:00
  */
  if (start < end) {
    return (
      now >= start &&
      now < end
    );
  }

  /*
    Overnight:
    22:00 - 04:00
  */
  return (
    now >= start ||
    now < end
  );
};

/* =====================================================
   PRICE
===================================================== */

const formatPrice = (
  value: number,
): string => {
  return `Rp ${value.toLocaleString(
    "id-ID",
  )}`;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function StoreDetail() {
  const {
    id,
  } = useParams<{
    id: string;
  }>();

  const navigate =
    useNavigate();

  /* =====================================================
     STATE
  ===================================================== */

  const [
    store,
    setStore,
  ] =
    useState<CustomerSeller | null>(
      null,
    );

  const [
    menus,
    setMenus,
  ] =
    useState<Menu[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState("Semua");

  const [
    quantities,
    setQuantities,
  ] =
    useState<
      Record<string, number>
    >({});

  const [
    toast,
    setToast,
  ] =
    useState("");

  const [
    showChangeStore,
    setShowChangeStore,
  ] =
    useState(false);

  const [
    pendingMenu,
    setPendingMenu,
  ] =
    useState<Menu | null>(null);

  const [
    pendingQuantity,
    setPendingQuantity,
  ] =
    useState(0);

  /* =====================================================
     CART STORE
  ===================================================== */

  const addItem =
    useCartStore(
      state =>
        state.addItem,
    );

  const clearCart =
    useCartStore(
      state =>
        state.clear,
    );

  const setStoreId =
    useCartStore(
      state =>
        state.setStoreId,
    );

  const cartItems =
    useCartStore(
      state =>
        state.items,
    );

  const cartStoreId =
    useCartStore(
      state =>
        state.storeId,
    );

  /* =====================================================
     TOAST
  ===================================================== */

  const showToast = (
    message: string,
  ) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2500);
  };

  /* =====================================================
     LOAD STORE
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadStore = async () => {
      const sellerId =
        String(id ?? "").trim();

      if (!sellerId) {
        setError(
          "ID warteg tidak ditemukan",
        );

        setLoading(false);

        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "[StoreDetail] Loading seller:",
          sellerId,
        );

        /* =================================================
           SELLER
        ================================================= */

        const sellerResponse =
          await api.get(
            `/sellers/${sellerId}`,
          );

        console.log(
          "[StoreDetail] Seller response:",
          sellerResponse.data,
        );

        const sellerPayload =
          sellerResponse.data;

        const seller =
          sellerPayload?.data ??
          sellerPayload;

        if (!seller) {
          throw new Error(
            "Warteg tidak ditemukan",
          );
        }

        /*
          Pastikan ID seller selalu menggunakan
          ID dari URL jika response tidak memiliki ID.
        */

        const normalizedSellerId =
          String(
            seller.id ??
            seller.seller_id ??
            sellerId,
          ).trim();

        const opening =
          String(
            seller.opening_time ??
            seller.jam_buka ??
            seller.open_time ??
            "",
          );

        const closing =
          String(
            seller.closing_time ??
            seller.jam_tutup ??
            seller.close_time ??
            "",
          );

        const normalizedSeller:
          CustomerSeller = {
          id:
            normalizedSellerId,

          store_name:
            String(
              seller.store_name ??
              seller.nama_warteg ??
              seller.name ??
              "Warteg",
            ),

          description:
            String(
              seller.description ??
              seller.deskripsi ??
              "",
            ),

          address:
            String(
              seller.address ??
              seller.alamat ??
              "",
            ),

          owner:
            String(
              seller.owner ??
              seller.nama_pemilik ??
              "",
            ),

          phone:
            String(
              seller.phone ??
              seller.nomor_hp ??
              "",
            ),

          rating:
            numberValue(
              seller.rating,
            ),

          distance_km:
            numberValue(
              seller.distance_km,
            ),

          total_menu:
            0,

          opening_time:
            opening,

          closing_time:
            closing,

          is_open:
            calculateOpen(
              opening,
              closing,
            ),

          image:
            getImageUrl(
              seller.image ??
              seller.image_url ??
              seller.foto ??
              seller.foto_warteg,
            ),
        };

        if (cancelled) {
          return;
        }

        setStore(
          normalizedSeller,
        );

        /* =================================================
           MENU
        ================================================= */

        const menuResponse =
          await api.get(
            `/menus`,
            {
              params: {
                seller_id:
                  normalizedSellerId,
              },
            },
          );

        console.log(
          "[StoreDetail] Menu response:",
          menuResponse.data,
        );

        const menuPayload =
          menuResponse.data;

        const rawMenus =
          menuPayload?.data ??
          menuPayload?.menus ??
          menuPayload ??
          [];

        const menuArray =
          Array.isArray(rawMenus)
            ? rawMenus
            : [];

        const normalizedMenus =
          menuArray
            .map(
              (
                item: any,
              ): Menu => {
                const stock =
                  numberValue(
                    item.stock ??
                    item.stok,
                  );

                return {
                  id:
                    String(
                      item.id ??
                      item.menu_id ??
                      "",
                    ),

                  seller_id:
                    String(
                      item.seller_id ??
                      normalizedSellerId,
                    ),

                  name:
                    String(
                      item.name ??
                      item.nama_menu ??
                      "",
                    ),

                  description:
                    String(
                      item.description ??
                      item.deskripsi ??
                      "",
                    ),

                  price:
                    numberValue(
                      item.price ??
                      item.harga,
                    ),

                  stock,

                  category:
                    String(
                      item.category ??
                      item.kategori ??
                      "Lainnya",
                    ),

                  image:
                    getImageUrl(
                      item.image ??
                      item.image_url ??
                      item.foto,
                    ),

                  available:
                    item.available !== false &&
                    stock > 0,

                  created_at:
                    item.created_at ??
                    "",

                  updated_at:
                    item.updated_at ??
                    "",
                };
              },
            )
            .filter(
              menu =>
                Boolean(menu.id),
            );

        if (cancelled) {
          return;
        }

        setMenus(
          normalizedMenus,
        );

        setStore(
          previous =>
            previous
              ? {
                ...previous,

                total_menu:
                  normalizedMenus.length,
              }
              : previous,
        );

        /*
          JANGAN reset checkout di sini.

          Membuka StoreDetail tidak boleh
          menghapus / mengubah state cart atau
          checkout user.
        */
      } catch (err: any) {
        console.error(
          "[StoreDetail] Error:",
          err,
        );

        if (!cancelled) {
          const message =
            err?.response?.data?.message ??
            err?.response?.data?.error ??
            err?.message ??
            "Gagal memuat warteg";

          setError(
            String(message),
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
      cancelled = true;
    };
  }, [id]);

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories =
    useMemo(() => {
      const result =
        menus
          .map(
            menu =>
              menu.category,
          )
          .filter(Boolean);

      return [
        "Semua",
        ...Array.from(
          new Set(result),
        ),
      ];
    }, [menus]);

  /* =====================================================
     FILTER MENU
  ===================================================== */

  const filteredMenus =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return menus.filter(
        menu => {
          const matchCategory =
            category === "Semua" ||
            menu.category ===
            category;

          const matchSearch =
            !keyword ||
            menu.name
              .toLowerCase()
              .includes(keyword) ||
            menu.description
              .toLowerCase()
              .includes(keyword);

          return (
            matchCategory &&
            matchSearch
          );
        },
      );
    }, [
      menus,
      category,
      search,
    ]);

  /* =====================================================
     CART SUMMARY
  ===================================================== */

  const sameStoreCart =
    Boolean(
      store?.id &&
      cartStoreId &&
      String(cartStoreId) ===
      String(store.id),
    );

  /*
    Hanya hitung cart yang berasal dari
    store yang sedang dibuka.

    Ini mencegah cart dari seller lain
    ikut tampil.
  */

  const visibleCartItems =
    sameStoreCart
      ? cartItems
      : [];

  const cartTotal =
    visibleCartItems.reduce(
      (
        total,
        item,
      ) => {
        return (
          total +
          Number(
            item.menu.price,
          ) *
          Number(
            item.quantity,
          )
        );
      },
      0,
    );

  const cartCount =
    visibleCartItems.reduce(
      (
        total,
        item,
      ) => {
        return (
          total +
          Number(
            item.quantity,
          )
        );
      },
      0,
    );

  /* =====================================================
     QUANTITY
  ===================================================== */

  const increaseQty = (
    menu: Menu,
  ) => {
    if (!store?.is_open) {
      showToast(
        "Warteg sedang tutup",
      );

      return;
    }

    if (!menu.available) {
      showToast(
        "Menu tidak tersedia",
      );

      return;
    }

    setQuantities(
      previous => {
        const current =
          previous[
          menu.id
          ] ?? 0;

        if (
          current >=
          menu.stock
        ) {
          showToast(
            "Stok menu sudah maksimal",
          );

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

  const decreaseQty = (
    menuId: string,
  ) => {
    setQuantities(
      previous => ({
        ...previous,

        [menuId]:
          Math.max(
            0,
            (previous[
              menuId
            ] ?? 0) - 1,
          ),
      }),
    );
  };

  /* =====================================================
     ADD TO CART
  ===================================================== */

  const addToCart = (
    menu: Menu,
  ) => {
    const quantity =
      quantities[
      menu.id
      ] ?? 0;

    if (quantity <= 0) {
      showToast(
        "Pilih jumlah menu",
      );

      return;
    }

    if (!store) {
      showToast(
        "Data warteg belum siap",
      );

      return;
    }

    if (!store.is_open) {
      showToast(
        "Warteg sedang tutup",
      );

      return;
    }

    if (!menu.available) {
      showToast(
        "Menu tidak tersedia",
      );

      return;
    }

    const sellerId =
      String(store.id).trim();

    /*
      Jika cart berasal dari seller lain,
      tampilkan konfirmasi ganti seller.
    */

    if (
      cartItems.length > 0 &&
      cartStoreId &&
      String(cartStoreId) !==
      sellerId
    ) {
      setPendingMenu(menu);

      setPendingQuantity(
        quantity,
      );

      setShowChangeStore(
        true,
      );

      return;
    }

    /*
      Pastikan store ID di cart
      selalu sama dengan seller.
    */

    setStoreId(
      sellerId,
    );

    /*
      addItem dipanggil sesuai quantity.
    */

    for (
      let i = 0;
      i < quantity;
      i += 1
    ) {
      addItem(menu);
    }

    /*
      Reset quantity selector.
    */

    setQuantities(
      previous => ({
        ...previous,

        [menu.id]:
          0,
      }),
    );

    showToast(
      `${menu.name} ditambahkan ke keranjang`,
    );
  };

  /* =====================================================
     CHANGE STORE
  ===================================================== */

  const cancelChangeStore =
    () => {
      setShowChangeStore(
        false,
      );

      setPendingMenu(
        null,
      );

      setPendingQuantity(
        0,
      );
    };

  const confirmChangeStore =
    () => {
      if (
        !pendingMenu ||
        pendingQuantity <= 0 ||
        !store
      ) {
        cancelChangeStore();

        return;
      }

      const sellerId =
        String(
          store.id,
        ).trim();

      /*
        Kosongkan cart lama.
      */

      clearCart();

      /*
        Set seller baru.
      */

      setStoreId(
        sellerId,
      );

      /*
        Masukkan item baru.
      */

      for (
        let i = 0;
        i <
        pendingQuantity;
        i += 1
      ) {
        addItem(
          pendingMenu,
        );
      }

      /*
        Reset quantity.
      */

      setQuantities(
        previous => ({
          ...previous,

          [pendingMenu.id]:
            0,
        }),
      );

      cancelChangeStore();

      showToast(
        "Keranjang berhasil diganti",
      );
    };

  /* =====================================================
     OPENING HOURS
  ===================================================== */

  const openingHours =
    store
      ? `${store.opening_time || "-"} - ${store.closing_time || "-"
      }`
      : "-";

  /* =====================================================
     GO TO CART
  ===================================================== */

  const openCart = () => {
    if (!store) {
      return;
    }

    /*
      Jangan gunakan cartStoreId di URL.
      Gunakan seller ID yang sedang dibuka.
    */

    navigate(
      `/cart/${store.id}`,
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="store-page-loading">
        <div className="loading-circle" />

        <h2>
          Memuat warteg...
        </h2>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error ||
    !store
  ) {
    return (
      <div className="store-error-page">
        <div className="store-error-box">
          <h2>
            Warteg tidak ditemukan
          </h2>

          <p>
            {error ||
              "Data warteg tidak tersedia."}
          </p>

          <button
            onClick={() =>
              navigate(
                "/explore",
              )
            }
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="store-detail-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="gf-hero">

        <div className="gf-cover">

          {store.image ? (
            <img
              src={store.image}
              alt={
                store.store_name
              }
              onError={event => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div className="gf-empty-cover">
              🍛
            </div>
          )}

          <button
            type="button"
            className="gf-back-button"
            onClick={() =>
              navigate(
                "/explore",
              )
            }
            aria-label="Kembali"
          >
            <ArrowLeft
              size={22}
            />
          </button>
        </div>

        <div className="gf-store-card">

          <div className="gf-store-header">

            <div>
              <h1>
                {store.store_name}
              </h1>

              <div className="gf-rating-row">

                <span>
                  <Star
                    size={16}
                    fill="currentColor"
                  />

                  {store.rating >
                    0
                    ? store.rating.toFixed(
                      1,
                    )
                    : "Baru"}
                </span>

                <span>
                  •
                </span>

                <span
                  className={
                    store.is_open
                      ? "open-status"
                      : "close-status"
                  }
                >
                  {store.is_open
                    ? "Buka"
                    : "Tutup"}
                </span>

              </div>
            </div>

            <button
              type="button"
              className="gf-chat-button"
              onClick={() =>
                navigate(
                  `/chat?seller_id=${encodeURIComponent(
                    store.id,
                  )}`,
                )
              }
              aria-label="Chat penjual"
            >
              <MessageCircle
                size={22}
              />
            </button>

          </div>

          <div className="gf-detail-row">
            <MapPin
              size={17}
            />

            <span>
              {store.address ||
                "Alamat belum tersedia"}
            </span>
          </div>

          <div className="gf-detail-row">
            <Clock3
              size={17}
            />

            <span>
              {openingHours}
            </span>
          </div>

          {store.description && (
            <p className="gf-description">
              {store.description}
            </p>
          )}

        </div>
      </section>

      {/* =================================================
          MENU
      ================================================= */}

      <section className="menu-container">

        <div className="menu-search">

          <Search
            size={18}
          />

          <input
            type="text"
            value={search}
            onChange={event =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Cari menu..."
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Hapus pencarian"
            >
              <X
                size={17}
              />
            </button>
          )}

        </div>

        <div className="category-sticky">

          {categories.map(
            item => (
              <button
                type="button"
                key={item}
                className={
                  category === item
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setCategory(
                    item,
                  )
                }
              >
                {item}
              </button>
            ),
          )}

        </div>

        <div className="menu-grid">

          {filteredMenus.length ===
            0 ? (
            <div className="empty-menu">

              <div>
                🍽️
              </div>

              <h3>
                {search
                  ? "Menu tidak ditemukan"
                  : "Menu belum tersedia"}
              </h3>

              <p>
                {search
                  ? `Tidak ada menu yang cocok dengan "${search}".`
                  : "Belum ada menu tersedia di warteg ini."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  Reset pencarian
                </button>
              )}

            </div>
          ) : (
            filteredMenus.map(
              menu => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  quantity={
                    quantities[
                    menu.id
                    ] ?? 0
                  }
                  storeIsOpen={
                    store.is_open
                  }
                  onIncrease={() =>
                    increaseQty(
                      menu,
                    )
                  }
                  onDecrease={() =>
                    decreaseQty(
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
          )}

        </div>
      </section>

      {/* =================================================
          FLOATING CART
      ================================================= */}

      {sameStoreCart &&
        cartCount > 0 && (
          <button
            type="button"
            className="floating-cart"
            onClick={
              openCart
            }
            aria-label="Lihat keranjang"
          >

            <div className="cart-left">

              <div className="cart-icon">

                <ShoppingCart
                  size={24}
                />

                <span>
                  {cartCount}
                </span>

              </div>

              <div>

                <strong>
                  Lihat keranjang
                </strong>

                <small>
                  {cartCount} item
                </small>

              </div>

            </div>

            <strong>
              {formatPrice(
                cartTotal,
              )}
            </strong>

          </button>
        )}

      {/* =================================================
          CHANGE STORE MODAL
      ================================================= */}

      {showChangeStore && (
        <div
          className="modal-overlay"
          onClick={
            cancelChangeStore
          }
        >

          <div
            className="change-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={
                cancelChangeStore
              }
              aria-label="Tutup"
            >
              <X
                size={18}
              />
            </button>

            <ShoppingCart
              size={30}
            />

            <h2>
              Ganti warteg?
            </h2>

            <p>
              Keranjang kamu berisi
              menu dari warteg lain.
            </p>

            <p>
              Menu lama akan
              dikosongkan dan diganti
              dengan menu dari{" "}
              <strong>
                {store.store_name}
              </strong>
              .
            </p>

            <div className="modal-actions">

              <button
                type="button"
                className="btn-cancel"
                onClick={
                  cancelChangeStore
                }
              >
                Batal
              </button>

              <button
                type="button"
                className="btn-confirm"
                onClick={
                  confirmChangeStore
                }
              >
                Ganti Warteg
              </button>

            </div>

          </div>
        </div>
      )}

      {/* =================================================
          TOAST
      ================================================= */}

      {toast && (
        <div className="store-toast">

          <Clock3
            size={18}
          />

          <span>
            {toast}
          </span>

          <button
            type="button"
            onClick={() =>
              setToast("")
            }
            aria-label="Tutup notifikasi"
          >
            <X
              size={15}
            />
          </button>

        </div>
      )}

    </div>
  );
}