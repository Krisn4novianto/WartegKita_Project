import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Receipt,
  ShoppingBag,
  StickyNote,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import { Order } from "../../types";

import "../../styles/history-order.css";

/* =====================================================
   TYPES
===================================================== */

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

interface OrderItem {
  id?: string;

  menu_id?: string;
  menuId?: string;

  menu_name?: string;
  menuName?: string;
  name?: string;

  quantity?: number;
  qty?: number;
  amount?: number;

  price?: number;
  unit_price?: number;
  unitPrice?: number;
  menu_price?: number;
  menuPrice?: number;

  subtotal?: number;
  sub_total?: number;
  item_total?: number;
  total?: number;

  /* ===================================================
     CATATAN PER ITEM
  =================================================== */

  note?: string;
  notes?: string;

  item_note?: string;
  item_notes?: string;

  menu_note?: string;
  menu_notes?: string;

  customer_note?: string;
  customer_notes?: string;

  catatan?: string;
  catatan_menu?: string;

  itemNote?: string;
  menuNote?: string;
  customerNote?: string;

  menu?: {
    id?: string;
    name?: string;
    menu_name?: string;
    price?: number;
    unit_price?: number;

    note?: string;
    notes?: string;
    menu_note?: string;
    menuNote?: string;
  };

  [key: string]: any;
}

interface NormalizedOrder extends Omit<Partial<Order>, "status" | "items"> {
  id: string;
  order_number: string;

  status: string;

  payment_method: string;
  payment_status: PaymentStatus;

  total_amount: number;

  items: OrderItem[];

  /* ===================================================
     CATATAN ORDER LEVEL
  =================================================== */

  note: string;

  created_at?: string;
  updated_at?: string;

  [key: string]: any;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function OrderDetail() {
  const { id } =
    useParams<{
      id: string;
    }>();

  const navigate =
    useNavigate();

  const [order, setOrder] =
    useState<NormalizedOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     FETCH ORDER
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    const fetchOrder = async () => {
      if (!id) {
        if (mounted) {
          setError(
            "Order ID tidak ditemukan."
          );

          setLoading(false);
        }

        return;
      }

      try {
        if (mounted) {
          setLoading(true);
          setError("");
        }

        console.log(
          "========================================"
        );

        console.log(
          "GET ORDER DETAIL"
        );

        console.log(
          "ORDER ID:",
          id
        );

        const response =
          await api.get(
            `/orders/${id}`
          );

        console.log(
          "RAW ORDER DETAIL RESPONSE:",
          response.data
        );

        if (!mounted) {
          return;
        }

        const extracted =
          extractOrder(
            response.data
          );

        console.log(
          "EXTRACTED ORDER:",
          extracted
        );

        if (!extracted) {
          setError(
            "Data pesanan tidak ditemukan."
          );

          return;
        }

        const normalized =
          normalizeOrder(
            extracted
          );

        console.log(
          "NORMALIZED ORDER:",
          normalized
        );

        console.log(
          "ORDER NUMBER:",
          normalized.order_number
        );

        console.log(
          "ITEMS:",
          normalized.items
        );

        console.log(
          "TOTAL:",
          normalized.total_amount
        );

        console.log(
          "PAYMENT METHOD:",
          normalized.payment_method
        );

        console.log(
          "PAYMENT STATUS:",
          normalized.payment_status
        );

        console.log(
          "ORDER STATUS:",
          normalized.status
        );

        console.log(
          "ORDER NOTE:",
          normalized.note
        );

        /* =================================================
           DEBUG CATATAN PER ITEM
        ================================================= */

        normalized.items.forEach(
          (
            item,
            index
          ) => {
            console.log(
              `ITEM ${index + 1} NOTE:`,
              getItemNote(item)
            );
          }
        );

        console.log(
          "========================================"
        );

        setOrder(
          normalized
        );

      } catch (err: any) {
        if (!mounted) {
          return;
        }

        console.error(
          "GAGAL MENGAMBIL DETAIL ORDER:",
          err
        );

        const status =
          err?.response?.status;

        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message;

        if (status === 404) {
          setError(
            "Pesanan tidak ditemukan."
          );
        } else if (status === 401) {
          setError(
            "Sesi login kamu sudah berakhir."
          );
        } else {
          setError(
            message ||
            "Gagal mengambil detail pesanan."
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [id]);

  /* =====================================================
     FORMAT PRICE
  ===================================================== */

  const formatPrice = (
    value: number
  ): string => {
    return Math.round(
      Number(value) || 0
    ).toLocaleString(
      "id-ID"
    );
  };

  /* =====================================================
     ORDER TOTAL
  ===================================================== */

  const orderTotal =
    useMemo(() => {
      if (!order) {
        return 0;
      }

      const backendTotal =
        Number(
          order.total_amount
        );

      if (
        Number.isFinite(
          backendTotal
        ) &&
        backendTotal > 0
      ) {
        return backendTotal;
      }

      return calculateItemsTotal(
        order.items
      );
    }, [order]);

  /* =====================================================
     STATUS LABEL
  ===================================================== */

  const statusLabel = (
    status?: string
  ): string => {
    const normalized =
      normalizeStatus(
        status
      );

    switch (normalized) {
      case "pending":
        return "Menunggu Pembayaran";

      case "waiting_payment":
        return "Menunggu Pembayaran";

      case "waiting_confirmation":
        return "Menunggu Konfirmasi";

      case "paid":
        return "Sudah Dibayar";

      case "processing":
        return "Sedang Diproses";

      case "confirmed":
        return "Pesanan Dikonfirmasi";

      case "ready":
        return "Pesanan Siap";

      case "on_delivery":
        return "Sedang Diantar";

      case "completed":
      case "success":
        return "Selesai";

      case "cancelled":
      case "canceled":
        return "Dibatalkan";

      case "failed":
        return "Gagal";

      case "expired":
        return "Kedaluwarsa";

      default:
        return (
          status?.trim() ||
          "Menunggu"
        );
    }
  };

  /* =====================================================
     PAYMENT METHOD
  ===================================================== */

  const paymentMethodLabel = (
    method?: string
  ): string => {
    const normalized =
      String(method || "")
        .toLowerCase()
        .trim()
        .replace(
          /[-\s]+/g,
          "_"
        );

    switch (normalized) {
      case "qris":
        return "QRIS";

      case "bank_transfer":
      case "transfer_bank":
      case "bank":
        return "Transfer Bank / ATM";

      case "virtual_account":
      case "virtualaccount":
      case "va":
        return "Virtual Account";

      case "cod":
      case "cash_on_delivery":
        return "COD";

      case "paypal":
        return "PayPal";

      default:
        return (
          method?.trim() ||
          "-"
        );
    }
  };

  /* =====================================================
     PAYMENT STATUS
  ===================================================== */

  const paymentStatusLabel = (
    status?: string
  ): string => {
    const normalized =
      normalizePaymentStatus(
        status
      );

    switch (normalized) {
      case "paid":
        return "Berhasil";

      case "failed":
        return "Gagal";

      case "cancelled":
        return "Dibatalkan";

      case "expired":
        return "Kedaluwarsa";

      case "pending":
      default:
        return "Menunggu Pembayaran";
    }
  };

  /* =====================================================
     STATUS ICON
  ===================================================== */

  const renderStatusIcon = () => {
    const status =
      normalizeStatus(
        order?.status
      );

    const paymentStatus =
      normalizePaymentStatus(
        order?.payment_status
      );

    const isCompleted =
      status === "completed" ||
      status === "success";

    const isPaid =
      paymentStatus === "paid";

    const isCancelled =
      status === "cancelled" ||
      status === "canceled" ||
      status === "failed" ||
      status === "expired" ||
      paymentStatus === "failed" ||
      paymentStatus === "cancelled" ||
      paymentStatus === "expired";

    if (
      isCompleted ||
      isPaid
    ) {
      return (
        <CheckCircle2
          size={30}
          strokeWidth={2.2}
        />
      );
    }

    if (isCancelled) {
      return (
        <XCircle
          size={30}
          strokeWidth={2.2}
        />
      );
    }

    return (
      <Clock3
        size={30}
        strokeWidth={2.2}
      />
    );
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="order-detail-loading">

        <div className="order-detail-loading-content">

          <div className="order-detail-spinner" />

          <p>
            Memuat detail pesanan...
          </p>

        </div>

      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error ||
    !order
  ) {
    return (
      <div className="order-detail-page">

        <button
          type="button"
          className="back-order"
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft
            size={18}
          />

          <span>
            Kembali
          </span>

        </button>

        <div className="detail-card order-detail-error-card">

          <div className="status-icon error">
            <XCircle
              size={32}
            />
          </div>

          <h2>
            Gagal Memuat Pesanan
          </h2>

          <p>
            {error ||
              "Data pesanan tidak ditemukan."}
          </p>

          <button
            type="button"
            className="back-to-orders"
            onClick={() =>
              navigate(
                "/orders"
              )
            }
          >
            Kembali ke Pesanan
          </button>

        </div>

      </div>
    );
  }

  /* =====================================================
     ITEMS
  ===================================================== */

  const items =
    Array.isArray(
      order.items
    )
      ? order.items
      : [];

  /* =====================================================
     PAYMENT STATE
  ===================================================== */

  const paymentStatus =
    normalizePaymentStatus(
      order.payment_status
    );

  const orderStatus =
    normalizeStatus(
      order.status
    );

  const isPaid =
    paymentStatus === "paid";

  const isOrderCancelled =
    orderStatus === "cancelled" ||
    orderStatus === "canceled" ||
    orderStatus === "failed" ||
    orderStatus === "expired";

  const canContinuePayment =
    !isPaid &&
    paymentStatus === "pending" &&
    !isOrderCancelled;

  /* =====================================================
     ORDER LEVEL NOTE
  ===================================================== */

  const orderNote =
    String(
      order.note || ""
    ).trim();

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="order-detail-page">

      {/* =================================================
          BACK
      ================================================= */}

      <button
        type="button"
        className="back-order"
        onClick={() =>
          navigate("/orders")
        }
      >
        <ArrowLeft
          size={18}
        />

        <span>
          Kembali
        </span>

      </button>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="detail-header">

        <div className="detail-header-content">

          <span className="detail-header-eyebrow">
            WARTEGKITA
          </span>

          <h1>
            Detail Pesanan
          </h1>

          <p>
            {order.order_number ||
              `Order #${order.id}`}
          </p>

        </div>

        <div className="detail-header-icon">

          <Receipt
            size={30}
          />

        </div>

      </div>


      {/* =================================================
          STATUS
      ================================================= */}

      <div className="status-card">

        <div className="status-icon">
          {renderStatusIcon()}
        </div>

        <div className="status-content">

          <span>
            Status Pesanan
          </span>

          <h3>
            {statusLabel(
              order.status
            )}
          </h3>

        </div>

      </div>


      {/* =================================================
          MENU
      ================================================= */}

      <div className="detail-card">

        <div className="card-title">

          <div className="card-title-icon">

            <ShoppingBag
              size={19}
            />

          </div>

          <h3>
            Daftar Menu
          </h3>

          <span className="item-count">

            {items.length} item
            {items.length !== 1
              ? "s"
              : ""}

          </span>

        </div>


        {items.length > 0 ? (

          <div className="menu-list">

            {items.map(
              (
                item: OrderItem,
                index: number
              ) => {

                const quantity =
                  getItemQuantity(
                    item
                  );

                const price =
                  getBaseItemPrice(
                    item
                  );

                const subtotal =
                  getItemSubtotal(
                    item
                  );

                const menuName =
                  getMenuName(
                    item
                  );

                /*
                 * PENTING:
                 *
                 * Ambil catatan dari ITEM,
                 * bukan cuma order.note.
                 */

                const itemNote =
                  getItemNote(
                    item
                  );

                return (
                  <div
                    className="menu-row-wrapper"
                    key={
                      item?.id ??
                      item?.menu_id ??
                      item?.menuId ??
                      `item-${index}`
                    }
                  >

                    {/* =========================================
                        MENU ROW
                    ========================================= */}

                    <div className="menu-row">

                      <div className="menu-info">

                        <strong>
                          {menuName}
                        </strong>

                        <p>
                          {quantity} × Rp{" "}
                          {formatPrice(
                            price
                          )}
                        </p>

                      </div>

                      <span className="menu-subtotal">

                        Rp{" "}
                        {formatPrice(
                          subtotal
                        )}

                      </span>

                    </div>


                    {/* =========================================
                        ITEM NOTE
                    ========================================= */}

                    {itemNote && (
                      <div className="history-item-note">

                        <div className="history-item-note-icon">

                          <StickyNote
                            size={15}
                          />

                        </div>

                        <div className="history-item-note-content">

                          <span>
                            Catatan menu
                          </span>

                          <p>
                            {itemNote}
                          </p>

                        </div>

                      </div>
                    )}

                  </div>
                );
              }
            )}

          </div>

        ) : (

          <div className="empty-menu">
            Tidak ada detail menu.
          </div>

        )}

      </div>


      {/* =================================================
          ORDER LEVEL NOTE
          
          Ini hanya muncul kalau memang
          backend mengirim catatan order-level.
          
          Catatan per menu TIDAK masuk sini.
      ================================================= */}

      {orderNote && (
        <div className="detail-card order-note-card">

          <div className="card-title">

            <div className="card-title-icon">

              <StickyNote
                size={19}
              />

            </div>

            <h3>
              Catatan Pesanan
            </h3>

          </div>

          <div className="order-note-content">

            <div className="order-note-icon">

              <StickyNote
                size={18}
              />

            </div>

            <div className="order-note-text">

              <span>
                Catatan dari pelanggan
              </span>

              <p>
                {orderNote}
              </p>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          PAYMENT
      ================================================= */}

      <div className="detail-card">

        <div className="card-title">

          <h3>
            Informasi Pembayaran
          </h3>

        </div>


        <div className="payment-info">

          {/* TOTAL */}

          <div className="payment-row">

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


          {/* METHOD */}

          <div className="payment-row">

            <span>
              Metode Pembayaran
            </span>

            <strong>
              {paymentMethodLabel(
                order.payment_method
              )}
            </strong>

          </div>


          {/* STATUS */}

          <div className="payment-row">

            <span>
              Status Pembayaran
            </span>

            <strong
              className={
                paymentStatus ===
                  "paid"
                  ? "payment-status-paid"
                  : paymentStatus ===
                    "failed" ||
                    paymentStatus ===
                    "cancelled" ||
                    paymentStatus ===
                    "expired"
                    ? "payment-status-failed"
                    : "payment-status-pending"
              }
            >
              {paymentStatusLabel(
                order.payment_status
              )}
            </strong>

          </div>

        </div>

      </div>


      {/* =================================================
          TOTAL
      ================================================= */}

      <div className="detail-card total-card">

        <div className="payment-row order-total-row">

          <div>

            <span className="order-total-label">
              Total Pesanan
            </span>

            <small>
              Sudah termasuk seluruh item
            </small>

          </div>

          <strong className="order-total-value">

            Rp{" "}
            {formatPrice(
              orderTotal
            )}

          </strong>

        </div>

      </div>


      {/* =================================================
          CONTINUE PAYMENT
      ================================================= */}

      {canContinuePayment && (
        <button
          type="button"
          className="continue-payment"
          onClick={() =>
            navigate(
              `/payment/${order.id}`
            )
          }
        >
          Lanjutkan Pembayaran
        </button>
      )}


      {/* =================================================
          PAYMENT SUCCESS
      ================================================= */}

      {isPaid && (
        <div className="payment-success-card">

          <div className="payment-success-top">

            <div className="payment-success-icon">

              <CheckCircle2
                size={42}
                strokeWidth={2}
              />

            </div>

            <h3>
              Pembayaran Berhasil
            </h3>

            <p>
              Pembayaran telah diterima.
              Pesanan kamu akan segera
              diproses oleh penjual.
            </p>

          </div>


          <div className="payment-success-info">

            <div className="success-item">

              <span className="success-label">
                Nomor Pesanan
              </span>

              <strong className="success-value">
                {order.order_number}
              </strong>

            </div>


            <div className="success-item">

              <span>
                Status Pesanan
              </span>

              <strong>
                {statusLabel(
                  order.status
                )}
              </strong>

            </div>


            <div className="success-item">

              <span>
                Metode Pembayaran
              </span>

              <strong>
                {paymentMethodLabel(
                  order.payment_method
                )}
              </strong>

            </div>


            <div className="success-item total">

              <span>
                Total Dibayar
              </span>

              <strong>
                Rp{" "}
                {formatPrice(
                  orderTotal
                )}
              </strong>

            </div>

          </div>

        </div>
      )}


      {/* =================================================
          CANCELLED / FAILED
      ================================================= */}

      {!isPaid &&
        (
          paymentStatus ===
          "failed" ||
          paymentStatus ===
          "cancelled" ||
          paymentStatus ===
          "expired" ||
          isOrderCancelled
        ) && (

          <div className="payment-failed-card">

            <div className="payment-failed-icon">

              <XCircle
                size={34}
              />

            </div>

            <div>

              <h3>

                {paymentStatus ===
                  "expired"
                  ? "Pembayaran Kedaluwarsa"
                  : paymentStatus ===
                    "cancelled" ||
                    isOrderCancelled
                    ? "Pesanan Dibatalkan"
                    : "Pembayaran Gagal"}

              </h3>

              <p>
                Pesanan ini tidak dapat
                dilanjutkan ke pembayaran.
              </p>

            </div>

          </div>
        )}

    </div>
  );
}


/* =====================================================
   EXTRACT ORDER
===================================================== */

function extractOrder(
  raw: unknown
): any | null {

  if (
    !raw ||
    typeof raw !==
    "object"
  ) {
    return null;
  }

  const data =
    raw as Record<
      string,
      any
    >;

  /* ---------------------------------------------
     DIRECT ORDER
  --------------------------------------------- */

  if (
    data.id ||
    data.order_id ||
    data.order_number ||
    data.orderNumber
  ) {
    return data;
  }

  /* ---------------------------------------------
     { order: {...} }
  --------------------------------------------- */

  if (
    data.order &&
    typeof data.order ===
    "object"
  ) {
    return extractOrder(
      data.order
    );
  }

  /* ---------------------------------------------
     { data: {...} }
  --------------------------------------------- */

  if (
    data.data &&
    typeof data.data ===
    "object"
  ) {
    return extractOrder(
      data.data
    );
  }

  /* ---------------------------------------------
     { result: {...} }
  --------------------------------------------- */

  if (
    data.result &&
    typeof data.result ===
    "object"
  ) {
    return extractOrder(
      data.result
    );
  }

  return null;
}


/* =====================================================
   NORMALIZE ORDER
===================================================== */

function normalizeOrder(
  raw: any
): NormalizedOrder {

  const id =
    String(
      raw?.id ??
      raw?.order_id ??
      ""
    ).trim();

  const orderNumber =
    String(
      raw?.order_number ??
      raw?.orderNumber ??
      raw?.number ??
      ""
    ).trim();

  const status =
    String(
      raw?.status ??
      raw?.order_status ??
      raw?.orderStatus ??
      "pending"
    ).trim();

  const paymentMethod =
    String(
      raw?.payment_method ??
      raw?.paymentMethod ??
      ""
    ).trim();

  const paymentStatus =
    normalizePaymentStatus(
      raw?.payment_status ??
      raw?.paymentStatus
    );

  const rawItems =
    raw?.items ??
    raw?.order_items ??
    raw?.orderItems ??
    raw?.details ??
    [];

  const items: OrderItem[] =
    Array.isArray(rawItems)
      ? rawItems
      : [];

  /* ===================================================
     NORMALIZE ITEM NOTES
     
     Pastikan setiap item punya
     field `note` yang konsisten.
  =================================================== */

  const normalizedItems =
    items.map(
      (
        item
      ) => {

        const note =
          getItemNote(
            item
          );

        return {
          ...item,
          note,
        };

      }
    );

  /* ===================================================
     TOTAL
  =================================================== */

  const totalCandidates = [
    raw?.total_amount,
    raw?.totalAmount,
    raw?.grand_total,
    raw?.grandTotal,
    raw?.total,
  ];

  let total = 0;

  for (
    const candidate of
    totalCandidates
  ) {

    const parsed =
      Number(candidate);

    if (
      Number.isFinite(
        parsed
      ) &&
      parsed > 0
    ) {
      total =
        parsed;

      break;
    }
  }

  if (
    total <= 0
  ) {
    total =
      calculateItemsTotal(
        normalizedItems
      );
  }

  /* ===================================================
     ORDER LEVEL NOTE
  =================================================== */

  const note =
    String(
      raw?.note ??
      raw?.notes ??
      raw?.order_note ??
      raw?.order_notes ??
      raw?.customer_note ??
      raw?.customer_notes ??
      raw?.catatan ??
      raw?.orderNote ??
      raw?.customerNote ??
      ""
    ).trim();

  return {

    ...raw,

    id,

    order_number:
      orderNumber ||
      (
        id
          ? `Order #${id}`
          : "Order"
      ),

    status,

    payment_method:
      paymentMethod,

    payment_status:
      paymentStatus,

    total_amount:
      total,

    /*
     * IMPORTANT:
     * Gunakan normalizedItems.
     */

    items:
      normalizedItems,

    note,

    created_at:
      raw?.created_at ??
      raw?.createdAt,

    updated_at:
      raw?.updated_at ??
      raw?.updatedAt,
  };
}


/* =====================================================
   GET ITEM NOTE
===================================================== */

/**
 * Catatan di Cart adalah catatan PER MENU.
 *
 * Backend bisa mengirim dengan berbagai
 * nama field tergantung struktur response.
 *
 * Fungsi ini dibuat fleksibel supaya:
 *
 * note
 * notes
 * item_note
 * item_notes
 * menu_note
 * menu_notes
 * customer_note
 * customer_notes
 * catatan
 * catatan_menu
 * itemNote
 * menuNote
 * customerNote
 *
 * semuanya bisa terbaca.
 */
function getItemNote(
  item: OrderItem
): string {

  const candidates = [

    item?.note,

    item?.notes,

    item?.item_note,

    item?.item_notes,

    item?.menu_note,

    item?.menu_notes,

    item?.customer_note,

    item?.customer_notes,

    item?.catatan,

    item?.catatan_menu,

    item?.itemNote,

    item?.menuNote,

    item?.customerNote,

    item?.menu?.note,

    item?.menu?.notes,

    item?.menu?.menu_note,

    item?.menu?.menuNote,

  ];

  for (
    const candidate
    of candidates
  ) {

    if (
      candidate ===
      null ||
      candidate ===
      undefined
    ) {
      continue;
    }

    const value =
      String(
        candidate
      ).trim();

    if (
      value.length > 0
    ) {
      return value;
    }
  }

  return "";
}


/* =====================================================
   NORMALIZE STATUS
===================================================== */

function normalizeStatus(
  value: unknown
): string {

  return String(
    value ?? ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /-/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    );
}


/* =====================================================
   NORMALIZE PAYMENT STATUS
===================================================== */

function normalizePaymentStatus(
  value: unknown
): PaymentStatus {

  const status =
    String(
      value ??
      "pending"
    )
      .toLowerCase()
      .trim()
      .replace(
        /-/g,
        "_"
      )
      .replace(
        /\s+/g,
        "_"
      );

  switch (status) {

    case "paid":
    case "success":
    case "successful":
    case "completed":
      return "paid";

    case "failed":
    case "failure":
      return "failed";

    case "cancelled":
    case "canceled":
    case "cancel":
      return "cancelled";

    case "expired":
    case "expire":
      return "expired";

    case "pending":
    case "waiting":
    case "waiting_payment":
    case "unpaid":
    default:
      return "pending";
  }
}


/* =====================================================
   GET ITEM QUANTITY
===================================================== */

function getItemQuantity(
  item: OrderItem
): number {

  const quantity =
    Number(
      item?.quantity ??
      item?.qty ??
      item?.amount ??
      1
    );

  if (
    !Number.isFinite(
      quantity
    ) ||
    quantity <= 0
  ) {
    return 1;
  }

  return quantity;
}


/* =====================================================
   GET MENU NAME
===================================================== */

function getMenuName(
  item: OrderItem
): string {

  return (
    item?.menu_name ??
    item?.menuName ??
    item?.name ??
    item?.menu?.name ??
    item?.menu?.menu_name ??
    "Menu"
  );
}


/* =====================================================
   BASE ITEM PRICE
===================================================== */

function getBaseItemPrice(
  item: OrderItem
): number {

  const directCandidates = [

    item?.price,

    item?.unit_price,

    item?.unitPrice,

    item?.menu_price,

    item?.menuPrice,

    item?.menu?.price,

    item?.menu?.unit_price,

  ];

  for (
    const candidate of
    directCandidates
  ) {

    const price =
      Number(candidate);

    if (
      Number.isFinite(
        price
      ) &&
      price > 0
    ) {
      return price;
    }
  }

  const subtotal =
    Number(
      item?.subtotal ??
      item?.sub_total ??
      item?.item_total ??
      item?.total ??
      0
    );

  const quantity =
    getItemQuantity(
      item
    );

  if (
    Number.isFinite(
      subtotal
    ) &&
    subtotal > 0 &&
    quantity > 0
  ) {
    return (
      subtotal /
      quantity
    );
  }

  return 0;
}


/* =====================================================
   ITEM SUBTOTAL
===================================================== */

function getItemSubtotal(
  item: OrderItem
): number {

  const subtotalCandidates = [

    item?.subtotal,

    item?.sub_total,

    item?.item_total,

  ];

  for (
    const candidate of
    subtotalCandidates
  ) {

    const subtotal =
      Number(candidate);

    if (
      Number.isFinite(
        subtotal
      ) &&
      subtotal > 0
    ) {
      return subtotal;
    }
  }

  const itemTotal =
    Number(
      item?.total
    );

  const price =
    getBaseItemPrice(
      item
    );

  const quantity =
    getItemQuantity(
      item
    );

  if (
    Number.isFinite(
      itemTotal
    ) &&
    itemTotal > 0 &&
    price <= 0
  ) {
    return itemTotal;
  }

  return (
    price *
    quantity
  );
}


/* =====================================================
   CALCULATE ITEMS TOTAL
===================================================== */

function calculateItemsTotal(
  items: OrderItem[]
): number {

  if (
    !Array.isArray(
      items
    )
  ) {
    return 0;
  }

  return items.reduce(
    (
      total: number,
      item: OrderItem
    ) => {

      return (
        total +
        getItemSubtotal(
          item
        )
      );

    },
    0
  );
}