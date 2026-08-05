import {
  ShoppingBag,
  CheckCircle,
  Package,
  User,
  Bell,
  Volume2,
  X,
  Truck,
  Clock3,
  ChevronRight,
  Loader2,
  CircleCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import SellerNavbar from "./SellerNavbar";
import api from "../../services/api";

import "../../styles/seller/Orders.css";

/* =====================================================
   TYPES
===================================================== */

type OrderStatus =
  | "WAITING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "ON_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED";

type DateFilter =
  | "all"
  | "today"
  | "month";

type StatusFilter =
  | "ALL"
  | OrderStatus;

interface OrderItem {
  id: string;
  order_id: string;
  menu_id: string;
  menu_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

interface OrderUser {
  id: string;
  name: string;
  email: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  seller_id: string;

  status: OrderStatus;
  payment_status: PaymentStatus;

  total_amount: number;
  payment_method: string;

  created_at: string;
  updated_at: string;

  items: OrderItem[];

  user?: OrderUser | null;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function Orders() {
  const { seller_id } = useParams<{
    seller_id: string;
  }>();

  /* =====================================================
     MENU
  ===================================================== */

  const [openMenu, setOpenMenu] =
    useState(true);

  /* =====================================================
     ORDERS
  ===================================================== */

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =====================================================
     FILTER
  ===================================================== */

  const [orderFilter, setOrderFilter] =
    useState<DateFilter>("all");

  const [revenueFilter, setRevenueFilter] =
    useState<DateFilter>("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  /* =====================================================
     NOTIFICATION
  ===================================================== */

  const [newOrderCount, setNewOrderCount] =
    useState(0);

  const [notificationVisible, setNotificationVisible] =
    useState(false);

  const [lastNewOrder, setLastNewOrder] =
    useState<Order | null>(null);

  /* =====================================================
     UPDATE
  ===================================================== */

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  /* =====================================================
     DELIVERY MODAL
  ===================================================== */

  const [deliveryOrder, setDeliveryOrder] =
    useState<Order | null>(null);

  /* =====================================================
     REFS
  ===================================================== */

  const previousOrderIdsRef =
    useRef<Set<string>>(new Set());

  const isFirstLoadRef =
    useRef(true);

  const requestRunningRef =
    useRef(false);

  const soundRef =
    useRef<HTMLAudioElement | null>(null);

  /* =====================================================
     NORMALIZE STATUS
  ===================================================== */

  const normalizeStatus = useCallback(
    (status: unknown): OrderStatus => {
      const normalized =
        String(status ?? "")
          .trim()
          .toUpperCase();

      switch (normalized) {
        case "WAITING_CONFIRMATION":
        case "WAITING":
        case "NEW":
          return "WAITING_CONFIRMATION";

        case "CONFIRMED":
          return "CONFIRMED";

        case "PREPARING":
        case "PROCESSING":
          return "PREPARING";

        case "READY":
          return "READY";

        case "ON_DELIVERY":
        case "DELIVERING":
          return "ON_DELIVERY";

        case "COMPLETED":
        case "DONE":
          return "COMPLETED";

        case "CANCELLED":
        case "CANCELED":
          return "CANCELLED";

        /*
         * PAID adalah PAYMENT STATUS,
         * bukan ORDER STATUS.
         */
        case "PAID":
          return "WAITING_CONFIRMATION";

        default:
          return "WAITING_CONFIRMATION";
      }
    },
    []
  );

  /* =====================================================
     NORMALIZE PAYMENT STATUS
  ===================================================== */

  const normalizePaymentStatus = useCallback(
    (value: unknown): PaymentStatus => {
      const normalized =
        String(value ?? "")
          .trim()
          .toUpperCase();

      switch (normalized) {
        case "PAID":
          return "PAID";

        case "FAILED":
        case "FAIL":
          return "FAILED";

        case "PENDING":
        case "UNPAID":
        default:
          return "PENDING";
      }
    },
    []
  );

  /* =====================================================
     NORMALIZE ORDER
  ===================================================== */

  const normalizeOrder = useCallback(
    (raw: any): Order => {
      const paymentStatus =
        normalizePaymentStatus(
          raw?.payment_status ??
          raw?.paymentStatus
        );

      const rawItems =
        Array.isArray(raw?.items)
          ? raw.items
          : [];

      const normalizedItems: OrderItem[] =
        rawItems.map(
          (
            item: any,
            index: number
          ) => ({
            id: String(
              item?.id ??
              `${raw?.id ?? "order"}-${index}`
            ),

            order_id: String(
              item?.order_id ??
              raw?.id ??
              ""
            ),

            menu_id: String(
              item?.menu_id ??
              item?.menu?.id ??
              ""
            ),

            menu_name: String(
              item?.menu_name ??
              item?.name ??
              item?.menu?.name ??
              "Menu"
            ),

            quantity: Number(
              item?.quantity ?? 0
            ),

            price: Number(
              item?.price ?? 0
            ),

            created_at:
              item?.created_at ??
              raw?.created_at ??
              new Date().toISOString(),
          })
        );

      const rawUser =
        raw?.user ??
        raw?.User ??
        null;

      const user: OrderUser | null =
        rawUser
          ? {
            id: String(
              rawUser?.id ??
              raw?.user_id ??
              ""
            ),

            name: String(
              rawUser?.name ??
              rawUser?.full_name ??
              rawUser?.username ??
              "Customer"
            ),

            email: String(
              rawUser?.email ??
              ""
            ),
          }
          : null;

      return {
        id: String(
          raw?.id ?? ""
        ),

        order_number: String(
          raw?.order_number ??
          raw?.orderNumber ??
          "-"
        ),

        user_id: String(
          raw?.user_id ??
          raw?.user?.id ??
          ""
        ),

        seller_id: String(
          raw?.seller_id ??
          seller_id ??
          ""
        ),

        status:
          normalizeStatus(
            raw?.status
          ),

        payment_status:
          paymentStatus,

        total_amount: Number(
          raw?.total_amount ??
          raw?.total ??
          raw?.grand_total ??
          0
        ),

        payment_method: String(
          raw?.payment_method ??
          raw?.paymentMethod ??
          "-"
        ),

        created_at:
          raw?.created_at ??
          new Date().toISOString(),

        updated_at:
          raw?.updated_at ??
          raw?.created_at ??
          new Date().toISOString(),

        items:
          normalizedItems,

        user,
      };
    },
    [
      seller_id,
      normalizeStatus,
      normalizePaymentStatus,
    ]
  );

  /* =====================================================
     EXTRACT ORDERS
  ===================================================== */

  const extractOrders = useCallback(
    (data: any): any[] => {
      if (Array.isArray(data)) {
        return data;
      }

      if (
        Array.isArray(data?.data)
      ) {
        return data.data;
      }

      if (
        Array.isArray(data?.orders)
      ) {
        return data.orders;
      }

      if (
        Array.isArray(
          data?.data?.orders
        )
      ) {
        return data.data.orders;
      }

      return [];
    },
    []
  );

  /* =====================================================
     SOUND
  ===================================================== */

  const playNotificationSound =
    useCallback(() => {
      try {
        if (!soundRef.current) {
          soundRef.current =
            new Audio(
              "/sounds/new-order.mp3"
            );

          soundRef.current.volume = 0.8;
        }

        soundRef.current.currentTime = 0;

        const playPromise =
          soundRef.current.play();

        if (playPromise) {
          playPromise.catch(() => {
            console.log(
              "Browser memblokir autoplay sound."
            );
          });
        }
      } catch (error) {
        console.error(
          "Notification sound error:",
          error
        );
      }
    }, []);

  /* =====================================================
     BROWSER NOTIFICATION
  ===================================================== */

  const showBrowserNotification =
    useCallback(
      (newOrders: Order[]) => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        if (
          !("Notification" in window)
        ) {
          return;
        }

        if (
          Notification.permission !==
          "granted"
        ) {
          return;
        }

        if (
          newOrders.length === 0
        ) {
          return;
        }

        const firstOrder =
          newOrders[0];

        const customerName =
          firstOrder.user?.name ??
          "Customer";

        const message =
          newOrders.length === 1
            ? `Pesanan ${firstOrder.order_number} dari ${customerName} masuk.`
            : `${newOrders.length} pesanan baru masuk.`;

        try {
          new Notification(
            "Pesanan Baru Masuk!",
            {
              body: message,
              icon: "/favicon.ico",
              tag: `wartegkita-new-order-${firstOrder.id}`,
            }
          );
        } catch (error) {
          console.error(
            "Browser notification error:",
            error
          );
        }
      },
      []
    );

  /* =====================================================
     NOTIFICATION PERMISSION
  ===================================================== */

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    if (
      !("Notification" in window)
    ) {
      return;
    }

    if (
      Notification.permission ===
      "default"
    ) {
      Notification.requestPermission()
        .catch(() => { });
    }
  }, []);

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  const loadOrders = useCallback(
    async (
      notify = false
    ) => {
      if (!seller_id) {
        setErrorMessage(
          "Seller ID tidak ditemukan."
        );

        setLoading(false);

        return;
      }

      /*
       * Jangan melakukan GET ketika sedang
       * menjalankan PATCH status.
       */
      if (
        requestRunningRef.current ||
        updatingOrderId
      ) {
        return;
      }

      requestRunningRef.current =
        true;

      try {
        if (
          isFirstLoadRef.current
        ) {
          setLoading(true);
        }

        setErrorMessage("");

        const endpoint =
          `/sellers/${encodeURIComponent(
            seller_id
          )}/orders`;

        console.log(
          "========== LOAD SELLER ORDERS =========="
        );

        console.log(
          "Seller ID:",
          seller_id
        );

        console.log(
          "Endpoint:",
          endpoint
        );

        const response =
          await api.get(
            endpoint,
            {
              timeout: 10000,
            }
          );

        console.log(
          "Seller Orders Response:",
          response.data
        );

        const rawOrders =
          extractOrders(
            response.data
          );

        const receivedOrders =
          rawOrders
            .map(normalizeOrder)
            .filter(
              (order) =>
                Boolean(order.id)
            )
            .sort(
              (a, b) =>
                new Date(
                  b.created_at
                ).getTime() -
                new Date(
                  a.created_at
                ).getTime()
            );

        const currentIds =
          new Set<string>(
            receivedOrders.map(
              (order) =>
                order.id
            )
          );

        /*
         * DETEKSI PESANAN BARU
         */

        if (
          !isFirstLoadRef.current
        ) {
          const newOrders =
            receivedOrders.filter(
              (order) =>
                order.status ===
                "WAITING_CONFIRMATION" &&
                !previousOrderIdsRef.current.has(
                  order.id
                )
            );

          if (
            newOrders.length > 0
          ) {
            setNewOrderCount(
              (previous) =>
                previous +
                newOrders.length
            );

            setLastNewOrder(
              newOrders[0]
            );

            setNotificationVisible(
              true
            );

            if (notify) {
              playNotificationSound();

              showBrowserNotification(
                newOrders
              );
            }
          }
        }

        previousOrderIdsRef.current =
          currentIds;

        setOrders(
          receivedOrders
        );

        isFirstLoadRef.current =
          false;
      } catch (error: any) {
        console.error(
          "ORDER API ERROR:",
          error
        );

        if (
          error?.response
        ) {
          const status =
            error.response.status;

          const responseData =
            error.response.data;

          console.error(
            "BACKEND RESPONSE:",
            responseData
          );

          const backendMessage =
            responseData?.error ??
            responseData?.message ??
            responseData?.detail;

          switch (status) {
            case 400:
              setErrorMessage(
                backendMessage ??
                "Request pesanan tidak valid."
              );
              break;

            case 401:
              setErrorMessage(
                "Sesi login sudah tidak valid. Silakan login kembali."
              );
              break;

            case 403:
              setErrorMessage(
                backendMessage ??
                "Kamu tidak memiliki akses ke pesanan seller ini."
              );
              break;

            case 404:
              setErrorMessage(
                backendMessage ??
                "Endpoint pesanan seller tidak ditemukan."
              );
              break;

            case 500:
              setErrorMessage(
                backendMessage ??
                "Terjadi kesalahan pada server."
              );
              break;

            default:
              setErrorMessage(
                backendMessage ??
                `Gagal memuat pesanan. HTTP ${status}.`
              );
          }
        } else if (
          error?.request
        ) {
          setErrorMessage(
            "Tidak dapat terhubung ke server WartegKita. Pastikan backend berjalan di http://localhost:8080."
          );
        } else {
          setErrorMessage(
            error?.message ??
            "Gagal memuat pesanan."
          );
        }
      } finally {
        requestRunningRef.current =
          false;

        setLoading(false);
      }
    },
    [
      seller_id,
      updatingOrderId,
      extractOrders,
      normalizeOrder,
      playNotificationSound,
      showBrowserNotification,
    ]
  );

  /* =====================================================
     INITIAL LOAD + POLLING
  ===================================================== */

  useEffect(() => {
    if (!seller_id) {
      return;
    }

    isFirstLoadRef.current =
      true;

    previousOrderIdsRef.current =
      new Set();

    requestRunningRef.current =
      false;

    setOrders([]);

    setNewOrderCount(0);

    setNotificationVisible(
      false
    );

    setLastNewOrder(null);

    setErrorMessage("");

    loadOrders(false);

    const intervalId =
      window.setInterval(
        () => {
          /*
           * Jangan polling ketika sedang
           * update status.
           */
          if (!updatingOrderId) {
            loadOrders(true);
          }
        },
        5000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    seller_id,
    loadOrders,
    updatingOrderId,
  ]);

  /* =====================================================
     UPDATE ORDER STATUS
  ===================================================== */

  const updateStatus = async (
    id: string,
    status: OrderStatus
  ) => {
    if (!seller_id) {
      setErrorMessage(
        "Seller ID tidak ditemukan."
      );

      return false;
    }

    if (!id) {
      setErrorMessage(
        "Order ID tidak ditemukan."
      );

      return false;
    }

    try {
      setUpdatingOrderId(id);

      setErrorMessage("");

      console.log(
        "========== UPDATE ORDER STATUS =========="
      );

      console.log(
        "Order ID:",
        id
      );

      console.log(
        "Seller ID:",
        seller_id
      );

      console.log(
        "New status:",
        status
      );

      /*
       * BACKEND:
       *
       * PATCH /api/v1/orders/:order_id/status
       *
       * BODY:
       *
       * {
       *   "status": "PREPARING"
       * }
       *
       * seller_id TIDAK diperlukan oleh
       * controller backend saat ini.
       */

      const endpoint =
        `/orders/${encodeURIComponent(
          id
        )}/status`;

      const response =
        await api.patch(
          endpoint,
          {
            status,
          },
          {
            timeout: 10000,

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },
          }
        );

      console.log(
        "UPDATE STATUS SUCCESS:",
        response.data
      );

      /*
       * Update lokal terlebih dahulu agar UI
       * langsung berubah.
       */

      setOrders(
        (previousOrders) =>
          previousOrders.map(
            (order) =>
              order.id === id
                ? {
                  ...order,
                  status,
                }
                : order
          )
      );

      /*
       * Ambil data terbaru setelah PATCH.
       */

      requestRunningRef.current =
        false;

      await loadOrders(false);

      return true;
    } catch (error: any) {
      console.error(
        "========== UPDATE STATUS ERROR =========="
      );

      console.error(
        error
      );

      const responseData =
        error?.response?.data;

      console.error(
        "BACKEND RESPONSE:",
        responseData
      );

      const backendMessage =
        responseData?.error ??
        responseData?.message ??
        responseData?.detail;

      if (
        error?.response?.status ===
        400
      ) {
        setErrorMessage(
          backendMessage ??
          `Backend menolak status "${status}". Periksa nilai OrderStatus di models/order.go.`
        );
      } else if (
        error?.response?.status ===
        401
      ) {
        setErrorMessage(
          "Sesi login sudah tidak valid. Silakan login kembali."
        );
      } else if (
        error?.response?.status ===
        403
      ) {
        setErrorMessage(
          backendMessage ??
          "Kamu tidak memiliki izin mengubah pesanan ini."
        );
      } else if (
        error?.response?.status ===
        404
      ) {
        setErrorMessage(
          backendMessage ??
          "Order tidak ditemukan."
        );
      } else if (
        error?.response?.status >=
        500
      ) {
        setErrorMessage(
          backendMessage ??
          "Terjadi kesalahan pada server."
        );
      } else {
        setErrorMessage(
          backendMessage ??
          error?.message ??
          "Gagal memperbarui status pesanan."
        );
      }

      return false;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /* =====================================================
     START PROCESS
  ===================================================== */

  const handleStartProcess =
    async (
      id: string
    ) => {
      /*
       * Alur backend:
       *
       * WAITING_CONFIRMATION
       *          ↓
       *       CONFIRMED
       *          ↓
       *       PREPARING
       */

      await updateStatus(
        id,
        "CONFIRMED"
      );
    };

  /* =====================================================
     START PREPARING
  ===================================================== */

  const handleStartPreparing =
    async (
      id: string
    ) => {
      await updateStatus(
        id,
        "PREPARING"
      );
    };

  /* =====================================================
     OPEN DELIVERY MODAL
  ===================================================== */

  const handleOpenDeliveryModal =
    (
      order: Order
    ) => {
      if (
        updatingOrderId
      ) {
        return;
      }

      setDeliveryOrder(
        order
      );
    };

  /* =====================================================
     CLOSE DELIVERY MODAL
  ===================================================== */

  const handleCloseDeliveryModal =
    () => {
      if (
        updatingOrderId
      ) {
        return;
      }

      setDeliveryOrder(
        null
      );
    };

  /* =====================================================
     CONFIRM READY
  ===================================================== */

  const handleConfirmReady =
    async () => {
      if (
        !deliveryOrder
      ) {
        return;
      }

      const success =
        await updateStatus(
          deliveryOrder.id,
          "READY"
        );

      if (success) {
        setDeliveryOrder(
          null
        );
      }
    };

  /* =====================================================
     NEXT STATUS
  ===================================================== */

  const handleNextStatus = (
    order: Order
  ) => {
    switch (order.status) {
      case "WAITING_CONFIRMATION":
        handleStartProcess(
          order.id
        );
        break;

      case "CONFIRMED":
        handleStartPreparing(
          order.id
        );
        break;

      case "PREPARING":
        handleOpenDeliveryModal(
          order
        );
        break;

      case "READY":
        updateStatus(
          order.id,
          "ON_DELIVERY"
        );
        break;

      case "ON_DELIVERY":
        updateStatus(
          order.id,
          "COMPLETED"
        );
        break;

      default:
        break;
    }
  };

  /* =====================================================
     STATUS LABEL
  ===================================================== */

  const getStatusLabel = (
    status: OrderStatus
  ) => {
    switch (status) {
      case "WAITING_CONFIRMATION":
        return "Pesanan Baru";

      case "CONFIRMED":
        return "Dikonfirmasi";

      case "PREPARING":
        return "Sedang Disiapkan";

      case "READY":
        return "Siap Diantar";

      case "ON_DELIVERY":
        return "Sedang Diantar";

      case "COMPLETED":
        return "Selesai";

      case "CANCELLED":
        return "Dibatalkan";

      default:
        return status;
    }
  };

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (
    status: OrderStatus
  ) => {
    switch (status) {
      case "WAITING_CONFIRMATION":
        return "new";

      case "CONFIRMED":
        return "confirmed";

      case "PREPARING":
        return "preparing";

      case "READY":
        return "ready";

      case "ON_DELIVERY":
        return "delivering";

      case "COMPLETED":
        return "done";

      case "CANCELLED":
        return "rejected";

      default:
        return "";
    }
  };

  /* =====================================================
     PAYMENT LABEL
  ===================================================== */

  const getPaymentLabel = (
    method: string
  ) => {
    const normalized =
      String(
        method ?? ""
      )
        .toLowerCase()
        .trim();

    switch (normalized) {
      case "qris":
        return "QRIS";

      case "bank_transfer":
      case "bank transfer":
        return "Transfer Bank";

      case "virtual_account":
      case "virtual account":
        return "Virtual Account";

      case "paypal":
        return "PayPal";

      case "cod":
        return "COD";

      default:
        return method || "-";
    }
  };

  /* =====================================================
     DATE HELPERS
  ===================================================== */

  const isToday = (
    date: string
  ) => {
    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return false;
    }

    const now =
      new Date();

    return (
      parsedDate.getDate() ===
      now.getDate() &&
      parsedDate.getMonth() ===
      now.getMonth() &&
      parsedDate.getFullYear() ===
      now.getFullYear()
    );
  };

  const checkDate = (
    date: string,
    filter:
      | "today"
      | "month"
  ) => {
    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return false;
    }

    const now =
      new Date();

    if (
      filter === "today"
    ) {
      return isToday(date);
    }

    if (
      filter === "month"
    ) {
      return (
        parsedDate.getMonth() ===
        now.getMonth() &&
        parsedDate.getFullYear() ===
        now.getFullYear()
      );
    }

    return true;
  };

  /* =====================================================
     FILTERED ORDERS
  ===================================================== */

  const filteredOrders =
    orders.filter(
      (order) => {
        const dateValid =
          orderFilter === "all"
            ? true
            : checkDate(
              order.created_at,
              orderFilter
            );

        const statusValid =
          statusFilter === "ALL"
            ? true
            : order.status ===
            statusFilter;

        return (
          dateValid &&
          statusValid
        );
      }
    );

  /* =====================================================
     REVENUE
  ===================================================== */

  const revenueOrders =
    orders.filter(
      (order) => {
        if (
          order.payment_status !==
          "PAID"
        ) {
          return false;
        }

        if (
          revenueFilter ===
          "all"
        ) {
          return true;
        }

        return checkDate(
          order.created_at,
          revenueFilter
        );
      }
    );

  const totalRevenue =
    revenueOrders.reduce(
      (
        total,
        order
      ) =>
        total +
        Number(
          order.total_amount || 0
        ),
      0
    );

  /* =====================================================
     ACTIVE ORDERS
  ===================================================== */

  const activeOrders =
    orders.filter(
      (order) =>
        order.status !==
        "COMPLETED" &&
        order.status !==
        "CANCELLED"
    );

  /* =====================================================
     WAITING ORDERS
  ===================================================== */

  const waitingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "WAITING_CONFIRMATION"
    );

  /* =====================================================
     CLEAR NOTIFICATION
  ===================================================== */

  const clearNotification =
    () => {
      setNewOrderCount(0);

      setNotificationVisible(
        false
      );

      setLastNewOrder(null);
    };

  /* =====================================================
     CURRENCY
  ===================================================== */

  const formatCurrency = (
    value: number
  ) => {
    return Number(
      value || 0
    ).toLocaleString(
      "id-ID"
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`seller-layout ${openMenu
          ? "menu-open"
          : "menu-close"
        }`}
    >
      <SellerNavbar
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
      />

      <main className="seller-content">
        <div className="orders-page">

          {/* ERROR */}

          {errorMessage && (
            <div className="order-error-notification">
              <div className="notification-icon">
                <Bell size={20} />
              </div>

              <div className="notification-content">
                <strong>
                  Terjadi masalah
                </strong>

                <span>
                  {errorMessage}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage("")
                }
                className="notification-close"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* NEW ORDER */}

          {notificationVisible && (
            <div className="new-order-notification">
              <div className="notification-icon">
                <Bell size={21} />
              </div>

              <div className="notification-content">
                <strong>
                  Pesanan Baru Masuk!
                </strong>

                <span>
                  {lastNewOrder
                    ? `${lastNewOrder.order_number} dari ${lastNewOrder.user
                      ?.name ??
                    "Customer"
                    }`
                    : "Ada pesanan baru."}
                </span>
              </div>

              <button
                type="button"
                className="notification-close"
                onClick={() =>
                  setNotificationVisible(
                    false
                  )
                }
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* HEADER */}

          <header className="orders-title">
            <div className="orders-title-left">
              <div>
                <h1>
                  Pesanan Masuk
                </h1>

                <p>
                  Kelola pesanan pelanggan
                  dari warteg kamu.
                </p>
              </div>

              <div className="orders-live-status">
                <span />
                Live Update
              </div>
            </div>

            <div className="orders-title-actions">
              {newOrderCount > 0 && (
                <button
                  type="button"
                  className="new-order-alert"
                  onClick={
                    clearNotification
                  }
                >
                  <span className="notification-dot">
                    {newOrderCount}
                  </span>

                  <Bell size={17} />

                  Pesanan Baru
                </button>
              )}

              <div className="orders-title-icon">
                <ShoppingBag />
              </div>
            </div>
          </header>

          {/* SUMMARY */}

          <section className="orders-summary">

            <div className="summary-card">
              <div className="summary-icon">
                <ShoppingBag size={25} />
              </div>

              <div className="summary-content">
                <span>
                  Total Pesanan
                </span>

                <strong>
                  {filteredOrders.length}
                </strong>

                <select
                  value={orderFilter}
                  onChange={(event) =>
                    setOrderFilter(
                      event.target
                        .value as DateFilter
                    )
                  }
                >
                  <option value="all">
                    Semua
                  </option>

                  <option value="today">
                    Hari Ini
                  </option>

                  <option value="month">
                    Bulan Ini
                  </option>
                </select>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon success">
                <Clock3 size={25} />
              </div>

              <div className="summary-content">
                <span>
                  Pesanan Aktif
                </span>

                <strong>
                  {
                    activeOrders.filter(
                      (order) =>
                        statusFilter ===
                        "ALL" ||
                        order.status ===
                        statusFilter
                    ).length
                  }{" "}
                  <small>
                    Pesanan
                  </small>
                </strong>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter
                    )
                  }
                >
                  <option value="ALL">
                    Semua
                  </option>

                  <option value="WAITING_CONFIRMATION">
                    Pesanan Baru
                  </option>

                  <option value="CONFIRMED">
                    Dikonfirmasi
                  </option>

                  <option value="PREPARING">
                    Sedang Disiapkan
                  </option>

                  <option value="READY">
                    Siap Diantar
                  </option>

                  <option value="ON_DELIVERY">
                    Sedang Diantar
                  </option>

                  <option value="COMPLETED">
                    Selesai
                  </option>

                  <option value="CANCELLED">
                    Dibatalkan
                  </option>
                </select>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon money">
                <Package size={25} />
              </div>

              <div className="summary-content">
                <span>
                  Pendapatan Dibayar
                </span>

                <strong>
                  Rp{" "}
                  {formatCurrency(
                    totalRevenue
                  )}
                </strong>

                <select
                  value={revenueFilter}
                  onChange={(event) =>
                    setRevenueFilter(
                      event.target
                        .value as DateFilter
                    )
                  }
                >
                  <option value="all">
                    Semua Pendapatan
                  </option>

                  <option value="today">
                    Hari Ini
                  </option>

                  <option value="month">
                    Bulan Ini
                  </option>
                </select>
              </div>
            </div>

          </section>

          {/* WAITING */}

          {waitingOrders.length >
            0 && (
              <div className="waiting-banner">
                <div className="waiting-banner-dot" />

                <div>
                  <strong>
                    {waitingOrders.length}{" "}
                    pesanan baru
                  </strong>

                  <span>
                    Sudah dibayar customer dan
                    siap diproses.
                  </span>
                </div>

                <ChevronRight size={18} />
              </div>
            )}

          {/* ORDERS */}

          <section className="orders-card">
            <div className="card-header">
              <div>
                <h3>
                  Daftar Pesanan
                </h3>

                <span className="live-indicator">
                  <span className="live-dot" />
                  Live Update
                </span>
              </div>

              <div className="refresh-info">
                <Volume2 size={15} />

                Update setiap 5 detik
              </div>
            </div>

            {loading ? (
              <div className="empty-orders">
                <div className="empty-icon">
                  <Loader2
                    size={36}
                    className="loading-icon"
                  />
                </div>

                <h2>
                  Memuat pesanan...
                </h2>

                <p>
                  Mengambil pesanan dari
                  server WartegKita.
                </p>
              </div>
            ) : filteredOrders.length ===
              0 ? (
              <div className="empty-orders">
                <div className="empty-icon">
                  <ShoppingBag
                    size={36}
                  />
                </div>

                <h2>
                  Tidak ada pesanan
                </h2>

                <p>
                  Belum ada pesanan yang
                  sesuai dengan filter.
                </p>
              </div>
            ) : (
              <div className="orders-table-container">
                <div className="table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Menu</th>
                        <th>Total</th>
                        <th>Pembayaran</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map(
                        (order) => {
                          const isUpdating =
                            updatingOrderId ===
                            order.id;

                          return (
                            <tr
                              key={order.id}
                              className={
                                order.status ===
                                  "WAITING_CONFIRMATION"
                                  ? "new-order-row"
                                  : ""
                              }
                            >

                              {/* ORDER */}

                              <td>
                                <div className="order-number-cell">
                                  <strong>
                                    {
                                      order.order_number
                                    }
                                  </strong>

                                  <small>
                                    {new Date(
                                      order.created_at
                                    ).toLocaleString(
                                      "id-ID",
                                      {
                                        dateStyle:
                                          "medium",
                                        timeStyle:
                                          "short",
                                      }
                                    )}
                                  </small>
                                </div>
                              </td>

                              {/* CUSTOMER */}

                              <td>
                                <div className="customer">
                                  <div className="customer-icon">
                                    <User
                                      size={16}
                                    />
                                  </div>

                                  <div>
                                    <span>
                                      {
                                        order.user
                                          ?.name ??
                                        "Customer"
                                      }
                                    </span>

                                    {order.user
                                      ?.email && (
                                        <small>
                                          {
                                            order
                                              .user
                                              .email
                                          }
                                        </small>
                                      )}
                                  </div>
                                </div>
                              </td>

                              {/* MENU */}

                              <td>
                                <div className="order-items">
                                  {order.items
                                    .length >
                                    0 ? (
                                    order.items.map(
                                      (
                                        item
                                      ) => (
                                        <div
                                          key={
                                            item.id
                                          }
                                          className="order-item"
                                        >
                                          <div className="order-item-info">
                                            <strong>
                                              {
                                                item.quantity
                                              }
                                              x{" "}
                                              {
                                                item.menu_name
                                              }
                                            </strong>

                                            <span>
                                              Rp{" "}
                                              {formatCurrency(
                                                item.price
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <span className="no-item">
                                      Detail menu
                                      belum
                                      tersedia
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* TOTAL */}

                              <td>
                                <strong className="table-total">
                                  Rp{" "}
                                  {formatCurrency(
                                    order.total_amount
                                  )}
                                </strong>
                              </td>

                              {/* PAYMENT */}

                              <td>
                                <div className="payment-cell">
                                  <span
                                    className={`payment-badge ${order.payment_status ===
                                        "PAID"
                                        ? "paid"
                                        : order.payment_status ===
                                          "FAILED"
                                          ? "failed"
                                          : "pending"
                                      }`}
                                  >
                                    {order.payment_status ===
                                      "PAID"
                                      ? "✓ Dibayar"
                                      : order.payment_status ===
                                        "PENDING"
                                        ? "Menunggu"
                                        : "Gagal"}
                                  </span>

                                  <small>
                                    {getPaymentLabel(
                                      order.payment_method
                                    )}
                                  </small>
                                </div>
                              </td>

                              {/* STATUS */}

                              <td>
                                <span
                                  className={`status-badge ${getStatusClass(
                                    order.status
                                  )}`}
                                >
                                  {getStatusLabel(
                                    order.status
                                  )}
                                </span>
                              </td>

                              {/* ACTION */}

                              <td>
                                {isUpdating ? (
                                  <div className="processing-action">
                                    <Loader2
                                      size={15}
                                      className="loading-icon"
                                    />

                                    Memproses...
                                  </div>
                                ) : (
                                  <div className="action-cell">

                                    {/* WAITING */}

                                    {order.status ===
                                      "WAITING_CONFIRMATION" && (
                                        <button
                                          type="button"
                                          className="process-btn"
                                          onClick={() =>
                                            handleNextStatus(
                                              order
                                            )
                                          }
                                        >
                                          <Package
                                            size={16}
                                          />

                                          Proses Pesanan
                                        </button>
                                      )}

                                    {/* CONFIRMED */}

                                    {order.status ===
                                      "CONFIRMED" && (
                                        <button
                                          type="button"
                                          className="process-btn"
                                          onClick={() =>
                                            handleNextStatus(
                                              order
                                            )
                                          }
                                        >
                                          <Package
                                            size={16}
                                          />

                                          Mulai Siapkan
                                        </button>
                                      )}

                                    {/* PREPARING */}

                                    {order.status ===
                                      "PREPARING" && (
                                        <button
                                          type="button"
                                          className="ready-delivery-btn"
                                          onClick={() =>
                                            handleNextStatus(
                                              order
                                            )
                                          }
                                        >
                                          <Truck
                                            size={16}
                                          />

                                          Siap Diantar
                                        </button>
                                      )}

                                    {/* READY */}

                                    {order.status ===
                                      "READY" && (
                                        <button
                                          type="button"
                                          className="delivery-btn"
                                          onClick={() =>
                                            handleNextStatus(
                                              order
                                            )
                                          }
                                        >
                                          <Truck
                                            size={16}
                                          />

                                          Driver Mengantar
                                        </button>
                                      )}

                                    {/* ON DELIVERY */}

                                    {order.status ===
                                      "ON_DELIVERY" && (
                                        <button
                                          type="button"
                                          className="complete-btn"
                                          onClick={() =>
                                            handleNextStatus(
                                              order
                                            )
                                          }
                                        >
                                          <CheckCircle
                                            size={16}
                                          />

                                          Tandai Selesai
                                        </button>
                                      )}

                                    {/* COMPLETED */}

                                    {order.status ===
                                      "COMPLETED" && (
                                        <span className="done-text">
                                          <CircleCheck
                                            size={16}
                                          />

                                          Pesanan Selesai
                                        </span>
                                      )}

                                    {/* CANCELLED */}

                                    {order.status ===
                                      "CANCELLED" && (
                                        <span className="reject-text">
                                          Pesanan
                                          Dibatalkan
                                        </span>
                                      )}

                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =====================================================
          DELIVERY CONFIRMATION POPUP
      ===================================================== */}

      {deliveryOrder && (
        <div
          className="delivery-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseDeliveryModal();
            }
          }}
        >
          <div
            className="delivery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-modal-title"
          >
            <button
              type="button"
              className="delivery-modal-close"
              onClick={
                handleCloseDeliveryModal
              }
              disabled={
                Boolean(
                  updatingOrderId
                )
              }
              aria-label="Tutup"
            >
              <X size={19} />
            </button>

            <div className="delivery-modal-icon">
              <Truck size={34} />
            </div>

            <div className="delivery-modal-content">
              <span className="delivery-modal-kicker">
                PESANAN SIAP
              </span>

              <h2 id="delivery-modal-title">
                Pesanan sudah siap diantar?
              </h2>

              <p>
                Pastikan semua menu sudah
                lengkap sebelum pesanan
                diserahkan kepada driver.
              </p>
            </div>

            <div className="delivery-order-preview">
              <div>
                <span>
                  Nomor Pesanan
                </span>

                <strong>
                  {
                    deliveryOrder.order_number
                  }
                </strong>
              </div>

              <div>
                <span>
                  Customer
                </span>

                <strong>
                  {
                    deliveryOrder.user
                      ?.name ??
                    "Customer"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Total
                </span>

                <strong>
                  Rp{" "}
                  {formatCurrency(
                    deliveryOrder.total_amount
                  )}
                </strong>
              </div>
            </div>

            <div className="delivery-modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={
                  handleCloseDeliveryModal
                }
                disabled={
                  Boolean(
                    updatingOrderId
                  )
                }
              >
                Belum
              </button>

              <button
                type="button"
                className="modal-confirm-btn"
                onClick={
                  handleConfirmReady
                }
                disabled={
                  Boolean(
                    updatingOrderId
                  )
                }
              >
                {updatingOrderId ===
                  deliveryOrder.id ? (
                  <>
                    <Loader2
                      size={17}
                      className="loading-icon"
                    />

                    Memproses...
                  </>
                ) : (
                  <>
                    <Truck size={17} />

                    Ya, Siap Diantar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}