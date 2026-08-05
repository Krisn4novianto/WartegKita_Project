import {
    Building2,
    CheckCircle2,
    Copy,
    Smartphone,
} from "lucide-react";

import {
    useState,
} from "react";

import "../../../styles/Payment/BankTransferPayment.css";

/* =====================================================
   TYPES
===================================================== */

interface Props {
    totalAmount: number;
}

type BankType =
    | "bri"
    | "raya";

/* =====================================================
   BANK DATA
===================================================== */

const banks: Record<
    BankType,
    {
        name: string;
        account: string;
        owner: string;
        app: string;
    }
> = {
    bri: {
        name: "Bank BRI",
        account: "123456789012345",
        owner: "PT WARTEGKITA INDONESIA",
        app: "BRImo",
    },

    raya: {
        name: "Bank Raya Indonesia",
        account: "987654321098765",
        owner: "PT WARTEGKITA INDONESIA",
        app: "Raya Mobile",
    },
};

/* =====================================================
   BANK URL
===================================================== */

const bankUrls: Record<
    BankType,
    string
> = {
    bri: "https://bri.co.id/brimo",
    raya: "https://bankraya.co.id",
};

/* =====================================================
   COMPONENT
===================================================== */

export default function BankTransferPayment({
    totalAmount,
}: Props) {

    /* =================================================
       STATE
    ================================================= */

    const [
        selectedBank,
        setSelectedBank,
    ] = useState<BankType>("bri");

    const [
        copiedAccount,
        setCopiedAccount,
    ] = useState(false);

    const [
        copiedAmount,
        setCopiedAmount,
    ] = useState(false);

    /* =================================================
       SELECTED BANK
    ================================================= */

    const bank =
        banks[selectedBank];

    /* =================================================
       COPY ACCOUNT
    ================================================= */

    const copyAccount = async () => {

        try {

            await navigator.clipboard.writeText(
                bank.account
            );

            setCopiedAccount(true);

            window.setTimeout(() => {

                setCopiedAccount(false);

            }, 1800);

        } catch (error) {

            console.error(
                "Gagal menyalin nomor rekening:",
                error
            );

            alert(
                "Gagal menyalin nomor rekening."
            );
        }
    };

    /* =================================================
       COPY AMOUNT
    ================================================= */

    const copyAmount = async () => {

        try {

            await navigator.clipboard.writeText(
                String(totalAmount)
            );

            setCopiedAmount(true);

            window.setTimeout(() => {

                setCopiedAmount(false);

            }, 1800);

        } catch (error) {

            console.error(
                "Gagal menyalin nominal:",
                error
            );

            alert(
                "Gagal menyalin nominal pembayaran."
            );
        }
    };

    /* =================================================
       OPEN BANK
    ================================================= */

    const openBankApp = () => {

        window.open(
            bankUrls[selectedBank],
            "_blank",
            "noopener,noreferrer"
        );
    };

    /* =================================================
       RENDER
    ================================================= */

    return (
        <div className="bank-payment">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="bank-header">

                <div className="bank-header-icon">

                    <Building2 size={32} />

                </div>

                <div>

                    <h2>
                        Transfer Bank
                    </h2>

                    <p>
                        Pilih rekening pembayaran
                        WartegKita.
                    </p>

                </div>

            </div>

            {/* =================================================
                BANK PICKER
            ================================================= */}

            <div className="bank-picker">

                {/* BRI */}

                <button
                    type="button"
                    className={
                        selectedBank === "bri"
                            ? "bank-tab active bri"
                            : "bank-tab"
                    }
                    onClick={() =>
                        setSelectedBank("bri")
                    }
                >

                    <div className="bank-brand bri-brand">

                        BRI

                    </div>

                    <div>

                        <strong>
                            Bank BRI
                        </strong>

                        <small>
                            Pembayaran via BRImo
                        </small>

                    </div>

                </button>

                {/* BANK RAYA */}

                <button
                    type="button"
                    className={
                        selectedBank === "raya"
                            ? "bank-tab active raya"
                            : "bank-tab"
                    }
                    onClick={() =>
                        setSelectedBank("raya")
                    }
                >

                    <div className="bank-brand raya-brand">

                        Raya

                    </div>

                    <div>

                        <strong>
                            Bank Raya
                        </strong>

                        <small>
                            Pembayaran via Raya Mobile
                        </small>

                    </div>

                </button>

            </div>

            {/* =================================================
                ACCOUNT CARD
            ================================================= */}

            <div
                className={
                    selectedBank === "bri"
                        ? "account-card bri-card"
                        : "account-card raya-card"
                }
            >

                <div className="account-top">

                    <span>
                        Rekening Pembayaran
                    </span>

                    <strong>
                        {bank.name}
                    </strong>

                </div>

                <div className="account-number">

                    <span>
                        {bank.account}
                    </span>

                    <button
                        type="button"
                        onClick={copyAccount}
                        aria-label="Salin nomor rekening"
                    >

                        {copiedAccount ? (
                            <CheckCircle2
                                size={18}
                            />
                        ) : (
                            <Copy
                                size={18}
                            />
                        )}

                    </button>

                </div>

                <div className="account-footer">

                    <span>
                        Atas Nama
                    </span>

                    <strong>
                        {bank.owner}
                    </strong>

                </div>

            </div>

            {/* =================================================
                TOTAL PAYMENT
            ================================================= */}

            <div className="payment-box">

                <span>
                    Total Pembayaran
                </span>

                <h1>
                    Rp{" "}
                    {totalAmount.toLocaleString(
                        "id-ID"
                    )}
                </h1>

                <button
                    type="button"
                    className="copy-total"
                    onClick={copyAmount}
                >

                    {copiedAmount ? (
                        <CheckCircle2
                            size={18}
                        />
                    ) : (
                        <Copy
                            size={18}
                        />
                    )}

                    {copiedAmount
                        ? "Tersalin"
                        : "Salin Nominal"}

                </button>

            </div>

            {/* =================================================
                OPEN BANK APP
            ================================================= */}

            <button
                type="button"
                className={
                    selectedBank === "bri"
                        ? "bank-app-button bri-btn"
                        : "bank-app-button raya-btn"
                }
                onClick={openBankApp}
            >

                <Smartphone size={22} />

                Buka {bank.app}

            </button>

            {/* =================================================
                INSTRUCTION
            ================================================= */}

            <div className="instruction-card">

                <h3>
                    Cara Pembayaran
                </h3>

                {[
                    `Buka aplikasi ${bank.app}`,

                    "Pilih menu Transfer",

                    `Masukkan rekening ${bank.name}`,

                    "Masukkan nominal sesuai tagihan",

                    "Pastikan nama penerima sesuai",

                    "Konfirmasi transaksi",
                ].map(
                    (
                        text,
                        index
                    ) => (

                        <div
                            className="instruction-row"
                            key={index}
                        >

                            <span>
                                {index + 1}
                            </span>

                            <p>
                                {text}
                            </p>

                        </div>

                    )
                )}

            </div>

            {/* =================================================
                NOTE
            ================================================= */}

            <div className="bank-note">

                <CheckCircle2 size={22} />

                <span>
                    Setelah transfer berhasil,
                    kembali ke halaman ini lalu tekan
                    tombol{" "}
                    <b>
                        Konfirmasi Pembayaran
                    </b>.
                </span>

            </div>

        </div>
    );
}