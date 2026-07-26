import {
  CheckCircle2,
  ShoppingBag,
  Clock3,
  Store,
  ReceiptText,
  Home,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../../styles/order-success.css";


export default function OrderSuccess() {

  const navigate = useNavigate();

  const location = useLocation();



  const {
    orderId,
    total,
    restaurant,
    paymentMethod,
  } = location.state || {};



  const today =
    new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");



  const restaurantCode = (
    restaurant || "WARTEG"
  )
    .toUpperCase()
    .replaceAll(" ", "-");


  const orderNumber =
    `${restaurantCode}.${today}.${String(orderId || 0)
      .padStart(3, "0")}`;



  const paymentLabel =
    paymentMethod === "qris"
      ? "QRIS"
      : paymentMethod === "bank_transfer"
        ? "Transfer Bank"
        : paymentMethod === "virtual_account"
          ? "Virtual Account"
          : paymentMethod === "cod"
            ? "Cash On Delivery"
            : "Pembayaran Online";



  return (

    <div className="success-page">


      <div className="success-card">



        {/* SUCCESS ICON */}
        <div className="success-header">

          <div className="success-icon">
            <CheckCircle2 size={64} />
          </div>


          <span className="eyebrow">
            PEMBAYARAN BERHASIL
          </span>


          <h1>
            Pesanan Berhasil!
          </h1>

        </div>

        {/* MESSAGE */}

        <div className="success-message">


          <p>

            Terima kasih sudah memesan.

          </p>


          <span>

            Pesananmu sedang disiapkan!

          </span>


        </div>







        {/* STATUS */}

        <div className="order-status">


          <div className="status-icon">

            <Clock3 size={22} />

          </div>



          <div>

            <strong>

              Sedang Diproses

            </strong>


            <p>

              Estimasi siap 20 - 30 menit

            </p>

          </div>


        </div>







        {/* DETAIL */}

        <div className="success-order-info">


          <div className="info-title">


            <ReceiptText size={20} />


            Detail Pesanan


          </div>





          <div className="info-row">


            <span>

              Nomor Pesanan

            </span>


            <strong>

              {orderNumber}

            </strong>


          </div>





          <div className="info-row">


            <span>

              Total Pembayaran

            </span>


            <strong className="price">

              Rp
              {Number(total || 0)
                .toLocaleString(
                  "id-ID"
                )}

            </strong>


          </div>





          <div className="info-row">


            <span>

              Metode

            </span>


            <strong>

              {paymentLabel}

            </strong>


          </div>


        </div>







        {/* TIMELINE */}

        <div className="timeline">


          <div className="timeline-item active">


            <CheckCircle2 />


            <div>


              <strong>

                Pembayaran diterima

              </strong>


              <p>

                Pesanan berhasil dibuat

              </p>


            </div>


          </div>







          <div className="timeline-item active">


            <Store />


            <div>


              <strong>

                {restaurant || "Warteg"}
                {" "}
                menyiapkan pesanan

              </strong>


              <p>

                Sedang diproses

              </p>


            </div>


          </div>







          <div className="timeline-item">


            <ShoppingBag />


            <div>


              <strong>

                Pesanan selesai

              </strong>


              <p>

                Siap diambil / dikirim

              </p>


            </div>


          </div>


        </div>







        {/* ACTION */}

        <div className="success-actions">


          <button

            className="primary-button"

            onClick={() =>
              navigate("/orders")
            }

          >

            <ShoppingBag size={18} />

            Lihat Pesanan


          </button>





          <button

            className="secondary-button"

            onClick={() =>
              navigate("/")
            }

          >

            <Home size={18} />

            Home


          </button>


        </div>



      </div>


    </div>

  );

}