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
   PAYMENT
===================================================== */

export default function Payment() {

    const navigate =
        useNavigate();

    const {
        orderId,
    } = useParams<{
        orderId: string;
    }>();

    /* =================================================
       STATE
    ================================================= */

    const [
        order,
        setOrder,
    ] = useState<Order | null>(null);

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
        "pending"
    );

    const [
        copied,
        setCopied,
    ] = useState(false);

    const [
        paymentDeadline,
        setPaymentDeadline,
    ] = useState<number | null>(
        null
    );

    const [
        remainingSeconds,
        setRemainingSeconds,
    ] = useState(0);

    /* =================================================
       LOAD ORDER
    ================================================= */

    const loadOrder = useCallback(
        async () => {

            if (!orderId) {

                setError(
                    "Order ID tidak ditemukan."
                );

                setLoading(false);

                return;
            }

            try {

                setLoading(true);
                setError("");

                /*
                 * Jangan langsung menganggap
                 * response.data adalah Order.
                 *
                 * Backend / Axios interceptor
                 * bisa mengembalikan:
                 *
                 * {
                 *   data: {...}
                 * }
                 *
                 * atau:
                 *
                 * {
                 *   order: {...}
                 * }
                 *
                 * atau:
                 *
                 * {
                 *   data: {
                 *      order: {...}
                 *   }
                 * }
                 */

                const response =
                    await api.get(
                        `/orders/${orderId}`
                    );

                console.log(
                    "========================================"
                );

                console.log(
                    "RAW PAYMENT RESPONSE:"
                );

                console.log(
                    response
                );

                console.log(
                    "RAW PAYMENT RESPONSE DATA:"
                );

                console.log(
                    response?.data
                );

                const rawData =
                    response?.data;

                const orderData =
                    extractOrder(
                        rawData
                    );

                console.log(
                    "========================================"
                );

                console.log(
                    "NORMALIZED PAYMENT ORDER"
                );

                console.log(
                    "ORDER:",
                    orderData
                );

                console.log(
                    "ORDER ID:",
                    orderData?.id
                );

                console.log(
                    "ORDER NUMBER:",
                    orderData?.order_number
                );

                console.log(
                    "PAYMENT METHOD:",
                    orderData?.payment_method
                );

                console.log(
                    "PAYMENT STATUS:",
                    orderData?.payment_status
                );

                console.log(
                    "ORDER STATUS:",
                    orderData?.status
                );

                console.log(
                    "CREATED AT:",
                    orderData?.created_at
                );

                console.log(
                    "========================================"
                );

                if (!orderData) {

                    setError(
                        "Data pesanan tidak ditemukan dari server."
                    );

                    setOrder(null);

                    return;
                }

                /*
                 * Normalisasi semua kemungkinan
                 * nama field backend.
                 */

                const normalizedOrder =
                    normalizeOrder(
                        orderData
                    );

                console.log(
                    "FINAL NORMALIZED ORDER:",
                    normalizedOrder
                );

                console.log(
                    "FINAL PAYMENT METHOD:",
                    normalizedOrder.payment_method
                );

                setOrder(
                    normalizedOrder
                );

                const normalizedStatus =
                    normalizePaymentStatus(
                        normalizedOrder.payment_status
                    );

                setPaymentStatus(
                    normalizedStatus
                );

                /*
                 * Deadline pembayaran.
                 */

                let deadline =
                    Date.now() +
                    PAYMENT_DURATION_MS;

                if (
                    normalizedOrder.created_at
                ) {

                    const createdAt =
                        new Date(
                            normalizedOrder.created_at
                        ).getTime();

                    if (
                        Number.isFinite(
                            createdAt
                        )
                    ) {

                        deadline =
                            createdAt +
                            PAYMENT_DURATION_MS;
                    }
                }

                if (
                    normalizedStatus ===
                    "pending"
                ) {

                    setPaymentDeadline(
                        deadline
                    );

                } else {

                    setPaymentDeadline(
                        null
                    );

                    setRemainingSeconds(
                        0
                    );
                }

            } catch (
            err: unknown
            ) {

                console.error(
                    "LOAD ORDER FAILED:",
                    err
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
                    data?.error
                ) {

                    setError(
                        data.error
                    );

                    return;
                }

                if (
                    data?.message
                ) {

                    setError(
                        data.message
                    );

                    return;
                }

                if (
                    status === 404
                ) {

                    setError(
                        "Pesanan tidak ditemukan."
                    );

                    return;
                }

                if (
                    status === 401
                ) {

                    setError(
                        "Sesi login kamu sudah berakhir."
                    );

                    return;
                }

                setError(
                    "Gagal mengambil data pesanan."
                );

            } finally {

                setLoading(false);
            }

        },
        [orderId]
    );

    /* =================================================
       INITIAL LOAD
    ================================================= */

    useEffect(() => {

        loadOrder();

    }, [
        loadOrder,
    ]);

    /* =================================================
       PAYMENT METHOD
    ================================================= */

    const paymentMethod =
        normalizePaymentMethod(
            order?.payment_method
        );

    /* =================================================
       TOTAL
    ================================================= */

    const totalAmount =
        useMemo(() => {

            if (!order) {
                return 0;
            }

            if (
                typeof order.total_amount ===
                "number" &&
                Number.isFinite(
                    order.total_amount
                )
            ) {

                return order.total_amount;
            }

            if (
                order.total_amount
            ) {

                const parsed =
                    Number(
                        order.total_amount
                    );

                if (
                    Number.isFinite(
                        parsed
                    )
                ) {

                    return parsed;
                }
            }

            return (
                order.items?.reduce(
                    (
                        total,
                        item
                    ) => {

                        const price =
                            Number(
                                item.price ??
                                item.menu?.price ??
                                0
                            );

                        const quantity =
                            Number(
                                item.quantity ??
                                0
                            );

                        if (
                            !Number.isFinite(
                                price
                            ) ||
                            !Number.isFinite(
                                quantity
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
                    0
                ) ?? 0
            );

        }, [order]);

    /* =================================================
       PAYMENT METHOD LABEL
    ================================================= */

    const paymentMethodLabel =
        getPaymentMethodLabel(
            paymentMethod
        );

    /* =================================================
       LIVE COUNTDOWN
    ================================================= */

    useEffect(() => {

        if (
            paymentDeadline === null
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

                const now =
                    Date.now();

                const difference =
                    paymentDeadline -
                    now;

                if (
                    difference <= 0
                ) {

                    setRemainingSeconds(
                        0
                    );

                    setPaymentStatus(
                        "expired"
                    );

                    setError(
                        "Waktu pembayaran 15 menit telah habis."
                    );

                    return;
                }

                const seconds =
                    Math.ceil(
                        difference /
                        1000
                    );

                setRemainingSeconds(
                    Math.max(
                        0,
                        seconds
                    )
                );
            };

        updateTimer();

        const timer =
            window.setInterval(
                updateTimer,
                1000
            );

        return () => {

            window.clearInterval(
                timer
            );
        };

    }, [
        paymentDeadline,
        paymentStatus,
    ]);

    /* =================================================
       TIMER FORMAT
    ================================================= */

    const formatCountdown =
        (
            seconds: number
        ): string => {

            if (
                !Number.isFinite(
                    seconds
                ) ||
                seconds <= 0
            ) {

                return "00:00";
            }

            const safeSeconds =
                Math.max(
                    0,
                    Math.floor(
                        seconds
                    )
                );

            const minutes =
                Math.floor(
                    safeSeconds /
                    60
                );

            const remaining =
                safeSeconds %
                60;

            return `${String(
                minutes
            ).padStart(
                2,
                "0"
            )}:${String(
                remaining
            ).padStart(
                2,
                "0"
            )}`;
        };

    const countdownText =
        formatCountdown(
            remainingSeconds
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

    const handleCopy = async (
        value: string
    ) => {

        try {

            await navigator
                .clipboard
                .writeText(
                    value
                );

            setCopied(
                true
            );

            window.setTimeout(
                () => {

                    setCopied(
                        false
                    );

                },
                1800
            );

        } catch (
        copyError
        ) {

            console.error(
                "COPY FAILED:",
                copyError
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
            [loadOrder]
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
                    `/orders/${orderId}`
                );

                return;
            }

            if (
                paymentStatus ===
                "expired"
            ) {

                return;
            }

            if (
                remainingSeconds <=
                0
            ) {

                setPaymentStatus(
                    "expired"
                );

                setError(
                    "Waktu pembayaran 15 menit telah habis."
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
                    "Metode pembayaran pesanan tidak ditemukan."
                );

                return;
            }

            try {

                setProcessing(
                    true
                );

                setError("");

                console.log(
                    "========================================"
                );

                console.log(
                    "PROCESS PAYMENT"
                );

                console.log(
                    "ORDER ID:",
                    orderId
                );

                console.log(
                    "PAYMENT METHOD:",
                    paymentMethod
                );

                console.log(
                    "========================================"
                );

                /*
                 * PERHATIAN:
                 *
                 * Dari route backend yang kamu kirim,
                 * saat ini BELUM ADA:
                 *
                 * PATCH/PUT /orders/:order_id/pay
                 *
                 * Jadi endpoint ini mungkin 404.
                 *
                 * Untuk sementara kita tetap pertahankan
                 * request ini supaya frontend siap ketika
                 * endpoint payment backend ditambahkan.
                 */

                const response =
                    await api.put(
                        `/orders/${orderId}/pay`,
                        {
                            payment_method:
                                paymentMethod,
                        }
                    );

                console.log(
                    "PAYMENT RESPONSE:",
                    response?.data
                );

                setPaymentStatus(
                    "paid"
                );

                setRemainingSeconds(
                    0
                );

                setPaymentDeadline(
                    null
                );

                await loadOrder();

                setPaymentStatus(
                    "paid"
                );

            } catch (
            paymentError: unknown
            ) {

                console.warn(
                    "Payment endpoint gagal:",
                    paymentError
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

                console.error(
                    "PAYMENT STATUS:",
                    status
                );

                console.error(
                    "PAYMENT DATA:",
                    data
                );

                if (
                    status ===
                    404
                ) {

                    setPaymentStatus(
                        "failed"
                    );

                    setError(
                        "Endpoint pembayaran belum tersedia di backend."
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

                setPaymentStatus(
                    "failed"
                );

                if (
                    data?.error
                ) {

                    setError(
                        data.error
                    );

                } else if (
                    data?.message
                ) {

                    setError(
                        data.message
                    );

                } else {

                    setError(
                        "Pembayaran gagal diproses. Silakan coba lagi."
                    );
                }

            } finally {

                setProcessing(
                    false
                );
            }
        };

    /* =================================================
       BACK
    ================================================= */

    const handleBack = () => {

        if (
            processing
        ) {

            return;
        }

        navigate(
            "/checkout"
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
                `/orders/${orderId}`
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
                                "/cart"
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
                                "/cart"
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
                                "/checkout"
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
                                totalAmount
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
                                "/checkout"
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
                    <Clock3 size={22} />
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
                                    paymentMethod
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
                            <Clock3 size={22} />
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
                                    index
                                ) => {

                                    const quantity =
                                        Number(
                                            item.quantity ??
                                            0
                                        );

                                    const price =
                                        Number(
                                            item.price ??
                                            item.menu?.price ??
                                            0
                                        );

                                    const itemTotal =
                                        quantity *
                                        price;

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
                                                            price
                                                        )
                                                    }
                                                </span>

                                            </div>

                                            <strong>
                                                {
                                                    formatRupiah(
                                                        itemTotal
                                                    )
                                                }
                                            </strong>

                                        </div>
                                    );
                                }
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
                                    totalAmount
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

/* =====================================================
   EXTRACT ORDER
===================================================== */

function extractOrder(
    raw: unknown
): Order | null {

    if (
        !raw ||
        typeof raw !== "object"
    ) {

        return null;
    }

    const data =
        raw as Record<
            string,
            unknown
        >;

    /*
     * Format:
     *
     * {
     *   id: "...",
     *   payment_method: "..."
     * }
     */

    if (
        data.id ||
        data.order_id ||
        data.order_number ||
        data.payment_method ||
        data.paymentMethod
    ) {

        return data as Order;
    }

    /*
     * Format:
     *
     * {
     *   data: {...}
     * }
     */

    if (
        data.data &&
        typeof data.data ===
        "object"
    ) {

        const nested =
            extractOrder(
                data.data
            );

        if (nested) {
            return nested;
        }
    }

    /*
     * Format:
     *
     * {
     *   order: {...}
     * }
     */

    if (
        data.order &&
        typeof data.order ===
        "object"
    ) {

        const nested =
            extractOrder(
                data.order
            );

        if (nested) {
            return nested;
        }
    }

    /*
     * Format:
     *
     * {
     *   result: {...}
     * }
     */

    if (
        data.result &&
        typeof data.result ===
        "object"
    ) {

        const nested =
            extractOrder(
                data.result
            );

        if (nested) {
            return nested;
        }
    }

    return null;
}

/* =====================================================
   NORMALIZE ORDER
===================================================== */

function normalizeOrder(
    raw: Order
): Order {

    const source =
        raw as Order &
        Record<
            string,
            unknown
        >;

    const paymentMethod =
        String(
            source.payment_method ??
            source.paymentMethod ??
            ""
        ).trim();

    const paymentStatus =
        String(
            source.payment_status ??
            source.paymentStatus ??
            "pending"
        ).trim();

    const orderStatus =
        String(
            source.status ??
            source.order_status ??
            source.orderStatus ??
            ""
        ).trim();

    const orderId =
        String(
            source.id ??
            source.order_id ??
            ""
        ).trim();

    const orderNumber =
        String(
            source.order_number ??
            source.orderNumber ??
            ""
        ).trim();

    const createdAt =
        String(
            source.created_at ??
            source.createdAt ??
            ""
        ).trim();

    const totalRaw =
        source.total_amount ??
        source.totalAmount;

    const totalAmount =
        Number(
            totalRaw ?? 0
        );

    return {

        ...raw,

        id:
            orderId ||
            undefined,

        order_number:
            orderNumber ||
            undefined,

        payment_method:
            paymentMethod ||
            undefined,

        payment_status:
            paymentStatus ||
            "pending",

        status:
            orderStatus ||
            undefined,

        created_at:
            createdAt ||
            undefined,

        total_amount:
            Number.isFinite(
                totalAmount
            )
                ? totalAmount
                : 0,

        items:
            Array.isArray(
                source.items
            )
                ? source.items
                : [],
    };
}

/* =====================================================
   FORMAT RUPIAH
===================================================== */

function formatRupiah(
    amount: number
): string {

    if (
        !Number.isFinite(
            amount
        )
    ) {

        amount = 0;
    }

    return `Rp ${amount.toLocaleString(
        "id-ID"
    )}`;
}

/* =====================================================
   NORMALIZE PAYMENT METHOD
===================================================== */

function normalizePaymentMethod(
    method?: string
): PaymentMethod | null {

    if (!method) {
        return null;
    }

    const normalized =
        method
            .toLowerCase()
            .trim()
            .replace(
                /-/g,
                "_"
            );

    switch (
    normalized
    ) {

        case "qris":

            return "qris";

        case "bank_transfer":
        case "bank transfer":
        case "transfer_bank":
        case "transfer bank":
        case "banktransfer":

            return "bank_transfer";

        case "virtual_account":
        case "virtual account":
        case "va":
        case "virtualaccount":

            return "virtual_account";

        default:

            return null;
    }
}

/* =====================================================
   NORMALIZE PAYMENT STATUS
===================================================== */

function normalizePaymentStatus(
    status?: string
): PaymentStatus {

    const normalized =
        String(
            status ??
            "pending"
        )
            .toLowerCase()
            .trim();

    if (
        normalized ===
        "paid" ||
        normalized ===
        "success"
    ) {

        return "paid";
    }

    if (
        normalized ===
        "failed" ||
        normalized ===
        "failure"
    ) {

        return "failed";
    }

    if (
        normalized ===
        "cancelled" ||
        normalized ===
        "canceled"
    ) {

        return "cancelled";
    }

    if (
        normalized ===
        "expired"
    ) {

        return "expired";
    }

    return "pending";
}

/* =====================================================
   PAYMENT METHOD LABEL
===================================================== */

function getPaymentMethodLabel(
    method: PaymentMethod | null
): string {

    switch (
    method
    ) {

        case "qris":

            return "QRIS";

        case "bank_transfer":

            return "Transfer Bank / ATM";

        case "virtual_account":

            return "Virtual Account";

        default:

            return "Metode pembayaran";
    }
}

/* =====================================================
   PAYMENT ICON
===================================================== */

function getPaymentIcon(
    method: PaymentMethod | null
) {

    switch (
    method
    ) {

        case "qris":

            return (
                <QrCode
                    size={23}
                />
            );

        case "bank_transfer":

            return (
                <Building2
                    size={23}
                />
            );

        case "virtual_account":

            return (
                <CreditCard
                    size={23}
                />
            );

        default:

            return (
                <CreditCard
                    size={23}
                />
            );
    }
}