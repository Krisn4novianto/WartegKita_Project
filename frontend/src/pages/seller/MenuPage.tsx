import {
    useEffect,
    useMemo,
    useState,
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

import SellerNavbar from "./SellerNavbar";


import {
    useParams,
} from "react-router-dom";

import api from "../../services/api";

import "../../styles/seller/MenuPage.css";



interface Menu {

    id: number;

    seller_id: number;

    name: string;

    description: string;

    price: number;

    stock: number;

    category:
    | "Makanan"
    | "Minuman";

    image?: string;

    available: boolean;

    created_at: string;

}



const emptyMenu: Menu = {

    id: 0,

    seller_id: 0,

    name: "",

    description: "",

    price: 0,

    stock: 0,

    category: "Makanan",

    image: "",

    available: true,

    created_at: "",

};



export default function MenuPage() {


    const { seller_id } = useParams();

    const [
        openMenu,
        setOpenMenu
    ] = useState(true);

    const [
        menus,
        setMenus
    ] = useState<Menu[]>([]);



    const [
        loading,
        setLoading
    ] = useState(true);



    const [
        search,
        setSearch
    ] = useState("");



    const [
        category,
        setCategory
    ] = useState("Semua");



    const [
        statusFilter,
        setStatusFilter
    ] = useState("Semua");



    const [
        sortBy,
        setSortBy
    ] = useState("Terbaru");



    const [
        showModal,
        setShowModal
    ] = useState(false);



    const [
        editing,
        setEditing
    ] = useState(false);



    const [
        menu,
        setMenu
    ] = useState<Menu>(emptyMenu);



    const [
        preview,
        setPreview
    ] = useState("");



    const [
        imageFile,
        setImageFile
    ] = useState<File | null>(null);



    // =========================
    // GET MENU
    // =========================

    const loadMenus = async () => {

        try {

            setLoading(true);

            const res =
                await api.get(
                    `/menus?seller_id=${seller_id}`
                );


            console.log("DATA MENU API:", res.data);


            setMenus(
                res.data
            );


        } catch (error) {

            console.log(error);

            Swal.fire({

                icon: "error",

                title: "Gagal",

                text:
                    "Tidak dapat mengambil data menu",

            });


        } finally {

            setLoading(false);

        }

    };





    useEffect(() => {

        if (seller_id) {
            loadMenus();
        }

    }, [seller_id]);







    // =========================
    // STATISTICS
    // =========================


    const totalMenu =
        menus.length;



    const totalFood =
        menus.filter(
            item =>
                item.category === "Makanan"
        ).length;



    const totalDrink =
        menus.filter(
            item =>
                item.category === "Minuman"
        ).length;



    const outStock =
        menus.filter(
            item =>
                item.stock === 0
        ).length;





    // =========================
    // FILTER + SORT
    // =========================


    const filteredMenus =
        useMemo(() => {


            let result =
                menus.filter(
                    item => {


                        const keyword =
                            item.name
                                .toLowerCase()
                                .includes(
                                    search.toLowerCase()
                                );



                        const cat =
                            category === "Semua"
                            ||
                            item.category === category;



                        const status =
                            statusFilter === "Semua"
                            ||
                            (
                                statusFilter === "Tersedia"
                                &&
                                item.available
                            )
                            ||
                            (
                                statusFilter === "Habis"
                                &&
                                !item.available
                            );



                        return (
                            keyword
                            &&
                            cat
                            &&
                            status
                        );

                    }
                );





            if (sortBy === "Nama A-Z") {


                result.sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );


            }



            if (sortBy === "Harga Murah") {


                result.sort(
                    (a, b) =>
                        a.price - b.price
                );


            }



            if (sortBy === "Harga Mahal") {


                result.sort(
                    (a, b) =>
                        b.price - a.price
                );


            }



            if (sortBy === "Terbaru") {


                result.sort(
                    (a, b) =>
                        new Date(
                            b.created_at
                        ).getTime()
                        -
                        new Date(
                            a.created_at
                        ).getTime()
                );


            }



            return result;



        }, [
            menus,
            search,
            category,
            statusFilter,
            sortBy
        ]);







    // =========================
    // IMAGE
    // =========================


    const handleImage = (
        e:
            React.ChangeEvent<HTMLInputElement>
    ) => {


        if (!e.target.files)
            return;



        const file =
            e.target.files[0];



        setImageFile(file);



        setPreview(
            URL.createObjectURL(file)
        );


    };







    // =========================
    // ADD
    // =========================


    const openAdd = () => {


        setEditing(false);


        setMenu({

            ...emptyMenu,

            seller_id:
                Number(seller_id)

        });


        setPreview("");

        setImageFile(null);


        setShowModal(true);


    };







    // =========================
    // EDIT
    // =========================


    const openEdit = (
        item: Menu
    ) => {


        setEditing(true);


        setMenu(item);


        setPreview(
            item.image || ""
        );


        setShowModal(true);


    };


    // =========================
    // STOK TERSEDIA MENU
    // =========================

    const updateStock = (action: "plus" | "minus") => {
        setMenu((prev) => {
            const newStock =
                action === "plus"
                    ? prev.stock + 1
                    : Math.max(0, prev.stock - 1);

            return {
                ...prev,
                stock: newStock,
            };
        });
    };



    // =========================
    // DELETE MENU
    // =========================

    const removeMenu = async (
        id: number
    ) => {


        const confirm =
            await Swal.fire({

                title:
                    "Hapus Menu?",

                text:
                    "Menu yang dihapus tidak bisa dikembalikan",

                icon:
                    "warning",

                showCancelButton:
                    true,

                confirmButtonText:
                    "Ya, Hapus",

                cancelButtonText:
                    "Batal"

            });



        if (!confirm.isConfirmed)
            return;



        try {


            await api.delete(
                `/menus/${id}`
            );


            Swal.fire({

                icon:
                    "success",

                title:
                    "Berhasil",

                text:
                    "Menu berhasil dihapus",

                timer:
                    1500,

                showConfirmButton:
                    false

            });



            loadMenus();



        } catch {


            Swal.fire({

                icon:
                    "error",

                title:
                    "Gagal",

                text:
                    "Tidak dapat menghapus menu"

            });


        }


    };







    // =========================
    // SAVE MENU
    // =========================

    const saveMenu = async () => {

        console.log("MENU STATE:", menu);

        try {

            const form = new FormData();


            form.append(
                "seller_id",
                String(seller_id)
            );


            form.append(
                "name",
                menu.name.trim()
            );


            form.append(
                "description",
                menu.description.trim()
            );


            form.append(
                "price",
                String(menu.price)
            );


            form.append(
                "stock",
                String(menu.stock)
            );


            form.append(
                "category",
                menu.category
            );


            form.append(
                "available",
                menu.available ? "true" : "false"
            );


            if (imageFile) {

                form.append(
                    "image",
                    imageFile
                );

            }



            // CEK DATA YANG DIKIRIM
            console.log("FORM DATA:");

            for (const item of form.entries()) {

                console.log(
                    item[0],
                    item[1]
                );

            }



            if (editing) {

                await api.put(
                    `/menus/${menu.id}`,
                    form
                );

            } else {

                await api.post(
                    "/menus",
                    form,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

            }



            Swal.fire({
                icon: "success",
                title: "Berhasil",
                timer: 1500,
                showConfirmButton: false
            });



            setShowModal(false);

            setMenu(emptyMenu);

            setPreview("");

            setImageFile(null);


            await loadMenus();



        } catch (error: any) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: error.response?.data?.error || error.message
            });

        }

    };




    return (

        <div
            className={`seller-layout ${openMenu
                ? "menu-open"
                : "menu-close"
                }`}
        >


            <SellerNavbar
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
            />


            <main className="seller-content">


                {/* =========================
        HEADER
    ========================= */}

                <div className="menu-header">

                    <div>
                        <h1>
                            Daftar Menu
                        </h1>

                        <p>
                            Kelola makanan dan minuman warteg kamu
                        </p>
                    </div>


                    <button
                        className="add-button"
                        onClick={openAdd}
                    >

                        <Plus size={18} />

                        Tambah Menu

                    </button>

                </div>




                {/* =========================
        STATISTIC
    ========================= */}


                <div className="menu-stats">



                    <div className="stat-card">

                        <div className="stat-icon total">

                            <Package size={28} />

                        </div>


                        <div className="stat-content">

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






                    <div className="stat-card">


                        <div className="stat-icon food">

                            <UtensilsCrossed size={28} />

                        </div>


                        <div className="stat-content">


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







                    <div className="stat-card">


                        <div className="stat-icon drink">


                            <Coffee size={28} />


                        </div>


                        <div className="stat-content">


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







                    <div className="stat-card">


                        <div className="stat-icon stock">


                            <ImageIcon size={28} />


                        </div>


                        <div className="stat-content">


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



                </div >









                {/* =========================
                        TOOLBAR
                        ========================= */}


                <div className="menu-toolbar">



                    <div className="search-box">
                        <Search size={18} />


                        <input

                            type="text"

                            placeholder="Cari menu..."

                            value={search}

                            onChange={
                                (e) =>
                                    setSearch(
                                        e.target.value
                                    )
                            }

                        />
                    </div>






                    <div className="toolbar-actions">



                        <div className="filter-group">


                            <Filter size={18} />


                            <select

                                value={category}

                                onChange={
                                    (e) =>
                                        setCategory(
                                            e.target.value
                                        )
                                }

                            >


                                <option value="Semua">
                                    Semua Kategori
                                </option>


                                <option value="Makanan">
                                    🍛 Makanan
                                </option>


                                <option value="Minuman">
                                    🥤 Minuman
                                </option>


                            </select>


                        </div>





                        <div className="filter-group">


                            <select

                                value={statusFilter}

                                onChange={
                                    (e) =>
                                        setStatusFilter(
                                            e.target.value
                                        )
                                }

                            >


                                <option value="Semua">
                                    Semua Status
                                </option>


                                <option value="Tersedia">
                                    ✅ Tersedia
                                </option>


                                <option value="Habis">
                                    ❌ Habis
                                </option>


                            </select>


                        </div>






                        <div className="filter-group">


                            <select

                                value={sortBy}

                                onChange={
                                    (e) =>
                                        setSortBy(
                                            e.target.value
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



                </div >


                {/* =========================
    MENU GRID
========================= */}

                <div className="menu-grid">


                    {
                        loading ? (

                            <div className="loading-menu" >

                                Memuat menu...

                            </div>


                        ) : filteredMenus.length === 0 ? (


                            <div className="empty-menu">

                                <div className="empty-icon">

                                    <Package size={55} />

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
                                    className="empty-add-button"
                                    onClick={openAdd}
                                >

                                    <Plus size={18} />

                                    Tambah Menu Pertama

                                </button>


                            </div>


                        ) : (


                            filteredMenus.map((item) => (


                                <div
                                    className="menu-card"
                                    key={item.id}
                                >



                                    {/* IMAGE */}

                                    <div className="menu-image">


                                        {
                                            item.image ? (

                                                <img
                                                    src={
                                                        item.image
                                                            ? item.image.startsWith("http")
                                                                ? item.image
                                                                : `http://localhost:8080/${item.image}`
                                                            : "/default-food.png"
                                                    }
                                                    alt={item.name}
                                                />


                                            ) : (


                                                <div className="no-image">

                                                    <ImageIcon size={35} />

                                                </div>


                                            )


                                        }



                                        <span

                                            className={
                                                item.available
                                                    ?
                                                    "status available"
                                                    :
                                                    "status unavailable"
                                            }

                                        >


                                            {
                                                item.available
                                                    ?
                                                    "Tersedia"
                                                    :
                                                    "Habis"
                                            }


                                        </span>


                                    </div>







                                    {/* BODY */}

                                    <div className="menu-card-body">



                                        <div className="menu-title">


                                            <h3>

                                                {item.name}

                                            </h3>



                                            <span className="category">


                                                {
                                                    item.category === "Makanan"
                                                        ?
                                                        "🍛"
                                                        :
                                                        "🥤"
                                                }

                                                {" "}

                                                {item.category}


                                            </span>



                                        </div>






                                        <p className="menu-description">


                                            {
                                                item.description
                                                ||
                                                "Tidak ada deskripsi"
                                            }


                                        </p>






                                        <div className="menu-info">


                                            <div>


                                                <span>
                                                    Harga
                                                </span>


                                                <strong>

                                                    Rp {item.price.toLocaleString("id-ID")}

                                                </strong>


                                            </div>





                                            <div>


                                                <span>
                                                    Stok
                                                </span>


                                                <strong>

                                                    {item.stock}

                                                </strong>


                                            </div>



                                        </div>







                                        <div className="menu-actions">



                                            <button

                                                className="edit-menu"

                                                onClick={() =>
                                                    openEdit(item)
                                                }

                                            >

                                                <Edit3 size={17} />

                                                Edit

                                            </button>







                                            <button

                                                className="delete-menu"

                                                onClick={() =>
                                                    removeMenu(item.id)
                                                }

                                            >


                                                <Trash2 size={17} />

                                                Hapus


                                            </button>



                                        </div>





                                    </div>



                                </div>



                            ))


                        )


                    }



                </div >





                {/* =========================
                MODAL 
                ========================= */}

                {
                    showModal && (

                        <div className="modal-overlay">


                            <div className="menu-modal">



                                <div className="modal-header">


                                    <div>


                                        <div className="modal-title-center">

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

                                        className="close-modal"

                                        onClick={() =>
                                            setShowModal(false)
                                        }

                                    >
                                        ×
                                    </button>


                                </div>






                                <div className="menu-form">



                                    {/* FOTO */}

                                    <div className="image-upload">

                                        <div className="upload-box">


                                            {
                                                preview ? (

                                                    <img
                                                        src={preview}
                                                        alt="preview"
                                                    />

                                                ) : (

                                                    <div className="upload-placeholder">


                                                        <ImageIcon size={42} />


                                                        <span>
                                                            Upload gambar menu
                                                        </span>


                                                    </div>

                                                )

                                            }


                                        </div>




                                        <label className="file-button">


                                            <ImageIcon size={18} />


                                            Pilih Foto


                                            <input

                                                type="file"

                                                accept="image/*"

                                                onChange={handleImage}

                                            />


                                        </label>



                                    </div>









                                    {/* NAMA */}

                                    <div className="form-group">


                                        <label>
                                            Nama Menu
                                        </label>


                                        <input

                                            type="text"

                                            placeholder="Contoh: Ayam Goreng Sambal"

                                            value={menu.name}


                                            onChange={(e) =>

                                                setMenu({

                                                    ...menu,

                                                    name: e.target.value

                                                })

                                            }


                                        />

                                    </div>










                                    {/* CATEGORY PRICE */}


                                    <div className="form-row">


                                        <div className="form-group">


                                            <label>
                                                Kategori
                                            </label>


                                            <select


                                                value={menu.category}


                                                onChange={(e) =>

                                                    setMenu({

                                                        ...menu,

                                                        category:
                                                            e.target.value as
                                                            "Makanan" |
                                                            "Minuman"

                                                    })

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







                                        <div className="form-group">


                                            <label>
                                                Harga
                                            </label>

                                            <div className="price-input">

                                                <span>
                                                    Rp
                                                </span>


                                                <input

                                                    type="text"

                                                    inputMode="numeric"

                                                    placeholder="15000"

                                                    value={
                                                        menu.price === 0
                                                            ?
                                                            ""
                                                            :
                                                            menu.price.toLocaleString("id-ID")
                                                    }


                                                    onChange={(e) => {


                                                        const value =
                                                            e.target.value
                                                                .replace(/\D/g, "");


                                                        setMenu({

                                                            ...menu,

                                                            price:
                                                                Number(value)

                                                        });


                                                    }}

                                                />

                                            </div>



                                        </div>



                                    </div>

                                    {/* STOCK + STATUS */}
                                    <div className="form-row">

                                        {/* STOCK */}
                                        <div className="form-group">

                                            <label>
                                                Stok Tersedia
                                            </label>


                                            <div className="stock-counter">

                                                <button
                                                    type="button"
                                                    onClick={() => updateStock("minus")}
                                                >
                                                    −
                                                </button>


                                                <span>
                                                    {menu.stock}
                                                </span>


                                                <button
                                                    type="button"
                                                    onClick={() => updateStock("plus")}
                                                >
                                                    +
                                                </button>

                                            </div>

                                        </div>



                                        {/* STATUS */}
                                        <div className="form-group">

                                            <label>
                                                Status Penjualan
                                            </label>


                                            <select
                                                value={menu.available ? "true" : "false"}
                                                onChange={(e) =>
                                                    setMenu({
                                                        ...menu,
                                                        available: e.target.value === "true",
                                                    })
                                                }
                                            >

                                                <option value="true">
                                                    ✅ Menu tersedia
                                                </option>


                                                <option value="false">
                                                    ❌ Menu habis
                                                </option>


                                            </select>

                                        </div>

                                    </div>


                                    {/* DESCRIPTION */}
                                    <div className="form-group">
                                        <label>Deskripsi Menu</label>

                                        <textarea
                                            placeholder="Contoh: Ayam goreng khas warteg dengan sambal pedas"
                                            value={menu.description}
                                            onChange={(e) =>
                                                setMenu({
                                                    ...menu,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </div>


                                    <div className="modal-footer">

                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Batal
                                        </button>


                                        <button
                                            type="button"
                                            className="save-button"
                                            onClick={saveMenu}
                                        >
                                            Simpan
                                        </button>

                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
            </main>
        </div>
    );
}