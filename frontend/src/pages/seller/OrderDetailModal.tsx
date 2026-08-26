import {
    Bell,
    CheckCircle2,
    Package,
    User,
    X,
} from "lucide-react";

import type { ReactNode } from "react";

import "../../styles/seller/OrderDetailModal.css";

/* =====================================================
   TYPES
===================================================== */

export type OrderStatus =
    | "WAITING_CONFIRMATION"
    | "CONFIRMED"
    | "PREPARING"
    | "READY"
    | "ON_DELIVERY"
    | "COMPLETED"
    | "CANCELLED";

export type PaymentStatus =
    | "PENDING"
    | "PAID"
    | "FAILED";

/* =====================================================
   USER
===================================================== */

export interface OrderUser {
    id: string;
    name: string;
    email: string;
}

/* =====================================================
   ORDER ITEM
===================================================== */

export interface OrderItem {
    id: string;
    order_id: string;
    menu_id: string;

    menu_name: string;

    quantity: number;

    price: number;

    /* =================================================
       NOTE UTAMA
    ================================================= */

    note?: string | null;

    /* =================================================
       KEMUNGKINAN NAMA FIELD DARI BACKEND
    ================================================= */

    notes?: string | null;

    item_note?: string | null;

    item_notes?: string | null;

    menu_note?: string | null;

    menu_notes?: string | null;

    customer_note?: string | null;

    customer_notes?: string | null;

    catatan?: string | null;

    catatan_menu?: string | null;

    created_at: string;

    /*
     * Tetap fleksibel kalau backend mengirim
     * field tambahan.
     */
    [key: string]: any;
}

/* =====================================================
   ORDER
===================================================== */

export interface Order {
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

    /*
     * Tetap fleksibel terhadap response backend.
     */
    [key: string]: any;
}

/* =====================================================
   PROPS
===================================================== */

interface OrderDetailModalProps {
    order: Order;

    onClose: () => void;

    onProcess?: (
        order: Order
    ) => void;

    processing?: boolean;

    formatCurrency: (
        value: number
    ) => string;

    getStatusLabel: (
        status: OrderStatus
    ) => string;

    getStatusClass: (
        status: OrderStatus
    ) => string;

    getPaymentLabel: (
        method: string
    ) => string;
}

/* =====================================================
   NORMALIZE NOTE
===================================================== */

function normalizeNote(
    value: unknown
): string {
    if (
        typeof value !== "string"
    ) {
        return "";
    }

    return value
        .trim()
        .slice(0, 200);
}

/* =====================================================
   GET ITEM NOTE
===================================================== */

function getItemNote(
    item: OrderItem
): string {

    if (!item) {
        return "";
    }

    /*
     * Urutan dibuat dari field yang paling
     * umum digunakan sampai alternatif.
     */
    const candidates = [

        /* =============================================
           STANDARD
        ============================================= */

        item.note,

        /* =============================================
           ALTERNATIVE
        ============================================= */

        item.notes,

        item.item_note,

        item.item_notes,

        item.menu_note,

        item.menu_notes,

        item.customer_note,

        item.customer_notes,

        item.catatan,

        item.catatan_menu,

        /* =============================================
           EXTRA BACKEND VARIANTS
        ============================================= */

        item["note_text"],

        item["itemNote"],

        item["itemNotes"],

        item["menuNote"],

        item["menuNotes"],

        item["customerNote"],

        item["customerNotes"],

        item["catatanMenu"],

    ];

    /*
     * Ambil field pertama yang benar-benar
     * memiliki isi.
     */
    for (
        const candidate
        of candidates
    ) {

        const normalized =
            normalizeNote(
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
   GET SAFE QUANTITY
===================================================== */

function getItemQuantity(
    item: OrderItem
): number {

    const quantity =
        Number(
            item?.quantity
        );

    if (
        !Number.isFinite(
            quantity
        ) ||
        quantity < 0
    ) {
        return 0;
    }

    return quantity;
}

/* =====================================================
   GET SAFE PRICE
===================================================== */

function getItemPrice(
    item: OrderItem
): number {

    const price =
        Number(
            item?.price
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
   COMPONENT
===================================================== */

export default function OrderDetailModal({
    order,

    onClose,

    onProcess,

    processing = false,

    formatCurrency,

    getStatusLabel,

    getStatusClass,

    getPaymentLabel,
}: OrderDetailModalProps) {

    /* =================================================
       ESC KEY
    ================================================= */

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLDivElement>
    ) => {

        if (
            event.key === "Escape"
        ) {
            onClose();
        }
    };

    /* =================================================
       SAFE ITEMS
    ================================================= */

    const orderItems =
        Array.isArray(
            order?.items
        )
            ? order.items
            : [];

    /* =================================================
       TOTAL ITEMS
    ================================================= */

    const totalItems =
        orderItems.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    getItemQuantity(
                        item
                    )
                );

            },
            0
        );

    /* =================================================
       PAYMENT CLASS
    ================================================= */

    const paymentClass =
        order.payment_status ===
            "PAID"

            ? "paid"

            : order.payment_status ===
                "FAILED"

                ? "failed"

                : "pending";

    /* =================================================
       RENDER
    ================================================= */

    return (

        <div
            className="order-detail-overlay"

            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }

            }}

            onKeyDown={
                handleKeyDown
            }

            tabIndex={-1}
        >

            <div
                className="order-detail-modal"

                role="dialog"

                aria-modal="true"

                aria-labelledby="order-detail-title"
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="order-detail-header">

                    <div className="order-detail-header-info">

                        <span className="order-detail-kicker">
                            DETAIL PESANAN
                        </span>

                        <h2 id="order-detail-title">

                            {
                                order.order_number ||
                                "Pesanan"
                            }

                        </h2>

                        <p>

                            {order.created_at
                                ? new Date(
                                    order.created_at
                                ).toLocaleString(
                                    "id-ID",
                                    {
                                        dateStyle:
                                            "full",

                                        timeStyle:
                                            "short",
                                    }
                                )
                                : "-"}

                        </p>

                    </div>

                    <button
                        type="button"

                        className="order-detail-close"

                        onClick={
                            onClose
                        }

                        aria-label="Tutup detail pesanan"

                        disabled={
                            processing
                        }
                    >

                        <X size={19} />

                    </button>

                </div>

                {/* =================================================
                    CUSTOMER
                ================================================= */}

                <div className="order-detail-customer">

                    <div className="order-detail-customer-icon">

                        <User size={19} />

                    </div>

                    <div className="order-detail-customer-info">

                        <span>
                            CUSTOMER
                        </span>

                        <strong>

                            {
                                order.user?.name ??
                                "Customer"
                            }

                        </strong>

                        {order.user?.email && (

                            <small>
                                {
                                    order.user.email
                                }
                            </small>

                        )}

                    </div>

                </div>

                {/* =================================================
                    STATUS + PAYMENT
                ================================================= */}

                <div className="order-detail-meta">

                    {/* STATUS */}

                    <div className="order-detail-meta-card">

                        <span>
                            STATUS PESANAN
                        </span>

                        <strong
                            className={`status-badge ${getStatusClass(
                                order.status
                            )}`}
                        >

                            {
                                getStatusLabel(
                                    order.status
                                )
                            }

                        </strong>

                    </div>

                    {/* PAYMENT */}

                    <div className="order-detail-meta-card">

                        <span>
                            PEMBAYARAN
                        </span>

                        <strong
                            className={`payment-badge ${paymentClass}`}
                        >

                            {
                                order.payment_status ===
                                    "PAID"

                                    ? "✓ Dibayar"

                                    : order.payment_status ===
                                        "PENDING"

                                        ? "Menunggu"

                                        : "Gagal"
                            }

                        </strong>

                        <small>

                            {
                                getPaymentLabel(
                                    order.payment_method
                                )
                            }

                        </small>

                    </div>

                </div>

                {/* =================================================
                    MENU SECTION
                ================================================= */}

                <section className="order-detail-section">

                    <div className="order-detail-section-header">

                        <div>

                            <h3>
                                Detail Menu
                            </h3>

                            <span>

                                {totalItems} item
                                {totalItems !== 1
                                    ? "s"
                                    : ""}

                            </span>

                        </div>

                    </div>

                    {/* =================================================
                        ITEMS
                    ================================================= */}

                    <div className="order-detail-items">

                        {orderItems.length >
                            0 ? (

                            orderItems.map(
                                (
                                    item,
                                    index
                                ) => {

                                    /* =================================
                                       SAFE DATA
                                    ================================= */

                                    const itemNote =
                                        getItemNote(
                                            item
                                        );

                                    const quantity =
                                        getItemQuantity(
                                            item
                                        );

                                    const price =
                                        getItemPrice(
                                            item
                                        );

                                    const itemSubtotal =
                                        price *
                                        quantity;

                                    const itemKey =
                                        item.id ||
                                        `${item.menu_id}-${index}`;

                                    return (

                                        <div
                                            key={
                                                itemKey
                                            }

                                            className="order-detail-item"
                                        >

                                            {/* =================================
                                                ITEM HEADER
                                            ================================= */}

                                            <div className="order-detail-item-top">

                                                <div className="order-detail-item-name">

                                                    <span className="order-detail-quantity">

                                                        {quantity}x

                                                    </span>

                                                    <div>

                                                        <strong>

                                                            {
                                                                item.menu_name ||
                                                                "Menu"
                                                            }

                                                        </strong>

                                                        <small>

                                                            Rp{" "}

                                                            {
                                                                formatCurrency(
                                                                    price
                                                                )
                                                            }

                                                            {" "} / item

                                                        </small>

                                                    </div>

                                                </div>

                                                <strong className="order-detail-item-price">

                                                    Rp{" "}

                                                    {
                                                        formatCurrency(
                                                            itemSubtotal
                                                        )
                                                    }

                                                </strong>

                                            </div>

                                            {/* =================================
                                                CUSTOMER NOTE
                                            ================================= */}

                                            {itemNote ? (

                                                <div className="order-detail-note">

                                                    <div className="order-detail-note-icon">

                                                        <Bell
                                                            size={15}
                                                        />

                                                    </div>

                                                    <div className="order-detail-note-content">

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

                                                </div>

                                            ) : (

                                                <div className="order-detail-no-note">

                                                    Tidak ada catatan untuk
                                                    menu ini.

                                                </div>

                                            )}

                                        </div>

                                    );

                                }
                            )

                        ) : (

                            <div className="order-detail-empty">

                                <Package
                                    size={24}
                                />

                                <span>
                                    Detail menu belum
                                    tersedia.
                                </span>

                            </div>

                        )}

                    </div>

                </section>

                {/* =================================================
                    TOTAL
                ================================================= */}

                <div className="order-detail-total">

                    <div>

                        <span>
                            Total Pesanan
                        </span>

                        <small>
                            {totalItems} item
                        </small>

                    </div>

                    <strong>

                        Rp{" "}

                        {
                            formatCurrency(
                                Number(
                                    order.total_amount ||
                                    0
                                )
                            )
                        }

                    </strong>

                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="order-detail-footer">

                    <button
                        type="button"

                        className="order-detail-close-btn"

                        onClick={
                            onClose
                        }

                        disabled={
                            processing
                        }
                    >

                        Tutup

                    </button>

                    {/* =============================================
                        PROCESS ORDER
                    ============================================= */}

                    {order.status ===
                        "WAITING_CONFIRMATION" &&

                        order.payment_status ===
                        "PAID" &&

                        onProcess && (

                            <button
                                type="button"

                                className="order-detail-process-btn"

                                onClick={() =>
                                    onProcess(
                                        order
                                    )
                                }

                                disabled={
                                    processing
                                }
                            >

                                {processing ? (

                                    <>

                                        <span className="order-detail-spinner" />

                                        Memproses...

                                    </>

                                ) : (

                                    <>

                                        <CheckCircle2
                                            size={16}
                                        />

                                        Proses Pesanan

                                    </>

                                )}

                            </button>

                        )}

                </div>

            </div>

        </div>
    );
}