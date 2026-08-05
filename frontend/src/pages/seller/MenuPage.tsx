import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
} from "react";

import {
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    Image as ImageIcon,
    Package,
    Coffee,
    UtensilsCrossed,
} from "lucide-react";

import Swal from "sweetalert2";
import { useParams } from "react-router-dom";

import SellerNavbar from "./SellerNavbar";

import api from "../../services/api";

import "../../styles/seller/MenuPage.css";


/* =====================================================
   TYPES
===================================================== */

interface Menu {
    id: string;
    seller_id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image: string;
    available: boolean;
    created_at: string;
    updated_at: string;
}


/* =====================================================
   EMPTY MENU
===================================================== */

/**
 * Membuat object menu kosong untuk form tambah menu.
 */
const createEmptyMenu = (
    sellerId: string = ""
): Menu => ({
    id: "",
    seller_id: sellerId,
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "Makanan",
    image: "",
    available: true,
    created_at: "",
    updated_at: "",
});


/* =====================================================
   UUID VALIDATION
===================================================== */

/**
 * Memvalidasi UUID yang digunakan oleh backend.
 *
 * Backend menggunakan UUID termasuk UUIDv7.
 *
 * Contoh UUIDv7:
 *
 * 019fb5bd-1a29-7bfa-9675-d2b1c228388f
 *
 * Posisi karakter ke-13 menunjukkan versi UUID.
 * Karena aplikasi menggunakan UUIDv7, versi 7 harus
 * diterima oleh validasi frontend.
 */
const isValidUUID = (
    value?: string
): boolean => {

    if (!value) {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
};


/* =====================================================
   IMAGE URL
===================================================== */

/**
 * Mengubah path gambar dari backend menjadi URL
 * yang dapat digunakan oleh browser.
 *
 * Mendukung:
 * - http://
 * - https://
 * - blob:
 * - relative path
 */
const getImageUrl = (
    image?: string
): string => {

    if (!image) {
        return "";
    }

    const value = image.trim();

    if (!value) {
        return "";
    }

    if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("blob:")
    ) {
        return value;
    }

    const baseURL =
        api.defaults.baseURL || "";

    let origin =
        baseURL;

    try {

        if (
            baseURL.startsWith("http://") ||
            baseURL.startsWith("https://")
        ) {

            origin =
                new URL(
                    baseURL
                ).origin;
        }

    } catch {

        origin =
            baseURL;
    }

    origin =
        origin.replace(
            /\/+$/,
            ""
        );

    const encodedPath =
        value
            .split("/")
            .map(
                part =>
                    encodeURIComponent(
                        part
                    )
            )
            .join("/");

    return `${origin}/${encodedPath}`;
};


/* =====================================================
   COMPONENT
===================================================== */

export default function MenuPage() {

    /* =================================================
       ROUTE PARAMETER
    ================================================= */

    const {
        seller_id,
    } = useParams<{
        seller_id: string;
    }>();


    /* =================================================
       SIDEBAR STATE
    ================================================= */

    const [
        openMenu,
        setOpenMenu,
    ] = useState(true);


    /* =================================================
       MENU DATA
    ================================================= */

    const [
        menus,
        setMenus,
    ] = useState<Menu[]>([]);


    const [
        loading,
        setLoading,
    ] = useState(true);


    /* =================================================
       SEARCH & FILTER
    ================================================= */

    const [
        search,
        setSearch,
    ] = useState("");


    const [
        category,
        setCategory,
    ] = useState("Semua");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("Semua");


    const [
        sortBy,
        setSortBy,
    ] = useState("Terbaru");


    /* =================================================
       MODAL STATE
    ================================================= */

    const [
        showModal,
        setShowModal,
    ] = useState(false);


    const [
        editing,
        setEditing,
    ] = useState(false);


    /* =================================================
       FORM STATE
    ================================================= */

    const [
        menu,
        setMenu,
    ] = useState<Menu>(
        createEmptyMenu(
            seller_id || ""
        )
    );


    /* =================================================
       IMAGE STATE
    ================================================= */

    const [
        preview,
        setPreview,
    ] = useState("");


    const [
        imageFile,
        setImageFile,
    ] = useState<File | null>(null);


    /* =================================================
       SAVE STATE
    ================================================= */

    const [
        saving,
        setSaving,
    ] = useState(false);


    /* =================================================
       SELLER ID VALIDATION
    ================================================= */

    const sellerIdIsValid =
        useMemo(
            () =>
                isValidUUID(
                    seller_id
                ),
            [seller_id]
        );


    /* =================================================
       LOAD MENUS
    ================================================= */

    const loadMenus =
        async () => {

            if (!seller_id) {

                console.error(
                    "Seller ID tidak tersedia."
                );

                setMenus([]);
                setLoading(false);

                return;
            }


            if (!sellerIdIsValid) {

                console.error(
                    "Seller ID bukan UUID:",
                    seller_id
                );

                setMenus([]);
                setLoading(false);

                return;
            }


            try {

                setLoading(true);


                const response =
                    await api.get(
                        `/menus?seller_id=${encodeURIComponent(
                            seller_id
                        )}`
                    );


                const data =
                    Array.isArray(
                        response.data
                    )
                        ? response.data
                        : [];


                /**
                 * Normalisasi response backend
                 * agar bentuk data konsisten
                 * dengan interface Menu.
                 */
                const normalized:
                    Menu[] =
                    data.map(
                        (
                            item: any
                        ) => ({

                            id:
                                String(
                                    item?.id ?? ""
                                ),

                            seller_id:
                                String(
                                    item?.seller_id ??
                                    seller_id
                                ),

                            name:
                                String(
                                    item?.name ?? ""
                                ),

                            description:
                                String(
                                    item?.description ??
                                    ""
                                ),

                            price:
                                Number(
                                    item?.price ?? 0
                                ),

                            stock:
                                Number(
                                    item?.stock ?? 0
                                ),

                            category:
                                String(
                                    item?.category ??
                                    "Makanan"
                                ),

                            image:
                                String(
                                    item?.image ?? ""
                                ),

                            available:
                                item?.available !== false,

                            created_at:
                                String(
                                    item?.created_at ??
                                    ""
                                ),

                            updated_at:
                                String(
                                    item?.updated_at ??
                                    ""
                                ),

                        })
                    );


                setMenus(
                    normalized
                );

            } catch (
            error: any
            ) {

                console.error(
                    "GET MENU ERROR:",
                    error
                );

                console.error(
                    "GET MENU RESPONSE:",
                    error?.response?.data
                );


                Swal.fire({

                    icon:
                        "error",

                    title:
                        "Gagal",

                    text:
                        error?.response?.data?.error ||
                        error?.response?.data?.message ||
                        "Tidak dapat mengambil data menu.",

                });

            } finally {

                setLoading(false);

            }
        };


    /* =================================================
       LOAD DATA WHEN SELLER CHANGES
    ================================================= */

    useEffect(() => {

        loadMenus();

    }, [
        seller_id,
        sellerIdIsValid,
    ]);


    /* =================================================
       STATISTICS
    ================================================= */

    const totalMenu =
        menus.length;


    const totalFood =
        menus.filter(
            item =>
                item.category
                    .toLowerCase() ===
                "makanan"
        ).length;


    const totalDrink =
        menus.filter(
            item =>
                item.category
                    .toLowerCase() ===
                "minuman"
        ).length;


    const outStock =
        menus.filter(
            item =>
                item.stock <= 0 ||
                !item.available
        ).length;


    /* =================================================
       CATEGORY OPTIONS
    ================================================= */

    const categories =
        useMemo(() => {

            return Array.from(
                new Set(
                    menus
                        .map(
                            item =>
                                item.category
                        )
                        .filter(Boolean)
                )
            );

        }, [
            menus,
        ]);


    /* =================================================
       FILTER & SORT MENU
    ================================================= */

    const filteredMenus =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();


            const result =
                menus.filter(
                    item => {

                        const matchesSearch =
                            !keyword ||
                            item.name
                                .toLowerCase()
                                .includes(
                                    keyword
                                );


                        const matchesCategory =
                            category === "Semua" ||
                            item.category === category;


                        const matchesStatus =
                            statusFilter === "Semua" ||
                            (
                                statusFilter === "Tersedia" &&
                                item.available
                            ) ||
                            (
                                statusFilter === "Habis" &&
                                !item.available
                            );


                        return (
                            matchesSearch &&
                            matchesCategory &&
                            matchesStatus
                        );
                    }
                );


            /* Sort menu berdasarkan pilihan user. */

            if (
                sortBy === "Nama A-Z"
            ) {

                result.sort(
                    (
                        a,
                        b
                    ) =>
                        a.name.localeCompare(
                            b.name,
                            "id"
                        )
                );
            }


            if (
                sortBy === "Harga Murah"
            ) {

                result.sort(
                    (
                        a,
                        b
                    ) =>
                        a.price -
                        b.price
                );
            }


            if (
                sortBy === "Harga Mahal"
            ) {

                result.sort(
                    (
                        a,
                        b
                    ) =>
                        b.price -
                        a.price
                );
            }


            if (
                sortBy === "Terbaru"
            ) {

                result.sort(
                    (
                        a,
                        b
                    ) => {

                        const dateA =
                            new Date(
                                a.created_at
                            ).getTime();


                        const dateB =
                            new Date(
                                b.created_at
                            ).getTime();


                        return (
                            dateB -
                            dateA
                        );
                    }
                );
            }


            return result;

        }, [
            menus,
            search,
            category,
            statusFilter,
            sortBy,
        ]);


    /* =================================================
       IMAGE UPLOAD
    ================================================= */

    const handleImage = (
        event: ChangeEvent<HTMLInputElement>
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        /* Pastikan file yang dipilih adalah gambar. */

        if (
            !file.type.startsWith("image/")
        ) {

            Swal.fire({

                icon:
                    "warning",

                title:
                    "File Tidak Valid",

                text:
                    "Silakan pilih file gambar.",

            });

            event.target.value = "";

            return;
        }


        /* Batasi ukuran gambar maksimal 5 MB. */

        const maxSize =
            5 * 1024 * 1024;


        if (
            file.size > maxSize
        ) {

            Swal.fire({

                icon:
                    "warning",

                title:
                    "Ukuran Terlalu Besar",

                text:
                    "Ukuran gambar maksimal 5 MB.",

            });

            event.target.value = "";

            return;
        }


        /* Hapus object URL sebelumnya agar tidak terjadi memory leak. */

        if (
            preview.startsWith("blob:")
        ) {

            URL.revokeObjectURL(
                preview
            );
        }


        const objectUrl =
            URL.createObjectURL(
                file
            );


        setImageFile(
            file
        );


        setPreview(
            objectUrl
        );
    };


    /* =================================================
       OPEN ADD MENU
    ================================================= */

    const openAdd = () => {

        if (!seller_id) {

            Swal.fire({

                icon:
                    "error",

                title:
                    "Seller Tidak Ditemukan",

                text:
                    "Seller ID tidak tersedia pada URL.",

            });

            return;
        }


        if (!sellerIdIsValid) {

            Swal.fire({

                icon:
                    "error",

                title:
                    "Seller ID Tidak Valid",

                text:
                    `Seller ID "${seller_id}" bukan UUID yang valid.`,

            });

            return;
        }


        setEditing(false);


        setMenu(
            createEmptyMenu(
                seller_id
            )
        );


        setPreview("");


        setImageFile(null);


        setShowModal(true);
    };


    /* =================================================
       OPEN EDIT MENU
    ================================================= */

    const openEdit = (
        item: Menu
    ) => {

        if (
            !seller_id ||
            !sellerIdIsValid
        ) {

            Swal.fire({

                icon:
                    "error",

                title:
                    "Seller ID Tidak Valid",

                text:
                    "Seller ID pada URL tidak valid.",

            });

            return;
        }


        setEditing(true);


        /**
         * Seller ID diambil dari URL.
         * Ini mencegah menu diedit menggunakan
         * seller ID yang berbeda dari halaman.
         */
        setMenu({

            ...item,

            seller_id:
                seller_id,

        });


        setPreview(
            item.image
                ? getImageUrl(
                    item.image
                )
                : ""
        );


        setImageFile(null);


        setShowModal(true);
    };


    /* =================================================
       CLOSE MODAL
    ================================================= */

    const closeModal = () => {

        /* Bersihkan object URL preview jika berasal dari file lokal. */

        if (
            preview.startsWith("blob:")
        ) {

            URL.revokeObjectURL(
                preview
            );
        }


        setShowModal(false);


        setEditing(false);


        setMenu(
            createEmptyMenu(
                seller_id || ""
            )
        );


        setPreview("");


        setImageFile(null);
    };


    /* =================================================
       UPDATE STOCK
    ================================================= */

    const updateStock = (
        action:
            | "plus"
            | "minus"
    ) => {

        setMenu(
            previous => {

                const nextStock =
                    action === "plus"
                        ? previous.stock + 1
                        : Math.max(
                            0,
                            previous.stock - 1
                        );


                return {

                    ...previous,

                    stock:
                        nextStock,

                };
            }
        );
    };


    /* =================================================
       DELETE MENU
    ================================================= */

    const removeMenu =
        async (
            id: string
        ) => {

            if (!id) {
                return;
            }


            const confirmation =
                await Swal.fire({

                    title:
                        "Hapus Menu?",

                    text:
                        "Menu yang dihapus tidak bisa dikembalikan.",

                    icon:
                        "warning",

                    showCancelButton:
                        true,

                    confirmButtonText:
                        "Ya, Hapus",

                    cancelButtonText:
                        "Batal",

                    reverseButtons:
                        true,

                });


            if (
                !confirmation.isConfirmed
            ) {
                return;
            }


            try {

                await api.delete(
                    `/menus/${encodeURIComponent(
                        id
                    )}`
                );


                await Swal.fire({

                    icon:
                        "success",

                    title:
                        "Berhasil",

                    text:
                        "Menu berhasil dihapus.",

                    timer:
                        1500,

                    showConfirmButton:
                        false,

                });


                await loadMenus();

            } catch (
            error: any
            ) {

                console.error(
                    "DELETE MENU ERROR:",
                    error
                );


                Swal.fire({

                    icon:
                        "error",

                    title:
                        "Gagal",

                    text:
                        error?.response?.data?.error ||
                        error?.response?.data?.message ||
                        "Tidak dapat menghapus menu.",

                });
            }
        };


    /* =================================================
       SAVE MENU
    ================================================= */

    const saveMenu =
        async () => {

            /* Validasi seller ID sebelum request. */

            if (!seller_id) {

                Swal.fire({

                    icon:
                        "error",

                    title:
                        "Gagal",

                    text:
                        "Seller ID tidak ditemukan.",

                });

                return;
            }


            if (!sellerIdIsValid) {

                Swal.fire({

                    icon:
                        "error",

                    title:
                        "Gagal",

                    text:
                        `Seller ID "${seller_id}" bukan UUID yang valid.`,

                });

                return;
            }


            /* Ambil nilai form yang sudah dibersihkan. */

            const name =
                menu.name.trim();


            const description =
                menu.description.trim();


            /* Validasi nama menu. */

            if (!name) {

                Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Nama Menu Kosong",

                    text:
                        "Silakan masukkan nama menu.",

                });

                return;
            }


            /* Validasi harga. */

            if (
                menu.price <= 0
            ) {

                Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Harga Tidak Valid",

                    text:
                        "Harga menu harus lebih dari 0.",

                });

                return;
            }


            /* Validasi stok. */

            if (
                menu.stock < 0
            ) {

                Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Stok Tidak Valid",

                    text:
                        "Stok tidak boleh kurang dari 0.",

                });

                return;
            }


            /* Validasi kategori. */

            if (
                !menu.category.trim()
            ) {

                Swal.fire({

                    icon:
                        "warning",

                    title:
                        "Kategori Kosong",

                    text:
                        "Kategori menu wajib diisi.",

                });

                return;
            }


            /* Cegah request dikirim dua kali. */

            if (saving) {
                return;
            }


            try {

                setSaving(true);


                /* =====================================
                   BUILD FORM DATA
                ===================================== */

                const form =
                    new FormData();


                form.append(
                    "seller_id",
                    seller_id
                );


                form.append(
                    "name",
                    name
                );


                form.append(
                    "description",
                    description
                );


                form.append(
                    "price",
                    String(
                        menu.price
                    )
                );


                form.append(
                    "stock",
                    String(
                        menu.stock
                    )
                );


                form.append(
                    "category",
                    menu.category.trim()
                );


                form.append(
                    "available",
                    menu.available
                        ? "true"
                        : "false"
                );


                /**
                 * File hanya dikirim jika user
                 * memilih gambar baru.
                 *
                 * Saat edit tanpa memilih file,
                 * gambar lama tetap digunakan
                 * oleh backend.
                 */
                if (imageFile) {

                    form.append(
                        "image",
                        imageFile
                    );
                }


                /* =====================================
                   SEND REQUEST
                ===================================== */

                if (editing) {

                    if (!menu.id) {

                        Swal.fire({

                            icon:
                                "error",

                            title:
                                "Gagal",

                            text:
                                "ID menu tidak ditemukan.",

                        });

                        return;
                    }


                    /**
                     * Update menu:
                     * PUT /menus/:id
                     */
                    await api.put(
                        `/menus/${encodeURIComponent(
                            menu.id
                        )}`,
                        form
                    );

                } else {

                    /**
                     * Tambah menu:
                     * POST /menus
                     */
                    await api.post(
                        "/menus",
                        form
                    );
                }


                /* =====================================
                   SUCCESS
                ===================================== */

                await Swal.fire({

                    icon:
                        "success",

                    title:
                        "Berhasil",

                    text:
                        editing
                            ? "Menu berhasil diperbarui."
                            : "Menu berhasil ditambahkan.",

                    timer:
                        1500,

                    showConfirmButton:
                        false,

                });


                closeModal();


                await loadMenus();

            } catch (
            error: any
            ) {

                console.error(
                    "SAVE MENU ERROR:",
                    error
                );


                console.error(
                    "SAVE MENU RESPONSE:",
                    error?.response?.data
                );


                const backendError =
                    error?.response?.data;


                Swal.fire({

                    icon:
                        "error",

                    title:
                        "Gagal",

                    text:
                        backendError?.error ||
                        backendError?.message ||
                        error?.message ||
                        "Tidak dapat menyimpan menu.",

                });

            } finally {

                setSaving(false);

            }
        };


    /* =================================================
       RENDER
    ================================================= */

    return (

        <div
            className={
                `seller-layout ${openMenu
                    ? "menu-open"
                    : "menu-close"
                }`
            }
        >

            {/* =========================================
                SELLER NAVBAR
            ========================================= */}

            <SellerNavbar
                openMenu={
                    openMenu
                }
                setOpenMenu={
                    setOpenMenu
                }
            />


            <main
                className="seller-content"
            >

                {/* =====================================
                    HEADER
                ===================================== */}

                <div
                    className="menu-header"
                >

                    <div>

                        <h1>
                            Daftar Menu
                        </h1>

                        <p>
                            Kelola makanan dan minuman warteg kamu
                        </p>

                    </div>


                    <button
                        type="button"
                        className="add-button"
                        onClick={
                            openAdd
                        }
                    >

                        <Plus
                            size={18}
                        />

                        Tambah Menu

                    </button>

                </div>


                {/* =====================================
                    STATISTICS
                ===================================== */}

                <div
                    className="menu-stats"
                >

                    {/* TOTAL MENU */}

                    <div
                        className="stat-card"
                    >

                        <div
                            className="stat-icon total"
                        >

                            <Package
                                size={28}
                            />

                        </div>


                        <div
                            className="stat-content"
                        >

                            <span>
                                Total Menu
                            </span>

                            <h2>
                                {totalMenu}
                            </h2>

                            <small>
                                Semua menu
                            </small>

                        </div>

                    </div>


                    {/* MAKANAN */}

                    <div
                        className="stat-card"
                    >

                        <div
                            className="stat-icon food"
                        >

                            <UtensilsCrossed
                                size={28}
                            />

                        </div>


                        <div
                            className="stat-content"
                        >

                            <span>
                                Makanan
                            </span>

                            <h2>
                                {totalFood}
                            </h2>

                            <small>
                                Menu makanan
                            </small>

                        </div>

                    </div>


                    {/* MINUMAN */}

                    <div
                        className="stat-card"
                    >

                        <div
                            className="stat-icon drink"
                        >

                            <Coffee
                                size={28}
                            />

                        </div>


                        <div
                            className="stat-content"
                        >

                            <span>
                                Minuman
                            </span>

                            <h2>
                                {totalDrink}
                            </h2>

                            <small>
                                Menu minuman
                            </small>

                        </div>

                    </div>


                    {/* STOK HABIS */}

                    <div
                        className="stat-card"
                    >

                        <div
                            className="stat-icon stock"
                        >

                            <Package
                                size={28}
                            />

                        </div>


                        <div
                            className="stat-content"
                        >

                            <span>
                                Stok Habis
                            </span>

                            <h2>
                                {outStock}
                            </h2>

                            <small>
                                Perlu isi ulang
                            </small>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    TOOLBAR
                ===================================== */}

                <div
                    className="menu-toolbar"
                >

                    {/* SEARCH */}

                    <div
                        className="search-box"
                    >

                        <Search
                            size={18}
                        />

                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={
                                search
                            }
                            onChange={
                                event =>
                                    setSearch(
                                        event.target.value
                                    )
                            }
                        />

                    </div>


                    {/* FILTERS */}

                    <div
                        className="toolbar-actions"
                    >

                        {/* CATEGORY */}

                        <div
                            className="filter-group"
                        >

                            <Filter
                                size={18}
                            />

                            <select
                                value={
                                    category
                                }
                                onChange={
                                    event =>
                                        setCategory(
                                            event.target.value
                                        )
                                }
                            >

                                <option value="Semua">
                                    Semua Kategori
                                </option>


                                {
                                    categories.map(
                                        item => (

                                            <option
                                                key={
                                                    item
                                                }
                                                value={
                                                    item
                                                }
                                            >
                                                {item}
                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>


                        {/* STATUS */}

                        <div
                            className="filter-group"
                        >

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={
                                    event =>
                                        setStatusFilter(
                                            event.target.value
                                        )
                                }
                            >

                                <option value="Semua">
                                    Semua Status
                                </option>

                                <option value="Tersedia">
                                    Tersedia
                                </option>

                                <option value="Habis">
                                    Habis
                                </option>

                            </select>

                        </div>


                        {/* SORT */}

                        <div
                            className="filter-group"
                        >

                            <select
                                value={
                                    sortBy
                                }
                                onChange={
                                    event =>
                                        setSortBy(
                                            event.target.value
                                        )
                                }
                            >

                                <option value="Terbaru">
                                    Terbaru
                                </option>

                                <option value="Nama A-Z">
                                    Nama A-Z
                                </option>

                                <option value="Harga Murah">
                                    Harga Termurah
                                </option>

                                <option value="Harga Mahal">
                                    Harga Termahal
                                </option>

                            </select>

                        </div>

                    </div>

                </div>


                {/* =====================================
                    MENU GRID
                ===================================== */}

                <div
                    className="menu-grid"
                >

                    {
                        loading ? (

                            <div
                                className="loading-menu"
                            >
                                Memuat menu...
                            </div>

                        ) : filteredMenus.length === 0 ? (

                            <div
                                className="empty-menu"
                            >

                                <div
                                    className="empty-icon"
                                >

                                    <Package
                                        size={55}
                                    />

                                </div>


                                <h3>
                                    Belum Ada Menu
                                </h3>


                                <p>
                                    Warteg kamu belum memiliki daftar menu.
                                    <br />
                                    Tambahkan makanan dan minuman agar pelanggan bisa mulai memesan.
                                </p>


                                <button
                                    type="button"
                                    className="empty-add-button"
                                    onClick={
                                        openAdd
                                    }
                                >

                                    <Plus
                                        size={18}
                                    />

                                    Tambah Menu Pertama

                                </button>

                            </div>

                        ) : (

                            filteredMenus.map(
                                item => {

                                    const imageUrl =
                                        getImageUrl(
                                            item.image
                                        );


                                    return (

                                        <div
                                            className="menu-card"
                                            key={
                                                item.id
                                            }
                                        >

                                            {/* =================================
                                                MENU IMAGE
                                            ================================= */}

                                            <div
                                                className="menu-image"
                                            >

                                                {
                                                    imageUrl ? (

                                                        <img
                                                            src={
                                                                imageUrl
                                                            }
                                                            alt={
                                                                item.name
                                                            }
                                                            onError={
                                                                event => {

                                                                    console.error(
                                                                        "IMAGE LOAD ERROR:",
                                                                        imageUrl
                                                                    );

                                                                    event.currentTarget.style.display =
                                                                        "none";
                                                                }
                                                            }
                                                        />

                                                    ) : (

                                                        <div
                                                            className="no-image"
                                                        >

                                                            <ImageIcon
                                                                size={35}
                                                            />

                                                        </div>

                                                    )
                                                }


                                                <span
                                                    className={
                                                        item.available
                                                            ? "status available"
                                                            : "status unavailable"
                                                    }
                                                >

                                                    {
                                                        item.available
                                                            ? "Tersedia"
                                                            : "Habis"
                                                    }

                                                </span>

                                            </div>


                                            {/* =================================
                                                MENU BODY
                                            ================================= */}

                                            <div
                                                className="menu-card-body"
                                            >

                                                {/* TITLE */}

                                                <div
                                                    className="menu-title"
                                                >

                                                    <h3>
                                                        {
                                                            item.name
                                                        }
                                                    </h3>


                                                    <span
                                                        className="category"
                                                    >
                                                        {
                                                            item.category
                                                        }
                                                    </span>

                                                </div>


                                                {/* DESCRIPTION */}

                                                <p
                                                    className="menu-description"
                                                >

                                                    {
                                                        item.description ||
                                                        "Tidak ada deskripsi"
                                                    }

                                                </p>


                                                {/* PRICE & STOCK */}

                                                <div
                                                    className="menu-info"
                                                >

                                                    <div>

                                                        <span>
                                                            Harga
                                                        </span>

                                                        <strong>
                                                            Rp{" "}
                                                            {
                                                                item.price.toLocaleString(
                                                                    "id-ID"
                                                                )
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div>

                                                        <span>
                                                            Stok
                                                        </span>

                                                        <strong>
                                                            {
                                                                item.stock
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>


                                                {/* ACTIONS */}

                                                <div
                                                    className="menu-actions"
                                                >

                                                    <button
                                                        type="button"
                                                        className="edit-menu"
                                                        onClick={() =>
                                                            openEdit(
                                                                item
                                                            )
                                                        }
                                                    >

                                                        <Edit3
                                                            size={17}
                                                        />

                                                        Edit

                                                    </button>


                                                    <button
                                                        type="button"
                                                        className="delete-menu"
                                                        onClick={() =>
                                                            removeMenu(
                                                                item.id
                                                            )
                                                        }
                                                    >

                                                        <Trash2
                                                            size={17}
                                                        />

                                                        Hapus

                                                    </button>

                                                </div>

                                            </div>

                                        </div>

                                    );
                                }
                            )

                        )
                    }

                </div>


                {/* =====================================
                    ADD / EDIT MODAL
                ===================================== */}

                {
                    showModal && (

                        <div
                            className="modal-overlay"
                        >

                            <div
                                className="menu-modal"
                            >

                                {/* MODAL HEADER */}

                                <div
                                    className="modal-header"
                                >

                                    <div>

                                        <div
                                            className="modal-title-center"
                                        >

                                            <h2>
                                                {
                                                    editing
                                                        ? "Edit Menu"
                                                        : "Tambah Menu Baru"
                                                }
                                            </h2>

                                        </div>


                                        <p>
                                            Tambahkan informasi menu agar pelanggan mudah menemukan makanan kamu.
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        className="close-modal"
                                        onClick={
                                            closeModal
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        ×
                                    </button>

                                </div>


                                <div
                                    className="menu-form"
                                >

                                    {/* =================================
                                        IMAGE UPLOAD
                                    ================================= */}

                                    <div
                                        className="image-upload"
                                    >

                                        <div
                                            className="upload-box"
                                        >

                                            {
                                                preview ? (

                                                    <img
                                                        src={
                                                            preview
                                                        }
                                                        alt="Preview menu"
                                                    />

                                                ) : (

                                                    <div
                                                        className="upload-placeholder"
                                                    >

                                                        <ImageIcon
                                                            size={42}
                                                        />

                                                        <span>
                                                            Upload gambar menu
                                                        </span>

                                                    </div>

                                                )
                                            }

                                        </div>


                                        <label
                                            className="file-button"
                                        >

                                            <ImageIcon
                                                size={18}
                                            />

                                            Pilih Foto


                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={
                                                    handleImage
                                                }
                                                disabled={
                                                    saving
                                                }
                                            />

                                        </label>

                                    </div>


                                    {/* =================================
                                        MENU NAME
                                    ================================= */}

                                    <div
                                        className="form-group"
                                    >

                                        <label>
                                            Nama Menu
                                        </label>


                                        <input
                                            type="text"
                                            placeholder="Contoh: Ayam Goreng Sambal"
                                            value={
                                                menu.name
                                            }
                                            onChange={
                                                event =>
                                                    setMenu(
                                                        previous => ({
                                                            ...previous,
                                                            name:
                                                                event.target.value,
                                                        })
                                                    )
                                            }
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* =================================
                                        CATEGORY & PRICE
                                    ================================= */}

                                    <div
                                        className="form-row"
                                    >

                                        {/* CATEGORY */}

                                        <div
                                            className="form-group"
                                        >

                                            <label>
                                                Kategori
                                            </label>


                                            <select
                                                value={
                                                    menu.category
                                                }
                                                onChange={
                                                    event =>
                                                        setMenu(
                                                            previous => ({
                                                                ...previous,
                                                                category:
                                                                    event.target.value,
                                                            })
                                                        )
                                                }
                                                disabled={
                                                    saving
                                                }
                                            >

                                                <option value="Makanan">
                                                    🍛 Makanan
                                                </option>

                                                <option value="Minuman">
                                                    🥤 Minuman
                                                </option>

                                            </select>

                                        </div>


                                        {/* PRICE */}

                                        <div
                                            className="form-group"
                                        >

                                            <label>
                                                Harga
                                            </label>


                                            <div
                                                className="price-input"
                                            >

                                                <span>
                                                    Rp
                                                </span>


                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="15000"
                                                    value={
                                                        menu.price === 0
                                                            ? ""
                                                            : menu.price.toLocaleString(
                                                                "id-ID"
                                                            )
                                                    }
                                                    onChange={
                                                        event => {

                                                            const raw =
                                                                event.target.value
                                                                    .replace(
                                                                        /\D/g,
                                                                        ""
                                                                    );


                                                            const price =
                                                                raw
                                                                    ? Number(
                                                                        raw
                                                                    )
                                                                    : 0;


                                                            setMenu(
                                                                previous => ({
                                                                    ...previous,
                                                                    price,
                                                                })
                                                            );

                                                        }
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                />

                                            </div>

                                        </div>

                                    </div>


                                    {/* =================================
                                        STOCK & STATUS
                                    ================================= */}

                                    <div
                                        className="form-row"
                                    >

                                        {/* STOCK */}

                                        <div
                                            className="form-group"
                                        >

                                            <label>
                                                Stok Tersedia
                                            </label>


                                            <div
                                                className="stock-counter"
                                            >

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateStock(
                                                            "minus"
                                                        )
                                                    }
                                                    disabled={
                                                        saving ||
                                                        menu.stock <= 0
                                                    }
                                                >
                                                    −
                                                </button>


                                                <span>
                                                    {
                                                        menu.stock
                                                    }
                                                </span>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateStock(
                                                            "plus"
                                                        )
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>


                                        {/* STATUS */}

                                        <div
                                            className="form-group"
                                        >

                                            <label>
                                                Status Penjualan
                                            </label>


                                            <select
                                                value={
                                                    menu.available
                                                        ? "true"
                                                        : "false"
                                                }
                                                onChange={
                                                    event =>
                                                        setMenu(
                                                            previous => ({
                                                                ...previous,
                                                                available:
                                                                    event.target.value ===
                                                                    "true",
                                                            })
                                                        )
                                                }
                                                disabled={
                                                    saving
                                                }
                                            >

                                                <option value="true">
                                                    Tersedia
                                                </option>

                                                <option value="false">
                                                    Habis
                                                </option>

                                            </select>

                                        </div>

                                    </div>


                                    {/* =================================
                                        DESCRIPTION
                                    ================================= */}

                                    <div
                                        className="form-group"
                                    >

                                        <label>
                                            Deskripsi Menu
                                        </label>


                                        <textarea
                                            placeholder="Contoh: Ayam goreng khas warteg dengan sambal pedas"
                                            value={
                                                menu.description
                                            }
                                            onChange={
                                                event =>
                                                    setMenu(
                                                        previous => ({
                                                            ...previous,
                                                            description:
                                                                event.target.value,
                                                        })
                                                    )
                                            }
                                            disabled={
                                                saving
                                            }
                                        />

                                    </div>


                                    {/* =================================
                                        MODAL FOOTER
                                    ================================= */}

                                    <div
                                        className="modal-footer"
                                    >

                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={
                                                closeModal
                                            }
                                            disabled={
                                                saving
                                            }
                                        >
                                            Batal
                                        </button>


                                        <button
                                            type="button"
                                            className="save-button"
                                            onClick={
                                                saveMenu
                                            }
                                            disabled={
                                                saving
                                            }
                                        >

                                            {
                                                saving
                                                    ? "Menyimpan..."
                                                    : "Simpan"
                                            }

                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>

                    )
                }

            </main>

        </div>
    );
}