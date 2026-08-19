import {
    User,
    ShoppingBag,
    MapPin,
    LogOut,
    Plus,
    Edit3,
    ChevronRight,
    ShieldCheck,
    Mail,
    Bell,
    Star,
    CheckCircle2,
    LockKeyhole,
    Settings,
    ArrowRight,
    CircleHelp,
    Gift,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import api from "../../services/api";

import {
    getProvinces,
    getCities,
    getDistricts,
    Wilayah,
} from "../../services/wilayahApi";

import MissionSection from "../../components/Mission and Reward/MissionSection";
import RewardSection from "../../components/Mission and Reward/RewardSection";

import "../../styles/profile.css";
import "../../styles/components/Mission and Reward/MissionSection.css";
import "../../styles/components/Mission and Reward/RewardSection.css";

/* =========================================================
   TYPES
========================================================= */

interface UserProfile {
    id: string | number;
    name: string;
    email: string;
    role?: string;
    created_at?: string;
}

interface Address {
    label: string;
    detail: string;

    province: string;
    provinceId: number | "";

    city: string;
    cityId: number | "";

    district: string;
    districtId: number | "";

    postalCode: string;
    note: string;
}

/* =========================================================
   DEFAULT ADDRESS
========================================================= */

const emptyAddress: Address = {
    label: "Rumah",

    detail: "",

    province: "",
    provinceId: "",

    city: "",
    cityId: "",

    district: "",
    districtId: "",

    postalCode: "",
    note: "",
};

/* =========================================================
   HELPERS
========================================================= */

function getCurrentUserId(): string {
    try {
        const rawUser =
            localStorage.getItem("user");

        if (rawUser) {
            const parsed =
                JSON.parse(rawUser);

            if (parsed?.id) {
                return String(
                    parsed.id,
                );
            }

            if (parsed?.user_id) {
                return String(
                    parsed.user_id,
                );
            }
        }
    } catch {
        // Ignore invalid localStorage
    }

    return (
        localStorage.getItem(
            "user_id",
        ) || ""
    );
}

function getResponseData(
    response: any,
): any {
    return (
        response?.data?.data ??
        response?.data ??
        {}
    );
}

function getErrorMessage(
    error: any,
    fallback: string,
): string {
    return (
        error?.response?.data
            ?.message ??
        error?.response?.data
            ?.error ??
        error?.message ??
        fallback
    );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Profile() {
    const navigate =
        useNavigate();

    /* =====================================================
       USER
    ===================================================== */

    const [
        user,
        setUser,
    ] =
        useState<UserProfile | null>(
            null,
        );

    const [
        loadingUser,
        setLoadingUser,
    ] =
        useState(true);

    const [
        editProfile,
        setEditProfile,
    ] =
        useState(false);

    const [
        savingProfile,
        setSavingProfile,
    ] =
        useState(false);

    const [
        name,
        setName,
    ] =
        useState("");

    const [
        email,
        setEmail,
    ] =
        useState("");

    /* =====================================================
       ADDRESS
    ===================================================== */

    const [
        showEditAddress,
        setShowEditAddress,
    ] =
        useState(false);

    const [
        savingAddress,
        setSavingAddress,
    ] =
        useState(false);

    const [
        savedAddress,
        setSavedAddress,
    ] =
        useState<Address | null>(
            null,
        );

    const [
        address,
        setAddress,
    ] =
        useState<Address>(
            emptyAddress,
        );

    const [
        provinces,
        setProvinces,
    ] =
        useState<Wilayah[]>([]);

    const [
        cities,
        setCities,
    ] =
        useState<Wilayah[]>([]);

    const [
        districts,
        setDistricts,
    ] =
        useState<Wilayah[]>([]);

    /* =====================================================
       LOYALTY
    ===================================================== */

    const [
        loyaltyPoints,
        setLoyaltyPoints,
    ] =
        useState(0);

    const [
        loadingLoyalty,
        setLoadingLoyalty,
    ] =
        useState(true);

    /* =====================================================
       USER ID
    ===================================================== */

    const userId =
        useMemo(
            () =>
                getCurrentUserId(),
            [],
        );

    /* =====================================================
       LOAD USER
    ===================================================== */

    const loadUser =
        useCallback(
            async () => {
                try {
                    setLoadingUser(
                        true,
                    );

                    const currentUserId =
                        getCurrentUserId();

                    if (
                        !currentUserId
                    ) {
                        return;
                    }

                    const response =
                        await api.get(
                            `/users/profile?user_id=${encodeURIComponent(
                                currentUserId,
                            )}`,
                        );

                    const data =
                        getResponseData(
                            response,
                        );

                    setUser(
                        data,
                    );

                    setName(
                        data?.name ??
                        "",
                    );

                    setEmail(
                        data?.email ??
                        "",
                    );
                } catch (
                error: any
                ) {
                    console.error(
                        "Load user error:",
                        error,
                    );

                    await Swal.fire({
                        icon: "error",
                        title:
                            "Gagal Memuat Profil",
                        text:
                            getErrorMessage(
                                error,
                                "Data profil tidak dapat dimuat.",
                            ),
                        confirmButtonColor:
                            "#16a34a",
                    });
                } finally {
                    setLoadingUser(
                        false,
                    );
                }
            },
            [],
        );

    /* =====================================================
       LOAD ADDRESS
    ===================================================== */

    const loadAddress =
        useCallback(
            async () => {
                try {
                    const currentUserId =
                        getCurrentUserId();

                    if (
                        !currentUserId
                    ) {
                        return;
                    }

                    const response =
                        await api.get(
                            `/users/address?user_id=${encodeURIComponent(
                                currentUserId,
                            )}`,
                        );

                    const raw =
                        response?.data
                            ?.data ??
                        response?.data;

                    const data =
                        Array.isArray(
                            raw,
                        )
                            ? raw[0]
                            : raw;

                    if (!data) {
                        setSavedAddress(
                            null,
                        );

                        setAddress({
                            ...emptyAddress,
                        });

                        return;
                    }

                    const result: Address = {
                        label:
                            data?.label ??
                            "Rumah",

                        detail:
                            data?.detail ??
                            "",

                        province:
                            data?.province_name ??
                            "",

                        provinceId:
                            data?.province_id ??
                            "",

                        city:
                            data?.city_name ??
                            "",

                        cityId:
                            data?.city_id ??
                            "",

                        district:
                            data?.district_name ??
                            "",

                        districtId:
                            data?.district_id ??
                            "",

                        postalCode:
                            data?.postal_code ??
                            "",

                        note:
                            data?.note ??
                            "",
                    };

                    setSavedAddress(
                        result,
                    );

                    setAddress(
                        result,
                    );

                    if (
                        result.provinceId
                    ) {
                        const cityData =
                            await getCities(
                                result.provinceId,
                            );

                        setCities(
                            cityData,
                        );
                    }

                    if (
                        result.cityId
                    ) {
                        const districtData =
                            await getDistricts(
                                result.cityId,
                            );

                        setDistricts(
                            districtData,
                        );
                    }
                } catch (
                error
                ) {
                    console.error(
                        "Address error:",
                        error,
                    );
                }
            },
            [],
        );

    /* =====================================================
       LOAD LOYALTY POINTS
    ===================================================== */

    const loadLoyaltyPoints =
        useCallback(
            async () => {
                try {
                    setLoadingLoyalty(
                        true,
                    );

                    const currentUserId =
                        getCurrentUserId();

                    if (
                        !currentUserId
                    ) {
                        setLoyaltyPoints(
                            0,
                        );

                        return;
                    }

                    const response =
                        await api.get(
                            `/users/points?user_id=${encodeURIComponent(
                                currentUserId,
                            )}`,
                        );

                    const data =
                        getResponseData(
                            response,
                        );

                    const points =
                        Number(
                            data?.balance ??
                            data?.points ??
                            data?.total_points ??
                            data?.current_points ??
                            0,
                        );

                    setLoyaltyPoints(
                        Number.isFinite(
                            points,
                        )
                            ? Math.max(
                                0,
                                points,
                            )
                            : 0,
                    );
                } catch (
                error
                ) {
                    console.error(
                        "Load loyalty points error:",
                        error,
                    );

                    setLoyaltyPoints(
                        0,
                    );
                } finally {
                    setLoadingLoyalty(
                        false,
                    );
                }
            },
            [],
        );

    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(
        () => {
            async function init() {
                try {
                    const provinceData =
                        await getProvinces();

                    setProvinces(
                        provinceData,
                    );

                    await Promise.all([
                        loadUser(),
                        loadAddress(),
                        loadLoyaltyPoints(),
                    ]);
                } catch (
                error
                ) {
                    console.error(
                        "Profile initialization error:",
                        error,
                    );
                }
            }

            void init();
        },
        [
            loadUser,
            loadAddress,
            loadLoyaltyPoints,
        ],
    );

    /* =====================================================
       UPDATE PROFILE
    ===================================================== */

    async function updateUser() {
        if (!name.trim()) {
            await Swal.fire({
                icon: "warning",
                title:
                    "Nama belum diisi",
                text:
                    "Silakan masukkan nama kamu.",
                confirmButtonColor:
                    "#16a34a",
            });

            return;
        }

        if (!email.trim()) {
            await Swal.fire({
                icon: "warning",
                title:
                    "Email belum diisi",
                text:
                    "Silakan masukkan email kamu.",
                confirmButtonColor:
                    "#16a34a",
            });

            return;
        }

        const currentUserId =
            getCurrentUserId();

        if (!currentUserId) {
            await Swal.fire({
                icon: "error",
                title:
                    "User ID Tidak Ditemukan",
                text:
                    "Sesi pengguna tidak memiliki ID yang valid.",
            });

            return;
        }

        try {
            setSavingProfile(
                true,
            );

            await api.put(
                "/users/profile",
                {
                    user_id:
                        currentUserId,

                    name:
                        name.trim(),

                    email:
                        email.trim(),
                },
            );

            await loadUser();

            setEditProfile(
                false,
            );

            await Swal.fire({
                title:
                    "Profil Berhasil Disimpan",
                text:
                    "Informasi akun kamu berhasil diperbarui.",
                icon: "success",
                timer: 1500,
                showConfirmButton:
                    false,
            });
        } catch (
        error: any
        ) {
            await Swal.fire({
                title:
                    "Gagal Menyimpan",
                text:
                    getErrorMessage(
                        error,
                        "Profil gagal diperbarui.",
                    ),
                icon: "error",
            });
        } finally {
            setSavingProfile(
                false,
            );
        }
    }

    /* =====================================================
       ADDRESS HELPERS
    ===================================================== */

    function updateAddress(
        value: Partial<Address>,
    ) {
        setAddress(
            previous => ({
                ...previous,
                ...value,
            }),
        );
    }

    async function chooseProvince(
        value: string,
    ) {
        if (!value) {
            updateAddress({
                provinceId: "",
                province: "",
                city: "",
                cityId: "",
                district: "",
                districtId: "",
                postalCode: "",
            });

            setCities([]);
            setDistricts([]);

            return;
        }

        const provinceId =
            Number(value);

        const selected =
            provinces.find(
                item =>
                    item.id ===
                    provinceId,
            );

        updateAddress({
            provinceId,

            province:
                selected?.name ??
                "",

            city: "",
            cityId: "",

            district: "",
            districtId: "",

            postalCode: "",
        });

        setCities([]);
        setDistricts([]);

        try {
            const cityData =
                await getCities(
                    provinceId,
                );

            setCities(
                cityData,
            );
        } catch (
        error
        ) {
            console.error(
                "Load cities error:",
                error,
            );
        }
    }

    async function chooseCity(
        value: string,
    ) {
        if (!value) {
            updateAddress({
                city: "",
                cityId: "",
                district: "",
                districtId: "",
                postalCode: "",
            });

            setDistricts([]);

            return;
        }

        const cityId =
            Number(value);

        const selected =
            cities.find(
                item =>
                    item.id ===
                    cityId,
            );

        updateAddress({
            cityId,

            city:
                selected?.name ??
                "",

            district: "",
            districtId: "",

            postalCode: "",
        });

        setDistricts([]);

        try {
            const districtData =
                await getDistricts(
                    cityId,
                );

            setDistricts(
                districtData,
            );
        } catch (
        error
        ) {
            console.error(
                "Load districts error:",
                error,
            );
        }
    }

    function chooseDistrict(
        value: string,
    ) {
        if (!value) {
            updateAddress({
                district: "",
                districtId: "",
            });

            return;
        }

        const districtId =
            Number(value);

        const selected =
            districts.find(
                item =>
                    item.id ===
                    districtId,
            );

        updateAddress({
            districtId,

            district:
                selected?.name ??
                "",
        });
    }

    /* =====================================================
       SAVE ADDRESS
    ===================================================== */

    async function saveAddress() {
        if (
            !address.detail.trim() ||
            !address.province ||
            !address.city ||
            !address.district
        ) {
            await Swal.fire({
                title:
                    "Alamat Belum Lengkap",
                text:
                    "Lengkapi alamat, provinsi, kabupaten/kota, dan kecamatan terlebih dahulu.",
                icon: "warning",
                confirmButtonColor:
                    "#16a34a",
            });

            return;
        }

        const currentUserId =
            getCurrentUserId();

        if (!currentUserId) {
            await Swal.fire({
                icon: "error",
                title:
                    "User ID Tidak Ditemukan",
                text:
                    "Sesi pengguna tidak memiliki ID yang valid.",
            });

            return;
        }

        try {
            setSavingAddress(
                true,
            );

            await api.post(
                "/users/address",
                {
                    user_id:
                        currentUserId,

                    label:
                        address.label,

                    detail:
                        address.detail.trim(),

                    province_id:
                        address.provinceId,

                    province_name:
                        address.province,

                    city_id:
                        address.cityId,

                    city_name:
                        address.city,

                    district_id:
                        address.districtId,

                    district_name:
                        address.district,

                    postal_code:
                        address.postalCode,

                    note:
                        address.note.trim(),
                },
            );

            await loadAddress();

            setShowEditAddress(
                false,
            );

            await Swal.fire({
                title:
                    "Alamat Berhasil Disimpan",
                text:
                    "Alamat pengiriman kamu berhasil diperbarui.",
                icon: "success",
                timer: 1500,
                showConfirmButton:
                    false,
            });
        } catch (
        error: any
        ) {
            await Swal.fire({
                title:
                    "Gagal Menyimpan Alamat",
                text:
                    getErrorMessage(
                        error,
                        "Alamat gagal disimpan.",
                    ),
                icon: "error",
            });
        } finally {
            setSavingAddress(
                false,
            );
        }
    }

    /* =====================================================
       SETTINGS
    ===================================================== */

    async function handleSettingClick(
        setting: string,
    ) {
        if (
            setting ===
            "Alamat Pengiriman"
        ) {
            setAddress(
                savedAddress ?? {
                    ...emptyAddress,
                },
            );

            setShowEditAddress(
                true,
            );

            return;
        }

        if (
            setting ===
            "Poin & Reward"
        ) {
            document
                .querySelector(
                    "#loyalty",
                )
                ?.scrollIntoView({
                    behavior:
                        "smooth",
                });

            return;
        }

        await Swal.fire({
            icon: "info",
            title: setting,
            text:
                "Menu ini siap diintegrasikan dengan halaman pengaturan customer WartegKita.",
            confirmButtonColor:
                "#16a34a",
            confirmButtonText:
                "Mengerti",
        });
    }

    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {
        const result =
            await Swal.fire({
                icon: "warning",

                title:
                    "Keluar dari akun?",

                text:
                    "Kamu akan keluar dari akun WartegKita di perangkat ini.",

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
            "user",
        );

        localStorage.removeItem(
            "user_id",
        );

        navigate(
            "/login",
            {
                replace: true,
            },
        );
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (loadingUser) {
        return (
            <div className="profile-loading">
                <div className="profile-loading-spinner" />

                <p>
                    Memuat profil
                    kamu...
                </p>
            </div>
        );
    }

    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="profile-page">
            <div className="profile-container">

                {/* =================================================
                   HEADER
                ================================================= */}

                <header className="profile-header">
                    <div className="profile-header-content">

                        <div className="profile-eyebrow">
                            <User size={16} />

                            <span>
                                AKUN ANDA
                            </span>
                        </div>

                        <h1>
                            Profil Saya
                        </h1>

                        <p>
                            Kelola informasi akun,
                            alamat pengiriman,
                            poin, reward, dan
                            pengaturan WartegKita.
                        </p>

                    </div>
                </header>

                {/* =================================================
                   PROFILE HERO
                ================================================= */}

                <section className="profile-hero">

                    <div className="profile-hero-background">
                        <div className="profile-hero-gradient" />

                        <div className="profile-hero-decoration profile-decoration-one" />

                        <div className="profile-hero-decoration profile-decoration-two" />
                    </div>

                    <div className="profile-hero-content">

                        <div className="profile-avatar-area">
                            <div className="profile-avatar">
                                {user?.name
                                    ?.charAt(0)
                                    .toUpperCase() ||
                                    "U"}
                            </div>
                        </div>

                        <div className="profile-information">

                            {editProfile ? (
                                <div className="profile-edit-form">

                                    <div className="profile-edit-field">
                                        <label>
                                            Nama
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                name
                                            }
                                            onChange={e =>
                                                setName(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan nama"
                                        />
                                    </div>

                                    <div className="profile-edit-field">
                                        <label>
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            value={
                                                email
                                            }
                                            onChange={e =>
                                                setEmail(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Masukkan email"
                                        />
                                    </div>

                                    <div className="profile-edit-actions">

                                        <button
                                            type="button"
                                            className="profile-secondary-button"
                                            onClick={() =>
                                                setEditProfile(
                                                    false,
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
                                            className="profile-primary-button"
                                            onClick={
                                                updateUser
                                            }
                                            disabled={
                                                savingProfile
                                            }
                                        >
                                            <CheckCircle2
                                                size={17}
                                            />

                                            {savingProfile
                                                ? "Menyimpan..."
                                                : "Simpan Perubahan"}
                                        </button>

                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="profile-title-row">

                                        <h2>
                                            {user?.name ||
                                                "Nama User"}
                                        </h2>

                                        <span className="profile-role-badge">
                                            <User
                                                size={14}
                                            />

                                            Customer
                                        </span>

                                    </div>

                                    <p className="profile-email">
                                        <Mail
                                            size={16}
                                        />

                                        {user?.email ||
                                            "email@example.com"}
                                    </p>

                                    <button
                                        type="button"
                                        className="profile-edit-button"
                                        onClick={() => {
                                            setName(
                                                user?.name ??
                                                "",
                                            );

                                            setEmail(
                                                user?.email ??
                                                "",
                                            );

                                            setEditProfile(
                                                true,
                                            );
                                        }}
                                    >
                                        <Edit3
                                            size={16}
                                        />

                                        Edit Profil
                                    </button>
                                </>
                            )}

                        </div>

                    </div>
                </section>

                {/* =================================================
                   LOYALTY
                ================================================= */}

                <section
                    className="profile-loyalty-summary"
                    id="loyalty"
                >

                    <div className="profile-loyalty-copy">

                        <div className="profile-loyalty-eyebrow">
                            <Gift size={16} />

                            <span>
                                WARTEGKITA REWARDS
                            </span>
                        </div>

                        <h2 className="profile-loyalty-title">
                            Kumpulkan Poin,
                            Dapatkan Lebih
                            Banyak Hemat
                        </h2>

                        <p className="profile-loyalty-description">
                            Selesaikan misi dan
                            kumpulkan poin dari
                            aktivitas kamu di
                            WartegKita. Tukarkan
                            poin dengan reward
                            menarik.
                        </p>

                    </div>

                    {/* =============================================
                       SINGLE POINT BALANCE
                    ============================================= */}

                    <div className="profile-loyalty-balance">

                        <div className="profile-loyalty-balance-icon">
                            <Star size={22} />
                        </div>

                        <div className="profile-loyalty-balance-content">

                            <span className="profile-loyalty-balance-label">
                                Poin WartegKita
                            </span>

                            <div className="profile-loyalty-balance-number">

                                <strong>
                                    {loadingLoyalty
                                        ? "..."
                                        : loyaltyPoints.toLocaleString(
                                            "id-ID",
                                        )}
                                </strong>

                                <span>
                                    poin
                                </span>

                            </div>

                            <small>
                                Poin tersedia untuk
                                ditukar dengan reward
                            </small>

                        </div>

                    </div>

                </section>

                {/* =================================================
                   MISSIONS
                ================================================= */}

                <MissionSection />

                {/* =================================================
                   REWARDS
                ================================================= */}

                <RewardSection
                    loyaltyPoints={
                        loyaltyPoints
                    }
                    onRedeemed={() =>
                        loadLoyaltyPoints()
                    }
                />

                {/* =================================================
                   MAIN CONTENT
                ================================================= */}

                <div className="profile-main-grid">

                    {/* ACCOUNT */}

                    <section className="profile-card profile-account-card">

                        <div className="section-heading">

                            <div className="section-icon">
                                <User size={21} />
                            </div>

                            <div>
                                <h3>
                                    Informasi Akun
                                </h3>

                                <p>
                                    Informasi dasar
                                    akun customer
                                    kamu.
                                </p>
                            </div>

                        </div>

                        <div className="profile-information-grid">

                            <div className="profile-information-item">

                                <div className="information-icon">
                                    <User size={18} />
                                </div>

                                <div>
                                    <span>
                                        Nama
                                    </span>

                                    <strong>
                                        {user?.name ||
                                            "Belum diisi"}
                                    </strong>
                                </div>

                            </div>

                            <div className="profile-information-item">

                                <div className="information-icon">
                                    <Mail size={18} />
                                </div>

                                <div>
                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {user?.email ||
                                            "Belum diisi"}
                                    </strong>
                                </div>

                            </div>

                        </div>

                        <button
                            type="button"
                            className="profile-outline-button"
                            onClick={() => {
                                setName(
                                    user?.name ??
                                    "",
                                );

                                setEmail(
                                    user?.email ??
                                    "",
                                );

                                setEditProfile(
                                    true,
                                );

                                window.scrollTo({
                                    top: 0,
                                    behavior:
                                        "smooth",
                                });
                            }}
                        >
                            <Edit3 size={17} />

                            Edit Informasi Akun
                        </button>

                    </section>

                    {/* ORDERS */}

                    <section className="profile-card profile-order-card">

                        <div className="section-heading">

                            <div className="section-icon">
                                <ShoppingBag
                                    size={21}
                                />
                            </div>

                            <div>
                                <h3>
                                    Pesanan Saya
                                </h3>

                                <p>
                                    Lihat dan pantau
                                    semua pesanan
                                    kamu.
                                </p>
                            </div>

                        </div>

                        <div className="order-highlight">

                            <div className="order-highlight-icon">
                                <ShoppingBag
                                    size={23}
                                />
                            </div>

                            <div>
                                <strong>
                                    Riwayat Pesanan
                                </strong>

                                <span>
                                    Lihat pesanan
                                    yang sedang
                                    berjalan dan
                                    pesanan
                                    sebelumnya.
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        "/orders",
                                    )
                                }
                            >
                                Lihat

                                <ArrowRight
                                    size={16}
                                />
                            </button>

                        </div>

                    </section>

                </div>

                {/* =================================================
                   ADDRESS
                ================================================= */}

                <section className="profile-card address-card">

                    <div className="section-heading">

                        <div className="section-icon">
                            <MapPin size={21} />
                        </div>

                        <div>
                            <h3>
                                Alamat Pengiriman
                            </h3>

                            <p>
                                Alamat yang
                                digunakan untuk
                                mengirim pesanan
                                kamu.
                            </p>
                        </div>

                    </div>

                    {!showEditAddress ? (
                        savedAddress ? (

                            <div className="saved-address">

                                <div className="saved-address-main">

                                    <div className="saved-address-label">
                                        <MapPin
                                            size={16}
                                        />

                                        {
                                            savedAddress.label
                                        }
                                    </div>

                                    <p className="saved-address-detail">
                                        {
                                            savedAddress.detail
                                        }
                                    </p>

                                    <p className="saved-address-region">
                                        {[
                                            savedAddress.district,
                                            savedAddress.city,
                                        ]
                                            .filter(
                                                Boolean,
                                            )
                                            .join(
                                                ", ",
                                            )}
                                    </p>

                                    <p className="saved-address-province">
                                        {[
                                            savedAddress.province,
                                            savedAddress.postalCode,
                                        ]
                                            .filter(
                                                Boolean,
                                            )
                                            .join(
                                                " - ",
                                            )}
                                    </p>

                                    {savedAddress.note && (
                                        <p className="saved-address-note">
                                            Catatan kurir:{" "}
                                            {
                                                savedAddress.note
                                            }
                                        </p>
                                    )}

                                </div>

                                <button
                                    type="button"
                                    className="edit-address-button"
                                    onClick={() => {
                                        setAddress(
                                            savedAddress,
                                        );

                                        setShowEditAddress(
                                            true,
                                        );
                                    }}
                                >
                                    <Edit3
                                        size={16}
                                    />

                                    Ubah Alamat
                                </button>

                            </div>

                        ) : (

                            <div className="empty-address">

                                <div className="empty-address-icon">
                                    <MapPin
                                        size={25}
                                    />
                                </div>

                                <div>
                                    <strong>
                                        Belum ada alamat
                                    </strong>

                                    <span>
                                        Tambahkan alamat
                                        agar checkout
                                        lebih cepat.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="add-address-btn"
                                    onClick={() => {
                                        setAddress({
                                            ...emptyAddress,
                                        });

                                        setShowEditAddress(
                                            true,
                                        );
                                    }}
                                >
                                    <Plus size={17} />

                                    Tambah Alamat
                                </button>

                            </div>

                        )
                    ) : (

                        <div className="address-form">

                            <div className="address-form-heading">
                                <div>
                                    <h4>
                                        {savedAddress
                                            ? "Ubah Alamat"
                                            : "Tambah Alamat"}
                                    </h4>

                                    <p>
                                        Isi alamat lengkap
                                        untuk pengiriman
                                        pesanan.
                                    </p>
                                </div>
                            </div>

                            <div className="address-type">

                                {[
                                    "Rumah",
                                    "Kantor",
                                    "Kos",
                                    "Lainnya",
                                ].map(
                                    item => (
                                        <button
                                            key={
                                                item
                                            }
                                            type="button"
                                            className={
                                                address.label ===
                                                    item
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                updateAddress(
                                                    {
                                                        label:
                                                            item,
                                                    },
                                                )
                                            }
                                        >
                                            {item}
                                        </button>
                                    ),
                                )}

                            </div>

                            <div className="address-form-grid">

                                <div className="address-field full">
                                    <label>
                                        Alamat Lengkap
                                    </label>

                                    <textarea
                                        placeholder="Contoh: Jl. Merdeka No. 10, RT 02/RW 03"
                                        value={
                                            address.detail
                                        }
                                        onChange={e =>
                                            updateAddress(
                                                {
                                                    detail:
                                                        e.target
                                                            .value,
                                                },
                                            )
                                        }
                                    />
                                </div>

                                <div className="address-field">
                                    <label>
                                        Provinsi
                                    </label>

                                    <select
                                        value={
                                            address.provinceId
                                        }
                                        onChange={e =>
                                            chooseProvince(
                                                e.target
                                                    .value,
                                            )
                                        }
                                    >
                                        <option value="">
                                            Pilih Provinsi
                                        </option>

                                        {provinces.map(
                                            item => (
                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {
                                                        item.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="address-field">
                                    <label>
                                        Kabupaten / Kota
                                    </label>

                                    <select
                                        value={
                                            address.cityId
                                        }
                                        onChange={e =>
                                            chooseCity(
                                                e.target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            !address.provinceId
                                        }
                                    >
                                        <option value="">
                                            Pilih Kota
                                        </option>

                                        {cities.map(
                                            item => (
                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {
                                                        item.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="address-field">
                                    <label>
                                        Kecamatan
                                    </label>

                                    <select
                                        value={
                                            address.districtId
                                        }
                                        onChange={e =>
                                            chooseDistrict(
                                                e.target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            !address.cityId
                                        }
                                    >
                                        <option value="">
                                            Pilih Kecamatan
                                        </option>

                                        {districts.map(
                                            item => (
                                                <option
                                                    key={
                                                        item.id
                                                    }
                                                    value={
                                                        item.id
                                                    }
                                                >
                                                    {
                                                        item.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>

                                <div className="address-field">
                                    <label>
                                        Kode Pos
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            address.postalCode
                                        }
                                        onChange={e =>
                                            updateAddress(
                                                {
                                                    postalCode:
                                                        e.target
                                                            .value,
                                                },
                                            )
                                        }
                                        placeholder="Kode pos"
                                    />
                                </div>

                                <div className="address-field full">
                                    <label>
                                        Catatan Kurir
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            address.note
                                        }
                                        onChange={e =>
                                            updateAddress(
                                                {
                                                    note:
                                                        e.target
                                                            .value,
                                                },
                                            )
                                        }
                                        placeholder="Contoh: rumah pagar hitam"
                                    />
                                </div>

                            </div>

                            <div className="profile-edit-actions">

                                <button
                                    type="button"
                                    className="profile-secondary-button"
                                    onClick={() =>
                                        setShowEditAddress(
                                            false,
                                        )
                                    }
                                    disabled={
                                        savingAddress
                                    }
                                >
                                    Batal
                                </button>

                                <button
                                    type="button"
                                    className="profile-primary-button"
                                    onClick={
                                        saveAddress
                                    }
                                    disabled={
                                        savingAddress
                                    }
                                >
                                    <CheckCircle2
                                        size={17}
                                    />

                                    {savingAddress
                                        ? "Menyimpan..."
                                        : "Simpan Alamat"}
                                </button>

                            </div>

                        </div>
                    )}

                </section>

                {/* =================================================
                   SETTINGS
                ================================================= */}

                <section className="settings-section">

                    <div className="settings-heading">

                        <div>

                            <div className="section-eyebrow">
                                <Settings size={16} />

                                PENGATURAN AKUN
                            </div>

                            <h2>
                                Pengaturan
                            </h2>

                            <p>
                                Kelola keamanan,
                                kontak, notifikasi,
                                loyalty, dan
                                preferensi akun
                                WartegKita kamu.
                            </p>

                        </div>

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
                                    Kelola password dan
                                    keamanan akun
                                </span>
                            </div>

                            <ChevronRight size={19} />
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
                                <Mail size={19} />
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

                            <ChevronRight size={19} />
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
                                <Bell size={19} />
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

                            <ChevronRight size={19} />
                        </button>

                        <button
                            type="button"
                            className="setting-item"
                            onClick={() =>
                                handleSettingClick(
                                    "Alamat Pengiriman",
                                )
                            }
                        >
                            <div className="setting-icon">
                                <MapPin size={19} />
                            </div>

                            <div className="setting-content">
                                <strong>
                                    Alamat Pengiriman
                                </strong>

                                <span>
                                    Kelola alamat untuk
                                    checkout
                                </span>
                            </div>

                            <ChevronRight size={19} />
                        </button>

                        <button
                            type="button"
                            className="setting-item"
                            onClick={() =>
                                handleSettingClick(
                                    "Poin & Reward",
                                )
                            }
                        >
                            <div className="setting-icon">
                                <Gift size={19} />
                            </div>

                            <div className="setting-content">
                                <strong>
                                    Poin & Reward
                                </strong>

                                <span>
                                    Lihat misi dan
                                    tukarkan poin
                                </span>
                            </div>

                            <ChevronRight size={19} />
                        </button>

                        <button
                            type="button"
                            className="setting-item"
                            onClick={() =>
                                handleSettingClick(
                                    "Bantuan Customer",
                                )
                            }
                        >
                            <div className="setting-icon">
                                <CircleHelp size={19} />
                            </div>

                            <div className="setting-content">
                                <strong>
                                    Bantuan
                                </strong>

                                <span>
                                    Pusat bantuan
                                    WartegKita
                                </span>
                            </div>

                            <ChevronRight size={19} />
                        </button>

                        <button
                            type="button"
                            className="setting-item"
                            onClick={() =>
                                handleSettingClick(
                                    "Privasi",
                                )
                            }
                        >
                            <div className="setting-icon">
                                <LockKeyhole
                                    size={19}
                                />
                            </div>

                            <div className="setting-content">
                                <strong>
                                    Privasi
                                </strong>

                                <span>
                                    Kelola preferensi
                                    dan privasi akun
                                </span>
                            </div>

                            <ChevronRight size={19} />
                        </button>

                    </div>

                </section>

                {/* =================================================
                   QUICK INFO
                ================================================= */}

                <section className="profile-quick-info">

                    <div>
                        <CircleHelp size={17} />

                        <span>
                            Butuh bantuan dengan
                            pesanan atau akun?
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            handleSettingClick(
                                "Bantuan Customer",
                            )
                        }
                    >
                        Pusat Bantuan

                        <ArrowRight size={15} />
                    </button>

                </section>

                {/* =================================================
                   LOGOUT
                ================================================= */}

                <section className="profile-logout-section">

                    <button
                        type="button"
                        className="profile-logout-button"
                        onClick={
                            logout
                        }
                    >
                        <LogOut size={18} />

                        Keluar dari Akun
                    </button>

                </section>

            </div>
        </div>
    );
}