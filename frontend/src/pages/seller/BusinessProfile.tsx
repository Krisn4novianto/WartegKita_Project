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
    Camera,
    ChevronRight,
    User,
    Mail,
    Bell,
    ShieldCheck,
    HelpCircle,
    X,
    Save,
    Wallet,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import SellerNavbar from "./SellerNavbar";

import CampaignSummary from "./Campaign/CampaignSummary";

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

    foto_profil: string;
}


/* =====================================================
   HELPERS
===================================================== */

const getImageUrl = (
    imagePath?: string | null,
): string => {

    if (!imagePath) {
        return "";
    }

    const value =
        String(imagePath).trim();

    if (!value) {
        return "";
    }


    /*
     * Data URL / Blob URL / Absolute URL
     */
    if (
        value.startsWith("data:") ||
        value.startsWith("blob:") ||
        value.startsWith("http://") ||
        value.startsWith("https://")
    ) {
        return value;
    }


    /*
     * Relative path
     */
    const normalized =
        value.startsWith("/")
            ? value
            : `/${value}`;


    const rawBaseURL =
        String(
            api.defaults?.baseURL || "",
        ).replace(
            /\/+$/,
            "",
        );


    if (!rawBaseURL) {
        return normalized;
    }


    /*
     * Contoh:
     *
     * http://localhost:8080/api/v1
     *
     * menjadi:
     *
     * http://localhost:8080
     */
    const backendOrigin =
        rawBaseURL
            .replace(
                /\/api\/v\d+(?:\/.*)?$/i,
                "",
            )
            .replace(
                /\/+$/,
                "",
            );


    if (!backendOrigin) {
        return normalized;
    }


    return `${backendOrigin}${normalized}`;
};


const formatTimeValue = (
    value?: string | null,
): string => {

    if (!value) {
        return "";
    }


    const normalized =
        String(value).trim();


    if (!normalized) {
        return "";
    }


    if (
        /^\d{2}:\d{2}$/.test(
            normalized,
        )
    ) {
        return normalized;
    }


    if (
        /^\d{2}:\d{2}:\d{2}$/.test(
            normalized,
        )
    ) {
        return normalized.slice(
            0,
            5,
        );
    }


    if (
        normalized.includes("T")
    ) {

        const timePart =
            normalized.split("T")[1];

        if (timePart) {
            return timePart.slice(
                0,
                5,
            );
        }
    }


    return normalized.length >= 5
        ? normalized.slice(0, 5)
        : normalized;
};


const getResponseData = (
    response: any,
): any => {

    return (
        response?.data?.data ??
        response?.data ??
        {}
    );
};


const getErrorMessage = (
    error: any,
    fallback: string,
): string => {

    return (
        error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        fallback
    );
};


/* =====================================================
   COMPONENT
===================================================== */

export default function BusinessProfile() {

    const {
        seller_id: urlSellerId,
    } = useParams<{
        seller_id: string;
    }>();


    const navigate =
        useNavigate();


    /* =====================================================
       SELLER ID
    ===================================================== */

    const seller_id =
        String(
            urlSellerId ||
            localStorage.getItem(
                "seller_id",
            ) ||
            "",
        ).trim();


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
       PHOTO
    ===================================================== */

    const [
        uploadingPhoto,
        setUploadingPhoto,
    ] = useState(false);


    const [
        deletingPhoto,
        setDeletingPhoto,
    ] = useState(false);


    const photoInputRef =
        useRef<HTMLInputElement | null>(
            null,
        );


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

        foto_profil: "",
    });


    /* =====================================================
       MASK ACCOUNT NUMBER
    ===================================================== */

    const maskedAccountNumber =
        useMemo(() => {

            const account =
                form.nomor_rekening?.trim();


            if (!account) {
                return "Belum diisi";
            }


            if (
                account.length <= 4
            ) {
                return account;
            }


            return (
                "•••• •••• " +
                account.slice(-4)
            );

        }, [
            form.nomor_rekening,
        ]);


    /* =====================================================
       OPEN STATUS
    ===================================================== */

    const isOpen =
        useMemo(() => {

            if (
                !form.jam_buka ||
                !form.jam_tutup
            ) {
                return false;
            }


            const now =
                new Date();


            const currentMinutes =
                now.getHours() * 60 +
                now.getMinutes();


            const [
                openHour,
                openMinute,
            ] =
                form.jam_buka
                    .split(":")
                    .map(Number);


            const [
                closeHour,
                closeMinute,
            ] =
                form.jam_tutup
                    .split(":")
                    .map(Number);


            if (
                !Number.isFinite(
                    openHour,
                ) ||
                !Number.isFinite(
                    openMinute,
                ) ||
                !Number.isFinite(
                    closeHour,
                ) ||
                !Number.isFinite(
                    closeMinute,
                )
            ) {
                return false;
            }


            const openMinutes =
                openHour * 60 +
                openMinute;


            const closeMinutes =
                closeHour * 60 +
                closeMinute;


            /*
             * Normal:
             *
             * 08:00 - 22:00
             */
            if (
                closeMinutes >
                openMinutes
            ) {

                return (
                    currentMinutes >=
                    openMinutes &&
                    currentMinutes <
                    closeMinutes
                );
            }


            /*
             * Overnight:
             *
             * 18:00 - 02:00
             */
            return (
                currentMinutes >=
                openMinutes ||
                currentMinutes <
                closeMinutes
            );

        }, [
            form.jam_buka,
            form.jam_tutup,
        ]);


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    const loadProfile =
        useCallback(
            async () => {

                if (!seller_id) {

                    setLoading(false);

                    await Swal.fire({
                        icon: "error",
                        title:
                            "Seller ID Tidak Ditemukan",
                        text:
                            "Akun seller tidak memiliki ID yang valid.",
                    });

                    return;
                }


                try {

                    setLoading(true);


                    const response =
                        await api.get(
                            `/sellers/${encodeURIComponent(
                                seller_id,
                            )}/profile`,
                        );


                    const data =
                        getResponseData(
                            response,
                        );


                    console.log(
                        "BUSINESS PROFILE:",
                        data,
                    );


                    const jamBuka =
                        formatTimeValue(
                            data?.jam_buka ??
                            data?.opening_time ??
                            data?.openingTime ??
                            "",
                        );


                    const jamTutup =
                        formatTimeValue(
                            data?.jam_tutup ??
                            data?.closing_time ??
                            data?.closingTime ??
                            "",
                        );


                    const fotoProfil =
                        data?.foto_profil ??
                        data?.profile_image ??
                        data?.profileImage ??
                        data?.image_url ??
                        data?.imageUrl ??
                        data?.image ??
                        data?.photo_url ??
                        data?.photoUrl ??
                        "";


                    setForm({

                        nama_warteg:
                            data?.nama_warteg ??
                            data?.store_name ??
                            data?.storeName ??
                            "",


                        nama_pemilik:
                            data?.nama_pemilik ??
                            data?.owner ??
                            data?.owner_name ??
                            data?.ownerName ??
                            "",


                        nomor_hp:
                            data?.nomor_hp ??
                            data?.phone ??
                            data?.phone_number ??
                            data?.phoneNumber ??
                            "",


                        alamat:
                            data?.alamat ??
                            data?.address ??
                            "",


                        deskripsi:
                            data?.deskripsi ??
                            data?.description ??
                            "",


                        jam_buka:
                            jamBuka,


                        jam_tutup:
                            jamTutup,


                        bank:
                            data?.bank ??
                            "",


                        nomor_rekening:
                            data?.nomor_rekening ??
                            data?.account_number ??
                            data?.accountNumber ??
                            "",


                        rekening_verified:
                            Boolean(
                                data?.rekening_verified ??
                                data?.account_verified ??
                                data?.accountVerified ??
                                false,
                            ),


                        nama_rekening:
                            data?.nama_rekening ??
                            data?.account_name ??
                            data?.accountName ??
                            "",


                        foto_profil:
                            getImageUrl(
                                fotoProfil,
                            ),
                    });

                } catch (
                error: any
                ) {

                    console.error(
                        "Load profile error:",
                        error,
                    );


                    const status =
                        error?.response
                            ?.status;


                    let errorText =
                        getErrorMessage(
                            error,
                            "Data profil warteg tidak dapat dimuat.",
                        );


                    if (
                        status === 404
                    ) {

                        errorText =
                            "Profil seller tidak ditemukan.";

                    } else if (
                        status === 401
                    ) {

                        errorText =
                            "Sesi login sudah tidak valid. Silakan login kembali.";

                    } else if (
                        status === 403
                    ) {

                        errorText =
                            "Anda tidak memiliki akses ke profil seller ini.";

                    } else if (
                        status &&
                        status >= 500
                    ) {

                        errorText =
                            "Terjadi kesalahan pada server.";
                    }


                    await Swal.fire({
                        icon: "error",
                        title:
                            "Gagal Memuat Profil",
                        text:
                            errorText,
                    });

                } finally {

                    setLoading(false);

                }

            },
            [
                seller_id,
            ],
        );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(() => {

        void loadProfile();

    }, [
        loadProfile,
    ]);


    /* =====================================================
       HANDLE INPUT
    ===================================================== */

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >,
    ) => {

        const {
            name,
            value,
        } = e.target;


        setForm(previous => ({
            ...previous,
            [name]: value,
        }));

    };


    /* =====================================================
       PROFILE PHOTO UPLOAD
    ===================================================== */

    const handleProfilePhotoChange =
        async (
            e: ChangeEvent<HTMLInputElement>,
        ) => {

            const file =
                e.target.files?.[0];


            /*
             * Reset input supaya
             * file yang sama bisa dipilih lagi.
             */
            e.target.value = "";


            if (!file) {
                return;
            }


            const allowedTypes = [
                "image/jpeg",
                "image/jpg",
                "image/png",
                "image/webp",
            ];


            if (
                !allowedTypes.includes(
                    file.type,
                )
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Format Foto Tidak Didukung",
                    text:
                        "Gunakan JPG, JPEG, PNG, atau WebP.",
                });

                return;
            }


            const maxSize =
                5 * 1024 * 1024;


            if (
                file.size > maxSize
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Ukuran Foto Terlalu Besar",
                    text:
                        "Ukuran foto maksimal 5 MB.",
                });

                return;
            }


            if (!seller_id) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Seller ID Tidak Ditemukan",
                    text:
                        "Foto tidak dapat diupload.",
                });

                return;
            }


            const previewUrl =
                URL.createObjectURL(
                    file,
                );


            try {

                setUploadingPhoto(
                    true,
                );


                /*
                 * Preview sementara.
                 */
                setForm(previous => ({
                    ...previous,
                    foto_profil:
                        previewUrl,
                }));


                const formData =
                    new FormData();


                formData.append(
                    "photo",
                    file,
                    file.name,
                );


                const response =
                    await api.post(
                        `/sellers/${encodeURIComponent(
                            seller_id,
                        )}/profile/photo`,
                        formData,
                    );


                console.log(
                    "UPLOAD PHOTO RESPONSE:",
                    response.data,
                );


                const data =
                    getResponseData(
                        response,
                    );


                const uploadedPhoto =
                    data?.foto_profil ??
                    data?.profile_image ??
                    data?.profileImage ??
                    data?.photo_url ??
                    data?.photoUrl ??
                    data?.image_url ??
                    data?.imageUrl ??
                    data?.image ??
                    data?.path ??
                    "";


                if (!uploadedPhoto) {

                    await loadProfile();

                    throw new Error(
                        "Server berhasil menerima upload tetapi tidak mengembalikan URL/path foto.",
                    );
                }


                const finalUrl =
                    getImageUrl(
                        uploadedPhoto,
                    );


                if (
                    !finalUrl ||
                    finalUrl.startsWith(
                        "blob:",
                    )
                ) {

                    await loadProfile();

                    throw new Error(
                        "URL foto dari server tidak valid.",
                    );
                }


                setForm(previous => ({
                    ...previous,
                    foto_profil:
                        finalUrl,
                }));


                await Swal.fire({
                    icon: "success",
                    title:
                        "Foto Berhasil Diupload",
                    text:
                        "Foto usaha berhasil disimpan ke server.",
                    timer: 1500,
                    showConfirmButton:
                        false,
                });

            } catch (
            error: any
            ) {

                console.error(
                    "Upload profile photo error:",
                    error,
                );


                await loadProfile();


                await Swal.fire({
                    icon: "error",
                    title:
                        "Upload Foto Gagal",
                    text:
                        getErrorMessage(
                            error,
                            "Foto gagal diupload.",
                        ),
                });

            } finally {

                URL.revokeObjectURL(
                    previewUrl,
                );


                setUploadingPhoto(
                    false,
                );
            }
        };


    /* =====================================================
       REMOVE PROFILE PHOTO
    ===================================================== */

    const removeProfilePhoto =
        async () => {

            if (!seller_id) {
                return;
            }


            const result =
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Hapus foto usaha?",
                    text:
                        "Foto profil usaha akan dihapus dari server.",
                    showCancelButton:
                        true,
                    confirmButtonText:
                        "Hapus",
                    cancelButtonText:
                        "Batal",
                    reverseButtons:
                        true,
                    confirmButtonColor:
                        "#dc2626",
                });


            if (
                !result.isConfirmed
            ) {
                return;
            }


            try {

                setDeletingPhoto(
                    true,
                );


                await api.delete(
                    `/sellers/${encodeURIComponent(
                        seller_id,
                    )}/profile/photo`,
                );


                setForm(previous => ({
                    ...previous,
                    foto_profil: "",
                }));


                await Swal.fire({
                    icon: "success",
                    title:
                        "Foto Dihapus",
                    text:
                        "Foto profil usaha berhasil dihapus.",
                    timer: 1300,
                    showConfirmButton:
                        false,
                });

            } catch (
            error: any
            ) {

                console.error(
                    "Delete profile photo error:",
                    error,
                );


                await Swal.fire({
                    icon: "error",
                    title:
                        "Gagal Menghapus Foto",
                    text:
                        getErrorMessage(
                            error,
                            "Foto gagal dihapus.",
                        ),
                });

            } finally {

                setDeletingPhoto(
                    false,
                );
            }
        };


    /* =====================================================
       SAVE BUSINESS PROFILE
    ===================================================== */

    const saveProfile =
        async () => {

            if (!seller_id) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Seller ID Tidak Ditemukan",
                    text:
                        "Profil seller tidak dapat disimpan.",
                });

                return;
            }


            if (
                !form.nama_warteg.trim()
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Nama Warteg Kosong",
                    text:
                        "Silakan masukkan nama warteg.",
                });

                return;
            }


            if (
                !form.nama_pemilik.trim()
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Nama Pemilik Kosong",
                    text:
                        "Silakan masukkan nama pemilik.",
                });

                return;
            }


            if (
                !form.nomor_hp.trim()
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Nomor HP Kosong",
                    text:
                        "Silakan masukkan nomor HP.",
                });

                return;
            }


            if (!form.jam_buka) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Jam Buka Belum Diisi",
                    text:
                        "Silakan tentukan jam buka warteg.",
                });

                return;
            }


            if (!form.jam_tutup) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Jam Tutup Belum Diisi",
                    text:
                        "Silakan tentukan jam tutup warteg.",
                });

                return;
            }


            if (
                form.jam_buka ===
                form.jam_tutup
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Jam Operasional Tidak Valid",
                    text:
                        "Jam buka dan jam tutup tidak boleh sama.",
                });

                return;
            }


            try {

                setSavingProfile(
                    true,
                );


                await api.put(
                    `/sellers/${encodeURIComponent(
                        seller_id,
                    )}/profile`,
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
                            formatTimeValue(
                                form.jam_buka,
                            ),

                        jam_tutup:
                            formatTimeValue(
                                form.jam_tutup,
                            ),

                        bank:
                            form.bank,

                        nomor_rekening:
                            form.nomor_rekening
                                .trim()
                                .replace(
                                    /\D/g,
                                    "",
                                ),

                        rekening_verified:
                            form.rekening_verified,

                        nama_rekening:
                            form.nama_rekening.trim(),
                    },
                );


                await Swal.fire({
                    icon: "success",
                    title:
                        "Profil Berhasil Disimpan",
                    text:
                        "Informasi warteg berhasil diperbarui.",
                    timer: 1500,
                    showConfirmButton:
                        false,
                });


                /*
                 * KELUAR DARI EDIT MODE
                 */
                setEditMode(null);


                await loadProfile();

            } catch (
            error: any
            ) {

                console.error(
                    "Save profile error:",
                    error,
                );


                await Swal.fire({
                    icon: "error",
                    title:
                        "Gagal Menyimpan",
                    text:
                        getErrorMessage(
                            error,
                            "Data profil gagal disimpan.",
                        ),
                });

            } finally {

                setSavingProfile(
                    false,
                );
            }
        };


    /* =====================================================
       CONNECT BANK
    ===================================================== */

    const connectBank =
        async () => {

            if (!seller_id) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Seller ID Tidak Ditemukan",
                    text:
                        "Rekening tidak dapat diverifikasi.",
                });

                return;
            }


            if (!form.bank) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Bank Belum Dipilih",
                    text:
                        "Silakan pilih bank terlebih dahulu.",
                });

                return;
            }


            const accountNumber =
                form.nomor_rekening
                    .trim()
                    .replace(
                        /\D/g,
                        "",
                    );


            if (!accountNumber) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Nomor Rekening Kosong",
                    text:
                        "Silakan masukkan nomor rekening.",
                });

                return;
            }


            if (
                accountNumber.length <
                5
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Nomor Rekening Tidak Valid",
                    text:
                        "Nomor rekening terlalu pendek.",
                });

                return;
            }


            try {

                setVerifyingBank(
                    true,
                );


                const response =
                    await api.post(
                        `/sellers/${encodeURIComponent(
                            seller_id,
                        )}/verify-bank`,
                        {
                            bank:
                                form.bank,

                            nomor_rekening:
                                accountNumber,
                        },
                    );


                const data =
                    getResponseData(
                        response,
                    );


                setForm(previous => ({
                    ...previous,

                    nomor_rekening:
                        accountNumber,

                    rekening_verified:
                        data?.rekening_verified !==
                            undefined
                            ? Boolean(
                                data.rekening_verified,
                            )
                            : true,

                    nama_rekening:
                        data?.nama_rekening ??
                        data?.account_name ??
                        previous.nama_rekening,
                }));


                await Swal.fire({
                    icon: "success",
                    title:
                        "Rekening Berhasil Terhubung",
                    text:
                        `Atas nama ${data?.nama_rekening ??
                        data?.account_name ??
                        "pemilik rekening"
                        }`,
                });


                /*
                 * KELUAR DARI EDIT MODE
                 */
                setEditMode(null);


                await loadProfile();

            } catch (
            error: any
            ) {

                console.error(
                    "Connect bank error:",
                    error,
                );


                await Swal.fire({
                    icon: "error",
                    title:
                        "Rekening Tidak Valid",
                    text:
                        getErrorMessage(
                            error,
                            "Rekening gagal diverifikasi.",
                        ),
                });

            } finally {

                setVerifyingBank(
                    false,
                );
            }
        };


    /* =====================================================
       SETTINGS
    ===================================================== */

    const handleSettingClick =
        async (
            setting: string,
        ) => {

            await Swal.fire({
                icon: "info",
                title:
                    setting,
                text:
                    "Menu ini siap diintegrasikan dengan halaman pengaturan seller WartegKita.",
                confirmButtonColor:
                    "#16a34a",
                confirmButtonText:
                    "Mengerti",
            });
        };


    /* =====================================================
       LOGOUT
    ===================================================== */

    const handleLogout =
        async () => {

            const result =
                await Swal.fire({
                    icon: "warning",
                    title:
                        "Keluar dari akun?",
                    text:
                        "Anda akan keluar dari akun seller WartegKita di perangkat ini.",
                    showCancelButton:
                        true,
                    confirmButtonText:
                        "Ya, Logout",
                    cancelButtonText:
                        "Batal",
                    reverseButtons:
                        true,
                    confirmButtonColor:
                        "#dc2626",
                    cancelButtonColor:
                        "#6b7280",
                });


            if (
                !result.isConfirmed
            ) {
                return;
            }


            localStorage.removeItem(
                "token",
            );


            localStorage.removeItem(
                "seller_id",
            );


            localStorage.removeItem(
                "user",
            );


            navigate(
                "/login",
                {
                    replace: true,
                },
            );
        };


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {

        return (
            <div className="business-loading">

                <div className="business-loading-spinner" />

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

            <SellerNavbar
                openMenu={
                    openMenu
                }
                setOpenMenu={
                    setOpenMenu
                }
            />


            <main className="seller-content">

                <div className="business-page">


                    {/* =================================================
                       HEADER
                    ================================================= */}

                    <header className="business-header">

                        <div>

                            <div className="header-eyebrow">

                                <Building2
                                    size={17}
                                />

                                AKUN SELLER

                            </div>


                            <h1>
                                Profil Usaha
                            </h1>


                            <p>
                                Kelola informasi warteg,
                                pencairan dana, promosi,
                                dan pengaturan akun.
                            </p>

                        </div>

                    </header>


                    {/* =================================================
                       HERO
                    ================================================= */}

                    <section className="business-profile-hero">

                        <div className="hero-background">

                            <div className="hero-gradient" />

                            <div className="hero-decoration hero-decoration-one" />

                            <div className="hero-decoration hero-decoration-two" />

                        </div>


                        <div className="hero-content">


                            {/* =================================================
                               AVATAR
                            ================================================= */}

                            <div className="hero-avatar-area">

                                <div className="hero-avatar-wrapper">

                                    <div className="hero-avatar">

                                        {form.foto_profil ? (

                                            <img
                                                src={
                                                    form.foto_profil
                                                }
                                                alt={
                                                    form.nama_warteg ||
                                                    "Foto usaha"
                                                }
                                                onError={
                                                    event => {

                                                        event.currentTarget.style.display =
                                                            "none";

                                                    }
                                                }
                                            />

                                        ) : (

                                            <Building2
                                                size={48}
                                            />

                                        )}

                                    </div>


                                    <button
                                        type="button"
                                        className="photo-button"
                                        onClick={() =>
                                            photoInputRef.current?.click()
                                        }
                                        disabled={
                                            uploadingPhoto ||
                                            deletingPhoto
                                        }
                                        title="Ubah foto usaha"
                                    >

                                        {uploadingPhoto ? (

                                            <span className="photo-spinner" />

                                        ) : (

                                            <Camera
                                                size={18}
                                            />

                                        )}

                                    </button>


                                    <input
                                        ref={
                                            photoInputRef
                                        }
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        hidden
                                        onChange={
                                            handleProfilePhotoChange
                                        }
                                    />

                                </div>


                                {form.foto_profil && (

                                    <button
                                        type="button"
                                        className="hero-remove-photo"
                                        onClick={
                                            removeProfilePhoto
                                        }
                                        disabled={
                                            deletingPhoto ||
                                            uploadingPhoto
                                        }
                                    >

                                        <X
                                            size={14}
                                        />

                                        {
                                            deletingPhoto
                                                ? "Menghapus..."
                                                : "Hapus foto"
                                        }

                                    </button>

                                )}

                            </div>


                            {/* =================================================
                               INFORMATION
                            ================================================= */}

                            <div className="hero-information">

                                <div className="hero-title-row">

                                    <h2>
                                        {
                                            form.nama_warteg ||
                                            "Nama Warteg"
                                        }
                                    </h2>


                                    <span
                                        className={
                                            `business-status ${isOpen
                                                ? "open"
                                                : "closed"
                                            }`
                                        }
                                    >

                                        <span />

                                        {
                                            isOpen
                                                ? "Buka"
                                                : "Tutup"
                                        }

                                    </span>

                                </div>


                                <p className="hero-owner">

                                    <User
                                        size={17}
                                    />

                                    {
                                        form.nama_pemilik ||
                                        "Pemilik belum diisi"
                                    }

                                </p>


                                <p className="hero-address">

                                    <MapPin
                                        size={17}
                                    />

                                    {
                                        form.alamat ||
                                        "Alamat belum diisi"
                                    }

                                </p>


                                <div className="hero-meta">

                                    <span>

                                        <Clock3
                                            size={15}
                                        />

                                        {
                                            formatTimeValue(
                                                form.jam_buka,
                                            ) ||
                                            "--:--"
                                        }

                                        <b>
                                            -
                                        </b>

                                        {
                                            formatTimeValue(
                                                form.jam_tutup,
                                            ) ||
                                            "--:--"
                                        }

                                    </span>


                                    <span>

                                        <Phone
                                            size={15}
                                        />

                                        {
                                            form.nomor_hp ||
                                            "Nomor belum diisi"
                                        }

                                    </span>

                                </div>

                            </div>


                            {/* =================================================
                               ACTION

                               PENTING:
                               Tombol Edit Profil HANYA muncul
                               ketika TIDAK sedang edit.

                               Saat:
                               editMode === null
                                   -> tampil

                               editMode === "business"
                                   -> hilang

                               editMode === "bank"
                                   -> hilang
                            ================================================= */}

                            {editMode === null && (

                                <div className="hero-actions">

                                    <button
                                        type="button"
                                        className="hero-edit-button"
                                        onClick={() =>
                                            setEditMode(
                                                "business",
                                            )
                                        }
                                    >

                                        <Edit3
                                            size={17}
                                        />

                                        Edit Profil

                                    </button>

                                </div>

                            )}

                        </div>

                    </section>


                    {/* =================================================
                       EDIT BUSINESS
                    ================================================= */}

                    {editMode === "business" && (

                        <section className="business-card edit-mode-card">

                            <div className="section-heading">

                                <div className="section-icon">

                                    <Building2
                                        size={21}
                                    />

                                </div>


                                <div>

                                    <h3>
                                        Edit Informasi Usaha
                                    </h3>

                                    <p>
                                        Perbarui informasi dasar
                                        warteg kamu.
                                    </p>

                                </div>

                            </div>


                            <div className="form-grid">


                                <div className="form-group">

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


                                <div className="form-group">

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


                                <div className="form-group">

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
                                        placeholder="081234567890"
                                    />

                                </div>


                                <div className="form-group">

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


                                <div className="form-group full-width">

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

                            </div>


                            <div className="form-divider" />


                            <div className="form-section-heading">

                                <Clock3
                                    size={19}
                                />

                                <div>

                                    <strong>
                                        Jam Operasional
                                    </strong>

                                    <span>
                                        Digunakan untuk menentukan
                                        status buka/tutup otomatis.
                                    </span>

                                </div>

                            </div>


                            <div className="time-input-grid">

                                <div className="form-group">

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


                                <div className="form-group">

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


                            {/* ACTION FORM */}

                            <div className="edit-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setEditMode(
                                            null,
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
                                    className="primary-button"
                                    onClick={
                                        saveProfile
                                    }
                                    disabled={
                                        savingProfile
                                    }
                                >

                                    <Save
                                        size={17}
                                    />

                                    {
                                        savingProfile
                                            ? "Menyimpan..."
                                            : "Simpan Perubahan"
                                    }

                                </button>

                            </div>

                        </section>

                    )}


                    {/* =================================================
                       NORMAL CONTENT

                       HANYA TAMPIL JIKA:
                       editMode === null
                    ================================================= */}

                    {editMode === null && (

                        <>


                            {/* =================================================
                               MAIN GRID
                            ================================================= */}

                            <div className="business-main-grid">


                                {/* =================================================
                                   BUSINESS INFO
                                ================================================= */}

                                <section className="business-card">

                                    <div className="section-heading">

                                        <div className="section-icon">

                                            <Building2
                                                size={21}
                                            />

                                        </div>


                                        <div>

                                            <h3>
                                                Informasi Usaha
                                            </h3>

                                            <p>
                                                Informasi yang
                                                ditampilkan kepada
                                                pelanggan.
                                            </p>

                                        </div>

                                    </div>


                                    <div className="information-grid">


                                        <div className="information-item">

                                            <div className="information-icon">

                                                <User
                                                    size={18}
                                                />

                                            </div>


                                            <div>

                                                <span>
                                                    Pemilik
                                                </span>

                                                <strong>
                                                    {
                                                        form.nama_pemilik ||
                                                        "Belum diisi"
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="information-item">

                                            <div className="information-icon">

                                                <Phone
                                                    size={18}
                                                />

                                            </div>


                                            <div>

                                                <span>
                                                    Nomor HP
                                                </span>

                                                <strong>
                                                    {
                                                        form.nomor_hp ||
                                                        "Belum diisi"
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="information-item">

                                            <div className="information-icon">

                                                <MapPin
                                                    size={18}
                                                />

                                            </div>


                                            <div>

                                                <span>
                                                    Alamat
                                                </span>

                                                <strong>
                                                    {
                                                        form.alamat ||
                                                        "Belum diisi"
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        <div className="information-item">

                                            <div className="information-icon">

                                                <Clock3
                                                    size={18}
                                                />

                                            </div>


                                            <div>

                                                <span>
                                                    Jam Operasional
                                                </span>

                                                <strong>

                                                    {
                                                        formatTimeValue(
                                                            form.jam_buka,
                                                        ) ||
                                                        "--:--"
                                                    }

                                                    {" - "}

                                                    {
                                                        formatTimeValue(
                                                            form.jam_tutup,
                                                        ) ||
                                                        "--:--"
                                                    }

                                                </strong>

                                            </div>

                                        </div>


                                        <div className="information-item full">

                                            <div className="information-icon">

                                                <Utensils
                                                    size={18}
                                                />

                                            </div>


                                            <div>

                                                <span>
                                                    Tentang Warteg
                                                </span>

                                                <strong>
                                                    {
                                                        form.deskripsi ||
                                                        "Belum ada deskripsi."
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        className="outline-button"
                                        onClick={() =>
                                            setEditMode(
                                                "business",
                                            )
                                        }
                                    >

                                        <Edit3
                                            size={17}
                                        />

                                        Edit Informasi Usaha

                                    </button>

                                </section>


                                {/* =================================================
                                   BANK
                                ================================================= */}

                                <section className="business-card payout-card">

                                    <div className="section-heading">

                                        <div className="section-icon">

                                            <Wallet
                                                size={21}
                                            />

                                        </div>


                                        <div>

                                            <h3>
                                                Pencairan Dana
                                            </h3>

                                            <p>
                                                Rekening untuk
                                                menerima pencairan.
                                            </p>

                                        </div>

                                    </div>


                                    <div
                                        className={
                                            `verification-banner ${form.rekening_verified
                                                ? "verified"
                                                : "unverified"
                                            }`
                                        }
                                    >

                                        {
                                            form.rekening_verified
                                                ? (
                                                    <CheckCircle
                                                        size={20}
                                                    />
                                                )
                                                : (
                                                    <CreditCard
                                                        size={20}
                                                    />
                                                )
                                        }


                                        <div>

                                            <strong>
                                                {
                                                    form.rekening_verified
                                                        ? "Rekening Terverifikasi"
                                                        : "Rekening Belum Terhubung"
                                                }
                                            </strong>


                                            <span>
                                                {
                                                    form.rekening_verified
                                                        ? "Rekening siap digunakan untuk pencairan."
                                                        : "Hubungkan rekening untuk menerima pencairan."
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <div className="bank-information">


                                        <div className="bank-row">

                                            <span>
                                                Bank
                                            </span>

                                            <strong>
                                                {
                                                    form.bank ||
                                                    "Belum dipilih"
                                                }
                                            </strong>

                                        </div>


                                        <div className="bank-row">

                                            <span>
                                                Nomor Rekening
                                            </span>

                                            <strong>
                                                {
                                                    maskedAccountNumber
                                                }
                                            </strong>

                                        </div>


                                        <div className="bank-row">

                                            <span>
                                                Nama Rekening
                                            </span>

                                            <strong>
                                                {
                                                    form.nama_rekening ||
                                                    "Belum diverifikasi"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    <button
                                        type="button"
                                        className="outline-button"
                                        onClick={() =>
                                            setEditMode(
                                                "bank",
                                            )
                                        }
                                    >

                                        <Edit3
                                            size={17}
                                        />

                                        {
                                            form.rekening_verified
                                                ? "Ubah Rekening"
                                                : "Hubungkan Rekening"
                                        }

                                    </button>

                                </section>

                            </div>


                            {/* =================================================
                               CAMPAIGN SUMMARY
                            ================================================= */}

                            <CampaignSummary
                                sellerId={
                                    seller_id
                                }
                                navigateToCampaign={() =>
                                    navigate(
                                        `/sellers/${encodeURIComponent(
                                            seller_id,
                                        )}/campaign`,
                                    )
                                }
                            />


                            {/* =================================================
                               SETTINGS
                            ================================================= */}

                            <section className="settings-section">

                                <div className="settings-heading">

                                    <h2>
                                        Pengaturan
                                    </h2>

                                    <p>
                                        Kelola akun dan preferensi
                                        seller WartegKita.
                                    </p>

                                </div>


                                <div className="settings-card">


                                    <button
                                        type="button"
                                        className="setting-item"
                                        onClick={() =>
                                            handleSettingClick(
                                                "Akun & Keamanan",
                                            )
                                        }
                                    >

                                        <div className="setting-icon">

                                            <ShieldCheck
                                                size={19}
                                            />

                                        </div>


                                        <div className="setting-content">

                                            <strong>
                                                Akun & Keamanan
                                            </strong>

                                            <span>
                                                Kelola password
                                                dan keamanan akun
                                            </span>

                                        </div>


                                        <ChevronRight
                                            size={19}
                                        />

                                    </button>


                                    <button
                                        type="button"
                                        className="setting-item"
                                        onClick={() =>
                                            handleSettingClick(
                                                "Email & Nomor HP",
                                            )
                                        }
                                    >

                                        <div className="setting-icon">

                                            <Mail
                                                size={19}
                                            />

                                        </div>


                                        <div className="setting-content">

                                            <strong>
                                                Email & Nomor HP
                                            </strong>

                                            <span>
                                                Kelola informasi
                                                kontak akun
                                            </span>

                                        </div>


                                        <ChevronRight
                                            size={19}
                                        />

                                    </button>


                                    <button
                                        type="button"
                                        className="setting-item"
                                        onClick={() =>
                                            handleSettingClick(
                                                "Notifikasi",
                                            )
                                        }
                                    >

                                        <div className="setting-icon">

                                            <Bell
                                                size={19}
                                            />

                                        </div>


                                        <div className="setting-content">

                                            <strong>
                                                Notifikasi
                                            </strong>

                                            <span>
                                                Atur notifikasi
                                                pesanan dan promo
                                            </span>

                                        </div>


                                        <ChevronRight
                                            size={19}
                                        />

                                    </button>


                                    <button
                                        type="button"
                                        className="setting-item"
                                        onClick={() =>
                                            setEditMode(
                                                "business",
                                            )
                                        }
                                    >

                                        <div className="setting-icon">

                                            <Clock3
                                                size={19}
                                            />

                                        </div>


                                        <div className="setting-content">

                                            <strong>
                                                Jam Operasional
                                            </strong>

                                            <span>
                                                Atur waktu buka
                                                dan tutup warteg
                                            </span>

                                        </div>


                                        <ChevronRight
                                            size={19}
                                        />

                                    </button>


                                    <button
                                        type="button"
                                        className="setting-item"
                                        onClick={() =>
                                            handleSettingClick(
                                                "Bantuan Seller",
                                            )
                                        }
                                    >

                                        <div className="setting-icon">

                                            <HelpCircle
                                                size={19}
                                            />

                                        </div>


                                        <div className="setting-content">

                                            <strong>
                                                Bantuan Seller
                                            </strong>

                                            <span>
                                                Pusat bantuan
                                                WartegKita
                                            </span>

                                        </div>


                                        <ChevronRight
                                            size={19}
                                        />

                                    </button>

                                </div>

                            </section>


                            {/* =================================================
                               LOGOUT
                            ================================================= */}

                            <section className="logout-section">

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

                            </section>

                        </>

                    )}


                    {/* =================================================
                       BANK EDIT
                    ================================================= */}

                    {editMode === "bank" && (

                        <section className="business-card edit-mode-card bank-edit-card">


                            <div className="section-heading">

                                <div className="section-icon">

                                    <CreditCard
                                        size={21}
                                    />

                                </div>


                                <div>

                                    <h3>
                                        Rekening Pencairan
                                    </h3>

                                    <p>
                                        Hubungkan rekening
                                        untuk pencairan dana.
                                    </p>

                                </div>

                            </div>


                            <div className="form-group">

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


                            <div className="form-group">

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
                                    onChange={e => {

                                        const cleaned =
                                            e.target.value.replace(
                                                /\D/g,
                                                "",
                                            );


                                        setForm(
                                            previous => ({
                                                ...previous,

                                                nomor_rekening:
                                                    cleaned,
                                            }),
                                        );

                                    }}
                                    placeholder="Masukkan nomor rekening"
                                />

                            </div>


                            <div className="edit-actions">


                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setEditMode(
                                            null,
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
                                    className="primary-button"
                                    onClick={
                                        connectBank
                                    }
                                    disabled={
                                        verifyingBank
                                    }
                                >

                                    <Landmark
                                        size={17}
                                    />

                                    {
                                        verifyingBank
                                            ? "Memverifikasi..."
                                            : "Hubungkan Rekening"
                                    }

                                </button>

                            </div>

                        </section>

                    )}

                </div>

            </main>

        </div>
    );
}