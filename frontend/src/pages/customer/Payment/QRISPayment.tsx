import {
    Download,
    QrCode,
    Smartphone,
    CheckCircle2,
    Clock3,
} from "lucide-react";

import {
    useState,
} from "react";

import "../../../styles/Payment/qris.css";

/* =====================================================
   PROPS
===================================================== */

interface Props {
    total: number;
    remainingSeconds: number;
    expired: boolean;
    onRetry: () => void;
}

/* =====================================================
   COMPONENT
===================================================== */

export default function QRISPayment({
    total,
    remainingSeconds,
    expired,
    onRetry,
}: Props) {

    const [
        showToast,
        setShowToast,
    ] = useState(false);

    /* =================================================
       SAFE TIMER
    ================================================= */

    const safeSeconds =
        Number.isFinite(
            remainingSeconds
        )
            ? Math.max(
                0,
                Math.floor(
                    remainingSeconds
                )
            )
            : 0;

    const minutes =
        Math.floor(
            safeSeconds /
            60
        );

    const seconds =
        safeSeconds % 60;

    const countdown =
        `${String(
            minutes
        ).padStart(
            2,
            "0"
        )} : ${String(
            seconds
        ).padStart(
            2,
            "0"
        )}`;

    /* =================================================
       DOWNLOAD QR
    ================================================= */

    const handleDownloadQR =
        () => {

            const qrElement =
                document.getElementById(
                    "qris-download"
                );

            if (!qrElement) {
                return;
            }

            const svg =
                qrElement.querySelector(
                    "svg"
                );

            if (!svg) {
                return;
            }

            const svgData =
                new XMLSerializer()
                    .serializeToString(
                        svg
                    );

            const blob =
                new Blob(
                    [
                        svgData,
                    ],
                    {
                        type:
                            "image/svg+xml",
                    }
                );

            const url =
                URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement(
                    "a"
                );

            link.href =
                url;

            link.download =
                "QRIS-WartegKita.svg";

            document.body.appendChild(
                link
            );

            link.click();

            document.body.removeChild(
                link
            );

            URL.revokeObjectURL(
                url
            );

            setShowToast(
                true
            );

            window.setTimeout(
                () => {
                    setShowToast(
                        false
                    );
                },
                3000
            );
        };

    /* =================================================
       RENDER
    ================================================= */

    return (
        <div className="qris-payment">

            {/* =================================================
                EXPIRED MODAL
            ================================================= */}

            {expired && (
                <div className="payment-expired-overlay">

                    <div className="payment-expired-modal">

                        <div className="expired-icon">

                            <Clock3
                                size={40}
                            />

                        </div>

                        <h2>
                            Pembayaran Gagal
                        </h2>

                        <p>
                            Waktu pembayaran QRIS
                            sudah habis. Silakan
                            ulangi pembayaran.
                        </p>

                        <button
                            type="button"
                            onClick={
                                onRetry
                            }
                        >
                            Ulangi Pembayaran
                        </button>

                    </div>

                </div>
            )}

            {/* =================================================
                TOAST
            ================================================= */}

            {showToast && (
                <div className="qris-toast">

                    <CheckCircle2
                        size={22}
                    />

                    <span>
                        QR berhasil di-download!
                    </span>

                </div>
            )}

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="qris-header">

                <div className="qris-icon">

                    <QrCode
                        size={34}
                    />

                </div>

                <div>

                    <h2>
                        Bayar dengan QRIS
                    </h2>

                    <p>
                        Scan QR menggunakan aplikasi
                        e-wallet atau mobile banking.
                    </p>

                </div>

            </div>

            {/* =================================================
                QR CARD
            ================================================= */}

            <div className="qris-card">

                <div
                    className="fake-qr"
                    id="qris-download"
                >

                    <QrCode
                        size={180}
                    />

                    <span>
                        QRIS WARTEGKITA
                    </span>

                </div>

                {/* =================================================
                    TOTAL
                ================================================= */}

                <div className="payment-total">

                    <small>
                        Total Pembayaran
                    </small>

                    <h1>
                        Rp{" "}
                        {Number(
                            total || 0
                        ).toLocaleString(
                            "id-ID"
                        )}
                    </h1>

                    <button
                        type="button"
                        className="download-button"
                        onClick={
                            handleDownloadQR
                        }
                        disabled={
                            expired
                        }
                    >

                        <Download
                            size={18}
                        />

                        Download QR

                    </button>

                </div>

            </div>

            {/* =================================================
                COUNTDOWN
            ================================================= */}

            <div
                className={
                    `payment-countdown ${safeSeconds <=
                        60
                        ? "danger-countdown"
                        : ""
                    }`
                }
            >

                <strong>
                    Selesaikan pembayaran dalam
                </strong>

                <h2
                    className={
                        safeSeconds <=
                            60
                            ? "danger-time"
                            : ""
                    }
                >
                    {countdown}
                </h2>

            </div>

            {/* =================================================
                INSTRUCTION
            ================================================= */}

            <div className="instruction-box">

                <h3>
                    Cara Pembayaran
                </h3>

                <Instruction
                    number="1"
                    text="Buka aplikasi Mobile Banking, GoPay, DANA, OVO, ShopeePay, atau aplikasi lain yang mendukung QRIS."
                />

                <Instruction
                    number="2"
                    text="Pilih menu Scan QR."
                />

                <Instruction
                    number="3"
                    text="Scan kode QR di atas."
                />

                <Instruction
                    number="4"
                    text="Pastikan nominal sesuai."
                />

                <Instruction
                    number="5"
                    text="Konfirmasi pembayaran."
                />

            </div>

            {/* =================================================
                NOTE
            ================================================= */}

            <div className="payment-note">

                <CheckCircle2 />

                <span>
                    Setelah pembayaran berhasil,
                    klik tombol{" "}

                    <b>
                        Konfirmasi Pembayaran
                    </b>{" "}

                    di bawah halaman.
                </span>

            </div>

            {/* =================================================
                WALLET
            ================================================= */}

            <div className="supported-wallet">

                <Smartphone
                    size={22}
                />

                <span>
                    Mendukung GoPay • DANA • OVO •
                    ShopeePay • Mobile Banking •
                    LinkAja
                </span>

            </div>

        </div>
    );
}

/* =====================================================
   INSTRUCTION
===================================================== */

function Instruction({
    number,
    text,
}: {
    number: string;
    text: string;
}) {
    return (
        <div className="instruction-item">

            <span>
                {number}
            </span>

            <p>
                {text}
            </p>

        </div>
    );
}