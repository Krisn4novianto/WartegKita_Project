import { useEffect, useState } from "react";
import {
    CreditCard,
    Copy,
    Clock3,
    CheckCircle2,
    Landmark,
    Smartphone,
} from "lucide-react";

import "../../../styles/Payment/VirtualAccountPayment.css";

interface Props {
    total: number;
}

type BankType = "bri" | "raya";

const virtualAccounts = {
    bri: {
        bank: "BRI Virtual Account",
        number: "888812345678901234",
        app: "BRImo",
        color: "#0066b3",
    },
    raya: {
        bank: "Bank Raya Virtual Account",
        number: "777712345678901234",
        app: "Raya Mobile",
        color: "#00a859",
    },
};

export default function VirtualAccountPayment({ total }: Props) {
    const [selectedBank, setSelectedBank] = useState<BankType>("bri");
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    const bank = virtualAccounts[selectedBank];

    useEffect(() => {
        const STORAGE_KEY = "va_payment_expired_at";

        let expiredAt = localStorage.getItem(STORAGE_KEY);

        if (!expiredAt) {
            expiredAt = (Date.now() + 15 * 60 * 1000).toString();
            localStorage.setItem(STORAGE_KEY, expiredAt);
        }

        const updateTimer = () => {
            const remaining = Math.max(
                0,
                Math.floor((Number(expiredAt) - Date.now()) / 1000)
            );

            setTimeLeft(remaining);

            if (remaining <= 0) {
                localStorage.removeItem(STORAGE_KEY);
            }
        };

        updateTimer();

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    const copyVA = async () => {
        await navigator.clipboard.writeText(bank.number);
        alert("Nomor Virtual Account berhasil disalin");
    };

    const copyAmount = async () => {
        await navigator.clipboard.writeText(total.toString());
        alert("Nominal berhasil disalin");
    };

    const openBankApp = () => {
        if (selectedBank === "bri") {
            window.open("https://bri.co.id/brimo", "_blank");
        } else {
            window.open("https://bankraya.co.id", "_blank");
        }
    };

    return (
        <div className="va-payment">
            {/* HEADER */}
            <div className="va-header">
                <div className="va-icon">
                    <CreditCard size={34} />
                </div>

                <div>
                    <h2>Virtual Account</h2>
                    <p>
                        Pilih rekening Virtual Account untuk pembayaran WartegKita.
                    </p>
                </div>
            </div>

            {/* PILIH BANK */}
            <div className="va-bank-selector">
                <button
                    type="button"
                    className={`va-bank-choice ${selectedBank === "bri" ? "active bri" : ""
                        }`}
                    onClick={() => setSelectedBank("bri")}
                >
                    <div className="bank-icon bri">
                        <Landmark size={28} />
                    </div>

                    <div>
                        <strong>BRI VA</strong>
                        <small>Bayar via BRImo</small>
                    </div>
                </button>

                <button
                    type="button"
                    className={`va-bank-choice ${selectedBank === "raya" ? "active raya" : ""
                        }`}
                    onClick={() => setSelectedBank("raya")}
                >
                    <div className="bank-icon raya">
                        <Landmark size={28} />
                    </div>

                    <div>
                        <strong>Bank Raya VA</strong>
                        <small>Bayar via Raya Mobile</small>
                    </div>
                </button>
            </div>

            {/* CARD VA */}
            <div className="va-card">
                <div className="va-bank">
                    <div className={`va-bank-icon ${selectedBank}`}>
                        <CreditCard size={46} />
                    </div>

                    <h3>{bank.bank}</h3>
                </div>

                <label>Nomor Virtual Account</label>

                <div className="va-copy-box">
                    <strong>{bank.number}</strong>

                    <button type="button" onClick={copyVA}>
                        <Copy size={18} />
                        Salin
                    </button>
                </div>
            </div>


            {/* OPEN APP */}
            <button
                type="button"
                className="va-app-button"
                onClick={openBankApp}
            >
                <Smartphone size={22} />
                Buka {bank.app}
            </button>

            {/* TIMER */}
            <div className="va-timer">
                <Clock3 size={24} />

                <div>
                    <strong>Batas Waktu Pembayaran</strong>

                    <h2>
                        {minutes} : {seconds}
                    </h2>
                </div>
            </div>

            {/* LANGKAH */}
            <div className="va-instruction">
                <h3>Langkah Pembayaran</h3>

                {[
                    `Buka ${bank.app}`,
                    "Pilih menu Virtual Account",
                    `Masukkan nomor ${bank.bank}`,
                    "Pastikan nominal pembayaran sesuai",
                    "Konfirmasi pembayaran",
                ].map((text, index) => (
                    <div className="va-step" key={index}>
                        <span>{index + 1}</span>

                        <p>{text}</p>
                    </div>
                ))}
            </div>

            {/* NOTE */}
            <div className="va-note">
                <CheckCircle2 size={22} />

                <span>
                    Setelah pembayaran berhasil, klik tombol
                    <b> Konfirmasi Pembayaran</b> di bawah halaman.
                </span>
            </div>
        </div>
    );
}