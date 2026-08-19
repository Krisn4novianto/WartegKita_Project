import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

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

import WartegKitaLogo
  from "../../assets/images/WartegKita.png";


// =====================================================
// USER TYPE
// =====================================================

type User = {
  id: string;
  name?: string;
  email?: string;
  role: "customer" | "seller";
};


// =====================================================
// LOGIN
// =====================================================

export default function Login() {

  const navigate = useNavigate();


  // =====================================================
  // FORM
  // =====================================================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");


  // =====================================================
  // UI
  // =====================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD REMEMBER EMAIL
  // =====================================================

  useEffect(() => {

    const savedEmail =
      localStorage.getItem(
        "rememberEmail"
      );

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

    const normalizedEmail =
      email.trim().toLowerCase();


    if (!normalizedEmail) {

      setError(
        "Email wajib diisi."
      );

      return;
    }


    if (!password) {

      setError(
        "Password wajib diisi."
      );

      return;
    }


    // ===================================================
    // EMAIL VALIDATION
    // ===================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailRegex.test(
        normalizedEmail
      )
    ) {

      setError(
        "Format email tidak valid."
      );

      return;
    }


    try {

      setLoading(true);


      // =================================================
      // CLEAR ERROR
      // =================================================

      setError("");


      // =================================================
      // LOGIN REQUEST
      // =================================================

      const response =
        await api.post(
          "/auth/login",
          {
            email:
              normalizedEmail,

            password,
          }
        );


      // =================================================
      // BACKEND RESPONSE
      // =================================================
      //
      // Backend:
      //
      // {
      //   success: true,
      //   message: "Login berhasil",
      //   token: "...",
      //   data: {
      //     id,
      //     name,
      //     email,
      //     role
      //   }
      // }
      //
      // =================================================

      const responseData =
        response?.data;


      console.log(
        "LOGIN RESPONSE:",
        responseData
      );


      // =================================================
      // TOKEN
      // =================================================

      const token =
        responseData?.token;


      if (
        !token ||
        typeof token !== "string"
      ) {

        setError(
          "Token login tidak ditemukan dari server."
        );

        return;
      }


      // =================================================
      // USER
      // =================================================
      //
      // PRIORITAS:
      //
      // data
      // user
      //
      // Supaya kompatibel dengan response
      // backend lama maupun baru.
      //
      // =================================================

      const rawUser =
        responseData?.data ??
        responseData?.user ??
        null;


      if (!rawUser) {

        console.error(
          "USER DATA TIDAK DITEMUKAN:",
          responseData
        );

        setError(
          "Data user tidak ditemukan."
        );

        return;
      }


      // =================================================
      // NORMALIZE USER
      // =================================================

      const userId =
        rawUser?.id ??
        rawUser?.user_id ??
        rawUser?.userId ??
        "";


      const userRole =
        String(
          rawUser?.role ??
          ""
        )
          .trim()
          .toLowerCase();


      const userName =
        rawUser?.name ??
        rawUser?.nama ??
        "";


      const userEmail =
        rawUser?.email ??
        normalizedEmail;


      // =================================================
      // VALIDATE USER ID
      // =================================================

      if (!userId) {

        console.error(
          "ID USER TIDAK DITEMUKAN:",
          rawUser
        );

        setError(
          "ID user tidak ditemukan."
        );

        return;
      }


      // =================================================
      // VALIDATE ROLE
      // =================================================

      if (
        userRole !== "customer" &&
        userRole !== "seller"
      ) {

        console.error(
          "ROLE USER TIDAK VALID:",
          rawUser
        );

        setError(
          "Role user tidak valid."
        );

        return;
      }


      // =================================================
      // FINAL USER OBJECT
      // =================================================

      const user: User = {

        id:
          String(userId),

        name:
          String(userName),

        email:
          String(userEmail),

        role:
          userRole as
          | "customer"
          | "seller",
      };


      // =================================================
      // CLEAR OLD AUTH DATA
      // =================================================
      //
      // Penting supaya akun seller/customer sebelumnya
      // tidak ikut terbawa.
      //
      // =================================================

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "user_id"
      );

      localStorage.removeItem(
        "seller_id"
      );


      // =================================================
      // SAVE TOKEN
      // =================================================

      localStorage.setItem(
        "token",
        token
      );


      // =================================================
      // SAVE USER
      // =================================================

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );


      // =================================================
      // SAVE USER ID
      // =================================================

      localStorage.setItem(
        "user_id",
        String(user.id)
      );


      // =================================================
      // SELLER ID
      // =================================================
      //
      // Pada sistem WartegKita:
      //
      // seller_id = user.id
      //
      // ketika account role = seller.
      //
      // =================================================

      if (
        user.role ===
        "seller"
      ) {

        localStorage.setItem(
          "seller_id",
          String(user.id)
        );
      }


      // =================================================
      // REMEMBER EMAIL
      // =================================================

      if (remember) {

        localStorage.setItem(
          "rememberEmail",
          normalizedEmail
        );

      } else {

        localStorage.removeItem(
          "rememberEmail"
        );
      }


      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "LOGIN SUCCESS"
      );

      console.log(
        "User:",
        user
      );

      console.log(
        "Role:",
        user.role
      );

      console.log(
        "User ID:",
        user.id
      );


      // =================================================
      // REDIRECT SELLER
      // =================================================

      if (
        user.role ===
        "seller"
      ) {

        navigate(
          `/seller/${user.id}/dashboard`,
          {
            replace: true,
          }
        );

        return;
      }


      // =================================================
      // REDIRECT CUSTOMER
      // =================================================

      navigate(
        "/",
        {
          replace: true,
        }
      );

    } catch (
    err: any
    ) {

      console.error(
        "LOGIN ERROR:",
        err
      );


      // =================================================
      // BACKEND ERROR
      // =================================================

      const backendError =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "";


      // =================================================
      // 400
      // =================================================

      if (
        err?.response?.status ===
        400
      ) {

        setError(
          backendError ||
          "Data login tidak valid."
        );

        return;
      }


      // =================================================
      // 401
      // =================================================

      if (
        err?.response?.status ===
        401
      ) {

        setError(
          backendError ||
          "Email atau password salah."
        );

        return;
      }


      // =================================================
      // 404
      // =================================================

      if (
        err?.response?.status ===
        404
      ) {

        setError(
          backendError ||
          "Endpoint login tidak ditemukan."
        );

        return;
      }


      // =================================================
      // 500
      // =================================================

      if (
        err?.response?.status &&
        err.response.status >= 500
      ) {

        setError(
          backendError ||
          "Terjadi kesalahan pada server. Silakan coba lagi."
        );

        return;
      }


      // =================================================
      // NETWORK ERROR
      // =================================================

      if (
        !err?.response
      ) {

        setError(
          "Tidak dapat terhubung ke server. Pastikan backend WartegKita sedang berjalan."
        );

        return;
      }


      // =================================================
      // FALLBACK
      // =================================================

      setError(
        backendError ||
        "Login gagal. Silakan coba lagi."
      );

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


          {/* =================================================
              LOGO
          ================================================= */}

          <div className="logo-box">

            <div className="logo-circle">

              <img
                src={
                  WartegKitaLogo
                }
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


          {/* =================================================
              FEATURES
          ================================================= */}

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


            {/* =================================================
                HEADER
            ================================================= */}

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

            <form
              onSubmit={
                handleLogin
              }
            >


              {/* =================================================
                  EMAIL
              ================================================= */}

              <label>
                Email
              </label>


              <div className="input">

                <Mail
                  size={20}
                />


                <input
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  autoComplete="email"
                  disabled={loading}
                />

              </div>


              {/* =================================================
                  PASSWORD
              ================================================= */}

              <label>
                Password
              </label>


              <div className="input">

                <Lock
                  size={20}
                />


                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
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

                  {
                    showPassword ? (

                      <EyeOff
                        size={18}
                      />

                    ) : (

                      <Eye
                        size={18}
                      />

                    )
                  }

                </button>

              </div>


              {/* =================================================
                  REMEMBER + FORGOT
              ================================================= */}

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


              {/* =================================================
                  ERROR
              ================================================= */}

              {
                error && (

                  <div className="error">

                    <CircleAlert
                      size={18}
                    />

                    <span>
                      {error}
                    </span>

                  </div>

                )
              }


              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="login-btn"
              >

                {
                  loading ? (

                    <>

                      <div className="loader" />

                      Sedang masuk...

                    </>

                  ) : (

                    <>

                      MASUK KE WARTEGKITA

                      <ArrowRight
                        size={18}
                      />

                    </>

                  )
                }

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