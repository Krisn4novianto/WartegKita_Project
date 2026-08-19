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
  CreditCard,
  MessageSquare,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import SellerNavbar from "./SellerNavbar";
import OrderDetailModal, {
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentStatus,
} from "./OrderDetailModal";

import api from "../../services/api";

import "../../styles/seller/Orders.css";

/* =====================================================
   TYPES
===================================================== */

type DateFilter =
  | "all"
  | "today"
  | "month";

type StatusFilter =
  | "ALL"
  | OrderStatus;

/* =====================================================
   STATUS HISTORY
===================================================== */

type OrderStatusHistory = {
  id: string;
  order_id: string;
  status: string;
  note: string;
  changed_by: string;
  created_at: string;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function Orders() {
  const { seller_id } =
    useParams<{
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
     SELECTED ORDER
  ===================================================== */

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

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

  const [
    notificationVisible,
    setNotificationVisible,
  ] = useState(false);

  const [lastNewOrder, setLastNewOrder] =
    useState<Order | null>(null);

  /* =====================================================
     UPDATE
  ===================================================== */

  const [updatingOrderId, setUpdatingOrderId] =
    useState<string | null>(null);

  /* =====================================================
     SELLER NOTE
  ===================================================== */

  const [statusNote, setStatusNote] =
    useState("");

  const [noteModalOrder, setNoteModalOrder] =
    useState<Order | null>(null);

  const [noteModalStatus, setNoteModalStatus] =
    useState<OrderStatus | null>(null);

  /* =====================================================
     DELIVERY MODAL
  ===================================================== */

  const [deliveryOrder, setDeliveryOrder] =
    useState<Order | null>(null);

  /* =====================================================
     REFS
  ===================================================== */

  const previousOrderIdsRef =
    useRef<Set<string>>(
      new Set()
    );

  const isFirstLoadRef =
    useRef(true);

  const requestRunningRef =
    useRef(false);

  const soundRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  /* =====================================================
     GET CUSTOMER NOTE
  ===================================================== */

  const getItemNote = useCallback(
    (item: any): string => {
      if (!item) {
        return "";
      }

      const candidates = [
        item.note,
        item.Note,

        item.notes,
        item.Notes,

        item.item_note,
        item.itemNote,

        item.item_notes,
        item.itemNotes,

        item.menu_note,
        item.menuNote,

        item.menu_notes,
        item.menuNotes,

        item.customer_note,
        item.customerNote,

        item.customer_notes,
        item.customerNotes,

        item.catatan,
        item.catatan_menu,

        item.menu?.note,
        item.menu?.Note,
        item.menu?.notes,
        item.menu?.Notes,
        item.menu?.menu_note,
        item.menu?.menuNote,

        item.order_item?.note,
        item.order_item?.Note,
        item.order_item?.notes,
        item.order_item?.Notes,
        item.order_item?.customer_note,
        item.order_item?.customer_notes,

        item.orderItem?.note,
        item.orderItem?.notes,
        item.orderItem?.customer_note,
        item.orderItem?.customer_notes,
      ];

      for (
        const value of candidates
      ) {
        if (
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
        ) {
          return String(
            value
          ).trim();
        }
      }

      return "";
    },
    []
  );

  /* =====================================================
     GET STATUS HISTORIES
  ===================================================== */

  const getStatusHistories = useCallback(
    (raw: any): OrderStatusHistory[] => {
      const candidates = [
        raw?.status_histories,
        raw?.statusHistories,
        raw?.order_status_histories,
        raw?.orderStatusHistories,
        raw?.histories,
        raw?.history,
        raw?.data?.status_histories,
        raw?.data?.statusHistories,
        raw?.data?.order_status_histories,
        raw?.data?.orderStatusHistories,
        raw?.data?.history,
      ];

      let histories: any[] = [];

      for (
        const candidate of candidates
      ) {
        if (
          Array.isArray(candidate)
        ) {
          histories = candidate;
          break;
        }
      }

      return histories.map(
        (
          history: any,
          index: number
        ) => ({
          id: String(
            history?.id ??
            `${raw?.id ?? "order"}-history-${index}`
          ),

          order_id: String(
            history?.order_id ??
            history?.orderId ??
            raw?.id ??
            ""
          ),

          status: String(
            history?.status ??
            ""
          )
            .trim()
            .toUpperCase(),

          note: String(
            history?.note ??
            history?.Note ??
            ""
          ).trim(),

          changed_by: String(
            history?.changed_by ??
            history?.changedBy ??
            "seller"
          ).trim(),

          created_at:
            history?.created_at ??
            history?.createdAt ??
            new Date().toISOString(),
        })
      );
    },
    []
  );

  /* =====================================================
     GET LATEST STATUS NOTE
  ===================================================== */

  const getLatestStatusNote = useCallback(
    (
      order: Order
    ): string => {
      const histories =
        (order as any)
          ?.status_histories ??
        (order as any)
          ?.statusHistories ??
        [];

      if (
        !Array.isArray(
          histories
        )
      ) {
        return "";
      }

      const currentStatus =
        String(
          order.status ?? ""
        )
          .trim()
          .toUpperCase();

      const currentHistory =
        histories
          .filter(
            (history: OrderStatusHistory) =>
              String(
                history.status ?? ""
              )
                .trim()
                .toUpperCase() ===
              currentStatus
          )
          .sort(
            (
              a: OrderStatusHistory,
              b: OrderStatusHistory
            ) =>
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
          )[0];

      return (
        currentHistory?.note ??
        ""
      );
    },
    []
  );

  /* =====================================================
     NORMALIZE STATUS
  ===================================================== */

  const normalizeStatus =
    useCallback(
      (
        status: unknown
      ): OrderStatus => {
        const normalized =
          String(
            status ?? ""
          )
            .trim()
            .toUpperCase();

        switch (
        normalized
        ) {
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

          case "PAID":
            return "WAITING_CONFIRMATION";

          default:
            return "WAITING_CONFIRMATION";
        }
      },
      []
    );

  /* =====================================================
     NORMALIZE PAYMENT
  ===================================================== */

  const normalizePaymentStatus =
    useCallback(
      (
        value: unknown
      ): PaymentStatus => {
        const normalized =
          String(
            value ?? ""
          )
            .trim()
            .toUpperCase();

        switch (
        normalized
        ) {
          case "PAID":
          case "SUCCESS":
          case "SETTLED":
            return "PAID";

          case "FAILED":
          case "FAIL":
          case "EXPIRED":
            return "FAILED";

          case "PENDING":
          case "UNPAID":
          case "WAITING":
          case "WAITING_PAYMENT":
          default:
            return "PENDING";
        }
      },
      []
    );

  /* =====================================================
     NORMALIZE ORDER
  ===================================================== */

  const normalizeOrder =
    useCallback(
      (raw: any): Order => {
        const paymentStatus =
          normalizePaymentStatus(
            raw?.payment_status ??
            raw?.paymentStatus
          );

        const rawItems =
          Array.isArray(
            raw?.items
          )
            ? raw.items
            : Array.isArray(
              raw?.order_items
            )
              ? raw.order_items
              : Array.isArray(
                raw?.orderItems
              )
                ? raw.orderItems
                : [];

        const normalizedItems:
          OrderItem[] =
          rawItems.map(
            (
              item: any,
              index: number
            ) => {
              const note =
                getItemNote(
                  item
                );

              const normalizedItem:
                OrderItem = {
                id: String(
                  item?.id ??
                  `${raw?.id ?? "order"}-${index}`
                ),

                order_id:
                  String(
                    item?.order_id ??
                    item?.orderId ??
                    raw?.id ??
                    ""
                  ),

                menu_id:
                  String(
                    item?.menu_id ??
                    item?.menuId ??
                    item?.menu?.id ??
                    ""
                  ),

                menu_name:
                  String(
                    item?.menu_name ??
                    item?.menuName ??
                    item?.name ??
                    item?.menu?.name ??
                    "Menu"
                  ),

                quantity:
                  Number(
                    item?.quantity ??
                    0
                  ),

                price:
                  Number(
                    item?.price ??
                    item?.unit_price ??
                    item?.unitPrice ??
                    0
                  ),

                note,

                notes:
                  item?.notes,

                item_note:
                  item?.item_note,

                item_notes:
                  item?.item_notes,

                menu_note:
                  item?.menu_note,

                menu_notes:
                  item?.menu_notes,

                customer_note:
                  item?.customer_note,

                customer_notes:
                  item?.customer_notes,

                catatan:
                  item?.catatan,

                catatan_menu:
                  item?.catatan_menu,

                created_at:
                  item?.created_at ??
                  item?.createdAt ??
                  raw?.created_at ??
                  new Date().toISOString(),

                ...item,
              };

              normalizedItem.note =
                note;

              return normalizedItem;
            }
          );

        /* =================================================
           STATUS HISTORY
        ================================================= */

        const statusHistories =
          getStatusHistories(
            raw
          );

        /* =================================================
           DEBUG NOTE
        ================================================= */

        if (
          normalizedItems.some(
            (item) =>
              Boolean(
                item.note
              )
          )
        ) {
          console.log(
            "CUSTOMER NOTES FOUND:",
            normalizedItems.map(
              (item) => ({
                menu:
                  item.menu_name,
                note:
                  item.note,
              })
            )
          );
        }

        if (
          statusHistories.length >
          0
        ) {
          console.log(
            "STATUS HISTORY:",
            statusHistories
          );
        }

        /* =================================================
           USER
        ================================================= */

        const rawUser =
          raw?.user ??
          raw?.User ??
          raw?.customer ??
          raw?.Customer ??
          null;

        const user =
          rawUser
            ? {
              id: String(
                rawUser?.id ??
                raw?.user_id ??
                raw?.userId ??
                ""
              ),

              name: String(
                rawUser?.name ??
                rawUser?.full_name ??
                rawUser?.fullName ??
                rawUser?.username ??
                "Customer"
              ),

              email: String(
                rawUser?.email ??
                ""
              ),
            }
            : null;

        /* =================================================
           RETURN
        ================================================= */

        const normalizedOrder =
          {
            id: String(
              raw?.id ?? ""
            ),

            order_number:
              String(
                raw?.order_number ??
                raw?.orderNumber ??
                "-"
              ),

            user_id:
              String(
                raw?.user_id ??
                raw?.userId ??
                raw?.user?.id ??
                ""
              ),

            seller_id:
              String(
                raw?.seller_id ??
                raw?.sellerId ??
                seller_id ??
                ""
              ),

            status:
              normalizeStatus(
                raw?.status ??
                raw?.order_status ??
                raw?.orderStatus
              ),

            payment_status:
              paymentStatus,

            total_amount:
              Number(
                raw?.total_amount ??
                raw?.totalAmount ??
                raw?.total ??
                raw?.grand_total ??
                raw?.grandTotal ??
                0
              ),

            payment_method:
              String(
                raw?.payment_method ??
                raw?.paymentMethod ??
                "-"
              ),

            created_at:
              raw?.created_at ??
              raw?.createdAt ??
              new Date().toISOString(),

            updated_at:
              raw?.updated_at ??
              raw?.updatedAt ??
              raw?.created_at ??
              raw?.createdAt ??
              new Date().toISOString(),

            items:
              normalizedItems,

            user,
          } as Order;

        /*
         * Tambahkan history secara runtime tanpa
         * mengubah type Order dari OrderDetailModal.
         */
        (
          normalizedOrder as any
        ).status_histories =
          statusHistories;

        return normalizedOrder;
      },
      [
        seller_id,
        normalizeStatus,
        normalizePaymentStatus,
        getItemNote,
        getStatusHistories,
      ]
    );

  /* =====================================================
     EXTRACT ORDERS
  ===================================================== */

  const extractOrders =
    useCallback(
      (data: any): any[] => {
        if (
          Array.isArray(data)
        ) {
          return data;
        }

        if (
          Array.isArray(
            data?.data
          )
        ) {
          return data.data;
        }

        if (
          Array.isArray(
            data?.orders
          )
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
     PAYMENT CHECK
  ===================================================== */

  const isOrderPaid =
    useCallback(
      (order: Order) =>
        order.payment_status ===
        "PAID",
      []
    );

  /* =====================================================
     CAN SELLER PROCESS
  ===================================================== */

  const canSellerProcess =
    useCallback(
      (order: Order) => {
        if (
          order.status ===
          "WAITING_CONFIRMATION"
        ) {
          return isOrderPaid(
            order
          );
        }

        if (
          order.status ===
          "CONFIRMED" ||
          order.status ===
          "PREPARING" ||
          order.status ===
          "READY" ||
          order.status ===
          "ON_DELIVERY"
        ) {
          return isOrderPaid(
            order
          );
        }

        return false;
      },
      [isOrderPaid]
    );

  /* =====================================================
     SOUND
  ===================================================== */

  const playNotificationSound =
    useCallback(
      () => {
        try {
          if (
            !soundRef.current
          ) {
            soundRef.current =
              new Audio(
                "/sounds/new-order.mp3"
              );

            soundRef.current.volume =
              0.8;
          }

          soundRef.current.currentTime =
            0;

          const playPromise =
            soundRef.current.play();

          if (playPromise) {
            playPromise.catch(
              () => {
                console.log(
                  "Browser memblokir autoplay sound."
                );
              }
            );
          }
        } catch (error) {
          console.error(
            "Notification sound error:",
            error
          );
        }
      },
      []
    );

  /* =====================================================
     BROWSER NOTIFICATION
  ===================================================== */

  const showBrowserNotification =
    useCallback(
      (
        newOrders: Order[]
      ) => {
        if (
          typeof window ===
          "undefined"
        ) {
          return;
        }

        if (
          !(
            "Notification" in
            window
          )
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
          newOrders.length ===
          0
        ) {
          return;
        }

        const firstOrder =
          newOrders[0];

        const customerName =
          firstOrder.user
            ?.name ??
          "Customer";

        const message =
          newOrders.length ===
            1
            ? `Pesanan ${firstOrder.order_number} dari ${customerName} sudah dibayar dan siap diproses.`
            : `${newOrders.length} pesanan baru yang sudah dibayar masuk.`;

        try {
          new Notification(
            "Pesanan Siap Diproses!",
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
      !(
        "Notification" in
        window
      )
    ) {
      return;
    }

    if (
      Notification.permission ===
      "default"
    ) {
      Notification.requestPermission().catch(
        () => { }
      );
    }
  }, []);

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  const loadOrders =
    useCallback(
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
              .map(
                normalizeOrder
              )
              .filter(
                (order) =>
                  Boolean(
                    order.id
                  )
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

          console.log(
            "Normalized Orders:",
            receivedOrders
          );

          /* =================================================
             DEBUG CUSTOMER NOTES
          ================================================= */

          console.log(
            "========== CUSTOMER NOTES =========="
          );

          receivedOrders.forEach(
            (order) => {
              order.items.forEach(
                (item) => {
                  console.log({
                    order:
                      order.order_number,
                    menu:
                      item.menu_name,
                    note:
                      item.note ||
                      "(TIDAK ADA NOTE)",
                  });
                }
              );

              console.log(
                "Status histories:",
                (
                  order as any
                )
                  ?.status_histories
              );

              console.log(
                "Latest status note:",
                getLatestStatusNote(
                  order
                ) ||
                "(TIDAK ADA NOTE STATUS)"
              );
            }
          );

          /* =================================================
             DETEKSI PESANAN BARU
          ================================================= */

          const currentIds =
            new Set<string>(
              receivedOrders.map(
                (order) =>
                  order.id
              )
            );

          if (
            !isFirstLoadRef.current
          ) {
            const newOrders =
              receivedOrders.filter(
                (order) =>
                  order.status ===
                  "WAITING_CONFIRMATION" &&
                  order.payment_status ===
                  "PAID" &&
                  !previousOrderIdsRef.current.has(
                    order.id
                  )
              );

            if (
              newOrders.length >
              0
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

          setSelectedOrder(
            (current) => {
              if (!current) {
                return null;
              }

              return (
                receivedOrders.find(
                  (order) =>
                    order.id ===
                    current.id
                ) ?? null
              );
            }
          );

          setDeliveryOrder(
            (current) => {
              if (!current) {
                return null;
              }

              return (
                receivedOrders.find(
                  (order) =>
                    order.id ===
                    current.id
                ) ?? null
              );
            }
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
              error.response
                .status;

            const responseData =
              error.response
                .data;

            console.error(
              "BACKEND RESPONSE:",
              responseData
            );

            const backendMessage =
              responseData?.error ??
              responseData?.message ??
              responseData?.detail;

            switch (
            status
            ) {
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
        getLatestStatusNote,
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

    setSelectedOrder(null);

    setDeliveryOrder(null);

    setNoteModalOrder(null);

    setNoteModalStatus(null);

    setStatusNote("");

    setErrorMessage("");

    loadOrders(false);

    const intervalId =
      window.setInterval(
        () => {
          if (
            !updatingOrderId
          ) {
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
     OPEN STATUS NOTE MODAL
  ===================================================== */

  const openStatusNoteModal =
    (
      order: Order,
      status: OrderStatus
    ) => {
      if (
        updatingOrderId
      ) {
        return;
      }

      setNoteModalOrder(
        order
      );

      setNoteModalStatus(
        status
      );

      setStatusNote("");
    };

  /* =====================================================
     CLOSE STATUS NOTE MODAL
  ===================================================== */

  const closeStatusNoteModal =
    () => {
      if (
        updatingOrderId
      ) {
        return;
      }

      setNoteModalOrder(
        null
      );

      setNoteModalStatus(
        null
      );

      setStatusNote("");
    };

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  const updateStatus =
    async (
      id: string,
      status: OrderStatus,
      note = ""
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

      const currentOrder =
        orders.find(
          (order) =>
            order.id === id
        );

      if (
        currentOrder &&
        currentOrder.status ===
        "WAITING_CONFIRMATION" &&
        currentOrder.payment_status !==
        "PAID"
      ) {
        setErrorMessage(
          "Pesanan belum dibayar. Seller belum dapat memproses pesanan."
        );

        return false;
      }

      try {
        setUpdatingOrderId(
          id
        );

        setErrorMessage("");

        const endpoint =
          `/orders/${encodeURIComponent(
            id
          )}/status`;

        /*
         * PENTING:
         * Backend menerima status + note.
         */
        const payload = {
          status,
          note:
            String(
              note ?? ""
            ).trim(),
        };

        console.log(
          "========== UPDATE ORDER STATUS =========="
        );

        console.log(
          "Order ID:",
          id
        );

        console.log(
          "Status:",
          status
        );

        console.log(
          "Note:",
          payload.note
        );

        const response =
          await api.patch(
            endpoint,
            payload,
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
         * Backend mengembalikan history baru.
         */
        const backendHistory =
          response?.data
            ?.data?.history ??
          response?.data
            ?.history ??
          null;

        setOrders(
          (previousOrders) =>
            previousOrders.map(
              (order) => {
                if (
                  order.id !== id
                ) {
                  return order;
                }

                const existingHistories =
                  Array.isArray(
                    (
                      order as any
                    )
                      ?.status_histories
                  )
                    ? (
                      order as any
                    )
                      .status_histories
                    : [];

                let updatedHistories =
                  existingHistories;

                if (
                  backendHistory
                ) {
                  const normalizedHistory: OrderStatusHistory =
                  {
                    id: String(
                      backendHistory?.id ??
                      crypto.randomUUID()
                    ),

                    order_id:
                      String(
                        backendHistory?.order_id ??
                        id
                      ),

                    status:
                      String(
                        backendHistory?.status ??
                        status
                      )
                        .trim()
                        .toUpperCase(),

                    note: String(
                      backendHistory?.note ??
                      payload.note ??
                      ""
                    ).trim(),

                    changed_by:
                      String(
                        backendHistory?.changed_by ??
                        "seller"
                      ).trim(),

                    created_at:
                      backendHistory?.created_at ??
                      new Date().toISOString(),
                  };

                  updatedHistories = [
                    ...existingHistories,
                    normalizedHistory,
                  ];
                } else if (
                  payload.note
                ) {
                  updatedHistories = [
                    ...existingHistories,
                    {
                      id:
                        crypto.randomUUID(),
                      order_id:
                        id,
                      status,
                      note:
                        payload.note,
                      changed_by:
                        "seller",
                      created_at:
                        new Date().toISOString(),
                    },
                  ];
                }

                const updatedOrder =
                {
                  ...order,
                  status,
                  updated_at:
                    new Date().toISOString(),
                };

                (
                  updatedOrder as any
                ).status_histories =
                  updatedHistories;

                return updatedOrder;
              }
            )
        );

        setSelectedOrder(
          (current) => {
            if (
              !current ||
              current.id !== id
            ) {
              return current;
            }

            const existingHistories =
              Array.isArray(
                (
                  current as any
                )
                  ?.status_histories
              )
                ? (
                  current as any
                )
                  .status_histories
                : [];

            const updatedHistories =
              backendHistory
                ? [
                  ...existingHistories,
                  backendHistory,
                ]
                : payload.note
                  ? [
                    ...existingHistories,
                    {
                      id:
                        crypto.randomUUID(),
                      order_id:
                        id,
                      status,
                      note:
                        payload.note,
                      changed_by:
                        "seller",
                      created_at:
                        new Date().toISOString(),
                    },
                  ]
                  : existingHistories;

            const updatedOrder =
            {
              ...current,
              status,
              updated_at:
                new Date().toISOString(),
            };

            (
              updatedOrder as any
            ).status_histories =
              updatedHistories;

            return updatedOrder;
          }
        );

        /*
         * Tutup note modal setelah sukses.
         */
        closeStatusNoteModal();

        setDeliveryOrder(
          (current) => {
            if (
              !current ||
              current.id !== id
            ) {
              return current;
            }

            const updatedOrder =
            {
              ...current,
              status,
              updated_at:
                new Date().toISOString(),
            };

            return updatedOrder;
          }
        );

        requestRunningRef.current =
          false;

        setUpdatingOrderId(
          null
        );

        /*
         * Ambil ulang dari backend supaya history
         * terbaru benar-benar sinkron.
         */
        await loadOrders(
          false
        );

        return true;
      } catch (error: any) {
        console.error(
          "UPDATE STATUS ERROR:",
          error
        );

        const responseData =
          error?.response
            ?.data;

        const backendMessage =
          responseData?.error ??
          responseData?.message ??
          responseData?.detail;

        if (
          error?.response
            ?.status === 400
        ) {
          setErrorMessage(
            backendMessage ??
            `Backend menolak status "${status}".`
          );
        } else if (
          error?.response
            ?.status === 401
        ) {
          setErrorMessage(
            "Sesi login sudah tidak valid. Silakan login kembali."
          );
        } else if (
          error?.response
            ?.status === 403
        ) {
          setErrorMessage(
            backendMessage ??
            "Kamu tidak memiliki izin mengubah pesanan ini."
          );
        } else if (
          error?.response
            ?.status === 404
        ) {
          setErrorMessage(
            backendMessage ??
            "Order tidak ditemukan."
          );
        } else if (
          error?.response
            ?.status >= 500
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
        setUpdatingOrderId(
          null
        );
      }
    };

  /* =====================================================
     SUBMIT STATUS NOTE
  ===================================================== */

  const handleSubmitStatusNote =
    async () => {
      if (
        !noteModalOrder ||
        !noteModalStatus
      ) {
        return;
      }

      await updateStatus(
        noteModalOrder.id,
        noteModalStatus,
        statusNote
      );
    };

  /* =====================================================
     PROCESS
  ===================================================== */

  const handleStartProcess =
    async (
      order: Order
    ) => {
      if (
        order.payment_status !==
        "PAID"
      ) {
        setErrorMessage(
          "Pesanan belum dibayar. Tunggu sampai pembayaran customer berhasil."
        );

        return;
      }

      openStatusNoteModal(
        order,
        "CONFIRMED"
      );
    };

  /* =====================================================
     PREPARING
  ===================================================== */

  const handleStartPreparing =
    async (
      order: Order
    ) => {
      if (
        !isOrderPaid(order)
      ) {
        setErrorMessage(
          "Pembayaran pesanan belum berhasil."
        );

        return;
      }

      openStatusNoteModal(
        order,
        "PREPARING"
      );
    };

  /* =====================================================
     DELIVERY MODAL
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

      if (
        !isOrderPaid(order)
      ) {
        setErrorMessage(
          "Pesanan belum dibayar."
        );

        return;
      }

      setDeliveryOrder(
        order
      );
    };

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
     READY
  ===================================================== */

  const handleConfirmReady =
    async () => {
      if (
        !deliveryOrder
      ) {
        return;
      }

      if (
        !isOrderPaid(
          deliveryOrder
        )
      ) {
        setErrorMessage(
          "Pesanan belum dibayar."
        );

        return;
      }

      /*
       * Tutup delivery modal lalu buka
       * modal catatan seller.
       */
      setDeliveryOrder(
        null
      );

      openStatusNoteModal(
        deliveryOrder,
        "READY"
      );
    };

  /* =====================================================
     NEXT STATUS
  ===================================================== */

  const handleNextStatus =
    (order: Order) => {
      if (
        !isOrderPaid(order)
      ) {
        setErrorMessage(
          "Pesanan belum dibayar. Seller belum dapat memproses pesanan."
        );

        return;
      }

      switch (
      order.status
      ) {
        case "WAITING_CONFIRMATION":
          handleStartProcess(
            order
          );
          break;

        case "CONFIRMED":
          handleStartPreparing(
            order
          );
          break;

        case "PREPARING":
          handleOpenDeliveryModal(
            order
          );
          break;

        case "READY":
          openStatusNoteModal(
            order,
            "ON_DELIVERY"
          );
          break;

        case "ON_DELIVERY":
          openStatusNoteModal(
            order,
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

  const getStatusLabel =
    (
      status: OrderStatus
    ) => {
      switch (
      status
      ) {
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

  const getStatusClass =
    (
      status: OrderStatus
    ) => {
      switch (
      status
      ) {
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

  const getPaymentLabel =
    (
      method: string
    ) => {
      const normalized =
        String(
          method ?? ""
        )
          .toLowerCase()
          .trim();

      switch (
      normalized
      ) {
        case "qris":
          return "QRIS";

        case "bank_transfer":
        case "bank transfer":
        case "transfer_bank":
          return "Transfer Bank";

        case "virtual_account":
        case "virtual account":
        case "va":
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

  const isToday =
    (
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

  const checkDate =
    (
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
        return isToday(
          date
        );
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
          orderFilter ===
            "all"
            ? true
            : checkDate(
              order.created_at,
              orderFilter
            );

        const statusValid =
          statusFilter ===
            "ALL"
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
          order.total_amount ||
          0
        ),
      0
    );

  /* =====================================================
     ACTIVE
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
     WAITING PAID
  ===================================================== */

  const waitingOrders =
    orders.filter(
      (order) =>
        order.status ===
        "WAITING_CONFIRMATION" &&
        order.payment_status ===
        "PAID"
    );

  /* =====================================================
     WAITING PAYMENT
  ===================================================== */

  const waitingPaymentOrders =
    orders.filter(
      (order) =>
        order.status ===
        "WAITING_CONFIRMATION" &&
        order.payment_status ===
        "PENDING"
    );

  /* =====================================================
     CLEAR NOTIFICATION
  ===================================================== */

  const clearNotification =
    () => {
      setNewOrderCount(
        0
      );

      setNotificationVisible(
        false
      );

      setLastNewOrder(
        null
      );
    };

  /* =====================================================
     CURRENCY
  ===================================================== */

  const formatCurrency =
    (
      value: number
    ) => {
      return Number(
        value || 0
      ).toLocaleString(
        "id-ID"
      );
    };

  /* =====================================================
     OPEN DETAIL
  ===================================================== */

  const handleOpenOrderDetail =
    (
      order: Order
    ) => {
      setSelectedOrder(
        order
      );
    };

  const handleCloseOrderDetail =
    () => {
      if (
        updatingOrderId
      ) {
        return;
      }

      setSelectedOrder(
        null
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

          {/* =================================================
              ERROR
          ================================================= */}

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
                  setErrorMessage(
                    ""
                  )
                }
                className="notification-close"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* =================================================
              NEW ORDER
          ================================================= */}

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
                    } sudah dibayar dan siap diproses.`
                    : "Ada pesanan baru yang sudah dibayar."}
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

          {/* =================================================
              HEADER
          ================================================= */}

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
              {newOrderCount >
                0 && (
                  <button
                    type="button"
                    className="new-order-alert"
                    onClick={
                      clearNotification
                    }
                  >
                    <span className="notification-dot">
                      {
                        newOrderCount
                      }
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

          {/* =================================================
              SUMMARY
          ================================================= */}

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
                  {
                    filteredOrders.length
                  }
                </strong>

                <select
                  value={
                    orderFilter
                  }
                  onChange={(
                    event
                  ) =>
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
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
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
                  value={
                    revenueFilter
                  }
                  onChange={(
                    event
                  ) =>
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

          {/* =================================================
              WAITING PAID
          ================================================= */}

          {waitingOrders.length >
            0 && (
              <div className="waiting-banner">
                <div className="waiting-banner-dot" />

                <div>
                  <strong>
                    {
                      waitingOrders.length
                    }{" "}
                    pesanan siap diproses
                  </strong>

                  <span>
                    Pembayaran sudah berhasil.
                    Pesanan siap diproses oleh
                    seller.
                  </span>
                </div>

                <ChevronRight size={18} />
              </div>
            )}

          {/* =================================================
              WAITING PAYMENT
          ================================================= */}

          {waitingPaymentOrders.length >
            0 && (
              <div className="waiting-payment-banner">
                <div className="waiting-payment-icon">
                  <CreditCard size={18} />
                </div>

                <div>
                  <strong>
                    {
                      waitingPaymentOrders.length
                    }{" "}
                    pesanan menunggu pembayaran
                  </strong>

                  <span>
                    Pesanan belum dapat diproses
                    sampai pembayaran customer
                    berhasil.
                  </span>
                </div>
              </div>
            )}

          {/* =================================================
              ORDERS
          ================================================= */}

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
                        <th>
                          Order
                        </th>

                        <th>
                          Customer
                        </th>

                        <th>
                          Menu
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Pembayaran
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map(
                        (
                          order
                        ) => {
                          const isUpdating =
                            updatingOrderId ===
                            order.id;

                          const isPaid =
                            isOrderPaid(
                              order
                            );

                          const canProcess =
                            canSellerProcess(
                              order
                            );

                          const latestStatusNote =
                            getLatestStatusNote(
                              order
                            );

                          return (
                            <tr
                              key={
                                order.id
                              }
                              className={`
                                order-row-clickable
                                ${order.status ===
                                  "WAITING_CONFIRMATION" &&
                                  isPaid
                                  ? "new-order-row"
                                  : ""
                                }
                              `}
                              onClick={() =>
                                handleOpenOrderDetail(
                                  order
                                )
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

                                  {latestStatusNote && (
                                    <div className="order-status-note-preview">
                                      <MessageSquare
                                        size={
                                          12
                                        }
                                      />

                                      <span>
                                        {
                                          latestStatusNote
                                        }
                                      </span>
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    className="order-detail-trigger"
                                    onClick={(
                                      event
                                    ) => {
                                      event.stopPropagation();

                                      handleOpenOrderDetail(
                                        order
                                      );
                                    }}
                                  >
                                    Lihat Detail

                                    <ChevronRight
                                      size={
                                        14
                                      }
                                    />
                                  </button>

                                </div>
                              </td>

                              {/* CUSTOMER */}

                              <td>
                                <div className="customer">

                                  <div className="customer-icon">
                                    <User
                                      size={
                                        16
                                      }
                                    />
                                  </div>

                                  <div>
                                    <span>
                                      {
                                        order
                                          .user
                                          ?.name ??
                                        "Customer"
                                      }
                                    </span>

                                    {order
                                      .user
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

                                  {order.items.length >
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

                                            <div className="order-item-main">
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

                                            {getItemNote(
                                              item
                                            ) && (
                                                <div className="order-item-note-preview">
                                                  <Bell
                                                    size={
                                                      12
                                                    }
                                                  />

                                                  Catatan
                                                  tersedia
                                                </div>
                                              )}

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

                              <td
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              >

                                {isUpdating ? (
                                  <div className="processing-action">

                                    <Loader2
                                      size={
                                        15
                                      }
                                      className="loading-icon"
                                    />

                                    Memproses...

                                  </div>
                                ) : (
                                  <div className="action-cell">

                                    {order.status ===
                                      "WAITING_CONFIRMATION" &&
                                      !isPaid && (
                                        <button
                                          type="button"
                                          className="payment-waiting-btn"
                                          disabled
                                        >
                                          <CreditCard
                                            size={
                                              16
                                            }
                                          />

                                          Menunggu
                                          Pembayaran
                                        </button>
                                      )}

                                    {order.status ===
                                      "WAITING_CONFIRMATION" &&
                                      isPaid && (
                                        <button
                                          type="button"
                                          className="process-btn"
                                          onClick={() =>
                                            handleStartProcess(
                                              order
                                            )
                                          }
                                        >
                                          <Package
                                            size={
                                              16
                                            }
                                          />

                                          Proses Pesanan
                                        </button>
                                      )}

                                    {order.status ===
                                      "CONFIRMED" &&
                                      canProcess && (
                                        <button
                                          type="button"
                                          className="process-btn"
                                          onClick={() =>
                                            handleStartPreparing(
                                              order
                                            )
                                          }
                                        >
                                          <Package
                                            size={
                                              16
                                            }
                                          />

                                          Mulai Siapkan
                                        </button>
                                      )}

                                    {order.status ===
                                      "PREPARING" &&
                                      canProcess && (
                                        <button
                                          type="button"
                                          className="ready-delivery-btn"
                                          onClick={() =>
                                            handleOpenDeliveryModal(
                                              order
                                            )
                                          }
                                        >
                                          <Truck
                                            size={
                                              16
                                            }
                                          />

                                          Siap Diantar
                                        </button>
                                      )}

                                    {order.status ===
                                      "READY" &&
                                      canProcess && (
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
                                            size={
                                              16
                                            }
                                          />

                                          Driver Mengantar
                                        </button>
                                      )}

                                    {order.status ===
                                      "ON_DELIVERY" &&
                                      canProcess && (
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
                                            size={
                                              16
                                            }
                                          />

                                          Tandai Selesai
                                        </button>
                                      )}

                                    {order.status ===
                                      "COMPLETED" && (
                                        <span className="done-text">
                                          <CircleCheck
                                            size={
                                              16
                                            }
                                          />

                                          Pesanan Selesai
                                        </span>
                                      )}

                                    {order.status ===
                                      "CANCELLED" && (
                                        <span className="reject-text">
                                          Pesanan
                                          Dibatalkan
                                        </span>
                                      )}

                                    {!isPaid &&
                                      order.status !==
                                      "WAITING_CONFIRMATION" &&
                                      order.status !==
                                      "COMPLETED" &&
                                      order.status !==
                                      "CANCELLED" && (
                                        <span className="payment-required-text">
                                          <CreditCard
                                            size={
                                              15
                                            }
                                          />

                                          Menunggu
                                          Pembayaran
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
          ORDER DETAIL MODAL
      ===================================================== */}

      {selectedOrder && (
        <OrderDetailModal
          order={
            selectedOrder
          }
          onClose={
            handleCloseOrderDetail
          }
          onProcess={
            handleStartProcess
          }
          processing={
            updatingOrderId ===
            selectedOrder.id
          }
          formatCurrency={
            formatCurrency
          }
          getStatusLabel={
            getStatusLabel
          }
          getStatusClass={
            getStatusClass
          }
          getPaymentLabel={
            getPaymentLabel
          }
          getItemNote={
            getItemNote
          }
        />
      )}

      {/* =====================================================
          DELIVERY MODAL
      ===================================================== */}

      {deliveryOrder && (
        <div
          className="delivery-modal-overlay"
          onMouseDown={(
            event
          ) => {
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
                Pesanan sudah siap
                diantar?
              </h2>

              <p>
                Pastikan semua menu sudah
                lengkap sebelum pesanan
                diserahkan kepada driver.
              </p>

            </div>

            {/* =================================================
                DELIVERY PREVIEW
            ================================================= */}

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
                    deliveryOrder
                      .user
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

            {/* =================================================
                DELIVERY ITEMS
            ================================================= */}

            {deliveryOrder.items.length >
              0 && (
                <div className="delivery-order-items">

                  <div className="delivery-items-title">
                    <span>
                      Detail Pesanan
                    </span>
                  </div>

                  {deliveryOrder.items.map(
                    (item) => {
                      const itemNote =
                        getItemNote(
                          item
                        );

                      return (
                        <div
                          key={
                            item.id
                          }
                          className="delivery-order-item"
                        >

                          <div className="delivery-order-item-main">

                            <strong>
                              {
                                item.quantity
                              }x{" "}
                              {
                                item.menu_name
                              }
                            </strong>

                            <span>
                              Rp{" "}
                              {formatCurrency(
                                item.price *
                                item.quantity
                              )}
                            </span>

                          </div>

                          {itemNote && (
                            <div className="delivery-order-item-note">

                              <span>
                                Catatan Customer
                              </span>

                              <p>
                                “
                                {
                                  itemNote
                                }
                                ”
                              </p>

                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            {/* =================================================
                ACTIONS
            ================================================= */}

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
                <Truck
                  size={
                    17
                  }
                />

                Ya, Siap Diantar
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          SELLER STATUS NOTE MODAL
      ===================================================== */}

      {noteModalOrder &&
        noteModalStatus && (
          <div
            className="status-note-modal-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeStatusNoteModal();
              }
            }}
          >
            <div
              className="status-note-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="status-note-modal-title"
            >
              <button
                type="button"
                className="status-note-modal-close"
                onClick={
                  closeStatusNoteModal
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

              <div className="status-note-modal-icon">
                <MessageSquare
                  size={25}
                />
              </div>

              <div className="status-note-modal-content">
                <span className="status-note-modal-kicker">
                  UPDATE STATUS
                </span>

                <h2 id="status-note-modal-title">
                  {getStatusLabel(
                    noteModalStatus
                  )}
                </h2>

                <p>
                  Tambahkan catatan untuk
                  pesanan{" "}
                  <strong>
                    {
                      noteModalOrder.order_number
                    }
                  </strong>
                  .
                </p>
              </div>

              <div className="status-note-form">
                <label htmlFor="seller-status-note">
                  Catatan Seller
                  <span>
                    Opsional
                  </span>
                </label>

                <textarea
                  id="seller-status-note"
                  value={
                    statusNote
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusNote(
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: Pesanan sudah dikonfirmasi dan akan segera disiapkan..."
                  maxLength={500}
                  disabled={
                    Boolean(
                      updatingOrderId
                    )
                  }
                  rows={4}
                  autoFocus
                />

                <div className="status-note-counter">
                  {
                    statusNote.length
                  }
                  /500
                </div>
              </div>

              <div className="status-note-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={
                    closeStatusNoteModal
                  }
                  disabled={
                    Boolean(
                      updatingOrderId
                    )
                  }
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="modal-confirm-btn"
                  onClick={
                    handleSubmitStatusNote
                  }
                  disabled={
                    Boolean(
                      updatingOrderId
                    )
                  }
                >
                  {updatingOrderId ===
                    noteModalOrder.id ? (
                    <>
                      <Loader2
                        size={
                          17
                        }
                        className="loading-icon"
                      />

                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle
                        size={
                          17
                        }
                      />

                      Simpan & Update
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