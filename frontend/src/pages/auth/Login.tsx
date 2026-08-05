import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CircleAlert,
  ArrowRight,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/auth.css";
import WartegKitaLogo from "../../assets/images/WartegKita.png";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD REMEMBER EMAIL
  // =====================================================

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");

    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    // ===================================================
    // VALIDATION
    // ===================================================

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    if (!password.trim()) {
      setError("Password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // REQUEST LOGIN
      // =================================================

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response.data;

      // =================================================
      // AMBIL USER
      //
      // Backend yang diharapkan:
      //
      // {
      //   message: "...",
      //   token: "...",
      //   data: {
      //     id,
      //     name,
      //     email,
      //     role
      //   }
      // }
      // =================================================

      const token = data?.token;
      const user = data?.user;

      // =================================================
      // VALIDASI RESPONSE
      // =================================================

      if (!token) {
        setError("Token login tidak ditemukan.");
        return;
      }

      if (!user) {
        setError("Data user tidak ditemukan.");
        return;
      }

      if (!user.id) {
        setError("ID user tidak ditemukan.");
        return;
      }

      if (!user.role) {
        setError("Role user tidak ditemukan.");
        return;
      }

      // =================================================
      // SIMPAN TOKEN
      // =================================================

      localStorage.setItem("token", token);

      // =================================================
      // SIMPAN USER
      // =================================================

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      // =================================================
      // REMEMBER EMAIL
      // =================================================

      if (remember) {
        localStorage.setItem(
          "rememberEmail",
          email.trim()
        );
      } else {
        localStorage.removeItem("rememberEmail");
      }

      // =================================================
      // REDIRECT BERDASARKAN ROLE
      // =================================================

      if (user.role === "seller") {
        navigate(
          `/seller/${user.id}/dashboard`,
          {
            replace: true,
          }
        );
      } else {
        navigate("/", {
          replace: true,
        });
      }

    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message;

      if (backendError) {
        setError(backendError);
      } else if (err?.response?.status === 401) {
        setError("Email atau password salah.");
      } else if (err?.response?.status === 404) {
        setError("Endpoint login tidak ditemukan.");
      } else if (err?.response?.status >= 500) {
        setError(
          "Terjadi kesalahan pada server. Silakan coba lagi."
        );
      } else {
        setError(
          "Tidak dapat terhubung ke server."
        );
      }

    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="login-page">

      <div className="login-wrapper">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <section className="login-left">

          <div className="logo-box">

            <div className="logo-circle">

              <img
                src={WartegKitaLogo}
                alt="WartegKita"
              />

            </div>

            <h1>
              WartegKita
            </h1>

            <p>
              Digitalisasi Warteg Indonesia
            </p>

          </div>

          <div className="feature-card">
            🍛 Pesan makanan lebih cepat
          </div>

          <div className="feature-card">
            🏪 Mendukung UMKM Lokal
          </div>

          <div className="feature-card">
            💳 Pembayaran QRIS
          </div>

          <div className="feature-card">
            📦 Pesanan realtime
          </div>

        </section>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <section className="login-right">

          <div className="login-card">

            <span className="welcome">
              Selamat Datang 👋
            </span>

            <h2>
              Masuk ke WartegKita
            </h2>

            <p className="subtitle">
              Masuk sebagai pelanggan atau pemilik warteg.
            </p>

            {/* =================================================
                FORM
            ================================================= */}

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <label>
                Email
              </label>

              <div className="input">

                <Mail size={20} />

                <input
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

              {/* PASSWORD */}

              <label>
                Password
              </label>

              <div className="input">

                <Lock size={20} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="eye"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

              {/* REMEMBER + FORGOT */}

              <div className="remember-row">

                <label>

                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) =>
                      setRemember(
                        e.target.checked
                      )
                    }
                    disabled={loading}
                  />

                  Ingat saya

                </label>

                <Link
                  to="/forgot-password"
                  className="forgot-password"
                >
                  Lupa Password?
                </Link>

              </div>

              {/* ERROR */}

              {error && (
                <div className="error">

                  <CircleAlert size={18} />

                  <span>
                    {error}
                  </span>

                </div>
              )}

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="login-btn"
              >

                {loading ? (
                  <>
                    <div className="loader" />
                    Sedang masuk...
                  </>
                ) : (
                  <>
                    MASUK KE WARTEGKITA
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                DIVIDER
            ================================================= */}

            <div className="divider">
              <span />
            </div>

            {/* =================================================
                REGISTER
            ================================================= */}

            <div className="register">

              <span>
                Belum punya akun?
              </span>

              <Link to="/register">
                DAFTAR GRATIS
              </Link>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}