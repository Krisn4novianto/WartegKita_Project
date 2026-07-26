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
  ShoppingCart,
  Star,
} from "lucide-react";


import MenuCard from "../../components/MenuCard";

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



interface Seller {

  id: number;

  store_name: string;

  description: string;

  address: string;

  rating?: number;

  distance_km?: number;

  image?: string;

}







export default function StoreDetail() {


  const {
    id,
  } = useParams();



  const navigate =
    useNavigate();




  const addItem =
    useCartStore(
      state => state.addItem
    );


  const setStoreId =
    useCartStore(
      state => state.setStoreId
    );


  const clearCart =
    useCartStore(
      state => state.clear
    );


  const cartItems =
    useCartStore(
      state => state.items
    );


  const cartStoreId =
    useCartStore(
      state => state.storeId
    );




  const resetCheckout =
    useCheckoutStore(
      state => state.resetCheckout
    );





  const [
    store,
    setStore
  ] =
    useState<Seller | null>(
      null
    );



  const [
    menus,
    setMenus
  ] =
    useState<Menu[]>([]);




  const [
    loading,
    setLoading
  ] =
    useState(true);



  const [
    error,
    setError
  ] =
    useState("");




  const [
    activeCategory,
    setActiveCategory
  ] =
    useState("Semua");




  const [
    quantities,
    setQuantities
  ] =
    useState<
      Record<number, number>
    >({});







  /*
  ========================================
  LOAD STORE + MENU
  ========================================
  */


  useEffect(() => {


    const loadStore =
      async () => {


        try {


          if (!id) {

            throw new Error(
              "ID toko tidak ditemukan"
            );

          }



          setLoading(true);

          setError("");




          const sellerResponse =
            await api.get(
              `/sellers/${id}`
            );

          setStore(
            sellerResponse.data
          );

          const menuResponse = await api.get(
            `/sellers/${id}/menus`
          );

          setMenus(
            Array.isArray(menuResponse.data)
              ? menuResponse.data
              : []
          );



          resetCheckout();


          setQuantities({});



        }
        catch (err) {


          console.error(
            err
          );


          setError(
            "Gagal memuat data warteg."
          );


        }
        finally {


          setLoading(false);


        }


      };



    loadStore();



  }, [
    id,
    resetCheckout
  ]);








  /*
  ========================================
  CATEGORY
  ========================================
  */


  const categories =
    useMemo(() => {


      const result =
        menus
          .map(
            menu =>
              menu.category
          )
          .filter(Boolean);



      return [
        "Semua",
        ...new Set(result)
      ];


    }, [
      menus
    ]);








  const filteredMenus =
    useMemo(() => {


      if (
        activeCategory === "Semua"
      ) {

        return menus;

      }



      return menus.filter(
        menu =>
          menu.category === activeCategory
      );



    }, [
      menus,
      activeCategory
    ]);









  /*
  ========================================
  CART TOTAL
  ========================================
  */


  const cartTotal =
    cartItems.reduce(
      (
        total,
        item
      ) => {


        return (
          total +
          (
            item.menu.price *
            item.quantity
          )
        );


      },
      0
    );








  const totalItems =
    cartItems.reduce(
      (
        total,
        item
      ) => {


        return (
          total +
          item.quantity
        );


      },
      0
    );









  /*
  ========================================
  QUANTITY MENU
  ========================================
  */


  const getQuantity =
    (
      menuId: number
    ) => {


      return (
        quantities[menuId] ?? 0
      );


    };







  const increaseQuantity =
    (
      menuId: number
    ) => {


      setQuantities(
        prev => ({

          ...prev,

          [menuId]:
            (
              prev[menuId] ?? 0
            ) + 1

        })
      );


    };








  const decreaseQuantity =
    (
      menuId: number
    ) => {


      setQuantities(
        prev => ({

          ...prev,

          [menuId]:
            Math.max(
              (
                prev[menuId] ?? 0
              ) - 1,
              0
            )

        })
      );


    };










  /*
  ========================================
  ADD TO CART
  ========================================
  */

  const addToCart = (menu: Menu) => {
    const currentStore = Number(id);

    if (cartStoreId && cartStoreId !== currentStore) {
      const confirmChange = window.confirm(
        "Keranjang berisi menu warteg lain. Ganti warteg?"
      );

      if (!confirmChange) return;

      clearCart();
    }

    const quantity = getQuantity(menu.id);

    if (quantity <= 0) {
      alert("Pilih jumlah menu dahulu");
      return;
    }

    setStoreId(currentStore);

    for (let i = 0; i < quantity; i++) {
      addItem(menu);
    }

    setQuantities((prev) => ({
      ...prev,
      [menu.id]: 0,
    }));
  };


  /*
  ========================================
  LOADING
  ========================================
  */


  if (loading) {


    return (

      <div className="store-loading">

        <h2>
          Memuat Warteg...
        </h2>

      </div>

    );

  }







  /*
  ========================================
  ERROR
  ========================================
  */


  if (error) {


    return (

      <div className="store-error">

        <h2>
          Oops 😥
        </h2>


        <p>
          {error}
        </p>


        <button
          onClick={() =>
            window.location.reload()
          }
        >

          Coba Lagi

        </button>


      </div>

    );


  }







  if (!store) {


    return (

      <div className="store-error">

        <h2>
          Warteg tidak ditemukan
        </h2>

      </div>

    );


  }








  return (

    <div className="store-detail-page">





      <button

        className="back-button"

        onClick={() =>
          navigate(-1)
        }

      >

        <ArrowLeft size={18} />

        Kembali

      </button>








      <section

        className="store-hero"

        style={{

          backgroundImage:

            store.image

              ?

              `
          linear-gradient(
            0deg,
            rgba(0,0,0,.65),
            rgba(0,0,0,.15)
          ),
          url(${store.image})
          `

              :

              undefined

        }}

      >


        <div className="store-overlay" />




        <div className="store-header-content">


          <span className="eyebrow">

            WARTEGKITA

          </span>




          <h1>

            {store.store_name}

          </h1>





          <p>

            {store.description}

          </p>





          <div className="store-meta">



            <div className="meta-card">

              <Star size={18} />

              <strong>

                {store.rating ?? 0}

              </strong>

            </div>





            <div className="meta-card">

              <MapPin size={18} />

              <strong>

                {store.distance_km ?? 0} km

              </strong>

            </div>





            <div className="meta-card">

              <Clock3 size={18} />

              <strong>

                08.00 - 21.00

              </strong>

            </div>



          </div>






          <div className="store-address">


            <MapPin size={18} />


            <span>

              {
                store.address ||
                "Lokasi belum tersedia"
              }

            </span>


          </div>





        </div>



      </section>









      <section className="menu-filter-section">


        <h2>

          Pilih makanan favoritmu

        </h2>





        <div className="category-list">


          {
            categories.map(
              category => (

                <button

                  key={category}

                  className={
                    activeCategory === category
                      ?
                      "active"
                      :
                      ""
                  }


                  onClick={() =>
                    setActiveCategory(
                      category
                    )
                  }

                >

                  {category}

                </button>


              )
            )
          }


        </div>



      </section>









      <section className="menu-grid">


        {
          filteredMenus.map(
            menu => (


              <MenuCard


                key={menu.id}


                menu={menu}


                quantity={
                  getQuantity(
                    menu.id
                  )
                }


                onIncrease={() =>
                  increaseQuantity(
                    menu.id
                  )
                }


                onDecrease={() =>
                  decreaseQuantity(
                    menu.id
                  )
                }


                onAdd={() =>
                  addToCart(menu)
                }


              />


            )
          )
        }



      </section>








      {
        cartItems.length > 0 && (


          <button

            className="floating-cart-bar"

            onClick={() => navigate(`/cart/${id}`)}

          >


            <ShoppingCart size={24} />





            <div className="floating-left">


              <strong>

                {totalItems} Item

              </strong>



              <strong>

                Rp{" "}
                {
                  cartTotal.toLocaleString(
                    "id-ID"
                  )
                }

              </strong>


            </div>





            <div className="floating-right">

              Lihat Keranjang →

            </div>




          </button>


        )
      }




    </div>

  );


}