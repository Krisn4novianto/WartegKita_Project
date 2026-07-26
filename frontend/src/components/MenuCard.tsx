import { Menu } from "../types";
import { useCartStore } from "../store/cartStore";

export default function MenuCard({ menu }: { menu: Menu }) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="card menu-card">
      <div>
        <h3>{menu.name}</h3>
        <p>{menu.description}</p>
        <strong>Rp{menu.price.toLocaleString("id-ID")}</strong>
      </div>
      <button className="button" onClick={() => addItem(menu)}>+</button>
    </div>
  );
}
