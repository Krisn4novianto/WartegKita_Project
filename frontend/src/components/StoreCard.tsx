import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import { Seller } from "../types";

import "../styles/components/StoreCard.css";

const storeImages = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Nasi%20ramas%20ayam%20goreng.JPG?width=1000",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Nasi%20yang%20berisikan%20kentang%20balado%2C%20dan%20kentan%20mustofa%20khas%20warteg.jpg?width=1000",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Capcay%20Warteg.JPG?width=900",
];

interface StoreCardProps {
  seller: Seller;
  imageIndex?: number;
}

export default function StoreCard({
  seller,
  imageIndex = 0,
}: StoreCardProps) {
  if (!seller.id) return null;

  const image =
    storeImages[imageIndex % storeImages.length];

  return (
    <Link
      to={`/store/${seller.id}`}
      className="store-card"
    >
      <div className="store-image-wrap">
        <img
          className="store-image"
          src={image}
          alt={seller.store_name}
          loading="lazy"
        />

        <span
          className={`store-status ${seller.is_open ? "open" : "closed"
            }`}
        >
          {seller.is_open ? "Buka" : "Tutup"}
        </span>
      </div>

      <div className="store-card-content">

        <div className="store-title-row">

          <h3 className="store-name">
            {seller.store_name}
          </h3>

          <div className="rating">
            <Star
              size={15}
              fill="currentColor"
            />
            <span>{seller.rating ?? 0}</span>
          </div>

        </div>

        <p className="store-description">
          {seller.description}
        </p>

        <div className="store-meta">

          <div className="distance">
            <MapPin size={15} />
            {seller.distance_km ?? 0} km
          </div>

          <div className="store-address">
            {seller.address}
          </div>

        </div>

      </div>
    </Link>
  );
}