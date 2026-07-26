import {
  ShoppingBag,
  CheckCircle,
  Package,
  User,
  MapPin,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";


import SellerNavbar from "./SellerNavbar";

import "../../styles/seller/Orders.css";




interface Order {

  id: number;

  customer_name: string;

  address: string;

  total_price: number;

  created_at: string;

  items: string;

  payment_status: string;

  order_status:
  | "NEW"
  | "PREPARING"
  | "READY"
  | "DELIVERING"
  | "DONE"
  | "REJECTED";

}




export default function Orders() {
  const { seller_id } = useParams();

  const [
    openMenu,
    setOpenMenu
  ] = useState(true);

  const [
    orders,
    setOrders
  ] = useState<Order[]>([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    orderFilter,
    setOrderFilter
  ] = useState<
    "all" | "today" | "month"
  >("all");

  const [
    revenueFilter,
    setRevenueFilter
  ] = useState<
    "all" | "today" | "month"
  >("all");

  const [
    statusFilter,
    setStatusFilter
  ] = useState<
    "ALL" |
    "PREPARING" |
    "READY" |
    "DELIVERING" |
    "DONE"
  >("ALL");

  // ==========================
  // LOAD ORDERS
  // ==========================
  const loadOrders = async () => {
    if (!seller_id) return;

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:8080/api/v1/sellers/${seller_id}/orders?status=PAID`
      );

      const data = await response.json();
      setOrders(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadOrders();
  }, [seller_id]);


  // ==========================
  // UPDATE STATUS
  // ==========================
  const updateStatus = async (
    id: number,
    status: Order["order_status"]
  ) => {
    try {
      await fetch(
        `http://localhost:8080/api/v1/orders/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_status: status,
          }),
        }
      );

      await loadOrders();

    } catch (err) {
      console.error(err);
    }
  };


  const handleAccept = (id: number) => {

    updateStatus(id, "PREPARING");

  };

  const handleReject = (id: number) => {

    updateStatus(id, "REJECTED");

  };


  const handleNextStatus = (
    id: number,
    status: Order["order_status"]
  ) => {

    let next = status;

    switch (status) {

      case "PREPARING":
        next = "READY";
        break;

      case "READY":
        next = "DELIVERING";
        break;

      case "DELIVERING":
        next = "DONE";
        break;
    }

    updateStatus(id, next);

  };


  const getStatusLabel = (
    status: Order["order_status"]
  ) => {

    switch (status) {

      case "NEW":
        return "Pesanan Baru";

      case "PREPARING":
        return "Sedang Disiapkan";

      case "READY":
        return "Siap Diantar";

      case "DELIVERING":
        return "Sedang Diantar";

      case "DONE":
        return "Selesai";

      case "REJECTED":
        return "Ditolak";

      default:
        return status;
    }

  };


  const getStatusClass = (
    status: Order["order_status"]
  ) => {

    switch (status) {

      case "NEW":
        return "new";

      case "PREPARING":
        return "preparing";

      case "READY":
        return "ready";

      case "DELIVERING":
        return "delivering";

      case "DONE":
        return "done";

      case "REJECTED":
        return "rejected";

      default:
        return "";
    }

  };



  const isToday = (date: string) => {


    const d =
      new Date(date);


    const now =
      new Date();



    return (

      d.getDate()
      ===
      now.getDate()

      &&

      d.getMonth()
      ===
      now.getMonth()

      &&

      d.getFullYear()
      ===
      now.getFullYear()

    );


  };









  const checkDate = (
    date: string,
    filter: "today" | "month"
  ) => {


    const d =
      new Date(date);



    const now =
      new Date();




    if (filter === "today") {

      return isToday(date);

    }





    if (filter === "month") {


      return (

        d.getMonth()
        ===
        now.getMonth()

        &&

        d.getFullYear()
        ===
        now.getFullYear()

      );


    }


    return true;


  };









  const filteredOrders = orders.filter(order => {


    const dateValid =

      orderFilter === "all"
        ?
        true
        :
        checkDate(
          order.created_at,
          orderFilter
        );


    const statusValid =
      statusFilter === "ALL"
        ? true
        : order.order_status === statusFilter;



    return (
      dateValid
      &&
      statusValid
    );


  });










  const revenueOrders = orders.filter(order => {


    if (revenueFilter === "all")
      return true;



    return checkDate(

      order.created_at,

      revenueFilter

    );


  });






  const totalRevenue =
    revenueOrders.reduce(

      (total, order) =>

        total +
        Number(order.total_price),

      0

    );




  const todayOrders =
    orders.filter(order =>

      isToday(
        order.created_at
      )

    );









  return (



    <div

      className={
        `seller-layout ${openMenu
          ?
          "menu-open"
          :
          "menu-close"
        }`
      }

    >



      <SellerNavbar

        openMenu={openMenu}

        setOpenMenu={setOpenMenu}

      />





      <main className="seller-content">


        <div className="orders-page">





          <div className="orders-header">


            <h1>
              Pesanan Masuk
            </h1>


            <p>
              Kelola pesanan pelanggan dari warteg kamu.
            </p>


          </div>








          <div className="orders-summary">






            {/* TOTAL PESANAN */}



            <div className="summary-card">


              <div className="summary-icon">

                <ShoppingBag size={26} />

              </div>



              <div>


                <span>
                  Total Pesanan
                </span>


                <h2>
                  {
                    filteredOrders.length
                  }
                </h2>




                <select

                  value={orderFilter}

                  onChange={
                    e =>
                      setOrderFilter(
                        e.target.value as any
                      )
                  }

                >


                  <option value="all">
                    Semua
                  </option>


                  <option value="today">
                    Hari Ini
                  </option>


                  <option value="month">
                    Bulan Ini
                  </option>


                </select>


              </div>


            </div>









            {/* STATUS HARI INI */}



            <div className="summary-card">


              <div className="summary-icon success">


                <CheckCircle size={26} />


              </div>


              <div>


                <span>
                  Status Hari Ini
                </span>


                <h2>

                  {

                    todayOrders.filter(
                      (order) =>
                        statusFilter === "ALL"
                          ? true
                          : order.order_status === statusFilter
                    ).length

                  }

                  {" "}Pesanan

                </h2>



                <select

                  value={statusFilter}

                  onChange={
                    e =>
                      setStatusFilter(
                        e.target.value as any
                      )
                  }

                >


                  <option value="ALL">
                    Semua Hari Ini
                  </option>


                  <option value="PREPARING">
                    Sedang Disiapkan
                  </option>


                  <option value="READY">
                    Siap Diantar
                  </option>


                  <option value="DELIVERING">
                    Sedang Diantar
                  </option>


                  <option value="DONE">
                    Selesai
                  </option>


                </select>


              </div>


            </div>









            {/* PENDAPATAN */}



            <div className="summary-card">


              <div className="summary-icon money">


                <Package size={26} />


              </div>



              <div>


                <span>
                  Pendapatan
                </span>



                <h2>

                  Rp {

                    totalRevenue.toLocaleString(
                      "id-ID"
                    )

                  }

                </h2>




                <select

                  value={revenueFilter}

                  onChange={
                    e =>
                      setRevenueFilter(
                        e.target.value as any
                      )
                  }

                >

                  <option value="all">
                    Semua Pendapatan
                  </option>


                  <option value="today">
                    Hari Ini
                  </option>


                  <option value="month">
                    Bulan Ini
                  </option>


                </select>


              </div>



            </div>





          </div>









          <div className="orders-card">

            <div className="card-header">

              <h3>
                Daftar Pesanan
              </h3>

            </div>



            {

              loading ?

                <div className="empty-orders">
                  Memuat...
                </div>



                :

                filteredOrders.length === 0 ?

                  <div className="empty-orders">

                    <ShoppingBag size={45} />

                    <h3>
                      Tidak ada pesanan
                    </h3>

                  </div>



                  :

                  <div className="table-wrapper">

                    <table>

                      <thead>

                        <tr>

                          <th>ID</th>
                          <th>Customer</th>
                          <th>Alamat</th>
                          <th>Menu</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Aksi</th>

                        </tr>

                      </thead>

                      <tbody>

                        {filteredOrders.map((order) => (

                          <tr key={order.id}>

                            <td>
                              #{order.id}
                            </td>

                            <td>

                              <div className="customer">

                                <User size={17} />

                                {order.customer_name}

                              </div>

                            </td>

                            <td>

                              <div className="address">

                                <MapPin size={17} />

                                {order.address}

                              </div>

                            </td>

                            <td>
                              {order.items}
                            </td>

                            <td>

                              <strong>

                                Rp {Number(order.total_price).toLocaleString("id-ID")}

                              </strong>

                            </td>

                            <td>

                              <span
                                className={`status-badge ${getStatusClass(order.order_status)}`}
                              >

                                {getStatusLabel(order.order_status)}

                              </span>

                            </td>

                            <td>

                              {order.order_status === "NEW" && (

                                <div className="action-group">

                                  <button
                                    className="accept-btn"
                                    onClick={() => handleAccept(order.id)}
                                  >
                                    Terima
                                  </button>

                                  <button
                                    className="reject-btn"
                                    onClick={() => handleReject(order.id)}
                                  >
                                    Tolak
                                  </button>

                                </div>

                              )}

                              {order.order_status === "PREPARING" && (

                                <button
                                  className="next-btn"
                                  onClick={() =>
                                    handleNextStatus(
                                      order.id,
                                      order.order_status
                                    )
                                  }
                                >
                                  Siap Diantar
                                </button>

                              )}

                              {order.order_status === "READY" && (

                                <button
                                  className="next-btn"
                                  onClick={() =>
                                    handleNextStatus(
                                      order.id,
                                      order.order_status
                                    )
                                  }
                                >
                                  Driver Mengantar
                                </button>

                              )}

                              {order.order_status === "DELIVERING" && (

                                <button
                                  className="next-btn"
                                  onClick={() =>
                                    handleNextStatus(
                                      order.id,
                                      order.order_status
                                    )
                                  }
                                >
                                  Tandai Selesai
                                </button>

                              )}

                              {order.order_status === "DONE" && (

                                <span className="done-text">

                                  ✔ Pesanan Selesai

                                </span>

                              )}

                              {order.order_status === "REJECTED" && (

                                <span className="reject-text">

                                  Pesanan Ditolak

                                </span>

                              )}

                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>


            }



          </div>





        </div>



      </main>



    </div>


  );



}