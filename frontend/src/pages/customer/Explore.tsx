import {
  ArrowDownUp,
  ArrowRight,
  Bike,
  ChevronDown,
  Clock3,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  X,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../../services/api";

import {
  Seller,
  Menu,
} from "../../types";

import "../../styles/explore.css";


/* =====================================================
   TYPES
===================================================== */

type PopularMenu = {
  menu_id: string;
  menu_name: string;
  total_sold: number;
};

type PopularSeller = {
  seller_id: string;
  total_orders: number;
  popular_menus: PopularMenu[];
};

type ExploreSeller = Seller & {
  id?: string;
  seller_id?: string;

  store_name?: string;
  name?: string;
  owner?: string;

  image_url?: string;
  image?: string;
  logo_url?: string;
  photo_url?: string;
  cover_image?: string;

  location?: string;
  address?: string;
  city?: string;
  district?: string;
  kecamatan?: string;
  kelurahan?: string;
  province?: string;
  region?: string;

  rating?: number | string;
  distance_km?: number | string;
  is_open?: boolean;

  total_orders?: number;
  popular_menus?: PopularMenu[];
};


type ExploreMenu = Menu & {
  id?: string;
  menu_id?: string;

  seller_id?: string;

  name?: string;
  menu_name?: string;

  description?: string;

  price?: number | string;

  image?: string;
  image_url?: string;
  photo_url?: string;

  category?: string;
  category_name?: string;

  available?: boolean;
  stock?: number;
};


/* =====================================================
   CATEGORIES
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
   CATEGORY KEYWORDS
===================================================== */

const categoryKeywords: Record<string, string[]> = {
  "nasi-rames": [
    "nasi",
    "rames",
    "nasi rames",
    "nasi campur",
  ],

  ayam: [
    "ayam",
    "chicken",
  ],

  ikan: [
    "ikan",
    "lele",
    "nila",
    "gurame",
    "bandeng",
    "tongkol",
    "kembung",
  ],

  sayur: [
    "sayur",
    "kangkung",
    "bayam",
    "capcay",
    "tumis",
    "sop",
    "lodeh",
    "asem",
  ],

  minuman: [
    "minuman",
    "minum",
    "teh",
    "kopi",
    "jeruk",
    "jus",
    "susu",
    "es",
  ],
};


/* =====================================================
   HELPERS
===================================================== */

const normalize = (
  value: unknown
) =>
  String(value ?? "")
    .toLowerCase()
    .trim();


/* =====================================================
   API BASE URL
===================================================== */

const getApiBaseUrl = () => {

  const baseURL =
    (api.defaults as any)?.baseURL;

  if (!baseURL) {
    return window.location.origin;
  }

  return String(baseURL).replace(
    /\/api\/v1\/?$/,
    ""
  );
};


/* =====================================================
   IMAGE URL
===================================================== */

const getImageUrl = (
  value?: unknown
) => {

  if (!value) {
    return "";
  }

  const image =
    String(value).trim();

  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  const baseURL =
    getApiBaseUrl();

  if (
    image.startsWith("/uploads/")
  ) {
    return `${baseURL}${image}`;
  }

  if (
    image.startsWith("uploads/")
  ) {
    return `${baseURL}/${image}`;
  }

  if (
    image.startsWith("/images/")
  ) {
    return `${baseURL}${image}`;
  }

  if (
    image.startsWith("images/")
  ) {
    return `${baseURL}/${image}`;
  }

  if (
    image.startsWith("/")
  ) {
    return `${baseURL}${image}`;
  }

  return `${baseURL}/${image}`;
};


/* =====================================================
   SELLER ID
===================================================== */

const getSellerId = (
  seller: any
) => {

  return String(
    seller?.id ??
    seller?.seller_id ??
    ""
  ).trim();
};


/* =====================================================
   MENU ID
===================================================== */

const getMenuId = (
  menu: any
) => {

  return String(
    menu?.id ??
    menu?.menu_id ??
    ""
  ).trim();
};


/* =====================================================
   MENU NAME
===================================================== */

const getMenuName = (
  menu: any
) => {

  return (
    menu?.name ??
    menu?.menu_name ??
    "Menu"
  );
};


/* =====================================================
   MENU PRICE
===================================================== */

const getMenuPrice = (
  menu: any
) => {

  const price =
    Number(
      menu?.price ?? 0
    );

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
   SELLER IMAGE
===================================================== */

const getSellerImage = (
  seller: any
) => {

  return getImageUrl(
    seller?.image_url ||
    seller?.image ||
    seller?.logo_url ||
    seller?.photo_url ||
    seller?.cover_image ||
    ""
  );
};


/* =====================================================
   MENU IMAGE
===================================================== */

const getMenuImage = (
  menu: any
) => {

  return getImageUrl(
    menu?.image_url ||
    menu?.image ||
    menu?.photo_url ||
    ""
  );
};


/* =====================================================
   MENU AVAILABLE
===================================================== */

const isMenuAvailable = (
  menu: ExploreMenu
) => {

  return (
    menu.available !== false &&
    Number(
      menu.stock ?? 1
    ) > 0
  );
};


/* =====================================================
   LOCATION MATCH
===================================================== */

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
    seller?.address,
    seller?.location,
    seller?.city,
    seller?.province,
    seller?.district,
    seller?.kecamatan,
    seller?.kelurahan,
    seller?.region,
  ]
    .filter(Boolean)
    .map(normalize)
    .join(" ");

  return sellerLocation.includes(
    normalize(location)
  );
};


/* =====================================================
   MENU CATEGORY MATCH
===================================================== */

const menuMatchesCategory = (
  menu: any,
  category: string
) => {

  if (category === "all") {
    return true;
  }

  const keywords =
    categoryKeywords[category] ?? [];

  const menuText = [
    menu?.name,
    menu?.menu_name,
    menu?.description,
    menu?.category,
    menu?.category_name,
  ]
    .filter(Boolean)
    .map(normalize)
    .join(" ");

  return keywords.some(
    keyword =>
      menuText.includes(
        normalize(keyword)
      )
  );
};


/* =====================================================
   MENU CARD
===================================================== */

type ExploreMenuCardProps = {
  menu: ExploreMenu;
  sellerId: string;
};


function ExploreMenuCard({
  menu,
  sellerId,
}: ExploreMenuCardProps) {

  const image =
    getMenuImage(menu);

  const name =
    getMenuName(menu);

  const price =
    getMenuPrice(menu);

  const menuId =
    getMenuId(menu);

  const available =
    isMenuAvailable(menu);


  /*
   * Ini yang membuat lauk bisa diklik.
   *
   * Contoh:
   *
   * /store/SELLER_UUID?menu_id=MENU_UUID
   *
   * StoreDetail.tsx nantinya membaca
   * parameter menu_id tersebut.
   */

  const menuUrl =
    menuId && sellerId
      ? `/store/${sellerId}?menu_id=${encodeURIComponent(menuId)}`
      : `/store/${sellerId}`;


  return (

    <Link
      to={menuUrl}
      className="explore-menu-card"
      aria-label={`Lihat menu ${name}`}
      title={`Lihat ${name}`}
    >

      {/* =================================================
         IMAGE
      ================================================= */}

      <div className="explore-menu-card-image">

        {image ? (

          <img
            src={image}
            alt={name}
            loading="lazy"
            onError={event => {

              event.currentTarget.style.display =
                "none";

              event.currentTarget
                .parentElement
                ?.classList.add(
                  "has-error"
                );

            }}
          />

        ) : (

          <div className="explore-menu-image-placeholder">

            <span>
              🍛
            </span>

          </div>

        )}


        {!available && (

          <div className="explore-menu-unavailable">
            Habis
          </div>

        )}

      </div>


      {/* =================================================
         CONTENT
      ================================================= */}

      <div className="explore-menu-card-content">

        <strong
          className="explore-menu-card-name"
          title={name}
        >
          {name}
        </strong>

        <span className="explore-menu-card-price">
          {price}
        </span>

      </div>

    </Link>
  );
}


/* =====================================================
   EXPLORE STORE CARD
===================================================== */

type ExploreStoreCardProps = {
  seller: ExploreSeller;

  menus: ExploreMenu[];

  popularMenus?: PopularMenu[];

  categoryLabel?: string;
};


function ExploreStoreCard({
  seller,
  menus,
  popularMenus = [],
  categoryLabel,
}: ExploreStoreCardProps) {

  const sellerId =
    getSellerId(seller);

  const sellerImage =
    getSellerImage(seller);


  /* =====================================================
     DISPLAY MENUS
  ===================================================== */

  const displayMenus =
    useMemo(() => {

      if (
        popularMenus.length > 0
      ) {

        const popular =
          popularMenus
            .map(popularMenu => {

              const found =
                menus.find(
                  menu =>
                    getMenuId(menu) ===
                    String(
                      popularMenu.menu_id
                    )
                );


              if (found) {
                return found;
              }


              /*
               * Popular menu belum ditemukan
               * di endpoint /menus.
               *
               * Tetap dibuat sebagai object
               * supaya menu_id tetap tersedia
               * untuk navigasi.
               */

              return {
                id:
                  popularMenu.menu_id,

                menu_id:
                  popularMenu.menu_id,

                seller_id:
                  sellerId,

                name:
                  popularMenu.menu_name,

                menu_name:
                  popularMenu.menu_name,

                price:
                  0,

                image:
                  "",

                available:
                  true,

                stock:
                  1,

              } as ExploreMenu;

            })
            .filter(
              menu =>
                Boolean(
                  getMenuId(menu)
                )
            );


        return popular.slice(
          0,
          8
        );
      }


      return menus
        .filter(
          menu =>
            menu.available !== false
        )
        .slice(
          0,
          8
        );

    }, [
      menus,
      popularMenus,
      sellerId,
    ]);


  /* =====================================================
     STORE DATA
  ===================================================== */

  const storeName =
    seller.store_name ||
    seller.name ||
    "Warteg";


  const rating =
    Number(
      seller.rating ?? 0
    );


  const distance =
    Number(
      seller.distance_km ?? 0
    );


  const address =
    seller.address ||
    seller.location ||
    seller.city ||
    "Lokasi warteg";


  return (

    <article className="explore-store-card">

      {/* =================================================
         STORE IMAGE
      ================================================= */}

      <Link
        to={`/store/${sellerId}`}
        className="explore-store-card-image-link"
        aria-label={`Lihat ${storeName}`}
      >

        <div className="explore-store-card-image">

          {sellerImage ? (

            <img
              src={sellerImage}
              alt={storeName}
              loading="lazy"
              onError={event => {

                event.currentTarget.style.display =
                  "none";

                event.currentTarget
                  .parentElement
                  ?.classList.add(
                    "has-error"
                  );

              }}
            />

          ) : (

            <div className="explore-store-card-placeholder">

              <span>
                🍛
              </span>

            </div>

          )}


          <div
            className={
              seller.is_open
                ? "explore-store-status is-open"
                : "explore-store-status is-closed"
            }
          >

            <span className="explore-store-status-dot" />

            {seller.is_open
              ? "Buka"
              : "Tutup"}

          </div>

        </div>

      </Link>


      {/* =================================================
         STORE INFO
      ================================================= */}

      <div className="explore-store-card-content">

        <div className="explore-store-heading">

          <Link
            to={`/store/${sellerId}`}
            className="explore-store-card-name"
          >
            {storeName}
          </Link>


          <div className="explore-rating">

            <Star
              size={14}
              fill="currentColor"
            />

            <strong>
              {rating > 0
                ? rating.toFixed(1)
                : "Baru"}
            </strong>

          </div>

        </div>


        {/* =================================================
           LOCATION
        ================================================= */}

        <div className="explore-store-card-location">

          <MapPin size={13} />

          <span>
            {address}
          </span>

          {distance > 0 && (

            <>

              <span className="location-separator">
                •
              </span>

              <span>
                {distance.toFixed(1)} km
              </span>

            </>

          )}

        </div>


        {/* =================================================
           MENU PANEL
        ================================================= */}

        <div className="explore-menu-panel">

          {/* HEADER */}

          <div className="explore-menu-panel-header">

            <div className="explore-menu-available">

              <span className="explore-menu-available-dot" />

              <strong>
                {displayMenus.length > 0
                  ? "Menu tersedia"
                  : "Belum ada menu"}
              </strong>

              {displayMenus.length > 0 && (

                <span className="explore-menu-count">
                  {displayMenus.length}
                </span>

              )}

            </div>


            <Link
              to={`/store/${sellerId}`}
              className="explore-see-menu"
            >

              <span>
                Lihat menu
              </span>

              <ArrowRight size={15} />

            </Link>

          </div>


          {/* =================================================
             MENU CAROUSEL
          ================================================= */}

          {displayMenus.length > 0 ? (

            <div
              className="explore-menu-scroll"
              onWheel={event => {

                /*
                 * Mouse wheel vertikal
                 * diarahkan menjadi horizontal.
                 */

                if (
                  Math.abs(
                    event.deltaY
                  ) >
                  Math.abs(
                    event.deltaX
                  )
                ) {

                  event.currentTarget.scrollLeft +=
                    event.deltaY;

                }

              }}
            >

              {displayMenus.map(
                menu => (

                  <ExploreMenuCard
                    key={
                      getMenuId(menu)
                    }
                    menu={
                      menu
                    }
                    sellerId={
                      sellerId
                    }
                  />

                )
              )}

            </div>

          ) : (

            <div className="explore-no-menu">

              <span>
                🍽️
              </span>

              <span>
                Menu belum tersedia
              </span>

            </div>

          )}

        </div>


        {/* =================================================
           FOOTER
        ================================================= */}

        <div className="explore-store-card-footer">

          <div
            className={
              seller.is_open
                ? "explore-store-card-open"
                : "explore-store-card-closed"
            }
          >

            <Clock3 size={13} />

            <span>
              {seller.is_open
                ? "Buka sekarang"
                : "Sedang tutup"}
            </span>

          </div>


          <Link
            to={`/store/${sellerId}`}
            className="explore-card-detail-link"
          >

            Detail warteg

            <ArrowRight size={13} />

          </Link>

        </div>

      </div>

    </article>
  );
}


/* =====================================================
   SKELETON
===================================================== */

function ExploreSkeleton() {

  return (

    <div className="explore-skeleton-card">

      <div className="explore-skeleton-image" />

      <div className="explore-skeleton-content">

        <div className="explore-skeleton-line large" />

        <div className="explore-skeleton-line medium" />

        <div className="explore-skeleton-line small" />

        <div className="explore-skeleton-menu">

          <span />
          <span />
          <span />

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   COMPONENT
===================================================== */

export default function Explore() {

  const [
    sellers,
    setSellers,
  ] = useState<ExploreSeller[]>([]);


  const [
    menus,
    setMenus,
  ] = useState<ExploreMenu[]>([]);


  const [
    popularSellers,
    setPopularSellers,
  ] = useState<PopularSeller[]>([]);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("all");


  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(
    "Semua Lokasi"
  );


  const [
    sortBy,
    setSortBy,
  ] = useState(
    "recommended"
  );


  const [
    onlyOpen,
    setOnlyOpen,
  ] = useState(false);


  const [
    maxDistance,
    setMaxDistance,
  ] = useState(999);


  const [
    minimumRating,
    setMinimumRating,
  ] = useState(0);


  const [
    showFilter,
    setShowFilter,
  ] = useState(false);


  const [
    showLocation,
    setShowLocation,
  ] = useState(false);


  const [
    loading,
    setLoading,
  ] = useState(true);


  /* =====================================================
     LOAD DATA
  ===================================================== */

  useEffect(() => {

    let mounted = true;


    const loadData =
      async () => {

        setLoading(true);


        const results =
          await Promise.allSettled([

            api.get("/sellers"),

            api.get("/menus"),

            api.get("/explore/popular"),

          ]);


        if (!mounted) {
          return;
        }


        /* =============================================
           SELLERS
        ============================================= */

        const sellerResult =
          results[0];


        if (
          sellerResult.status ===
          "fulfilled"
        ) {

          const sellerData =
            sellerResult.value.data;


          const rawSellers =
            Array.isArray(
              sellerData
            )
              ? sellerData
              : Array.isArray(
                sellerData?.data
              )
                ? sellerData.data
                : Array.isArray(
                  sellerData?.sellers
                )
                  ? sellerData.sellers
                  : [];


          setSellers(
            rawSellers.map(
              (item: any) => ({

                ...item,

                id:
                  item.id ??
                  item.seller_id,

                seller_id:
                  item.seller_id ??
                  item.id,

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
            )
          );

        }


        /* =============================================
           MENUS
        ============================================= */

        const menuResult =
          results[1];


        if (
          menuResult.status ===
          "fulfilled"
        ) {

          const menuData =
            menuResult.value.data;


          const rawMenus =
            Array.isArray(
              menuData
            )
              ? menuData
              : Array.isArray(
                menuData?.data
              )
                ? menuData.data
                : [];


          setMenus(
            rawMenus
          );

        }


        /* =============================================
           POPULAR
        ============================================= */

        const popularResult =
          results[2];


        if (
          popularResult.status ===
          "fulfilled"
        ) {

          const popularData =
            popularResult.value.data;


          const rawPopular =
            Array.isArray(
              popularData
            )
              ? popularData
              : Array.isArray(
                popularData?.data
              )
                ? popularData.data
                : [];


          setPopularSellers(
            rawPopular
          );

        }


        setLoading(false);

      };


    loadData()
      .catch(error => {

        console.error(
          "Gagal mengambil data Explore:",
          error
        );

        if (mounted) {
          setLoading(false);
        }

      });


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

        String(
          menu?.seller_id
        ) ===
        String(
          sellerId
        )
    );

  };


  /* =====================================================
     CATEGORY MENUS
  ===================================================== */

  const getCategoryMenus = (
    sellerId: string | number,
    category: string
  ) => {

    return getSellerMenus(
      sellerId
    ).filter(
      menu =>
        menuMatchesCategory(
          menu,
          category
        )
    );

  };


  /* =====================================================
     POPULAR MAP
  ===================================================== */

  const popularMap =
    useMemo(() => {

      const map =
        new Map<
          string,
          PopularSeller
        >();


      popularSellers.forEach(
        item => {

          map.set(
            String(
              item.seller_id
            ),
            item
          );

        }
      );


      return map;

    }, [
      popularSellers,
    ]);


  /* =====================================================
     FILTER SELLERS
  ===================================================== */

  const filteredSellers =
    useMemo(() => {

      let result =
        [...sellers];


      const keyword =
        normalize(search);


      /* =========================================
         LOCATION
      ========================================= */

      result =
        result.filter(
          seller =>
            sellerMatchesLocation(
              seller,
              selectedLocation
            )
        );


      /* =========================================
         SEARCH
      ========================================= */

      if (keyword) {

        result =
          result.filter(
            seller => {

              const sellerId =
                getSellerId(
                  seller
                );


              const sellerMenus =
                getSellerMenus(
                  sellerId
                );


              const sellerText = [

                seller.store_name,

                seller.name,

                seller.owner,

                seller.description,

                seller.address,

                seller.location,

                seller.city,

                seller.district,

                seller.kecamatan,

                seller.kelurahan,

              ]
                .filter(Boolean)
                .map(normalize)
                .join(" ");


              const menuText =
                sellerMenus
                  .map(
                    menu =>
                      [
                        menu.name,
                        menu.menu_name,
                        menu.description,
                        menu.category,
                        menu.category_name,
                      ]
                        .filter(Boolean)
                        .map(normalize)
                        .join(" ")
                  )
                  .join(" ");


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


      /* =========================================
         CATEGORY
      ========================================= */

      if (
        selectedCategory !==
        "all"
      ) {

        result =
          result.filter(
            seller => {

              const sellerId =
                getSellerId(
                  seller
                );


              return (
                getCategoryMenus(
                  sellerId,
                  selectedCategory
                ).length > 0
              );

            }
          );

      }


      /* =========================================
         OPEN
      ========================================= */

      if (onlyOpen) {

        result =
          result.filter(
            seller =>
              seller.is_open ===
              true
          );

      }


      /* =========================================
         DISTANCE
      ========================================= */

      if (
        maxDistance <
        999
      ) {

        result =
          result.filter(
            seller => {

              const distance =
                Number(
                  seller.distance_km ??
                  0
                );

              return (
                distance <=
                maxDistance
              );

            }
          );

      }


      /* =========================================
         RATING
      ========================================= */

      if (
        minimumRating >
        0
      ) {

        result =
          result.filter(
            seller =>
              Number(
                seller.rating ??
                0
              ) >=
              minimumRating
          );

      }


      /* =========================================
         SORT
      ========================================= */

      if (
        sortBy ===
        "nearest"
      ) {

        result.sort(
          (
            a,
            b
          ) => {

            return (
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
        );

      }


      if (
        sortBy ===
        "rating"
      ) {

        result.sort(
          (
            a,
            b
          ) => {

            return (
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
        );

      }


      if (
        sortBy ===
        "popular"
      ) {

        result.sort(
          (
            a,
            b
          ) => {

            const aPopular =
              popularMap.get(
                getSellerId(a)
              );


            const bPopular =
              popularMap.get(
                getSellerId(b)
              );


            return (
              Number(
                bPopular?.total_orders ??
                0
              ) -
              Number(
                aPopular?.total_orders ??
                0
              )
            );

          }
        );

      }


      return result;

    }, [
      sellers,
      menus,
      popularMap,
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

  const resetFilter =
    () => {

      setSearch("");

      setSelectedCategory(
        "all"
      );

      setSelectedLocation(
        "Semua Lokasi"
      );

      setSortBy(
        "recommended"
      );

      setOnlyOpen(
        false
      );

      setMaxDistance(
        999
      );

      setMinimumRating(
        0
      );

    };


  /* =====================================================
     CATEGORY LABEL
  ===================================================== */

  const selectedCategoryLabel =
    categories.find(
      category =>
        category.value ===
        selectedCategory
    )?.label ??
    "";


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <main className="explore-page">

      {/* =================================================
         HERO
      ================================================= */}

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
            Temukan warteg terdekat,
            lihat menu favorit,
            dan pesan langsung
            dari satu aplikasi.
          </p>

          <div className="explore-trust">

            <span>
              <ShieldCheck size={16} />
              Penjual terpercaya
            </span>

            <span>
              <Zap size={16} />
              Pesan lebih cepat
            </span>

            <span>
              <Bike size={16} />
              Bisa diantar
            </span>

          </div>

        </div>


        {/* =================================================
           LOCATION
        ================================================= */}

        <div className="location-selector">

          <button
            type="button"
            className="location-selector-button"
            onClick={() =>
              setShowLocation(
                value =>
                  !value
              )
            }
          >

            <div className="location-main-icon">
              <MapPin size={21} />
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

                    <MapPin size={15} />

                    <span>
                      {location}
                    </span>

                  </button>

                )
              )}

            </div>

          )}

        </div>

      </section>


      {/* =================================================
         SEARCH
      ================================================= */}

      <section className="explore-search-wrapper">

        <div className="explore-search-box">

          <Search size={20} />

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari warteg atau makanan..."
          />

          {search && (

            <button
              type="button"
              className="clear-search"
              onClick={() =>
                setSearch("")
              }
            >

              <X size={16} />

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
              value =>
                !value
            )
          }
        >

          <SlidersHorizontal size={17} />

          <span>
            Filter
          </span>

        </button>

      </section>


      {/* =================================================
         FILTER
      ================================================= */}

      {showFilter && (

        <section className="explore-filter-panel">

          <div className="filter-control">

            <label>
              <ArrowDownUp size={14} />
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

              <option value="popular">
                Paling sering dipesan
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
              <Navigation size={14} />
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
              <Star size={14} />
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
              Hanya tampilkan warteg
              yang sedang buka
            </span>

          </label>


          <button
            type="button"
            className="reset-filter-button"
            onClick={
              resetFilter
            }
          >
            Reset filter
          </button>

        </section>

      )}


      {/* =================================================
         CATEGORIES
      ================================================= */}

      <section className="explore-category-section">

        <div className="section-header">

          <span className="eyebrow">
            PILIH SESUAI SELERA
          </span>

          <h2>
            Mau makan apa hari ini?
          </h2>

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


      {/* =================================================
         BENEFITS
      ================================================= */}

      <section className="explore-benefit-grid">

        <div className="explore-benefit-card">

          <div className="explore-benefit-icon">
            <MapPin size={19} />
          </div>

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

          <div className="explore-benefit-icon">
            <Bike size={19} />
          </div>

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

          <div className="explore-benefit-icon">
            <Clock3 size={19} />
          </div>

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


      {/* =================================================
         LOADING
      ================================================= */}

      {loading ? (

        <section className="explore-results-section">

          <div className="explore-result-header">

            <div>

              <span className="eyebrow">
                WARTEG DI SEKITARMU
              </span>

              <h2>
                Memuat warteg...
              </h2>

            </div>

          </div>


          <div className="explore-grid">

            {[1, 2, 3, 4].map(
              item => (

                <ExploreSkeleton
                  key={item}
                />

              )
            )}

          </div>

        </section>

      ) : (

        <>

          {/* =================================================
             RESULT HEADER
          ================================================= */}

          <section className="explore-results-section">

            <div className="explore-result-header">

              <div>

                <span className="eyebrow">

                  {search
                    ? "HASIL PENCARIAN"
                    : selectedCategory !== "all"
                      ? `MENU ${selectedCategoryLabel.toUpperCase()}`
                      : "WARTEG DI SEKITARMU"}

                </span>

                <h2>

                  {search

                    ? `${filteredSellers.length} warteg ditemukan`

                    : selectedCategory !== "all"

                      ? `Pilihan ${selectedCategoryLabel}`

                      : "Semua warteg"}

                </h2>

              </div>


              <div className="result-location">

                <MapPin size={14} />

                <span>
                  {selectedLocation}
                </span>

              </div>

            </div>


            {/* =================================================
               DESCRIPTION
            ================================================= */}

            <div className="explore-section-description">

              {selectedCategory !== "all" ? (

                <>

                  <span className="category-description-emoji">

                    {
                      categories.find(
                        category =>
                          category.value ===
                          selectedCategory
                      )?.emoji
                    }

                  </span>

                  <span>

                    Warteg yang menyediakan
                    menu{" "}

                    <strong>
                      {selectedCategoryLabel.toLowerCase()}
                    </strong>

                  </span>

                </>

              ) : search ? (

                <>

                  <Search size={15} />

                  <span>
                    Menampilkan hasil untuk{" "}
                    <strong>
                      "{search}"
                    </strong>
                  </span>

                </>

              ) : (

                <>

                  <ShoppingBag size={15} />

                  <span>
                    Temukan warteg dan lihat
                    menu yang tersedia.
                  </span>

                </>

              )}

            </div>


            {/* =================================================
               RESULTS
            ================================================= */}

            {filteredSellers.length > 0 ? (

              <div className="explore-grid">

                {filteredSellers.map(
                  seller => {

                    const sellerId =
                      getSellerId(
                        seller
                      );


                    const sellerMenus =
                      selectedCategory !== "all"

                        ? getCategoryMenus(
                          sellerId,
                          selectedCategory
                        )

                        : getSellerMenus(
                          sellerId
                        );


                    const popular =
                      popularMap.get(
                        sellerId
                      );


                    return (

                      <ExploreStoreCard
                        key={
                          sellerId
                        }
                        seller={
                          seller
                        }
                        menus={
                          sellerMenus
                        }
                        popularMenus={
                          popular?.popular_menus
                        }
                        categoryLabel={
                          selectedCategory !== "all"
                            ? selectedCategoryLabel
                            : undefined
                        }
                      />

                    );

                  }
                )}

              </div>

            ) : (

              <div className="explore-empty-state">

                <div className="explore-empty-icon">

                  {search
                    ? "🔎"
                    : selectedCategory !== "all"
                      ? "🍽️"
                      : "📍"}

                </div>


                <h3>

                  {search

                    ? "Tidak ada hasil"

                    : selectedCategory !== "all"

                      ? `Belum ada warteg dengan menu ${selectedCategoryLabel.toLowerCase()}`

                      : "Tidak ada warteg yang sesuai"}

                </h3>


                <p>

                  {search

                    ? "Coba cari nama warteg atau makanan lain."

                    : "Coba ubah lokasi atau filter pencarian."}

                </p>


                <button
                  type="button"
                  className="explore-primary-button"
                  onClick={
                    resetFilter
                  }
                >
                  Reset Filter
                </button>

              </div>

            )}

          </section>

        </>

      )}

    </main>
  );
}