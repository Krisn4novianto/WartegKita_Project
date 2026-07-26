import {
    Wallet,
    Globe,
    CheckCircle2,
    ExternalLink,
} from "lucide-react";

import "../../../styles/Payment/PaypalPayment.css";

interface Props {
    total: number;
}

export default function PaypalPayment({
    total,
}: Props) {

    const openPaypal = () => {
        window.open(
            "https://www.paypal.com/",
            "_blank"
        );
    };

    return (
        <div className="paypal-payment">

            <div className="paypal-header">

                <div className="paypal-icon">
                    <Wallet size={34} />
                </div>

                <div>

                    <h2>PayPal</h2>

                    <p>
                        Pembayaran aman menggunakan
                        akun PayPal.
                    </p>

                </div>

            </div>

            <div className="paypal-card">

                <div className="paypal-logo">

                    <Globe size={70} />

                </div>

                <div className="paypal-total">

                    <h2>PayPal Secure Checkout</h2>

                    <small>Total Pembayaran</small>

                    <h1>
                        Rp {total.toLocaleString("id-ID")}
                    </h1>

                    <p>
                        Pembayaran akan diarahkan ke halaman resmi
                        PayPal menggunakan koneksi yang aman.
                    </p>

                    <button
                        className="paypal-button"
                        onClick={openPaypal}
                    >
                        <ExternalLink size={18} />
                        Lanjut ke PayPal
                    </button>

                </div>

            </div>

            <div className="paypal-instruction">

                <h3>Cara Pembayaran</h3>

                <div className="paypal-step">
                    <span>1</span>
                    <p>Klik tombol Lanjut ke PayPal.</p>
                </div>

                <div className="paypal-step">
                    <span>2</span>
                    <p>Login ke akun PayPal.</p>
                </div>

                <div className="paypal-step">
                    <span>3</span>
                    <p>Pilih sumber dana.</p>
                </div>

                <div className="paypal-step">
                    <span>4</span>
                    <p>Konfirmasi pembayaran.</p>
                </div>

                <div className="paypal-step">
                    <span>5</span>
                    <p>Kembali ke aplikasi WartegKita.</p>
                </div>

            </div>

            <div className="paypal-note">

                <CheckCircle2 size={22} />

                <span>
                    Setelah pembayaran berhasil,
                    klik
                    <b> Konfirmasi Pembayaran </b>
                    di bawah halaman.
                </span>

            </div>

        </div>
    );
}