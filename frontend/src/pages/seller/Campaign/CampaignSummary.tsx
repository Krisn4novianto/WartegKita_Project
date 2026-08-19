import {
    ChevronRight,
    Megaphone,
    Sparkles,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../../../services/api";


import "../../../styles/seller/Campaign/CampaignSummary.css";





/* =====================================================
   TYPES
===================================================== */

export interface SellerCampaignSummaryData {

    id: string;

    seller_id?: string;

    campaign_id?: string;

    package_id?: string;

    amount?: number;

    payment_status?: string;

    status?: string;

    start_at?: string | null;

    end_at?: string | null;

    campaign?: {

        id?: string;

        name?: string;

        title?: string;

        description?: string;

        status?: string;

        start_at?: string | null;

        end_at?: string | null;
    };

    package?: {

        id?: string;

        name?: string;

        title?: string;

        price?: number;
    };

    campaign_package?: {

        id?: string;

        name?: string;

        title?: string;

        price?: number;
    };
}


interface CampaignSummaryProps {

    sellerId: string;

    navigateToCampaign: () => void;

    refreshKey?: number;
}


/* =====================================================
   HELPERS
===================================================== */

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
        Number.isFinite(
            numericValue,
        )
            ? numericValue
            : 0,
    );
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
   EXTRACT CAMPAIGNS
===================================================== */

const extractCampaigns = (
    raw: any,
): SellerCampaignSummaryData[] => {

    if (!raw) {
        return [];
    }


    if (
        Array.isArray(raw)
    ) {

        return raw;

    }


    if (
        Array.isArray(
            raw.items,
        )
    ) {

        return raw.items;

    }


    if (
        Array.isArray(
            raw.campaigns,
        )
    ) {

        return raw.campaigns;

    }


    if (
        Array.isArray(
            raw.data,
        )
    ) {

        return raw.data;

    }


    if (
        typeof raw === "object"
    ) {

        return [raw];

    }


    return [];
};


/* =====================================================
   STATUS
===================================================== */

const normalizeStatus = (
    value?: string | null,
): string => {

    return String(
        value ?? "",
    )
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            "_",
        );
};


/* =====================================================
   STATUS LABEL
===================================================== */

const getStatusLabel = (
    value?: string | null,
): string => {

    const status =
        normalizeStatus(
            value,
        );


    switch (
    status
    ) {

        case "ACTIVE":
            return "AKTIF";


        case "PENDING":
            return "MENUNGGU";


        case "PENDING_PAYMENT":
            return "MENUNGGU PEMBAYARAN";


        case "PAID":
            return "SUDAH DIBAYAR";


        case "UNPAID":
            return "BELUM DIBAYAR";


        case "COMPLETED":
            return "SELESAI";


        case "CANCELLED":
            return "DIBATALKAN";


        case "EXPIRED":
            return "KADALUARSA";


        case "REJECTED":
            return "DITOLAK";


        default:

            return value
                ? String(value)
                    .replace(
                        /_/g,
                        " ",
                    )
                    .toUpperCase()
                : "TERDAFTAR";
    }
};


/* =====================================================
   CAMPAIGN NAME
===================================================== */

const getCampaignName = (
    campaign: SellerCampaignSummaryData,
): string => {

    return (
        campaign.campaign?.name ??
        campaign.campaign?.title ??
        "Campaign WartegKita"
    );
};


/* =====================================================
   PACKAGE NAME
===================================================== */

const getPackageName = (
    campaign: SellerCampaignSummaryData,
): string => {

    return (
        campaign.package?.name ??
        campaign.package?.title ??
        campaign.campaign_package?.name ??
        campaign.campaign_package?.title ??
        "Paket Campaign"
    );
};


/* =====================================================
   AMOUNT
===================================================== */

const getAmount = (
    campaign: SellerCampaignSummaryData,
): number => {

    const amount =
        Number(
            campaign.amount ??
            campaign.package?.price ??
            campaign.campaign_package?.price ??
            0,
        );


    return Number.isFinite(
        amount,
    )
        ? amount
        : 0;
};


/* =====================================================
   CAMPAIGN PRIORITY
===================================================== */

/*
 * Kalau seller punya beberapa campaign:
 *
 * 1. ACTIVE
 * 2. PENDING_PAYMENT
 * 3. PENDING
 * 4. PAID
 * 5. campaign lainnya
 *
 * Jadi BusinessProfile tidak asal mengambil
 * record pertama dari database.
 */

const getCampaignPriority = (
    campaign: SellerCampaignSummaryData,
): number => {

    const status =
        normalizeStatus(
            campaign.status ??
            campaign.campaign?.status,
        );


    switch (
    status
    ) {

        case "ACTIVE":
            return 1;

        case "PENDING_PAYMENT":
            return 2;

        case "PENDING":
            return 3;

        case "PAID":
            return 4;

        case "COMPLETED":
            return 5;

        case "EXPIRED":
            return 6;

        case "CANCELLED":
            return 7;

        default:
            return 8;
    }
};


/* =====================================================
   SELECT BEST CAMPAIGN
===================================================== */

const selectBestCampaign = (
    campaigns: SellerCampaignSummaryData[],
): SellerCampaignSummaryData | null => {

    if (
        campaigns.length === 0
    ) {

        return null;

    }


    return [
        ...campaigns,
    ]
        .sort(
            (
                first,
                second,
            ) => {

                const priorityDifference =
                    getCampaignPriority(
                        first,
                    ) -
                    getCampaignPriority(
                        second,
                    );


                if (
                    priorityDifference !== 0
                ) {

                    return priorityDifference;

                }


                /*
                 * Kalau priority sama,
                 * gunakan tanggal terbaru.
                 */

                const firstDate =
                    new Date(
                        first.start_at ??
                        first.campaign?.start_at ??
                        0,
                    ).getTime();


                const secondDate =
                    new Date(
                        second.start_at ??
                        second.campaign?.start_at ??
                        0,
                    ).getTime();


                return (
                    secondDate -
                    firstDate
                );
            },
        )[0] ?? null;
};


/* =====================================================
   COMPONENT
===================================================== */

export default function CampaignSummary({
    sellerId,
    navigateToCampaign,
    refreshKey = 0,
}: CampaignSummaryProps) {

    const [
        campaigns,
        setCampaigns,
    ] = useState<
        SellerCampaignSummaryData[]
    >([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState(false);


    /* =================================================
       LOAD SELLER CAMPAIGNS
    ================================================= */

    useEffect(() => {

        let cancelled =
            false;


        const loadSellerCampaigns =
            async () => {

                if (
                    !sellerId
                ) {

                    setCampaigns([]);

                    setLoading(false);

                    return;

                }


                try {

                    setLoading(true);

                    setError(false);


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
                        extractCampaigns(
                            raw,
                        );


                    if (
                        cancelled
                    ) {

                        return;

                    }


                    setCampaigns(
                        result,
                    );

                } catch (
                requestError
                ) {

                    if (
                        cancelled
                    ) {

                        return;

                    }


                    console.error(
                        "Load seller campaigns error:",
                        requestError,
                    );


                    setCampaigns([]);

                    setError(true);

                } finally {

                    if (
                        !cancelled
                    ) {

                        setLoading(
                            false,
                        );

                    }

                }

            };


        void loadSellerCampaigns();


        return () => {

            cancelled =
                true;

        };

    }, [
        sellerId,
        refreshKey,
    ]);


    /* =================================================
       SELECT CAMPAIGN
    ================================================= */

    const campaign =
        useMemo(
            () =>
                selectBestCampaign(
                    campaigns,
                ),
            [
                campaigns,
            ],
        );


    /* =================================================
       CAMPAIGN STATUS
    ================================================= */

    const status =
        normalizeStatus(
            campaign?.status ??
            campaign?.campaign?.status,
        );


    const paymentStatus =
        normalizeStatus(
            campaign?.payment_status,
        );


    const isActive =
        status === "ACTIVE";


    const isPendingPayment =
        status ===
        "PENDING_PAYMENT";


    const displayStatus =
        isPendingPayment
            ? "MENUNGGU PEMBAYARAN"
            : getStatusLabel(
                campaign?.status ??
                campaign?.campaign?.status,
            );


    /* =================================================
       RENDER
    ================================================= */

    return (

        <section className="campaign-summary-section">

            {/* =================================================
               HEADER
            ================================================= */}

            <div className="campaign-summary-header">

                <div className="campaign-summary-heading">

                    <div className="campaign-summary-heading-icon">

                        <Megaphone
                            size={20}
                        />

                    </div>


                    <div>

                        <div className="campaign-summary-eyebrow">

                            <Sparkles
                                size={13}
                            />

                            WARTEGKITA PROMO

                        </div>


                        <h3>
                            Promosi & Campaign
                        </h3>


                        <p>
                            Tingkatkan exposure dan peluang
                            penjualan warteg kamu.
                        </p>

                    </div>

                </div>


                <button
                    type="button"
                    className="campaign-summary-link"
                    onClick={
                        navigateToCampaign
                    }
                >

                    Kelola Campaign

                    <ChevronRight
                        size={17}
                    />

                </button>

            </div>


            {/* =================================================
               LOADING
            ================================================= */}

            {
                loading && (

                    <div className="campaign-summary-loading">

                        <div className="campaign-summary-loading-icon">

                            <Megaphone
                                size={21}
                            />

                        </div>


                        <div>

                            <strong>
                                Memuat informasi campaign...
                            </strong>

                            <span>
                                Sedang mengambil data campaign seller.
                            </span>

                        </div>

                    </div>

                )
            }


            {/* =================================================
               CAMPAIGN EXISTS
            ================================================= */}

            {
                !loading &&
                campaign && (

                    <div
                        className={
                            `campaign-summary-card ${isActive
                                ? "is-active"
                                : ""
                            }`
                        }
                    >

                        <div className="campaign-summary-card-main">

                            <div className="campaign-summary-card-icon">

                                <Megaphone
                                    size={22}
                                />

                            </div>


                            <div className="campaign-summary-card-content">

                                <span className="campaign-summary-label">

                                    {
                                        isActive
                                            ? "CAMPAIGN AKTIF"
                                            : "CAMPAIGN SELLER"
                                    }

                                </span>


                                <h4>
                                    {
                                        getCampaignName(
                                            campaign,
                                        )
                                    }
                                </h4>


                                <p>

                                    Paket{" "}

                                    <strong>
                                        {
                                            getPackageName(
                                                campaign,
                                            )
                                        }
                                    </strong>

                                </p>

                            </div>

                        </div>


                        <div className="campaign-summary-card-meta">

                            <div className="campaign-summary-status-row">

                                <span
                                    className={
                                        `campaign-summary-status ${isActive
                                            ? "active"
                                            : isPendingPayment
                                                ? "pending"
                                                : "default"
                                        }`
                                    }
                                >

                                    {
                                        displayStatus
                                    }

                                </span>


                                {
                                    paymentStatus && (

                                        <span className="campaign-summary-payment">

                                            Pembayaran:{" "}

                                            {
                                                getStatusLabel(
                                                    campaign.payment_status,
                                                )
                                            }

                                        </span>

                                    )
                                }

                            </div>


                            <strong className="campaign-summary-amount">

                                {
                                    formatRupiah(
                                        getAmount(
                                            campaign,
                                        ),
                                    )
                                }

                            </strong>

                        </div>

                    </div>

                )
            }


            {/* =================================================
               EMPTY
            ================================================= */}

            {
                !loading &&
                !campaign &&
                !error && (

                    <div className="campaign-summary-empty">

                        <div className="campaign-summary-empty-icon">

                            <Megaphone
                                size={23}
                            />

                        </div>


                        <div className="campaign-summary-empty-content">

                            <strong>
                                Belum mengikuti campaign
                            </strong>


                            <p>
                                Pilih campaign yang sesuai untuk
                                meningkatkan jangkauan warteg kamu.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="campaign-summary-action"
                            onClick={
                                navigateToCampaign
                            }
                        >

                            Lihat Campaign

                            <ChevronRight
                                size={16}
                            />

                        </button>

                    </div>

                )
            }


            {/* =================================================
               ERROR
            ================================================= */}

            {
                !loading &&
                !campaign &&
                error && (

                    <div className="campaign-summary-error">

                        <div>

                            <strong>
                                Informasi campaign belum dapat dimuat.
                            </strong>

                            <span>
                                Silakan coba lagi atau buka halaman Campaign.
                            </span>

                        </div>


                        <button
                            type="button"
                            onClick={
                                navigateToCampaign
                            }
                        >

                            Buka Campaign

                            <ChevronRight
                                size={15}
                            />

                        </button>

                    </div>

                )
            }

        </section>
    );
}