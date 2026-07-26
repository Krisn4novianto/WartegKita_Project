import {
    Banknote,
    Truck,
    PackageCheck,
    CheckCircle2,
} from "lucide-react";

import "../../../styles/Payment/CODPayment.css";

interface Props {
    total: number;
}

export default function CODPayment({
    total,
}: Props) {

    return (

        <div className="cod-payment">

            <div className="cod-header">

                <div className="cod-icon">
                    <Truck size={34} />
                </div>

                <div>

                    <h2>Cash On Delivery</h2>

                    <p>
                        Bayar langsung kepada kurir
                        saat pesanan diterima.
                    </p>

                </div>

            </div>

            <div className="cod-card">

                <div className="cod-image">

                    <PackageCheck size={70} />

                </div>

                <div className="cod-total">

                    <small>Total Pembayaran</small>

                    <h1>
                        Rp {total.toLocaleString("id-ID")}
                    </h1>

                    <p>
                        Siapkan uang pas untuk
                        mempercepat proses transaksi.
                    </p>

                </div>

            </div>

            <div className="cod-instruction">

                <h3>Prosedur COD</h3>

                <div className="cod-step">
                    <span>1</span>
                    <p>Kurir mengantarkan pesanan.</p>
                </div>

                <div className="cod-step">
                    <span>2</span>
                    <p>Periksa pesanan.</p>
                </div>

                <div className="cod-step">
                    <span>3</span>
                    <p>Bayarkan sesuai tagihan.</p>
                </div>

                <div className="cod-step">
                    <span>4</span>
                    <p>Kurir mengonfirmasi pembayaran.</p>
                </div>

            </div>

            <div className="cod-warning">

                <Banknote size={22} />

                <span>

                    Pembayaran dilakukan saat
                    makanan diterima. Mohon siapkan
                    uang sesuai nominal agar proses
                    lebih cepat.

                </span>

            </div>

            <div className="cod-note">

                <CheckCircle2 size={22} />

                <span>

                    Setelah pembayaran diterima,
                    tekan tombol
                    <b> Konfirmasi Pembayaran </b>
                    di bawah halaman.

                </span>

            </div>

        </div>

    );
}