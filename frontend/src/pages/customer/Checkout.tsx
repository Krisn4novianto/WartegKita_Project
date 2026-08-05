import {
  QrCode,
  Building2,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  MapPin,
  ShoppingBag,
  Bike,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useNavigate } from "react-router-dom";

import { useCartStore } from "../../store/cartStore";
import { useCheckoutStore } from "../../store/checkoutStore";
import api from "../../services/api";

import "../../styles/checkout.css";

/* =====================================================
   TYPES
===================================================== */

type PaymentMethod =
  | "qris"
  | "bank_transfer"
  | "virtual_account";

type DeliveryType =
  | "delivery"
  | "pickup";

type NotificationType =
  | "warning"
  | "error"
  | "success";

/* =====================================================
   MENU
===================================================== */

interface CheckoutMenu {
  id?: string;
  menu_id?: string;

  name?: string;
  menu_name?: string;

  price?: number | string;

  seller_id?: string;
  sellerId?: string;

  seller?: {
    id?: string;
    seller_id?: string;
  };
}

/* =====================================================
   CART ITEM

   Support dua bentuk:

   1. Cart baru:
   {
     id,
     name,
     price,
     seller_id,
     quantity
   }

   2. Cart lama:
   {
     menu: {
       id,
       name,
       price,
       seller_id
     },
     quantity
   }
===================================================== */

interface CheckoutCartItem {
  id?: string;
  menu_id?: string;

  name?: string;
  menu_name?: string;

  price?: number | string;

  seller_id?: string;
  sellerId?: string;

  seller?: {
    id?: string;
    seller_id?: string;
  };

  quantity: number;

  menu?: CheckoutMenu;
}

/* =====================================================
   ORDER RESPONSE
===================================================== */

interface OrderResponseData {
  id?: string;
  order_id?: string;
  order_number?: string;

  user_id?: string;
  seller_id?: string;

  payment_method?: PaymentMethod;

  total_amount?: number;

  payment_status?: string;
  status?: string;

  items?: unknown[];
}

interface OrderResponse {
  success?: boolean;

  message?: string;
  error?: string;
  details?: string;

  data?: OrderResponseData;

  id?: string;
  order_id?: string;
  order_number?: string;

  user_id?: string;
  seller_id?: string;

  payment_method?: PaymentMethod;

  total_amount?: number;

  payment_status?: string;
  status?: string;

  items?: unknown[];
}

/* =====================================================
   NOTIFICATION
===================================================== */

interface NotificationState {
  type: NotificationType;
  title: string;
  message: string;
}

/* =====================================================
   UUID

   IMPORTANT:

   Backend WartegKita menggunakan UUID v7.

   Contoh dari backend:

   019fb617-3daa-7a3d-a29a-b7be83204aad
                     ↑
                     VERSION 7

   Regex lama hanya menerima [1-5].
   Sekarang kita support UUID v1-v8.
===================================================== */

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* =====================================================
   UUID VALIDATOR
===================================================== */

function isValidUUID(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    UUID_REGEX.test(
      value.trim()
    )
  );
}

/* =====================================================
   NORMALIZE STRING
===================================================== */

function normalizeString(
  value: unknown
): string {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value.trim();
}

/* =====================================================
   GET MENU OBJECT
===================================================== */

function getMenuObject(
  item?: CheckoutCartItem
): CheckoutMenu {
  if (!item) {
    return {};
  }

  /*
   * Jika cart menggunakan:
   *
   * {
   *   menu: {...}
   * }
   *
   * gunakan menu tersebut.
   */

  if (
    item.menu &&
    typeof item.menu === "object"
  ) {
    return item.menu;
  }

  /*
   * Jika cart menyimpan menu
   * langsung di item:
   *
   * {
   *   id,
   *   name,
   *   price
   * }
   *
   * item sendiri dianggap sebagai menu.
   */

  return item;
}

/* =====================================================
   GET MENU ID
===================================================== */

function getMenuId(
  item?: CheckoutCartItem
): string {
  if (!item) {
    return "";
  }

  const menu =
    getMenuObject(item);

  /*
   * Prioritas ID:
   *
   * 1. menu.id
   * 2. menu.menu_id
   * 3. item.id
   * 4. item.menu_id
   */

  const candidates = [
    menu.id,
    menu.menu_id,
    item.id,
    item.menu_id,
  ];

  for (
    const candidate of candidates
  ) {
    const normalized =
      normalizeString(
        candidate
      );

    if (
      normalized !== ""
    ) {
      return normalized;
    }
  }

  return "";
}

/* =====================================================
   GET SELLER ID
===================================================== */

function getSellerIdFromItem(
  item?: CheckoutCartItem
): string {
  if (!item) {
    return "";
  }

  const menu =
    getMenuObject(item);

  const candidates = [
    /*
     * Dari menu
     */
    menu.seller_id,
    menu.sellerId,
    menu.seller?.seller_id,
    menu.seller?.id,

    /*
     * Dari cart item
     */
    item.seller_id,
    item.sellerId,
    item.seller?.seller_id,
    item.seller?.id,
  ];

  for (
    const candidate of candidates
  ) {
    const normalized =
      normalizeString(
        candidate
      );

    if (
      normalized !== ""
    ) {
      return normalized;
    }
  }

  return "";
}

/* =====================================================
   GET MENU NAME
===================================================== */

function getMenuName(
  item?: CheckoutCartItem
): string {
  if (!item) {
    return "Menu";
  }

  const menu =
    getMenuObject(item);

  return (
    normalizeString(
      menu.name
    ) ||
    normalizeString(
      menu.menu_name
    ) ||
    normalizeString(
      item.name
    ) ||
    normalizeString(
      item.menu_name
    ) ||
    "Menu"
  );
}

/* =====================================================
   GET MENU PRICE
===================================================== */

function getMenuPrice(
  item?: CheckoutCartItem
): number {
  if (!item) {
    return 0;
  }

  const menu =
    getMenuObject(item);

  const rawPrice =
    menu.price ??
    item.price;

  const price =
    Number(
      rawPrice
    );

  if (
    !Number.isFinite(
      price
    ) ||
    price < 0
  ) {
    return 0;
  }

  return price;
}

/* =====================================================
   GET QUANTITY
===================================================== */

function getQuantity(
  item?: CheckoutCartItem
): number {
  if (!item) {
    return 0;
  }

  const quantity =
    Number(
      item.quantity
    );

  if (
    !Number.isFinite(
      quantity
    )
  ) {
    return 0;
  }

  return quantity;
}

/* =====================================================
   GET ORDER ID
===================================================== */

function getOrderIdFromResponse(
  response: OrderResponse
): string {
  const order =
    response?.data ??
    response;

  const candidates = [
    order?.id,
    order?.order_id,
  ];

  for (
    const candidate of candidates
  ) {
    const normalized =
      normalizeString(
        candidate
      );

    if (
      normalized !== ""
    ) {
      return normalized;
    }
  }

  return "";
}

/* =====================================================
   CHECKOUT
===================================================== */

export default function Checkout() {

  const navigate =
    useNavigate();

  /* ===================================================
     CART
  =================================================== */

  const items =
    useCartStore(
      (state) =>
        state.items
    ) as CheckoutCartItem[];

  /* ===================================================
     CHECKOUT STORE
  =================================================== */

  const {
    pickupMethod,
    address,
    paymentMethod,
    setCheckout,
  } =
    useCheckoutStore();

  /* ===================================================
     STATE
  =================================================== */

  const [
    notification,
    setNotification,
  ] =
    useState<NotificationState | null>(
      null
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  /* ===================================================
     AUTO CLOSE NOTIFICATION
  =================================================== */

  useEffect(() => {

    if (
      !notification
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setNotification(
            null
          );
        },
        3500
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };

  }, [
    notification,
  ]);

  /* ===================================================
     NOTIFICATION
  =================================================== */

  const showNotification = (
    type: NotificationType,
    title: string,
    message: string
  ) => {

    setNotification({
      type,
      title,
      message,
    });

  };

  const closeNotification = () => {
    setNotification(
      null
    );
  };

  /* ===================================================
     DELIVERY TYPE
  =================================================== */

  const deliveryType:
    DeliveryType =
    pickupMethod ===
      "pickup"
      ? "pickup"
      : "delivery";

  /* ===================================================
     EMPTY CART
  =================================================== */

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {

    return (
      <div className="checkout-page empty-checkout">

        <div className="empty-card">

          <div className="empty-checkout-icon">
            <ShoppingBag
              size={30}
            />
          </div>

          <h1>
            Keranjang masih kosong
          </h1>

          <p>
            Tambahkan makanan favoritmu
            terlebih dahulu sebelum
            melanjutkan ke proses checkout.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/explore"
              )
            }
          >
            Cari Makanan
          </button>

        </div>

      </div>
    );
  }

  /* ===================================================
     CALCULATION
  =================================================== */

  const subtotal =
    items.reduce(
      (
        totalAmount,
        item
      ) => {

        const price =
          getMenuPrice(
            item
          );

        const quantity =
          getQuantity(
            item
          );

        return (
          totalAmount +
          price *
          quantity
        );

      },
      0
    );

  const deliveryFee =
    deliveryType ===
      "delivery"
      ? 5000
      : 0;

  const total =
    subtotal +
    deliveryFee;

  /* ===================================================
     FORMAT RUPIAH
  =================================================== */

  const formatRupiah = (
    amount: number
  ): string => {

    return `Rp ${amount.toLocaleString(
      "id-ID"
    )}`;

  };

  /* ===================================================
     BACK
  =================================================== */

  const handleBack = () => {

    if (
      isSubmitting
    ) {
      return;
    }

    navigate(
      "/cart"
    );

  };

  /* ===================================================
     PAYMENT
  =================================================== */

  const handlePayment =
    async () => {

      if (
        isSubmitting
      ) {
        return;
      }

      /* =============================================
         ADDRESS
      ============================================= */

      if (
        deliveryType ===
        "delivery" &&
        !address.trim()
      ) {

        showNotification(
          "warning",
          "Alamat belum diisi",
          "Masukkan alamat pengantaran terlebih dahulu."
        );

        return;
      }

      /* =============================================
         PAYMENT METHOD
      ============================================= */

      if (
        !paymentMethod
      ) {

        showNotification(
          "warning",
          "Metode pembayaran belum dipilih",
          "Pilih salah satu metode pembayaran untuk melanjutkan."
        );

        return;
      }

      /* =============================================
         VALID PAYMENT METHOD
      ============================================= */

      const validPaymentMethods:
        PaymentMethod[] = [
          "qris",
          "bank_transfer",
          "virtual_account",
        ];

      if (
        !validPaymentMethods.includes(
          paymentMethod as PaymentMethod
        )
      ) {

        showNotification(
          "error",
          "Metode pembayaran tidak valid",
          "Gunakan QRIS, Transfer Bank, atau Virtual Account."
        );

        return;
      }

      /* =============================================
         CART VALIDATION
      ============================================= */

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {

        showNotification(
          "warning",
          "Keranjang kosong",
          "Tambahkan menu terlebih dahulu."
        );

        return;
      }

      /* =============================================
         START SUBMIT
      ============================================= */

      setIsSubmitting(
        true
      );

      try {

        console.log(
          "========================================"
        );

        console.log(
          "CHECKOUT START"
        );

        console.log(
          "RAW CART:",
          items
        );

        console.log(
          "========================================"
        );

        /* ===========================================
           VALIDATE ALL ITEMS
        =========================================== */

        const normalizedItems =
          items.map(
            (
              item,
              index
            ) => {

              const menuId =
                getMenuId(
                  item
                );

              const sellerId =
                getSellerIdFromItem(
                  item
                );

              const menuName =
                getMenuName(
                  item
                );

              const quantity =
                getQuantity(
                  item
                );

              const price =
                getMenuPrice(
                  item
                );

              console.log(
                "CHECKOUT ITEM:",
                {
                  index,
                  menuName,
                  menuId,
                  menuIdValid:
                    isValidUUID(
                      menuId
                    ),
                  sellerId,
                  sellerIdValid:
                    isValidUUID(
                      sellerId
                    ),
                  quantity,
                  price,
                  rawItem:
                    item,
                }
              );

              return {
                item,
                menuId,
                sellerId,
                menuName,
                quantity,
                price,
              };

            }
          );

        /* ===========================================
           MENU ID VALIDATION
        =========================================== */

        for (
          const normalizedItem
          of normalizedItems
        ) {

          if (
            !isValidUUID(
              normalizedItem.menuId
            )
          ) {

            console.error(
              "INVALID MENU ID:",
              {
                menu:
                  normalizedItem.menuName,
                menuId:
                  normalizedItem.menuId,
                item:
                  normalizedItem.item,
              }
            );

            throw new Error(
              `Menu "${normalizedItem.menuName}" memiliki ID yang tidak valid.`
            );
          }

        }

        /* ===========================================
           SELLER IDS
        =========================================== */

        const sellerIds =
          normalizedItems.map(
            (
              normalizedItem
            ) =>
              normalizedItem.sellerId
          );

        console.log(
          "SELLER IDS:",
          sellerIds
        );

        /* ===========================================
           SELLER ID REQUIRED
        =========================================== */

        const sellerId =
          sellerIds[0] ??
          "";

        if (
          !sellerId
        ) {

          showNotification(
            "error",
            "Warteg tidak ditemukan",
            "Menu yang dipilih tidak memiliki ID warteg."
          );

          return;
        }

        /* ===========================================
           SELLER UUID VALIDATION
        =========================================== */

        if (
          !isValidUUID(
            sellerId
          )
        ) {

          console.error(
            "INVALID SELLER ID:",
            sellerId
          );

          showNotification(
            "error",
            "Seller ID tidak valid",
            "ID warteg yang tersimpan di keranjang bukan UUID yang valid."
          );

          return;
        }

        /* ===========================================
           CHECK ALL SELLERS
        =========================================== */

        const missingSeller =
          sellerIds.some(
            (
              currentSellerId
            ) =>
              !isValidUUID(
                currentSellerId
              )
          );

        if (
          missingSeller
        ) {

          console.error(
            "MISSING / INVALID SELLER:",
            sellerIds
          );

          showNotification(
            "error",
            "Data warteg tidak lengkap",
            "Salah satu menu tidak memiliki ID warteg yang valid."
          );

          return;
        }

        /* ===========================================
           SINGLE SELLER VALIDATION
        =========================================== */

        const differentSeller =
          sellerIds.some(
            (
              currentSellerId
            ) =>
              currentSellerId !==
              sellerId
          );

        if (
          differentSeller
        ) {

          console.error(
            "MULTIPLE SELLERS:",
            sellerIds
          );

          showNotification(
            "warning",
            "Pesanan tidak dapat diproses",
            "Pesanan hanya dapat berisi menu dari satu warteg."
          );

          return;
        }

        /* ===========================================
           QUANTITY VALIDATION
        =========================================== */

        const invalidQuantity =
          normalizedItems.some(
            (
              normalizedItem
            ) => {

              return (
                !Number.isFinite(
                  normalizedItem.quantity
                ) ||
                normalizedItem.quantity <=
                0 ||
                !Number.isInteger(
                  normalizedItem.quantity
                )
              );

            }
          );

        if (
          invalidQuantity
        ) {

          console.error(
            "INVALID QUANTITY:",
            normalizedItems
          );

          showNotification(
            "error",
            "Jumlah menu tidak valid",
            "Jumlah setiap menu harus berupa angka bulat lebih dari 0."
          );

          return;
        }

        /* ===========================================
           BUILD ORDER ITEMS
        =========================================== */

        const orderItems =
          normalizedItems.map(
            (
              normalizedItem
            ) => ({

              menu_id:
                normalizedItem.menuId,

              quantity:
                normalizedItem.quantity,

            })
          );

        /* ===========================================
           FINAL PAYLOAD
        =========================================== */

        const payload = {

          seller_id:
            sellerId,

          payment_method:
            paymentMethod as PaymentMethod,

          items:
            orderItems,

        };

        /* ===========================================
           FINAL DEBUG
        =========================================== */

        console.log(
          "========================================"
        );

        console.log(
          "FINAL CREATE ORDER PAYLOAD"
        );

        console.log(
          "SELLER ID:",
          sellerId
        );

        console.log(
          "SELLER UUID VALID:",
          isValidUUID(
            sellerId
          )
        );

        console.log(
          "PAYMENT METHOD:",
          paymentMethod
        );

        console.log(
          "ITEMS:",
          orderItems
        );

        console.log(
          "PAYLOAD:",
          JSON.stringify(
            payload,
            null,
            2
          )
        );

        console.log(
          "========================================"
        );

        /* ===========================================
           CREATE ORDER
        =========================================== */

        const response =
          await api.post<OrderResponse>(
            "/orders",
            payload
          );

        console.log(
          "========================================"
        );

        console.log(
          "CREATE ORDER RESPONSE"
        );

        console.log(
          response.data
        );

        console.log(
          "========================================"
        );

        /* ===========================================
           GET ORDER ID
        =========================================== */

        const orderId =
          getOrderIdFromResponse(
            response.data
          );

        /* ===========================================
           ORDER ID VALIDATION
        =========================================== */

        if (
          !isValidUUID(
            orderId
          )
        ) {

          console.error(
            "INVALID ORDER ID:",
            orderId
          );

          console.error(
            "FULL RESPONSE:",
            response.data
          );

          showNotification(
            "error",
            "Order gagal dibuat",
            response.data?.message ??
            response.data?.error ??
            "Server tidak mengembalikan ID order yang valid."
          );

          return;
        }

        console.log(
          "VALID ORDER ID:",
          orderId
        );

        /* ===========================================
           ORDER DATA
        =========================================== */

        const orderData =
          response.data?.data ??
          response.data;

        console.log(
          "ORDER NUMBER:",
          orderData?.order_number
        );

        /* ===========================================
           PAYMENT URL
        =========================================== */

        const paymentUrl =
          `/payment/${orderId}`;

        console.log(
          "PAYMENT URL:",
          paymentUrl
        );

        /* ===========================================
           SUCCESS
        =========================================== */

        showNotification(
          "success",
          "Pesanan berhasil dibuat",
          "Mengalihkan ke halaman pembayaran..."
        );

        /* ===========================================
           NAVIGATE
        =========================================== */

        window.setTimeout(
          () => {

            navigate(
              paymentUrl
            );

          },
          700
        );

      } catch (
      error: unknown
      ) {

        console.error(
          "========================================"
        );

        console.error(
          "CREATE ORDER ERROR:",
          error
        );

        console.error(
          "========================================"
        );

        const err =
          error as {
            response?: {
              status?: number;

              data?: {
                success?: boolean;
                error?: string;
                message?: string;
                details?: string;
              };
            };

            message?: string;
          };

        const status =
          err.response?.status;

        const data =
          err.response?.data;

        console.error(
          "HTTP STATUS:",
          status
        );

        console.error(
          "RESPONSE DATA:",
          data
        );

        /* =========================================
           401
        ========================================= */

        if (
          status === 401
        ) {

          showNotification(
            "error",
            "Sesi login berakhir",
            "Silakan login kembali untuk melanjutkan."
          );

          window.setTimeout(
            () => {
              navigate(
                "/login"
              );
            },
            1200
          );

          return;
        }

        /* =========================================
           400
        ========================================= */

        if (
          status === 400
        ) {

          showNotification(
            "warning",
            "Data checkout tidak valid",
            data?.message ??
            data?.error ??
            data?.details ??
            "Periksa kembali data checkout."
          );

          return;
        }

        /* =========================================
           404
        ========================================= */

        if (
          status === 404
        ) {

          showNotification(
            "error",
            "Data tidak ditemukan",
            data?.message ??
            data?.error ??
            data?.details ??
            "Seller atau menu yang dipilih tidak ditemukan."
          );

          return;
        }

        /* =========================================
           409
        ========================================= */

        if (
          status === 409
        ) {

          showNotification(
            "warning",
            "Pesanan tidak dapat dibuat",
            data?.message ??
            data?.error ??
            data?.details ??
            "Terjadi konflik pada data pesanan."
          );

          return;
        }

        /* =========================================
           422
        ========================================= */

        if (
          status === 422
        ) {

          showNotification(
            "warning",
            "Data tidak dapat diproses",
            data?.message ??
            data?.error ??
            data?.details ??
            "Periksa kembali data pesanan."
          );

          return;
        }

        /* =========================================
           500
        ========================================= */

        if (
          status &&
          status >= 500
        ) {

          showNotification(
            "error",
            "Server bermasalah",
            data?.message ??
            data?.error ??
            data?.details ??
            "Server sedang mengalami masalah. Silakan coba lagi."
          );

          return;
        }

        /* =========================================
           BACKEND MESSAGE
        ========================================= */

        if (
          data?.message
        ) {

          showNotification(
            "error",
            "Checkout gagal",
            data.message
          );

          return;
        }

        /* =========================================
           BACKEND ERROR
        ========================================= */

        if (
          data?.error
        ) {

          showNotification(
            "error",
            "Checkout gagal",
            data.error
          );

          return;
        }

        /* =========================================
           BACKEND DETAILS
        ========================================= */

        if (
          data?.details
        ) {

          showNotification(
            "error",
            "Checkout gagal",
            data.details
          );

          return;
        }

        /* =========================================
           GENERAL ERROR
        ========================================= */

        showNotification(
          "error",
          "Checkout gagal",
          err.message ??
          "Terjadi kesalahan. Silakan coba lagi."
        );

      } finally {

        setIsSubmitting(
          false
        );

      }
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="checkout-page">

      {/* =================================================
          NOTIFICATION
      ================================================= */}

      {notification && (

        <div
          className={`checkout-notification ${notification.type}`}
          role="alert"
        >

          <div className="notification-icon">

            {notification.type ===
              "warning" && (
                <AlertTriangle
                  size={20}
                />
              )}

            {notification.type ===
              "error" && (
                <XCircle
                  size={20}
                />
              )}

            {notification.type ===
              "success" && (
                <CheckCircle2
                  size={20}
                />
              )}

          </div>

          <div className="notification-content">

            <strong>
              {notification.title}
            </strong>

            <p>
              {notification.message}
            </p>

          </div>

          <button
            type="button"
            className="notification-close"
            aria-label="Tutup notifikasi"
            onClick={
              closeNotification
            }
          >
            <X
              size={17}
            />
          </button>

        </div>

      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="checkout-top">

        <button
          type="button"
          className="back-button"
          onClick={
            handleBack
          }
          disabled={
            isSubmitting
          }
        >

          <ArrowLeft
            size={19}
          />

          <span>
            Kembali
          </span>

        </button>

        <div className="checkout-hero">

          <div className="checkout-header">

            <h1>
              Selesaikan Pesananmu
            </h1>

            <p>
              Tinggal satu langkah lagi.
              Pastikan alamat, metode
              pengambilan, dan pembayaran
              sudah benar sebelum melanjutkan.
            </p>

          </div>

          <div className="checkout-progress">

            <div className="progress-step done">

              <div className="step-circle">
                ✓
              </div>

              <span>
                Keranjang
              </span>

            </div>

            <div className="progress-line done" />

            <div className="progress-step active">

              <div className="step-circle">
                2
              </div>

              <span>
                Checkout
              </span>

            </div>

            <div className="progress-line" />

            <div className="progress-step">

              <div className="step-circle">
                3
              </div>

              <span>
                Pembayaran
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="checkout-layout">

        {/* =================================================
            LEFT
        ================================================= */}

        <section className="cart-items">

          {/* =================================================
              DELIVERY
          ================================================= */}

          <section className="checkout-card">

            <div className="checkout-card-header">

              <div className="checkout-number">
                1
              </div>

              <div>

                <h2>
                  Metode Pengambilan
                </h2>

                <p>
                  Pilih bagaimana pesananmu diterima.
                </p>

              </div>

            </div>

            <div className="delivery-options">

              <button
                type="button"
                className={
                  deliveryType ===
                    "delivery"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() =>
                  setCheckout({
                    pickupMethod:
                      "delivery",
                  })
                }
                disabled={
                  isSubmitting
                }
              >

                <span className="delivery-icon">
                  <Bike
                    size={25}
                  />
                </span>

                <span className="delivery-text">

                  <strong>
                    Diantar
                  </strong>

                  <small>
                    Pesanan diantar ke alamatmu
                  </small>

                </span>

                <span className="custom-radio">

                  {deliveryType ===
                    "delivery" && (
                      <span />
                    )}

                </span>

              </button>

              <button
                type="button"
                className={
                  deliveryType ===
                    "pickup"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() =>
                  setCheckout({
                    pickupMethod:
                      "pickup",
                  })
                }
                disabled={
                  isSubmitting
                }
              >

                <span className="delivery-icon">
                  <ShoppingBag
                    size={25}
                  />
                </span>

                <span className="delivery-text">

                  <strong>
                    Ambil Sendiri
                  </strong>

                  <small>
                    Ambil langsung di warteg
                  </small>

                </span>

                <span className="custom-radio">

                  {deliveryType ===
                    "pickup" && (
                      <span />
                    )}

                </span>

              </button>

            </div>

          </section>

          {/* =================================================
              ADDRESS
          ================================================= */}

          {deliveryType ===
            "delivery" && (

              <section className="checkout-card">

                <div className="checkout-card-header">

                  <div className="checkout-number">
                    2
                  </div>

                  <div>

                    <h2>
                      Alamat Pengantaran
                    </h2>

                    <p>
                      Masukkan alamat lengkap tujuan pesanan.
                    </p>

                  </div>

                </div>

                <div className="address-input-wrapper">

                  <MapPin
                    size={20}
                  />

                  <textarea
                    rows={4}
                    value={
                      address
                    }
                    disabled={
                      isSubmitting
                    }
                    onChange={(
                      event
                    ) =>
                      setCheckout({
                        address:
                          event.target.value,
                      })
                    }
                    placeholder="Contoh: Jl. Kemang Raya No. 12, Jakarta Selatan"
                  />

                </div>

              </section>

            )}

          {/* =================================================
              PAYMENT
          ================================================= */}

          <section className="checkout-card">

            <div className="checkout-card-header">

              <div className="checkout-number">

                {deliveryType ===
                  "delivery"
                  ? "3"
                  : "2"}

              </div>

              <div>

                <h2>
                  Metode Pembayaran
                </h2>

                <p>
                  Pilih metode pembayaran yang kamu inginkan.
                </p>

              </div>

            </div>

            <div className="payment-method-list">

              <PaymentOption
                active={
                  paymentMethod ===
                  "qris"
                }
                icon={
                  <QrCode
                    size={22}
                  />
                }
                title="QRIS"
                description="Scan menggunakan mobile banking atau e-wallet."
                disabled={
                  isSubmitting
                }
                onClick={() =>
                  setCheckout({
                    paymentMethod:
                      "qris",
                  })
                }
              />

              <PaymentOption
                active={
                  paymentMethod ===
                  "bank_transfer"
                }
                icon={
                  <Building2
                    size={22}
                  />
                }
                title="Transfer Bank / ATM"
                description="Transfer melalui ATM atau mobile banking."
                disabled={
                  isSubmitting
                }
                onClick={() =>
                  setCheckout({
                    paymentMethod:
                      "bank_transfer",
                  })
                }
              />

              <PaymentOption
                active={
                  paymentMethod ===
                  "virtual_account"
                }
                icon={
                  <CreditCard
                    size={22}
                  />
                }
                title="Virtual Account"
                description="Bayar menggunakan nomor virtual account."
                disabled={
                  isSubmitting
                }
                onClick={() =>
                  setCheckout({
                    paymentMethod:
                      "virtual_account",
                  })
                }
              />

            </div>

          </section>

        </section>

        {/* =================================================
            RIGHT
        ================================================= */}

        <aside className="order-summary">

          <div className="summary-header">

            <h2>
              Ringkasan Pesanan
            </h2>

            <span>
              {items.length} menu
            </span>

          </div>

          <div className="checkout-items">

            {items.map(
              (
                item,
                index
              ) => {

                const price =
                  getMenuPrice(
                    item
                  );

                const quantity =
                  getQuantity(
                    item
                  );

                const itemTotal =
                  price *
                  quantity;

                const menuId =
                  getMenuId(
                    item
                  ) ||
                  `checkout-item-${index}`;

                return (

                  <div
                    className="checkout-item"
                    key={
                      menuId
                    }
                  >

                    <div>

                      <strong>
                        {
                          getMenuName(
                            item
                          )
                        }
                      </strong>

                      <span>
                        {quantity} ×{" "}
                        {formatRupiah(
                          price
                        )}
                      </span>

                    </div>

                    <strong>
                      {formatRupiah(
                        itemTotal
                      )}
                    </strong>

                  </div>

                );

              }
            )}

          </div>

          <div className="summary-divider" />

          <div className="summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              {formatRupiah(
                subtotal
              )}
            </strong>

          </div>

          <div className="summary-row">

            <span>
              Ongkos Kirim
            </span>

            <strong>

              {deliveryFee ===
                0
                ? "Gratis"
                : formatRupiah(
                  deliveryFee
                )}

            </strong>

          </div>

          <div className="summary-divider" />

          <div className="summary-total">

            <span>
              Total Bayar
            </span>

            <strong>
              {formatRupiah(
                total
              )}
            </strong>

          </div>

          <button
            type="button"
            className={
              isSubmitting
                ? "checkout-pay-button loading"
                : "checkout-pay-button"
            }
            onClick={
              handlePayment
            }
            disabled={
              isSubmitting
            }
          >

            {isSubmitting ? (

              <>

                <span className="checkout-spinner" />

                <span>
                  Memproses Pesanan...
                </span>

              </>

            ) : (

              <>

                <span>
                  Lanjut Bayar
                </span>

                <ArrowRight
                  size={18}
                />

              </>

            )}

          </button>

        </aside>

      </div>

    </div>
  );
}

/* =====================================================
   PAYMENT OPTION
===================================================== */

interface PaymentOptionProps {
  active: boolean;

  icon: ReactNode;

  title: string;

  description: string;

  disabled?: boolean;

  onClick: () => void;
}

function PaymentOption({
  active,
  icon,
  title,
  description,
  disabled = false,
  onClick,
}: PaymentOptionProps) {

  return (

    <button
      type="button"
      className={
        active
          ? "payment-method active"
          : "payment-method"
      }
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      aria-pressed={
        active
      }
    >

      <div className="payment-icon">
        {icon}
      </div>

      <div className="payment-content">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <div className="payment-radio">

        {active && (
          <span />
        )}

      </div>

    </button>

  );
}