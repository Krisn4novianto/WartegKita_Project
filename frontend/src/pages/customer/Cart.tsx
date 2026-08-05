import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import { useCartStore } from "../../store/cartStore";

import "../../styles/cart.css";


/* =====================================================
   CART PAGE
===================================================== */

export default function Cart() {
  const navigate = useNavigate();

  /* ===================================================
     CART STORE
  =================================================== */

  const items = useCartStore(
    (state) => state.items
  );

  const increase = useCartStore(
    (state) => state.increase
  );

  const decrease = useCartStore(
    (state) => state.decrease
  );

  const remove = useCartStore(
    (state) => state.remove
  );

  const total = useCartStore(
    (state) => state.total()
  );

  /* ===================================================
     TOTAL ITEMS
  =================================================== */

  const totalItems = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  /* ===================================================
     SELLER ID
     
     Jangan ambil dari useParams().
     Cart bisa dibuka dari Checkout sehingga
     URL /cart tidak mempunyai storeId.
  =================================================== */

  const sellerId =
    items.length > 0
      ? items[0]?.menu?.seller_id
      : undefined;

  /* ===================================================
     BACK TO STORE
  =================================================== */

  const handleBack = () => {
    if (
      sellerId &&
      String(sellerId).trim() !== ""
    ) {
      navigate(
        `/store/${String(sellerId).trim()}`
      );

      return;
    }

    /*
     * Kalau seller_id tidak tersedia,
     * jangan kirim undefined ke route.
     *
     * Kembali ke halaman Explore sebagai fallback.
     */
    navigate("/explore");
  };

  /* ===================================================
     EMPTY CART
  =================================================== */

  if (items.length === 0) {
    return (
      <div className="cart-page empty-cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">
            <ShoppingBag size={42} />
          </div>

          <h1>
            Keranjang masih kosong
          </h1>

          <p>
            Belum ada makanan yang kamu tambahkan.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate("/explore")
            }
          >
            Cari Makanan
          </button>

        </div>

      </div>
    );
  }

  /* ===================================================
     RENDER
  =================================================== */

  return (
    <div className="cart-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="checkout-top">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          className="back-button"
          onClick={handleBack}
        >
          <ArrowLeft size={22} />

          <span>
            Kembali
          </span>
        </button>


        {/* =================================================
            HERO
        ================================================= */}

        <div className="checkout-hero">

          <div className="checkout-header">

            <h1>
              Keranjang Pesanan
            </h1>

            <p>
              Pastikan semua menu sudah sesuai
              sebelum melanjutkan ke proses
              checkout dan pembayaran.
            </p>

          </div>


          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="checkout-progress">

            {/* CART */}

            <div className="progress-step active">

              <div className="step-circle">
                1
              </div>

              <span>
                Keranjang
              </span>

            </div>


            {/* LINE */}

            <div className="progress-line" />


            {/* CHECKOUT */}

            <div className="progress-step">

              <div className="step-circle">
                2
              </div>

              <span>
                Checkout
              </span>

            </div>


            {/* LINE */}

            <div className="progress-line" />


            {/* PAYMENT */}

            <div className="progress-step">

              <div className="step-circle">
                3
              </div>

              <span>
                Pembayaran
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="cart-layout">


        {/* =================================================
            LEFT
        ================================================= */}

        <section className="cart-items">

          {items.map((item) => {

            const price =
              Number(
                item.menu?.price
              ) || 0;

            const quantity =
              Number(
                item.quantity
              ) || 0;

            const itemSubtotal =
              price * quantity;

            return (
              <article
                key={item.menu.id}
                className="cart-item"
              >

                {/* =================================================
                    IMAGE
                ================================================= */}

                <img
                  src={
                    item.menu.image
                      ? item.menu.image.startsWith(
                        "http"
                      )
                        ? item.menu.image
                        : `http://localhost:8080/${item.menu.image}`
                      : "/images/no-image.png"
                  }
                  alt={item.menu.name}
                  className="cart-image"
                />


                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="cart-item-content">


                  {/* =================================================
                      TOP
                  ================================================= */}

                  <div className="cart-item-top">

                    <div>

                      <h3>
                        {item.menu.name}
                      </h3>

                      <p className="item-price">
                        Rp
                        {price.toLocaleString(
                          "id-ID"
                        )}
                      </p>

                    </div>


                    {/* REMOVE */}

                    <button
                      type="button"
                      className="remove-button"
                      aria-label={`Hapus ${item.menu.name}`}
                      onClick={() =>
                        remove(
                          item.menu.id
                        )
                      }
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>


                  {/* =================================================
                      BOTTOM
                  ================================================= */}

                  <div className="cart-item-bottom">


                    {/* QUANTITY */}

                    <div className="quantity-control">

                      <button
                        type="button"
                        aria-label={`Kurangi ${item.menu.name}`}
                        onClick={() =>
                          decrease(
                            item.menu.id
                          )
                        }
                      >
                        <Minus size={16} />
                      </button>

                      <span>
                        {quantity}
                      </span>

                      <button
                        type="button"
                        aria-label={`Tambah ${item.menu.name}`}
                        onClick={() =>
                          increase(
                            item.menu.id
                          )
                        }
                      >
                        <Plus size={16} />
                      </button>

                    </div>


                    {/* SUBTOTAL */}

                    <strong className="item-subtotal">

                      Rp
                      {itemSubtotal.toLocaleString(
                        "id-ID"
                      )}

                    </strong>

                  </div>

                </div>

              </article>
            );
          })}

        </section>


        {/* =================================================
            RIGHT SUMMARY
        ================================================= */}

        <aside className="order-summary">

          <h3>
            Ringkasan Pesanan
          </h3>


          {/* TOTAL ITEM */}

          <div className="summary-row">

            <span>
              Total Item
            </span>

            <strong>
              {totalItems}
            </strong>

          </div>


          {/* SUBTOTAL */}

          <div className="summary-row">

            <span>
              Subtotal
            </span>

            <strong>
              Rp
              {total.toLocaleString(
                "id-ID"
              )}
            </strong>

          </div>


          {/* SERVICE FEE */}

          <div className="summary-row">

            <span>
              Biaya Layanan
            </span>

            <strong>
              Gratis
            </strong>

          </div>


          {/* DIVIDER */}

          <div className="summary-divider" />


          {/* TOTAL */}

          <div className="summary-total">

            <span>
              Total
            </span>

            <strong>
              Rp
              {total.toLocaleString(
                "id-ID"
              )}
            </strong>

          </div>


          {/* CHECKOUT */}

          <button
            type="button"
            className="checkout-button"
            onClick={() =>
              navigate("/checkout")
            }
          >

            <span>
              Checkout
            </span>

            <ArrowRight size={18} />

          </button>

        </aside>

      </div>

    </div>
  );
}