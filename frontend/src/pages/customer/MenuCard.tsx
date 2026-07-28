import {
    Plus,
    Minus,
    ShoppingCart,
} from "lucide-react";

import { Menu } from "../../types";


interface MenuCardProps {
    menu: Menu;
    quantity: number;
    onAdd: () => void;
    onIncrease: () => void;
    onDecrease: () => void;
}


export default function MenuCard({
    menu,
    quantity,
    onAdd,
    onIncrease,
    onDecrease,
}: MenuCardProps) {

    return (
        <div className="menu-card">

            <img
                src={menu.image}
                alt={menu.name}
                className="menu-image"
            />


            <div className="menu-content">

                <h3>
                    {menu.name}
                </h3>


                <p>
                    {menu.description}
                </p>


                <strong>
                    Rp {menu.price.toLocaleString("id-ID")}
                </strong>


                <div className="quantity-control">

                    <button
                        type="button"
                        onClick={onDecrease}
                        disabled={quantity === 0}
                    >
                        <Minus size={16} />
                    </button>


                    <span>
                        {quantity}
                    </span>


                    <button
                        type="button"
                        onClick={onIncrease}
                    >
                        <Plus size={16} />
                    </button>

                </div>



                <button
                    type="button"
                    className="add-cart-button"
                    onClick={onAdd}
                    disabled={quantity === 0}
                >

                    <ShoppingCart size={18} />

                    Tambah ke Keranjang

                </button>


            </div>

        </div>
    );
}