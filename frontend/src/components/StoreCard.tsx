import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Seller } from "../types";

const storeImages = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Nasi%20ramas%20ayam%20goreng.JPG?width=1000",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Nasi%20yang%20berisikan%20kentang%20balado%2C%20dan%20kentan%20mustofa%20khas%20warteg.jpg?width=1000",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Capcay%20Warteg.JPG?width=900",
];

export default function StoreCard({ seller, imageIndex = 0 }: { seller: Seller; imageIndex?: number }) {
  return (
    <Link to={`/store/${seller.id}`} className="card store-card">
      <div className="store-image-wrap">
        <img src={storeImages[imageIndex % storeImages.length]} alt={`Menu dari ${seller.store_name}`} />
        <span className={`store-status ${seller.is_open ? "open" : "closed"}`}>
          {seller.is_open ? "Buka" : "Tutup"}
        </span>
      </div>
      <div className="store-card-content">
        <div className="store-title-row">
          <h3>{seller.store_name}</h3>
          <span className="rating"><Star size={14} fill="currentColor" /> {seller.rating ?? 4.8}</span>
        </div>
        <p>{seller.description}</p>
        <div className="meta">
          <span><MapPin size={14} /> {seller.distance_km ?? 0.3} km</span>
          <span>{seller.address}</span>
        </div>
      </div>
    </Link>
  );
}
