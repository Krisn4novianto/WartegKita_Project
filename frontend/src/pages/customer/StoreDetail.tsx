import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Clock3,
  MapPin,
  MessageCircle,
  Search,
  ShoppingCart,
  Star,
  X,
} from "lucide-react";

import MenuCard from "./MenuCard";

import api from "../../services/api";

import {
  Menu,
} from "../../types";

import {
  useCartStore,
} from "../../store/cartStore";

import {
  useCheckoutStore,
} from "../../store/checkoutStore";

import "../../styles/store-detail.css";



/* =====================================================
   TYPE
===================================================== */

interface CustomerSeller {

  id: string;

  store_name: string;

  description: string;

  address: string;

  owner: string;

  phone: string;

  rating: number;

  distance_km: number;

  total_menu: number;

  opening_time: string;

  closing_time: string;

  is_open: boolean;

  image: string;

}



/* =====================================================
   IMAGE URL
===================================================== */

const getImageUrl = (
  image?: string | null,
): string => {


  if (!image) {

    return "";

  }



  const value =
    String(image)
      .trim();



  if (!value) {

    return "";

  }



  if (
    value.startsWith("http") ||
    value.startsWith("blob:")
  ) {

    return value;

  }



  const baseURL =
    api.defaults.baseURL ?? "";



  let origin =
    baseURL;



  try {

    if (
      baseURL.startsWith("http")
    ) {

      origin =
        new URL(
          baseURL,
        ).origin;

    }

  } catch {

    origin =
      baseURL;

  }



  return (
    `${origin.replace(
      /\/$/,
      "",
    )}/${value.replace(
      /^\//,
      "",
    )}`
  );

};



/* =====================================================
   NUMBER
===================================================== */

const numberValue = (
  value: unknown,
): number => {


  const result =
    Number(value);



  return Number.isFinite(result)
    ?
    result
    :
    0;

};



/* =====================================================
   TIME PARSER
===================================================== */

const timeToMinute = (
  value?: string | null,
) => {


  if (!value) {

    return null;

  }



  const match =
    String(value)
      .match(
        /(\d{1,2}):(\d{2})/,
      );



  if (!match) {

    return null;

  }



  const hour =
    Number(match[1]);


  const minute =
    Number(match[2]);



  if (
    hour > 23 ||
    minute > 59
  ) {

    return null;

  }



  return (
    hour * 60 +
    minute
  );

};




/* =====================================================
   JAKARTA TIME
===================================================== */

const getJakartaMinute =
  (): number => {


    const parts =
      new Intl.DateTimeFormat(
        "en-US",
        {
          timeZone:
            "Asia/Jakarta",

          hour:
            "2-digit",

          minute:
            "2-digit",

          hourCycle:
            "h23",
        },
      )
        .formatToParts(
          new Date(),
        );



    const hour =
      Number(
        parts.find(
          item =>
            item.type === "hour",
        )?.value ?? 0,
      );



    const minute =
      Number(
        parts.find(
          item =>
            item.type === "minute",
        )?.value ?? 0,
      );



    return (
      hour * 60 +
      minute
    );

  };




/* =====================================================
   OPEN STATUS
===================================================== */

const calculateOpen =
  (
    open?: string,
    close?: string,
  ): boolean => {


    const start =
      timeToMinute(
        open,
      );


    const end =
      timeToMinute(
        close,
      );



    if (
      start === null ||
      end === null
    ) {

      return false;

    }



    const now =
      getJakartaMinute();



    if (
      start < end
    ) {

      return (
        now >= start &&
        now < end
      );

    }



    return (
      now >= start ||
      now < end
    );

  };




/* =====================================================
   PRICE FORMAT
===================================================== */

const formatPrice =
  (
    value: number,
  ) => {

    return (
      `Rp ${value.toLocaleString(
        "id-ID",
      )}`
    );

  };




/* =====================================================
   COMPONENT
===================================================== */

export default function StoreDetail() {


  const {
    id,
  } =
    useParams<{
      id: string;
    }>();


  const navigate =
    useNavigate();



  /* =====================================================
     STATE
  ===================================================== */


  const [
    store,
    setStore,
  ] =
    useState<CustomerSeller | null>(
      null,
    );



  const [
    menus,
    setMenus,
  ] =
    useState<Menu[]>([]);



  const [
    loading,
    setLoading,
  ] =
    useState(true);



  const [
    error,
    setError,
  ] =
    useState("");



  const [
    search,
    setSearch,
  ] =
    useState("");



  const [
    category,
    setCategory,
  ] =
    useState(
      "Semua",
    );



  const [
    quantities,
    setQuantities,
  ] =
    useState<
      Record<string, number>
    >({});



  const [
    toast,
    setToast,
  ] =
    useState("");



  const [
    showChangeStore,
    setShowChangeStore,
  ] =
    useState(false);



  const [
    pendingMenu,
    setPendingMenu,
  ] =
    useState<Menu | null>(null);



  const [
    pendingQuantity,
    setPendingQuantity,
  ] =
    useState(0);




  /* =====================================================
     CART
  ===================================================== */


  const addItem =
    useCartStore(
      state =>
        state.addItem,
    );



  const clearCart =
    useCartStore(
      state =>
        state.clear,
    );



  const setStoreId =
    useCartStore(
      state =>
        state.setStoreId,
    );



  const cartItems =
    useCartStore(
      state =>
        state.items,
    );



  const cartStoreId =
    useCartStore(
      state =>
        state.storeId,
    );



  const resetCheckout =
    useCheckoutStore(
      state =>
        state.resetCheckout,
    );


  /* =====================================================
     TOAST
  ===================================================== */

  const showToast = (
    message: string,
  ) => {

    setToast(message);


    window.setTimeout(
      () => {

        setToast("");

      },
      2500,
    );

  };




  /* =====================================================
     LOAD STORE + MENU
  ===================================================== */

  useEffect(() => {

    let cancelled = false;


    const loadStore = async () => {


      const sellerId =
        String(
          id ?? "",
        ).trim();



      if (!sellerId) {

        setError(
          "ID warteg tidak ditemukan",
        );

        setLoading(false);

        return;

      }



      try {


        setLoading(true);

        setError("");



        /*
          ===============================
          SELLER
          ===============================
        */


        const sellerResponse =
          await api.get(
            `/sellers/${sellerId}`,
          );



        const sellerPayload =
          sellerResponse.data;



        const seller =
          sellerPayload?.data ??
          sellerPayload;



        if (!seller) {

          throw new Error(
            "Warteg tidak ditemukan",
          );

        }



        const opening =
          String(
            seller.opening_time ??
            seller.jam_buka ??
            seller.open_time ??
            "",
          );



        const closing =
          String(
            seller.closing_time ??
            seller.jam_tutup ??
            seller.close_time ??
            "",
          );




        const normalizedSeller:
          CustomerSeller =
        {


          id:
            String(
              seller.id ??
              seller.seller_id ??
              sellerId,
            ),



          store_name:
            String(
              seller.store_name ??
              seller.nama_warteg ??
              seller.name ??
              "Warteg",
            ),



          description:
            String(
              seller.description ??
              seller.deskripsi ??
              "",
            ),



          address:
            String(
              seller.address ??
              seller.alamat ??
              "",
            ),



          owner:
            String(
              seller.owner ??
              seller.nama_pemilik ??
              "",
            ),



          phone:
            String(
              seller.phone ??
              seller.nomor_hp ??
              "",
            ),



          rating:
            numberValue(
              seller.rating,
            ),



          distance_km:
            numberValue(
              seller.distance_km,
            ),



          total_menu:
            0,



          opening_time:
            opening,



          closing_time:
            closing,



          is_open:
            calculateOpen(
              opening,
              closing,
            ),



          image:
            getImageUrl(
              seller.image ??
              seller.image_url ??
              seller.foto ??
              seller.foto_warteg,
            ),

        };



        if (cancelled) {

          return;

        }



        setStore(
          normalizedSeller,
        );




        /*
          ===============================
          MENU
          ===============================
        */



        const menuResponse =
          await api.get(
            `/menus?seller_id=${sellerId}`,
          );



        const menuPayload =
          menuResponse.data;



        const rawMenus =
          menuPayload?.data ??
          menuPayload?.menus ??
          menuPayload ??
          [];



        const menuArray =
          Array.isArray(rawMenus)
            ?
            rawMenus
            :
            [];




        const normalizedMenus =
          menuArray
            .map(
              (
                item: any,
              ): Menu => {


                const stock =
                  numberValue(
                    item.stock ??
                    item.stok,
                  );



                return {


                  id:
                    String(
                      item.id ??
                      item.menu_id ??
                      "",
                    ),



                  seller_id:
                    String(
                      item.seller_id ??
                      sellerId,
                    ),



                  name:
                    String(
                      item.name ??
                      item.nama_menu ??
                      "",
                    ),



                  description:
                    String(
                      item.description ??
                      item.deskripsi ??
                      "",
                    ),



                  price:
                    numberValue(
                      item.price ??
                      item.harga,
                    ),



                  stock,



                  category:
                    String(
                      item.category ??
                      item.kategori ??
                      "Lainnya",
                    ),



                  image:
                    getImageUrl(
                      item.image ??
                      item.image_url ??
                      item.foto,
                    ),



                  available:
                    item.available !== false &&
                    stock > 0,



                  created_at:
                    item.created_at ??
                    "",



                  updated_at:
                    item.updated_at ??
                    "",


                };


              },
            )
            .filter(
              menu =>
                menu.id,
            );



        if (cancelled) {

          return;

        }



        setMenus(
          normalizedMenus,
        );



        setStore(
          previous =>
            previous
              ?
              {
                ...previous,

                total_menu:
                  normalizedMenus.length,

              }
              :
              previous,
        );



        resetCheckout();



      } catch (error: any) {


        console.error(
          "Store Detail Error",
          error,
        );



        if (!cancelled) {

          setError(
            error?.response
              ?.data
              ?.message ??
            error.message ??
            "Gagal memuat warteg",
          );

        }



      } finally {


        if (!cancelled) {

          setLoading(false);

        }


      }


    };



    loadStore();



    return () => {

      cancelled = true;

    };


  }, [
    id,
    resetCheckout,
  ]);





  /* =====================================================
     CATEGORY
  ===================================================== */


  const categories =
    useMemo(
      () => {


        const result =
          menus
            .map(
              menu =>
                menu.category,
            )
            .filter(Boolean);



        return [

          "Semua",

          ...Array.from(
            new Set(
              result,
            ),
          ),

        ];


      },
      [
        menus,
      ],
    );





  /* =====================================================
     FILTER MENU
  ===================================================== */


  const filteredMenus =
    useMemo(
      () => {


        return menus.filter(
          menu => {


            const matchCategory =
              category === "Semua"
              ||
              menu.category === category;



            const matchSearch =
              menu.name
                .toLowerCase()
                .includes(
                  search
                    .toLowerCase(),
                );



            return (
              matchCategory &&
              matchSearch
            );


          },
        );


      },
      [
        menus,
        category,
        search,
      ],
    );





  /* =====================================================
     CART SUMMARY
  ===================================================== */


  const cartTotal =
    cartItems.reduce(
      (
        total,
        item,
      ) => {

        return (
          total +
          (
            Number(
              item.menu.price,
            )
            *
            Number(
              item.quantity,
            )
          )
        );


      },
      0,
    );




  const cartCount =
    cartItems.reduce(
      (
        total,
        item,
      ) => {

        return (
          total +
          Number(
            item.quantity,
          )
        );

      },
      0,
    );




  const sameStoreCart =
    Boolean(
      cartStoreId &&
      String(cartStoreId)
      ===
      String(store?.id),
    );





  /* =====================================================
     QUANTITY
  ===================================================== */


  const increaseQty =
    (menu: Menu) => {


      if (!store?.is_open) {

        showToast(
          "Warteg sedang tutup",
        );

        return;

      }



      if (!menu.available) {

        showToast(
          "Menu tidak tersedia",
        );

        return;

      }



      setQuantities(
        previous => {


          const current =
            previous[menu.id] ?? 0;



          if (
            current >= menu.stock
          ) {

            showToast(
              "Stok menu sudah maksimal",
            );

            return previous;

          }



          return {

            ...previous,

            [menu.id]:
              current + 1,

          };


        },
      );


    };





  const decreaseQty =
    (menuId: string) => {


      setQuantities(
        previous => ({

          ...previous,

          [menuId]:
            Math.max(
              0,
              (previous[menuId] ?? 0)
              - 1,
            ),

        }),
      );


    };





  /* =====================================================
     ADD TO CART
  ===================================================== */


  const addToCart =
    (menu: Menu) => {


      const quantity =
        quantities[menu.id] ?? 0;



      if (quantity <= 0) {

        showToast(
          "Pilih jumlah menu",
        );

        return;

      }



      const sellerId =
        String(id);



      if (
        cartItems.length &&
        cartStoreId &&
        String(cartStoreId)
        !== sellerId
      ) {


        setPendingMenu(menu);

        setPendingQuantity(
          quantity,
        );

        setShowChangeStore(true);


        return;

      }




      setStoreId(
        sellerId,
      );



      for (
        let i = 0;
        i < quantity;
        i++
      ) {

        addItem(
          menu,
        );

      }



      setQuantities(
        previous => ({

          ...previous,

          [menu.id]:
            0,

        }),
      );



      showToast(
        `${menu.name} ditambahkan`,
      );


    };


  /* =====================================================
     CHANGE STORE
  ===================================================== */


  const cancelChangeStore = () => {

    setShowChangeStore(false);

    setPendingMenu(null);

    setPendingQuantity(0);

  };




  const confirmChangeStore = () => {


    if (!pendingMenu) {

      cancelChangeStore();

      return;

    }



    clearCart();



    const sellerId =
      String(id);



    setStoreId(
      sellerId,
    );



    for (
      let i = 0;
      i < pendingQuantity;
      i++
    ) {

      addItem(
        pendingMenu,
      );

    }



    setQuantities(
      previous => ({

        ...previous,

        [pendingMenu.id]:
          0,

      }),
    );



    cancelChangeStore();


    showToast(
      "Keranjang diganti",
    );


  };





  /* =====================================================
     OPENING HOURS
  ===================================================== */


  const openingHours =
    store
      ?
      `${store.opening_time || "-"} - ${store.closing_time || "-"}`
      :
      "";






  /* =====================================================
     LOADING
  ===================================================== */


  if (loading) {

    return (

      <div className="store-page-loading">

        <div className="loading-circle" />

        <h2>
          Memuat warteg...
        </h2>

      </div>

    );

  }





  /* =====================================================
     ERROR
  ===================================================== */


  if (error || !store) {

    return (

      <div className="store-error-page">

        <div className="store-error-box">


          <h2>
            Warteg tidak ditemukan
          </h2>


          <p>
            {error}
          </p>


          <button
            onClick={() =>
              navigate("/explore")
            }
          >

            Kembali

          </button>


        </div>

      </div>

    );

  }





  /* =====================================================
     RENDER
  ===================================================== */


  return (

    <div className="store-detail-page">



      {/* =====================================================
    HERO
===================================================== */}


      <section className="gf-hero">


        <div className="gf-cover">


          {
            store.image

              ?

              <img
                src={store.image}
                alt={store.store_name}
              />

              :

              <div className="gf-empty-cover">

                🍛

              </div>

          }



          <button

            className="gf-back-button"

            onClick={() =>
              navigate("/explore")
            }

          >

            <ArrowLeft size={22} />

          </button>



        </div>





        <div className="gf-store-card">


          <div className="gf-store-header">


            <div>


              <h1>
                {store.store_name}
              </h1>



              <div className="gf-rating-row">


                <span>

                  <Star
                    size={16}
                    fill="currentColor"
                  />

                  {
                    store.rating
                      ?
                      store.rating.toFixed(1)
                      :
                      "Baru"
                  }

                </span>



                <span>
                  •
                </span>



                <span
                  className={
                    store.is_open
                      ?
                      "open-status"
                      :
                      "close-status"
                  }
                >

                  {
                    store.is_open
                      ?
                      "Buka"
                      :
                      "Tutup"
                  }

                </span>


              </div>


            </div>




            <button

              className="gf-chat-button"

              onClick={() =>
                navigate(
                  `/chat?seller_id=${store.id}`,
                )
              }

            >

              <MessageCircle size={22} />

            </button>


          </div>





          <div className="gf-detail-row">

            <MapPin size={17} />

            <span>

              {
                store.address ||
                "Alamat belum tersedia"
              }

            </span>

          </div>





          <div className="gf-detail-row">

            <Clock3 size={17} />

            <span>

              {openingHours}

            </span>

          </div>




          {
            store.description &&

            <p className="gf-description">

              {store.description}

            </p>

          }



        </div>


      </section>







      {/* =====================================================
    MENU
===================================================== */}


      <section className="menu-container">



        <div className="menu-search">


          <Search size={18} />


          <input

            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }

            placeholder="Cari menu..."

          />


        </div>






        <div className="category-sticky">


          {
            categories.map(
              item => (

                <button

                  key={item}

                  className={
                    category === item
                      ?
                      "active"
                      :
                      ""
                  }

                  onClick={() =>
                    setCategory(item)
                  }

                >

                  {item}

                </button>

              ),
            )
          }


        </div>







        <div className="menu-grid">


          {
            filteredMenus.length === 0

              ?

              <div className="empty-menu">

                <div>
                  🍽️
                </div>

                <h3>
                  Menu belum tersedia
                </h3>

                <p>
                  Belum ada menu.
                </p>

              </div>


              :

              filteredMenus.map(
                menu => (

                  <MenuCard

                    key={menu.id}

                    menu={menu}

                    quantity={
                      quantities[menu.id] ?? 0
                    }

                    storeIsOpen={
                      store.is_open
                    }

                    onIncrease={() =>
                      increaseQty(menu)
                    }

                    onDecrease={() =>
                      decreaseQty(menu.id)
                    }

                    onAdd={() =>
                      addToCart(menu)
                    }

                  />

                ),
              )

          }


        </div>


      </section>







      {/* =====================================================
    FLOATING CART
===================================================== */}



      {
        sameStoreCart &&
        cartCount > 0 &&


        <button

          className="floating-cart"

          onClick={() =>
            navigate(
              `/cart/${store.id}`,
            )
          }

        >


          <div className="cart-left">


            <div className="cart-icon">


              <ShoppingCart size={24} />


              <span>
                {cartCount}
              </span>


            </div>



            <div>

              <strong>
                Lihat keranjang
              </strong>


              <small>
                {cartCount} item
              </small>


            </div>


          </div>




          <strong>

            {formatPrice(
              cartTotal,
            )}

          </strong>



        </button>

      }





      {/* =====================================================
    CHANGE STORE MODAL
===================================================== */}



      {
        showChangeStore &&


        <div

          className="modal-overlay"

          onClick={cancelChangeStore}

        >


          <div

            className="change-modal"

            onClick={(e) =>
              e.stopPropagation()
            }

          >


            <button

              className="modal-close"

              onClick={cancelChangeStore}

            >

              <X size={18} />

            </button>



            <ShoppingCart size={30} />



            <h2>

              Ganti warteg?

            </h2>



            <p>

              Keranjang kamu berisi menu
              dari warteg lain.

            </p>


            <p>

              Menu lama akan dikosongkan.

            </p>




            <div className="modal-actions">


              <button

                className="btn-cancel"

                onClick={cancelChangeStore}

              >

                Batal

              </button>



              <button

                className="btn-confirm"

                onClick={confirmChangeStore}

              >

                Ganti Warteg

              </button>


            </div>



          </div>


        </div>

      }





      {/* =====================================================
    TOAST
===================================================== */}



      {
        toast &&


        <div className="store-toast">


          <Clock3 size={18} />


          <span>
            {toast}
          </span>



          <button
            onClick={() =>
              setToast("")
            }
          >

            <X size={15} />

          </button>


        </div>

      }





    </div>

  );


}
