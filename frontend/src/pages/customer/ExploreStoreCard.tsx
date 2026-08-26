import {
    Clock3,
    MapPin,
    Star,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import {
    Seller,
} from "../../types";


interface ExploreStoreCardProps {

    seller: Seller;

}


export default function ExploreStoreCard({
    seller,
}: ExploreStoreCardProps) {


    /* =====================================================
       IMAGE
    ===================================================== */

    const image =
        seller.image ||
        seller.image_url ||
        "";


    /* =====================================================
       STORE NAME
    ===================================================== */

    const storeName =
        seller.name ||
        seller.store_name ||
        "Warteg";


    /* =====================================================
       ADDRESS
    ===================================================== */

    const address =
        seller.address ||
        seller.alamat ||
        "Alamat belum tersedia";


    /* =====================================================
       RATING
    ===================================================== */

    const rating =
        Number(
            seller.rating || 0,
        );


    /* =====================================================
       REVIEW COUNT
    ===================================================== */

    const reviewCount =
        Number(
            seller.review_count || 0,
        );


    /* =====================================================
       OPEN STATUS
    ===================================================== */

    const isOpen =
        seller.is_open ??
        seller.isOpen ??
        false;


    /* =====================================================
       SELLER ID
    ===================================================== */

    const sellerId =
        seller.id;


    return (

        <Link
            to={`/store/${sellerId}`}
            className="explore-store-card"
        >

            {/* =================================================
               IMAGE
            ================================================= */}

            <div
                className="explore-store-card-image"
            >

                {
                    image ? (

                        <img
                            src={image}
                            alt={storeName}
                            loading="lazy"
                        />

                    ) : (

                        <div
                            className="explore-store-card-placeholder"
                        >

                            <span>
                                🍛
                            </span>

                        </div>

                    )
                }


                {/* =================================================
                   OPEN / CLOSED BADGE
                ================================================= */}

                <div
                    className={
                        `explore-store-status ${
                            isOpen
                                ? "is-open"
                                : "is-closed"
                        }`
                    }
                >

                    <span
                        className="explore-store-status-dot"
                    />

                    {
                        isOpen
                            ? "Buka"
                            : "Tutup"
                    }

                </div>

            </div>


            {/* =================================================
               CONTENT
            ================================================= */}

            <div
                className="explore-store-card-content"
            >

                {/* =================================================
                   NAME
                ================================================= */}

                <h3
                    className="explore-store-card-name"
                >
                    {storeName}
                </h3>


                {/* =================================================
                   RATING
                ================================================= */}

                <div
                    className="explore-store-card-rating"
                >

                    <Star
                        size={14}
                        fill="currentColor"
                    />

                    <strong>
                        {
                            rating > 0
                                ? rating.toFixed(1)
                                : "Baru"
                        }
                    </strong>

                    {
                        reviewCount > 0 && (

                            <span>
                                ({reviewCount})
                            </span>

                        )
                    }

                </div>


                {/* =================================================
                   ADDRESS
                ================================================= */}

                <div
                    className="explore-store-card-location"
                >

                    <MapPin
                        size={13}
                    />

                    <span>
                        {address}
                    </span>

                </div>


                {/* =================================================
                   FOOTER
                ================================================= */}

                <div
                    className="explore-store-card-footer"
                >

                    <span
                        className="explore-store-card-type"
                    >
                        Warteg
                    </span>


                    {
                        isOpen ? (

                            <span
                                className="explore-store-card-open"
                            >
                                <Clock3
                                    size={12}
                                />

                                Buka sekarang
                            </span>

                        ) : (

                            <span
                                className="explore-store-card-closed"
                            >
                                Tutup
                            </span>

                        )
                    }

                </div>

            </div>

        </Link>
    );
}