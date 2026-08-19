import {
    ArrowLeft,
    CalendarDays,
    CheckCircle,
    ChevronRight,
    Loader2,
    Megaphone,
    Plus,
    Sparkles,
    Wallet,
    X,
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

import "../../../styles/seller/Campaign/Campaign.css";

/* =====================================================
   TYPES
===================================================== */

interface Campaign {
    id: string;
    name?: string;
    title?: string;
    description?: string;
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
    benefits?: string[];
    popular?: boolean;
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

interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data?: T;
}

/* =====================================================
   HELPERS
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

    const labels: Record<string, string> = {
        ACTIVE: "Aktif",
        INACTIVE: "Tidak Aktif",
        UPCOMING: "Akan Datang",
        EXPIRED: "Berakhir",

        PENDING: "Menunggu",
        PENDING_PAYMENT: "Menunggu Pembayaran",
        WAITING_PAYMENT: "Menunggu Pembayaran",

        PAID: "Sudah Dibayar",
        UNPAID: "Belum Dibayar",

        APPROVED: "Disetujui",
        REJECTED: "Ditolak",

        JOINED: "Sudah Mengikuti",
        COMPLETED: "Selesai",
        CANCELLED: "Dibatalkan",
        CANCELED: "Dibatalkan",

        PROCESSING: "Diproses",
    };

    return (
        labels[status] ||
        String(value ?? "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, char =>
                char.toUpperCase(),
            ) ||
        "-"
    );
};

const formatRupiah = (
    value: number,
): string => {
    const numericValue =
        Number(value);

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        },
    ).format(
        Number.isFinite(numericValue)
            ? numericValue
            : 0,
    );
};

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
   RESPONSE NORMALIZER
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

/* =====================================================
   EXTRACT ARRAY
===================================================== */

const extractArray = <T,>(
    raw: any,
): T[] => {
    if (Array.isArray(raw)) {
        return raw;
    }

    if (
        Array.isArray(
            raw?.items,
        )
    ) {
        return raw.items;
    }

    if (
        Array.isArray(
            raw?.campaigns,
        )
    ) {
        return raw.campaigns;
    }

    if (
        Array.isArray(
            raw?.packages,
        )
    ) {
        return raw.packages;
    }

    if (
        Array.isArray(
            raw?.data,
        )
    ) {
        return raw.data;
    }

    return [];
};

/* =====================================================
   PACKAGE NAME
===================================================== */

const getPackageName = (
    campaignPackage: CampaignPackage,
): string => {
    return (
        campaignPackage.name ??
        campaignPackage.title ??
        "Paket Campaign"
    );
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
   PACKAGE PRICE
===================================================== */

const getPackagePrice = (
    campaignPackage: CampaignPackage,
): number => {
    const price =
        Number(
            campaignPackage.price ?? 0,
        );

    return Number.isFinite(price)
        ? price
        : 0;
};

/* =====================================================
   COMPONENT
===================================================== */

export default function Campaign() {

    const {
        seller_id: urlSellerId,
    } = useParams<{
        seller_id: string;
    }>();

    const navigate =
        useNavigate();

    /* =================================================
       SELLER ID
    ================================================= */

    const sellerId =
        String(
            urlSellerId ||
            localStorage.getItem(
                "seller_id",
            ) ||
            "",
        ).trim();

    /* =================================================
       SIDEBAR
    ================================================= */

    const [
        openMenu,
        setOpenMenu,
    ] = useState(true);

    /* =================================================
       CAMPAIGNS
    ================================================= */

    const [
        campaigns,
        setCampaigns,
    ] = useState<Campaign[]>([]);

    const [
        selectedCampaign,
        setSelectedCampaign,
    ] = useState<Campaign | null>(
        null,
    );

    /* =================================================
       PACKAGES
    ================================================= */

    const [
        campaignPackages,
        setCampaignPackages,
    ] = useState<
        CampaignPackage[]
    >([]);

    /* =================================================
       SELLER CAMPAIGNS
    ================================================= */

    const [
        sellerCampaigns,
        setSellerCampaigns,
    ] = useState<
        SellerCampaign[]
    >([]);

    /* =================================================
       CAMPAIGN WALLET
    ================================================= */

    const [
        campaignBalance,
        setCampaignBalance,
    ] = useState(0);

    const [
        loadingBalance,
        setLoadingBalance,
    ] = useState(false);

    /* =================================================
       LOADING
    ================================================= */

    const [
        loadingCampaigns,
        setLoadingCampaigns,
    ] = useState(true);

    const [
        loadingPackages,
        setLoadingPackages,
    ] = useState(false);

    const [
        loadingSellerCampaigns,
        setLoadingSellerCampaigns,
    ] = useState(false);

    const [
        joiningPackageId,
        setJoiningPackageId,
    ] = useState<string | null>(
        null,
    );

    /* =================================================
       TOP UP MODALS
    ================================================= */

    const [
        showTopUp,
        setShowTopUp,
    ] = useState(false);

    const [
        showTopUpConfirmation,
        setShowTopUpConfirmation,
    ] = useState(false);

    /* =================================================
       TOP UP
    ================================================= */

    const [
        topUpAmount,
        setTopUpAmount,
    ] = useState("");

    const [
        topUpLoading,
        setTopUpLoading,
    ] = useState(false);

    const [
        pendingTopUpAmount,
        setPendingTopUpAmount,
    ] = useState(0);

    /* =================================================
       LOAD CAMPAIGNS
    ================================================= */

    const loadCampaigns =
        useCallback(
            async () => {

                try {

                    setLoadingCampaigns(
                        true,
                    );

                    const response =
                        await api.get(
                            "/campaigns",
                        );

                    const raw =
                        getResponseData(
                            response,
                        );

                    const result =
                        extractArray<Campaign>(
                            raw,
                        );

                    setCampaigns(
                        result,
                    );

                    const activeCampaign =
                        result.find(
                            campaign =>
                                normalizeStatus(
                                    campaign.status,
                                ) ===
                                "ACTIVE",
                        );

                    const defaultCampaign =
                        activeCampaign ??
                        result[0] ??
                        null;

                    setSelectedCampaign(
                        defaultCampaign,
                    );

                } catch (error) {

                    console.error(
                        "Load campaigns error:",
                        error,
                    );

                    setCampaigns([]);

                    setSelectedCampaign(
                        null,
                    );

                    await Swal.fire({
                        icon: "error",
                        title:
                            "Gagal Memuat Campaign",
                        text:
                            "Data campaign tidak dapat dimuat dari server.",
                        confirmButtonColor:
                            "#16a34a",
                    });

                } finally {

                    setLoadingCampaigns(
                        false,
                    );

                }

            },
            [],
        );

    /* =================================================
       LOAD PACKAGES
    ================================================= */

    const loadPackages =
        useCallback(
            async (
                campaignId: string,
            ) => {

                if (!campaignId) {

                    setCampaignPackages(
                        [],
                    );

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

                    const raw =
                        getResponseData(
                            response,
                        );

                    const result =
                        extractArray<CampaignPackage>(
                            raw,
                        );

                    setCampaignPackages(
                        result,
                    );

                } catch (error) {

                    console.error(
                        "Load campaign packages error:",
                        error,
                    );

                    setCampaignPackages(
                        [],
                    );

                    await Swal.fire({
                        icon: "error",
                        title:
                            "Gagal Memuat Paket",
                        text:
                            "Paket campaign tidak dapat dimuat.",
                        confirmButtonColor:
                            "#16a34a",
                    });

                } finally {

                    setLoadingPackages(
                        false,
                    );

                }

            },
            [],
        );

    /* =================================================
       LOAD SELLER CAMPAIGNS
    ================================================= */

    const loadSellerCampaigns =
        useCallback(
            async () => {

                if (!sellerId) {

                    setSellerCampaigns(
                        [],
                    );

                    return;
                }

                try {

                    setLoadingSellerCampaigns(
                        true,
                    );

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

                    const result =
                        extractArray<SellerCampaign>(
                            raw,
                        );

                    setSellerCampaigns(
                        result,
                    );

                } catch (error) {

                    console.error(
                        "Load seller campaigns error:",
                        error,
                    );

                    setSellerCampaigns(
                        [],
                    );

                } finally {

                    setLoadingSellerCampaigns(
                        false,
                    );

                }

            },
            [sellerId],
        );

    /* =================================================
       LOAD CAMPAIGN BALANCE
    ================================================= */

    const loadCampaignBalance =
        useCallback(
            async () => {

                if (!sellerId) {
                    return;
                }

                try {

                    setLoadingBalance(
                        true,
                    );

                    const response =
                        await api.get(
                            `/sellers/${encodeURIComponent(
                                sellerId,
                            )}/campaign-wallet`,
                        );

                    const raw =
                        getResponseData(
                            response,
                        );

                    const balance =
                        Number(
                            raw?.balance ??
                            raw?.campaign_balance ??
                            raw?.wallet_balance ??
                            0,
                        );

                    setCampaignBalance(
                        Number.isFinite(balance)
                            ? balance
                            : 0,
                    );

                } catch (error) {

                    console.error(
                        "Load campaign balance error:",
                        error,
                    );

                    setCampaignBalance(
                        0,
                    );

                } finally {

                    setLoadingBalance(
                        false,
                    );

                }

            },
            [sellerId],
        );

    /* =================================================
       INITIAL LOAD
    ================================================= */

    useEffect(() => {

        if (!sellerId) {
            return;
        }

        void loadCampaigns();

        void loadSellerCampaigns();

        void loadCampaignBalance();

    }, [
        sellerId,
        loadCampaigns,
        loadSellerCampaigns,
        loadCampaignBalance,
    ]);

    /* =================================================
       LOAD PACKAGE WHEN CAMPAIGN CHANGES
    ================================================= */

    useEffect(() => {

        if (!selectedCampaign?.id) {

            setCampaignPackages([]);

            return;
        }

        void loadPackages(
            selectedCampaign.id,
        );

    }, [
        selectedCampaign,
        loadPackages,
    ]);

    /* =================================================
       JOINED CAMPAIGN IDS
    ================================================= */

    const joinedCampaignIds =
        useMemo(
            () => {

                return new Set(
                    sellerCampaigns
                        .map(
                            item =>
                                item.campaign_id,
                        )
                        .filter(Boolean),
                );

            },
            [sellerCampaigns],
        );

    /* =================================================
       CURRENT SELLER CAMPAIGN
    ================================================= */

    const currentSellerCampaign =
        useMemo(
            () => {

                if (!selectedCampaign) {
                    return null;
                }

                return (
                    sellerCampaigns.find(
                        item =>
                            item.campaign_id ===
                            selectedCampaign.id,
                    ) ??
                    null
                );

            },
            [
                sellerCampaigns,
                selectedCampaign,
            ],
        );

    /* =================================================
       VALIDATE TOP UP
    ================================================= */

    const validateTopUpAmount =
        (): number | null => {

            const amount =
                Number(
                    topUpAmount.replace(
                        /\D/g,
                        "",
                    ),
                );

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                return null;
            }

            if (amount < 10000) {
                return null;
            }

            return amount;
        };

    /* =================================================
       OPEN TOP UP CONFIRMATION
    ================================================= */

    const handleOpenTopUpConfirmation =
        async () => {

            if (!sellerId) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Seller ID Tidak Ditemukan",
                    text:
                        "Silakan login kembali sebagai seller.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            const amount =
                validateTopUpAmount();

            if (amount === null) {

                const rawAmount =
                    Number(
                        topUpAmount.replace(
                            /\D/g,
                            "",
                        ),
                    );

                if (
                    !Number.isFinite(
                        rawAmount,
                    ) ||
                    rawAmount <= 0
                ) {

                    await Swal.fire({
                        icon: "warning",
                        title:
                            "Nominal Belum Diisi",
                        text:
                            "Masukkan nominal top up terlebih dahulu.",
                        confirmButtonColor:
                            "#16a34a",
                    });

                    return;
                }

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Minimal Top Up Rp10.000",
                    text:
                        "Silakan masukkan nominal minimal Rp10.000.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            setPendingTopUpAmount(
                amount,
            );

            setShowTopUp(
                false,
            );

            setShowTopUpConfirmation(
                true,
            );
        };

    /* =================================================
       CANCEL TOP UP CONFIRMATION
    ================================================= */

    const handleCancelTopUpConfirmation =
        () => {

            if (topUpLoading) {
                return;
            }

            setShowTopUpConfirmation(
                false,
            );

            setShowTopUp(
                true,
            );

        };

    /* =================================================
       PROCESS TOP UP
    ================================================= */

    const handleConfirmTopUp =
        async () => {

            if (!sellerId) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Seller ID Tidak Ditemukan",
                    text:
                        "Silakan login kembali sebagai seller.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (
                !pendingTopUpAmount ||
                pendingTopUpAmount < 10000
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Nominal Tidak Valid",
                    text:
                        "Nominal top up tidak valid.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            try {

                setTopUpLoading(
                    true,
                );

                const response =
                    await api.post(
                        `/sellers/${encodeURIComponent(
                            sellerId,
                        )}/campaign-wallet/top-up`,
                        {
                            amount:
                                pendingTopUpAmount,
                        },
                    );

                const responseData =
                    getResponseData(
                        response,
                    );

                const returnedBalance =
                    Number(
                        responseData?.balance ??
                        responseData?.campaign_balance ??
                        responseData?.wallet_balance,
                    );

                if (
                    Number.isFinite(
                        returnedBalance,
                    )
                ) {

                    setCampaignBalance(
                        returnedBalance,
                    );

                } else {

                    await loadCampaignBalance();

                }

                setTopUpAmount("");

                setPendingTopUpAmount(
                    0,
                );

                setShowTopUpConfirmation(
                    false,
                );

                await Swal.fire({
                    icon: "success",
                    title:
                        "Top Up Berhasil",
                    text:
                        response?.data?.message ||
                        "Saldo campaign berhasil ditambahkan.",
                    confirmButtonText:
                        "OK",
                    confirmButtonColor:
                        "#16a34a",
                });

            } catch (error: any) {

                console.error(
                    "Top up campaign error:",
                    error,
                );

                const statusCode =
                    error?.response?.status;

                const backendMessage =
                    error?.response?.data?.message;

                let message =
                    backendMessage ||
                    "Saldo campaign gagal ditambahkan.";

                if (
                    statusCode === 404
                ) {

                    message =
                        "Endpoint top up campaign belum tersedia di backend.";

                }

                if (
                    statusCode === 400
                ) {

                    message =
                        backendMessage ||
                        "Nominal top up tidak valid.";

                }

                setShowTopUpConfirmation(
                    false,
                );

                setShowTopUp(
                    true,
                );

                await Swal.fire({
                    icon: "error",
                    title:
                        "Top Up Gagal",
                    text:
                        message,
                    confirmButtonColor:
                        "#16a34a",
                });

            } finally {

                setTopUpLoading(
                    false,
                );

            }

        };

    /* =================================================
       JOIN CAMPAIGN
    ================================================= */

    const handleCampaignJoin =
        async (
            campaignPackage: CampaignPackage,
        ) => {

            if (!sellerId) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Seller ID Tidak Ditemukan",
                    text:
                        "Silakan login kembali sebagai seller.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (!selectedCampaign) {

                await Swal.fire({
                    icon: "error",
                    title:
                        "Campaign Tidak Ditemukan",
                    text:
                        "Silakan pilih campaign terlebih dahulu.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            const campaignStatus =
                normalizeStatus(
                    selectedCampaign.status,
                );

            if (
                campaignStatus !==
                "ACTIVE"
            ) {

                await Swal.fire({
                    icon: "warning",
                    title:
                        "Campaign Tidak Aktif",
                    text:
                        "Campaign ini sedang tidak dapat diikuti.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            if (
                joinedCampaignIds.has(
                    selectedCampaign.id,
                )
            ) {

                await Swal.fire({
                    icon: "info",
                    title:
                        "Sudah Mengikuti Campaign",
                    text:
                        "Seller kamu sudah terdaftar pada campaign ini.",
                    confirmButtonColor:
                        "#16a34a",
                });

                return;
            }

            const packagePrice =
                getPackagePrice(
                    campaignPackage,
                );

            const packageName =
                getPackageName(
                    campaignPackage,
                );

            const campaignName =
                getCampaignName(
                    selectedCampaign,
                );

            /* =================================================
               CEK SALDO
            ================================================= */

            if (
                campaignBalance <
                packagePrice
            ) {

                const result =
                    await Swal.fire({

                        icon: "warning",

                        title:
                            "Saldo Campaign Tidak Cukup",

                        html: `
                            <div style="text-align:center">

                                <p>
                                    Harga paket:
                                    <strong>
                                        ${formatRupiah(
                            packagePrice,
                        )}
                                    </strong>
                                </p>

                                <p>
                                    Saldo kamu:
                                    <strong>
                                        ${formatRupiah(
                            campaignBalance,
                        )}
                                    </strong>
                                </p>

                                <p
                                    style="
                                        margin-top:12px;
                                        color:#64748b;
                                        font-size:13px;
                                    "
                                >
                                    Silakan top up saldo
                                    campaign terlebih dahulu.
                                </p>

                            </div>
                        `,

                        showCancelButton:
                            true,

                        confirmButtonText:
                            "Top Up Saldo",

                        cancelButtonText:
                            "Batal",

                        confirmButtonColor:
                            "#16a34a",

                    });

                if (
                    result.isConfirmed
                ) {

                    setShowTopUp(
                        true,
                    );

                }

                return;
            }

            /* =================================================
               CONFIRM JOIN
            ================================================= */

            const confirmation =
                await Swal.fire({

                    icon: "question",

                    title:
                        `Ikut ${campaignName}?`,

                    html: `
                        <div style="text-align:left">

                            <p style="margin-bottom:8px">
                                Kamu akan mendaftar:
                            </p>

                            <p style="margin:4px 0">
                                <strong>Campaign</strong><br>
                                ${campaignName}
                            </p>

                            <p style="margin:12px 0 4px">
                                <strong>Paket</strong><br>
                                ${packageName}
                            </p>

                            <p style="margin:12px 0 4px">
                                <strong>Biaya</strong><br>
                                ${formatRupiah(
                        packagePrice,
                    )}
                            </p>

                            <p
                                style="
                                    margin-top:12px;
                                    margin-bottom:0;
                                    color:#64748b;
                                    font-size:13px;
                                "
                            >
                                Saldo setelah pembayaran:
                                <strong>
                                    ${formatRupiah(
                        campaignBalance -
                        packagePrice,
                    )}
                                </strong>
                            </p>

                        </div>
                    `,

                    showCancelButton:
                        true,

                    confirmButtonText:
                        "Daftar Campaign",

                    cancelButtonText:
                        "Batal",

                    confirmButtonColor:
                        "#16a34a",

                });

            if (
                !confirmation.isConfirmed
            ) {
                return;
            }

            try {

                setJoiningPackageId(
                    campaignPackage.id,
                );

                const response =
                    await api.post(
                        `/sellers/${encodeURIComponent(
                            sellerId,
                        )}/campaigns`,
                        {
                            campaign_id:
                                selectedCampaign.id,

                            package_id:
                                campaignPackage.id,
                        },
                    );

                const responseData =
                    getResponseData(
                        response,
                    );

                await Promise.all([
                    loadSellerCampaigns(),
                    loadCampaignBalance(),
                ]);

                await Swal.fire({

                    icon: "success",

                    title:
                        "Berhasil Mendaftar Campaign",

                    html: `
                        <p>
                            <strong>
                                ${campaignName}
                            </strong>
                            berhasil didaftarkan.
                        </p>

                        <p style="margin-top:10px">
                            Paket:
                            <strong>
                                ${packageName}
                            </strong>
                        </p>

                        <p style="margin-top:10px">
                            Status:
                            <strong>
                                Menunggu Pembayaran
                            </strong>
                        </p>
                    `,

                    confirmButtonText:
                        "OK",

                    confirmButtonColor:
                        "#16a34a",

                });

                console.info(
                    "Join campaign success:",
                    responseData,
                );

            } catch (error: any) {

                console.error(
                    "Join campaign error:",
                    error,
                );

                const statusCode =
                    error?.response?.status;

                const backendMessage =
                    error?.response?.data?.message;

                let message =
                    backendMessage ||
                    "Campaign gagal diproses.";

                if (
                    statusCode === 409
                ) {

                    message =
                        "Seller sudah mengikuti campaign ini.";

                }

                if (
                    statusCode === 404
                ) {

                    message =
                        "Campaign atau paket campaign tidak ditemukan.";

                }

                if (
                    statusCode === 400
                ) {

                    message =
                        backendMessage ||
                        "Data campaign tidak valid.";

                }

                await Swal.fire({

                    icon: "error",

                    title:
                        "Gagal Mendaftar Campaign",

                    text:
                        message,

                    confirmButtonColor:
                        "#16a34a",

                });

            } finally {

                setJoiningPackageId(
                    null,
                );

            }

        };

    /* =================================================
       SELLER ID INVALID
    ================================================= */

    if (!sellerId) {

        return (

            <div className="campaign-page">

                <div className="campaign-error">

                    <Megaphone
                        size={42}
                    />

                    <h2>
                        Seller ID Tidak Ditemukan
                    </h2>

                    <p>
                        Silakan login kembali sebagai seller.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/login",
                                {
                                    replace: true,
                                },
                            )
                        }
                    >
                        Login
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

                <div className="campaign-page">

                    {/* =================================================
                       HEADER
                    ================================================= */}

                    <header
                        className="campaign-page-header"
                    >

                        <button
                            type="button"
                            className="campaign-back-button"
                            onClick={() =>
                                navigate(-1)
                            }
                        >

                            <span
                                className="campaign-back-icon"
                            >

                                <ArrowLeft
                                    size={17}
                                />

                            </span>

                            <span
                                className="campaign-back-text"
                            >
                                Kembali
                            </span>

                        </button>

                        <div
                            className="campaign-header-main"
                        >

                            <div
                                className="campaign-eyebrow"
                            >

                                <Sparkles
                                    size={16}
                                />

                                WARTEGKITA PROMO

                            </div>

                            <h1>
                                Promosi & Campaign
                            </h1>

                            <p>
                                Tingkatkan jangkauan,
                                exposure, dan peluang
                                penjualan warteg kamu.
                            </p>

                        </div>

                        {/* =================================================
                           WALLET
                        ================================================= */}

                        <button
                            type="button"
                            className="campaign-wallet"
                            onClick={() =>
                                setShowTopUp(
                                    true,
                                )
                            }
                        >

                            <div
                                className="campaign-wallet-icon"
                            >

                                <Wallet
                                    size={20}
                                />

                            </div>

                            <div
                                className="campaign-wallet-content"
                            >

                                <span>
                                    Saldo Campaign
                                </span>

                                <strong>
                                    {
                                        loadingBalance
                                            ? "Memuat..."
                                            : formatRupiah(
                                                campaignBalance,
                                            )
                                    }
                                </strong>

                            </div>

                            <div
                                className="campaign-wallet-action"
                            >

                                <Plus
                                    size={15}
                                />

                                <span>
                                    Top Up
                                </span>

                            </div>

                        </button>

                    </header>

                    {/* =================================================
                       CAMPAIGN SELECTOR
                    ================================================= */}

                    {
                        !loadingCampaigns &&
                        campaigns.length > 0 && (

                            <section
                                className="campaign-selector"
                            >

                                <div>

                                    <span>
                                        PILIH CAMPAIGN
                                    </span>

                                    <h2>
                                        Campaign yang tersedia
                                    </h2>

                                </div>

                                <div
                                    className="campaign-selector-list"
                                >

                                    {
                                        campaigns.map(
                                            campaign => {

                                                const isSelected =
                                                    selectedCampaign?.id ===
                                                    campaign.id;

                                                const isCampaignActive =
                                                    normalizeStatus(
                                                        campaign.status,
                                                    ) ===
                                                    "ACTIVE";

                                                const isJoined =
                                                    joinedCampaignIds.has(
                                                        campaign.id,
                                                    );

                                                return (

                                                    <button
                                                        type="button"
                                                        key={
                                                            campaign.id
                                                        }
                                                        className={
                                                            `campaign-selector-item ${isSelected
                                                                ? "selected"
                                                                : ""
                                                            }`
                                                        }
                                                        onClick={() =>
                                                            setSelectedCampaign(
                                                                campaign,
                                                            )
                                                        }
                                                    >

                                                        <div>

                                                            <strong>
                                                                {
                                                                    getCampaignName(
                                                                        campaign,
                                                                    )
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    campaign.description ||
                                                                    "Campaign WartegKita"
                                                                }
                                                            </span>

                                                        </div>

                                                        <div
                                                            className="campaign-selector-status"
                                                        >

                                                            {
                                                                isJoined
                                                                    ? "SUDAH IKUT"
                                                                    : isCampaignActive
                                                                        ? "AKTIF"
                                                                        : getStatusLabel(
                                                                            campaign.status,
                                                                        )
                                                            }

                                                        </div>

                                                    </button>

                                                );

                                            },
                                        )
                                    }

                                </div>

                            </section>

                        )
                    }

                    {/* =================================================
                       ACTIVE CAMPAIGN
                       NO DETAIL BUTTON
                    ================================================= */}

                    {
                        selectedCampaign && (

                            <section
                                className="active-campaign-card"
                            >

                                <div
                                    className="campaign-icon-large"
                                >

                                    <Megaphone
                                        size={28}
                                    />

                                </div>

                                <div
                                    className="active-campaign-content"
                                >

                                    <span
                                        className="active-label"
                                    >

                                        {
                                            normalizeStatus(
                                                selectedCampaign.status,
                                            ) === "ACTIVE"
                                                ? "CAMPAIGN AKTIF"
                                                : "CAMPAIGN"
                                        }

                                    </span>

                                    <h2>
                                        {
                                            getCampaignName(
                                                selectedCampaign,
                                            )
                                        }
                                    </h2>

                                    <p>
                                        {
                                            selectedCampaign.description ||
                                            "Ikuti campaign WartegKita untuk meningkatkan exposure dan peluang penjualan."
                                        }
                                    </p>

                                    <div
                                        className="campaign-highlight"
                                    >

                                        <CalendarDays
                                            size={16}
                                        />

                                        <span>

                                            {
                                                formatDate(
                                                    selectedCampaign.start_at,
                                                )
                                            }

                                            {" - "}

                                            {
                                                formatDate(
                                                    selectedCampaign.end_at,
                                                )
                                            }

                                        </span>

                                    </div>

                                </div>

                            </section>

                        )
                    }

                    {/* =================================================
                       CURRENT SELLER CAMPAIGN
                    ================================================= */}

                    {
                        currentSellerCampaign && (

                            <section
                                className="seller-current-campaign"
                            >

                                <div>

                                    <span>
                                        CAMPAIGN KAMU
                                    </span>

                                    <h3>
                                        {
                                            getCampaignName(
                                                selectedCampaign,
                                            )
                                        }
                                    </h3>

                                    <p>
                                        Kamu sudah terdaftar
                                        pada campaign ini.
                                    </p>

                                </div>

                                <div
                                    className="seller-current-campaign-status"
                                >

                                    <strong>
                                        {
                                            getStatusLabel(
                                                currentSellerCampaign.status,
                                            )
                                        }
                                    </strong>

                                    <span>
                                        Pembayaran:{" "}

                                        {
                                            getStatusLabel(
                                                currentSellerCampaign.payment_status,
                                            )
                                        }
                                    </span>

                                </div>

                            </section>

                        )
                    }

                    {/* =================================================
                       PACKAGE SECTION
                    ================================================= */}

                    {
                        selectedCampaign && (

                            <section
                                className="campaign-package-section"
                            >

                                <div
                                    className="package-title"
                                >

                                    <div>

                                        <h2>
                                            Pilih Paket Campaign
                                        </h2>

                                        <p>
                                            Pilih paket sesuai
                                            kebutuhan exposure
                                            warteg kamu.
                                        </p>

                                    </div>

                                </div>

                                {/* =================================================
                                   LOADING
                                ================================================= */}

                                {
                                    loadingPackages && (

                                        <div
                                            className="campaign-package-loading"
                                        >

                                            <Loader2
                                                size={22}
                                                className="campaign-spinner"
                                            />

                                            <span>
                                                Memuat paket campaign...
                                            </span>

                                        </div>

                                    )
                                }

                                {/* =================================================
                                   EMPTY
                                ================================================= */}

                                {
                                    !loadingPackages &&
                                    campaignPackages.length === 0 && (

                                        <div
                                            className="campaign-package-empty"
                                        >

                                            <Megaphone
                                                size={26}
                                            />

                                            <strong>
                                                Belum ada paket campaign
                                            </strong>

                                            <span>
                                                Paket untuk campaign
                                                ini belum tersedia.
                                            </span>

                                        </div>

                                    )
                                }

                                {/* =================================================
                                   PACKAGES
                                ================================================= */}

                                {
                                    !loadingPackages &&
                                    campaignPackages.length > 0 && (

                                        <div
                                            className="campaign-package-grid"
                                        >

                                            {
                                                campaignPackages.map(
                                                    campaignPackage => {

                                                        const price =
                                                            getPackagePrice(
                                                                campaignPackage,
                                                            );

                                                        const packageName =
                                                            getPackageName(
                                                                campaignPackage,
                                                            );

                                                        const isJoining =
                                                            joiningPackageId ===
                                                            campaignPackage.id;

                                                        const alreadyJoined =
                                                            Boolean(
                                                                currentSellerCampaign,
                                                            );

                                                        return (

                                                            <article
                                                                key={
                                                                    campaignPackage.id
                                                                }
                                                                className={
                                                                    `campaign-package ${campaignPackage.popular
                                                                        ? "popular"
                                                                        : ""
                                                                    }`
                                                                }
                                                            >

                                                                {
                                                                    campaignPackage.popular && (

                                                                        <div
                                                                            className="popular-badge"
                                                                        >

                                                                            <Sparkles
                                                                                size={13}
                                                                            />

                                                                            PALING POPULER

                                                                        </div>

                                                                    )
                                                                }

                                                                <div
                                                                    className="package-top"
                                                                >

                                                                    <span>
                                                                        {
                                                                            packageName
                                                                        }
                                                                    </span>

                                                                    <div
                                                                        className="package-price"
                                                                    >

                                                                        <small>
                                                                            Harga
                                                                        </small>

                                                                        <strong>
                                                                            {
                                                                                formatRupiah(
                                                                                    price,
                                                                                )
                                                                            }
                                                                        </strong>

                                                                    </div>

                                                                </div>

                                                                <p
                                                                    className="package-description"
                                                                >

                                                                    {
                                                                        campaignPackage.description ||
                                                                        "Paket campaign untuk meningkatkan exposure warteg kamu di WartegKita."
                                                                    }

                                                                </p>

                                                                <div
                                                                    className="package-benefits"
                                                                >

                                                                    {
                                                                        Array.isArray(
                                                                            campaignPackage.benefits,
                                                                        ) &&
                                                                            campaignPackage.benefits.length > 0
                                                                            ? campaignPackage.benefits.map(
                                                                                benefit => (

                                                                                    <div
                                                                                        key={
                                                                                            benefit
                                                                                        }
                                                                                    >

                                                                                        <CheckCircle
                                                                                            size={16}
                                                                                        />

                                                                                        <span>
                                                                                            {
                                                                                                benefit
                                                                                            }
                                                                                        </span>

                                                                                    </div>

                                                                                ),
                                                                            )
                                                                            : (

                                                                                <div>

                                                                                    <CheckCircle
                                                                                        size={16}
                                                                                    />

                                                                                    <span>
                                                                                        Mendapatkan exposure campaign
                                                                                    </span>

                                                                                </div>

                                                                            )
                                                                    }

                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    className="package-button"
                                                                    onClick={() =>
                                                                        handleCampaignJoin(
                                                                            campaignPackage,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isJoining ||
                                                                        alreadyJoined ||
                                                                        normalizeStatus(
                                                                            selectedCampaign.status,
                                                                        ) !== "ACTIVE"
                                                                    }
                                                                >

                                                                    {
                                                                        isJoining
                                                                            ? (
                                                                                <>
                                                                                    <Loader2
                                                                                        size={16}
                                                                                        className="campaign-spinner"
                                                                                    />

                                                                                    Memproses...
                                                                                </>
                                                                            )
                                                                            : alreadyJoined
                                                                                ? "Sudah Terdaftar"
                                                                                : "Ikut Campaign"
                                                                    }

                                                                </button>

                                                            </article>

                                                        );

                                                    },
                                                )
                                            }

                                        </div>

                                    )
                                }

                            </section>

                        )
                    }

                    {/* =================================================
                       NO CAMPAIGN
                    ================================================= */}

                    {
                        !loadingCampaigns &&
                        campaigns.length === 0 && (

                            <section
                                className="campaign-empty"
                            >

                                <div
                                    className="campaign-empty-icon"
                                >

                                    <Megaphone
                                        size={30}
                                    />

                                </div>

                                <h2>
                                    Belum Ada Campaign
                                </h2>

                                <p>
                                    Saat ini belum ada campaign
                                    yang tersedia untuk seller.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        loadCampaigns
                                    }
                                >
                                    Muat Ulang
                                </button>

                            </section>

                        )
                    }

                    {/* =================================================
                       TOP UP MODAL
                    ================================================= */}

                    {
                        showTopUp && (

                            <div
                                className="campaign-modal-backdrop"
                                onClick={() => {

                                    if (
                                        !topUpLoading
                                    ) {
                                        setShowTopUp(
                                            false,
                                        );
                                    }

                                }}
                            >

                                <div
                                    className="campaign-topup-modal"
                                    onClick={event =>
                                        event.stopPropagation()
                                    }
                                >

                                    {/* HEADER */}

                                    <div
                                        className="campaign-topup-header"
                                    >

                                        <div
                                            className="campaign-topup-title"
                                        >

                                            <div
                                                className="campaign-topup-icon"
                                            >

                                                <Wallet
                                                    size={22}
                                                />

                                            </div>

                                            <div>

                                                <span>
                                                    CAMPAIGN WALLET
                                                </span>

                                                <h2>
                                                    Top Up Saldo
                                                </h2>

                                            </div>

                                        </div>

                                        <button
                                            type="button"
                                            className="campaign-topup-close"
                                            disabled={
                                                topUpLoading
                                            }
                                            onClick={() =>
                                                setShowTopUp(
                                                    false,
                                                )
                                            }
                                        >

                                            <X
                                                size={19}
                                            />

                                        </button>

                                    </div>

                                    {/* BODY */}

                                    <div
                                        className="campaign-topup-body"
                                    >

                                        <div
                                            className="campaign-topup-balance"
                                        >

                                            <span>
                                                Saldo Saat Ini
                                            </span>

                                            <strong>
                                                {
                                                    formatRupiah(
                                                        campaignBalance,
                                                    )
                                                }
                                            </strong>

                                        </div>

                                        <label
                                            className="campaign-topup-label"
                                        >
                                            Nominal Top Up
                                        </label>

                                        <div
                                            className="campaign-topup-input-wrapper"
                                        >

                                            <span>
                                                Rp
                                            </span>

                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Contoh: 100000"
                                                value={
                                                    topUpAmount
                                                }
                                                disabled={
                                                    topUpLoading
                                                }
                                                onChange={
                                                    event => {

                                                        const value =
                                                            event.target.value
                                                                .replace(
                                                                    /\D/g,
                                                                    "",
                                                                );

                                                        setTopUpAmount(
                                                            value,
                                                        );

                                                    }
                                                }
                                            />

                                        </div>

                                        {/* PRESETS */}

                                        <div
                                            className="campaign-topup-presets"
                                        >

                                            {
                                                [
                                                    50000,
                                                    100000,
                                                    200000,
                                                    500000,
                                                ].map(
                                                    amount => (

                                                        <button
                                                            key={
                                                                amount
                                                            }
                                                            type="button"
                                                            disabled={
                                                                topUpLoading
                                                            }
                                                            onClick={() =>
                                                                setTopUpAmount(
                                                                    String(
                                                                        amount,
                                                                    ),
                                                                )
                                                            }
                                                        >

                                                            {
                                                                formatRupiah(
                                                                    amount,
                                                                )
                                                            }

                                                        </button>

                                                    ),
                                                )
                                            }

                                        </div>

                                        <p
                                            className="campaign-topup-info"
                                        >

                                            Saldo campaign digunakan
                                            untuk membayar paket
                                            campaign WartegKita.

                                        </p>

                                    </div>

                                    {/* FOOTER */}

                                    <div
                                        className="campaign-topup-footer"
                                    >

                                        <button
                                            type="button"
                                            className="campaign-topup-cancel"
                                            disabled={
                                                topUpLoading
                                            }
                                            onClick={() =>
                                                setShowTopUp(
                                                    false,
                                                )
                                            }
                                        >
                                            Batal
                                        </button>

                                        <button
                                            type="button"
                                            className="campaign-topup-submit"
                                            disabled={
                                                topUpLoading ||
                                                !topUpAmount
                                            }
                                            onClick={
                                                handleOpenTopUpConfirmation
                                            }
                                        >

                                            <Plus
                                                size={17}
                                            />

                                            Top Up Saldo

                                        </button>

                                    </div>

                                </div>

                            </div>

                        )
                    }

                    {/* =================================================
                       TOP UP CONFIRMATION MODAL
                    ================================================= */}

                    {
                        showTopUpConfirmation && (

                            <div
                                className="campaign-modal-backdrop"
                                onClick={() => {

                                    if (
                                        !topUpLoading
                                    ) {
                                        handleCancelTopUpConfirmation();
                                    }

                                }}
                            >

                                <div
                                    className="campaign-topup-confirm-modal"
                                    onClick={event =>
                                        event.stopPropagation()
                                    }
                                >

                                    {/* ICON */}

                                    <div
                                        className="campaign-topup-confirm-icon"
                                    >

                                        <Wallet
                                            size={25}
                                        />

                                    </div>

                                    {/* HEADER */}

                                    <div
                                        className="campaign-topup-confirm-header"
                                    >

                                        <span>
                                            CAMPAIGN WALLET
                                        </span>

                                        <h2>
                                            Konfirmasi Top Up
                                        </h2>

                                    </div>

                                    {/* BODY */}

                                    <div
                                        className="campaign-topup-confirm-body"
                                    >

                                        <p className="campaign-topup-confirm-description">
                                            Top Up saldo campaign sebesar
                                        </p>

                                        <strong className="campaign-topup-confirm-amount">
                                            {
                                                formatRupiah(
                                                    pendingTopUpAmount,
                                                )
                                            }
                                        </strong>

                                        <div
                                            className="campaign-topup-confirm-summary"
                                        >

                                            <div>

                                                <span>
                                                    Saldo saat ini
                                                </span>

                                                <strong>
                                                    {
                                                        formatRupiah(
                                                            campaignBalance,
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                            <div>

                                                <span>
                                                    Saldo setelah top up
                                                </span>

                                                <strong>
                                                    {
                                                        formatRupiah(
                                                            campaignBalance +
                                                            pendingTopUpAmount,
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                        <p className="campaign-topup-confirm-question">
                                            Apakah kamu ingin melanjutkan?
                                        </p>

                                    </div>

                                    {/* FOOTER */}

                                    <div
                                        className="campaign-topup-confirm-footer"
                                    >

                                        <button
                                            type="button"
                                            className="campaign-topup-confirm-cancel"
                                            disabled={
                                                topUpLoading
                                            }
                                            onClick={
                                                handleCancelTopUpConfirmation
                                            }
                                        >
                                            Batal
                                        </button>

                                        <button
                                            type="button"
                                            className="campaign-topup-confirm-submit"
                                            disabled={
                                                topUpLoading
                                            }
                                            onClick={
                                                handleConfirmTopUp
                                            }
                                        >

                                            {
                                                topUpLoading
                                                    ? (
                                                        <>
                                                            <Loader2
                                                                size={17}
                                                                className="campaign-spinner"
                                                            />

                                                            Memproses...
                                                        </>
                                                    )
                                                    : (
                                                        <>
                                                            Lanjutkan

                                                            <ChevronRight
                                                                size={17}
                                                            />

                                                        </>
                                                    )
                                            }

                                        </button>

                                    </div>

                                </div>

                            </div>

                        )
                    }

                </div>

            </main>

        </div>

    );
}