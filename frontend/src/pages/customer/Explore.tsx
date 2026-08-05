import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
import {
  Seller,
  Menu,
} from "../../types";

import StoreCard from "../../components/StoreCard";

import "../../styles/explore.css";


/* =====================================================
   CONSTANTS
===================================================== */

const categories = [
  {
    label: "Semua",
    value: "all",
    emoji: "🍽️",
  },
  {
    label: "Nasi Rames",
    value: "nasi-rames",
    emoji: "🍛",
  },
  {
    label: "Ayam",
    value: "ayam",
    emoji: "🍗",
  },
  {
    label: "Ikan",
    value: "ikan",
    emoji: "🐟",
  },
  {
    label: "Sayur",
    value: "sayur",
    emoji: "🥬",
  },
  {
    label: "Minuman",
    value: "minuman",
    emoji: "🥤",
  },
];

const locations = [
  "Semua Lokasi",
  "Jakarta Selatan",
  "Jakarta Pusat",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Utara",
];


const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .trim();


const sellerMatchesLocation = (
  seller: any,
  location: string
) => {

  if (
    !location ||
    location === "Semua Lokasi"
  ) {
    return true;
  }

  const sellerLocation = [
    seller.address,
    seller.location,
    seller.city,
    seller.province,
    seller.district,
    seller.kecamatan,
    seller.kelurahan,
    seller.region,
  ]
    .filter(Boolean)
    .map(normalize)
    .join(" ");

  return sellerLocation.includes(
    normalize(location)
  );

};


export default function Explore() {

  const [sellers, setSellers] =
    useState<Seller[]>([]);

  const [menus, setMenus] =
    useState<Menu[]>([]);

  const [search, setSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [selectedLocation, setSelectedLocation] =
    useState("Semua Lokasi");

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

  const [loading, setLoading] =
    useState(true);


  /* =====================================================
     LOAD SELLERS + MENUS
  ===================================================== */

  useEffect(() => {

    let mounted = true;

    const loadData = async () => {

      setLoading(true);

      try {

        const [
          sellerResponse,
          menuResponse,
        ] = await Promise.all([
          api.get("/sellers"),
          api.get("/menus"),
        ]);

        if (!mounted) {
          return;
        }

        if (
          Array.isArray(
            sellerResponse.data
          )
        ) {

          setSellers(
            sellerResponse.data.map(
              (item: any) => ({

                ...item,

                store_name:
                  item.store_name ??
                  item.name ??
                  "Warteg",

                description:
                  item.description ??
                  "",

                address:
                  item.address ??
                  "",

                rating:
                  Number(
                    item.rating ?? 0
                  ),

                is_open:
                  item.is_open ??
                  true,

                distance_km:
                  Number(
                    item.distance_km ?? 0
                  ),

              })
            )
          );

        }

        if (
          Array.isArray(
            menuResponse.data
          )
        ) {

          setMenus(
            menuResponse.data
          );

        }

      } catch (error) {

        console.error(
          "Gagal mengambil data Explore:",
          error
        );

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };

    loadData();

    return () => {
      mounted = false;
    };

  }, []);


  /* =====================================================
     SELLER MENUS
  ===================================================== */

  const getSellerMenus = (
    sellerId: string | number
  ) => {

    return menus.filter(
      (menu: any) =>
        String(menu.seller_id) ===
        String(sellerId)
    );

  };


  /* =====================================================
     FILTER
  ===================================================== */

  const filteredSellers =
    useMemo(() => {

      let result =
        [...sellers];

      const keyword =
        normalize(search);


      /* LOCATION */

      result =
        result.filter(
          (seller: any) =>
            sellerMatchesLocation(
              seller,
              selectedLocation
            )
        );


      /* SEARCH */

      if (keyword) {

        result =
          result.filter(
            (seller: any) => {

              const sellerMenus =
                getSellerMenus(
                  seller.id
                );

              const sellerText = [
                seller.store_name,
                seller.name,
                seller.owner,
                seller.description,
                seller.address,
                seller.city,
                seller.district,
                seller.kecamatan,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

              const menuText =
                sellerMenus
                  .map((menu: any) =>
                    [
                      menu.name,
                      menu.description,
                      menu.category,
                      menu.category_name,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  )
                  .join(" ")
                  .toLowerCase();

              return (
                sellerText.includes(keyword) ||
                menuText.includes(keyword)
              );

            }
          );

      }


      /* CATEGORY */

      if (
        selectedCategory !== "all"
      ) {

        result =
          result.filter(
            (seller: any) => {

              const sellerMenus =
                getSellerMenus(
                  seller.id
                );

              return sellerMenus.some(
                (menu: any) => {

                  const category =
                    normalize(
                      menu.category ??
                      menu.category_name
                    );

                  const selected =
                    normalize(
                      selectedCategory
                    );

                  return (
                    category === selected ||
                    category.includes(selected) ||
                    selected.includes(category)
                  );

                }
              );

            }
          );

      }


      /* OPEN */

      if (onlyOpen) {

        result =
          result.filter(
            (seller: any) =>
              Boolean(
                seller.is_open
              )
          );

      }


      /* DISTANCE */

      result =
        result.filter(
          (seller: any) =>
            Number(
              seller.distance_km ?? 0
            ) <= maxDistance
        );


      /* RATING */

      result =
        result.filter(
          (seller: any) =>
            Number(
              seller.rating ?? 0
            ) >= minimumRating
        );


      /* SORT */

      if (
        sortBy === "nearest"
      ) {

        result.sort(
          (a: any, b: any) =>
            Number(
              a.distance_km ?? 999
            ) -
            Number(
              b.distance_km ?? 999
            )
        );

      }

      if (
        sortBy === "rating"
      ) {

        result.sort(
          (a: any, b: any) =>
            Number(
              b.rating ?? 0
            ) -
            Number(
              a.rating ?? 0
            )
        );

      }

      return result;

    }, [
      sellers,
      menus,
      search,
      selectedCategory,
      selectedLocation,
      sortBy,
      onlyOpen,
      maxDistance,
      minimumRating,
    ]);


  /* =====================================================
     RESET
  ===================================================== */

  const resetFilter = () => {

    setSearch("");
    setSelectedCategory("all");
    setSelectedLocation("Semua Lokasi");
    setSortBy("recommended");
    setOnlyOpen(false);
    setMaxDistance(5);
    setMinimumRating(0);

  };


  return (

    <div className="explore-page">


      {/* HEADER */}

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


        {/* LOCATION */}

        <div className="location-selector">

          <button
            type="button"
            className="location-selector-button"
            onClick={() =>
              setShowLocation(
                value => !value
              )
            }
          >

            <div className="location-main-icon">
              <MapPin size={22} />
            </div>

            <div className="location-text">

              <span>
                Lokasi pengantaran
              </span>

              <strong>
                {selectedLocation}
              </strong>

            </div>

            <ChevronDown
              size={18}
              className={
                showLocation
                  ? "rotate"
                  : ""
              }
            />

          </button>


          {showLocation && (

            <div className="location-menu">

              {locations.map(
                location => (

                  <button
                    type="button"
                    key={location}
                    className={
                      selectedLocation ===
                        location
                        ? "active"
                        : ""
                    }
                    onClick={() => {

                      setSelectedLocation(
                        location
                      );

                      setShowLocation(
                        false
                      );

                    }}
                  >

                    <MapPin size={16} />

                    {location}

                  </button>

                )
              )}

            </div>

          )}

        </div>

      </section>


      {/* SEARCH */}

      <section className="explore-search-wrapper">

        <div className="explore-search-box">

          <Search size={22} />

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari warteg, menu, ayam, nasi rames..."
          />

          {search && (

            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearch("")
              }
            >
              <X size={18} />
            </button>

          )}

        </div>


        <button
          type="button"
          className={
            showFilter
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() =>
            setShowFilter(
              value => !value
            )
          }
        >

          <SlidersHorizontal size={18} />

          Filter

        </button>

      </section>


      {/* FILTER */}

      {showFilter && (

        <section className="explore-filter-panel">

          <div className="filter-control">

            <label>
              <ArrowDownUp size={16} />
              Urutkan
            </label>

            <select
              value={sortBy}
              onChange={event =>
                setSortBy(
                  event.target.value
                )
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
              onChange={event =>
                setMaxDistance(
                  Number(
                    event.target.value
                  )
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

              <option value={999}>
                Semua jarak
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
              onChange={event =>
                setMinimumRating(
                  Number(
                    event.target.value
                  )
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
              onChange={event =>
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
            type="button"
            className="reset-filter-button"
            onClick={resetFilter}
          >
            Reset filter
          </button>

        </section>

      )}


      {/* CATEGORY */}

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

          {categories.map(
            category => (

              <button
                type="button"
                key={category.value}
                className={
                  selectedCategory ===
                    category.value
                    ? "explore-category-card active"
                    : "explore-category-card"
                }
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

            )
          )}

        </div>

      </section>


      {/* BENEFITS */}

      <section className="explore-benefit-grid">

        <div className="explore-benefit-card">
          <MapPin size={22} />
          <div>
            <strong>
              Dekat denganmu
            </strong>
            <span>
              Temukan warteg berdasarkan lokasi.
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


      {/* RESULTS */}

      <section className="explore-results-section">

        <div className="explore-result-header">

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

        </div>


        {loading ? (

          <div className="grid explore-grid">

            {[1, 2, 3, 4].map(
              item => (

                <div
                  className="explore-skeleton"
                  key={item}
                />

              )
            )}

          </div>

        ) : filteredSellers.length > 0 ? (

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
              Coba ubah lokasi, kategori,
              pencarian, atau filter.
            </p>

            <button
              type="button"
              className="button"
              onClick={resetFilter}
            >
              Reset Filter
            </button>

          </div>

        )}

      </section>

    </div>

  );

}