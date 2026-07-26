import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Star,
  Clock3,
  Bike,
  ChevronDown,
  X,
  Navigation,
  ShieldCheck,
  Zap,
  ArrowDownUp,
} from "lucide-react";

import api from "../../services/api";
import { Seller } from "../../types";
import StoreCard from "../../components/StoreCard";
import "../../styles/explore.css";

const fallbackSellers: Seller[] = [
  {
    id: 1,
    store_name: "Warteg Bahari Jaya",
    description:
      "Masakan rumahan hangat, lauk lengkap, dan sambal setiap hari.",
    address: "Jl. Kemang Raya No. 12",
    is_open: true,
    rating: 4.8,
    distance_km: 0.3,
  },
  {
    id: 2,
    store_name: "Warteg Bu Sari",
    description:
      "Pilihan nasi rames, ayam goreng, telur balado, dan sayur harian.",
    address: "Jl. Bangka VIII",
    is_open: true,
    rating: 4.7,
    distance_km: 0.8,
  },
  {
    id: 3,
    store_name: "Warteg Maju Jaya",
    description:
      "Menu ekonomis untuk makan siang cepat tanpa perlu antre.",
    address: "Jl. Tendean No. 21",
    is_open: true,
    rating: 4.6,
    distance_km: 1.2,
  },
  {
    id: 4,
    store_name: "Warteg Rasa Nusantara",
    description:
      "Aneka menu rumahan dengan pilihan lauk lengkap setiap hari.",
    address: "Jl. Mampang Prapatan",
    is_open: false,
    rating: 4.5,
    distance_km: 1.8,
  },
];

const categories = [
  { label: "Semua", value: "all", emoji: "🍽️" },
  { label: "Nasi Rames", value: "nasi-rames", emoji: "🍛" },
  { label: "Ayam", value: "ayam", emoji: "🍗" },
  { label: "Ikan", value: "ikan", emoji: "🐟" },
  { label: "Sayur", value: "sayur", emoji: "🥬" },
  { label: "Minuman", value: "minuman", emoji: "🥤" },
];

const locations = [
  "Jakarta Selatan",
  "Jakarta Pusat",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Utara",
];

export default function Explore() {
  const [sellers, setSellers] =
    useState<Seller[]>(fallbackSellers);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [selectedLocation, setSelectedLocation] =
    useState("Jakarta Selatan");

  const [sortBy, setSortBy] =
    useState("recommended");

  const [onlyOpen, setOnlyOpen] =
    useState(false);

  const [maxDistance, setMaxDistance] =
    useState(5);

  const [minimumRating, setMinimumRating] =
    useState(0);

  const [showFilter, setShowFilter] =
    useState(false);

  const [showLocation, setShowLocation] =
    useState(false);

  useEffect(() => {
    api.get("/sellers")
      .then((response) => {
        console.log(response.data);

        if (
          Array.isArray(response.data) &&
          response.data.length >= 5
        ) {
          setSellers(response.data);
        }
      })
      .catch(() => { });
  }, []);

  const filteredSellers = useMemo(() => {
    let result = [...sellers];

    const keyword = search.toLowerCase().trim();

    if (keyword) {
      result = result.filter((seller) =>
        [
          seller.store_name,
          seller.description,
          seller.address,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword)
      );
    }

    if (onlyOpen) {
      result = result.filter(
        (seller) => seller.is_open
      );
    }

    result = result.filter(
      (seller) =>
        (seller.distance_km ?? 0) <= maxDistance
    );

    result = result.filter(
      (seller) =>
        (seller.rating ?? 0) >= minimumRating
    );

    if (sortBy === "nearest") {
      result.sort(
        (a, b) =>
          (a.distance_km ?? 0) -
          (b.distance_km ?? 0)
      );
    }

    if (sortBy === "rating") {
      result.sort(
        (a, b) =>
          (b.rating ?? 0) -
          (a.rating ?? 0)
      );
    }

    return result;
  }, [
    sellers,
    search,
    sortBy,
    onlyOpen,
    maxDistance,
    minimumRating,
  ]);

  const resetFilter = () => {
    setSearch("");
    setSelectedCategory("all");
    setSortBy("recommended");
    setOnlyOpen(false);
    setMaxDistance(5);
    setMinimumRating(0);
  };

  return (
    <div className="explore-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className="explore-header">

        <div className="explore-header-content">

          <span className="eyebrow">
            TEMUKAN MAKANAN FAVORITMU
          </span>

          <h1>
            Cari warteg,
            <br />
            pesan makanan,
            <br />
            tanpa ribet.
          </h1>

          <p>
            Temukan warteg terdekat, lihat menu,
            pilih makanan favoritmu, dan pesan
            langsung dari satu aplikasi.
          </p>

          <div className="explore-trust">

            <span>
              <ShieldCheck size={17} />
              Penjual terpercaya
            </span>

            <span>
              <Zap size={17} />
              Pesan lebih cepat
            </span>

            <span>
              <Bike size={17} />
              Bisa diantar
            </span>

          </div>

        </div>


        {/* LOCATION SELECTOR */}

        <div className="location-selector">

          <button
            className="location-selector-button"
            onClick={() =>
              setShowLocation(!showLocation)
            }
          >

            <div className="location-main-icon">
              <MapPin size={22} />
            </div>

            <div className="location-text">

              <span>Lokasi pengantaran</span>

              <strong>
                {selectedLocation}
              </strong>

            </div>

            <ChevronDown size={18} />

          </button>


          {showLocation && (

            <div className="location-menu">

              {locations.map((location) => (

                <button
                  key={location}
                  onClick={() => {
                    setSelectedLocation(location);
                    setShowLocation(false);
                  }}
                >

                  <MapPin size={16} />

                  {location}

                </button>

              ))}

            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      <section className="explore-search-wrapper">

        <div className="explore-search-box">

          <Search size={22} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Cari warteg, menu, ayam, nasi rames..."
          />

          {search && (

            <button
              className="clear-search"
              onClick={() => setSearch("")}
            >
              <X size={18} />
            </button>

          )}

        </div>

        <button
          className={`filter-button ${showFilter ? "active" : ""
            }`}
          onClick={() =>
            setShowFilter(!showFilter)
          }
        >

          <SlidersHorizontal size={18} />

          Filter

        </button>

      </section>


      {/* =====================================================
          FILTER PANEL
      ===================================================== */}

      {showFilter && (

        <section className="explore-filter-panel">

          <div className="filter-control">

            <label>
              <ArrowDownUp size={16} />
              Urutkan
            </label>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
            >

              <option value="recommended">
                Rekomendasi
              </option>

              <option value="nearest">
                Paling dekat
              </option>

              <option value="rating">
                Rating tertinggi
              </option>

            </select>

          </div>


          <div className="filter-control">

            <label>
              <Navigation size={16} />
              Jarak maksimal
            </label>

            <select
              value={maxDistance}
              onChange={(event) =>
                setMaxDistance(
                  Number(event.target.value)
                )
              }
            >

              <option value={1}>
                1 km
              </option>

              <option value={3}>
                3 km
              </option>

              <option value={5}>
                5 km
              </option>

              <option value={10}>
                10 km
              </option>

            </select>

          </div>


          <div className="filter-control">

            <label>
              <Star size={16} />
              Rating minimal
            </label>

            <select
              value={minimumRating}
              onChange={(event) =>
                setMinimumRating(
                  Number(event.target.value)
                )
              }
            >

              <option value={0}>
                Semua rating
              </option>

              <option value={4}>
                4.0+
              </option>

              <option value={4.5}>
                4.5+
              </option>

            </select>

          </div>


          <label className="open-only-filter">

            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(event) =>
                setOnlyOpen(
                  event.target.checked
                )
              }
            />

            <span>
              Hanya tampilkan warteg yang sedang buka
            </span>

          </label>


          <button
            className="reset-filter-button"
            onClick={resetFilter}
          >
            Reset filter
          </button>

        </section>

      )}


      {/* =====================================================
          CATEGORY
      ===================================================== */}

      <section className="explore-category-section">

        <div className="section-header">

          <div>

            <span className="eyebrow">
              PILIH SESUAI SELERA
            </span>

            <h2>
              Mau makan apa hari ini?
            </h2>

          </div>

        </div>


        <div className="explore-category-list">

          {categories.map((category) => (

            <button
              key={category.value}
              className={`explore-category-card ${selectedCategory === category.value
                ? "active"
                : ""
                }`}
              onClick={() =>
                setSelectedCategory(
                  category.value
                )
              }
            >

              <span className="explore-category-emoji">
                {category.emoji}
              </span>

              <strong>
                {category.label}
              </strong>

            </button>

          ))}

        </div>

      </section>


      {/* =====================================================
          BENEFITS
      ===================================================== */}

      <section className="explore-benefit-grid">

        <div className="explore-benefit-card">

          <MapPin size={22} />

          <div>

            <strong>
              Dekat denganmu
            </strong>

            <span>
              Temukan warteg berdasarkan jarak.
            </span>

          </div>

        </div>


        <div className="explore-benefit-card">

          <Bike size={22} />

          <div>

            <strong>
              Antar ke lokasi
            </strong>

            <span>
              Pesan makanan tanpa perlu keluar.
            </span>

          </div>

        </div>


        <div className="explore-benefit-card">

          <Clock3 size={22} />

          <div>

            <strong>
              Hemat waktu
            </strong>

            <span>
              Pesan dulu, makan kemudian.
            </span>

          </div>

        </div>

      </section>


      {/* =====================================================
          RESULT HEADER
      ===================================================== */}

      <section className="explore-result-header">

        <div>

          <span className="eyebrow">
            WARTEG DI SEKITARMU
          </span>

          <h2>
            {filteredSellers.length} warteg ditemukan
          </h2>

        </div>

        <div className="result-location">

          <MapPin size={16} />

          {selectedLocation}

        </div>

      </section>


      {/* =====================================================
          STORE LIST
      ===================================================== */}

      {filteredSellers.length > 0 ? (

        <div className="grid explore-grid">

          {filteredSellers.map(
            (seller, index) => (

              <StoreCard
                key={seller.id}
                seller={seller}
                imageIndex={index}
              />

            )
          )}

        </div>

      ) : (

        <div className="empty-state card">

          <h3>
            Tidak ada warteg yang sesuai
          </h3>

          <p>
            Coba ubah kata pencarian atau filter.
          </p>

          <button
            className="button"
            onClick={resetFilter}
          >
            Reset pencarian
          </button>

        </div>

      )}

    </div>
  );
}