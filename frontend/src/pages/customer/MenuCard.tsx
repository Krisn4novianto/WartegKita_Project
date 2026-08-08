import {
    Clock3,
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

    storeIsOpen: boolean;

    onIncrease: () => void;

    onDecrease: () => void;

    onAdd?: () => void;

}


export default function MenuCard({
    menu,
    quantity,
    storeIsOpen,
    onIncrease,
    onDecrease,
    onAdd,
}: MenuCardProps) {


    const formatPrice = (
        price: number,
    ) =>
        new Intl.NumberFormat(
            "id-ID",
            {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
            },
        ).format(price);


    const storeClosed =
        !storeIsOpen;


    const menuUnavailable =
        !menu.available ||
        menu.stock <= 0;


    const unavailable =
        storeClosed ||
        menuUnavailable;


    const showStockWarning =
        !storeClosed &&
        !menuUnavailable &&
        menu.stock > 0 &&
        menu.stock <= 5;


    const showAddButton =
        !storeClosed &&
        !menuUnavailable &&
        quantity > 0 &&
        Boolean(onAdd);



    return (

        <article
            className={
                `menu-card ${unavailable
                    ? "menu-card-unavailable"
                    : ""
                }`
            }
        >

            {/* IMAGE */}

            <div className="menu-card-image">

                {
                    menu.image ? (

                        <img
                            src={menu.image}
                            alt={menu.name}
                            loading="lazy"
                        />

                    ) : (

                        <div className="menu-card-image-placeholder">

                            <span>
                                🍛
                            </span>

                        </div>

                    )
                }

                {
                    storeClosed && (

                        <div className="menu-closed-overlay">

                            <Clock3
                                size={18}
                                strokeWidth={2.5}
                            />

                            <span>
                                Warteg sedang tutup
                            </span>

                        </div>

                    )
                }


                {
                    !storeClosed && menuUnavailable && (

                        <div className="menu-unavailable-badge">

                            Habis

                        </div>

                    )
                }


            </div>



            {/* CONTENT */}

            <div className="menu-card-content">


                {
                    menu.category && (

                        <span className="menu-card-category">
                            {menu.category}
                        </span>

                    )
                }



                <h3 className="menu-card-name">
                    {menu.name}
                </h3>



                {
                    menu.description && (

                        <p className="menu-card-description">
                            {menu.description}
                        </p>

                    )
                }



                {/* PRICE + QUANTITY */}

                <div className="menu-card-bottom">


                    <div className="menu-card-price">

                        {formatPrice(
                            menu.price,
                        )}

                    </div>



                    {
                        storeClosed ? (

                            <span className="menu-stock-empty">

                                <Clock3
                                    size={14}
                                />

                                Tutup sementara

                            </span>


                        ) : menuUnavailable ? (

                            <span className="menu-stock-empty">
                                Tidak tersedia
                            </span>


                        ) : (

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
                                    className="quantity-button"
                                    onClick={onDecrease}
                                    disabled={
                                        quantity <= 0
                                    }
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
                                    className="quantity-button"
                                    onClick={onIncrease}
                                    disabled={
                                        quantity >= menu.stock
                                    }
                                >

                                    <Plus
                                        size={16}
                                        strokeWidth={2.5}
                                    />

                                </button>


                            </div>

                        )
                    }

                </div>



                {
                    showStockWarning && (

                        <span className="menu-stock-warning">

                            Tinggal {menu.stock} porsi

                        </span>

                    )
                }




                {
                    showAddButton && (

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

                    )
                }


            </div>


        </article>

    );
}