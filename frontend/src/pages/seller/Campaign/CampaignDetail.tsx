import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Loader2,
    Megaphone,
    Package,
    Sparkles,
    Wallet,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import SellerNavbar from "../SellerNavbar";
import api from "../../../services/api";

import "../../../styles/seller/Campaign/CampaignDetail.css";

/* =====================================================
   TYPES
===================================================== */

interface Campaign {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    banner_image?: string | null;
    status?: string;
    start_at?: string | null;
    end_at?: string | null;
}

interface CampaignPackage {
    id: string;
    campaign_id?: string;

    name?: string;
    title?: string;

    description?: string;

    price?: number;

    duration_days?: number;

    popular?: boolean;

    benefits?: unknown;

    is_active?: boolean;
}

interface SellerCampaign {
    id: string;

    seller_id?: string;

    campaign_id?: string;

    package_id?: string;

    amount?: number;

    payment_status?: string;

    status?: string;

    start_at?: string | null;

    end_at?: string | null;

    campaign?: Campaign;

    package?: CampaignPackage;

    campaign_package?: CampaignPackage;
}

/* =====================================================
   RESPONSE HELPERS
===================================================== */

const getResponseData = (
    response: any,
): any => {
    return (
        response?.data?.data ??
        response?.data ??
        null
    );
};

const extractArray = <T,>(
    raw: any,
): T[] => {
    if (Array.isArray(raw)) {
        return raw;
    }

    if (Array.isArray(raw?.items)) {
        return raw.items;
    }

    if (Array.isArray(raw?.data)) {
        return raw.data;
    }

    if (Array.isArray(raw?.campaigns)) {
        return raw.campaigns;
    }

    if (Array.isArray(raw?.packages)) {
        return raw.packages;
    }

    if (Array.isArray(raw?.results)) {
        return raw.results;
    }

    return [];
};

/* =====================================================
   NORMALIZE BENEFITS
===================================================== */

const normalizeBenefits = (
    benefits: unknown,
): string[] => {
    /*
     * PostgreSQL JSONB bisa sampai ke frontend
     * dalam bentuk array langsung.
     */
    if (Array.isArray(benefits)) {
        return benefits
            .map((item) =>
                String(item ?? "").trim(),
            )
            .filter(Boolean);
    }

    /*
     * Antisipasi kalau Axios/backend
     * mengirim JSONB sebagai string.
     */
    if (typeof benefits === "string") {
        const value =
            benefits.trim();

        if (!value) {
            return [];
        }

        try {
            const parsed =
                JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) =>
                        String(item ?? "").trim(),
                    )
                    .filter(Boolean);
            }
        } catch {
            /*
             * Bukan JSON.
             * Anggap sebagai satu benefit.
             */
        }

        return [value];
    }

    return [];
};

/* =====================================================
   STATUS
===================================================== */

const normalizeStatus = (
    value?: string | null,
): string => {
    return String(value ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
};

const getStatusLabel = (
    value?: string | null,
): string => {
    const status =
        normalizeStatus(value);

    switch (status) {
        case "ACTIVE":
            return "AKTIF";

        case "DRAFT":
            return "DRAFT";

        case "PENDING":
            return "MENUNGGU";

        case "PENDING_PAYMENT":
            return "MENUNGGU PEMBAYARAN";

        case "UNPAID":
            return "BELUM DIBAYAR";

        case "PAID":
            return "SUDAH DIBAYAR";

        case "COMPLETED":
            return "SELESAI";

        case "CANCELLED":
            return "DIBATALKAN";

        case "EXPIRED":
            return "KADALUARSA";

        case "ENDED":
            return "BERAKHIR";

        case "INACTIVE":
            return "TIDAK AKTIF";

        default:
            return value
                ? String(value)
                    .replace(/_/g, " ")
                    .toUpperCase()
                : "TERDAFTAR";
    }
};

/* =====================================================
   FORMAT RUPIAH
===================================================== */

const formatRupiah = (
    value?: number | null,
): string => {
    const numeric =
        Number(value ?? 0);

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        },
    ).format(
        Number.isFinite(numeric)
            ? numeric
            : 0,
    );
};

/* =====================================================
   FORMAT DATE
===================================================== */

const formatDate = (
    value?: string | null,
): string => {
    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        },
    ).format(date);
};

/* =====================================================
   CAMPAIGN NAME
===================================================== */

const getCampaignName = (
    campaign?: Campaign | null,
): string => {
    return (
        campaign?.name ??
        campaign?.title ??
        "Campaign WartegKita"
    );
};

/* =====================================================
   PACKAGE NAME
===================================================== */

const getPackageName = (
    campaignPackage?: CampaignPackage | null,
): string => {
    return (
        campaignPackage?.name ??
        campaignPackage?.title ??
        "Paket Campaign"
    );
};

/* =====================================================
   COMPONENT
===================================================== */

export default function CampaignDetail() {

    const {
        seller_id: sellerIdParam,
        campaign_id: campaignIdParam,
    } = useParams<{
        seller_id: string;
        campaign_id: string;
    }>();

    const navigate =
        useNavigate();

    const sellerId =
        String(
            sellerIdParam ?? "",
        ).trim();

    const campaignId =
        String(
            campaignIdParam ?? "",
        ).trim();

    /* =================================================
       SIDEBAR
    ================================================= */

    const [
        openMenu,
        setOpenMenu,
    ] = useState(true);

    /* =================================================
       DATA
    ================================================= */

    const [
        campaign,
        setCampaign,
    ] = useState<Campaign | null>(
        null,
    );

    const [
        packages,
        setPackages,
    ] = useState<CampaignPackage[]>(
        [],
    );

    const [
        sellerCampaign,
        setSellerCampaign,
    ] = useState<SellerCampaign | null>(
        null,
    );

    const [
        selectedPackageId,
        setSelectedPackageId,
    ] = useState<string | null>(
        null,
    );

    /* =================================================
       LOADING
    ================================================= */

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        loadingPackages,
        setLoadingPackages,
    ] = useState(false);

    const [
        joining,
        setJoining,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    /* =================================================
       LOAD CAMPAIGN
    ================================================= */

    const loadCampaign =
        useCallback(
            async () => {

                if (!campaignId) {
                    setError(
                        "Campaign ID tidak ditemukan.",
                    );

                    setLoading(false);

                    return;
                }

                try {
                    setLoading(true);
                    setError("");

                    const response =
                        await api.get(
                            `/campaigns/${encodeURIComponent(
                                campaignId,
                            )}`,
                        );

                    const raw =
                        getResponseData(
                            response,
                        );

                    const data =
                        raw?.campaign ??
                        raw;

                    if (
                        !data ||
                        typeof data !==
                        "object"
                    ) {
                        throw new Error(
                            "Data campaign kosong.",
                        );
                    }

                    setCampaign(
                        data,
                    );

                } catch (
                requestError: any
                ) {

                    console.error(
                        "Gagal load campaign:",
                        requestError,
                    );

                    if (
                        requestError?.response
                            ?.status === 404
                    ) {
                        setError(
                            "Campaign tidak ditemukan.",
                        );
                    } else {
                        setError(
                            "Data campaign tidak dapat dimuat.",
                        );
                    }

                } finally {
                    setLoading(false);
                }
            },
            [campaignId],
        );

    /* =================================================
       LOAD PACKAGES
    ================================================= */

    const loadPackages =
        useCallback(
            async () => {

                if (!campaignId) {
                    return;
                }

                try {

                    setLoadingPackages(
                        true,
                    );

                    const response =
                        await api.get(
                            `/campaigns/${encodeURIComponent(
                                campaignId,
                            )}/packages`,
                        );

                    console.log(
                        "CAMPAIGN PACKAGE RESPONSE:",
                        response.data,
                    );

                    const raw =
                        getResponseData(
                            response,
                        );

                    const packageData =
                        extractArray<CampaignPackage>(
                            raw,
                        );

                    /*
                     * Hanya package aktif.
                     */
                    const activePackages =
                        packageData.filter(
                            (item) =>
                                item.is_active !==
                                false,
                        );

                    /*
                     * Normalisasi benefits
                     * dari PostgreSQL JSONB.
                     */
                    const normalizedPackages =
                        activePackages.map(
                            (item) => ({
                                ...item,

                                benefits:
                                    normalizeBenefits(
                                        item.benefits,
                                    ),
                            }),
                        );

                    console.log(
                        "PACKAGES NORMALIZED:",
                        normalizedPackages,
                    );

                    setPackages(
                        normalizedPackages,
                    );

                } catch (
                packageError: any
                ) {

                    console.error(
                        "Gagal mengambil packages:",
                        packageError,
                    );

                    setPackages([]);

                } finally {

                    setLoadingPackages(
                        false,
                    );
                }
            },
            [campaignId],
        );

    /* =================================================
       LOAD SELLER CAMPAIGN
    ================================================= */

    const loadSellerCampaign =
        useCallback(
            async () => {

                if (!sellerId) {
                    return;
                }

                try {

                    const response =
                        await api.get(
                            `/sellers/${encodeURIComponent(
                                sellerId,
                            )}/campaigns`,
                        );

                    const raw =
                        getResponseData(
                            response,
                        );

                    const campaigns =
                        extractArray<SellerCampaign>(
                            raw,
                        );

                    const current =
                        campaigns.find(
                            (item) =>
                                String(
                                    item.campaign_id ??
                                    item.campaign?.id ??
                                    "",
                                ) ===
                                campaignId,
                        ) ?? null;

                    setSellerCampaign(
                        current,
                    );

                    /*
                     * Kalau seller sudah punya
                     * package, otomatis pilih.
                     */
                    if (
                        current?.package_id
                    ) {
                        setSelectedPackageId(
                            current.package_id,
                        );
                    }

                } catch (
                sellerCampaignError
                ) {

                    console.warn(
                        "Seller campaign gagal dimuat:",
                        sellerCampaignError,
                    );

                    setSellerCampaign(
                        null,
                    );
                }
            },
            [
                sellerId,
                campaignId,
            ],
        );

    /* =================================================
       INITIAL LOAD
    ================================================= */

    useEffect(() => {

        void loadCampaign();
        void loadPackages();
        void loadSellerCampaign();

    }, [
        loadCampaign,
        loadPackages,
        loadSellerCampaign,
    ]);

    /* =================================================
       SELECTED PACKAGE
    ================================================= */

    const selectedPackage =
        useMemo(
            () => {

                if (
                    !selectedPackageId
                ) {
                    return null;
                }

                return (
                    packages.find(
                        (item) =>
                            item.id ===
                            selectedPackageId,
                    ) ?? null
                );

            },
            [
                packages,
                selectedPackageId,
            ],
        );

    /* =================================================
       CAMPAIGN STATUS
    ================================================= */

    const campaignStatus =
        normalizeStatus(
            campaign?.status,
        );

    const isCampaignActive =
        campaignStatus === "ACTIVE";

    /* =================================================
       ALREADY JOINED
    ================================================= */

    const alreadyJoined =
        Boolean(
            sellerCampaign,
        );

    /* =================================================
       JOIN CAMPAIGN
    ================================================= */

    const handleJoinCampaign =
        async () => {

            if (!sellerId) {

                await Swal.fire({
                    icon: "error",
                    title: "Seller tidak ditemukan",
                    text: "Seller ID tidak tersedia.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (!campaignId) {

                await Swal.fire({
                    icon: "error",
                    title: "Campaign tidak ditemukan",
                    text: "Campaign ID tidak tersedia.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (!selectedPackageId) {

                await Swal.fire({
                    icon: "warning",
                    title: "Pilih paket dulu",
                    text: "Silakan pilih salah satu paket campaign.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (alreadyJoined) {

                await Swal.fire({
                    icon: "info",
                    title: "Sudah mengikuti campaign",
                    text: "Seller sudah terdaftar pada campaign ini.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (!isCampaignActive) {

                await Swal.fire({
                    icon: "warning",
                    title: "Campaign tidak aktif",
                    text: "Campaign ini sudah tidak dapat diikuti.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            const selected =
                packages.find(
                    (item) =>
                        item.id ===
                        selectedPackageId,
                );

            if (!selected) {

                await Swal.fire({
                    icon: "error",
                    title: "Paket tidak ditemukan",
                    text: "Paket campaign tidak tersedia.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            /* =================================================
               BENEFITS
            ================================================= */

            const benefits =
                normalizeBenefits(
                    selected.benefits,
                );

            const benefitHtml =
                benefits.length > 0
                    ? `
                        <div style="
                            margin-top:16px;
                            text-align:left;
                        ">

                            <div style="
                                font-size:11px;
                                font-weight:800;
                                letter-spacing:.06em;
                                color:#64748b;
                                margin-bottom:9px;
                            ">
                                BENEFIT PAKET
                            </div>

                            ${benefits
                        .map(
                            (benefit) => `
                                        <div style="
                                            display:flex;
                                            align-items:flex-start;
                                            gap:8px;
                                            margin-bottom:7px;
                                            font-size:13px;
                                            line-height:1.45;
                                            color:#475569;
                                        ">

                                            <span style="
                                                flex:0 0 auto;
                                                color:#16a34a;
                                                font-weight:800;
                                            ">
                                                ✓
                                            </span>

                                            <span>
                                                ${benefit}
                                            </span>

                                        </div>
                                    `,
                        )
                        .join("")}

                        </div>
                    `
                    : "";

            /* =================================================
               CONFIRMATION
            ================================================= */

            const confirmation =
                await Swal.fire({

                    icon: "question",

                    title:
                        "Ambil Paket Campaign?",

                    html: `
                        <div style="
                            text-align:left;
                        ">

                            <div style="
                                padding:16px;
                                border-radius:14px;
                                background:#f0fdf4;
                                border:1px solid #bbf7d0;
                            ">

                                <div style="
                                    font-size:11px;
                                    font-weight:800;
                                    letter-spacing:.06em;
                                    color:#64748b;
                                    margin-bottom:6px;
                                ">
                                    PAKET CAMPAIGN
                                </div>

                                <strong style="
                                    display:block;
                                    color:#166534;
                                    font-size:17px;
                                ">
                                    ${getPackageName(selected)}
                                </strong>

                                <strong style="
                                    display:block;
                                    margin-top:7px;
                                    color:#16a34a;
                                    font-size:20px;
                                ">
                                    ${formatRupiah(selected.price)}
                                </strong>

                                ${selected.duration_days
                            ? `
                                            <span style="
                                                display:block;
                                                margin-top:5px;
                                                color:#64748b;
                                                font-size:12px;
                                            ">
                                                Berlaku ${selected.duration_days} hari
                                            </span>
                                        `
                            : ""
                        }

                                ${benefitHtml}

                            </div>

                        </div>
                    `,

                    showCancelButton:
                        true,

                    confirmButtonText:
                        "Ya, Ambil Paket",

                    cancelButtonText:
                        "Batal",

                    confirmButtonColor:
                        "#16a34a",

                    cancelButtonColor:
                        "#64748b",
                });

            if (
                !confirmation.isConfirmed
            ) {
                return;
            }

            /* =================================================
               POST JOIN
            ================================================= */

            try {

                setJoining(true);

                const response =
                    await api.post(
                        `/sellers/${encodeURIComponent(
                            sellerId,
                        )}/campaigns`,
                        {
                            campaign_id:
                                campaignId,

                            package_id:
                                selectedPackageId,
                        },
                    );

                console.log(
                    "JOIN CAMPAIGN RESPONSE:",
                    response.data,
                );

                await Swal.fire({

                    icon: "success",

                    title:
                        "Berhasil Mengambil Paket",

                    text:
                        "Paket campaign berhasil didaftarkan ke seller.",

                    confirmButtonColor:
                        "#16a34a",
                });

                await loadSellerCampaign();

            } catch (
            joinError: any
            ) {

                console.error(
                    "JOIN CAMPAIGN ERROR:",
                    joinError,
                );

                const message =
                    joinError?.response
                        ?.data?.message ??
                    "Gagal mengambil paket campaign.";

                await Swal.fire({

                    icon:
                        joinError?.response
                            ?.status === 409
                            ? "info"
                            : "error",

                    title:
                        joinError?.response
                            ?.status === 409
                            ? "Sudah Terdaftar"
                            : "Gagal Mengambil Paket",

                    text:
                        message,

                    confirmButtonColor:
                        "#16a34a",
                });

            } finally {

                setJoining(false);
            }
        };

    /* =================================================
       INVALID SELLER
    ================================================= */

    if (!sellerId) {

        return (
            <div className="campaign-detail-page">

                <div className="campaign-detail-error">

                    <Megaphone
                        size={42}
                    />

                    <h2>
                        Seller ID Tidak Ditemukan
                    </h2>

                    <p>
                        Silakan kembali ke
                        profile seller.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/explore",
                            )
                        }
                    >
                        Kembali
                    </button>

                </div>

            </div>
        );
    }

    /* =================================================
       RENDER
    ================================================= */

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

                <div className="campaign-detail-container">

                    {/* =================================================
                       BACK
                    ================================================= */}

                    <button
                        type="button"
                        className="campaign-back-button"
                        onClick={() =>
                            navigate(
                                `/sellers/${encodeURIComponent(
                                    sellerId,
                                )}/campaign`,
                            )
                        }
                    >

                        <ArrowLeft
                            size={18}
                        />

                        Kembali ke Campaign

                    </button>

                    {/* =================================================
                       LOADING
                    ================================================= */}

                    {loading && (

                        <div className="campaign-loading">

                            <Loader2
                                size={34}
                                className="campaign-spinner"
                            />

                            <strong>
                                Memuat detail campaign...
                            </strong>

                            <span>
                                Sedang mengambil
                                informasi campaign.
                            </span>

                        </div>
                    )}

                    {/* =================================================
                       ERROR
                    ================================================= */}

                    {!loading &&
                        error && (

                            <div className="campaign-error-box">

                                <Megaphone
                                    size={40}
                                />

                                <h2>
                                    Campaign Tidak Ditemukan
                                </h2>

                                <p>
                                    {error}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/sellers/${encodeURIComponent(
                                                sellerId,
                                            )}/campaign`,
                                        )
                                    }
                                >

                                    <ArrowLeft
                                        size={17}
                                    />

                                    Kembali ke Campaign

                                </button>

                            </div>
                        )}

                    {/* =================================================
                       CAMPAIGN DETAIL
                    ================================================= */}

                    {!loading &&
                        !error &&
                        campaign && (

                            <>

                                {/* =================================================
                                   HERO
                                ================================================= */}

                                <section className="campaign-detail-hero">

                                    <div className="campaign-hero-glow" />

                                    <div className="campaign-hero-content">

                                        <div>

                                            <span className="campaign-hero-label">

                                                <Sparkles
                                                    size={14}
                                                />

                                                DETAIL CAMPAIGN

                                            </span>

                                            <h1>
                                                {
                                                    getCampaignName(
                                                        campaign,
                                                    )
                                                }
                                            </h1>

                                            <p>
                                                {
                                                    campaign.description ??
                                                    "Campaign promo WartegKita."
                                                }
                                            </p>

                                            <div className="campaign-hero-meta">

                                                <div>

                                                    <CalendarDays
                                                        size={17}
                                                    />

                                                    <span>
                                                        {
                                                            formatDate(
                                                                campaign.start_at,
                                                            )
                                                        }

                                                        {" - "}

                                                        {
                                                            formatDate(
                                                                campaign.end_at,
                                                            )
                                                        }
                                                    </span>

                                                </div>

                                                <div>

                                                    <CheckCircle2
                                                        size={17}
                                                    />

                                                    <span>
                                                        {
                                                            getStatusLabel(
                                                                campaign.status,
                                                            )
                                                        }
                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                        <div className="campaign-hero-icon">

                                            <Megaphone
                                                size={34}
                                            />

                                        </div>

                                    </div>

                                </section>

                                {/* =================================================
                                   ABOUT
                                ================================================= */}

                                <section className="campaign-section">

                                    <div className="campaign-section-heading">

                                        <div className="campaign-section-icon">

                                            <Megaphone
                                                size={20}
                                            />

                                        </div>

                                        <div>

                                            <span>
                                                INFORMASI
                                            </span>

                                            <h2>
                                                Tentang Campaign
                                            </h2>

                                        </div>

                                    </div>

                                    <p className="campaign-description">

                                        {
                                            campaign.description ??
                                            "Informasi campaign WartegKita."
                                        }

                                    </p>

                                </section>

                                {/* =================================================
                                   PACKAGES
                                ================================================= */}

                                <section className="campaign-package-section">

                                    <div className="campaign-section-heading package-heading">

                                        <div>

                                            <span>
                                                PILIHAN PAKET
                                            </span>

                                            <h2>
                                                Pilih Paket Campaign
                                            </h2>

                                            <p>
                                                Pilih paket yang sesuai
                                                dengan kebutuhan promosi
                                                warteg kamu.
                                            </p>

                                        </div>

                                    </div>

                                    {/* =================================================
                                       PACKAGE LOADING
                                    ================================================= */}

                                    {loadingPackages && (

                                        <div className="campaign-package-loading">

                                            <Loader2
                                                size={24}
                                                className="campaign-spinner"
                                            />

                                            <span>
                                                Memuat paket campaign...
                                            </span>

                                        </div>
                                    )}

                                    {/* =================================================
                                       PACKAGE EMPTY
                                    ================================================= */}

                                    {!loadingPackages &&
                                        packages.length ===
                                        0 && (

                                            <div className="campaign-package-empty">

                                                <Package
                                                    size={32}
                                                />

                                                <strong>
                                                    Paket campaign belum tersedia
                                                </strong>

                                                <span>
                                                    Belum ada paket aktif
                                                    untuk campaign ini.
                                                </span>

                                            </div>
                                        )}

                                    {/* =================================================
                                       PACKAGE GRID
                                    ================================================= */}

                                    {!loadingPackages &&
                                        packages.length >
                                        0 && (

                                            <div className="campaign-package-grid">

                                                {packages.map(
                                                    (
                                                        campaignPackage,
                                                    ) => {

                                                        const isSelected =
                                                            selectedPackageId ===
                                                            campaignPackage.id;

                                                        const benefits =
                                                            normalizeBenefits(
                                                                campaignPackage.benefits,
                                                            );

                                                        return (

                                                            <article
                                                                key={
                                                                    campaignPackage.id
                                                                }
                                                                className={
                                                                    `campaign-package-card ${isSelected
                                                                        ? "selected"
                                                                        : ""
                                                                    }`
                                                                }
                                                            >

                                                                {/* POPULAR */}

                                                                {campaignPackage.popular && (

                                                                    <div className="package-popular">

                                                                        <Sparkles
                                                                            size={12}
                                                                        />

                                                                        PALING POPULER

                                                                    </div>
                                                                )}

                                                                {/* ICON */}

                                                                <div className="package-icon">

                                                                    <Package
                                                                        size={22}
                                                                    />

                                                                </div>

                                                                {/* NAME */}

                                                                <h3>

                                                                    {
                                                                        getPackageName(
                                                                            campaignPackage,
                                                                        )
                                                                    }

                                                                </h3>

                                                                {/* PRICE */}

                                                                <div className="package-price">

                                                                    {
                                                                        formatRupiah(
                                                                            campaignPackage.price,
                                                                        )
                                                                    }

                                                                </div>

                                                                {/* DURATION */}

                                                                {campaignPackage.duration_days && (

                                                                    <div className="package-duration">

                                                                        <Clock3
                                                                            size={14}
                                                                        />

                                                                        Berlaku{" "}
                                                                        {
                                                                            campaignPackage.duration_days
                                                                        }{" "}
                                                                        hari

                                                                    </div>
                                                                )}

                                                                {/* DESCRIPTION */}

                                                                {campaignPackage.description && (

                                                                    <p className="package-description">

                                                                        {
                                                                            campaignPackage.description
                                                                        }

                                                                    </p>
                                                                )}

                                                                {/* =================================================
                                                                   BENEFITS
                                                                ================================================= */}

                                                                <div className="package-benefits">

                                                                    {benefits.length >
                                                                        0 ? (

                                                                        benefits.map(
                                                                            (
                                                                                benefit,
                                                                                index,
                                                                            ) => (

                                                                                <div
                                                                                    key={`${campaignPackage.id}-${index}`}
                                                                                    className="package-benefit"
                                                                                >

                                                                                    <CheckCircle2
                                                                                        size={
                                                                                            17
                                                                                        }
                                                                                    />

                                                                                    <span>
                                                                                        {
                                                                                            benefit
                                                                                        }
                                                                                    </span>

                                                                                </div>
                                                                            ),
                                                                        )

                                                                    ) : (

                                                                        <div className="package-no-benefit">

                                                                            Benefit
                                                                            belum
                                                                            tersedia.

                                                                        </div>
                                                                    )}

                                                                </div>

                                                                {/* =================================================
                                                                   SELECT PACKAGE
                                                                ================================================= */}

                                                                <button
                                                                    type="button"
                                                                    className={
                                                                        `package-select-button ${isSelected
                                                                            ? "selected"
                                                                            : ""
                                                                        }`
                                                                    }
                                                                    disabled={
                                                                        joining ||
                                                                        alreadyJoined
                                                                    }
                                                                    onClick={() =>
                                                                        setSelectedPackageId(
                                                                            campaignPackage.id,
                                                                        )
                                                                    }
                                                                >

                                                                    {isSelected ? (

                                                                        <>

                                                                            <CheckCircle2
                                                                                size={
                                                                                    17
                                                                                }
                                                                            />

                                                                            Paket Dipilih

                                                                        </>

                                                                    ) : (

                                                                        <>

                                                                            Pilih Paket

                                                                            <ChevronRight
                                                                                size={
                                                                                    17
                                                                                }
                                                                            />

                                                                        </>

                                                                    )}

                                                                </button>

                                                            </article>
                                                        );
                                                    },
                                                )}

                                            </div>
                                        )}

                                </section>

                                {/* =================================================
                                   SELECTED PACKAGE SUMMARY
                                ================================================= */}

                                {selectedPackage && (

                                    <section className="selected-package-box">

                                        <div className="selected-package-info">

                                            <span>
                                                PAKET DIPILIH
                                            </span>

                                            <strong>
                                                {
                                                    getPackageName(
                                                        selectedPackage,
                                                    )
                                                }
                                            </strong>

                                            <small>

                                                {
                                                    selectedPackage.duration_days
                                                        ? `Berlaku ${selectedPackage.duration_days} hari`
                                                        : "Paket campaign WartegKita"
                                                }

                                            </small>

                                        </div>

                                        <div className="selected-package-price">

                                            <Wallet
                                                size={18}
                                            />

                                            {
                                                formatRupiah(
                                                    selectedPackage.price,
                                                )
                                            }

                                        </div>

                                    </section>
                                )}

                                {/* =================================================
                                   ALREADY JOINED
                                ================================================= */}

                                {alreadyJoined && (

                                    <section className="already-joined-box">

                                        <CheckCircle2
                                            size={22}
                                        />

                                        <div>

                                            <strong>
                                                Seller sudah mengikuti campaign ini
                                            </strong>

                                            <span>
                                                Paket campaign sudah
                                                terdaftar pada seller.
                                            </span>

                                        </div>

                                    </section>
                                )}

                                {/* =================================================
                                   ACTION
                                ================================================= */}

                                <div className="campaign-detail-actions">

                                    <button
                                        type="button"
                                        className="campaign-secondary-button"
                                        onClick={() =>
                                            navigate(
                                                `/sellers/${encodeURIComponent(
                                                    sellerId,
                                                )}/campaign`,
                                            )
                                        }
                                    >

                                        <ArrowLeft
                                            size={17}
                                        />

                                        Kembali

                                    </button>

                                    {!alreadyJoined && (

                                        <button
                                            type="button"
                                            className="campaign-primary-button"
                                            disabled={
                                                joining ||
                                                !selectedPackageId ||
                                                !isCampaignActive
                                            }
                                            onClick={
                                                handleJoinCampaign
                                            }
                                        >

                                            {joining ? (

                                                <>

                                                    <Loader2
                                                        size={18}
                                                        className="campaign-spinner"
                                                    />

                                                    Memproses...

                                                </>

                                            ) : (

                                                <>

                                                    Ambil Paket

                                                    <ChevronRight
                                                        size={18}
                                                    />

                                                </>

                                            )}

                                        </button>
                                    )}

                                </div>

                            </>
                        )}

                </div>

            </main>

        </div>
    );
}