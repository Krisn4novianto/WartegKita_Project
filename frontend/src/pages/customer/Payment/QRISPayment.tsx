import {
    Download,
    QrCode,
    Smartphone,
    CheckCircle2,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import "../../../styles/Payment/qris.css";


interface Props {
    total: number;
}


export default function QRISPayment({
    total,
}: Props) {


    const [timeLeft, setTimeLeft] = useState(
        15 * 60
    );


    const [showToast, setShowToast] =
        useState(false);




    useEffect(() => {

        const timer = setInterval(() => {

            setTimeLeft((prev) => {

                if (prev <= 1) {

                    clearInterval(timer);

                    setExpired(true);

                    return 0;

                }

                return prev - 1;

            });

        }, 1000);


        return () => clearInterval(timer);

    }, []);



    const minutes = Math.floor(
        timeLeft / 60
    );


    const seconds = timeLeft % 60;

    const [expired, setExpired] = useState(false);





    const handleDownloadQR = () => {


        const qrElement =
            document.getElementById(
                "qris-download"
            );


        if (!qrElement) return;



        const svg =
            new XMLSerializer()
                .serializeToString(
                    qrElement
                );



        const blob =
            new Blob(
                [svg],
                {
                    type:
                        "image/svg+xml"
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



        link.href = url;


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



        setShowToast(true);



        setTimeout(() => {

            setShowToast(false);

        }, 3000);


    };





    return (

        <div className="qris-payment">

            {
                expired && (

                    <div className="payment-expired-overlay">

                        <div className="payment-expired-modal">


                            <div className="expired-icon">

                                <QrCode size={40} />

                            </div>


                            <h2>
                                Pembayaran Gagal
                            </h2>


                            <p>
                                Waktu pembayaran QRIS sudah habis.
                                Silahkan ulangi pembayaran lagi.
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



            {/* TOAST */}

            {showToast && (

                <div className="qris-toast">

                    <CheckCircle2 size={22} />

                    <span>
                        Scan QR berhasil di download!
                    </span>

                </div>

            )}





            {/* HEADER */}

            <div className="qris-header">


                <div className="qris-icon">

                    <QrCode size={34} />

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






            {/* QR CARD */}

            <div className="qris-card">


                <div
                    className="fake-qr"
                    id="qris-download"
                >


                    <QrCode size={180} />


                    <span>
                        QRIS WARTEGKITA
                    </span>


                </div>






                <div className="payment-total">


                    <small>
                        Total Pembayaran
                    </small>




                    <h1>

                        Rp{" "}

                        {total.toLocaleString(
                            "id-ID"
                        )}

                    </h1>





                    <button
                        className="download-button"
                        onClick={handleDownloadQR}
                        disabled={expired}
                    >

                        <Download size={18} />

                        Download QR


                    </button>



                </div>



            </div>









            {/* COUNTDOWN */}

            <div className="payment-countdown">


                <strong>
                    Selesaikan pembayaran dalam
                </strong>




                <h2
                    className={
                        timeLeft <= 60
                            ? "danger-time"
                            : ""
                    }
                >

                    {String(minutes)
                        .padStart(
                            2,
                            "0"
                        )}

                    {" : "}

                    {String(seconds)
                        .padStart(
                            2,
                            "0"
                        )}

                </h2>


            </div>









            {/* INSTRUCTION */}

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









            {/* NOTE */}

            <div className="payment-note">


                <CheckCircle2 />


                <span>

                    Setelah pembayaran berhasil,
                    klik tombol

                    <b>
                        {" "}Konfirmasi Pembayaran{" "}
                    </b>

                    di bawah halaman.

                </span>


            </div>









            {/* WALLET */}

            <div className="supported-wallet">


                <Smartphone size={22} />


                <span>

                    Mendukung GoPay • DANA • OVO •

                    ShopeePay • Mobile Banking •

                    LinkAja

                </span>


            </div>





        </div>

    );

}





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