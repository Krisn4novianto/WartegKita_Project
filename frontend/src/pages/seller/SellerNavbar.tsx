import {
    Menu,
    X,
    LayoutDashboard,
    ShoppingBag,
    Utensils,
    LogOut,
    UserRound,
} from "lucide-react";

import {
    Link,
    useParams,
    useLocation,
} from "react-router-dom";

import "../../styles/seller/SellerNavbar.css";

interface SellerNavbarProps {
    openMenu: boolean;
    setOpenMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SellerNavbar({
    openMenu,
    setOpenMenu,
}: SellerNavbarProps) {
    const { seller_id } = useParams();

    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path
            ? "seller-link active"
            : "seller-link";
    };

    return (
        <aside
            className={`seller-navbar ${openMenu ? "open" : "close"
                }`}
        >
            <button
                className="seller-toggle"
                onClick={() => setOpenMenu(!openMenu)}
            >
                {openMenu ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="seller-logo">
                {openMenu ? (
                    <>
                        <span>Warteg</span>
                        <b>Kita</b>
                    </>
                ) : (
                    "WK"
                )}
            </div>

            <nav className="seller-menu">

                {/* Dashboard */}
                <Link
                    to={`/seller/${seller_id}/dashboard`}
                    className={isActive(
                        `/seller/${seller_id}/dashboard`
                    )}
                >
                    <LayoutDashboard size={21} />
                    {openMenu && <span>Dashboard</span>}
                </Link>


                {/* Menu Warteg */}
                <Link
                    to={`/seller/${seller_id}/menus`}
                    className={isActive(
                        `/seller/${seller_id}/menus`
                    )}
                >
                    <Utensils size={21} />
                    {openMenu && <span>Menu Warteg</span>}
                </Link>


                {/* Pesanan */}
                <Link
                    to={`/seller/${seller_id}/orders`}
                    className={isActive(
                        `/seller/${seller_id}/orders`
                    )}
                >
                    <ShoppingBag size={21} />
                    {openMenu && <span>Pesanan</span>}
                </Link>


                {/* Profile Usaha */}
                <Link
                    to={`/seller/${seller_id}/profile`}
                    className={isActive(
                        `/seller/${seller_id}/profile`
                    )}
                >
                    <UserRound size={21} />
                    {openMenu && <span>Profile Usaha</span>}
                </Link>

            </nav>

            <div className="seller-bottom">
                <button className="logout-button">
                    <LogOut size={21} />
                    {openMenu && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}