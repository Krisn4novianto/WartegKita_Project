import {
    QrCode,
    Building2,
    CreditCard,
    ArrowRight,
    ArrowLeft,
    MapPin,
    ShoppingBag,
    Bike,
    WalletCards,
    Banknote,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

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
    | "virtual_account"
    | "paypal"
    | "cod";

type DeliveryType =
    | "delivery"
    | "pickup";

interface CheckoutUser {
    id?: string;
    user_id?: string;
}

interface PaymentOptionProps {
    active: boolean;
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

/* =====================================================
   CHECKOUT
===================================================== */

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();

    const items =
        useCartStore(
            (state) => state.items
        );

    const {
        pickupMethod,
        address,
        paymentMethod,
        setCheckout,
    } = useCheckoutStore();

    /* =====================================================
       CHANGE PAYMENT METHOD
       
       Payment.tsx mengirim state:
       
       {
         changePaymentMethod: true
       }
       
       State ini hanya sebagai informasi bahwa user
       datang dari proses ganti metode pembayaran.
       
       Checkout tetap membuat ORDER BARU.
    ===================================================== */

    const changePaymentMethod =
        Boolean(
            location.state?.changePaymentMethod
        );

    /* =====================================================
       DELIVERY TYPE
    ===================================================== */

    const deliveryType: DeliveryType =
        pickupMethod === "pickup"
            ? "pickup"
            : "delivery";

    /* =====================================================
       EMPTY CART
    ===================================================== */

    if (items.length === 0) {
        return (
            <div className="checkout-page empty-checkout">

                <div className="empty-card">

                    <div className="empty-checkout-icon">
                        <ShoppingBag size={48} />
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
                            navigate("/explore")
                        }
                    >
                        Cari Makanan
                    </button>

                </div>

            </div>
        );
    }

    /* =====================================================
       CALCULATION
    ===================================================== */

    const subtotal =
        items.reduce(
            (total, item) => {

                const price =
                    Number(
                        item.menu.price
                    );

                const quantity =
                    Number(
                        item.quantity
                    );

                return (
                    total +
                    price * quantity
                );
            },
            0
        );

    /*
     * Delivery fee hanya perhitungan UI.
     *
     * Saat ini backend /orders belum menerima
     * delivery_type / delivery_fee.
     *
     * Jadi Payment.tsx akan menggunakan
     * total_amount dari backend.
     */
    const deliveryFee =
        deliveryType === "delivery"
            ? 5000
            : 0;

    const checkoutTotal =
        subtotal +
        deliveryFee;

    /* =====================================================
       GET USER ID
    ===================================================== */

    const getUserId = (): string => {

        const possibleKeys = [
            "user",
            "currentUser",
            "auth_user",
            "user_data",
        ];

        for (
            const key of possibleKeys
        ) {

            const stored =
                localStorage.getItem(key);

            if (!stored) {
                continue;
            }

            try {

                const parsed =
                    JSON.parse(
                        stored
                    ) as CheckoutUser;

                if (parsed.id) {
                    return String(
                        parsed.id
                    );
                }

                if (parsed.user_id) {
                    return String(
                        parsed.user_id
                    );
                }

            } catch {

                /*
                 * Jika value bukan JSON,
                 * anggap sebagai user ID langsung.
                 */

                if (
                    stored.trim() !== ""
                ) {
                    return stored.trim();
                }
            }
        }

        const directUserId =
            localStorage.getItem(
                "user_id"
            );

        if (directUserId) {
            return directUserId.trim();
        }

        return "";
    };

    /* =====================================================
       BACK TO CART
    ===================================================== */

    const handleBack = () => {

        if (changePaymentMethod) {

            /*
             * Jika user batal mengganti metode,
             * kembali ke cart tetap aman.
             */

            navigate("/cart");

            return;
        }

        navigate("/cart");
    };

    /* =====================================================
       HANDLE PAYMENT
    ===================================================== */

    const handlePayment =
        async () => {

            console.log(
                "========================================"
            );

            console.log(
                "CREATE ORDER"
            );

            console.log(
                "========================================"
            );

            /* =================================================
               USER
            ================================================= */

            const userId =
                getUserId();

            console.log(
                "USER ID:",
                userId
            );

            if (!userId) {

                alert(
                    "User tidak ditemukan. Silakan login kembali."
                );

                navigate("/login");

                return;
            }

            /* =================================================
               ADDRESS
            ================================================= */

            if (
                deliveryType ===
                "delivery" &&
                address.trim() === ""
            ) {

                alert(
                    "Masukkan alamat pengantaran terlebih dahulu."
                );

                return;
            }

            /* =================================================
               PAYMENT METHOD
            ================================================= */

            if (!paymentMethod) {

                alert(
                    "Pilih metode pembayaran terlebih dahulu."
                );

                return;
            }

            /* =================================================
               SELLER
            ================================================= */

            const sellerId =
                items[0]?.menu?.seller_id;

            if (!sellerId) {

                alert(
                    "Seller tidak ditemukan dari menu."
                );

                return;
            }

            /* =================================================
               SINGLE SELLER VALIDATION
            ================================================= */

            const differentSeller =
                items.some(
                    (item) =>
                        item.menu.seller_id !==
                        sellerId
                );

            if (differentSeller) {

                alert(
                    "Pesanan hanya dapat berisi menu dari satu warteg."
                );

                return;
            }

            /* =================================================
               ITEM VALIDATION
            ================================================= */

            const invalidItem =
                items.some(
                    (item) =>
                        !item.menu.id ||
                        Number(
                            item.quantity
                        ) <= 0
                );

            if (invalidItem) {

                alert(
                    "Terdapat menu atau quantity yang tidak valid."
                );

                return;
            }

            /* =================================================
               PAYMENT METHOD
            ================================================= */

            const normalizedPaymentMethod =
                paymentMethod as PaymentMethod;

            /* =================================================
               PAYLOAD
               
               HARUS SESUAI BACKEND:
               
               {
                 user_id,
                 seller_id,
                 payment_method,
                 items: [
                   {
                     menu_id,
                     quantity
                   }
                 ]
               }
            ================================================= */

            const payload = {

                user_id:
                    userId,

                seller_id:
                    sellerId,

                payment_method:
                    normalizedPaymentMethod,

                items:
                    items.map(
                        (item) => ({

                            menu_id:
                                item.menu.id,

                            quantity:
                                Number(
                                    item.quantity
                                ),

                        })
                    ),
            };

            console.log(
                "PAYLOAD CREATE ORDER:",
                payload
            );

            console.log(
                "SUBTOTAL:",
                subtotal
            );

            console.log(
                "DELIVERY TYPE:",
                deliveryType
            );

            console.log(
                "DELIVERY FEE UI:",
                deliveryFee
            );

            console.log(
                "CHECKOUT TOTAL UI:",
                checkoutTotal
            );

            console.log(
                "PAYMENT METHOD:",
                normalizedPaymentMethod
            );

            /* =================================================
               CREATE ORDER
            ================================================= */

            try {

                const response =
                    await api.post(
                        "/orders",
                        payload
                    );

                console.log(
                    "========================================"
                );

                console.log(
                    "ORDER SUCCESS"
                );

                console.log(
                    "RESPONSE:",
                    response.data
                );

                console.log(
                    "========================================"
                );

                /* =================================================
                   GET ORDER ID
                ================================================= */

                const orderId =
                    response.data?.id;

                if (!orderId) {

                    console.error(
                        "Backend tidak mengembalikan order ID:",
                        response.data
                    );

                    alert(
                        "Order berhasil dibuat, tetapi ID order tidak ditemukan."
                    );

                    return;
                }

                console.log(
                    "ORDER ID:",
                    orderId
                );

                /* =================================================
                   PAYMENT PAGE
                   
                   Payment.tsx menggunakan:
                   
                   useParams<{ id: string }>()
                   
                   sehingga URL harus:
                   
                   /payment/123
                ================================================= */

                navigate(
                    `/payment/${orderId}`,
                    {
                        replace: true,
                    }
                );

            } catch (
            err: any
            ) {

                console.error(
                    "========================================"
                );

                console.error(
                    "CREATE ORDER FAILED"
                );

                console.error(
                    "STATUS:",
                    err?.response?.status
                );

                console.error(
                    "DATA:",
                    err?.response?.data
                );

                console.error(
                    "ERROR:",
                    err
                );

                console.error(
                    "========================================"
                );

                const backendError =
                    err?.response?.data?.error;

                const backendMessage =
                    err?.response?.data?.message;

                const backendDetails =
                    err?.response?.data?.details;

                if (
                    backendError
                ) {

                    alert(
                        backendDetails
                            ? `${backendError}\n\n${backendDetails}`
                            : backendError
                    );

                    return;
                }

                if (
                    backendMessage
                ) {

                    alert(
                        backendMessage
                    );

                    return;
                }

                alert(
                    "Checkout gagal. Silakan coba lagi."
                );
            }
        };

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <div className="checkout-page">

            {/* =================================================
          HEADER
      ================================================= */}

            <div className="checkout-top">

                <button
                    type="button"
                    className="page-back-button"
                    onClick={handleBack}
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

                        {changePaymentMethod && (
                            <span className="checkout-eyebrow">
                                GANTI METODE PEMBAYARAN
                            </span>
                        )}

                        <h1>
                            {changePaymentMethod
                                ? "Pilih Metode Pembayaran Baru"
                                : "Selesaikan Pesananmu"}
                        </h1>

                        <p>
                            {changePaymentMethod
                                ? "Pilih metode pembayaran baru untuk melanjutkan pesananmu."
                                : "Tinggal satu langkah lagi. Pastikan alamat, metode pengambilan, dan pembayaran sudah benar sebelum melanjutkan."}
                        </p>

                    </div>

                    {/* =================================================
              PROGRESS
          ================================================= */}

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

                <main className="checkout-main">

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
                                    Pilih bagaimana pesananmu
                                    diterima.
                                </p>

                            </div>

                        </div>

                        <div className="delivery-options">

                            {/* DELIVERY */}

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
                            >

                                <span className="delivery-icon">
                                    <Bike size={25} />
                                </span>

                                <span className="delivery-text">

                                    <strong>
                                        Diantar
                                    </strong>

                                    <small>
                                        Pesanan diantar ke
                                        alamatmu
                                    </small>

                                </span>

                                <span className="custom-radio">

                                    {deliveryType ===
                                        "delivery" && (
                                            <span />
                                        )}

                                </span>

                            </button>

                            {/* PICKUP */}

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
                                        Ambil langsung di
                                        warteg
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
                                            Masukkan alamat lengkap
                                            tujuan pesanan.
                                        </p>

                                    </div>

                                </div>

                                <div className="address-input-wrapper">

                                    <MapPin
                                        size={20}
                                    />

                                    <textarea
                                        rows={4}
                                        value={address}
                                        onChange={(
                                            event
                                        ) =>
                                            setCheckout({
                                                address:
                                                    event.target
                                                        .value,
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
                                3
                            </div>

                            <div>

                                <h2>
                                    Metode Pembayaran
                                </h2>

                                <p>
                                    Pilih metode pembayaran
                                    yang kamu inginkan.
                                </p>

                            </div>

                        </div>

                        <div className="payment-method-list">

                            {/* =================================================
                  QRIS
              ================================================= */}

                            <PaymentOption
                                active={
                                    paymentMethod ===
                                    "qris"
                                }
                                icon={
                                    <QrCode size={22} />
                                }
                                title="QRIS"
                                description="Scan menggunakan mobile banking atau e-wallet."
                                onClick={() =>
                                    setCheckout({
                                        paymentMethod:
                                            "qris",
                                    })
                                }
                            />

                            {/* =================================================
                  BANK TRANSFER
              ================================================= */}

                            <PaymentOption
                                active={
                                    paymentMethod ===
                                    "bank_transfer"
                                }
                                icon={
                                    <Building2 size={22} />
                                }
                                title="Transfer Bank"
                                description="Transfer melalui ATM atau mobile banking."
                                onClick={() =>
                                    setCheckout({
                                        paymentMethod:
                                            "bank_transfer",
                                    })
                                }
                            />

                            {/* =================================================
                  VIRTUAL ACCOUNT
              ================================================= */}

                            <PaymentOption
                                active={
                                    paymentMethod ===
                                    "virtual_account"
                                }
                                icon={
                                    <CreditCard size={22} />
                                }
                                title="Virtual Account"
                                description="Bayar menggunakan nomor virtual account."
                                onClick={() =>
                                    setCheckout({
                                        paymentMethod:
                                            "virtual_account",
                                    })
                                }
                            />

                            {/* =================================================
                  PAYPAL
              ================================================= */}

                            <PaymentOption
                                active={
                                    paymentMethod ===
                                    "paypal"
                                }
                                icon={
                                    <WalletCards size={22} />
                                }
                                title="PayPal"
                                description="Bayar menggunakan akun PayPal."
                                onClick={() =>
                                    setCheckout({
                                        paymentMethod:
                                            "paypal",
                                    })
                                }
                            />

                            {/* =================================================
                  COD
              ================================================= */}

                            <PaymentOption
                                active={
                                    paymentMethod ===
                                    "cod"
                                }
                                icon={
                                    <Banknote size={22} />
                                }
                                title="Cash On Delivery"
                                description="Bayar langsung saat pesanan diterima."
                                onClick={() =>
                                    setCheckout({
                                        paymentMethod:
                                            "cod",
                                    })
                                }
                            />

                        </div>

                    </section>

                </main>

                {/* =================================================
            RIGHT SUMMARY
        ================================================= */}

                <aside className="checkout-summary">

                    <div className="summary-header">

                        <h2>
                            Ringkasan Pesanan
                        </h2>

                        <span>
                            {items.length} menu
                        </span>

                    </div>

                    {/* =================================================
              ITEMS
          ================================================= */}

                    <div className="checkout-items">

                        {items.map(
                            (item) => {

                                const itemPrice =
                                    Number(
                                        item.menu.price
                                    );

                                const itemTotal =
                                    itemPrice *
                                    Number(
                                        item.quantity
                                    );

                                return (
                                    <div
                                        className="checkout-item"
                                        key={
                                            item.menu.id
                                        }
                                    >

                                        <div>

                                            <strong>
                                                {item.menu.name}
                                            </strong>

                                            <span>
                                                {item.quantity} × Rp{" "}
                                                {itemPrice.toLocaleString(
                                                    "id-ID"
                                                )}
                                            </span>

                                        </div>

                                        <strong>
                                            Rp{" "}
                                            {itemTotal.toLocaleString(
                                                "id-ID"
                                            )}
                                        </strong>

                                    </div>
                                );
                            }
                        )}

                    </div>

                    <div className="summary-divider" />

                    {/* =================================================
              SUBTOTAL
          ================================================= */}

                    <div className="summary-row">

                        <span>
                            Subtotal
                        </span>

                        <strong>
                            Rp{" "}
                            {subtotal.toLocaleString(
                                "id-ID"
                            )}
                        </strong>

                    </div>

                    {/* =================================================
              DELIVERY
          ================================================= */}

                    <div className="summary-row">

                        <span>
                            Ongkos Kirim
                        </span>

                        <strong>
                            {deliveryFee === 0
                                ? "Gratis"
                                : `Rp ${deliveryFee.toLocaleString(
                                    "id-ID"
                                )}`}
                        </strong>

                    </div>

                    <div className="summary-divider" />

                    {/* =================================================
              TOTAL
          ================================================= */}

                    <div className="summary-total">

                        <span>
                            Total Bayar
                        </span>

                        <strong>
                            Rp{" "}
                            {checkoutTotal.toLocaleString(
                                "id-ID"
                            )}
                        </strong>

                    </div>

                    {/* =================================================
              PAYMENT BUTTON
          ================================================= */}

                    <button
                        type="button"
                        className="checkout-pay-button"
                        onClick={
                            handlePayment
                        }
                    >

                        <span>
                            Lanjut Bayar
                        </span>

                        <ArrowRight
                            size={18}
                        />

                    </button>
                </aside>

            </div>

        </div>
    );
}

/* =====================================================
   PAYMENT OPTION
===================================================== */

function PaymentOption({
    active,
    icon,
    title,
    description,
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