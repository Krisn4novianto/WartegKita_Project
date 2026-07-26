import {
  QrCode,
  Building2,
  CreditCard,
  Wallet,
  Banknote,
  ArrowRight,
  ArrowLeft,
  MapPin,
  ShoppingBag,
  Bike,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import api from "../../services/api";
import "../../styles/checkout.css";
import {
  useCheckoutStore
} from "../../store/checkoutStore";

type PaymentMethod =
  | "qris"
  | "bank_transfer"
  | "virtual_account"
  | "paypal"
  | "cod";

type DeliveryType = "delivery" | "pickup";

export default function Checkout() {
  const navigate = useNavigate();

  const items = useCartStore((state) => state.items);

  const {
    pickupMethod,
    address,
    paymentMethod,
    setCheckout,
    resetCheckout,
  } = useCheckoutStore();

  const deliveryType = pickupMethod;

  // Jika keranjang kosong
  if (items.length === 0) {
    return (
      <div className="checkout-page empty-checkout">

        <div className="empty-card">

          <ShoppingBag size={54} />

          <h1>Keranjang masih kosong</h1>

          <p>
            Tambahkan makanan favoritmu terlebih dahulu sebelum melanjutkan ke proses checkout.
          </p>

          <button
            className="primary-button"
            onClick={() => navigate("/explore")}
          >
            Cari Makanan
          </button>

        </div>

      </div>
    );
  }

  const subtotal = items.reduce(
    (total, item) =>
      total + item.menu.price * item.quantity,
    0
  );

  const deliveryFee =
    deliveryType === "delivery" ? 5000 : 0;

  const total = subtotal + deliveryFee;

  // Handle Payment
  const handlePayment = async () => {
    console.log("TOMBOL LANJUT BAYAR DIKLIK");

    if (
      deliveryType === "delivery" &&
      address.trim() === ""
    ) {
      alert("Masukkan alamat");
      return;
    }

    const payload = {
      user_id: 1,
      seller_id: items[0].menu.seller_id,

      items: items.map((item) => ({
        menu_id: item.menu.id,
        quantity: item.quantity,
        price: item.menu.price,
      })),

      total: total, // <-- TAMBAHKAN INI

      delivery_type: deliveryType,

      address: deliveryType === "delivery"
        ? address
        : null,

      payment_method: paymentMethod,
    };

    console.log("KIRIM ORDER:", payload);

    try {
      const response = await api.post("/orders", payload);

      console.log("SUCCESS");
      console.log(response.data);

      navigate(`/payment/${response.data.id}`);

    } catch (err: any) {
      console.log("STATUS =", err.response?.status);
      console.log("DATA =", err.response?.data);
      console.log(err);

      alert("Checkout gagal");
    }
  };


  return (
    <div className="checkout-page">
      {/* HEADER */}
      <div className="checkout-top">

        <button
          className="back-button"
          onClick={() => { resetCheckout(); navigate("/cart"); }
          }
        >
          <ArrowLeft size={22} />
          <span>Kembali</span>
        </button>

        <div className="checkout-hero">

          <div className="checkout-header">

            <h1>Selesaikan Pesananmu</h1>

            <p>
              Tinggal satu langkah lagi. Pastikan alamat, metode
              pengambilan, dan pembayaran sudah benar sebelum melanjutkan.
            </p>
          </div>

          <div className="checkout-progress">

            <div className="progress-step done">
              <div className="step-circle">
                ✓
              </div>

              <span>Keranjang</span>
            </div>

            <div className="progress-line done"></div>

            <div className="progress-step active">
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



      <div className="checkout-layout">
        {/* LEFT */}
        <main className="checkout-main">
          {/* DELIVERY */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-number">
                1
              </div>

              <div>
                <h2>Metode Pengambilan</h2>
                <p>
                  Pilih bagaimana pesananmu diterima.
                </p>
              </div>
            </div>

            <div className="delivery-options">

              <button
                type="button"
                className={
                  deliveryType === "delivery"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() =>
                  setCheckout({
                    pickupMethod: "delivery",
                  })
                }
              >

                <span className="delivery-icon">
                  <Bike size={26} />
                </span>


                <span className="delivery-text">

                  <strong>
                    Diantar
                  </strong>

                  <small>
                    Pesanan diantar ke alamatmu
                  </small>

                </span>


                <span className="custom-radio">
                  {deliveryType === "delivery" && (
                    <span />
                  )}
                </span>


              </button>



              <button
                type="button"
                className={
                  deliveryType === "pickup"
                    ? "delivery-option active"
                    : "delivery-option"
                }
                onClick={() =>
                  setCheckout({
                    pickupMethod: "pickup",
                  })
                }
              >

                <span className="delivery-icon">
                  <ShoppingBag size={26} />
                </span>


                <span className="delivery-text">

                  <strong>
                    Ambil Sendiri
                  </strong>

                  <small>
                    Ambil langsung di warteg
                  </small>

                </span>


                <span className="custom-radio">
                  {deliveryType === "pickup" && (
                    <span />
                  )}
                </span>


              </button>



            </div>
          </section>

          {/* ADDRESS */}
          {deliveryType === "delivery" && (
            <section className="checkout-card">
              <div className="checkout-card-header">
                <div className="checkout-number">
                  2
                </div>

                <div>
                  <h2>Alamat Pengantaran</h2>

                  <p>
                    Masukkan alamat lengkap tujuan pesanan.
                  </p>
                </div>
              </div>

              <div className="address-input-wrapper">
                <MapPin size={20} />

                <textarea
                  rows={4}
                  value={address}
                  onChange={(event) =>
                    setCheckout({
                      address: event.target.value,
                    })
                  }
                  placeholder="Contoh: Jl. Kemang Raya No. 12, Jakarta Selatan"
                />
              </div>
            </section>
          )}

          {/* PAYMENT */}
          <section className="checkout-card">
            <div className="checkout-card-header">
              <div className="checkout-number">
                3
              </div>

              <div>
                <h2>Metode Pembayaran</h2>

                <p>
                  Pilih metode pembayaran yang kamu inginkan.
                </p>
              </div>
            </div>

            <div className="payment-method-list">
              <PaymentOption
                active={paymentMethod === "qris"}
                icon={<QrCode size={22} />}
                title="QRIS"
                description="Scan menggunakan mobile banking atau e-wallet."
                onClick={() =>
                  setCheckout({
                    paymentMethod: "qris",
                  })
                }
              />

              <PaymentOption
                active={
                  paymentMethod === "bank_transfer"
                }
                icon={<Building2 size={22} />}
                title="Transfer Bank / ATM"
                description="Transfer melalui ATM atau mobile banking."
                onClick={() =>
                  setCheckout({
                    paymentMethod: "bank_transfer",
                  })
                }
              />

              <PaymentOption
                active={
                  paymentMethod ===
                  "virtual_account"
                }
                icon={<CreditCard size={22} />}
                title="Virtual Account"
                description="Bayar menggunakan nomor virtual account."
                onClick={() =>
                  setCheckout({
                    paymentMethod: "virtual_account",
                  })
                }
              />

              <PaymentOption
                active={paymentMethod === "paypal"}
                icon={<Wallet size={22} />}
                title="PayPal"
                description="Bayar menggunakan akun PayPal."
                onClick={() =>
                  setCheckout({
                    paymentMethod: "paypal",
                  })
                }
              />

              <PaymentOption
                active={paymentMethod === "cod"}
                icon={<Banknote size={22} />}
                title="Cash on Delivery"
                description="Bayar ketika makanan sampai."
                onClick={() =>
                  setCheckout({
                    paymentMethod: "cod",
                  })
                }
              />
            </div>
          </section>
        </main>

        {/* RIGHT SUMMARY */}
        <aside className="checkout-summary">
          <div className="summary-header">
            <h2>Ringkasan Pesanan</h2>
            <span>{items.length} menu</span>
          </div>

          <div className="checkout-items">
            {items.map((item) => (
              <div
                className="checkout-item"
                key={item.menu.id}
              >
                <div>
                  <strong>{item.menu.name}</strong>

                  <span>
                    {item.quantity} × Rp{" "}
                    {item.menu.price.toLocaleString("id-ID")}
                  </span>
                </div>

                <strong>
                  Rp{" "}
                  {(item.menu.price * item.quantity).toLocaleString("id-ID")}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary-divider" />

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>
              Rp{subtotal.toLocaleString("id-ID")}
            </strong>
          </div>

          <div className="summary-row">
            <span>Ongkos Kirim</span>
            <strong>
              Rp
              {deliveryFee.toLocaleString("id-ID")}
            </strong>
          </div>

          <div className="summary-divider" />

          <div className="summary-total">
            <span>Total Bayar</span>
            <strong>
              Rp{total.toLocaleString("id-ID")}
            </strong>
          </div>

          {/* <button
            className="checkout-pay-button"
            onClick={() => {
              console.log("BUTTON CLICK");
              navigate("/payment/1001");
            }}
          >
            Lanjut Bayar
            <ArrowRight size={18} />
          </button> */}


          <button
            className="checkout-pay-button"
            onClick={handlePayment}
          >
            Lanjut Bayar
            <ArrowRight size={18} />
          </button>
        </aside>
      </div>
    </div >
  );
}

interface PaymentOptionProps {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function PaymentOption({
  active,
  icon,
  title,
  description,
  onClick,
}: PaymentOptionProps) {
  return (
    <button
      type="button"
      className={
        active
          ? "payment-method active"
          : "payment-method"
      }
      onClick={onClick}
    >
      <div className="payment-icon">
        {icon}
      </div>

      <div className="payment-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <div className="payment-radio">
        {active && <span />}
      </div>
    </button>
  );
}