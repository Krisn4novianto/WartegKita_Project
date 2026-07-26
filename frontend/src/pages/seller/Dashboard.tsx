import {
  useEffect,
  useState
} from "react";

import {
  useParams
} from "react-router-dom";

import {
  Wallet,
  Users,
  ShoppingBag,
  TrendingUp
} from "lucide-react";


import "../../styles/seller/Dashboard.css";
import SellerNavbar from "./SellerNavbar";



export default function Dashboard() {


  const {
    seller_id
  } = useParams();



  const [data, setData] = useState<any>(null);

  const [error, setError] = useState("");

  const [openMenu, setOpenMenu] = useState(true);




  useEffect(() => {


    if (!seller_id) return;



    fetch(
      `http://localhost:8080/api/v1/sellers/dashboard/${seller_id}`
    )


      .then(res => {


        if (!res.ok) {


          throw new Error(
            "Gagal mengambil data dashboard"
          );


        }


        return res.json();


      })


      .then(result => {


        setData(result);


      })


      .catch(err => {


        console.error(err);


        setError(
          "Data dashboard tidak tersedia"
        );


      });



  }, [seller_id]);






  if (error) {

    return (

      <div className="dashboard-error">

        {error}

      </div>

    );

  }





  if (!data) {

    return (

      <div className="seller-loading">

        Memuat laporan warteg...

      </div>

    );

  }






  return (


    <div
      className={
        `seller-layout 
        ${openMenu ? "menu-open" : "menu-close"}`
      }
    >




      <SellerNavbar

        openMenu={openMenu}

        setOpenMenu={setOpenMenu}

      />





      <main className="seller-content">



        <div className="seller-dashboard">





          <div className="dashboard-header">


            <h1>
              Dashboard Usaha WarteG
            </h1>


            <p>
              Pantau pemasukan dan perkembangan jualan hari ini
            </p>


          </div>







          <div className="stats-grid">





            <div className="stat-card income">


              <div className="stat-icon">

                <Wallet size={28} />

              </div>



              <div>


                <span>
                  Total Pendapatan
                </span>


                <strong>

                  Rp {data.total_pendapatan.toLocaleString("id-ID")}

                </strong>


              </div>


            </div>







            <div className="stat-card">


              <div className="stat-icon">

                <Users size={28} />

              </div>


              <div>


                <span>
                  Total Pembeli
                </span>


                <strong>

                  {data.total_pembeli}

                  <small>
                    {" "}orang
                  </small>

                </strong>


              </div>


            </div>







            <div className="stat-card">


              <div className="stat-icon">

                <ShoppingBag size={28} />

              </div>


              <div>


                <span>
                  Total Transaksi
                </span>


                <strong>

                  {data.total_transaksi}

                  <small>
                    {" "}pesanan
                  </small>

                </strong>


              </div>


            </div>







            <div className="stat-card">


              <div className="stat-icon">

                <TrendingUp size={28} />

              </div>


              <div>


                <span>
                  Rata-rata Penjualan / Hari
                </span>


                <strong>

                  Rp {data.rata_rata_harian.toLocaleString("id-ID")}

                </strong>


              </div>


            </div>




          </div>







          <div className="seller-info-card">


            <h3>
              Ringkasan Usaha
            </h3>


            <p>
              Dari data transaksi yang masuk,
              dashboard ini membantu melihat performa
              warteg secara harian.
            </p>


          </div>





        </div>


      </main>





    </div>


  );

}