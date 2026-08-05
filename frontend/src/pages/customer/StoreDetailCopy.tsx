import {
    ArrowLeft,
    Clock3,
    MapPin,
    ShoppingCart,
    Star,
    Store,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import MenuCard from "../../components/MenuCard";
import api from "../../services/api";

import "../../styles/store-detail.css";

// =====================================================
// TYPES
// =====================================================

interface CustomerSeller {
    id: string;
    seller_id: string;

    store_name: string;
    owner: string;
    phone: string;
    address: string;
    description: string;

    opening_time: string;
    closing_time: string;

    jam_buka: string;
    jam_tutup: string;

    is_open: boolean;

    rating: number;
    distance_km: number;
    total_menu: number;

    image: string;
}

interface MenuItem {
    id?: string;
    menu_id?: string;

    seller_id?: string;

    nama_menu?: string;
    name?: string;

    deskripsi?: string;
    description?: string;

    harga?: number;
    price?: number;

    image?: string;
    gambar?: string;

    kategori?: string;
    category?: string;

    tersedia?: boolean;
    is_available?: boolean;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (
    value: number | string | undefined | null,
) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(amount);
};

// =====================================================
// NORMALIZE BOOLEAN
// =====================================================

const normalizeBoolean = (
    value: unknown,
): boolean => {
    if (value === true) {
        return true;
    }

    if (value === 1) {
        return true;
    }

    if (
        typeof value === "string" &&
        value.toLowerCase() === "true"
    ) {
        return true;
    }

    return false;
};

// =====================================================
// FORMAT TIME
// =====================================================

const formatTime = (
    value: string | undefined,
) => {
    if (!value) {
        return "";
    }

    const text = String(value).trim();

    if (!text) {
        return "";
    }

    // Jika backend mengirim:
    // 08:00:00
    // ubah menjadi:
    // 08:00
    if (
        /^\d{2}:\d{2}:\d{2}$/.test(text)
    ) {
        return text.slice(0, 5);
    }

    return text;
};

// =====================================================
// NORMALIZE MENU
// =====================================================

const normalizeMenu = (
    item: MenuItem,
): MenuItem & {
    normalizedId: string;
    normalizedName: string;
    normalizedPrice: number;
    normalizedImage: string;
    normalizedDescription: string;
    normalizedCategory: string;
    normalizedAvailable: boolean;
} => {
    const id = String(
        item.id ??
        item.menu_id ??
        "",
    );

    const name = String(
        item.nama_menu ??
        item.name ??
        "Menu",
    );

    const price = Number(
        item.harga ??
        item.price ??
        0,
    );

    const image = String(
        item.image ??
        item.gambar ??
        "",
    );

    const description = String(
        item.deskripsi ??
        item.description ??
        "",
    );

    const category = String(
        item.kategori ??
        item.category ??
        "Lainnya",
    );

    const available =
        item.tersedia ??
        item.is_available ??
        true;

    return {
        ...item,

        normalizedId: id,
        normalizedName: name,
        normalizedPrice: price,
        normalizedImage: image,
        normalizedDescription: description,
        normalizedCategory: category,
        normalizedAvailable:
            Boolean(available),
    };
};

// =====================================================
// COMPONENT
// =====================================================

export default function StoreDetail() {
    const {
        seller_id,
        id,
    } = useParams<{
        seller_id?: string;
        id?: string;
    }>();

    const navigate = useNavigate();

    const sellerId =
        seller_id ||
        id ||
        "";

    // ===================================================
    // STATE
    // ===================================================

    const [
        seller,
        setSeller,
    ] = useState<CustomerSeller | null>(
        null,
    );

    const [
        menus,
        setMenus,
    ] = useState<MenuItem[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        menuLoading,
        setMenuLoading,
    ] = useState(true);

    const [
        error,
        setError,
    ] = useState("");

    const [
        activeCategory,
        setActiveCategory,
    ] = useState("Semua");

    const [
        cartItems,
        setCartItems,
    ] = useState<CartItem[]>([]);

    // ===================================================
    // LOAD SELLER
    // ===================================================

    useEffect(() => {
        if (!sellerId) {
            setError(
                "ID warteg tidak ditemukan.",
            );

            setLoading(false);

            return;
        }

        const loadSeller = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    `/sellers/${sellerId}`,
                );

                const responseData =
                    response?.data;

                const sellerData =
                    responseData?.data ??
                    responseData;

                if (
                    !sellerData ||
                    responseData?.success === false
                ) {
                    throw new Error(
                        responseData?.message ||
                        "Profil warteg tidak ditemukan.",
                    );
                }

                const openingTime =
                    String(
                        sellerData.opening_time ??
                        sellerData.jam_buka ??
                        "",
                    );

                const closingTime =
                    String(
                        sellerData.closing_time ??
                        sellerData.jam_tutup ??
                        "",
                    );

                setSeller({
                    id: String(
                        sellerData.id ??
                        sellerData.seller_id ??
                        sellerId,
                    ),

                    seller_id: String(
                        sellerData.seller_id ??
                        sellerData.id ??
                        sellerId,
                    ),

                    store_name: String(
                        sellerData.store_name ??
                        sellerData.nama_warteg ??
                        "Warteg",
                    ),

                    owner: String(
                        sellerData.owner ??
                        sellerData.nama_pemilik ??
                        "",
                    ),

                    phone: String(
                        sellerData.phone ??
                        sellerData.nomor_hp ??
                        "",
                    ),

                    address: String(
                        sellerData.address ??
                        sellerData.alamat ??
                        "",
                    ),

                    description: String(
                        sellerData.description ??
                        sellerData.deskripsi ??
                        "",
                    ),

                    opening_time:
                        openingTime,

                    closing_time:
                        closingTime,

                    jam_buka:
                        String(
                            sellerData.jam_buka ??
                            sellerData.opening_time ??
                            "",
                        ),

                    jam_tutup:
                        String(
                            sellerData.jam_tutup ??
                            sellerData.closing_time ??
                            "",
                        ),

                    is_open:
                        normalizeBoolean(
                            sellerData.is_open,
                        ),

                    rating: Number(
                        sellerData.rating ??
                        0,
                    ),

                    distance_km: Number(
                        sellerData.distance_km ??
                        0,
                    ),

                    total_menu: Number(
                        sellerData.total_menu ??
                        0,
                    ),

                    image: String(
                        sellerData.image ??
                        sellerData.gambar ??
                        "",
                    ),
                });
            } catch (err: any) {
                console.error(
                    "GET SELLER DETAIL ERROR:",
                    err,
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Gagal memuat data warteg.",
                );
            } finally {
                setLoading(false);
            }
        };

        loadSeller();
    }, [sellerId]);

    // ===================================================
    // LOAD MENUS
    // ===================================================

    useEffect(() => {
        if (!sellerId) {
            setMenuLoading(false);
            return;
        }

        const loadMenus = async () => {
            try {
                setMenuLoading(true);

                const response = await api.get(
                    `/menus?seller_id=${sellerId}`,
                );

                const responseData =
                    response?.data;

                let menuData =
                    responseData?.data ??
                    responseData;

                if (
                    !Array.isArray(menuData)
                ) {
                    menuData =
                        menuData?.menus ??
                        menuData?.items ??
                        [];
                }

                setMenus(
                    Array.isArray(menuData)
                        ? menuData
                        : [],
                );
            } catch (err) {
                console.error(
                    "GET MENUS ERROR:",
                    err,
                );

                setMenus([]);
            } finally {
                setMenuLoading(false);
            }
        };

        loadMenus();
    }, [sellerId]);

    // ===================================================
    // NORMALIZED MENUS
    // ===================================================

    const normalizedMenus =
        useMemo(() => {
            return menus.map(
                normalizeMenu,
            );
        }, [menus]);

    // ===================================================
    // CATEGORIES
    // ===================================================

    const categories =
        useMemo(() => {
            const values =
                normalizedMenus
                    .map(
                        (item) =>
                            item.normalizedCategory,
                    )
                    .filter(Boolean);

            return [
                "Semua",
                ...Array.from(
                    new Set(values),
                ),
            ];
        }, [normalizedMenus]);

    // ===================================================
    // FILTER MENU
    // ===================================================

    const filteredMenus =
        useMemo(() => {
            if (
                activeCategory ===
                "Semua"
            ) {
                return normalizedMenus;
            }

            return normalizedMenus.filter(
                (item) =>
                    item.normalizedCategory ===
                    activeCategory,
            );
        }, [
            normalizedMenus,
            activeCategory,
        ]);

    // ===================================================
    // CART COUNT
    // ===================================================

    const cartCount =
        useMemo(() => {
            return cartItems.reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    item.quantity,
                0,
            );
        }, [cartItems]);

    // ===================================================
    // CART TOTAL
    // ===================================================

    const cartTotal =
        useMemo(() => {
            return cartItems.reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    item.price *
                    item.quantity,
                0,
            );
        }, [cartItems]);

    // ===================================================
    // ADD TO CART
    // ===================================================

    const handleAddToCart = (
        menu: ReturnType<
            typeof normalizeMenu
        >,
    ) => {
        const menuId =
            menu.normalizedId ||
            `${sellerId}-${menu.normalizedName}`;

        setCartItems(
            (current) => {
                const existing =
                    current.find(
                        (item) =>
                            item.id ===
                            menuId,
                    );

                if (existing) {
                    return current.map(
                        (item) =>
                            item.id ===
                                menuId
                                ? {
                                    ...item,
                                    quantity:
                                        item.quantity +
                                        1,
                                }
                                : item,
                    );
                }

                return [
                    ...current,
                    {
                        id: menuId,

                        name:
                            menu.normalizedName,

                        price:
                            menu.normalizedPrice,

                        quantity: 1,

                        image:
                            menu.normalizedImage,
                    },
                ];
            },
        );
    };

    // ===================================================
    // BACK
    // ===================================================

    const handleBack = () => {
        navigate(-1);
    };

    // ===================================================
    // CART
    // ===================================================

    const handleCart = () => {
        if (
            cartItems.length === 0
        ) {
            return;
        }

        try {
            localStorage.setItem(
                "wartegkita_cart",
                JSON.stringify(
                    cartItems,
                ),
            );

            localStorage.setItem(
                "wartegkita_cart_seller_id",
                sellerId,
            );
        } catch (err) {
            console.error(
                "SAVE CART ERROR:",
                err,
            );
        }

        navigate("/cart");
    };

    // ===================================================
    // LOADING
    // ===================================================

    if (loading) {
        return (
            <main className="store-loading">
                <div className="store-loading-spinner" />

                <h2>
                    Memuat warteg...
                </h2>

                <p>
                    Mohon tunggu sebentar.
                </p>
            </main>
        );
    }

    // ===================================================
    // ERROR
    // ===================================================

    if (
        error ||
        !seller
    ) {
        return (
            <main className="store-error">
                <section className="store-error-card">

                    <div className="store-error-icon">
                        <Store size={24} />
                    </div>

                    <h2>
                        Warteg tidak ditemukan
                    </h2>

                    <p>
                        {error ||
                            "Data warteg tidak tersedia."}
                    </p>

                    <div className="store-error-actions">

                        <button
                            type="button"
                            onClick={
                                handleBack
                            }
                        >
                            <ArrowLeft
                                size={16}
                                style={{
                                    verticalAlign:
                                        "middle",
                                    marginRight:
                                        "6px",
                                }}
                            />

                            Kembali
                        </button>

                    </div>

                </section>
            </main>
        );
    }

    // ===================================================
    // OPERATIONAL HOURS
    // ===================================================

    const openingTime =
        formatTime(
            seller.opening_time ||
            seller.jam_buka,
        );

    const closingTime =
        formatTime(
            seller.closing_time ||
            seller.jam_tutup,
        );

    const hasOperationalHours =
        Boolean(
            openingTime &&
            closingTime,
        );

    // ===================================================
    // RENDER
    // ===================================================

    return (
        <main className="store-detail-page">

            {/* =================================================
          HERO
      ================================================= */}

            <section className="store-hero">

                {/* BACK BUTTON */}

                <button
                    type="button"
                    className="back-button"
                    onClick={
                        handleBack
                    }
                    aria-label="Kembali"
                >
                    <ArrowLeft
                        size={18}
                    />

                    <span>
                        Kembali
                    </span>
                </button>

                {/* =================================================
            STORE STATUS + OPERATING HOURS
        ================================================= */}

                <div
                    className={
                        seller.is_open
                            ? "store-status open"
                            : "store-status closed"
                    }
                >

                    <span className="store-status-dot" />

                    <div className="store-status-content">

                        <strong>
                            {seller.is_open
                                ? "Sedang Buka"
                                : "Sedang Tutup"}
                        </strong>

                        {hasOperationalHours && (
                            <span className="store-operating-hours">
                                <Clock3
                                    size={14}
                                />

                                {openingTime}
                                {" - "}
                                {closingTime}
                            </span>
                        )}

                    </div>

                </div>

                {/* =================================================
            HERO CONTENT
        ================================================= */}

                <div className="store-header-content">

                    <span className="eyebrow">
                        WARTEGKITA
                    </span>

                    <h1>
                        {seller.store_name ||
                            "Warteg"}
                    </h1>

                    {seller.description && (
                        <p>
                            {seller.description}
                        </p>
                    )}

                    {/* META */}

                    <div className="store-meta">

                        <div className="meta-card">

                            <Star
                                size={18}
                                fill="currentColor"
                            />

                            <strong>
                                {seller.rating >
                                    0
                                    ? seller.rating.toFixed(
                                        1,
                                    )
                                    : "Baru"}
                            </strong>

                            {seller.rating >
                                0 && (
                                    <span>
                                        Rating
                                    </span>
                                )}

                        </div>

                        {seller.distance_km >
                            0 && (
                                <div className="meta-card">

                                    <MapPin
                                        size={18}
                                    />

                                    <strong>
                                        {seller.distance_km}
                                        {" "}
                                        km
                                    </strong>

                                </div>
                            )}

                        {seller.total_menu >
                            0 && (
                                <div className="meta-card">

                                    <Store
                                        size={18}
                                    />

                                    <strong>
                                        {seller.total_menu}
                                        {" "}
                                        menu
                                    </strong>

                                </div>
                            )}

                    </div>

                    {/* ADDRESS */}

                    {seller.address && (
                        <div className="store-address">

                            <MapPin
                                size={18}
                            />

                            <span>
                                {seller.address}
                            </span>

                        </div>
                    )}

                </div>

            </section>

            {/* =================================================
          MENU SECTION
      ================================================= */}

            <section className="store-menu-section">

                {/* HEADER */}

                <div className="menu-section-header">

                    <span className="menu-section-eyebrow">
                        PILIHAN MENU
                    </span>

                    <h2>
                        Menu Warteg
                    </h2>

                    <p>
                        Pilih makanan favoritmu
                        dan nikmati berbagai
                        pilihan masakan rumahan.
                    </p>

                </div>

                {/* CATEGORY */}

                {categories.length >
                    1 && (
                        <div className="category-list">

                            {categories.map(
                                (category) => (
                                    <button
                                        key={
                                            category
                                        }
                                        type="button"
                                        className={
                                            activeCategory ===
                                                category
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setActiveCategory(
                                                category,
                                            )
                                        }
                                    >
                                        {category}
                                    </button>
                                ),
                            )}

                        </div>
                    )}

                {/* MENU */}

                {menuLoading ? (
                    <div className="store-loading">

                        <div className="store-loading-spinner" />

                        <p>
                            Memuat menu...
                        </p>

                    </div>
                ) : filteredMenus.length ===
                    0 ? (
                    <div className="store-empty-menu">

                        <div className="store-empty-icon">
                            <Store
                                size={38}
                            />
                        </div>

                        <h3>
                            Belum ada menu
                        </h3>

                        <p>
                            Warteg ini belum
                            menambahkan menu.
                        </p>

                    </div>
                ) : (
                    <div className="menu-grid">

                        {filteredMenus.map(
                            (menu) => (
                                <MenuCard
                                    key={
                                        menu.normalizedId ||
                                        `${sellerId}-${menu.normalizedName}`
                                    }
                                    menu={{
                                        ...menu,

                                        id:
                                            menu.normalizedId,

                                        nama_menu:
                                            menu.normalizedName,

                                        harga:
                                            menu.normalizedPrice,

                                        image:
                                            menu.normalizedImage,

                                        deskripsi:
                                            menu.normalizedDescription,

                                        kategori:
                                            menu.normalizedCategory,

                                        tersedia:
                                            menu.normalizedAvailable,

                                        is_available:
                                            menu.normalizedAvailable,
                                    } as any}
                                    onAddToCart={() =>
                                        handleAddToCart(
                                            menu,
                                        )
                                    }
                                />
                            ),
                        )}

                    </div>
                )}

            </section>

            {/* =================================================
          FLOATING CART
      ================================================= */}

            {cartCount > 0 && (
                <button
                    type="button"
                    className="floating-cart-bar"
                    onClick={
                        handleCart
                    }
                    aria-label="Lihat keranjang"
                >

                    {/* ICON */}

                    <div className="floating-cart-icon">

                        <ShoppingCart
                            size={21}
                        />

                        <span>
                            {cartCount >
                                99
                                ? "99+"
                                : cartCount}
                        </span>

                    </div>

                    {/* LEFT */}

                    <div className="floating-left">

                        <strong>
                            {cartCount}{" "}
                            item
                            {cartCount >
                                1
                                ? "s"
                                : ""}
                        </strong>

                        <span>
                            {formatCurrency(
                                cartTotal,
                            )}
                        </span>

                    </div>

                    {/* RIGHT */}

                    <div className="floating-right">

                        <span>
                            Lihat
                        </span>

                        Keranjang

                        <ArrowLeft
                            size={15}
                            style={{
                                transform:
                                    "rotate(180deg)",
                            }}
                        />

                    </div>

                </button>
            )}

        </main>
    );
}