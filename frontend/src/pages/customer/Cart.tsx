import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

import { useCartStore } from "../../store/cartStore";
import {
  useNavigate,
  useParams,
} from "react-router-dom";


export default function Cart() {
  const navigate = useNavigate();
  const { storeId } = useParams();

  const items = useCartStore((state) => state.items);
  const increase = useCartStore((state) => state.increase);
  const decrease = useCartStore((state) => state.decrease);
  const remove = useCartStore((state) => state.remove);
  const total = useCartStore((state) => state.total());

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="cart-page empty-cart-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/store/${storeId}`)}
        >
          <ArrowLeft size={22} />
          <span>Kembali</span>
        </button>

        <div className="empty-cart">
          <div className="empty-cart-icon">
            <ShoppingBag size={42} />
          </div>

          <h1>Keranjang masih kosong</h1>

          <p>Belum ada makanan yang kamu tambahkan.</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/explore")}
          >
            Cari Makanan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">

      {/* HEADER */}
      <div className="checkout-top">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/store/${storeId}`)}
        >
          <ArrowLeft size={22} />
          <span>Kembali</span>
        </button>

        <div className="checkout-hero">

          <div className="checkout-header">

            <h1>Keranjang Pesanan</h1>

            <p>
              Pastikan semua menu sudah sesuai sebelum melanjutkan ke proses
              checkout dan pembayaran.
            </p>

          </div>

          <div className="checkout-progress">

            <div className="progress-step active">
              <div className="step-circle">
                1
              </div>
              <span>Keranjang</span>
            </div>

            <div className="progress-line"></div>

            <div className="progress-step">
              <div className="step-circle">
                2
              </div>
              <span>Checkout</span>
            </div>

            <div className="progress-line"></div>

            <div className="progress-step">
              <div className="step-circle">
                3
              </div>
              <span>Pembayaran</span>
            </div>

          </div>

        </div>

      </div>

      {/* ================= CONTENT ================= */}

      <div className="cart-layout">

        {/* LEFT */}

        <section className="cart-items">

          {items.map((item) => (

            <article
              key={item.menu.id}
              className="cart-item"
            >

              <img
                src={
                  item.menu.image
                    ? item.menu.image.startsWith("http")
                      ? item.menu.image
                      : `http://localhost:8080/${item.menu.image}`
                    : "/images/no-image.png"
                }
                alt={item.menu.name}
                className="cart-image"
              />

              <div className="cart-item-content">

                <div className="cart-item-top">

                  <div>

                    <h3>{item.menu.name}</h3>

                    <p className="item-price">
                      Rp{item.menu.price.toLocaleString("id-ID")}
                    </p>

                  </div>

                  <button
                    className="remove-button"
                    onClick={() => remove(item.menu.id)}
                  >
                    <Trash2 size={18} />
                  </button>

                </div>

                <div className="cart-item-bottom">

                  <div className="quantity-control">

                    <button
                      onClick={() => decrease(item.menu.id)}
                    >
                      <Minus size={16} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      onClick={() => increase(item.menu.id)}
                    >
                      <Plus size={16} />
                    </button>

                  </div>

                  <strong className="item-subtotal">
                    Rp
                    {(item.menu.price * item.quantity).toLocaleString("id-ID")}
                  </strong>

                </div>

              </div>

            </article>

          ))}

        </section>

        {/* RIGHT */}

        <aside className="order-summary">

          <h3>Ringkasan Pesanan</h3>

          <div className="summary-row">
            <span>Total Item</span>
            <strong>{totalItems}</strong>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>
              Rp{total.toLocaleString("id-ID")}
            </strong>
          </div>

          <div className="summary-row">
            <span>Biaya Layanan</span>
            <strong>Gratis</strong>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span>Total</span>
            <strong>
              Rp{total.toLocaleString("id-ID")}
            </strong>
          </div>

          <button
            className="checkout-button"
            onClick={() => navigate("/checkout")}
          >
            Checkout
            <ArrowRight size={18} />
          </button>

        </aside>

      </div>


    </div>
  );
}