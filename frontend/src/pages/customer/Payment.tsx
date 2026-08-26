import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    Clock3,
    CreditCard,
    PackageCheck,
    QrCode,
    ShoppingBag,
    XCircle,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import api from "../../services/api";

import {
    useCartStore,
} from "../../store/cartStore";

import QRISPayment
    from "./Payment/QRISPayment";

import BankTransferPayment
    from "./Payment/BankTransferPayment";

import VirtualAccountPayment
    from "./Payment/VirtualAccountPayment";

import "../../styles/payment.css";

/* =====================================================
   TYPES
===================================================== */

type PaymentMethod =
    | "qris"
    | "bank_transfer"
    | "virtual_account";

type PaymentStatus =
    | "pending"
    | "paid"
    | "success"
    | "failed"
    | "cancelled"
    | "expired";

interface OrderItem {
    id?: string;
    menu_id?: string;

    menu_name?: string;
    menuName?: string;

    quantity?: number;
    price?: number;
    subtotal?: number;

    menu?: {
        id?: string;
        name?: string;
        price?: number;
    };
}

interface Order {
    id?: string;
    order_id?: string;

    order_number?: string;
    orderNumber?: string;

    user_id?: string;
    userId?: string;

    seller_id?: string;
    sellerId?: string;

    payment_method?: string;
    paymentMethod?: string;

    total_amount?: number;
    totalAmount?: number;

    payment_status?: string;
    paymentStatus?: string;

    status?: string;
    order_status?: string;
    orderStatus?: string;

    items?: OrderItem[];

    created_at?: string;
    createdAt?: string;

    updated_at?: string;
    updatedAt?: string;

    message?: string;
}

interface ApiErrorResponse {
    response?: {
        status?: number;

        data?: {
            error?: string;
            message?: string;
            details?: string;
        };
    };
}

/* =====================================================
   CONSTANT
===================================================== */

const PAYMENT_DURATION_MS =
    15 * 60 * 1000;


/* =====================================================
   HELPERS
===================================================== */

/**
 * Mengambil object order dari berbagai kemungkinan
 * bentuk response backend.
 *
 * Bisa:
 *
 * {
 *   id: "...",
 *   ...
 * }
 *
 * atau:
 *
 * {
 *   data: {
 *     id: "...",
 *   }
 * }
 *
 * atau:
 *
 * {
 *   order: {
 *     id: "...",
 *   }
 * }
 *
 * atau:
 *
 * {
 *   result: {
 *     id: "...",
 *   }
 * }
 */
function extractOrder(
    payload: unknown,
): Record<string, any> | null {

    if (
        !payload ||
        typeof payload !== "object"
    ) {
        return null;
    }

    const value =
        payload as Record<
            string,
            any
        >;

    if (
        value.data &&
        typeof value.data === "object" &&
        !Array.isArray(value.data)
    ) {
        return value.data;
    }

    if (
        value.order &&
        typeof value.order === "object" &&
        !Array.isArray(value.order)
    ) {
        return value.order;
    }

    if (
        value.result &&
        typeof value.result === "object" &&
        !Array.isArray(value.result)
    ) {
        return value.result;
    }

    /*
     * Kalau object langsung sudah memiliki
     * field order, anggap sebagai order.
     */
    if (
        value.id ||
        value.order_id ||
        value.order_number ||
        value.orderNumber
    ) {
        return value;
    }

    return null;
}


/* =====================================================
   NORMALIZE ORDER
===================================================== */

function normalizeOrder(
    raw: Record<string, any>,
): Order {

    const rawItems =
        Array.isArray(
            raw.items,
        )
            ? raw.items
            : Array.isArray(
                raw.order_items,
            )
                ? raw.order_items
                : [];

    const items: OrderItem[] =
        rawItems.map(
            (
                item: any,
            ): OrderItem => {

                return {

                    id:
                        item?.id ??
                        item?.order_item_id,

                    menu_id:
                        item?.menu_id ??
                        item?.menuId ??
                        item?.menu?.id,

                    menu_name:
                        item?.menu_name ??
                        item?.menuName ??
                        item?.nama_menu ??
                        item?.menu?.name,

                    menuName:
                        item?.menuName ??
                        item?.menu_name ??
                        item?.nama_menu ??
                        item?.menu?.name,

                    quantity:
                        Number(
                            item?.quantity ??
                            item?.qty ??
                            0,
                        ),

                    price:
                        Number(
                            item?.price ??
                            item?.harga ??
                            item?.menu?.price ??
                            0,
                        ),

                    subtotal:
                        Number(
                            item?.subtotal ??
                            item?.total ??
                            0,
                        ),

                    menu:
                        item?.menu
                            ? {
                                id:
                                    item.menu.id,

                                name:
                                    item.menu.name ??
                                    item.menu.nama_menu,

                                price:
                                    Number(
                                        item.menu.price ??
                                        item.menu.harga ??
                                        0,
                                    ),
                            }
                            : undefined,
                };
            },
        );

    const totalRaw =
        raw.total_amount ??
        raw.totalAmount ??
        raw.total ??
        raw.grand_total ??
        raw.grandTotal;

    const parsedTotal =
        Number(
            totalRaw,
        );

    const createdAt =
        raw.created_at ??
        raw.createdAt ??
        raw.created ??
        "";

    const updatedAt =
        raw.updated_at ??
        raw.updatedAt ??
        "";

    return {

        id:
            raw.id ??
            raw.order_id,

        order_id:
            raw.order_id ??
            raw.id,

        order_number:
            raw.order_number ??
            raw.orderNumber ??
            raw.number ??
            raw.order_no,

        orderNumber:
            raw.orderNumber ??
            raw.order_number ??
            raw.number ??
            raw.order_no,

        user_id:
            raw.user_id ??
            raw.userId,

        userId:
            raw.userId ??
            raw.user_id,

        seller_id:
            raw.seller_id ??
            raw.sellerId,

        sellerId:
            raw.sellerId ??
            raw.seller_id,

        payment_method:
            raw.payment_method ??
            raw.paymentMethod ??
            raw.payment_type ??
            raw.paymentType,

        paymentMethod:
            raw.paymentMethod ??
            raw.payment_method ??
            raw.payment_type ??
            raw.paymentType,

        total_amount:
            Number.isFinite(
                parsedTotal,
            )
                ? parsedTotal
                : undefined,

        totalAmount:
            Number.isFinite(
                parsedTotal,
            )
                ? parsedTotal
                : undefined,

        payment_status:
            raw.payment_status ??
            raw.paymentStatus ??
            raw.payment_state ??
            raw.paymentState ??
            "PENDING",

        paymentStatus:
            raw.paymentStatus ??
            raw.payment_status ??
            raw.payment_state ??
            raw.paymentState ??
            "PENDING",

        status:
            raw.status ??
            raw.order_status ??
            raw.orderStatus,

        order_status:
            raw.order_status ??
            raw.status ??
            raw.orderStatus,

        orderStatus:
            raw.orderStatus ??
            raw.status ??
            raw.order_status,

        items,

        created_at:
            createdAt,

        createdAt,

        updated_at:
            updatedAt,

        updatedAt,

        message:
            raw.message,
    };
}


/* =====================================================
   NORMALIZE PAYMENT STATUS
===================================================== */

function normalizePaymentStatus(
    value?: string | null,
): PaymentStatus {

    const status =
        String(
            value ?? "",
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s-]+/g,
                "_",
            );

    switch (
    status
    ) {

        case "paid":
        case "success":
        case "successful":
        case "completed":
        case "complete":
            return "paid";

        case "failed":
        case "failure":
        case "error":
            return "failed";

        case "cancelled":
        case "canceled":
        case "cancel":
            return "cancelled";

        case "expired":
        case "expire":
        case "timeout":
        case "timed_out":
            return "expired";

        case "pending":
        case "waiting":
        case "unpaid":
        case "waiting_payment":
        case "awaiting_payment":
        default:
            return "pending";
    }
}


/* =====================================================
   NORMALIZE PAYMENT METHOD
===================================================== */

function normalizePaymentMethod(
    value?: string | null,
): PaymentMethod | null {

    const method =
        String(
            value ?? "",
        )
            .trim()
            .toLowerCase()
            .replace(
                /[\s-]+/g,
                "_",
            );

    switch (
    method
    ) {

        case "qris":
        case "qr":
        case "qr_code":
            return "qris";

        case "bank_transfer":
        case "banktransfer":
        case "transfer":
        case "bank":
            return "bank_transfer";

        case "virtual_account":
        case "virtualaccount":
        case "va":
            return "virtual_account";

        default:
            return null;
    }
}


/* =====================================================
   PAYMENT LABEL
===================================================== */

function getPaymentMethodLabel(
    method:
        PaymentMethod | null,
): string {

    switch (
    method
    ) {

        case "qris":
            return "QRIS";

        case "bank_transfer":
            return "Transfer Bank";

        case "virtual_account":
            return "Virtual Account";

        default:
            return "Tidak diketahui";
    }
}


/* =====================================================
   PAYMENT ICON
===================================================== */

function getPaymentIcon(
    method:
        PaymentMethod | null,
) {

    switch (
    method
    ) {

        case "qris":
            return (
                <QrCode
                    size={24}
                />
            );

        case "bank_transfer":
            return (
                <Building2
                    size={24}
                />
            );

        case "virtual_account":
            return (
                <CreditCard
                    size={24}
                />
            );

        default:
            return (
                <CreditCard
                    size={24}
                />
            );
    }
}


/* =====================================================
   RUPIAH
===================================================== */

function formatRupiah(
    value: number,
): string {

    const amount =
        Number(
            value,
        );

    if (
        !Number.isFinite(
            amount,
        )
    ) {
        return "Rp 0";
    }

    return `Rp ${amount.toLocaleString(
        "id-ID",
    )}`;
}


/* =====================================================
   PAYMENT
===================================================== */

export default function Payment() {

    const navigate =
        useNavigate();

    const {
        orderId,
    } =
        useParams<{
            orderId: string;
        }>();


    /* =================================================
       STATE
    ================================================= */

    const [
        order,
        setOrder,
    ] = useState<Order | null>(
        null,
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        processing,
        setProcessing,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        paymentStatus,
        setPaymentStatus,
    ] = useState<PaymentStatus>(
        "pending",
    );


    const [
        copied,
        setCopied,
    ] = useState(false);


    const [
        paymentDeadline,
        setPaymentDeadline,
    ] = useState<number | null>(
        null,
    );


    const [
        remainingSeconds,
        setRemainingSeconds,
    ] = useState(0);


    /* =================================================
       LOAD ORDER
    ================================================= */

    const loadOrder =
        useCallback(
            async () => {

                if (!orderId) {

                    setError(
                        "Order ID tidak ditemukan.",
                    );

                    setLoading(
                        false,
                    );

                    return;
                }


                try {

                    setLoading(
                        true,
                    );

                    setError("");


                    console.log(
                        "========================================",
                    );

                    console.log(
                        "PAYMENT - LOADING ORDER",
                    );

                    console.log(
                        "ORDER ID:",
                        orderId,
                    );


                    const response =
                        await api.get(
                            `/orders/${orderId}`,
                        );


                    console.log(
                        "PAYMENT - RAW RESPONSE:",
                        response?.data,
                    );


                    const orderData =
                        extractOrder(
                            response?.data,
                        );


                    console.log(
                        "PAYMENT - EXTRACTED ORDER:",
                        orderData,
                    );


                    if (!orderData) {

                        setOrder(
                            null,
                        );

                        setError(
                            "Data pesanan tidak ditemukan dari server.",
                        );

                        return;
                    }


                    const normalizedOrder =
                        normalizeOrder(
                            orderData,
                        );


                    console.log(
                        "PAYMENT - NORMALIZED ORDER:",
                        normalizedOrder,
                    );


                    setOrder(
                        normalizedOrder,
                    );


                    const normalizedStatus =
                        normalizePaymentStatus(
                            normalizedOrder.payment_status,
                        );


                    setPaymentStatus(
                        normalizedStatus,
                    );


                    /* =================================
                       PAID
                    ================================= */

                    if (
                        normalizedStatus ===
                        "paid"
                    ) {

                        setPaymentDeadline(
                            null,
                        );

                        setRemainingSeconds(
                            0,
                        );

                        return;
                    }


                    /* =================================
                       FAILED / CANCELLED / EXPIRED
                    ================================= */

                    if (
                        normalizedStatus ===
                        "failed" ||
                        normalizedStatus ===
                        "cancelled" ||
                        normalizedStatus ===
                        "expired"
                    ) {

                        setPaymentDeadline(
                            null,
                        );

                        setRemainingSeconds(
                            0,
                        );

                        return;
                    }


                    /* =================================
                       DEADLINE
                    ================================= */

                    let deadline =
                        Date.now() +
                        PAYMENT_DURATION_MS;


                    if (
                        normalizedOrder.created_at
                    ) {

                        const createdAt =
                            new Date(
                                normalizedOrder.created_at,
                            ).getTime();


                        if (
                            Number.isFinite(
                                createdAt,
                            )
                        ) {

                            deadline =
                                createdAt +
                                PAYMENT_DURATION_MS;
                        }
                    }


                    setPaymentDeadline(
                        deadline,
                    );


                    const difference =
                        deadline -
                        Date.now();


                    if (
                        difference <=
                        0
                    ) {

                        setRemainingSeconds(
                            0,
                        );

                        setPaymentStatus(
                            "expired",
                        );

                    } else {

                        setRemainingSeconds(
                            Math.ceil(
                                difference /
                                1000,
                            ),
                        );

                    }

                } catch (
                err: unknown
                ) {

                    console.error(
                        "PAYMENT LOAD FAILED:",
                        err,
                    );


                    const axiosError =
                        err as ApiErrorResponse;


                    const status =
                        axiosError
                            .response
                            ?.status;


                    const data =
                        axiosError
                            .response
                            ?.data;


                    if (
                        status ===
                        404
                    ) {

                        setOrder(
                            null,
                        );

                        setError(
                            "Pesanan tidak ditemukan.",
                        );

                        return;
                    }


                    if (
                        status ===
                        401
                    ) {

                        setOrder(
                            null,
                        );

                        setError(
                            "Sesi login kamu sudah berakhir.",
                        );

                        return;
                    }


                    if (
                        data?.error
                    ) {

                        setError(
                            data.error,
                        );

                        return;
                    }


                    if (
                        data?.message
                    ) {

                        setError(
                            data.message,
                        );

                        return;
                    }


                    setError(
                        "Gagal mengambil data pesanan.",
                    );

                } finally {

                    setLoading(
                        false,
                    );
                }

            },
            [orderId],
        );


    /* =================================================
       INITIAL LOAD
    ================================================= */

    useEffect(
        () => {

            loadOrder();

        },
        [
            loadOrder,
        ],
    );


    /* =================================================
       PAYMENT METHOD
    ================================================= */

    const paymentMethod =
        normalizePaymentMethod(
            order?.payment_method ??
            order?.paymentMethod,
        );


    /* =================================================
       TOTAL
    ================================================= */

    const totalAmount =
        useMemo(
            () => {

                if (!order) {
                    return 0;
                }


                if (
                    typeof order.total_amount ===
                    "number" &&
                    Number.isFinite(
                        order.total_amount,
                    )
                ) {

                    return order.total_amount;
                }


                if (
                    order.total_amount !==
                    undefined &&
                    order.total_amount !==
                    null
                ) {

                    const parsed =
                        Number(
                            order.total_amount,
                        );


                    if (
                        Number.isFinite(
                            parsed,
                        )
                    ) {

                        return parsed;
                    }
                }


                if (
                    typeof order.totalAmount ===
                    "number" &&
                    Number.isFinite(
                        order.totalAmount,
                    )
                ) {

                    return order.totalAmount;
                }


                return (
                    order.items?.reduce(
                        (
                            total,
                            item,
                        ) => {

                            const price =
                                Number(
                                    item.price ??
                                    item.menu?.price ??
                                    0,
                                );


                            const quantity =
                                Number(
                                    item.quantity ??
                                    0,
                                );


                            if (
                                !Number.isFinite(
                                    price,
                                ) ||
                                !Number.isFinite(
                                    quantity,
                                )
                            ) {

                                return total;
                            }


                            return (
                                total +
                                price *
                                quantity
                            );

                        },
                        0,
                    ) ?? 0
                );

            },
            [order],
        );


    /* =================================================
       PAYMENT METHOD LABEL
    ================================================= */

    const paymentMethodLabel =
        getPaymentMethodLabel(
            paymentMethod,
        );


    /* =================================================
       LIVE COUNTDOWN
    ================================================= */

    useEffect(
        () => {

            if (
                paymentDeadline ===
                null
            ) {
                return;
            }


            if (
                paymentStatus !==
                "pending"
            ) {
                return;
            }


            const updateTimer =
                () => {

                    const difference =
                        paymentDeadline -
                        Date.now();


                    if (
                        difference <=
                        0
                    ) {

                        setRemainingSeconds(
                            0,
                        );

                        setPaymentStatus(
                            "expired",
                        );

                        setError(
                            "Waktu pembayaran 15 menit telah habis.",
                        );

                        return;
                    }


                    setRemainingSeconds(
                        Math.ceil(
                            difference /
                            1000,
                        ),
                    );
                };


            updateTimer();


            const timer =
                window.setInterval(
                    updateTimer,
                    1000,
                );


            return () => {

                window.clearInterval(
                    timer,
                );

            };

        },
        [
            paymentDeadline,
            paymentStatus,
        ],
    );


    /* =================================================
       TIMER FORMAT
    ================================================= */

    const formatCountdown =
        (
            seconds: number,
        ): string => {

            if (
                !Number.isFinite(
                    seconds,
                ) ||
                seconds <= 0
            ) {

                return "00:00";
            }


            const safeSeconds =
                Math.floor(
                    seconds,
                );


            const minutes =
                Math.floor(
                    safeSeconds /
                    60,
                );


            const remaining =
                safeSeconds %
                60;


            return `${String(
                minutes,
            ).padStart(
                2,
                "0",
            )}:${String(
                remaining,
            ).padStart(
                2,
                "0",
            )}`;

        };


    const countdownText =
        formatCountdown(
            remainingSeconds,
        );


    /* =================================================
       TIMER URGENCY
    ================================================= */

    const timerUrgent =
        remainingSeconds > 0 &&
        remainingSeconds <= 60;


    /* =================================================
       COPY
    ================================================= */

    const handleCopy =
        async (
            value: string,
        ) => {

            try {

                await navigator
                    .clipboard
                    .writeText(
                        value,
                    );


                setCopied(
                    true,
                );


                window.setTimeout(
                    () => {

                        setCopied(
                            false,
                        );

                    },
                    1800,
                );

            } catch (
            copyError
            ) {

                console.error(
                    "COPY FAILED:",
                    copyError,
                );

            }

        };


    /* =================================================
       RETRY
    ================================================= */

    const handleRetry =
        useCallback(
            async () => {

                setError("");

                await loadOrder();

            },
            [
                loadOrder,
            ],
        );


    /* =================================================
       PAYMENT
    ================================================= */

    const handlePayment =
        async () => {

            if (!orderId) {
                return;
            }


            if (
                paymentStatus ===
                "paid" ||
                paymentStatus ===
                "success"
            ) {

                navigate(
                    `/orders/${orderId}`,
                );

                return;
            }


            if (
                paymentStatus ===
                "expired"
            ) {

                setError(
                    "Waktu pembayaran 15 menit telah habis.",
                );

                return;
            }


            if (
                remainingSeconds <=
                0
            ) {

                setPaymentStatus(
                    "expired",
                );

                setError(
                    "Waktu pembayaran 15 menit telah habis.",
                );

                return;
            }


            if (
                processing
            ) {
                return;
            }


            if (
                !paymentMethod
            ) {

                setError(
                    "Metode pembayaran pesanan tidak ditemukan.",
                );

                return;
            }


            try {

                setProcessing(
                    true,
                );

                setError("");


                console.log(
                    "========================================",
                );

                console.log(
                    "PROCESS PAYMENT",
                );

                console.log(
                    "ORDER ID:",
                    orderId,
                );

                console.log(
                    "PAYMENT METHOD:",
                    paymentMethod,
                );

                console.log(
                    "TOTAL:",
                    totalAmount,
                );


                const response =
                    await api.put(
                        `/orders/${orderId}/pay`,
                        {
                            payment_method:
                                paymentMethod,
                        },
                    );


                console.log(
                    "PAYMENT RESPONSE:",
                    response?.data,
                );


                /*
                 * Backend adalah sumber kebenaran.
                 * Setelah endpoint pay berhasil,
                 * ambil ulang order.
                 */

                await loadOrder();

            } catch (
            paymentError: unknown
            ) {

                console.error(
                    "PAYMENT FAILED:",
                    paymentError,
                );


                const axiosError =
                    paymentError as ApiErrorResponse;


                const status =
                    axiosError
                        .response
                        ?.status;


                const data =
                    axiosError
                        .response
                        ?.data;


                if (
                    status ===
                    404
                ) {

                    setPaymentStatus(
                        "failed",
                    );

                    setError(
                        data?.error ??
                        data?.message ??
                        "Endpoint pembayaran atau pesanan tidak ditemukan.",
                    );

                    return;
                }


                if (
                    status ===
                    401
                ) {

                    setError(
                        "Sesi login kamu sudah berakhir.",
                    );

                    return;
                }


                if (
                    status ===
                    409
                ) {

                    await loadOrder();

                    return;
                }


                if (
                    data?.error
                ) {

                    setPaymentStatus(
                        "failed",
                    );

                    setError(
                        data.error,
                    );

                    return;
                }


                if (
                    data?.message
                ) {

                    setPaymentStatus(
                        "failed",
                    );

                    setError(
                        data.message,
                    );

                    return;
                }


                setPaymentStatus(
                    "failed",
                );

                setError(
                    "Pembayaran gagal diproses. Silakan coba lagi.",
                );

            } finally {

                setProcessing(
                    false,
                );

            }

        };


    /* =================================================
       BACK
    ================================================= */

    const handleBack =
        () => {

            if (
                processing
            ) {
                return;
            }


            navigate(
                "/checkout",
            );

        };


    /* =================================================
       VIEW ORDER
    ================================================= */

    const handleViewOrder =
        () => {

            if (!orderId) {
                return;
            }


            navigate(
                `/orders/${orderId}`,
            );

        };


    /* =================================================
       LOADING
    ================================================= */

    if (loading) {

        return (

            <div className="payment-page">

                <div className="payment-loading">

                    <div className="payment-loading-spinner" />

                    <h2>
                        Memuat pembayaran...
                    </h2>

                    <p>
                        Tunggu sebentar, kami sedang
                        mengambil detail pesananmu.
                    </p>

                </div>

            </div>

        );

    }


    /* =================================================
       ORDER ERROR
    ================================================= */

    if (
        error &&
        !order
    ) {

        return (

            <div className="payment-page">

                <div className="payment-error">

                    <div className="payment-error-icon">
                        <XCircle size={40} />
                    </div>

                    <h1>
                        Pesanan Tidak Ditemukan
                    </h1>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        className="payment-primary-button"
                        onClick={() =>
                            navigate(
                                "/cart",
                            )
                        }
                    >
                        Kembali
                    </button>

                </div>

            </div>

        );

    }


    /* =================================================
       NO ORDER
    ================================================= */

    if (!order) {

        return (

            <div className="payment-page">

                <div className="payment-error">

                    <div className="payment-error-icon">
                        <XCircle size={40} />
                    </div>

                    <h1>
                        Pesanan Tidak Ditemukan
                    </h1>

                    <p>
                        Data pesanan tidak dapat ditemukan.
                    </p>

                    <button
                        type="button"
                        className="payment-primary-button"
                        onClick={() =>
                            navigate(
                                "/cart",
                            )
                        }
                    >
                        Kembali
                    </button>

                </div>

            </div>

        );

    }


    /* =================================================
       PAYMENT METHOD MISSING
    ================================================= */

    if (
        !paymentMethod
    ) {

        return (

            <div className="payment-page">

                <div className="payment-error">

                    <div className="payment-error-icon">
                        <XCircle size={40} />
                    </div>

                    <h1>
                        Metode Pembayaran Tidak Ditemukan
                    </h1>

                    <p>
                        Metode pembayaran dari pesanan
                        tidak tersedia. Silakan kembali
                        ke checkout dan pilih metode
                        pembayaran.
                    </p>

                    <button
                        type="button"
                        className="payment-primary-button"
                        onClick={() =>
                            navigate(
                                "/checkout",
                            )
                        }
                    >
                        Kembali ke Checkout
                    </button>

                </div>

            </div>

        );

    }


    /* =================================================
       PAID
    ================================================= */

    if (
        paymentStatus ===
        "paid" ||
        paymentStatus ===
        "success"
    ) {

        return (

            <div className="payment-page">

                <div className="payment-success">

                    <div className="payment-success-icon">
                        <CheckCircle2 size={48} />
                    </div>

                    <span className="payment-success-label">
                        PEMBAYARAN BERHASIL
                    </span>

                    <h1>
                        Pesanan Berhasil Dibayar
                    </h1>

                    <p>
                        Pembayaran untuk pesanan{" "}
                        <strong>
                            {
                                order.order_number ??
                                order.orderNumber ??
                                order.id
                            }
                        </strong>{" "}
                        telah berhasil.
                    </p>

                    <div className="payment-success-total">

                        <span>
                            Total Pembayaran
                        </span>

                        <strong>
                            {formatRupiah(
                                totalAmount,
                            )}
                        </strong>

                    </div>

                    <button
                        type="button"
                        className="payment-primary-button"
                        onClick={
                            handleViewOrder
                        }
                    >
                        <PackageCheck
                            size={19}
                        />

                        Lihat Pesanan
                    </button>

                    <button
                        type="button"
                        className="payment-secondary-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Kembali ke Beranda
                    </button>

                </div>

            </div>

        );

    }


    /* =================================================
       EXPIRED
    ================================================= */

    if (
        paymentStatus ===
        "expired"
    ) {

        return (

            <div className="payment-page">

                <div className="payment-error">

                    <div className="payment-error-icon">
                        <Clock3 size={40} />
                    </div>

                    <span className="payment-status-label">
                        WAKTU HABIS
                    </span>

                    <h1>
                        Pembayaran Kedaluwarsa
                    </h1>

                    <p>
                        Waktu pembayaran untuk pesanan{" "}
                        <strong>
                            {
                                order.order_number ??
                                order.orderNumber ??
                                order.id
                            }
                        </strong>{" "}
                        telah habis setelah 15 menit.
                    </p>

                    <p>
                        Silakan buat pesanan baru
                        jika kamu masih ingin melakukan
                        pembelian.
                    </p>

                    <button
                        type="button"
                        className="payment-primary-button"
                        onClick={() =>
                            navigate(
                                "/checkout",
                            )
                        }
                    >
                        Kembali ke Checkout
                    </button>

                    <button
                        type="button"
                        className="payment-secondary-button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Kembali ke Beranda
                    </button>

                </div>

            </div>

        );

    }


    /* =================================================
       FAILED / CANCELLED
    ================================================= */

    if (
        paymentStatus ===
        "failed" ||
        paymentStatus ===
        "cancelled"
    ) {

        return (

            <div className="payment-page">

                <div className="payment-error">

                    <div className="payment-error-icon">
                        <XCircle size={40} />
                    </div>

                    <span className="payment-status-label">
                        PEMBAYARAN GAGAL
                    </span>

                    <h1>
                        Pembayaran Tidak Berhasil
                    </h1>

                    <p>
                        Pembayaran untuk pesananmu
                        tidak dapat diproses.
                    </p>

                    {error && (

                        <p>
                            {error}
                        </p>

                    )}

                    <button
                        type="button"
                        className="payment-primary-button"
                        onClick={
                            handleRetry
                        }
                    >
                        Coba Lagi
                    </button>

                    <button
                        type="button"
                        className="payment-secondary-button"
                        onClick={
                            handleBack
                        }
                    >
                        Kembali
                    </button>

                </div>

            </div>

        );

    }


    /* =================================================
       MAIN PAYMENT
    ================================================= */

    return (

        <div className="payment-page">

            {/* =================================================
                TOP
            ================================================= */}

            <div className="payment-top">

                <button
                    type="button"
                    className="back-button"
                    onClick={
                        handleBack
                    }
                    disabled={
                        processing
                    }
                >
                    <ArrowLeft
                        size={19}
                    />

                    <span>
                        Kembali
                    </span>

                </button>

            </div>


            {/* =================================================
                HERO
            ================================================= */}

            <section className="payment-hero">

                <div className="payment-hero-content">

                    <h1>
                        Selesaikan Pembayaran
                    </h1>

                    <p>
                        Gunakan metode{" "}
                        <strong>
                            {
                                paymentMethodLabel
                            }
                        </strong>{" "}
                        yang kamu pilih saat checkout.
                    </p>

                </div>


                <div className="payment-progress">

                    <div className="payment-progress-step done">

                        <div className="payment-step-circle">
                            ✓
                        </div>

                        <span>
                            Keranjang
                        </span>

                    </div>


                    <div className="payment-progress-line done" />


                    <div className="payment-progress-step done">

                        <div className="payment-step-circle">
                            ✓
                        </div>

                        <span>
                            Checkout
                        </span>

                    </div>


                    <div className="payment-progress-line active" />


                    <div className="payment-progress-step active">

                        <div className="payment-step-circle">
                            3
                        </div>

                        <span>
                            Pembayaran
                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                COUNTDOWN
            ================================================= */}

            <section
                className={
                    `payment-countdown ${timerUrgent
                        ? "payment-countdown-urgent"
                        : ""
                    }`
                }
            >

                <div className="payment-countdown-icon">
                    <Clock3
                        size={22}
                    />
                </div>


                <div className="payment-countdown-content">

                    <span>
                        Batas Waktu Pembayaran
                    </span>

                    <strong>
                        {countdownText}
                    </strong>

                </div>


                <div className="payment-countdown-info">
                    Selesaikan pembayaran
                    sebelum waktu habis.
                </div>

            </section>


            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="payment-layout">

                {/* =================================================
                    LEFT
                ================================================= */}

                <main className="payment-main">

                    {/* =================================================
                        METHOD
                    ================================================= */}

                    <section className="payment-card">

                        <div className="payment-card-header">

                            <div className="payment-card-number">
                                1
                            </div>


                            <div>

                                <h2>
                                    Metode Pembayaran
                                </h2>

                                <p>
                                    Metode yang dipilih
                                    saat checkout.
                                </p>

                            </div>

                        </div>


                        <div className="selected-payment">

                            <div className="selected-payment-icon">

                                {getPaymentIcon(
                                    paymentMethod,
                                )}

                            </div>


                            <div className="selected-payment-content">

                                <strong>
                                    {
                                        paymentMethodLabel
                                    }
                                </strong>

                                <span>
                                    Metode pembayaran
                                    pesananmu
                                </span>

                            </div>


                            <CheckCircle2
                                size={21}
                                className="selected-payment-check"
                            />

                        </div>

                    </section>


                    {/* =================================================
                        INSTRUCTION
                    ================================================= */}

                    <section className="payment-card">

                        <div className="payment-card-header">

                            <div className="payment-card-number">
                                2
                            </div>


                            <div>

                                <h2>
                                    Cara Pembayaran
                                </h2>

                                <p>
                                    Ikuti instruksi
                                    sesuai metode
                                    pembayaranmu.
                                </p>

                            </div>

                        </div>


                        {paymentMethod ===
                            "qris" && (

                                <QRISPayment
                                    total={
                                        totalAmount
                                    }
                                    remainingSeconds={
                                        remainingSeconds
                                    }
                                    expired={
                                        paymentStatus ===
                                        "expired"
                                    }
                                    onRetry={
                                        handleRetry
                                    }
                                />

                            )}


                        {paymentMethod ===
                            "bank_transfer" && (

                                <BankTransferPayment
                                    total={
                                        totalAmount
                                    }
                                />

                            )}


                        {paymentMethod ===
                            "virtual_account" && (

                                <VirtualAccountPayment
                                    totalAmount={
                                        totalAmount
                                    }
                                    onCopy={
                                        handleCopy
                                    }
                                    copied={
                                        copied
                                    }
                                />

                            )}

                    </section>


                    {/* =================================================
                        STATUS
                    ================================================= */}

                    <section className="payment-status-card">

                        <div className="payment-status-icon">
                            <Clock3
                                size={22}
                            />
                        </div>


                        <div>

                            <strong>
                                Menunggu Pembayaran
                            </strong>

                            <p>
                                Selesaikan pembayaran
                                sebelum timer mencapai
                                00:00.
                            </p>

                        </div>

                    </section>

                </main>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <aside className="payment-summary">

                    <div className="payment-summary-header">

                        <div>

                            <span>
                                PESANAN
                            </span>

                            <h2>
                                Ringkasan Pesanan
                            </h2>

                        </div>


                        <ShoppingBag
                            size={21}
                        />

                    </div>


                    {/* =================================================
                        ITEMS
                    ================================================= */}

                    <div className="payment-order-items">

                        {order.items &&
                            order.items.length >
                            0 ? (

                            order.items.map(
                                (
                                    item,
                                    index,
                                ) => {

                                    const quantity =
                                        Number(
                                            item.quantity ??
                                            0,
                                        );


                                    const price =
                                        Number(
                                            item.price ??
                                            item.menu?.price ??
                                            0,
                                        );


                                    const itemTotal =
                                        Number(
                                            item.subtotal ??
                                            quantity *
                                            price,
                                        );


                                    const menuName =
                                        item.menu_name ??
                                        item.menuName ??
                                        item.menu?.name ??
                                        "Menu";


                                    return (

                                        <div
                                            className="payment-order-item"
                                            key={
                                                item.id ??
                                                item.menu_id ??
                                                index
                                            }
                                        >

                                            <div>

                                                <strong>
                                                    {
                                                        menuName
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        quantity
                                                    }{" "}
                                                    ×{" "}
                                                    {
                                                        formatRupiah(
                                                            price,
                                                        )
                                                    }
                                                </span>

                                            </div>


                                            <strong>
                                                {
                                                    formatRupiah(
                                                        itemTotal,
                                                    )
                                                }
                                            </strong>

                                        </div>

                                    );

                                },
                            )

                        ) : (

                            <div className="payment-no-items">
                                Detail menu tidak
                                tersedia.
                            </div>

                        )}

                    </div>


                    <div className="payment-summary-divider" />


                    {/* =================================================
                        METHOD
                    ================================================= */}

                    <div className="payment-summary-method">

                        <span>
                            Metode Pembayaran
                        </span>

                        <strong>
                            {
                                paymentMethodLabel
                            }
                        </strong>

                    </div>


                    <div className="payment-summary-divider" />


                    {/* =================================================
                        TOTAL
                    ================================================= */}

                    <div className="payment-total-row">

                        <span>
                            Total Pembayaran
                        </span>

                        <strong>
                            {
                                formatRupiah(
                                    totalAmount,
                                )
                            }
                        </strong>

                    </div>


                    {/* =================================================
                        CONFIRM
                    ================================================= */}

                    <button
                        type="button"
                        className="payment-confirm-button"
                        disabled={
                            processing ||
                            paymentStatus !==
                            "pending" ||
                            remainingSeconds <=
                            0
                        }
                        onClick={
                            handlePayment
                        }
                    >

                        {processing ? (

                            <>
                                <span className="payment-button-spinner" />

                                Memproses...
                            </>

                        ) : (

                            <>
                                Konfirmasi Pembayaran

                                <CheckCircle2
                                    size={18}
                                />

                            </>

                        )}

                    </button>


                    <p className="payment-secure-text">
                        Pembayaran kamu diproses
                        dengan aman.
                    </p>

                </aside>

            </div>

        </div>

    );
}