import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  PointerEvent as ReactPointerEvent,
} from "react";

import { Link } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Bot,
  ChevronDown,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  UserRound,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import api from "../../services/api";

import {
  Seller,
  Menu,
} from "../../types";

import "../../styles/home.css";

/* =====================================================
   WARTEGKITA HOME
===================================================== */


/* =====================================================
   LOCATIONS
===================================================== */

const locations = [
  "Semua Lokasi",
  "Jakarta Selatan",
  "Jakarta Pusat",
  "Jakarta Barat",
  "Jakarta Timur",
  "Jakarta Utara",
];


/* =====================================================
   HOME BANNERS
===================================================== */

const homeBanners = [
  {
    id: 1,
    image: "uploads/banners/banner-1.jpg",
    eyebrow: "WARTEGKITA",
    title: "Makan enak,\nnggak perlu ribet.",
    description:
      "Temukan warteg favoritmu dan pesan menu rumahan dengan mudah.",
    button: "Cari Warteg",
    link: "/explore",
  },
  {
    id: 2,
    image: "uploads/banners/banner-2.jpg",
    eyebrow: "MENU HARI INI",
    title: "Rasa rumahan,\nharga bersahabat.",
    description:
      "Pilihan menu lengkap dari warteg di sekitarmu.",
    button: "Lihat Menu",
    link: "/explore",
  },
  {
    id: 3,
    image: "uploads/banners/banner-3.jpg",
    eyebrow: "WARTEGKITA AI",
    title: "Bingung mau\nmakan apa?",
    description:
      "Biarkan WartegKita AI membantu menemukan menu yang cocok untukmu.",
    button: "Tanya AI",
    link: "#ai",
  },
  {
    id: 4,
    image: "uploads/banners/banner-4.jpg",
    eyebrow: "PESAN SEKARANG",
    title: "Warteg favoritmu,\ndi ujung jari.",
    description:
      "Pilih menu, pesan, dan nikmati makanan rumahan favoritmu.",
    button: "Mulai Pesan",
    link: "/explore",
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
    label: "Yang cepat",
    value:
      "Aku sedang buru-buru. Rekomendasikan makanan yang praktis dan cepat.",
    icon: Zap,
  },
];


/* =====================================================
   TYPES
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

type HomeCategory = {
  label: string;
  value: string;
  emoji: string;
};


/* =====================================================
   IMAGE CONFIGURATION
===================================================== */

const IMAGE_FOLDERS = {
  menu: "menus",
  seller: "sellers",
  banner: "banners",
};


/* =====================================================
   BASIC HELPERS
===================================================== */

const normalize = (
  value: unknown
) =>
  String(value ?? "")
    .toLowerCase()
    .trim();


/* =====================================================
   CATEGORY HELPERS

   Kategori TIDAK hardcode.
   Data kategori diambil dari /menus.
===================================================== */

const normalizeCategory = (
  value: unknown
) => {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
};


const slugifyCategory = (
  value: unknown
) => {
  return normalizeCategory(value)
    .replace(
      /[^a-z0-9\s]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    );
};


const getMenuCategory = (
  menu: any
) => {
  return (
    menu?.category ??
    menu?.category_name ??
    menu?.categoryName ??
    menu?.menu_category ??
    menu?.menu_category_name ??
    ""
  );
};


/**
 * Emoji hanya untuk visual.
 *
 * Emoji TIDAK menentukan kategori.
 * Kategori tetap berasal dari backend.
 */
const getCategoryEmoji = (
  category: string
) => {
  const value =
    normalizeCategory(
      category
    );

  if (
    value.includes("nasi") ||
    value.includes("rames")
  ) {
    return "🍛";
  }

  if (
    value.includes("ayam") ||
    value.includes("bebek")
  ) {
    return "🍗";
  }

  if (
    value.includes("ikan") ||
    value.includes("lele") ||
    value.includes("bandeng") ||
    value.includes("nila")
  ) {
    return "🐟";
  }

  if (
    value.includes("sayur") ||
    value.includes("vegetarian") ||
    value.includes("tumis")
  ) {
    return "🥬";
  }

  if (
    value.includes("minum") ||
    value.includes("drink") ||
    value.includes("kopi") ||
    value.includes("teh") ||
    value.includes("jus")
  ) {
    return "🥤";
  }

  if (
    value.includes("mie") ||
    value.includes("mi")
  ) {
    return "🍜";
  }

  if (
    value.includes("telur")
  ) {
    return "🥚";
  }

  if (
    value.includes("sambal") ||
    value.includes("pedas")
  ) {
    return "🌶️";
  }

  return "🍽️";
};


/* =====================================================
   BACKEND ORIGIN
===================================================== */

const getBackendOrigin = () => {
  try {
    const baseURL =
      api.defaults.baseURL;

    if (!baseURL) {
      return "";
    }

    const url = new URL(
      baseURL,
      window.location.origin
    );

    return url.origin;
  } catch {
    return "";
  }
};


/* =====================================================
   IMAGE URL
===================================================== */

const getImageUrl = (
  image: unknown,
  folder: keyof typeof IMAGE_FOLDERS = "menu"
) => {
  if (!image) {
    return "";
  }

  let value =
    String(image).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  const backendOrigin =
    getBackendOrigin();

  value = value.replace(
    /\\/g,
    "/"
  );

  if (
    value.startsWith(
      "/uploads/"
    )
  ) {
    return backendOrigin
      ? `${backendOrigin}${value}`
      : value;
  }

  if (
    value.startsWith(
      "uploads/"
    )
  ) {
    return backendOrigin
      ? `${backendOrigin}/${value}`
      : `/${value}`;
  }

  if (
    value.startsWith(
      "/api/v1/uploads/"
    )
  ) {
    return backendOrigin
      ? `${backendOrigin}${value}`
      : value;
  }

  if (
    value.startsWith(
      "menus/"
    ) ||
    value.startsWith(
      "sellers/"
    ) ||
    value.startsWith(
      "banners/"
    )
  ) {
    return backendOrigin
      ? `${backendOrigin}/uploads/${value}`
      : `/uploads/${value}`;
  }

  if (
    value.startsWith(
      "/menus/"
    ) ||
    value.startsWith(
      "/sellers/"
    ) ||
    value.startsWith(
      "/banners/"
    )
  ) {
    return backendOrigin
      ? `${backendOrigin}/uploads${value}`
      : `/uploads${value}`;
  }

  const cleanValue =
    value.replace(
      /^\/+/,
      ""
    );

  return backendOrigin
    ? `${backendOrigin}/uploads/${IMAGE_FOLDERS[folder]}/${cleanValue}`
    : `/uploads/${IMAGE_FOLDERS[folder]}/${cleanValue}`;
};


/* =====================================================
   MENU IMAGE
===================================================== */

const getMenuImage = (
  menu: any
) => {
  return (
    menu?.image_url ??
    menu?.imageUrl ??
    menu?.image ??
    menu?.photo_url ??
    menu?.photoUrl ??
    menu?.photo ??
    menu?.thumbnail_url ??
    menu?.thumbnailUrl ??
    menu?.thumbnail ??
    ""
  );
};


/* =====================================================
   SELLER IMAGE
===================================================== */

const getSellerImage = (
  seller: any
) => {
  return (
    seller?.image_url ??
    seller?.imageUrl ??
    seller?.image ??
    seller?.photo_url ??
    seller?.photoUrl ??
    seller?.photo ??
    seller?.cover_image ??
    seller?.coverImage ??
    seller?.cover_url ??
    seller?.coverUrl ??
    ""
  );
};


/* =====================================================
   LOCATION MATCH
===================================================== */

const sellerMatchesLocation = (
  seller: any,
  selectedLocation: string
) => {
  if (
    !selectedLocation ||
    selectedLocation ===
    "Semua Lokasi"
  ) {
    return true;
  }

  const location =
    normalize(
      selectedLocation
    );

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
    location
  );
};


/* =====================================================
   PRICE
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
   AI INTENT
===================================================== */

const detectAIIntent = (
  text: string
) => {
  const value =
    normalize(text);

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
      value.includes(
        "tidak terlalu pedas"
      ),

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

    nearby:
      value.includes("dekat") ||
      value.includes(
        "sekitar kantor"
      ) ||
      value.includes(
        "sekitar sini"
      ),
  };
};


/* =====================================================
   AI RECOMMENDATION
===================================================== */

const getAIRecommendations = (
  text: string,
  sellers: Seller[],
  menus: Menu[],
  selectedLocation: string
): AIRecommendation[] => {
  const intent =
    detectAIIntent(text);

  const candidates:
    AIRecommendation[] = [];

  menus.forEach(
    (menu: any) => {
      const seller =
        sellers.find(
          (item: any) =>
            String(item.id) ===
            String(
              menu.seller_id ??
              menu.sellerId
            )
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
        normalize(
          menu.description
        );

      const category =
        normalize(
          getMenuCategory(menu)
        );

      const searchable = [
        menuName,
        menuDescription,
        category,
      ]
        .filter(Boolean)
        .join(" ");

      let score = 0;

      const reasons:
        string[] = [];

      /* CATEGORY */

      if (
        intent.chicken &&
        searchable.includes(
          "ayam"
        )
      ) {
        score += 8;

        reasons.push(
          "sesuai pilihan ayam"
        );
      }

      if (
        intent.fish &&
        (
          searchable.includes(
            "ikan"
          ) ||
          searchable.includes(
            "lele"
          ) ||
          searchable.includes(
            "bandeng"
          ) ||
          searchable.includes(
            "nila"
          )
        )
      ) {
        score += 8;

        reasons.push(
          "sesuai pilihan ikan"
        );
      }

      if (
        intent.vegetable &&
        (
          searchable.includes(
            "sayur"
          ) ||
          searchable.includes(
            "tumis"
          ) ||
          searchable.includes(
            "capcay"
          )
        )
      ) {
        score += 7;

        reasons.push(
          "lebih banyak unsur sayur"
        );
      }

      if (
        intent.drink &&
        (
          category.includes(
            "minuman"
          ) ||
          searchable.includes(
            "es teh"
          ) ||
          searchable.includes(
            "kopi"
          ) ||
          searchable.includes(
            "jus"
          )
        )
      ) {
        score += 7;

        reasons.push(
          "sesuai pilihan minuman"
        );
      }

      /* SPICY */

      if (
        intent.notSpicy
      ) {
        if (
          searchable.includes(
            "tidak pedas"
          ) ||
          searchable.includes(
            "original"
          ) ||
          searchable.includes(
            "gurih"
          )
        ) {
          score += 7;

          reasons.push(
            "cenderung tidak pedas"
          );
        }

        if (
          searchable.includes(
            "pedas"
          ) ||
          searchable.includes(
            "sambal"
          )
        ) {
          score -= 5;
        }
      }

      if (
        intent.spicy
      ) {
        if (
          searchable.includes(
            "pedas"
          ) ||
          searchable.includes(
            "sambal"
          ) ||
          searchable.includes(
            "balado"
          )
        ) {
          score += 7;

          reasons.push(
            "cocok untuk pencinta pedas"
          );
        }
      }

      /* QUICK */

      if (
        intent.quick
      ) {
        if (
          searchable.includes(
            "nasi"
          ) ||
          searchable.includes(
            "ayam"
          ) ||
          searchable.includes(
            "telur"
          ) ||
          searchable.includes(
            "goreng"
          )
        ) {
          score += 3;

          reasons.push(
            "pilihan praktis untuk makan cepat"
          );
        }
      }

      /* LUNCH */

      if (
        intent.lunch
      ) {
        if (
          searchable.includes(
            "nasi"
          ) ||
          searchable.includes(
            "ayam"
          ) ||
          searchable.includes(
            "rames"
          )
        ) {
          score += 3;

          reasons.push(
            "cocok untuk makan siang"
          );
        }
      }

      /* BUDGET */

      const price =
        Number(
          menu.price ??
          menu.price_value ??
          0
        );

      if (
        intent.budget &&
        price > 0
      ) {
        if (
          price <= 20000
        ) {
          score += 9;

          reasons.push(
            "harga ramah di kantong"
          );
        }

        if (
          price > 30000
        ) {
          score -= 4;
        }
      }

      /* RATING */

      const rating =
        Number(
          (seller as any)
            .rating ?? 0
        );

      if (
        rating >= 4.5
      ) {
        score += 3;

        reasons.push(
          "rating warteg tinggi"
        );
      }

      /* OPEN */

      if (
        Boolean(
          (seller as any)
            .is_open
        )
      ) {
        score += 2;
      }

      /* NEARBY */

      if (
        intent.nearby
      ) {
        const distance =
          Number(
            (seller as any)
              .distance_km ??
            999
          );

        if (
          distance <= 2
        ) {
          score += 5;

          reasons.push(
            "berada dekat denganmu"
          );
        }
      }

      /* DEFAULT */

      if (
        score === 0
      ) {
        if (
          rating >= 4
        ) {
          score += 2;
        }

        if (
          Boolean(
            (seller as any)
              .is_open
          )
        ) {
          score += 1;
        }
      }

      if (
        score > 0
      ) {
        candidates.push({
          menu,
          seller,
          score,
          reason:
            reasons.length > 0
              ? reasons
                .slice(0, 2)
                .join(" • ")
              : "direkomendasikan berdasarkan menu dan warteg yang tersedia",
        });
      }
    }
  );

  return candidates
    .sort(
      (a, b) =>
        b.score -
        a.score
    )
    .slice(0, 4);
};


/* =====================================================
   HOME
===================================================== */

export default function Home() {

  /* =================================================
     DATA
  ================================================= */

  const [
    sellers,
    setSellers,
  ] =
    useState<Seller[]>([]);

  const [
    menus,
    setMenus,
  ] =
    useState<Menu[]>([]);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    activeCategory,
    setActiveCategory,
  ] =
    useState("all");

  const [
    location,
    setLocation,
  ] =
    useState(
      "Semua Lokasi"
    );

  const [
    showLocationMenu,
    setShowLocationMenu,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sortMode,
    setSortMode,
  ] =
    useState(
      "recommended"
    );


  /* =================================================
     BANNER
  ================================================= */

  const [
    activeBanner,
    setActiveBanner,
  ] =
    useState(0);

  const bannerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const isDragging =
    useRef(false);

  const dragStartX =
    useRef(0);

  const dragCurrentX =
    useRef(0);


  /* =================================================
     AI
  ================================================= */

  const [
    showAI,
    setShowAI,
  ] =
    useState(false);

  const [
    aiInput,
    setAIInput,
  ] =
    useState("");

  const [
    aiMessages,
    setAIMessages,
  ] =
    useState<AIMessage[]>([
      {
        id: 1,
        role: "assistant",
        text:
          "Halo! 👋 Aku asisten makan WartegKita. Ceritakan kamu lagi ingin makan apa, budget berapa, atau kebutuhan makananmu hari ini. Aku bantu carikan menu yang paling cocok.",
      },
    ]);

  const [
    aiRecommendations,
    setAIRecommendations,
  ] =
    useState<
      AIRecommendation[]
    >([]);

  const [
    aiLoading,
    setAILoading,
  ] =
    useState(false);


  /* =================================================
     LOAD DATA
  ================================================= */

  useEffect(() => {
    let mounted = true;

    const loadData =
      async () => {
        setLoading(true);

        try {
          const [
            sellerResponse,
            menuResponse,
          ] =
            await Promise.all([
              api.get(
                "/sellers"
              ),
              api.get(
                "/menus"
              ),
            ]);

          if (!mounted) {
            return;
          }

          const sellerData =
            sellerResponse
              .data?.data ??
            sellerResponse.data;

          const menuData =
            menuResponse
              .data?.data ??
            menuResponse.data;

          if (
            Array.isArray(
              sellerData
            )
          ) {
            const formatted =
              sellerData.map(
                (
                  item: any
                ) => ({
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
                      item.rating ??
                      0
                    ),

                  is_open:
                    item.is_open ??
                    true,

                  distance_km:
                    Number(
                      item.distance_km ??
                      0
                    ),
                })
              );

            setSellers(
              formatted
            );
          }

          if (
            Array.isArray(
              menuData
            )
          ) {
            setMenus(
              menuData
            );
          }
        } catch (
        error
        ) {
          console.error(
            "Gagal memuat Home:",
            error
          );
        } finally {
          if (
            mounted
          ) {
            setLoading(
              false
            );
          }
        }
      };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);


  /* =================================================
     DYNAMIC CATEGORIES

     INI BAGIAN PENTING.

     Tidak ada lagi:

     const categories = [
       "Ayam",
       "Ikan",
       ...
     ]

     Kategori sekarang benar-benar
     membaca data menu dari backend.
  ================================================= */

  const categories =
    useMemo<HomeCategory[]>(
      () => {
        const categoryMap =
          new Map<
            string,
            HomeCategory
          >();

        menus.forEach(
          (
            menu: any
          ) => {
            const rawCategory =
              getMenuCategory(
                menu
              );

            if (
              !rawCategory
            ) {
              return;
            }

            const label =
              String(
                rawCategory
              ).trim();

            if (
              !label
            ) {
              return;
            }

            const value =
              slugifyCategory(
                label
              );

            if (
              !value
            ) {
              return;
            }

            if (
              !categoryMap.has(
                value
              )
            ) {
              categoryMap.set(
                value,
                {
                  label,
                  value,
                  emoji:
                    getCategoryEmoji(
                      label
                    ),
                }
              );
            }
          }
        );

        const dynamicCategories =
          Array.from(
            categoryMap.values()
          ).sort(
            (
              a,
              b
            ) =>
              a.label.localeCompare(
                b.label,
                "id-ID"
              )
          );

        return [
          {
            label: "Semua",
            value: "all",
            emoji: "🍽️",
          },
          ...dynamicCategories,
        ];
      },
      [menus]
    );


  /* =================================================
     SAFETY:
     Kalau kategori yang sedang aktif
     sudah tidak ada setelah data berubah,
     kembalikan ke Semua.
  ================================================= */

  useEffect(() => {
    if (
      activeCategory ===
      "all"
    ) {
      return;
    }

    const exists =
      categories.some(
        category =>
          category.value ===
          activeCategory
      );

    if (!exists) {
      setActiveCategory(
        "all"
      );
    }
  }, [
    categories,
    activeCategory,
  ]);


  /* =================================================
     BANNER AUTOPLAY
  ================================================= */

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          if (
            !isDragging.current
          ) {
            setActiveBanner(
              previous =>
                (
                  previous +
                  1
                ) %
                homeBanners.length
            );
          }
        },
        5000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, []);


  /* =================================================
     BANNER NAVIGATION
  ================================================= */

  const nextBanner =
    () => {
      setActiveBanner(
        previous =>
          (
            previous +
            1
          ) %
          homeBanners.length
      );
    };

  const previousBanner =
    () => {
      setActiveBanner(
        previous =>
          previous ===
            0
            ? homeBanners.length -
            1
            : previous -
            1
      );
    };


  /* =================================================
     BANNER DRAG / SWIPE
  ================================================= */

  const handlePointerDown =
    (
      event: ReactPointerEvent<HTMLDivElement>
    ) => {
      isDragging.current =
        true;

      dragStartX.current =
        event.clientX;

      dragCurrentX.current =
        event.clientX;

      bannerRef.current?.setPointerCapture?.(
        event.pointerId
      );
    };

  const handlePointerMove =
    (
      event: ReactPointerEvent<HTMLDivElement>
    ) => {
      if (
        !isDragging.current
      ) {
        return;
      }

      dragCurrentX.current =
        event.clientX;
    };

  const handlePointerUp =
    () => {
      if (
        !isDragging.current
      ) {
        return;
      }

      const distance =
        dragStartX.current -
        dragCurrentX.current;

      if (
        Math.abs(
          distance
        ) > 50
      ) {
        if (
          distance > 0
        ) {
          nextBanner();
        } else {
          previousBanner();
        }
      }

      isDragging.current =
        false;
    };


  /* =================================================
     SELLER MENUS
  ================================================= */

  const getSellerMenus =
    (
      sellerId:
        | string
        | number
    ) => {
      return menus.filter(
        (
          menu: any
        ) =>
          String(
            menu.seller_id ??
            menu.sellerId
          ) ===
          String(
            sellerId
          )
      );
    };


  /* =================================================
     FILTER SELLERS
  ================================================= */

  const filteredSellers =
    useMemo(() => {
      const keyword =
        normalize(
          search
        );

      let result = [
        ...sellers,
      ];

      /* LOCATION */

      result =
        result.filter(
          (
            seller: any
          ) =>
            sellerMatchesLocation(
              seller,
              location
            )
        );


      /* SEARCH */

      if (
        keyword
      ) {
        result =
          result.filter(
            (
              seller: any
            ) => {
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
                .filter(
                  Boolean
                )
                .join(" ")
                .toLowerCase();

              const menuText =
                sellerMenus
                  .map(
                    (
                      menu: any
                    ) =>
                      [
                        menu.name,
                        menu.description,
                        getMenuCategory(
                          menu
                        ),
                      ]
                        .filter(
                          Boolean
                        )
                        .join(" ")
                  )
                  .join(" ")
                  .toLowerCase();

              return (
                sellerText.includes(
                  keyword
                ) ||
                menuText.includes(
                  keyword
                )
              );
            }
          );
      }


      /* =================================================
         CATEGORY

         Kategori dicocokkan setelah
         di-normalize + di-slugify.

         Contoh:

         "Nasi Rames"
         "nasi-rames"
         "nasi_rames"

         semuanya menjadi:

         nasi-rames
      ================================================= */

      if (
        activeCategory !==
        "all"
      ) {
        result =
          result.filter(
            (
              seller: any
            ) => {
              const sellerMenus =
                getSellerMenus(
                  seller.id
                );

              return sellerMenus.some(
                (
                  menu: any
                ) => {
                  const rawCategory =
                    getMenuCategory(
                      menu
                    );

                  if (
                    !rawCategory
                  ) {
                    return false;
                  }

                  const menuCategory =
                    slugifyCategory(
                      rawCategory
                    );

                  return (
                    menuCategory ===
                    activeCategory
                  );
                }
              );
            }
          );
      }


      /* SORT */

      if (
        sortMode ===
        "nearest"
      ) {
        result.sort(
          (
            a: any,
            b: any
          ) =>
            Number(
              a.distance_km ??
              999
            ) -
            Number(
              b.distance_km ??
              999
            )
        );
      }

      if (
        sortMode ===
        "rating"
      ) {
        result.sort(
          (
            a: any,
            b: any
          ) =>
            Number(
              b.rating ??
              0
            ) -
            Number(
              a.rating ??
              0
            )
        );
      }

      if (
        sortMode ===
        "open"
      ) {
        result.sort(
          (
            a: any,
            b: any
          ) =>
            Number(
              Boolean(
                b.is_open
              )
            ) -
            Number(
              Boolean(
                a.is_open
              )
            )
        );
      }

      return result;
    },
      [
        sellers,
        menus,
        search,
        activeCategory,
        location,
        sortMode,
      ]
    );


  /* =================================================
     FEATURED SELLERS
  ================================================= */

  const featuredSellers =
    useMemo(() => {
      return filteredSellers
        .filter(
          seller =>
            getSellerMenus(
              seller.id
            ).length > 0
        )
        .slice(
          0,
          6
        );
    }, [
      filteredSellers,
      menus,
    ]);


  /* =================================================
     AI SEND
  ================================================= */

  const handleAISend =
    (
      customPrompt?: string
    ) => {
      const message = (
        customPrompt ??
        aiInput
      ).trim();

      if (
        !message
      ) {
        return;
      }

      const userMessage:
        AIMessage = {
        id: Date.now(),
        role: "user",
        text: message,
      };

      setAIMessages(
        previous => [
          ...previous,
          userMessage,
        ]
      );

      setAIInput(
        ""
      );

      setAILoading(
        true
      );

      window.setTimeout(
        () => {
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

          let response =
            "";

          if (
            recommendations.length >
            0
          ) {
            const first =
              recommendations[0];

            response =
              `Aku menemukan ${recommendations.length} pilihan yang menurutku cocok. Pilihan pertama adalah ${first.menu?.name ??
              "menu pilihan"
              } dari ${first.seller?.store_name ??
              "warteg"
              } karena ${first.reason.toLowerCase()}.`;
          } else {
            response =
              "Aku belum menemukan menu yang benar-benar cocok dari data warteg yang tersedia. Coba beri tahu aku budget, jenis makanan, atau preferensi seperti ayam, ikan, sayur, pedas, atau tidak pedas.";
          }

          setAIMessages(
            previous => [
              ...previous,
              {
                id:
                  Date.now() +
                  1,
                role:
                  "assistant",
                text:
                  response,
              },
            ]
          );

          setAILoading(
            false
          );
        },
        650
      );
    };


  /* =================================================
     RESET AI
  ================================================= */

  const resetAI =
    () => {
      setAIInput(
        ""
      );

      setAIRecommendations(
        []
      );

      setAIMessages([
        {
          id: 1,
          role: "assistant",
          text:
            "Halo! 👋 Aku asisten makan WartegKita. Ceritakan kamu lagi ingin makan apa, budget berapa, atau kebutuhan makananmu hari ini. Aku bantu carikan menu yang paling cocok.",
        },
      ]);
    };


  /* =================================================
     RESET FILTER
  ================================================= */

  const resetFilter =
    () => {
      setSearch(
        ""
      );

      setActiveCategory(
        "all"
      );

      setLocation(
        "Semua Lokasi"
      );

      setSortMode(
        "recommended"
      );
    };


  const hasFilter =
    Boolean(
      search.trim()
    ) ||
    activeCategory !==
    "all" ||
    location !==
    "Semua Lokasi" ||
    sortMode !==
    "recommended";


  /* =================================================
     SCROLL RESULTS
  ================================================= */

  const scrollToResults =
    () => {
      window.setTimeout(
        () => {
          document
            .getElementById(
              "home-store-results"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "start",
            });
        },
        50
      );
    };


  /* =================================================
     RENDER
  ================================================= */

  return (
    <div className="home-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="home-hero">

        <div className="home-hero-copy">

          <span className="eyebrow">
            WARTEGKITA
          </span>

          <h1>
            Makan enak,
            <br />
            rasa rumahan.
          </h1>

          <p>
            Temukan warteg favorit,
            lihat menu dan harga,
            lalu pesan makanan
            tanpa ribet.
          </p>

          <div className="home-hero-actions">

            <Link
              to="/explore"
              className="button"
            >
              Cari Warteg

              <ArrowRight
                size={18}
              />
            </Link>

            <button
              type="button"
              className="button button-secondary"
              onClick={() =>
                setShowAI(true)
              }
            >
              <Sparkles
                size={17}
              />

              Tanya AI
            </button>

          </div>

          <div className="home-hero-trust">

            <span>
              <ShieldCheck
                size={16}
              />

              Penjual
              terverifikasi
            </span>

            <span>
              <Bike
                size={16}
              />

              Bisa diantar
            </span>

            <span>
              <UtensilsCrossed
                size={16}
              />

              Menu lengkap
            </span>

          </div>

        </div>

        <div className="home-hero-visual">

          <div className="hero-food-main">

            <img
              src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85"
              alt="Makanan rumahan"
            />

          </div>

          <div className="hero-floating-card">

            <div className="hero-floating-icon">
              🍛
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
          BANNER
      ================================================= */}

      <section className="home-banner-section">

        <div
          className="home-banner-carousel"
          ref={bannerRef}
          onPointerDown={
            handlePointerDown
          }
          onPointerMove={
            handlePointerMove
          }
          onPointerUp={
            handlePointerUp
          }
          onPointerCancel={
            handlePointerUp
          }
        >

          <div
            className="home-banner-track"
            style={{
              transform:
                `translateX(-${activeBanner *
                100
                }%)`,
            }}
          >

            {homeBanners.map(
              banner => (
                <div
                  className="home-banner-slide"
                  key={
                    banner.id
                  }
                >

                  <img
                    src={getImageUrl(
                      banner.image,
                      "banner"
                    )}
                    alt={banner.title.replace(
                      "\n",
                      " "
                    )}
                    draggable={false}
                    onError={
                      event => {
                        event.currentTarget.style.opacity =
                          "0";
                      }
                    }
                  />

                  <div className="home-banner-overlay" />

                  <div className="home-banner-content">

                    <span>
                      {
                        banner.eyebrow
                      }
                    </span>

                    <h2>
                      {banner.title
                        .split(
                          "\n"
                        )
                        .map(
                          (
                            line,
                            index
                          ) => (
                            <span
                              key={
                                index
                              }
                            >
                              {
                                line
                              }
                            </span>
                          )
                        )}
                    </h2>

                    <p>
                      {
                        banner.description
                      }
                    </p>

                    {banner.link.startsWith(
                      "#"
                    ) ? (
                      <button
                        type="button"
                        className="banner-button"
                        onClick={() =>
                          setShowAI(
                            true
                          )
                        }
                      >
                        {
                          banner.button
                        }

                        <ArrowRight
                          size={
                            16
                          }
                        />
                      </button>
                    ) : (
                      <Link
                        to={
                          banner.link
                        }
                        className="banner-button"
                      >
                        {
                          banner.button
                        }

                        <ArrowRight
                          size={
                            16
                          }
                        />
                      </Link>
                    )}

                  </div>

                </div>
              )
            )}

          </div>


          <button
            type="button"
            className="banner-arrow banner-arrow-left"
            onClick={
              previousBanner
            }
            aria-label="Banner sebelumnya"
          >
            <ArrowLeft
              size={19}
            />
          </button>


          <button
            type="button"
            className="banner-arrow banner-arrow-right"
            onClick={
              nextBanner
            }
            aria-label="Banner berikutnya"
          >
            <ArrowRight
              size={19}
            />
          </button>


          <div className="banner-dots">

            {homeBanners.map(
              (
                _,
                index
              ) => (
                <button
                  type="button"
                  key={
                    index
                  }
                  className={
                    activeBanner ===
                      index
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setActiveBanner(
                      index
                    )
                  }
                  aria-label={`Buka banner ${index +
                    1
                    }`}
                />
              )
            )}

          </div>

        </div>

        <div className="banner-swipe-hint">

          Geser untuk melihat
          banner lainnya

          <ArrowRight
            size={14}
          />

        </div>

      </section>


      {/* =================================================
          DYNAMIC CATEGORY
      ================================================= */}

      <section className="home-category-section">

        <div className="home-section-heading">

          <div>

            <span className="eyebrow">
              PILIH SESUAI SELERA
            </span>

            <h2>
              Lagi pengin apa?
            </h2>

          </div>

          <Link
            to="/explore"
            className="text-link"
          >
            Lihat semua

            <ArrowRight
              size={16}
            />
          </Link>

        </div>


        <div className="home-category-list">

          {categories.map(
            category => {

              const isActive =
                activeCategory ===
                category.value;

              return (
                <button
                  type="button"
                  key={
                    category.value
                  }
                  className={
                    isActive
                      ? "home-category active"
                      : "home-category"
                  }
                  onClick={() => {

                    setActiveCategory(
                      category.value
                    );

                    scrollToResults();

                  }}
                >

                  <span className="home-category-icon">
                    {
                      category.emoji
                    }
                  </span>

                  <span>
                    {
                      category.label
                    }
                  </span>

                </button>
              );

            }
          )}

        </div>


        {/* Tidak ada kategori dari backend */}

        {!loading &&
          categories.length <=
          1 && (
            <div className="home-category-empty">

              <UtensilsCrossed
                size={18}
              />

              <span>
                Kategori menu belum tersedia.
              </span>

            </div>
          )}

      </section>


      {/* =================================================
          SEARCH
      ================================================= */}

      <section className="home-search-section">

        <div className="home-search-heading">

          <div>

            <span className="eyebrow">
              CARI MAKANAN
            </span>

            <h2>
              Mau makan apa hari ini?
            </h2>

            <p>
              Cari berdasarkan
              warteg atau nama
              menu.
            </p>

          </div>


          <div className="location-wrapper">

            <button
              type="button"
              className="location-pill"
              onClick={() =>
                setShowLocationMenu(
                  value =>
                    !value
                )
              }
            >

              <MapPin
                size={16}
              />

              <span>
                {location}
              </span>

              <ChevronDown
                size={15}
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
                      key={
                        item
                      }
                      className={
                        location ===
                          item
                          ? "active"
                          : ""
                      }
                      onClick={() => {

                        setLocation(
                          item
                        );

                        setShowLocationMenu(
                          false
                        );

                      }}
                    >

                      <MapPin
                        size={14}
                      />

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


        <div className="home-search-box">

          <Search
            size={20}
          />

          <input
            value={
              search
            }
            onChange={
              event =>
                setSearch(
                  event.target
                    .value
                )
            }
            onKeyDown={
              event => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  scrollToResults();
                }
              }
            }
            placeholder="Cari ayam, nasi rames, lele, es teh..."
          />


          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={() =>
                setSearch(
                  ""
                )
              }
            >
              <X
                size={17}
              />
            </button>
          )}


          <button
            type="button"
            className="home-search-button"
            onClick={
              scrollToResults
            }
          >
            Cari
          </button>

        </div>

      </section>


      {/* =================================================
          AI MINI BANNER
      ================================================= */}

      <section
        className="home-ai-banner"
        id="ai"
      >

        <div className="home-ai-copy">

          <div className="home-ai-badge">

            <Sparkles
              size={14}
            />

            WARTEGKITA AI

          </div>

          <h2>
            Bingung mau makan apa?
          </h2>

          <p>
            Ceritakan budget dan
            selera kamu. Kami bantu
            carikan menu yang cocok.
          </p>

          <button
            type="button"
            className="home-ai-button"
            onClick={() =>
              setShowAI(true)
            }
          >

            <Sparkles
              size={17}
            />

            Tanya AI Sekarang

            <ArrowRight
              size={16}
            />

          </button>

        </div>


        <div className="home-ai-visual">

          <div className="ai-food ai-food-one">
            🍛
          </div>

          <div className="ai-food ai-food-two">
            🍗
          </div>

          <div className="ai-food ai-food-three">
            🥬
          </div>

          <div className="ai-center">

            <Sparkles
              size={32}
            />

          </div>

        </div>

      </section>


      {/* =================================================
          WARTEG RESULTS
      ================================================= */}

      <section
        className="home-store-section"
        id="home-store-results"
      >

        <div className="home-section-heading">

          <div>

            <span className="eyebrow">
              {hasFilter
                ? "HASIL PENCARIAN"
                : "REKOMENDASI UNTUKMU"}
            </span>

            <h2>
              {hasFilter
                ? `${filteredSellers.length} warteg ditemukan`
                : "Warteg favorit hari ini"}
            </h2>

            <p>
              {location !==
                "Semua Lokasi"
                ? `Menampilkan warteg di ${location}.`
                : "Lihat warteg dan menu yang tersedia di sekitarmu."}
            </p>

          </div>


          <div className="home-result-actions">

            {hasFilter && (
              <button
                type="button"
                className="home-reset-button"
                onClick={
                  resetFilter
                }
              >

                <X
                  size={14}
                />

                Reset

              </button>
            )}


            <Link
              to="/explore"
              className="text-link"
            >
              Lihat semua

              <ArrowRight
                size={16}
              />
            </Link>

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="home-store-list">

            {[
              1,
              2,
              3,
            ].map(
              item => (
                <div
                  className="home-store-skeleton"
                  key={
                    item
                  }
                >

                  <div className="home-skeleton-cover" />

                  <div className="home-skeleton-body">

                    <div className="skeleton-line large" />

                    <div className="skeleton-line medium" />

                    <div className="home-skeleton-menu-row">

                      <div />
                      <div />
                      <div />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>
        )}


        {/* =================================================
            STORES
        ================================================= */}

        {!loading &&
          featuredSellers.length >
          0 && (
            <div className="home-store-list">

              {featuredSellers.map(
                seller => {

                  const sellerMenus =
                    getSellerMenus(
                      seller.id
                    ).slice(
                      0,
                      8
                    );

                  const sellerImage =
                    getSellerImage(
                      seller
                    );

                  const sellerImageUrl =
                    getImageUrl(
                      sellerImage,
                      "seller"
                    );

                  const sellerIsOpen =
                    Boolean(
                      (
                        seller as any
                      )
                        .is_open
                    );

                  const sellerRating =
                    Number(
                      (
                        seller as any
                      )
                        .rating ??
                      0
                    );

                  const sellerDistance =
                    Number(
                      (
                        seller as any
                      )
                        .distance_km ??
                      0
                    );

                  return (
                    <article
                      className="home-store-card"
                      key={
                        seller.id
                      }
                    >

                      {/* STORE HEADER */}

                      <Link
                        to={`/store/${seller.id}`}
                        className="home-store-cover"
                      >

                        {sellerImageUrl ? (
                          <img
                            src={
                              sellerImageUrl
                            }
                            alt={
                              seller.store_name ??
                              "Warteg"
                            }
                            loading="lazy"
                            onError={
                              event => {
                                event.currentTarget.style.display =
                                  "none";

                                const parent =
                                  event.currentTarget
                                    .parentElement;

                                if (
                                  parent &&
                                  !parent.querySelector(
                                    ".home-store-cover-placeholder"
                                  )
                                ) {
                                  const placeholder =
                                    document.createElement(
                                      "div"
                                    );

                                  placeholder.className =
                                    "home-store-cover-placeholder";

                                  placeholder.innerHTML =
                                    `<span>🍛</span>`;

                                  parent.appendChild(
                                    placeholder
                                  );
                                }
                              }
                            }
                          />
                        ) : (
                          <div className="home-store-cover-placeholder">

                            <UtensilsCrossed
                              size={34}
                            />

                          </div>
                        )}


                        <div className="home-store-cover-overlay" />


                        <div className="home-store-open-badge">

                          <span
                            className={
                              sellerIsOpen
                                ? "open-dot"
                                : "closed-dot"
                            }
                          />

                          {sellerIsOpen
                            ? "Buka"
                            : "Tutup"}

                        </div>

                      </Link>


                      {/* STORE INFO */}

                      <div className="home-store-info">

                        <div className="home-store-main">

                          <div>

                            <Link
                              to={`/store/${seller.id}`}
                              className="home-store-name"
                            >
                              {seller.store_name ??
                                "Warteg"}
                            </Link>


                            <div className="home-store-location">

                              <MapPin
                                size={14}
                              />

                              <span>
                                {seller.address ??
                                  seller.city ??
                                  "Lokasi warteg"}
                              </span>

                            </div>

                          </div>


                          <div className="home-store-rating">

                            <Star
                              size={14}
                              fill="currentColor"
                            />

                            <strong>
                              {sellerRating.toFixed(
                                1
                              )}
                            </strong>

                          </div>

                        </div>


                        <div className="home-store-meta">

                          <span>

                            <Clock3
                              size={13}
                            />

                            {sellerIsOpen
                              ? "Sedang buka"
                              : "Sedang tutup"}

                          </span>


                          {sellerDistance >
                            0 && (
                              <span>

                                <MapPin
                                  size={13}
                                />

                                {sellerDistance.toFixed(
                                  1
                                )}{" "}
                                km

                              </span>
                            )}

                        </div>

                      </div>


                      {/* MENU PREVIEW */}

                      <div className="home-menu-section">

                        <div className="home-menu-heading">

                          <div>

                            <span className="menu-available-dot" />

                            <strong>
                              Menu tersedia
                            </strong>

                          </div>


                          <Link
                            to={`/store/${seller.id}`}
                          >
                            Lihat menu

                            <ChevronRight
                              size={
                                15
                              }
                            />

                          </Link>

                        </div>


                        <div className="home-menu-scroll">

                          {sellerMenus.map(
                            (
                              menu: any
                            ) => {

                              const menuImage =
                                getMenuImage(
                                  menu
                                );

                              const menuImageUrl =
                                getImageUrl(
                                  menuImage,
                                  "menu"
                                );

                              return (
                                <Link
                                  to={`/store/${seller.id}`}
                                  className="home-menu-card"
                                  key={
                                    menu.id
                                  }
                                >

                                  <div className="home-menu-image">

                                    {menuImageUrl ? (
                                      <img
                                        src={
                                          menuImageUrl
                                        }
                                        alt={
                                          menu.name ??
                                          "Menu"
                                        }
                                        loading="lazy"
                                        onError={
                                          event => {
                                            event.currentTarget.style.display =
                                              "none";

                                            const parent =
                                              event.currentTarget
                                                .parentElement;

                                            if (
                                              parent &&
                                              !parent.querySelector(
                                                ".home-menu-placeholder"
                                              )
                                            ) {
                                              const placeholder =
                                                document.createElement(
                                                  "div"
                                                );

                                              placeholder.className =
                                                "home-menu-placeholder";

                                              placeholder.innerHTML =
                                                "🍛";

                                              parent.appendChild(
                                                placeholder
                                              );
                                            }
                                          }
                                        }
                                      />
                                    ) : (
                                      <div className="home-menu-placeholder">

                                        <UtensilsCrossed
                                          size={
                                            22
                                          }
                                        />

                                      </div>
                                    )}

                                  </div>


                                  <div className="home-menu-content">

                                    <strong>
                                      {menu.name ??
                                        "Menu"}
                                    </strong>

                                    <span>
                                      {formatPrice(
                                        menu.price
                                      )}
                                    </span>

                                  </div>

                                </Link>
                              );
                            }
                          )}


                          {sellerMenus.length ===
                            0 && (
                              <div className="home-no-menu">

                                <UtensilsCrossed
                                  size={18}
                                />

                                <span>
                                  Menu belum tersedia
                                </span>

                              </div>
                            )}

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          featuredSellers.length ===
          0 && (
            <div className="home-empty-state">

              <div className="home-empty-icon">

                <Search
                  size={28}
                />

              </div>

              <h3>
                Warteg tidak ditemukan
              </h3>

              <p>
                Coba ubah lokasi,
                pencarian, atau
                kategori makanan.
              </p>

              <button
                type="button"
                className="button"
                onClick={
                  resetFilter
                }
              >
                Tampilkan Semua
              </button>

            </div>
          )}

      </section>


      {/* =================================================
          BENEFITS
      ================================================= */}

      <section className="home-benefits">

        <div className="home-benefit">

          <div className="home-benefit-icon">

            <MapPin
              size={20}
            />

          </div>

          <div>

            <strong>
              Cari yang dekat
            </strong>

            <span>
              Temukan warteg di
              sekitar lokasi kamu.
            </span>

          </div>

        </div>


        <div className="home-benefit">

          <div className="home-benefit-icon">

            <Star
              size={20}
            />

          </div>

          <div>

            <strong>
              Rating terpercaya
            </strong>

            <span>
              Lihat penilaian sebelum
              memilih.
            </span>

          </div>

        </div>


        <div className="home-benefit">

          <div className="home-benefit-icon">

            <Bike
              size={20}
            />

          </div>

          <div>

            <strong>
              Praktis
            </strong>

            <span>
              Pesan makanan tanpa
              perlu keluar.
            </span>

          </div>

        </div>

      </section>


      {/* =================================================
          CHAT CTA
      ================================================= */}

      <section className="home-chat-banner">

        <div>

          <span>
            TANYA LANGSUNG
          </span>

          <h2>
            Mau tanya soal menu?
          </h2>

          <p>
            Chat langsung dengan
            penjual sebelum pesan
            makanan.
          </p>

        </div>


        <Link
          to="/explore"
          className="button"
        >
          Mulai Chat

          <ArrowRight
            size={17}
          />
        </Link>

      </section>


      {/* =================================================
          AI MODAL
      ================================================= */}

      {showAI && (
        <div
          className="ai-modal-backdrop"
          onMouseDown={
            event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowAI(
                  false
                );
              }
            }
          }
        >

          <div className="ai-modal">

            {/* HEADER */}

            <div className="ai-modal-header">

              <div className="ai-modal-title">

                <div className="ai-avatar">

                  <Sparkles
                    size={19}
                  />

                </div>

                <div>

                  <strong>
                    WartegKita AI
                  </strong>

                  <span>
                    Asisten rekomendasi
                    makanan
                  </span>

                </div>

              </div>


              <div className="ai-modal-actions">

                <button
                  type="button"
                  title="Percakapan baru"
                  onClick={
                    resetAI
                  }
                >

                  <RefreshCw
                    size={17}
                  />

                </button>


                <button
                  type="button"
                  title="Tutup"
                  onClick={() =>
                    setShowAI(
                      false
                    )
                  }
                >

                  <X
                    size={20}
                  />

                </button>

              </div>

            </div>


            {/* BODY */}

            <div className="ai-modal-body">

              <div className="ai-chat-messages">

                {aiMessages.map(
                  message => (
                    <div
                      key={
                        message.id
                      }
                      className={
                        message.role ===
                          "user"
                          ? "ai-message user"
                          : "ai-message assistant"
                      }
                    >

                      <div className="ai-message-icon">

                        {message.role ===
                          "user" ? (
                          <UserRound
                            size={
                              14
                            }
                          />
                        ) : (
                          <Bot
                            size={
                              14
                            }
                          />
                        )}

                      </div>


                      <div className="ai-message-bubble">

                        {
                          message.text
                        }

                      </div>

                    </div>
                  )
                )}


                {aiLoading && (
                  <div className="ai-message assistant">

                    <div className="ai-message-icon">

                      <Bot
                        size={14}
                      />

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

              {aiRecommendations.length >
                0 && (
                  <div className="ai-recommendation-area">

                    <div className="ai-recommendation-heading">

                      <div>

                        <span>
                          REKOMENDASI
                          UNTUKMU
                        </span>

                        <strong>
                          Menu yang mungkin
                          cocok
                        </strong>

                      </div>

                      <Sparkles
                        size={17}
                      />

                    </div>


                    <div className="ai-recommendation-list">

                      {aiRecommendations.map(
                        recommendation => {

                          const menu =
                            recommendation.menu;

                          const seller =
                            recommendation.seller;

                          const recommendationImage =
                            getMenuImage(
                              menu
                            );

                          const recommendationImageUrl =
                            getImageUrl(
                              recommendationImage,
                              "menu"
                            );

                          return (
                            <div
                              className="ai-recommendation-card"
                              key={`${seller.id}-${menu.id}`}
                            >

                              <div className="ai-recommendation-image">

                                {recommendationImageUrl ? (
                                  <img
                                    src={
                                      recommendationImageUrl
                                    }
                                    alt={
                                      menu.name ??
                                      "Menu"
                                    }
                                    loading="lazy"
                                    onError={
                                      event => {
                                        event.currentTarget.style.display =
                                          "none";

                                        const parent =
                                          event.currentTarget
                                            .parentElement;

                                        if (
                                          parent &&
                                          !parent.querySelector(
                                            ".ai-recommendation-fallback"
                                          )
                                        ) {
                                          const fallback =
                                            document.createElement(
                                              "div"
                                            );

                                          fallback.className =
                                            "ai-recommendation-fallback";

                                          fallback.innerHTML =
                                            "🍛";

                                          parent.appendChild(
                                            fallback
                                          );
                                        }
                                      }
                                    }
                                  />
                                ) : (
                                  <UtensilsCrossed
                                    size={
                                      22
                                    }
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

                                    <Sparkles
                                      size={
                                        11
                                      }
                                    />

                                    Cocok

                                  </span>

                                </div>


                                <span className="ai-recommendation-store">

                                  {seller.store_name ??
                                    seller.name ??
                                    "Warteg"}

                                </span>


                                <p>
                                  {
                                    recommendation.reason
                                  }
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
                                      setShowAI(
                                        false
                                      )
                                    }
                                  >
                                    Lihat Menu

                                    <ArrowRight
                                      size={
                                        13
                                      }
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
                        key={
                          prompt.label
                        }
                        onClick={() =>
                          handleAISend(
                            prompt.value
                          )
                        }
                      >

                        <Icon
                          size={13}
                        />

                        {
                          prompt.label
                        }

                      </button>
                    );
                  }
                )}

              </div>

            </div>


            {/* INPUT */}

            <div className="ai-input-wrapper">

              <textarea
                value={
                  aiInput
                }
                onChange={
                  event =>
                    setAIInput(
                      event.target
                        .value
                    )
                }
                onKeyDown={
                  event => {
                    if (
                      event.key ===
                      "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      handleAISend();
                    }
                  }
                }
                placeholder="Contoh: makan siang di bawah Rp20.000, nggak pedas..."
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

                <Send
                  size={17}
                />

              </button>

            </div>


            <div className="ai-disclaimer">

              <Sparkles
                size={12}
              />

              Rekomendasi berdasarkan
              menu dan informasi
              warteg yang tersedia.

            </div>

          </div>

        </div>
      )}

    </div>
  );
}