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
  ChefHat,
  PackageCheck,
  Bike,
  BellRing,
  X,
  Sparkles,
} from "lucide-react";

import api from "../../services/api";
import { Order } from "../../types";

import "../../styles/orders.css";

type NotificationType =
  | "confirmed"
  | "processing"
  | "preparing"
  | "ready"
  | "delivery"
  | "completed"
  | "cancelled"
  | "default";

interface OrderNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notification, setNotification] =
    useState<OrderNotification | null>(null);

  /*
   * =====================================================
   * TRACK PREVIOUS ORDER STATUS
   * =====================================================
   *
   * Digunakan untuk mengetahui apakah seller baru saja
   * mengubah status order.
   */

  const previousStatusesRef = useRef<
    Record<string, string>
  >({});

  const isFirstLoadRef = useRef(true);

  const notificationTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

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
   * STATUS LABEL
   * =====================================================
   */

  const getStatusLabel = (
    status: string
  ) => {
    switch (normalizeStatus(status)) {
      case "pending":
      case "waiting_payment":
        return "Menunggu Pembayaran";

      case "waiting_confirmation":
        return "Menunggu Konfirmasi";

      case "paid":
        return "Sudah Dibayar";

      case "processing":
        return "Pesanan Diproses";

      case "preparing":
        return "Sedang Disiapkan";

      case "ready":
        return "Siap Diambil";

      case "on_delivery":
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
   * STATUS NOTIFICATION
   * =====================================================
   */

  const getNotificationData = (
    status: string
  ): {
    type: NotificationType;
    title: string;
    message: string;
  } => {
    switch (normalizeStatus(status)) {
      case "waiting_confirmation":
        return {
          type: "confirmed",
          title: "Pesanan Dikonfirmasi! 🎉",
          message:
            "Warteg sudah menerima dan mengonfirmasi pesanan kamu.",
        };

      case "processing":
        return {
          type: "processing",
          title: "Pesanan Sedang Diproses 👨‍🍳",
          message:
            "Pesanan kamu sedang mulai diproses oleh warteg.",
        };

      case "preparing":
        return {
          type: "preparing",
          title: "Makanan Sedang Disiapkan 🍳",
          message:
            "Pesanan kamu sedang dimasak. Sebentar lagi siap!",
        };

      case "ready":
        return {
          type: "ready",
          title: "Pesanan Sudah Siap! 📦",
          message:
            "Pesanan kamu sudah siap untuk diambil.",
        };

      case "on_delivery":
        return {
          type: "delivery",
          title: "Pesanan Sedang Diantar 🛵",
          message:
            "Pesanan kamu sedang dalam perjalanan.",
        };

      case "completed":
      case "complete":
      case "success":
        return {
          type: "completed",
          title: "Pesanan Selesai! 🎉",
          message:
            "Pesanan kamu telah selesai. Selamat menikmati makanan!",
        };

      case "cancelled":
      case "canceled":
        return {
          type: "cancelled",
          title: "Pesanan Dibatalkan",
          message:
            "Pesanan kamu telah dibatalkan.",
        };

      default:
        return {
          type: "default",
          title: "Status Pesanan Berubah",
          message:
            `Status pesanan sekarang: ${getStatusLabel(
              status
            )}`,
        };
    }
  };

  /*
   * =====================================================
   * SHOW NOTIFICATION
   * =====================================================
   */

  const showNotification = useCallback(
    (
      orderId: string,
      status: string
    ) => {
      const data =
        getNotificationData(status);

      const id =
        `${orderId}-${status}-${Date.now()}`;

      setNotification({
        id,
        type: data.type,
        title: data.title,
        message: data.message,
        orderId,
      });

      if (notificationTimerRef.current) {
        clearTimeout(
          notificationTimerRef.current
        );
      }

      notificationTimerRef.current =
        setTimeout(() => {
          setNotification(null);
        }, 6000);
    },
    []
  );

  /*
   * =====================================================
   * DETECT STATUS CHANGES
   * =====================================================
   */

  const detectStatusChanges = (
    newOrders: Order[]
  ) => {
    const currentStatuses: Record<
      string,
      string
    > = {};

    newOrders.forEach(
      (order: any) => {
        const orderId = String(
          order?.id ||
          order?.order_number ||
          ""
        );

        if (!orderId) {
          return;
        }

        const currentStatus =
          normalizeStatus(
            order?.status
          );

        currentStatuses[
          orderId
        ] = currentStatus;

        /*
         * Jangan tampilkan notifikasi ketika
         * pertama kali halaman dibuka.
         */
        if (
          isFirstLoadRef.current
        ) {
          return;
        }

        const previousStatus =
          previousStatusesRef.current[
          orderId
          ];

        if (
          previousStatus &&
          previousStatus !== currentStatus
        ) {
          showNotification(
            orderId,
            currentStatus
          );
        }
      }
    );

    previousStatusesRef.current =
      currentStatuses;

    isFirstLoadRef.current = false;
  };

  /*
   * =====================================================
   * FETCH ORDERS
   * =====================================================
   */

  const fetchOrders = useCallback(
    async (
      options?: {
        silent?: boolean;
      }
    ) => {
      try {
        if (!options?.silent) {
          setLoading(true);
        }

        setError("");

        const response =
          await api.get("/orders");

        const normalizedOrders =
          normalizeOrders(
            response.data
          );

        detectStatusChanges(
          normalizedOrders
        );

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
         * Jangan menghapus order lama ketika
         * polling gagal sebentar.
         */
        if (!options?.silent) {
          if (
            err?.response?.status === 401
          ) {
            setError(
              "Sesi login kamu sudah berakhir. Silakan login kembali."
            );
          } else {
            setError(
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              "Gagal mengambil data pesanan"
            );
          }

          setOrders([]);
        }
      } finally {
        if (!options?.silent) {
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
   * =====================================================
   *
   * Cek perubahan status setiap 3 detik.
   */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        fetchOrders({
          silent: true,
        });
      }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchOrders]);

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
    ).toLocaleString("id-ID");
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
    const backendTotal =
      Number(
        order?.total_amount ??
        order?.totalAmount ??
        order?.total ??
        order?.grand_total ??
        order?.grandTotal ??
        0
      );

    if (backendTotal > 0) {
      return backendTotal;
    }

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
   * =====================================================
   */

  const getStatusIcon = (
    status: string
  ) => {
    switch (
    normalizeStatus(status)
    ) {
      case "completed":
      case "complete":
      case "success":
      case "paid":
      case "payment_success":
        return (
          <CheckCircle2 size={16} />
        );

      case "cancelled":
      case "canceled":
      case "rejected":
        return (
          <XCircle size={16} />
        );

      default:
        return (
          <Clock3 size={16} />
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
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-title">
          <div>
            <h1>Pesanan Saya</h1>
            <p>
              Pantau semua pesanan makanan kamu
            </p>
          </div>

          <div className="orders-title-icon">
            <Utensils size={32} />
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
            <h1>Pesanan Saya</h1>
            <p>
              Pantau semua pesanan makanan kamu
            </p>
          </div>

          <div className="orders-title-icon">
            <Utensils size={32} />
          </div>
        </div>

        <div className="error-box">
          <div>{error}</div>

          <button
            type="button"
            onClick={() =>
              fetchOrders()
            }
            className="retry-orders"
          >
            <RefreshCw size={16} />
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
          className={`order-live-notification notification-${notification.type}`}
        >

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

          <div className="notification-content">

            <div className="notification-topline">
              <span>
                <BellRing size={14} />
                WARTEGKITA
              </span>

              <button
                type="button"
                onClick={() =>
                  setNotification(null)
                }
                aria-label="Tutup notifikasi"
              >
                <X size={17} />
              </button>
            </div>

            <strong>
              {notification.title}
            </strong>

            <p>
              {notification.message}
            </p>

            {notification.orderId && (
              <Link
                to={`/orders/${notification.orderId}`}
                onClick={() =>
                  setNotification(null)
                }
              >
                Lihat Pesanan
                <ArrowRight size={14} />
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
            Pantau semua pesanan makanan kamu
          </p>
        </div>

        <div className="orders-title-icon">
          <Utensils size={34} />
        </div>

      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {orders.length === 0 ? (
        <div className="empty-orders">

          <div className="empty-icon">
            <Utensils size={40} />
          </div>

          <h2>
            Belum Ada Pesanan
          </h2>

          <p>
            Kamu belum memiliki
            riwayat pesanan.
            Yuk jelajahi berbagai
            warteg favoritmu dan
            mulai pesan sekarang.
          </p>

          <div>
            <Link
              to="/explore"
              className="start-order"
            >
              Mulai Pesan
            </Link>
          </div>

        </div>
      ) : (

        <div className="orders-list">

          {orders.map(
            (order: any) => {

              const items =
                getOrderItems(order);

              const orderTotal =
                getOrderTotal(order);

              const status =
                normalizeStatus(
                  order?.status
                );

              return (
                <Link
                  key={
                    order?.id ||
                    order?.order_number
                  }
                  to={`/orders/${order.id}`}
                  className="order-card"
                >

                  <div className="order-top">

                    <div className="order-left">

                      <div className="order-icon">
                        <Utensils
                          size={22}
                        />
                      </div>

                      <div className="order-info">

                        <h3>
                          {getOrderNumber(
                            order
                          )}
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
                          status
                        )}
                      </span>
                    </div>

                  </div>

                  <div className="order-divider" />

                  {items.length > 0 && (
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
                                `${order.id}-${index}`
                              }
                              className="order-item"
                            >

                              <div className="order-item-info">

                                <strong>
                                  {getItemName(
                                    item
                                  )}
                                </strong>

                                <span>
                                  Jumlah:{" "}
                                  {quantity}
                                </span>

                              </div>

                              <strong className="order-item-price">
                                Rp{" "}
                                {formatPrice(
                                  itemTotal
                                )}
                              </strong>

                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                  <div className="order-divider" />

                  <div className="order-bottom">

                    <div className="order-price">

                      <span>
                        Total Pembayaran
                      </span>

                      <strong>
                        Rp{" "}
                        {formatPrice(
                          orderTotal
                        )}
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