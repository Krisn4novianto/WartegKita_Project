import { Menu } from "../types";
import { useCartStore } from "../store/cartStore";

export default function MenuCard({
  menu,
  onAddToCart,
}: {
  menu: Menu;
  onAddToCart?: () => void;
}) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="card menu-card">
      <div>
        <h3>{menu.name}</h3>
        <p>{menu.description}</p>
        <strong>Rp{menu.price.toLocaleString("id-ID")}</strong>
      </div>
      <button
        className="button"
        onClick={() => {
          if (onAddToCart) {
            onAddToCart();
          } else {
            addItem(menu);
          }
        }}
      >
        +
      </button>
    </div>
  );
}
