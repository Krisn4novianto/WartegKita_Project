import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";


import {
  Search,
  MapPin,
  Clock3,
  Star,
  ArrowRight,
  Bike,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";


import api from "../../services/api";

import {
  Seller,
  Menu,
  MenuCategory,
} from "../../types";
import StoreCard from "../../components/StoreCard";


export default function Home() {

  const [categories, setCategories] =
    useState<MenuCategory[]>([
      {
        id: 0,
        name: "Semua",
        emoji: "🍽️",
        is_active: true,
      },
    ]);

  const [sellers, setSellers] =
    useState<Seller[]>([]);

  const [
    menus,
    setMenus
  ] =
    useState<Menu[]>([]);

  const [
    search,
    setSearch
  ] =
    useState("");


  const [
    activeCategory,
    setActiveCategory
  ] =
    useState(
      "Semua"
    );



  const [
    location,
    setLocation
  ] =
    useState(
      "Jakarta Selatan"
    );



  const [
    showLocationMenu,
    setShowLocationMenu
  ] =
    useState(false);


  useEffect(() => {

    const loadData = async () => {

      try {
        const [
          sellerResult,
          menuResult,
          categoryResult,
        ] = await Promise.all([
          api.get("/sellers"),
          api.get("/menus"),
          api.get("/menu-categories"),
        ]);

        console.log("SELLERS", sellerResult.data);
        console.log("MENUS", menuResult.data);


        if (Array.isArray(sellerResult.data)) {

          const formatted = sellerResult.data.map((item: any) => ({
            id: item.id,
            store_name: item.store_name,
            description: item.description,
            address: item.address,
            rating: item.rating ?? 0,
            is_open: true,
            distance_km: 0,
          }));

          setSellers(formatted);

        }

        if (Array.isArray(menuResult.data)) {
          setMenus(menuResult.data);
        }

        if (Array.isArray(categoryResult.data)) {

          setCategories([
            {
              id: 0,
              name: "Semua",
              emoji: "🍽️",
              is_active: true,
            },
            ...categoryResult.data,
          ]);

        }

      } catch (error) {

        console.log("Load home gagal", error);

      }

    };

    loadData();

  }, []);


  const filteredSellers = useMemo(() => {


    const keyword =
      search
        .toLowerCase()
        .trim();



    return sellers.filter(
      (seller) => {


        const sellerMenus =
          menus.filter(
            (menu) =>
              String(menu.seller_id)
              ===
              String(seller.id)
          );


        const matchCategory =
          activeCategory === "Semua" ||

          sellerMenus.some(
            (menu) =>
              (menu.category || "").toLowerCase() ===
              activeCategory.toLowerCase()
          );



        const matchSearch =
          !keyword ||

          seller.store_name
            .toLowerCase()
            .includes(keyword)

          ||

          seller.description
            .toLowerCase()
            .includes(keyword)

          ||

          seller.address
            .toLowerCase()
            .includes(keyword)

          ||

          sellerMenus.some(
            (menu) =>
              menu.name
                .toLowerCase()
                .includes(keyword)
          );



        return (
          matchCategory &&
          matchSearch
        );


      }
    );


  }, [
    sellers,
    menus,
    search,
    activeCategory
  ]);





  const handleNearest = () => {


    setSellers(
      previous =>
        [
          ...previous
        ].sort(
          (a, b) =>
            (
              a.distance_km ?? 999
            )
            -
            (
              b.distance_km ?? 999
            )
        )
    );


  };





  const handleTrusted = () => {


    setSellers(
      previous =>
        [
          ...previous
        ].sort(
          (a, b) =>
            (
              b.rating ?? 0
            )
            -
            (
              a.rating ?? 0
            )
        )
    );


  };





  const handleFast = () => {


    setSellers(
      previous =>
        [
          ...previous
        ].sort(
          (a, b) =>
            Number(
              b.is_open
            )
            -
            Number(
              a.is_open
            )
        )
    );


  };

  return (

    <div className="home-page">

      {/* HERO */}

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
            WartegKita membantu kamu menemukan
            warteg terdekat, memilih menu favorit,
            lalu memesan makanan tanpa harus
            meninggalkan aktivitasmu.
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
              Antar ke lokasi kamu
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





      {/* SEARCH */}


      <section className="quick-search card">


        <div className="search-heading">


          <div>

            <span className="eyebrow">
              MAU MAKAN APA HARI INI?
            </span>


            <h2>
              Cari warteg di sekitarmu
            </h2>

          </div>




          <div className="location-wrapper">


            <button

              className="location-pill"

              onClick={() =>
                setShowLocationMenu(
                  !showLocationMenu
                )
              }

            >

              <MapPin size={16} />

              {location}

            </button>



            {
              showLocationMenu && (

                <div className="location-dropdown">


                  {
                    [
                      "Jakarta Selatan",
                      "Jakarta Pusat",
                      "Jakarta Barat",
                      "Jakarta Timur",
                    ]
                      .map(item => (


                        <button

                          key={item}

                          onClick={() => {

                            setLocation(item);

                            setShowLocationMenu(false);

                          }}

                        >

                          <MapPin size={15} />

                          {item}

                        </button>


                      ))
                  }


                </div>

              )
            }


          </div>


        </div>





        <div className="search-box">


          <Search size={20} />



          <input

            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }

            placeholder="Cari nama warteg atau menu..."

          />



          <Link

            to={`/explore?search=${search}`}

            className="button"

          >

            Cari

          </Link>



        </div>





        <div className="category-list">


          {
            categories.map(category => (


              <button

                key={category.id}

                className={
                  activeCategory === category.name

                    ?

                    "category-chip active"

                    :

                    "category-chip"
                }



                onClick={() => {

                  setActiveCategory(category.name);

                }}


              >


                <span className="category-emoji">

                  {category.emoji}

                </span>


                {category.name}


              </button>


            ))
          }


        </div>


      </section>





      {/* BENEFIT */}


      <section className="benefit-grid">


        <div

          className="benefit-item"

          onClick={handleNearest}

          style={{
            cursor: "pointer"
          }}

        >

          <div className="benefit-icon">

            <MapPin size={21} />

          </div>


          <div>

            <strong>
              Dekat denganmu
            </strong>


            <span>
              Temukan warteg berdasarkan jarak.
            </span>


          </div>


        </div>





        <div

          className="benefit-item"

          onClick={handleFast}

          style={{
            cursor: "pointer"
          }}

        >

          <div className="benefit-icon">

            <Clock3 size={21} />

          </div>


          <div>

            <strong>
              Hemat waktu
            </strong>


            <span>
              Pesan dulu, ambil atau tunggu diantar.
            </span>


          </div>


        </div>





        <div

          className="benefit-item"

          onClick={handleTrusted}

          style={{
            cursor: "pointer"
          }}

        >

          <div className="benefit-icon">

            <Star size={21} />

          </div>


          <div>

            <strong>
              Pilihan terpercaya
            </strong>


            <span>
              Lihat rating sebelum memesan.
            </span>


          </div>


        </div>


      </section>





      {/* STORE */}


      <section className="section">


        <div className="section-header section-header-with-subtitle">


          <div>


            <span className="eyebrow">
              REKOMENDASI UNTUKMU
            </span>


            <h2>
              Warteg terdekat
            </h2>


            <p className="section-subtitle">

              Pilihan warteg yang bisa kamu pesan sekarang.

            </p>


          </div>



          <Link

            to="/explore"

            className="text-link"

          >

            Lihat semua

            <ArrowRight size={16} />


          </Link>



        </div>





        <div className="grid">


          {
            filteredSellers.map(
              (seller, index) => (


                <StoreCard

                  key={seller.id}

                  seller={seller}

                  imageIndex={index}

                />


              )
            )
          }


        </div>




        {
          filteredSellers.length === 0 && (


            <div className="empty-state card">


              <h3>
                Warteg tidak ditemukan
              </h3>


              <p>
                Coba gunakan kata kunci lain
                atau kategori berbeda.
              </p>


            </div>


          )
        }



      </section>


      {/* Fitur Pesan */}
      <section className="chat-banner">


        <div>

          <span className="eyebrow">
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



      {/* PROMO */}


      <section className="promo-banner">


        <div>


          <span className="eyebrow">

            WARTEGKITA UNTUK KAMU

          </span>


          <h2>

            Gak sempat keluar?
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


    </div>

  );

}