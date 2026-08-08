import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Utensils,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
  BellRing,
  X,
} from "lucide-react";

import api from "../../services/api";
import { Order } from "../../types";

import "../../styles/orders.css";

/*
 * =====================================================
 * NOTIFICATION TYPE
 * =====================================================
 */

type NotificationType =
  | "payment_success"
  | "payment_failed"
  | "confirmed"
  | "processing"
  | "preparing"
  | "ready"
  | "delivery"
  | "completed"
  | "cancelled"
  | "default";

/*
 * =====================================================
 * ORDER FILTER
 * =====================================================
 */

type OrderFilter =
  | "all"
  | "today"
  | "7days"
  | "1month";

/*
 * =====================================================
 * ORDER NOTIFICATION
 * =====================================================
 */

interface OrderNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

/*
 * =====================================================
 * PREVIOUS ORDER STATE
 *
 * Kita tidak hanya menyimpan status order.
 *
 * Karena pembayaran mengubah:
 *
 * payment_status = PAID
 *
 * sedangkan:
 *
 * status = WAITING_CONFIRMATION
 *
 * =====================================================
 */

interface PreviousOrderState {
  status: string;
  paymentStatus: string;
}

/*
 * =====================================================
 * COMPONENT
 * =====================================================
 */

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =====================================================
   * ORDER FILTER
   * =====================================================
   */

  const [orderFilter, setOrderFilter] =
    useState<OrderFilter>("all");

  /*
   * =====================================================
   * LIVE NOTIFICATION
   * =====================================================
   */

  const [notification, setNotification] =
    useState<OrderNotification | null>(null);

  /*
   * =====================================================
   * TRACK PREVIOUS ORDER STATE
   *
   * Menyimpan:
   *
   * order_id
   * ├── status
   * └── paymentStatus
   *
   * Contoh:
   *
   * {
   *   "uuid": {
   *      status: "waiting_confirmation",
   *      paymentStatus: "paid"
   *   }
   * }
   *
   * =====================================================
   */

  const previousStatusesRef = useRef<
    Record<string, PreviousOrderState>
  >({});

  /*
   * =====================================================
   * FIRST LOAD
   *
   * Jangan tampilkan notifikasi ketika pertama kali
   * halaman dibuka.
   * =====================================================
   */

  const isFirstLoadRef = useRef(true);

  /*
   * =====================================================
   * NOTIFICATION TIMER
   * =====================================================
   */

  const notificationTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /*
   * =====================================================
   * NORMALIZE ORDERS
   * =====================================================
   */

  const normalizeOrders = (
    responseData: any
  ): Order[] => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.orders)) {
      return responseData.orders;
    }

    if (
      Array.isArray(
        responseData?.data?.orders
      )
    ) {
      return responseData.data.orders;
    }

    return [];
  };

  /*
   * =====================================================
   * NORMALIZE STATUS
   * =====================================================
   */

  const normalizeStatus = (
    status: any
  ): string => {
    return String(
      status || "pending"
    )
      .toLowerCase()
      .trim();
  };

  /*
   * =====================================================
   * GET ORDER DATE
   * =====================================================
   */

  const getOrderDate = (
    order: any
  ): Date | null => {
    const rawDate =
      order?.created_at ??
      order?.createdAt ??
      order?.order_date ??
      order?.orderDate ??
      order?.order_datetime ??
      order?.orderDateTime ??
      order?.date ??
      order?.created ??
      null;

    if (!rawDate) {
      return null;
    }

    const date =
      rawDate instanceof Date
        ? rawDate
        : new Date(rawDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return date;
  };

  /*
   * =====================================================
   * CHECK SAME LOCAL DAY
   * =====================================================
   */

  const isSameLocalDay = (
    dateA: Date,
    dateB: Date
  ): boolean => {
    return (
      dateA.getFullYear() ===
      dateB.getFullYear() &&
      dateA.getMonth() ===
      dateB.getMonth() &&
      dateA.getDate() ===
      dateB.getDate()
    );
  };

  /*
   * =====================================================
   * FILTER ORDERS
   * =====================================================
   */

  const filterOrders = (
    ordersData: Order[]
  ): Order[] => {
    if (orderFilter === "all") {
      return ordersData;
    }

    const now = new Date();

    /*
     * ---------------------------------------------------
     * HARI INI
     * ---------------------------------------------------
     */

    if (
      orderFilter === "today"
    ) {
      return ordersData.filter(
        (order: any) => {
          const orderDate =
            getOrderDate(order);

          if (!orderDate) {
            return false;
          }

          return isSameLocalDay(
            orderDate,
            now
          );
        }
      );
    }

    /*
     * ---------------------------------------------------
     * 7 HARI TERAKHIR
     * ---------------------------------------------------
     */

    if (
      orderFilter === "7days"
    ) {
      const sevenDaysAgo =
        new Date(now);

      sevenDaysAgo.setDate(
        now.getDate() - 7
      );

      sevenDaysAgo.setHours(
        0,
        0,
        0,
        0
      );

      return ordersData.filter(
        (order: any) => {
          const orderDate =
            getOrderDate(order);

          if (!orderDate) {
            return false;
          }

          return (
            orderDate >=
            sevenDaysAgo &&
            orderDate <= now
          );
        }
      );
    }

    /*
     * ---------------------------------------------------
     * 1 BULAN TERAKHIR
     * ---------------------------------------------------
     */

    if (
      orderFilter === "1month"
    ) {
      const oneMonthAgo =
        new Date(now);

      oneMonthAgo.setMonth(
        now.getMonth() - 1
      );

      oneMonthAgo.setHours(
        0,
        0,
        0,
        0
      );

      return ordersData.filter(
        (order: any) => {
          const orderDate =
            getOrderDate(order);

          if (!orderDate) {
            return false;
          }

          return (
            orderDate >=
            oneMonthAgo &&
            orderDate <= now
          );
        }
      );
    }

    return ordersData;
  };

  /*
   * =====================================================
   * STATUS LABEL
   *
   * IMPORTANT:
   *
   * PAID != COMPLETED
   *
   * PAID berarti pembayaran berhasil.
   *
   * WAITING_CONFIRMATION berarti seller belum
   * mengonfirmasi pesanan.
   * =====================================================
   */

  const getStatusLabel = (
    status: string,
    paymentStatus?: string
  ) => {
    const normalizedStatus =
      normalizeStatus(status);

    const normalizedPaymentStatus =
      normalizeStatus(paymentStatus);

    /*
     * ---------------------------------------------------
     * PAYMENT SUDAH PAID
     * ---------------------------------------------------
     *
     * Kalau order masih menunggu konfirmasi,
     * tampilkan "Menunggu Konfirmasi".
     */

    if (
      normalizedPaymentStatus === "paid" ||
      normalizedPaymentStatus === "success"
    ) {
      if (
        normalizedStatus ===
        "waiting_confirmation"
      ) {
        return "Menunggu Konfirmasi";
      }
    }

    /*
     * ---------------------------------------------------
     * ORDER STATUS
     * ---------------------------------------------------
     */

    switch (
    normalizedStatus
    ) {
      case "pending":
      case "waiting_payment":
        return "Menunggu Pembayaran";

      case "waiting_confirmation":
        return "Menunggu Konfirmasi";

      case "confirmed":
        return "Pesanan Dikonfirmasi";

      case "processing":
        return "Pesanan Diproses";

      case "preparing":
        return "Sedang Disiapkan";

      case "ready":
        return "Siap Diambil";

      case "on_delivery":
      case "delivery":
        return "Sedang Diantar";

      case "completed":
      case "complete":
      case "success":
        return "Pesanan Selesai";

      case "cancelled":
      case "canceled":
        return "Pesanan Dibatalkan";

      case "rejected":
        return "Pesanan Ditolak";

      default:
        return status || "Menunggu";
    }
  };

  /*
   * =====================================================
   * NOTIFICATION DATA
   * =====================================================
   */

  const getNotificationData = (
    status: string
  ): {
    type: NotificationType;
    title: string;
    message: string;
  } => {
    switch (
    normalizeStatus(status)
    ) {
      /*
       * -------------------------------------------------
       * PAYMENT SUCCESS
       * -------------------------------------------------
       */

      case "payment_success":
      case "paid":
        return {
          type: "payment_success",
          title:
            "Pembayaran Berhasil! 💳",
          message:
            "Pembayaran pesanan kamu berhasil. Pesanan sekarang sedang menunggu konfirmasi dari warteg.",
        };

      /*
       * -------------------------------------------------
       * PAYMENT FAILED
       * -------------------------------------------------
       */

      case "payment_failed":
      case "failed":
        return {
          type: "payment_failed",
          title:
            "Pembayaran Gagal",
          message:
            "Pembayaran pesanan kamu gagal. Silakan coba kembali.",
        };

      /*
       * -------------------------------------------------
       * WAITING CONFIRMATION
       * -------------------------------------------------
       */

      case "waiting_confirmation":
        return {
          type: "default",
          title:
            "Menunggu Konfirmasi ⏳",
          message:
            "Pembayaran berhasil. Pesanan kamu sedang menunggu konfirmasi dari warteg.",
        };

      /*
       * -------------------------------------------------
       * CONFIRMED
       * -------------------------------------------------
       */

      case "confirmed":
        return {
          type: "confirmed",
          title:
            "Pesanan Dikonfirmasi! 🎉",
          message:
            "Warteg sudah menerima dan mengonfirmasi pesanan kamu.",
        };

      /*
       * -------------------------------------------------
       * PROCESSING
       * -------------------------------------------------
       */

      case "processing":
        return {
          type: "processing",
          title:
            "Pesanan Sedang Diproses 👨‍🍳",
          message:
            "Pesanan kamu sedang mulai diproses oleh warteg.",
        };

      /*
       * -------------------------------------------------
       * PREPARING
       * -------------------------------------------------
       */

      case "preparing":
        return {
          type: "preparing",
          title:
            "Makanan Sedang Disiapkan 🍳",
          message:
            "Pesanan kamu sedang dimasak. Sebentar lagi siap!",
        };

      /*
       * -------------------------------------------------
       * READY
       * -------------------------------------------------
       */

      case "ready":
        return {
          type: "ready",
          title:
            "Pesanan Sudah Siap! 📦",
          message:
            "Pesanan kamu sudah siap untuk diambil.",
        };

      /*
       * -------------------------------------------------
       * DELIVERY
       * -------------------------------------------------
       */

      case "on_delivery":
      case "delivery":
        return {
          type: "delivery",
          title:
            "Pesanan Sedang Diantar 🛵",
          message:
            "Pesanan kamu sedang dalam perjalanan.",
        };

      /*
       * -------------------------------------------------
       * COMPLETED
       * -------------------------------------------------
       */

      case "completed":
      case "complete":
      case "success":
        return {
          type: "completed",
          title:
            "Pesanan Selesai! 🎉",
          message:
            "Pesanan kamu telah selesai. Selamat menikmati makanan!",
        };

      /*
       * -------------------------------------------------
       * CANCELLED
       * -------------------------------------------------
       */

      case "cancelled":
      case "canceled":
        return {
          type: "cancelled",
          title:
            "Pesanan Dibatalkan",
          message:
            "Pesanan kamu telah dibatalkan.",
        };

      /*
       * -------------------------------------------------
       * REJECTED
       * -------------------------------------------------
       */

      case "rejected":
        return {
          type: "cancelled",
          title:
            "Pesanan Ditolak",
          message:
            "Pesanan kamu ditolak oleh warteg.",
        };

      /*
       * -------------------------------------------------
       * DEFAULT
       * -------------------------------------------------
       */

      default:
        return {
          type: "default",
          title:
            "Status Pesanan Berubah",
          message:
            `Status pesanan sekarang: ${getStatusLabel(
              status
            )}`,
        };
    }
  };

  /*
   * =====================================================
   * CLOSE NOTIFICATION
   * =====================================================
   */

  const closeNotification =
    useCallback(() => {
      if (
        notificationTimerRef.current
      ) {
        clearTimeout(
          notificationTimerRef.current
        );

        notificationTimerRef.current =
          null;
      }

      setNotification(null);
    }, []);

  /*
   * =====================================================
   * SHOW NOTIFICATION
   * =====================================================
   */

  const showNotification =
    useCallback(
      (
        orderId: string,
        status: string
      ) => {
        const data =
          getNotificationData(
            status
          );

        const id =
          `${orderId}-${status}-${Date.now()}`;

        setNotification({
          id,
          type: data.type,
          title: data.title,
          message: data.message,
          orderId,
        });

        /*
         * Bersihkan timer sebelumnya
         */

        if (
          notificationTimerRef.current
        ) {
          clearTimeout(
            notificationTimerRef.current
          );
        }

        /*
         * Auto hide 6 detik
         */

        notificationTimerRef.current =
          setTimeout(() => {
            setNotification(null);

            notificationTimerRef.current =
              null;
          }, 6000);
      },
      []
    );

  /*
   * =====================================================
   * DETECT STATUS / PAYMENT CHANGES
   *
   * Yang diperiksa:
   *
   * 1. payment_status
   * 2. status
   *
   * =====================================================
   */

  const detectStatusChanges = (
    newOrders: Order[]
  ) => {
    const currentStatuses: Record<
      string,
      PreviousOrderState
    > = {};

    newOrders.forEach(
      (order: any) => {
        /*
         * -------------------------------------------------
         * ORDER ID
         * -------------------------------------------------
         */

        const orderId =
          String(
            order?.id ||
            order?.order_number ||
            order?.orderNumber ||
            ""
          );

        if (!orderId) {
          return;
        }

        /*
         * -------------------------------------------------
         * CURRENT ORDER STATUS
         * -------------------------------------------------
         */

        const currentStatus =
          normalizeStatus(
            order?.status
          );

        /*
         * -------------------------------------------------
         * CURRENT PAYMENT STATUS
         *
         * Support:
         *
         * payment_status
         * paymentStatus
         * -------------------------------------------------
         */

        const currentPaymentStatus =
          normalizeStatus(
            order?.payment_status ??
            order?.paymentStatus
          );

        /*
         * Simpan state sekarang.
         */

        currentStatuses[
          orderId
        ] = {
          status:
            currentStatus,
          paymentStatus:
            currentPaymentStatus,
        };

        /*
         * -------------------------------------------------
         * FIRST LOAD
         * -------------------------------------------------
         */

        if (
          isFirstLoadRef.current
        ) {
          return;
        }

        /*
         * -------------------------------------------------
         * PREVIOUS STATE
         * -------------------------------------------------
         */

        const previous =
          previousStatusesRef.current[
          orderId
          ];

        /*
         * Kalau order baru muncul,
         * jangan langsung dianggap perubahan.
         */

        if (!previous) {
          return;
        }

        /*
         * =================================================
         * PAYMENT STATUS CHANGED
         * =================================================
         */

        if (
          previous.paymentStatus !==
          currentPaymentStatus
        ) {
          /*
           * ------------------------------------------------
           * PAYMENT SUCCESS
           * ------------------------------------------------
           */

          if (
            currentPaymentStatus ===
            "paid" ||
            currentPaymentStatus ===
            "success"
          ) {
            showNotification(
              orderId,
              "payment_success"
            );

            return;
          }

          /*
           * ------------------------------------------------
           * PAYMENT FAILED
           * ------------------------------------------------
           */

          if (
            currentPaymentStatus ===
            "failed"
          ) {
            showNotification(
              orderId,
              "payment_failed"
            );

            return;
          }
        }

        /*
         * =================================================
         * ORDER STATUS CHANGED
         * =================================================
         */

        if (
          previous.status !==
          currentStatus
        ) {
          showNotification(
            orderId,
            currentStatus
          );
        }
      }
    );

    /*
     * Update previous state
     */

    previousStatusesRef.current =
      currentStatuses;

    /*
     * First load selesai.
     */

    isFirstLoadRef.current =
      false;
  };

  /*
   * =====================================================
   * FETCH ORDERS
   * =====================================================
   */

  const fetchOrders =
    useCallback(
      async (
        options?: {
          silent?: boolean;
        }
      ) => {
        try {
          /*
           * Loading hanya pada request biasa.
           *
           * Polling silent tidak membuat skeleton
           * muncul setiap 3 detik.
           */

          if (!options?.silent) {
            setLoading(true);
          }

          setError("");

          /*
           * GET CUSTOMER ORDERS
           *
           * Backend:
           *
           * GET /api/v1/orders
           *
           * User ID diambil dari JWT.
           */

          const response =
            await api.get(
              "/orders"
            );

          /*
           * Normalize response
           */

          const normalizedOrders =
            normalizeOrders(
              response.data
            );

          /*
           * Deteksi perubahan status/payment
           */

          detectStatusChanges(
            normalizedOrders
          );

          /*
           * Update orders
           */

          setOrders(
            normalizedOrders
          );
        } catch (err: any) {
          console.error(
            "Gagal mengambil orders:",
            err
          );

          console.error(
            "Response error:",
            err?.response?.data
          );

          /*
           * =================================================
           * POLLING SILENT ERROR
           *
           * Jangan hapus data lama.
           * =================================================
           */

          if (
            !options?.silent
          ) {
            /*
             * Unauthorized
             */

            if (
              err?.response
                ?.status === 401
            ) {
              setError(
                "Sesi login kamu sudah berakhir. Silakan login kembali."
              );
            } else {
              setError(
                err?.response
                  ?.data?.message ||
                err?.response
                  ?.data?.error ||
                "Gagal mengambil data pesanan"
              );
            }

            /*
             * Hanya request pertama yang
             * mengosongkan data jika gagal.
             */

            setOrders([]);
          }
        } finally {
          if (
            !options?.silent
          ) {
            setLoading(false);
          }
        }
      },
      [showNotification]
    );

  /*
   * =====================================================
   * INITIAL LOAD
   * =====================================================
   */

  useEffect(() => {
    fetchOrders();

    return () => {
      if (
        notificationTimerRef.current
      ) {
        clearTimeout(
          notificationTimerRef.current
        );
      }
    };
  }, [fetchOrders]);

  /*
   * =====================================================
   * LIVE ORDER POLLING
   *
   * Setiap 3 detik:
   *
   * GET /orders
   *
   * =====================================================
   */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        fetchOrders({
          silent: true,
        });
      }, 3000);

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [fetchOrders]);

  /*
   * =====================================================
   * FILTERED ORDERS
   * =====================================================
   */

  const filteredOrders =
    filterOrders(orders);

  /*
   * =====================================================
   * FORMAT PRICE
   * =====================================================
   */

  const formatPrice = (
    value: number
  ) => {
    return Number(
      value || 0
    ).toLocaleString(
      "id-ID"
    );
  };

  /*
   * =====================================================
   * GET ITEMS
   * =====================================================
   */

  const getOrderItems = (
    order: any
  ): any[] => {
    const items =
      order?.items ??
      order?.order_items ??
      order?.orderItems ??
      order?.details ??
      [];

    return Array.isArray(items)
      ? items
      : [];
  };

  /*
   * =====================================================
   * GET TOTAL
   * =====================================================
   */

  const getOrderTotal = (
    order: any
  ): number => {
    /*
     * Ambil total dari backend.
     */

    const backendTotal =
      Number(
        order?.total_amount ??
        order?.totalAmount ??
        order?.total ??
        order?.grand_total ??
        order?.grandTotal ??
        0
      );

    /*
     * Kalau backend memberikan total
     * valid, gunakan itu.
     */

    if (backendTotal > 0) {
      return backendTotal;
    }

    /*
     * Fallback hitung dari items.
     */

    const items =
      getOrderItems(order);

    if (!items.length) {
      return 0;
    }

    return items.reduce(
      (
        total: number,
        item: any
      ) => {
        const price =
          Number(
            item?.price ??
            item?.unit_price ??
            item?.unitPrice ??
            item?.menu_price ??
            item?.menuPrice ??
            item?.menu?.price ??
            item?.menu?.unit_price ??
            0
          );

        const quantity =
          Number(
            item?.quantity ??
            item?.qty ??
            item?.amount ??
            1
          );

        return (
          total +
          price * quantity
        );
      },
      0
    );
  };

  /*
   * =====================================================
   * STATUS ICON
   *
   * PAID tidak dianggap completed.
   * =====================================================
   */

  const getStatusIcon = (
    status: string
  ) => {
    switch (
    normalizeStatus(status)
    ) {
      /*
       * COMPLETED
       */

      case "completed":
      case "complete":
        return (
          <CheckCircle2
            size={16}
          />
        );

      /*
       * CANCELLED / REJECTED
       */

      case "cancelled":
      case "canceled":
      case "rejected":
        return (
          <XCircle
            size={16}
          />
        );

      /*
       * DEFAULT
       */

      default:
        return (
          <Clock3
            size={16}
          />
        );
    }
  };

  /*
   * =====================================================
   * ORDER NUMBER
   * =====================================================
   */

  const getOrderNumber = (
    order: any
  ) => {
    return (
      order?.order_number ||
      order?.orderNumber ||
      `Order #${order?.id || "-"}`
    );
  };

  /*
   * =====================================================
   * ITEM NAME
   * =====================================================
   */

  const getItemName = (
    item: any
  ) => {
    return (
      item?.menu_name ||
      item?.menuName ||
      item?.menu?.name ||
      item?.menu?.menu_name ||
      item?.menu?.menuName ||
      item?.name ||
      "Menu"
    );
  };

  /*
   * =====================================================
   * ITEM PRICE
   * =====================================================
   */

  const getItemPrice = (
    item: any
  ) => {
    return Number(
      item?.price ??
      item?.unit_price ??
      item?.unitPrice ??
      item?.menu_price ??
      item?.menuPrice ??
      item?.menu?.price ??
      item?.menu?.unit_price ??
      0
    );
  };

  /*
   * =====================================================
   * ITEM QUANTITY
   * =====================================================
   */

  const getItemQuantity = (
    item: any
  ) => {
    return Number(
      item?.quantity ??
      item?.qty ??
      item?.amount ??
      1
    );
  };

  /*
   * =====================================================
   * FILTER LABEL
   * =====================================================
   */

  const getFilterLabel = () => {
    switch (
    orderFilter
    ) {
      case "today":
        return "hari ini";

      case "7days":
        return "7 hari terakhir";

      case "1month":
        return "1 bulan terakhir";

      default:
        return "periode ini";
    }
  };

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="orders-page">

        <div className="orders-title">

          <div>
            <h1>
              Pesanan Saya
            </h1>

            <p>
              Pantau semua pesanan
              makanan kamu
            </p>
          </div>

          <div className="orders-title-icon">
            <Utensils
              size={32}
            />
          </div>

        </div>

        <div className="orders-list">

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="order-skeleton"
              />
            )
          )}

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * ERROR
   * =====================================================
   */

  if (error) {
    return (
      <div className="orders-page">

        <div className="orders-title">

          <div>
            <h1>
              Pesanan Saya
            </h1>

            <p>
              Pantau semua pesanan
              makanan kamu
            </p>
          </div>

          <div className="orders-title-icon">
            <Utensils
              size={32}
            />
          </div>

        </div>

        <div className="error-box">

          <div>
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              fetchOrders()
            }
            className="retry-orders"
          >
            <RefreshCw
              size={16}
            />

            Coba Lagi
          </button>

        </div>

      </div>
    );
  }

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <div className="orders-page">

      {/* =================================================
          LIVE NOTIFICATION
      ================================================= */}

      {notification && (
        <div
          key={
            notification.id
          }
          className={`order-live-notification notification-${notification.type}`}
        >

          {/* =================================================
              MASCOT
          ================================================= */}

          <div className="notification-mascot">

            <div className="mascot-face">

              <div className="mascot-eyes">
                <span />
                <span />
              </div>

              <div className="mascot-mouth">
                ✦
              </div>

            </div>

            <div className="mascot-sparkle sparkle-one">
              ✦
            </div>

            <div className="mascot-sparkle sparkle-two">
              •
            </div>

          </div>

          {/* =================================================
              CONTENT
          ================================================= */}

          <div className="notification-content">

            <div className="notification-topline">

              <span>

                <BellRing
                  size={14}
                />

                WARTEGKITA

              </span>

              <button
                type="button"
                onClick={
                  closeNotification
                }
                aria-label="Tutup notifikasi"
              >
                <X
                  size={17}
                />
              </button>

            </div>

            <strong>
              {
                notification.title
              }
            </strong>

            <p>
              {
                notification.message
              }
            </p>

            {notification.orderId && (
              <Link
                to={`/orders/${notification.orderId}`}
                onClick={
                  closeNotification
                }
              >
                Lihat Pesanan

                <ArrowRight
                  size={14}
                />
              </Link>
            )}

          </div>

        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="orders-title">

        <div>

          <div className="orders-heading-row">

            <h1>
              Pesanan Saya
            </h1>

            <span className="live-order-indicator">
              <span />
              LIVE
            </span>

          </div>

          <p>
            Pantau semua pesanan
            makanan kamu
          </p>

        </div>

        <div className="orders-title-icon">

          <Utensils
            size={34}
          />

        </div>

      </div>

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="orders-filter">

        <button
          type="button"
          className={
            orderFilter ===
              "all"
              ? "active"
              : ""
          }
          onClick={() =>
            setOrderFilter(
              "all"
            )
          }
        >
          Semua
        </button>

        <button
          type="button"
          className={
            orderFilter ===
              "today"
              ? "active"
              : ""
          }
          onClick={() =>
            setOrderFilter(
              "today"
            )
          }
        >
          Hari Ini
        </button>

        <button
          type="button"
          className={
            orderFilter ===
              "7days"
              ? "active"
              : ""
          }
          onClick={() =>
            setOrderFilter(
              "7days"
            )
          }
        >
          7 Hari
        </button>

        <button
          type="button"
          className={
            orderFilter ===
              "1month"
              ? "active"
              : ""
          }
          onClick={() =>
            setOrderFilter(
              "1month"
            )
          }
        >
          1 Bulan
        </button>

      </div>

      {/* =================================================
          ORDER COUNT
      ================================================= */}

      {orders.length > 0 && (
        <div className="orders-filter-info">

          <span>
            Menampilkan{" "}
            <strong>
              {
                filteredOrders.length
              }
            </strong>{" "}
            pesanan
          </span>

          {orderFilter !==
            "all" && (
              <button
                type="button"
                onClick={() =>
                  setOrderFilter(
                    "all"
                  )
                }
              >
                Tampilkan Semua
              </button>
            )}

        </div>
      )}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {filteredOrders.length ===
        0 ? (

        <div className="empty-orders">

          <div className="empty-icon">

            <Utensils
              size={40}
            />

          </div>

          <h2>

            {orders.length ===
              0
              ? "Belum Ada Pesanan"
              : "Tidak Ada Pesanan"}

          </h2>

          <p>

            {orders.length ===
              0
              ? "Kamu belum memiliki riwayat pesanan. Yuk jelajahi berbagai warteg favoritmu dan mulai pesan sekarang."
              : `Tidak ada pesanan pada ${getFilterLabel()}.`}

          </p>

          {orders.length ===
            0 && (
              <div>

                <Link
                  to="/explore"
                  className="start-order"
                >
                  Mulai Pesan
                </Link>

              </div>
            )}

        </div>

      ) : (

        /* =================================================
           ORDER LIST
        ================================================= */

        <div className="orders-list">

          {filteredOrders.map(
            (order: any) => {

              /*
               * -------------------------------------------------
               * ITEMS
               * -------------------------------------------------
               */

              const items =
                getOrderItems(
                  order
                );

              /*
               * -------------------------------------------------
               * TOTAL
               * -------------------------------------------------
               */

              const orderTotal =
                getOrderTotal(
                  order
                );

              /*
               * -------------------------------------------------
               * ORDER STATUS
               * -------------------------------------------------
               */

              const status =
                normalizeStatus(
                  order?.status
                );

              /*
               * -------------------------------------------------
               * PAYMENT STATUS
               * -------------------------------------------------
               */

              const paymentStatus =
                normalizeStatus(
                  order?.payment_status ??
                  order?.paymentStatus
                );

              return (

                <Link
                  key={
                    order?.id ||
                    order?.order_number ||
                    order?.orderNumber
                  }
                  to={`/orders/${order.id}`}
                  className="order-card"
                >

                  {/* =================================================
                     ORDER TOP
                  ================================================= */}

                  <div className="order-top">

                    <div className="order-left">

                      <div className="order-icon">

                        <Utensils
                          size={22}
                        />

                      </div>

                      <div className="order-info">

                        <h3>
                          {
                            getOrderNumber(
                              order
                            )
                          }
                        </h3>

                        <p>
                          Pesanan WartegKita
                        </p>

                      </div>

                    </div>

                    <div
                      className={`order-status status-${status}`}
                    >

                      {getStatusIcon(
                        status
                      )}

                      <span>

                        {getStatusLabel(
                          status,
                          paymentStatus
                        )}

                      </span>

                    </div>

                  </div>

                  {/* =================================================
                     DIVIDER
                  ================================================= */}

                  <div className="order-divider" />

                  {/* =================================================
                     ORDER ITEMS
                  ================================================= */}

                  {items.length >
                    0 && (

                      <div className="order-items">

                        {items.map(
                          (
                            item: any,
                            index: number
                          ) => {

                            const price =
                              getItemPrice(
                                item
                              );

                            const quantity =
                              getItemQuantity(
                                item
                              );

                            const itemTotal =
                              price *
                              quantity;

                            return (

                              <div
                                key={
                                  item?.id ??
                                  `${order?.id}-${index}`
                                }
                                className="order-item"
                              >

                                <div className="order-item-info">

                                  <strong>
                                    {
                                      getItemName(
                                        item
                                      )
                                    }
                                  </strong>

                                  <span>
                                    Jumlah:{" "}
                                    {
                                      quantity
                                    }
                                  </span>

                                </div>

                                <strong className="order-item-price">

                                  Rp{" "}
                                  {
                                    formatPrice(
                                      itemTotal
                                    )
                                  }

                                </strong>

                              </div>

                            );
                          }
                        )}

                      </div>

                    )}

                  {/* =================================================
                     DIVIDER
                  ================================================= */}

                  <div className="order-divider" />

                  {/* =================================================
                     ORDER BOTTOM
                  ================================================= */}

                  <div className="order-bottom">

                    <div className="order-price">

                      <span>
                        Total Pembayaran
                      </span>

                      <strong>

                        Rp{" "}
                        {
                          formatPrice(
                            orderTotal
                          )
                        }

                      </strong>

                    </div>

                    <ArrowRight
                      size={20}
                      className="order-arrow"
                    />

                  </div>

                </Link>

              );
            }
          )}

        </div>

      )}

    </div>
  );
}