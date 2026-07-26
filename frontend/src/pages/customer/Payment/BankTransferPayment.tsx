import {
    Building2,
    Copy,
    CheckCircle2,
    Smartphone,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import "../../../styles/Payment/BankTransferPayment.css";


interface Props {
    total: number;
}



type BankType =
    | "bri"
    | "raya";




const banks = {

    bri: {

        name: "Bank BRI",

        account: "123456789012345",

        owner:
            "PT WARTEGKITA INDONESIA",

        app:
            "BRImo",

        color:
            "#0066b3"

    },


    raya: {

        name:
            "Bank Raya Indonesia",

        account:
            "987654321098765",

        owner:
            "PT WARTEGKITA INDONESIA",

        app:
            "Raya Mobile",

        color:
            "#00a859"

    }

};





export default function BankTransferPayment({
    total
}: Props) {



    const [
        selectedBank,
        setSelectedBank
    ] = useState<BankType>("bri");

    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [expired, setExpired] = useState(false);


    const bank = banks[selectedBank];
    useEffect(() => {
        if (expired) return;

        const STORAGE_KEY = "bank_transfer_expired_at";

        let expiredAt = localStorage.getItem(STORAGE_KEY);

        if (!expiredAt) {
            expiredAt = (
                Date.now() + 15 * 60 * 1000
            ).toString();

            localStorage.setItem(STORAGE_KEY, expiredAt);
        }

        const updateTimer = () => {
            const remaining = Math.max(
                0,
                Math.floor(
                    (Number(expiredAt) - Date.now()) / 1000
                )
            );

            setTimeLeft(remaining);

            if (remaining <= 0) {
                setExpired(true);
                localStorage.removeItem(STORAGE_KEY);
            }
        };

        updateTimer(); // langsung update

        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expired]);





    const minutes = String(
        Math.floor(timeLeft / 60)
    ).padStart(2, "0");

    const seconds = String(
        timeLeft % 60
    ).padStart(2, "0");

    const handleRetryPayment = () => {
        const expiredAt =
            Date.now() + 15 * 60 * 1000;

        localStorage.setItem(
            "bank_transfer_expired_at",
            expiredAt.toString()
        );

        setTimeLeft(15 * 60);

        setExpired(false);
    };

    const bankUrls: Record<BankType, string> = {
        bri: "https://bri.co.id/brimo",
        raya: "https://bankraya.co.id",
    };

    const copyAccount = async () => {
        try {
            await navigator.clipboard.writeText(bank.account);
            alert("Nomor rekening berhasil disalin");
        } catch {
            alert("Gagal menyalin nomor rekening");
        }
    };

    const copyAmount = async () => {
        try {
            await navigator.clipboard.writeText(total.toString());
            alert("Nominal pembayaran berhasil disalin");
        } catch {
            alert("Gagal menyalin nominal pembayaran");
        }
    };

    const openBankApp = () => {
        window.open(bankUrls[selectedBank], "_blank");
    };












    return (

        <div className="bank-payment">

            {
                expired && (
                    <div className="payment-expired-overlay">

                        <div className="payment-expired-modal">

                            <div className="expired-icon">
                                <Building2 size={40} />
                            </div>

                            <h2>
                                Pembayaran Gagal
                            </h2>

                            <p>
                                Waktu pembayaran Transfer Bank
                                sudah habis.
                                Silakan ulangi pembayaran lagi.
                            </p>

                            <button
                                onClick={handleRetryPayment}
                            >
                                Ulangi Pembayaran
                            </button>

                        </div>

                    </div>
                )
            }



            {/* HEADER */}

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







            {/* SELECT BANK */}


            <div className="bank-picker">



                <button

                    className={
                        selectedBank === "bri"
                            ?
                            "bank-tab active bri"
                            :
                            "bank-tab"
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







                <button

                    className={
                        selectedBank === "raya"
                            ?
                            "bank-tab active raya"
                            :
                            "bank-tab"
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









            {/* ACCOUNT CARD */}



            <div
                className={
                    selectedBank === "bri"
                        ?
                        "account-card bri-card"
                        :
                        "account-card raya-card"
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


                    {bank.account}



                    <button
                        onClick={copyAccount}
                    >

                        <Copy size={18} />

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









            {/* TOTAL */}

            <div className="payment-box">

                <span>
                    Total Pembayaran
                </span>

                <h1>
                    Rp {total.toLocaleString("id-ID")}
                </h1>

                <button
                    className="copy-total"
                    onClick={copyAmount}
                >
                    <Copy size={18} />
                    Salin Nominal
                </button>

            </div>

            <div className="payment-status-card">

                <div className="payment-status-top">

                    <div className="payment-status-left">

                        <span>Status Pembayaran</span>

                        <div className="payment-badge">
                            <div className="payment-dot"></div>
                            Menunggu Pembayaran
                        </div>

                    </div>

                    <div className="payment-timer">

                        <span>Batas Waktu</span>

                        <h2>
                            {minutes}:{seconds}
                        </h2>

                    </div>

                </div>

                <p>
                    Transfer sesuai nominal agar pembayaran dapat
                    terverifikasi otomatis.
                </p>

            </div>

            <button
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




            {/* INSTRUCTION */}



            <div className="instruction-card">


                <h3>
                    Cara Pembayaran
                </h3>




                {[
                    `Buka aplikasi ${bank.app}`,

                    "Pilih menu Transfer",

                    `Masukkan rekening ${bank.name}`,

                    "Masukkan nominal sesuai tagihan",

                    "Konfirmasi transaksi"

                ].map(
                    (text, index) => (


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


                    ))}


            </div>









            {/* NOTE */}


            <div className="bank-note">

                <CheckCircle2 size={22} />

                <span>
                    Setelah transfer berhasil, tekan tombol{" "}
                    <b>Konfirmasi Pembayaran</b>{" "}
                    pada halaman berikutnya.
                </span>

            </div>

        </div >
    );
}

