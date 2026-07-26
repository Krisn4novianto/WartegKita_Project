import {
    Building2,
    CreditCard,
    Landmark,
    CheckCircle,
    Edit3,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import SellerNavbar from "./SellerNavbar";

import "../../styles/seller/BusinessProfile.css";


export default function BusinessProfile() {


    const { seller_id } = useParams();


    const [openMenu, setOpenMenu] = useState(true);


    const [loading, setLoading] = useState(true);


    const [editMode, setEditMode] = useState<
        "business" | "bank" | null
    >(null);



    const [form, setForm] = useState({

        nama_warteg: "",
        nama_pemilik: "",
        nomor_hp: "",
        alamat: "",
        deskripsi: "",

        bank: "",
        nomor_rekening: "",

        rekening_verified: false,
        nama_rekening: ""

    });





    const loadProfile = async () => {


        if (!seller_id) return;


        try {


            const response = await fetch(

                `http://localhost:8080/api/v1/sellers/${seller_id}/profile`

            );


            const data = await response.json();

            setForm({

                nama_warteg: data.nama_warteg || "",

                nama_pemilik: data.nama_pemilik || "",

                nomor_hp: data.nomor_hp || "",

                alamat: data.alamat || "",

                deskripsi: data.deskripsi || "",


                bank: data.bank || "",

                nomor_rekening: data.nomor_rekening || "",


                rekening_verified:
                    data.rekening_verified || false,


                nama_rekening:
                    data.nama_rekening || ""

            });



        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);

        }


    };




    useEffect(() => {

        loadProfile();

    }, [seller_id]);






    const handleChange = (

        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement>

    ) => {


        setForm({

            ...form,

            [e.target.name]: e.target.value

        });


    };





    const saveProfile = async () => {


        try {


            const response = await fetch(

                `http://localhost:8080/api/v1/sellers/${seller_id}/profile`,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify(form)

                });



            const result = await response.json();



            if (!response.ok) {

                throw new Error(result.message);

            }



            Swal.fire({

                icon: "success",

                title: "Berhasil",

                text: "Data berhasil disimpan",

                timer: 1500,

                showConfirmButton: false

            });



            setEditMode(null);

            loadProfile();



        } catch (err: any) {


            Swal.fire({

                icon: "error",

                title: "Gagal",

                text: err.message

            });


        }


    };

    const connectBank = async () => {


        try {


            const response = await fetch(

                `http://localhost:8080/api/v1/sellers/${seller_id}/verify-bank`,

                {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        bank: form.bank,

                        nomor_rekening:
                            form.nomor_rekening

                    })

                }

            );


            const data = await response.json();



            if (!response.ok) {

                throw new Error(data.message);

            }



            setForm({

                ...form,

                rekening_verified: true,

                nama_rekening: data.nama_rekening

            });



            Swal.fire({

                icon: "success",

                title: "Rekening Berhasil Terhubung",

                text:
                    `Atas nama ${data.nama_rekening}`

            });



        }
        catch (err: any) {


            Swal.fire({

                icon: "error",

                title: "Rekening Tidak Valid",

                text: err.message

            });


        }


    }



    if (loading) {

        return <div>Loading...</div>;

    }

    return (

        <div className={`seller-layout ${openMenu ? "menu-open" : "menu-close"}`}>


            <SellerNavbar

                openMenu={openMenu}

                setOpenMenu={setOpenMenu}

            />



            <main className="seller-content">


                <div className="business-page">



                    <div className="business-header">

                        <h1>
                            Profil Warteg
                        </h1>


                        <p>
                            Kelola informasi usaha dan rekening pencairan.
                        </p>


                    </div>




                    <div className="business-grid">


                        {
                            /* ======================================
                               MODE EDIT PROFIL
                            ====================================== */
                            editMode === "business" && (

                                <div className="business-card profile-card edit-mode-card">


                                    <div className="card-title">

                                        <Building2 size={24} />

                                        <h3>
                                            Ubah Profil Warteg
                                        </h3>

                                    </div>



                                    <div className="form-group">

                                        <label>
                                            Nama Warteg
                                        </label>

                                        <input

                                            name="nama_warteg"

                                            value={form.nama_warteg}

                                            onChange={handleChange}

                                        />

                                    </div>



                                    <div className="form-group">

                                        <label>
                                            Nama Pemilik
                                        </label>

                                        <input

                                            name="nama_pemilik"

                                            value={form.nama_pemilik}

                                            onChange={handleChange}

                                        />

                                    </div>



                                    <div className="form-group">

                                        <label>
                                            Nomor HP
                                        </label>

                                        <input

                                            name="nomor_hp"

                                            value={form.nomor_hp}

                                            onChange={handleChange}

                                        />

                                    </div>



                                    <div className="form-group">

                                        <label>
                                            Alamat
                                        </label>

                                        <input

                                            name="alamat"

                                            value={form.alamat}

                                            onChange={handleChange}

                                        />

                                    </div>



                                    <div className="form-group">

                                        <label>
                                            Tentang Warteg
                                        </label>

                                        <textarea

                                            name="deskripsi"

                                            value={form.deskripsi}

                                            onChange={handleChange}

                                        />

                                    </div>




                                    <div className="button-group">

                                        <button

                                            type="button"

                                            className="cancel-button"

                                            onClick={() => setEditMode(null)}

                                        >

                                            Batal

                                        </button>


                                        <button

                                            className="save-button"

                                            onClick={saveProfile}

                                        >

                                            Simpan Profil

                                        </button>




                                    </div>


                                </div>

                            )

                        }





                        {
                            /* ======================================
                               MODE EDIT BANK
                            ====================================== */
                            editMode === "bank" && (

                                <div className="business-card edit-mode-card">


                                    <div className="card-title">

                                        <CreditCard size={24} />

                                        <h3>
                                            Ubah Rekening
                                        </h3>

                                    </div>




                                    <div className="form-group">

                                        <label>
                                            Bank
                                        </label>


                                        <select

                                            name="bank"

                                            value={form.bank}

                                            onChange={handleChange}

                                        >


                                            <option value="">
                                                Pilih Bank
                                            </option>


                                            <option value="BRI">
                                                Bank Rakyat Indonesia
                                            </option>


                                            <option value="Bank Raya">
                                                Bank Raya Indonesia
                                            </option>


                                            {/* <option value="BCA">
                                                Bank BCA
                                            </option>


                                            <option value="Mandiri">
                                                Bank Mandiri
                                            </option>


                                            <option value="BNI">
                                                Bank BNI
                                            </option> */}


                                        </select>


                                    </div>




                                    <div className="form-group">

                                        <label>
                                            Nomor Rekening
                                        </label>


                                        <input

                                            name="nomor_rekening"

                                            value={form.nomor_rekening}

                                            onChange={handleChange}

                                        />


                                    </div>




                                    <div className="button-group">


                                        <button

                                            type="button"

                                            className="cancel-button"

                                            onClick={() => setEditMode(null)}

                                        >

                                            Batal

                                        </button>


                                        <button

                                            className="save-button"

                                            onClick={connectBank}

                                        >

                                            <Landmark size={18} />

                                            Hubungkan Rekening

                                        </button>




                                    </div>


                                </div>


                            )

                        }






                        {
                            /* ======================================
                               MODE NORMAL
                            ====================================== */
                            editMode === null && (

                                <>


                                    {/* ================= PROFIL ================= */}

                                    <div className="business-card profile-card">


                                        <div className="profile-top">


                                            <div className="store-icon">

                                                <Building2 size={32} />

                                            </div>



                                            <div>

                                                <h2>

                                                    {form.nama_warteg || "Nama Usaha"}

                                                </h2>


                                                <p>

                                                    Pemilik :

                                                    <strong>

                                                        {" "}

                                                        {form.nama_pemilik || "Belum diisi"}

                                                    </strong>

                                                </p>


                                            </div>


                                        </div>




                                        <div className="info-list">


                                            <div className="info-item">

                                                <span>
                                                    📞 Nomor HP
                                                </span>

                                                <strong>
                                                    {form.nomor_hp || "Belum diisi"}
                                                </strong>

                                            </div>



                                            <div className="info-item">

                                                <span>
                                                    📍 Alamat
                                                </span>

                                                <strong>
                                                    {form.alamat || "Belum diisi"}
                                                </strong>

                                            </div>



                                            <div className="info-item">

                                                <span>
                                                    🍚 Tentang Warteg
                                                </span>

                                                <strong>
                                                    {form.deskripsi || "Belum ada deskripsi"}
                                                </strong>

                                            </div>


                                        </div>



                                        <button

                                            className="primary-button"

                                            onClick={() => setEditMode("business")}

                                        >

                                            <Edit3 size={18} />

                                            Ubah Profil

                                        </button>



                                    </div>






                                    {/* ================= PENCAIRAN ================= */}


                                    <div className="business-card">


                                        <div className="card-title">

                                            <CreditCard size={24} />

                                            <h3>
                                                Pencairan Dana
                                            </h3>

                                        </div>




                                        <div className="wallet-status">


                                            {
                                                form.rekening_verified ?

                                                    (

                                                        <>

                                                            <CheckCircle size={22} />

                                                            <span>
                                                                Rekening Terverifikasi
                                                            </span>

                                                        </>


                                                    )

                                                    :

                                                    (

                                                        <>

                                                            <CreditCard size={22} />

                                                            <span>
                                                                Belum Terhubung
                                                            </span>

                                                        </>


                                                    )

                                            }


                                        </div>




                                        <div className="bank-box">

                                            <Landmark size={25} />


                                            <div>

                                                <label>
                                                    Bank
                                                </label>


                                                <h4>

                                                    {form.bank || "Belum dipilih"}

                                                </h4>


                                            </div>


                                        </div>

                                        <div className="bank-box">

                                            <Landmark size={25} />

                                            <div>

                                                <label>
                                                    Nomor Rekening
                                                </label>

                                                <h4>
                                                    {form.nomor_rekening || "Belum diisi"}
                                                </h4>

                                            </div>

                                        </div>



                                        <div className="bank-box">

                                            <Landmark size={25} />

                                            <div>

                                                <label>
                                                    Nama Rekening
                                                </label>

                                                <h4>

                                                    {
                                                        form.nama_rekening ||
                                                        "Belum diverifikasi"
                                                    }

                                                </h4>

                                            </div>

                                        </div>




                                        <button

                                            className="primary-button"

                                            onClick={() => setEditMode("bank")}

                                        >

                                            <Edit3 size={18} />

                                            Ubah Rekening

                                        </button>


                                    </div>   {/* tutup business-card */}


                                </>

                            )

                        }






                    </div>


                </div>


            </main >


        </div >


    );


}

