import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ShoppingBag,
  Clock3,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";
import { Order } from "../../types";

import "../../styles/orders.css";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const response = await api.get("/orders");

        setOrders(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err: any) {
        console.error(err);

        setError(
          err.response?.data?.message ||
          "Gagal mengambil data pesanan"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatPrice = (value: number) =>
    Number(value || 0).toLocaleString("id-ID");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
      case "paid":
        return <CheckCircle2 size={16} />;

      case "cancelled":
        return <XCircle size={16} />;

      default:
        return <Clock3 size={16} />;
    }
  };

  const getStatusLabel = (status: string) => {
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

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-title">
          <div>
            <h1>Pesanan Saya</h1>
            <p>Riwayat transaksi kamu</p>
          </div>

          <ShoppingBag size={34} />
        </div>

        <div className="orders-list">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="order-skeleton"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="error-box">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-title">
        <div>
          <h1>Pesanan Saya</h1>
          <p>Pantau semua pesanan makanan kamu</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-icon">
            <ShoppingBag size={40} />
          </div>

          <h2>Belum Ada Pesanan</h2>

          <p>
            Kamu belum memiliki riwayat pesanan.
            Yuk jelajahi berbagai warteg favoritmu
            dan mulai pesan sekarang.
          </p>

          <Link
            to="/explore"
            className="start-order"
          >
            Mulai Pesan
          </Link>
        </div>
      ) : (

        <div className="orders-list">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="order-card"
            >
              <div className="order-top">
                <div className="order-left">
                  <div className="order-icon">
                    <ShoppingBag size={22} />
                  </div>

                  <div className="order-info">
                    <h3>
                      {order.order_number || `Order #${order.id}`}
                    </h3>

                    <p>Pesanan WartegKita</p>
                  </div>
                </div>

                <div
                  className={`order-status status-${order.status}`}
                >
                  {getStatusIcon(order.status)}
                  <span>{getStatusLabel(order.status)}</span>
                </div>
              </div>

              <div className="order-divider" />

              <div className="order-bottom">
                <div className="order-price">
                  <span>Total Pembayaran</span>

                  <strong>
                    Rp {formatPrice(order.total_amount)}
                  </strong>
                </div>

                <ArrowRight
                  size={20}
                  className="order-arrow"
                />
              </div>
            </Link>
          ))}
        </div>


      )}
    </div>
  );
}