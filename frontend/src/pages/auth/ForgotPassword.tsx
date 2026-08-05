import { useState } from "react";
import { Link } from "react-router-dom";

import {
    Mail,
    ArrowLeft,
    Send,
    CircleAlert,
    CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import "../../styles/forgot-password.css";

import WartegKitaLogo from "../../assets/images/WartegKita.png";


export default function ForgotPassword() {


    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");



    async function handleSubmit(
        e: React.FormEvent<HTMLFormElement>
    ) {

        e.preventDefault();


        setError("");
        setSuccess("");



        if (!email.trim()) {

            setError(
                "Email wajib diisi."
            );

            return;

        }



        try {


            setLoading(true);



            await api.post(
                "/auth/forgot-password",
                {
                    email,
                }
            );



            setSuccess(
                "Kode OTP berhasil dikirim ke email Anda."
            );

            setEmail("");



        } catch (err: any) {


            setError(
                err.response?.data?.error ??
                "Gagal mengirim permintaan reset password."
            );


        } finally {


            setLoading(false);


        }


    }





    return (

        <div className="forgot-page">


            <div className="forgot-card">



                <div className="forgot-logo">


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





                <div className="forgot-header">


                    <h2>
                        Lupa Password?
                    </h2>


                    <p>
                        Masukkan email yang terdaftar.
                        Kami akan mengirimkan kode OTP untuk mengatur ulang password Anda.
                    </p>


                </div>






                <form
                    onSubmit={handleSubmit}
                >


                    <label>
                        Email
                    </label>



                    <div className="forgot-input">


                        <Mail size={20} />


                        <input

                            type="email"

                            placeholder="contoh@email.com"

                            value={email}

                            onChange={(e) =>
                                setEmail(
                                    e.target.value
                                )
                            }

                        />


                    </div>






                    {
                        error && (

                            <div className="forgot-error">

                                <CircleAlert size={18} />

                                {error}

                            </div>

                        )
                    }






                    {
                        success && (

                            <div className="forgot-success">

                                <CheckCircle2 size={18} />

                                {success}

                            </div>

                        )
                    }






                    <button

                        className="forgot-button"

                        disabled={loading}

                    >


                        {
                            loading

                                ?

                                "Mengirim..."

                                :

                                <>
                                    Kirim OTP
                                    <Send size={18} />
                                </>

                        }


                    </button>



                </form>






                <Link
                    to="/login"
                    className="back-login"
                >

                    <ArrowLeft size={18} />

                    Kembali ke Login

                </Link>




            </div>


        </div>

    );

}