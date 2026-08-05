import {
    Building2,
    CreditCard,
    Landmark,
    CheckCircle,
    Edit3,
    Phone,
    MapPin,
    Utensils,
    LogOut,
    Clock3,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useParams,
    useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import SellerNavbar from "./SellerNavbar";

import api from "../../services/api";

import "../../styles/seller/BusinessProfile.css";


/* =====================================================
   TYPES
===================================================== */

interface BusinessProfileForm {
    nama_warteg: string;
    nama_pemilik: string;
    nomor_hp: string;
    alamat: string;
    deskripsi: string;

    jam_buka: string;
    jam_tutup: string;

    bank: string;
    nomor_rekening: string;

    rekening_verified: boolean;
    nama_rekening: string;
}


/* =====================================================
   COMPONENT
===================================================== */

export default function BusinessProfile() {

    const {
        seller_id: urlSellerId,
    } = useParams<{ seller_id: string }>();

    const navigate = useNavigate();


    /* =====================================================
       SELLER ID
    ===================================================== */

    const seller_id =
        urlSellerId ||
        localStorage.getItem("seller_id") ||
        "";


    /* =====================================================
       SIDEBAR
    ===================================================== */

    const [
        openMenu,
        setOpenMenu,
    ] = useState(true);


    /* =====================================================
       LOADING
    ===================================================== */

    const [
        loading,
        setLoading,
    ] = useState(true);


    /* =====================================================
       SAVING
    ===================================================== */

    const [
        savingProfile,
        setSavingProfile,
    ] = useState(false);


    const [
        verifyingBank,
        setVerifyingBank,
    ] = useState(false);


    /* =====================================================
       EDIT MODE
    ===================================================== */

    const [
        editMode,
        setEditMode,
    ] = useState<
        "business" | "bank" | null
    >(null);


    /* =====================================================
       FORM
       Tidak ada default jam palsu.
    ===================================================== */

    const [
        form,
        setForm,
    ] = useState<BusinessProfileForm>({

        nama_warteg: "",
        nama_pemilik: "",
        nomor_hp: "",
        alamat: "",
        deskripsi: "",

        jam_buka: "",
        jam_tutup: "",

        bank: "",
        nomor_rekening: "",

        rekening_verified: false,
        nama_rekening: "",

    });


    /* =====================================================
       FORMAT JAM
       
       Backend saat ini mengembalikan:
       
       08:00
       atau
       08:00:00
       
       Fungsi ini juga aman kalau backend
       mengembalikan timestamp.
    ===================================================== */

    const formatTime = (
        value?: string
    ): string => {

        if (!value) {
            return "";
        }

        const normalized =
            String(value).trim();

        if (!normalized) {
            return "";
        }


        /* ================================================
           HH:MM
        ================================================ */

        if (
            /^\d{2}:\d{2}$/.test(
                normalized
            )
        ) {

            return normalized;

        }


        /* ================================================
           HH:MM:SS
        ================================================ */

        if (
            /^\d{2}:\d{2}:\d{2}$/.test(
                normalized
            )
        ) {

            return normalized.substring(
                0,
                5
            );

        }


        /* ================================================
           TIMESTAMP
           
           Contoh:
           2000-01-01T08:00:00Z
        ================================================ */

        if (
            normalized.includes("T")
        ) {

            const timePart =
                normalized.split("T")[1];

            if (timePart) {

                return timePart.substring(
                    0,
                    5
                );

            }

        }


        /* ================================================
           FALLBACK
        ================================================ */

        return normalized.length >= 5
            ? normalized.substring(0, 5)
            : normalized;

    };


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    const loadProfile = async () => {

        if (!seller_id) {

            console.error(
                "Seller ID tidak ditemukan."
            );

            setLoading(false);

            await Swal.fire({
                icon: "error",
                title: "Seller ID Tidak Ditemukan",
                text:
                    "Akun seller tidak memiliki ID yang valid.",
            });

            return;
        }


        try {

            setLoading(true);


            const response =
                await api.get(
                    `/sellers/${seller_id}/profile`
                );


            const data =
                response.data?.data ||
                response.data;


            console.log(
                "BUSINESS PROFILE:",
                data
            );


            /* =============================================
               JAM DARI BACKEND
            ============================================= */

            const jamBuka =
                formatTime(
                    data?.jam_buka ||
                    data?.opening_time ||
                    ""
                );


            const jamTutup =
                formatTime(
                    data?.jam_tutup ||
                    data?.closing_time ||
                    ""
                );


            /* =============================================
               SET FORM
            ============================================= */

            setForm({

                nama_warteg:
                    data?.nama_warteg ||
                    "",

                nama_pemilik:
                    data?.nama_pemilik ||
                    "",

                nomor_hp:
                    data?.nomor_hp ||
                    "",

                alamat:
                    data?.alamat ||
                    "",

                deskripsi:
                    data?.deskripsi ||
                    "",

                jam_buka:
                    jamBuka,

                jam_tutup:
                    jamTutup,

                bank:
                    data?.bank ||
                    "",

                nomor_rekening:
                    data?.nomor_rekening ||
                    "",

                rekening_verified:
                    Boolean(
                        data?.rekening_verified
                    ),

                nama_rekening:
                    data?.nama_rekening ||
                    "",

            });

        } catch (error: any) {

            console.error(
                "Load profile error:",
                error
            );


            const status =
                error?.response?.status;

            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;


            let errorText =
                "Data profil warteg tidak dapat dimuat.";


            if (status === 404) {

                errorText =
                    "Profil seller tidak ditemukan.";

            } else if (status === 401) {

                errorText =
                    "Sesi login sudah tidak valid. Silakan login kembali.";

            } else if (status === 403) {

                errorText =
                    "Anda tidak memiliki akses ke profil seller ini.";

            } else if (status >= 500) {

                errorText =
                    "Terjadi kesalahan pada server.";

            } else if (message) {

                errorText =
                    message;

            }


            await Swal.fire({
                icon: "error",
                title: "Gagal Memuat Profil",
                text: errorText,
            });

        } finally {

            setLoading(false);

        }

    };


    /* =====================================================
       LOAD PROFILE ON MOUNT
    ===================================================== */

    useEffect(() => {

        loadProfile();

    }, [seller_id]);


    /* =====================================================
       HANDLE INPUT
    ===================================================== */

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) => {

        const {
            name,
            value,
        } = e.target;


        setForm(
            previous => ({
                ...previous,
                [name]: value,
            })
        );

    };


    /* =====================================================
       SAVE BUSINESS PROFILE
    ===================================================== */

    const saveProfile = async () => {

        if (!seller_id) {

            await Swal.fire({
                icon: "error",
                title: "Seller ID Tidak Ditemukan",
                text:
                    "Profil seller tidak dapat disimpan.",
            });

            return;
        }


        /* =================================================
           VALIDATION
        ================================================= */

        if (!form.nama_warteg.trim()) {

            await Swal.fire({
                icon: "warning",
                title: "Nama Warteg Kosong",
                text:
                    "Silakan masukkan nama warteg.",
            });

            return;
        }


        if (!form.nama_pemilik.trim()) {

            await Swal.fire({
                icon: "warning",
                title: "Nama Pemilik Kosong",
                text:
                    "Silakan masukkan nama pemilik.",
            });

            return;
        }


        if (!form.nomor_hp.trim()) {

            await Swal.fire({
                icon: "warning",
                title: "Nomor HP Kosong",
                text:
                    "Silakan masukkan nomor HP.",
            });

            return;
        }


        /* =================================================
           VALIDATE JAM
        ================================================= */

        if (!form.jam_buka) {

            await Swal.fire({
                icon: "warning",
                title: "Jam Buka Belum Diisi",
                text:
                    "Silakan tentukan jam buka warteg.",
            });

            return;
        }


        if (!form.jam_tutup) {

            await Swal.fire({
                icon: "warning",
                title: "Jam Tutup Belum Diisi",
                text:
                    "Silakan tentukan jam tutup warteg.",
            });

            return;
        }


        /* =================================================
           JAM BUKA = JAM TUTUP
           
           Backend juga menganggap kondisi ini
           sebagai TUTUP.
        ================================================= */

        if (
            form.jam_buka ===
            form.jam_tutup
        ) {

            await Swal.fire({
                icon: "warning",
                title: "Jam Operasional Tidak Valid",
                text:
                    "Jam buka dan jam tutup tidak boleh sama.",
            });

            return;
        }


        try {

            setSavingProfile(true);


            /* =================================================
               NORMALIZE TIME
            ================================================= */

            const jamBuka =
                formatTime(
                    form.jam_buka
                );


            const jamTutup =
                formatTime(
                    form.jam_tutup
                );


            /* =================================================
               UPDATE PROFILE
            ================================================= */

            const response =
                await api.put(
                    `/sellers/${seller_id}/profile`,
                    {

                        nama_warteg:
                            form.nama_warteg.trim(),

                        nama_pemilik:
                            form.nama_pemilik.trim(),

                        nomor_hp:
                            form.nomor_hp.trim(),

                        alamat:
                            form.alamat.trim(),

                        deskripsi:
                            form.deskripsi.trim(),

                        jam_buka:
                            jamBuka,

                        jam_tutup:
                            jamTutup,

                        bank:
                            form.bank,

                        nomor_rekening:
                            form.nomor_rekening.trim(),

                        rekening_verified:
                            form.rekening_verified,

                        nama_rekening:
                            form.nama_rekening.trim(),

                    }
                );


            console.log(
                "SAVE PROFILE RESPONSE:",
                response.data
            );


            await Swal.fire({
                icon: "success",
                title: "Profil Berhasil Disimpan",
                text:
                    "Informasi warteg dan jam operasional berhasil diperbarui.",
                timer: 1600,
                showConfirmButton: false,
            });


            setEditMode(null);


            await loadProfile();

        } catch (error: any) {

            console.error(
                "Save profile error:",
                error
            );


            console.error(
                "Save profile response:",
                error?.response?.data
            );


            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Data profil gagal disimpan.";


            await Swal.fire({
                icon: "error",
                title: "Gagal Menyimpan",
                text: message,
            });

        } finally {

            setSavingProfile(false);

        }

    };


    /* =====================================================
       CONNECT BANK
    ===================================================== */

    const connectBank = async () => {

        if (!seller_id) {

            await Swal.fire({
                icon: "error",
                title: "Seller ID Tidak Ditemukan",
                text:
                    "Rekening tidak dapat diverifikasi.",
            });

            return;
        }


        if (!form.bank) {

            await Swal.fire({
                icon: "warning",
                title: "Bank Belum Dipilih",
                text:
                    "Silakan pilih bank terlebih dahulu.",
            });

            return;
        }


        if (
            !form.nomor_rekening.trim()
        ) {

            await Swal.fire({
                icon: "warning",
                title: "Nomor Rekening Kosong",
                text:
                    "Silakan masukkan nomor rekening.",
            });

            return;
        }


        if (
            !/^\d+$/.test(
                form.nomor_rekening.trim()
            )
        ) {

            await Swal.fire({
                icon: "warning",
                title: "Nomor Rekening Tidak Valid",
                text:
                    "Nomor rekening hanya boleh berisi angka.",
            });

            return;
        }


        try {

            setVerifyingBank(true);


            const response =
                await api.post(
                    `/sellers/${seller_id}/verify-bank`,
                    {

                        bank:
                            form.bank,

                        nomor_rekening:
                            form.nomor_rekening.trim(),

                    }
                );


            const data =
                response.data?.data ||
                response.data;


            setForm(
                previous => ({

                    ...previous,

                    rekening_verified:
                        data?.rekening_verified !== undefined
                            ? Boolean(
                                data.rekening_verified
                            )
                            : true,

                    nama_rekening:
                        data?.nama_rekening ||
                        previous.nama_rekening,

                })
            );


            await Swal.fire({
                icon: "success",
                title:
                    "Rekening Berhasil Terhubung",
                text:
                    `Atas nama ${data?.nama_rekening ||
                    "pemilik rekening"
                    }`,
            });


            setEditMode(null);


            await loadProfile();

        } catch (error: any) {

            console.error(
                "Connect bank error:",
                error
            );


            const status =
                error?.response?.status;

            const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message;


            let errorText =
                "Rekening gagal diverifikasi.";


            if (status === 404) {

                errorText =
                    "Verifikasi rekening tidak ditemukan di server.";

            } else if (status === 401) {

                errorText =
                    "Sesi login sudah tidak valid.";

            } else if (status === 400) {

                errorText =
                    message ||
                    "Data rekening tidak valid.";

            } else if (message) {

                errorText =
                    message;

            }


            await Swal.fire({
                icon: "error",
                title:
                    "Rekening Tidak Valid",
                text:
                    errorText,
            });

        } finally {

            setVerifyingBank(false);

        }

    };


    /* =====================================================
       LOGOUT
    ===================================================== */

    const handleLogout = async () => {

        const result =
            await Swal.fire({

                icon: "warning",

                title:
                    "Keluar dari akun?",

                text:
                    "Anda akan keluar dari akun seller WartegKita di perangkat ini.",

                showCancelButton: true,

                confirmButtonText:
                    "Ya, Logout",

                cancelButtonText:
                    "Batal",

                reverseButtons: true,

                confirmButtonColor:
                    "#dc2626",

                cancelButtonColor:
                    "#6b7280",

            });


        if (!result.isConfirmed) {
            return;
        }


        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "seller_id"
        );

        localStorage.removeItem(
            "user"
        );


        navigate(
            "/login",
            {
                replace: true,
            }
        );

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (

            <div
                className="business-loading"
            >

                <div
                    className="business-loading-spinner"
                />

                <p>
                    Memuat profil warteg...
                </p>

            </div>

        );

    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (

        <div
            className={
                `seller-layout ${openMenu
                    ? "menu-open"
                    : "menu-close"
                }`
            }
        >

            {/* =================================================
               SELLER NAVBAR
            ================================================= */}

            <SellerNavbar
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
            />


            {/* =================================================
               MAIN
            ================================================= */}

            <main
                className="seller-content"
            >

                <div
                    className="business-page"
                >

                    {/* =================================================
                       HEADER
                    ================================================= */}

                    <div
                        className="business-header"
                    >

                        <div>

                            <h1>
                                Profil Warteg
                            </h1>

                            <p>
                                Kelola informasi usaha,
                                jam operasional, dan
                                rekening pencairan.
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                       CONTENT GRID
                    ================================================= */}

                    <div
                        className="business-grid"
                    >

                        {/* =================================================
                           EDIT BUSINESS
                        ================================================= */}

                        {editMode === "business" && (

                            <div
                                className="business-card edit-mode-card"
                            >

                                <div
                                    className="card-title"
                                >

                                    <Building2
                                        size={24}
                                    />

                                    <h3>
                                        Ubah Profil Warteg
                                    </h3>

                                </div>


                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Nama Warteg
                                    </label>

                                    <input
                                        type="text"
                                        name="nama_warteg"
                                        value={
                                            form.nama_warteg
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Masukkan nama warteg"
                                    />

                                </div>


                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Nama Pemilik
                                    </label>

                                    <input
                                        type="text"
                                        name="nama_pemilik"
                                        value={
                                            form.nama_pemilik
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Masukkan nama pemilik"
                                    />

                                </div>


                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Nomor HP
                                    </label>

                                    <input
                                        type="tel"
                                        name="nomor_hp"
                                        value={
                                            form.nomor_hp
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Contoh: 081234567890"
                                    />

                                </div>


                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Alamat
                                    </label>

                                    <input
                                        type="text"
                                        name="alamat"
                                        value={
                                            form.alamat
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Masukkan alamat warteg"
                                    />

                                </div>


                                {/* =================================================
                                   JAM OPERASIONAL
                                ================================================= */}

                                <div
                                    className="form-section-title"
                                >

                                    <Clock3
                                        size={20}
                                    />

                                    <span>
                                        Jam Operasional
                                    </span>

                                </div>


                                <div
                                    className="time-input-grid"
                                >

                                    <div
                                        className="form-group"
                                    >

                                        <label>
                                            Jam Buka
                                        </label>

                                        <input
                                            type="time"
                                            name="jam_buka"
                                            value={
                                                form.jam_buka
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>


                                    <div
                                        className="form-group"
                                    >

                                        <label>
                                            Jam Tutup
                                        </label>

                                        <input
                                            type="time"
                                            name="jam_tutup"
                                            value={
                                                form.jam_tutup
                                            }
                                            onChange={
                                                handleChange
                                            }
                                        />

                                    </div>

                                </div>


                                <p
                                    className="form-help-text"
                                >
                                    Jam operasional digunakan
                                    untuk menentukan status
                                    buka atau tutup warteg
                                    secara otomatis.
                                </p>


                                {/* =================================================
                                   DESKRIPSI
                                ================================================= */}

                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Tentang Warteg
                                    </label>

                                    <textarea
                                        name="deskripsi"
                                        value={
                                            form.deskripsi
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ceritakan tentang warteg kamu..."
                                        rows={4}
                                    />

                                </div>


                                {/* =================================================
                                   BUTTON
                                ================================================= */}

                                <div
                                    className="button-group"
                                >

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={() =>
                                            setEditMode(
                                                null
                                            )
                                        }
                                        disabled={
                                            savingProfile
                                        }
                                    >
                                        Batal
                                    </button>


                                    <button
                                        type="button"
                                        className="save-button"
                                        onClick={
                                            saveProfile
                                        }
                                        disabled={
                                            savingProfile
                                        }
                                    >

                                        {
                                            savingProfile
                                                ? "Menyimpan..."
                                                : "Simpan Profil"
                                        }

                                    </button>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                           EDIT BANK
                        ================================================= */}

                        {editMode === "bank" && (

                            <div
                                className="business-card edit-mode-card"
                            >

                                <div
                                    className="card-title"
                                >

                                    <CreditCard
                                        size={24}
                                    />

                                    <h3>
                                        Ubah Rekening
                                    </h3>

                                </div>


                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Bank
                                    </label>

                                    <select
                                        name="bank"
                                        value={
                                            form.bank
                                        }
                                        onChange={
                                            handleChange
                                        }
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

                                    </select>

                                </div>


                                <div
                                    className="form-group"
                                >

                                    <label>
                                        Nomor Rekening
                                    </label>

                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        name="nomor_rekening"
                                        value={
                                            form.nomor_rekening
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Masukkan nomor rekening"
                                    />

                                </div>


                                <div
                                    className="button-group"
                                >

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={() =>
                                            setEditMode(
                                                null
                                            )
                                        }
                                        disabled={
                                            verifyingBank
                                        }
                                    >
                                        Batal
                                    </button>


                                    <button
                                        type="button"
                                        className="save-button"
                                        onClick={
                                            connectBank
                                        }
                                        disabled={
                                            verifyingBank
                                        }
                                    >

                                        <Landmark
                                            size={18}
                                        />

                                        {
                                            verifyingBank
                                                ? "Memverifikasi..."
                                                : "Hubungkan Rekening"
                                        }

                                    </button>

                                </div>

                            </div>

                        )}


                        {/* =================================================
                           NORMAL MODE
                        ================================================= */}

                        {editMode === null && (

                            <>

                                {/* =================================================
                                   PROFILE CARD
                                ================================================= */}

                                <section
                                    className="business-card profile-card"
                                >

                                    <div
                                        className="profile-top"
                                    >

                                        <div
                                            className="store-icon"
                                        >

                                            <Building2
                                                size={32}
                                            />

                                        </div>


                                        <div
                                            className="profile-heading"
                                        >

                                            <h2>
                                                {
                                                    form.nama_warteg ||
                                                    "Nama Usaha"
                                                }
                                            </h2>

                                            <p>
                                                Pemilik:
                                                <strong>
                                                    {" "}
                                                    {
                                                        form.nama_pemilik ||
                                                        "Belum diisi"
                                                    }
                                                </strong>
                                            </p>

                                        </div>

                                    </div>


                                    {/* =================================================
                                       INFO LIST
                                    ================================================= */}

                                    <div
                                        className="info-list"
                                    >

                                        <div
                                            className="info-item"
                                        >

                                            <span>

                                                <Phone
                                                    size={16}
                                                />

                                                Nomor HP

                                            </span>

                                            <strong>
                                                {
                                                    form.nomor_hp ||
                                                    "Belum diisi"
                                                }
                                            </strong>

                                        </div>


                                        <div
                                            className="info-item"
                                        >

                                            <span>

                                                <MapPin
                                                    size={16}
                                                />

                                                Alamat

                                            </span>

                                            <strong>
                                                {
                                                    form.alamat ||
                                                    "Belum diisi"
                                                }
                                            </strong>

                                        </div>


                                        <div
                                            className="info-item"
                                        >

                                            <span>

                                                <Clock3
                                                    size={16}
                                                />

                                                Jam Operasional

                                            </span>

                                            <strong>

                                                {
                                                    formatTime(
                                                        form.jam_buka
                                                    ) ||
                                                    "--:--"
                                                }

                                                {" - "}

                                                {
                                                    formatTime(
                                                        form.jam_tutup
                                                    ) ||
                                                    "--:--"
                                                }

                                            </strong>

                                        </div>


                                        <div
                                            className="info-item"
                                        >

                                            <span>

                                                <Utensils
                                                    size={16}
                                                />

                                                Tentang Warteg

                                            </span>

                                            <strong>
                                                {
                                                    form.deskripsi ||
                                                    "Belum ada deskripsi"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() =>
                                            setEditMode(
                                                "business"
                                            )
                                        }
                                    >

                                        <Edit3
                                            size={18}
                                        />

                                        Ubah Profil

                                    </button>

                                </section>


                                {/* =================================================
                                   BANK CARD
                                ================================================= */}

                                <section
                                    className="business-card"
                                >

                                    <div
                                        className="card-title"
                                    >

                                        <CreditCard
                                            size={24}
                                        />

                                        <h3>
                                            Pencairan Dana
                                        </h3>

                                    </div>


                                    <div
                                        className={
                                            `wallet-status ${form.rekening_verified
                                                ? "verified"
                                                : "unverified"
                                            }`
                                        }
                                    >

                                        {form.rekening_verified ? (

                                            <>

                                                <CheckCircle
                                                    size={22}
                                                />

                                                <span>
                                                    Rekening Terverifikasi
                                                </span>

                                            </>

                                        ) : (

                                            <>

                                                <CreditCard
                                                    size={22}
                                                />

                                                <span>
                                                    Belum Terhubung
                                                </span>

                                            </>

                                        )}

                                    </div>


                                    <div
                                        className="bank-box"
                                    >

                                        <Landmark
                                            size={25}
                                        />

                                        <div>

                                            <label>
                                                Bank
                                            </label>

                                            <h4>
                                                {
                                                    form.bank ||
                                                    "Belum dipilih"
                                                }
                                            </h4>

                                        </div>

                                    </div>


                                    <div
                                        className="bank-box"
                                    >

                                        <Landmark
                                            size={25}
                                        />

                                        <div>

                                            <label>
                                                Nomor Rekening
                                            </label>

                                            <h4>
                                                {
                                                    form.nomor_rekening ||
                                                    "Belum diisi"
                                                }
                                            </h4>

                                        </div>

                                    </div>


                                    <div
                                        className="bank-box"
                                    >

                                        <Landmark
                                            size={25}
                                        />

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
                                        type="button"
                                        className="primary-button"
                                        onClick={() =>
                                            setEditMode(
                                                "bank"
                                            )
                                        }
                                    >

                                        <Edit3
                                            size={18}
                                        />

                                        Ubah Rekening

                                    </button>

                                </section>


                                {/* =================================================
                                   LOGOUT
                                ================================================= */}

                                <div
                                    className="logout-section"
                                >

                                    <button
                                        type="button"
                                        className="logout-button"
                                        onClick={
                                            handleLogout
                                        }
                                    >

                                        <LogOut
                                            size={18}
                                        />

                                        Keluar dari Akun

                                    </button>

                                </div>

                            </>

                        )}

                    </div>

                </div>

            </main>

        </div>

    );

}