import {
    Minus,
    Plus,
    ShoppingCart,
} from "lucide-react";

import {
    Menu,
} from "../../types";

interface MenuCardProps {

    menu: Menu;

    quantity: number;

    onIncrease: () => void;

    onDecrease: () => void;

    onAdd?: () => void;

}

export default function MenuCard({
    menu,
    quantity,
    onIncrease,
    onDecrease,
    onAdd,
}: MenuCardProps) {

    const formatPrice =
        (price: number) =>
            new Intl.NumberFormat(
                "id-ID",
                {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                }
            ).format(price);


    const unavailable =
        !menu.available ||
        menu.stock <= 0;


    return (

        <article
            className={
                `menu-card ${unavailable
                    ? "menu-card-unavailable"
                    : ""
                }`
            }
        >

            {/* =================================================
                IMAGE
            ================================================= */}

            <div className="menu-card-image">

                {menu.image ? (

                    <img
                        src={menu.image}
                        alt={menu.name}
                        loading="lazy"
                    />

                ) : (

                    <div className="menu-card-image-placeholder">
                        <span>🍛</span>
                    </div>

                )}


                {unavailable && (

                    <div className="menu-unavailable-badge">
                        Habis
                    </div>

                )}

            </div>


            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="menu-card-content">

                {/* CATEGORY */}

                {menu.category && (

                    <span className="menu-card-category">
                        {menu.category}
                    </span>

                )}


                {/* NAME */}

                <h3 className="menu-card-name">
                    {menu.name}
                </h3>


                {/* DESCRIPTION */}

                {menu.description && (

                    <p className="menu-card-description">
                        {menu.description}
                    </p>

                )}


                {/* =================================================
                    PRICE + QUANTITY
                ================================================= */}

                <div className="menu-card-bottom">

                    <div className="menu-card-price">
                        {formatPrice(menu.price)}
                    </div>


                    {!unavailable ? (

                        <div
                            className={
                                `menu-quantity ${quantity > 0
                                    ? "has-quantity"
                                    : ""
                                }`
                            }
                        >

                            <button
                                type="button"
                                className="quantity-button quantity-minus"
                                onClick={onDecrease}
                                disabled={quantity <= 0}
                                aria-label={`Kurangi ${menu.name}`}
                            >

                                <Minus
                                    size={16}
                                    strokeWidth={2.5}
                                />

                            </button>


                            <span className="quantity-value">
                                {quantity}
                            </span>


                            <button
                                type="button"
                                className="quantity-button quantity-plus"
                                onClick={onIncrease}
                                disabled={
                                    quantity >= menu.stock
                                }
                                aria-label={`Tambah ${menu.name}`}
                            >

                                <Plus
                                    size={16}
                                    strokeWidth={2.5}
                                />

                            </button>

                        </div>

                    ) : (

                        <span className="menu-stock-empty">
                            Tidak tersedia
                        </span>

                    )}

                </div>


                {/* =================================================
                    STOCK WARNING
                ================================================= */}

                {!unavailable &&
                    menu.stock > 0 &&
                    menu.stock <= 5 && (

                        <span className="menu-stock-warning">
                            Tinggal {menu.stock} porsi
                        </span>

                    )}


                {/* =================================================
                    ADD TO CART
                ================================================= */}

                {!unavailable && quantity > 0 && onAdd && (

                    <button
                        type="button"
                        className="menu-add-cart-button"
                        onClick={onAdd}
                    >

                        <ShoppingCart
                            size={17}
                            strokeWidth={2.5}
                        />

                        <span>
                            Tambah ke Keranjang
                        </span>

                    </button>

                )}

            </div>

        </article>

    );

}