import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ChefHat,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  CircleAlert,
  CheckCircle2,
  Store,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/auth.css";
import WartegKitaLogo from "../../assets/images/WartegKita.png";


export default function Register() {

  const navigate = useNavigate();


  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");


  const [showPassword, setShowPassword] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);


  const [accountType, setAccountType] = useState<
    "customer" | "seller"
  >("customer");


  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);



  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();


    setError("");


    if (!name.trim()) {

      setError("Nama wajib diisi.");

      return;

    }


    if (!email.trim()) {

      setError("Email wajib diisi.");

      return;

    }


    if (!password.trim()) {

      setError("Password wajib diisi.");

      return;

    }


    if (password.length < 8) {

      setError(
        "Password minimal 8 karakter."
      );

      return;

    }


    if (password !== confirmPassword) {

      setError(
        "Konfirmasi password tidak sama."
      );

      return;

    }



    try {

      setLoading(true);



      await api.post(
        "/auth/register",
        {
          name,
          email,
          password,
          role: accountType,

        }
      );



      setSuccess(true);



      setName("");

      setEmail("");

      setPassword("");

      setConfirmPassword("");



    } catch (err: any) {


      setError(
        err.response?.data?.error ??
        "Pendaftaran gagal."
      );


    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="login-page">


      <div className="login-wrapper">



        {/* LEFT */}

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
            🍛 Pesan makanan warteg favorit
          </div>


          <div className="feature-card">
            🏪 Buka toko warteg online
          </div>


          <div className="feature-card">
            💳 Pembayaran QRIS & Transfer
          </div>


          <div className="feature-card">
            📦 Kelola pesanan lebih mudah
          </div>


        </section>





        {/* RIGHT */}


        <section className="login-right">


          <div className="login-card">



            <div className="auth-badge">

              <span className="badge-icon">

                <CheckCircle2 size={14} />

              </span>


              <span>
                Bergabung Gratis
              </span>


            </div>




            <h2>
              Buat Akun
            </h2>



            <p className="subtitle">

              Daftar sebagai pelanggan
              atau pemilik warteg.

            </p>





            <form onSubmit={handleRegister}>


              {/* ROLE */}


              <label>
                Daftar Sebagai
              </label>


              <div className="role-choice">


                <button

                  type="button"

                  className={
                    accountType === "customer"
                      ? "active"
                      : ""
                  }

                  onClick={() =>
                    setAccountType("customer")
                  }

                >

                  🍛 Pembeli

                </button>





                <button

                  type="button"

                  className={
                    accountType === "seller"
                      ? "active"
                      : ""
                  }

                  onClick={() =>
                    setAccountType("seller")
                  }

                >

                  <Store size={18} />

                  Warteg

                </button>



              </div>





              <label>
                Nama Lengkap
              </label>


              <div className="input">


                <User size={20} />


                <input

                  type="text"

                  placeholder="Nama lengkap"

                  value={name}

                  onChange={(e) =>
                    setName(e.target.value)
                  }

                />


              </div>






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

                />


              </div>





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

                  placeholder="Minimal 8 karakter"

                  value={password}

                  onChange={(e) =>
                    setPassword(e.target.value)
                  }

                />



                <button

                  type="button"

                  className="eye"

                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }

                >

                  {
                    showPassword
                      ?
                      <EyeOff size={18} />
                      :
                      <Eye size={18} />
                  }


                </button>


              </div>






              <label>
                Konfirmasi Password
              </label>




              <div className="input">


                <Lock size={20} />



                <input

                  type={
                    showConfirm
                      ? "text"
                      : "password"
                  }

                  placeholder="Ulangi password"

                  value={confirmPassword}

                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }

                />




                <button

                  type="button"

                  className="eye"

                  onClick={() =>
                    setShowConfirm(
                      !showConfirm
                    )
                  }

                >

                  {
                    showConfirm
                      ?
                      <EyeOff size={18} />
                      :
                      <Eye size={18} />
                  }


                </button>


              </div>






              {
                error && (

                  <div className="error">

                    <CircleAlert size={18} />

                    {error}

                  </div>

                )
              }







              <button

                className="login-btn"

                disabled={loading}

              >


                {
                  loading

                    ?

                    <>
                      <div className="loader" />
                      Mendaftarkan...
                    </>


                    :

                    <>
                      <UserPlus size={20} />
                      DAFTAR SEKARANG
                    </>

                }



              </button>



            </form>







            <div className="divider">

              <span />

            </div>







            <div className="register">


              Sudah punya akun?


              <Link to="/login">

                MASUK SEKARANG

              </Link>


            </div>




          </div>


        </section>




      </div>









      {
        success && (


          <div className="success-overlay">


            <div className="success-popup">



              <div className="success-icon">


                <CheckCircle2 size={50} />


              </div>





              <h3>

                Pendaftaran Berhasil 🎉

              </h3>





              <p>


                {
                  accountType === "seller"

                    ?

                    "Akun warteg berhasil dibuat. Silakan login dan lengkapi profil toko."

                    :

                    "Akun pelanggan berhasil dibuat. Silakan login untuk mulai memesan makanan."

                }


              </p>





              <button

                onClick={() =>
                  navigate("/login")
                }

              >

                LOGIN SEKARANG


              </button>



            </div>


          </div>


        )
      }




    </div>

  );

}