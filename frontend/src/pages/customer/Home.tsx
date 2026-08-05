import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Search,
  MapPin,
  Clock3,
  Star,
  ArrowRight,
  Bike,
  ShieldCheck,
  UtensilsCrossed,
  X,
  ChevronDown,
  Sparkles,
  Send,
  Bot,
  UserRound,
  Heart,
  Zap,
  Wallet,
  Flame,
  Leaf,
  Coffee,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";

import {
  Seller,
  Menu,
} from "../../types";

import StoreCard from "../../components/StoreCard";

import "../../styles/home.css";


/* =====================================================
   WARTEGKITA HOME
===================================================== */

const locations = [
  "Semua Lokasi",
  "Jakarta Selatan",
  "Jakarta Pusat",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Utara",
];

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


/* =====================================================
   AI QUICK PROMPTS
===================================================== */

const aiQuickPrompts = [
  {
    label: "Makan siang hemat",
    value:
      "Aku mau makan siang yang enak dan hemat di bawah 20 ribu.",
    icon: Wallet,
  },
  {
    label: "Tidak terlalu pedas",
    value:
      "Aku mau makanan yang tidak terlalu pedas dan cocok untuk makan siang.",
    icon: Leaf,
  },
  {
    label: "Menu ayam",
    value:
      "Aku ingin makan menu ayam yang enak dan mengenyangkan.",
    icon: UtensilsCrossed,
  },
  {
    label: "Yang cepat disiapkan",
    value:
      "Aku sedang buru-buru. Rekomendasikan makanan yang praktis dan cepat.",
    icon: Zap,
  },
];


/* =====================================================
   NORMALIZE TEXT
===================================================== */

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .trim();


/* =====================================================
   LOCATION MATCH
===================================================== */

const sellerMatchesLocation = (
  seller: any,
  selectedLocation: string
) => {

  if (
    !selectedLocation ||
    selectedLocation === "Semua Lokasi"
  ) {
    return true;
  }

  const location = normalize(selectedLocation);

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

  return sellerLocation.includes(location);
};


/* =====================================================
   AI TYPES
===================================================== */

type AIMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type AIRecommendation = {
  menu: any;
  seller: any;
  score: number;
  reason: string;
};


/* =====================================================
   AI INTENT DETECTION
===================================================== */

const detectAIIntent = (text: string) => {

  const value = normalize(text);

  return {
    budget:
      value.includes("hemat") ||
      value.includes("murah") ||
      value.includes("budget") ||
      value.includes("20 ribu") ||
      value.includes("20000"),

    chicken:
      value.includes("ayam"),

    fish:
      value.includes("ikan") ||
      value.includes("bandeng") ||
      value.includes("lele") ||
      value.includes("nila"),

    vegetable:
      value.includes("sayur") ||
      value.includes("vegetarian") ||
      value.includes("sehat"),

    spicy:
      value.includes("pedas") ||
      value.includes("sambal"),

    notSpicy:
      value.includes("tidak pedas") ||
      value.includes("ga pedas") ||
      value.includes("gak pedas") ||
      value.includes("tidak terlalu pedas"),

    drink:
      value.includes("minum") ||
      value.includes("es teh") ||
      value.includes("kopi"),

    quick:
      value.includes("cepat") ||
      value.includes("buru-buru") ||
      value.includes("praktis") ||
      value.includes("sebentar"),

    lunch:
      value.includes("siang") ||
      value.includes("makan siang"),

    light:
      value.includes("ringan") ||
      value.includes("tidak terlalu berat"),

    nearby:
      value.includes("dekat") ||
      value.includes("sekitar kantor") ||
      value.includes("sekitar sini"),
  };
};


/* =====================================================
   AI MENU RECOMMENDATION
===================================================== */

const getAIRecommendations = (
  text: string,
  sellers: Seller[],
  menus: Menu[],
  selectedLocation: string
): AIRecommendation[] => {

  const intent = detectAIIntent(text);

  const candidates: AIRecommendation[] = [];

  menus.forEach((menu: any) => {

    const seller = sellers.find(
      (item: any) =>
        String(item.id) ===
        String(menu.seller_id)
    );

    if (!seller) {
      return;
    }

    if (
      !sellerMatchesLocation(
        seller,
        selectedLocation
      )
    ) {
      return;
    }

    const menuName =
      normalize(menu.name);

    const menuDescription =
      normalize(menu.description);

    const category =
      normalize(
        menu.category ??
        menu.category_name
      );

    const searchable =
      [
        menuName,
        menuDescription,
        category,
      ]
        .filter(Boolean)
        .join(" ");

    let score = 0;
    const reasons: string[] = [];

    /* -----------------------------------------------
       CATEGORY MATCH
    ----------------------------------------------- */

    if (
      intent.chicken &&
      (
        searchable.includes("ayam") ||
        category.includes("ayam")
      )
    ) {
      score += 8;
      reasons.push("sesuai pilihan ayam");
    }

    if (
      intent.fish &&
      (
        searchable.includes("ikan") ||
        searchable.includes("lele") ||
        searchable.includes("bandeng") ||
        searchable.includes("nila")
      )
    ) {
      score += 8;
      reasons.push("sesuai pilihan ikan");
    }

    if (
      intent.vegetable &&
      (
        searchable.includes("sayur") ||
        searchable.includes("tumis") ||
        searchable.includes("capcay")
      )
    ) {
      score += 7;
      reasons.push("lebih banyak unsur sayur");
    }

    if (
      intent.drink &&
      (
        category.includes("minuman") ||
        searchable.includes("es teh") ||
        searchable.includes("kopi") ||
        searchable.includes("jus")
      )
    ) {
      score += 7;
      reasons.push("sesuai pilihan minuman");
    }

    /* -----------------------------------------------
       SPICY
    ----------------------------------------------- */

    if (intent.notSpicy) {

      if (
        searchable.includes("tidak pedas") ||
        searchable.includes("original") ||
        searchable.includes("gurih")
      ) {
        score += 7;
        reasons.push("cenderung tidak pedas");
      }

      if (
        searchable.includes("pedas") ||
        searchable.includes("sambal")
      ) {
        score -= 5;
      }

    }

    if (intent.spicy) {

      if (
        searchable.includes("pedas") ||
        searchable.includes("sambal") ||
        searchable.includes("balado")
      ) {
        score += 7;
        reasons.push("cocok untuk pencinta pedas");
      }

    }

    /* -----------------------------------------------
       QUICK / LUNCH
    ----------------------------------------------- */

    if (intent.quick) {

      if (
        searchable.includes("nasi") ||
        searchable.includes("ayam") ||
        searchable.includes("telur") ||
        searchable.includes("goreng")
      ) {
        score += 3;
        reasons.push("pilihan praktis untuk makan cepat");
      }

    }

    if (intent.lunch) {

      if (
        searchable.includes("nasi") ||
        searchable.includes("ayam") ||
        searchable.includes("rames")
      ) {
        score += 3;
        reasons.push("cocok untuk makan siang");
      }

    }

    /* -----------------------------------------------
       BUDGET
    ----------------------------------------------- */

    const price = Number(
      menu.price ??
      menu.price_value ??
      0
    );

    if (
      intent.budget &&
      price > 0
    ) {

      if (price <= 20000) {
        score += 9;
        reasons.push("harga ramah di kantong");
      }

      if (price > 30000) {
        score -= 4;
      }

    }

    /* -----------------------------------------------
       RATING
    ----------------------------------------------- */

    const rating =
      Number(
        (seller as any).rating ?? 0
      );

    if (rating >= 4.5) {
      score += 3;
      reasons.push("rating warteg tinggi");
    }

    /* -----------------------------------------------
       OPEN
    ----------------------------------------------- */

    if (
      Boolean(
        (seller as any).is_open
      )
    ) {
      score += 2;
    }

    /* -----------------------------------------------
       NEARBY
    ----------------------------------------------- */

    if (intent.nearby) {

      const distance =
        Number(
          (seller as any).distance_km ?? 999
        );

      if (distance <= 2) {
        score += 5;
        reasons.push("berada dekat denganmu");
      }

    }

    /* -----------------------------------------------
       DEFAULT RECOMMENDATION
    ----------------------------------------------- */

    if (score === 0) {

      if (
        rating >= 4
      ) {
        score += 2;
      }

      if (
        Boolean(
          (seller as any).is_open
        )
      ) {
        score += 1;
      }

    }

    if (score > 0) {

      candidates.push({
        menu,
        seller,
        score,
        reason:
          reasons.length > 0
            ? reasons.slice(0, 2).join(" • ")
            : "direkomendasikan berdasarkan menu dan warteg yang tersedia",
      });

    }

  });

  return candidates
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(0, 4);
};


/* =====================================================
   HOME
===================================================== */

export default function Home() {

  const [sellers, setSellers] =
    useState<Seller[]>([]);

  const [menus, setMenus] =
    useState<Menu[]>([]);

  const [search, setSearch] =
    useState("");

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [location, setLocation] =
    useState("Semua Lokasi");

  const [showLocationMenu, setShowLocationMenu] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [sortMode, setSortMode] =
    useState("recommended");


  /* =====================================================
     AI STATE
  ===================================================== */

  const [showAI, setShowAI] =
    useState(false);

  const [aiInput, setAIInput] =
    useState("");

  const [aiMessages, setAIMessages] =
    useState<AIMessage[]>([
      {
        id: 1,
        role: "assistant",
        text:
          "Halo! 👋 Aku asisten makan WartegKita. Ceritakan kamu lagi ingin makan apa, budget berapa, atau kebutuhan makananmu hari ini. Aku bantu carikan menu yang paling cocok.",
      },
    ]);

  const [aiRecommendations, setAIRecommendations] =
    useState<AIRecommendation[]>([]);

  const [aiLoading, setAILoading] =
    useState(false);


  /* =====================================================
     LOAD SELLERS + MENUS
  ===================================================== */

  useEffect(() => {

    let mounted = true;

    const loadData = async () => {

      setLoading(true);

      try {

        const [sellerResponse, menuResponse] =
          await Promise.all([
            api.get("/sellers"),
            api.get("/menus"),
          ]);

        if (!mounted) {
          return;
        }

        /* -----------------------------
           SELLERS
        ----------------------------- */

        if (
          Array.isArray(
            sellerResponse.data
          )
        ) {

          const formatted =
            sellerResponse.data.map(
              (item: any) => ({

                ...item,

                id: item.id,

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

                owner:
                  item.owner ??
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
            );

          setSellers(formatted);
        }

        /* -----------------------------
           MENUS
        ----------------------------- */

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
          "Gagal memuat Home:",
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
     FILTER SELLERS
  ===================================================== */

  const filteredSellers =
    useMemo(() => {

      const keyword =
        normalize(search);

      let result =
        [...sellers];


      /* LOCATION */

      result =
        result.filter(
          (seller: any) =>
            sellerMatchesLocation(
              seller,
              location
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
        activeCategory !== "all"
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
                      activeCategory
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


      /* SORT */

      if (
        sortMode === "nearest"
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
        sortMode === "rating"
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

      if (
        sortMode === "open"
      ) {

        result.sort(
          (a: any, b: any) =>
            Number(
              Boolean(b.is_open)
            ) -
            Number(
              Boolean(a.is_open)
            )
        );

      }


      return result;

    }, [
      sellers,
      menus,
      search,
      activeCategory,
      location,
      sortMode,
    ]);


  /* =====================================================
     AI SEND
  ===================================================== */

  const handleAISend = (
    customPrompt?: string
  ) => {

    const message =
      (
        customPrompt ??
        aiInput
      ).trim();

    if (!message) {
      return;
    }

    const userMessage: AIMessage = {
      id:
        Date.now(),
      role: "user",
      text: message,
    };

    setAIMessages(
      previous => [
        ...previous,
        userMessage,
      ]
    );

    setAIInput("");
    setAILoading(true);

    /*
     * Simulasi proses AI agar UX terasa natural.
     * Data rekomendasi berasal dari seller + menu
     * yang sudah tersedia di halaman Home.
     */

    window.setTimeout(() => {

      const recommendations =
        getAIRecommendations(
          message,
          sellers,
          menus,
          location
        );

      setAIRecommendations(
        recommendations
      );

      let response = "";

      if (
        recommendations.length > 0
      ) {

        const first =
          recommendations[0];

        response =
          `Aku menemukan ${recommendations.length} pilihan yang menurutku cocok. ` +
          `Pilihan pertama adalah ${first.menu?.name ?? "menu pilihan"} ` +
          `dari ${first.seller?.store_name ?? "warteg"} karena ${first.reason.toLowerCase()}.`;

      } else {

        response =
          "Aku belum menemukan menu yang benar-benar cocok dari data warteg yang tersedia. Coba beri tahu aku budget, jenis makanan, atau preferensi lain seperti ayam, ikan, sayur, pedas, atau tidak pedas.";

      }

      setAIMessages(
        previous => [
          ...previous,
          {
            id:
              Date.now() + 1,
            role:
              "assistant",
            text:
              response,
          },
        ]
      );

      setAILoading(false);

    }, 650);

  };


  /* =====================================================
     AI RESET
  ===================================================== */

  const resetAI = () => {

    setAIInput("");

    setAIRecommendations([]);

    setAIMessages([
      {
        id: 1,
        role: "assistant",
        text:
          "Halo! 👋 Aku asisten makan WartegKita. Ceritakan kamu lagi ingin makan apa, budget berapa, atau kebutuhan makananmu hari ini. Aku bantu carikan menu yang paling cocok.",
      },
    ]);

  };


  /* =====================================================
     FORMAT PRICE
  ===================================================== */

  const formatPrice = (
    value: unknown
  ) => {

    const price =
      Number(value ?? 0);

    if (!price) {
      return "Harga belum tersedia";
    }

    return new Intl.NumberFormat(
      "id-ID",
      {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }
    ).format(price);

  };


  /* =====================================================
     RESET
  ===================================================== */

  const resetFilter = () => {

    setSearch("");
    setActiveCategory("all");
    setLocation("Semua Lokasi");
    setSortMode("recommended");

  };


  const hasFilter =
    Boolean(search.trim()) ||
    activeCategory !== "all" ||
    location !== "Semua Lokasi" ||
    sortMode !== "recommended";


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="home-page">


      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero hero-home">

        <div className="hero-copy">

          <span className="eyebrow">
            MAKAN ENAK, TANPA RIBET
          </span>

          <h1>
            Rasa rumahan,
            <br />
            sampai ke depan pintu.
          </h1>

          <p>
            Cari warteg terdekat, lihat menu lengkap
            beserta harganya, lalu pesan makanan
            favoritmu dengan cepat dan praktis.
          </p>

          <div className="hero-actions">

            <Link
              to="/explore"
              className="button"
            >
              Cari Warteg
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/orders"
              className="button button-secondary"
            >
              Lihat Pesanan
            </Link>

          </div>

          <div className="hero-trust">

            <span>
              <ShieldCheck size={17} />
              Penjual terverifikasi
            </span>

            <span>
              <Bike size={17} />
              Bisa diantar
            </span>

          </div>

        </div>


        <div className="hero-visual">

          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80"
            alt="Makanan rumahan"
          />

          <div className="hero-floating-card">

            <div className="floating-icon">
              <UtensilsCrossed size={20} />
            </div>

            <div>
              <strong>
                Menu rumahan hari ini
              </strong>

              <span>
                Ayam • Sayur • Sambal
              </span>
            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          AI RECOMMENDATION
      ================================================= */}

      <section className="ai-home-section">

        <div className="ai-home-card">

          <div className="ai-home-content">

            <div className="ai-home-badge">
              <Sparkles size={15} />
              WARTEGKITA AI
            </div>

            <h2>
              Bingung mau makan apa hari ini?
            </h2>

            <p>
              Ceritakan selera, budget, atau kebutuhan
              makananmu. AI WartegKita akan membantu
              menemukan menu yang paling sesuai dari
              warteg di sekitarmu.
            </p>

            <div className="ai-home-features">

              <span>
                <Heart size={15} />
                Sesuai preferensi
              </span>

              <span>
                <Wallet size={15} />
                Sesuai budget
              </span>

              <span>
                <MapPin size={15} />
                Warteg sekitar
              </span>

            </div>

            <button
              type="button"
              className="ai-open-button"
              onClick={() =>
                setShowAI(true)
              }
            >
              <Sparkles size={18} />
              Tanya AI Sekarang
              <ArrowRight size={17} />
            </button>

          </div>


          <div className="ai-home-visual">

            <div className="ai-orbit ai-orbit-one">
              🍛
            </div>

            <div className="ai-orbit ai-orbit-two">
              🥗
            </div>

            <div className="ai-orbit ai-orbit-three">
              🍗
            </div>

            <div className="ai-main-avatar">
              <Sparkles size={36} />
            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          SEARCH
      ================================================= */}

      <section className="quick-search card">

        <div className="search-heading">

          <div>

            <span className="eyebrow">
              MAU MAKAN APA HARI INI?
            </span>

            <h2>
              Temukan warteg favoritmu
            </h2>

            <p>
              Cari warteg, menu, atau pilih lokasi.
            </p>

          </div>


          {/* LOCATION */}

          <div className="location-wrapper">

            <button
              type="button"
              className="location-pill"
              onClick={() =>
                setShowLocationMenu(
                  value => !value
                )
              }
            >

              <MapPin size={17} />

              <span>
                {location}
              </span>

              <ChevronDown
                size={16}
                className={
                  showLocationMenu
                    ? "rotate"
                    : ""
                }
              />

            </button>


            {showLocationMenu && (

              <div className="location-dropdown">

                {locations.map(
                  item => (

                    <button
                      type="button"
                      key={item}
                      className={
                        location === item
                          ? "active"
                          : ""
                      }
                      onClick={() => {

                        setLocation(item);

                        setShowLocationMenu(
                          false
                        );

                      }}
                    >

                      <MapPin size={15} />

                      <span>
                        {item}
                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </div>

        </div>


        {/* SEARCH */}

        <div className="search-box">

          <Search size={20} />

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={event => {

              if (
                event.key === "Enter"
              ) {

                document
                  .getElementById(
                    "home-store-results"
                  )
                  ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });

              }

            }}
            placeholder="Cari warteg, ayam, nasi rames, minuman..."
          />

          {search && (

            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setSearch("")
              }
            >
              <X size={18} />
            </button>

          )}

          <button
            type="button"
            className="button"
            onClick={() =>
              document
                .getElementById(
                  "home-store-results"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
            }
          >
            Cari
          </button>

        </div>


        {/* CATEGORY */}

        <div className="category-list">

          {categories.map(
            category => (

              <button
                type="button"
                key={category.value}
                className={
                  activeCategory ===
                    category.value
                    ? "category-chip active"
                    : "category-chip"
                }
                onClick={() =>
                  setActiveCategory(
                    category.value
                  )
                }
              >

                <span className="category-emoji">
                  {category.emoji}
                </span>

                {category.label}

              </button>

            )
          )}

        </div>

      </section>


      {/* =================================================
          QUICK SORT
      ================================================= */}

      <section className="benefit-grid">

        <button
          type="button"
          className={
            sortMode === "nearest"
              ? "benefit-item active"
              : "benefit-item"
          }
          onClick={() =>
            setSortMode(
              sortMode === "nearest"
                ? "recommended"
                : "nearest"
            )
          }
        >

          <div className="benefit-icon">
            <MapPin size={21} />
          </div>

          <div>
            <strong>
              Dekat denganmu
            </strong>

            <span>
              Prioritaskan warteg terdekat.
            </span>
          </div>

        </button>


        <button
          type="button"
          className={
            sortMode === "open"
              ? "benefit-item active"
              : "benefit-item"
          }
          onClick={() =>
            setSortMode(
              sortMode === "open"
                ? "recommended"
                : "open"
            )
          }
        >

          <div className="benefit-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <strong>
              Sedang buka
            </strong>

            <span>
              Prioritaskan warteg yang buka.
            </span>
          </div>

        </button>


        <button
          type="button"
          className={
            sortMode === "rating"
              ? "benefit-item active"
              : "benefit-item"
          }
          onClick={() =>
            setSortMode(
              sortMode === "rating"
                ? "recommended"
                : "rating"
            )
          }
        >

          <div className="benefit-icon">
            <Star size={21} />
          </div>

          <div>
            <strong>
              Rating terbaik
            </strong>

            <span>
              Prioritaskan rating tertinggi.
            </span>
          </div>

        </button>

      </section>


      {/* =================================================
          RESULTS
      ================================================= */}

      <section
        className="section home-store-section"
        id="home-store-results"
      >

        <div className="section-header section-header-with-subtitle">

          <div>

            <span className="eyebrow">
              {hasFilter
                ? "HASIL PENCARIAN"
                : "WARTEG DI SEKITARMU"}
            </span>

            <h2>
              {filteredSellers.length} warteg ditemukan
            </h2>

            <p className="section-subtitle">

              {location !== "Semua Lokasi"
                ? `Menampilkan warteg di ${location}.`
                : "Semua warteg yang tersedia."}

            </p>

          </div>


          <div className="home-result-actions">

            {hasFilter && (

              <button
                type="button"
                className="home-reset-button"
                onClick={resetFilter}
              >
                <X size={15} />
                Reset
              </button>

            )}

            <Link
              to="/explore"
              className="text-link"
            >
              Lihat semua
              <ArrowRight size={16} />
            </Link>

          </div>

        </div>


        {!loading &&
          filteredSellers.length > 0 && (

            <div className="home-result-meta">

              <div>
                <UtensilsCrossed size={16} />
                <span>
                  {filteredSellers.length} warteg tersedia
                </span>
              </div>

              <div>
                <MapPin size={16} />
                <span>
                  {location}
                </span>
              </div>

            </div>

          )}


        {/* LOADING */}

        {loading && (

          <div className="home-store-grid">

            {[1, 2, 3, 4].map(
              item => (

                <div
                  className="home-store-skeleton"
                  key={item}
                >

                  <div className="skeleton-image" />

                  <div className="skeleton-content">

                    <div className="skeleton-line large" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line small" />

                  </div>

                </div>

              )
            )}

          </div>

        )}


        {/* STORES */}

        {!loading &&
          filteredSellers.length > 0 && (

            <div className="grid home-store-grid">

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

          )}


        {/* EMPTY */}

        {!loading &&
          filteredSellers.length === 0 && (

            <div className="empty-state card">

              <div className="empty-state-icon">
                <Search size={28} />
              </div>

              <h3>
                Warteg tidak ditemukan
              </h3>

              <p>
                Tidak ada warteg yang sesuai
                dengan lokasi, pencarian,
                atau kategori yang dipilih.
              </p>

              <button
                type="button"
                className="button"
                onClick={resetFilter}
              >
                Tampilkan Semua Warteg
              </button>

            </div>

          )}

      </section>


      {/* =================================================
          CHAT
      ================================================= */}

      <section className="chat-banner">

        <div>

          <span className="chat-badge">
            TANYA LANGSUNG
          </span>

          <h2>
            Ada pertanyaan soal menu?
          </h2>

          <p>
            Chat langsung dengan penjual warteg
            sebelum pesan makanan.
          </p>

        </div>

        <Link
          to="/chat"
          className="button"
        >
          Mulai Chat
        </Link>

      </section>


      {/* =================================================
          PROMO
      ================================================= */}

      <section className="promo-banner">

        <div className="promo-content">

          <span className="eyebrow">
            WARTEGKITA UNTUK KAMU
          </span>

          <h2>
            Gak sempat keluar?
            <br />
            Tetap bisa makan enak.
          </h2>

          <p>
            Pesan makanan rumahan dari warteg
            sekitar dengan proses sederhana.
          </p>

        </div>

        <Link
          to="/explore"
          className="button button-light"
        >
          Mulai Pesan
          <ArrowRight size={18} />
        </Link>

      </section>


      {/* =================================================
          AI MODAL
      ================================================= */}

      {showAI && (

        <div
          className="ai-modal-backdrop"
          onMouseDown={event => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAI(false);
            }

          }}
        >

          <div className="ai-modal">

            {/* HEADER */}

            <div className="ai-modal-header">

              <div className="ai-modal-title">

                <div className="ai-avatar">
                  <Sparkles size={20} />
                </div>

                <div>

                  <strong>
                    WartegKita AI
                  </strong>

                  <span>
                    Asisten rekomendasi makanan
                  </span>

                </div>

              </div>

              <div className="ai-modal-actions">

                <button
                  type="button"
                  title="Mulai percakapan baru"
                  onClick={resetAI}
                >
                  <RefreshCw size={17} />
                </button>

                <button
                  type="button"
                  title="Tutup"
                  onClick={() =>
                    setShowAI(false)
                  }
                >
                  <X size={20} />
                </button>

              </div>

            </div>


            {/* BODY */}

            <div className="ai-modal-body">

              {/* MESSAGES */}

              <div className="ai-chat-messages">

                {aiMessages.map(
                  message => (

                    <div
                      key={message.id}
                      className={
                        message.role ===
                          "user"
                          ? "ai-message user"
                          : "ai-message assistant"
                      }
                    >

                      <div className="ai-message-icon">

                        {message.role ===
                          "user"
                          ? (
                            <UserRound size={15} />
                          )
                          : (
                            <Bot size={15} />
                          )}

                      </div>

                      <div className="ai-message-bubble">
                        {message.text}
                      </div>

                    </div>

                  )
                )}

                {aiLoading && (

                  <div className="ai-message assistant">

                    <div className="ai-message-icon">
                      <Bot size={15} />
                    </div>

                    <div className="ai-message-bubble ai-typing">

                      <span />
                      <span />
                      <span />

                    </div>

                  </div>

                )}

              </div>


              {/* RECOMMENDATIONS */}

              {aiRecommendations.length > 0 && (

                <div className="ai-recommendation-area">

                  <div className="ai-recommendation-heading">

                    <div>

                      <span>
                        REKOMENDASI UNTUKMU
                      </span>

                      <strong>
                        Menu yang mungkin cocok
                      </strong>

                    </div>

                    <Sparkles size={18} />

                  </div>


                  <div className="ai-recommendation-list">

                    {aiRecommendations.map(
                      recommendation => {

                        const menu =
                          recommendation.menu;

                        const seller =
                          recommendation.seller;

                        return (

                          <div
                            className="ai-recommendation-card"
                            key={`${seller.id}-${menu.id}`}
                          >

                            <div className="ai-recommendation-image">

                              {menu.image ? (

                                <img
                                  src={menu.image}
                                  alt={
                                    menu.name ??
                                    "Menu"
                                  }
                                />

                              ) : (

                                <UtensilsCrossed
                                  size={24}
                                />

                              )}

                            </div>

                            <div className="ai-recommendation-info">

                              <div className="ai-recommendation-top">

                                <strong>
                                  {menu.name ??
                                    "Menu pilihan"}
                                </strong>

                                <span className="ai-match">

                                  <Sparkles size={12} />

                                  Cocok

                                </span>

                              </div>

                              <span className="ai-recommendation-store">

                                {seller.store_name ??
                                  seller.name ??
                                  "Warteg"}

                              </span>

                              <p>
                                {recommendation.reason}
                              </p>

                              <div className="ai-recommendation-bottom">

                                <strong>
                                  {formatPrice(
                                    menu.price
                                  )}
                                </strong>

                                <Link
                                  to={`/store/${seller.id}`}
                                  className="ai-view-menu"
                                  onClick={() =>
                                    setShowAI(false)
                                  }
                                >
                                  Lihat Menu
                                  <ArrowRight
                                    size={14}
                                  />
                                </Link>

                              </div>

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>

              )}

            </div>


            {/* QUICK PROMPTS */}

            <div className="ai-quick-prompts">

              <span>
                Coba tanyakan:
              </span>

              <div>

                {aiQuickPrompts.map(
                  prompt => {

                    const Icon =
                      prompt.icon;

                    return (

                      <button
                        type="button"
                        key={prompt.label}
                        onClick={() =>
                          handleAISend(
                            prompt.value
                          )
                        }
                      >

                        <Icon size={14} />

                        {prompt.label}

                      </button>

                    );

                  }
                )}

              </div>

            </div>


            {/* INPUT */}

            <div className="ai-input-wrapper">

              <textarea
                value={aiInput}
                onChange={event =>
                  setAIInput(
                    event.target.value
                  )
                }
                onKeyDown={event => {

                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {

                    event.preventDefault();

                    handleAISend();

                  }

                }}
                placeholder="Contoh: Aku mau makan siang di bawah Rp20.000, nggak pedas..."
                rows={2}
              />

              <button
                type="button"
                className="ai-send-button"
                disabled={
                  !aiInput.trim() ||
                  aiLoading
                }
                onClick={() =>
                  handleAISend()
                }
              >
                <Send size={18} />
              </button>

            </div>


            <div className="ai-disclaimer">

              <Sparkles size={13} />

              Rekomendasi berdasarkan menu dan
              informasi warteg yang tersedia di WartegKita.

            </div>

          </div>

        </div>

      )}

    </div>

  );

}