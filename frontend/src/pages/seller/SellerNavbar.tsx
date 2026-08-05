import {
    Menu,
    X,
    LayoutDashboard,
    ShoppingBag,
    Utensils,
    UserRound,
} from "lucide-react";

import {
    Link,
    useParams,
    useLocation,
} from "react-router-dom";

import "../../styles/seller/SellerNavbar.css";


/* =====================================================
   TYPES
===================================================== */

interface SellerNavbarProps {
    openMenu: boolean;
    setOpenMenu: React.Dispatch<
        React.SetStateAction<boolean>
    >;
}


/* =====================================================
   COMPONENT
===================================================== */

export default function SellerNavbar({
    openMenu,
    setOpenMenu,
}: SellerNavbarProps) {

    const {
        seller_id,
    } = useParams();


    const location =
        useLocation();


    /* =====================================================
       ACTIVE MENU
    ===================================================== */

    const isActive = (
        path: string
    ) => {

        return location.pathname === path
            ? "seller-link active"
            : "seller-link";

    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <aside
            className={
                `seller-navbar ${openMenu
                    ? "open"
                    : "close"
                }`
            }
        >


            {/* =================================================
               TOGGLE
            ================================================= */}

            <button
                type="button"
                className="seller-toggle"
                onClick={() =>
                    setOpenMenu(
                        !openMenu
                    )
                }
                aria-label={
                    openMenu
                        ? "Tutup menu"
                        : "Buka menu"
                }
            >

                {openMenu ? (

                    <X
                        size={22}
                    />

                ) : (

                    <Menu
                        size={22}
                    />

                )}

            </button>


            {/* =================================================
               LOGO
            ================================================= */}

            <div className="seller-logo">

                {openMenu ? (

                    <>
                        <span>
                            Warteg
                        </span>

                        <b>
                            Kita
                        </b>
                    </>

                ) : (

                    "WK"

                )}

            </div>


            {/* =================================================
               MENU
            ================================================= */}

            <nav className="seller-menu">


                {/* =================================================
                   DASHBOARD
                ================================================= */}

                <Link
                    to={
                        `/seller/${seller_id}/dashboard`
                    }
                    className={
                        isActive(
                            `/seller/${seller_id}/dashboard`
                        )
                    }
                >

                    <LayoutDashboard
                        size={21}
                        strokeWidth={2}
                    />

                    {openMenu && (

                        <span>
                            Dashboard
                        </span>

                    )}

                </Link>


                {/* =================================================
                   MENU WARTEG
                ================================================= */}

                <Link
                    to={
                        `/seller/${seller_id}/menus`
                    }
                    className={
                        isActive(
                            `/seller/${seller_id}/menus`
                        )
                    }
                >

                    <Utensils
                        size={21}
                        strokeWidth={2}
                    />

                    {openMenu && (

                        <span>
                            Menu Warteg
                        </span>

                    )}

                </Link>


                {/* =================================================
                   PESANAN
                ================================================= */}

                <Link
                    to={
                        `/seller/${seller_id}/orders`
                    }
                    className={
                        isActive(
                            `/seller/${seller_id}/orders`
                        )
                    }
                >

                    <ShoppingBag
                        size={21}
                        strokeWidth={2}
                    />

                    {openMenu && (

                        <span>
                            Pesanan
                        </span>

                    )}

                </Link>


                {/* =================================================
                   PROFILE USAHA
                ================================================= */}

                <Link
                    to={
                        `/seller/${seller_id}/profile`
                    }
                    className={
                        isActive(
                            `/seller/${seller_id}/profile`
                        )
                    }
                >

                    <UserRound
                        size={21}
                        strokeWidth={2}
                    />

                    {openMenu && (

                        <span>
                            Profile Usaha
                        </span>

                    )}

                </Link>

            </nav>

        </aside>

    );

}