import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Receipt,
  ShoppingBag,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";
import { Order } from "../../types";

import "../../styles/history-order.css";


export default function OrderDetail() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);


  useEffect(() => {

    const fetchOrder = async () => {

      try {

        const response = await api.get(`/orders/${id}`);

        setOrder(response.data);

      } catch (error) {

        console.error(
          "Gagal mengambil detail order",
          error
        );

      }

    };


    fetchOrder();

  }, [id]);



  const formatPrice = (value: number) =>
    Number(value || 0)
      .toLocaleString("id-ID");



  const statusLabel = (status: string) => {

    switch (status) {

      case "pending":
        return "Menunggu Pembayaran";

      case "paid":
        return "Sudah Dibayar";

      case "processing":
        return "Sedang Diproses";

      case "completed":
        return "Selesai";

      case "cancelled":
        return "Dibatalkan";

      default:
        return status;

    }

  };



  const StatusIcon = () => {

    if (order?.status === "completed")
      return <CheckCircle2 />;


    if (order?.status === "cancelled")
      return <XCircle />;


    return <Clock3 />;

  };



  if (!order) {

    return (
      <div className="order-detail-loading">
        Memuat detail pesanan...
      </div>
    );

  }



  return (

    <div className="order-detail-page">


      <button
        className="back-order"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} />
        Kembali
      </button>



      <div className="detail-header">

        <div>

          <h1>
            Detail Pesanan
          </h1>


          <p>
            {order.order_number ||
              `Order #${order.id}`}
          </p>

        </div>


        <Receipt size={34} />

      </div>



      <div className="status-card">


        <div className="status-icon">

          <StatusIcon />

        </div>


        <div>

          <span>Status Pesanan</span>

          <h3>
            {statusLabel(order.status)}
          </h3>

        </div>


      </div>




      <div className="detail-card">


        <div className="card-title">

          <ShoppingBag size={20} />

          <h3>
            Daftar Menu
          </h3>

        </div>



        {order.items?.map((item) => (

          <div
            className="menu-row"
            key={item.id}
          >

            <div>

              <strong>
                {item.menu_name}
              </strong>


              <p>
                Jumlah: {item.quantity}
              </p>

            </div>


            <span>
              Rp {formatPrice(item.subtotal)}
            </span>


          </div>


        ))}


      </div>





      <div className="detail-card">


        <div className="card-title">

          <MapPin size={20} />

          <h3>
            Informasi Pembayaran
          </h3>

        </div>


        <div className="payment-row">

          <span>
            Total Pembayaran
          </span>


          <strong>
            Rp {formatPrice(order.total_amount)}
          </strong>


        </div>


        <div className="payment-row">

          <span>
            Metode Pembayaran
          </span>


          <strong>
            {order.payment_method || "-"}
          </strong>


        </div>


      </div>





      {
        order.status === "pending" && (

          <button
            className="continue-payment"
            onClick={() =>
              navigate(`/payment/${order.id}`)
            }
          >

            Lanjutkan Pembayaran

          </button>

        )
      }



    </div>

  );

}