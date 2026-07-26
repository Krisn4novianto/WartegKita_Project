import {
    ShoppingBag,
    CheckCircle,
    Package,
    User,
    MapPin,
    XCircle,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useParams,
} from "react-router-dom";


import Swal from "sweetalert2";

import SellerNavbar from "./SellerNavbar";

import "../../styles/seller/Orders.css";




interface Order {


    id: number;

    customer_name: string;

    address: string;

    total_price: number;

    status: string;

    payment_status: string;

    created_at: string;

    items: string;


}








export default function Orders() {



    const {
        seller_id
    } = useParams();





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







    const loadOrders = async () => {


        if (!seller_id)
            return;



        try {


            const response = await fetch(

                `http://localhost:8080/api/v1/sellers/${seller_id}/orders`

            );



            const data =
                await response.json();



            setOrders(data || []);



        }
        catch (err) {

            console.log(err);

        }
        finally {

            setLoading(false);

        }

    };









    useEffect(() => {


        loadOrders();


    }, [seller_id]);









    const updateOrderStatus = async (


        id: number,

        status: string


    ) => {



        try {


            const response = await fetch(

                `http://localhost:8080/api/v1/orders/${id}/status`,

                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },


                    body: JSON.stringify({

                        status

                    })


                }

            );





            if (!response.ok) {

                throw new Error(
                    "Gagal update status"
                );

            }







            Swal.fire({

                icon: "success",

                title:
                    status === "PREPARING"
                        ?
                        "Pesanan Diterima"
                        :
                        "Pesanan Ditolak",

                timer: 1500,

                showConfirmButton: false

            });




            loadOrders();



        }
        catch (err: any) {


            Swal.fire({

                icon: "error",

                title: "Gagal",

                text: err.message

            });


        }


    };









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
                            Konfirmasi pesanan pelanggan sebelum diproses.
                        </p>


                    </div>










                    <div className="orders-card">


                        <div className="card-header">

                            <h3>
                                Daftar Pesanan
                            </h3>

                        </div>







                        {
                            loading ?


                                (

                                    <div className="empty-orders">

                                        Memuat...

                                    </div>

                                )



                                :



                                orders.length === 0 ?



                                    (

                                        <div className="empty-orders">

                                            <ShoppingBag size={45} />

                                            <h3>
                                                Belum ada pesanan
                                            </h3>

                                        </div>


                                    )



                                    :



                                    (

                                        <div className="table-wrapper">


                                            <table>


                                                <thead>

                                                    <tr>


                                                        <th>
                                                            ID
                                                        </th>


                                                        <th>
                                                            Customer
                                                        </th>


                                                        <th>
                                                            Menu
                                                        </th>


                                                        <th>
                                                            Total
                                                        </th>


                                                        <th>
                                                            Status
                                                        </th>


                                                        <th>
                                                            Aksi
                                                        </th>


                                                    </tr>


                                                </thead>






                                                <tbody>


                                                    {

                                                        orders.map(order => (



                                                            <tr key={order.id}>


                                                                <td>
                                                                    #{order.id}
                                                                </td>





                                                                <td>


                                                                    <div className="customer">


                                                                        <User size={17} />


                                                                        {
                                                                            order.customer_name
                                                                        }


                                                                    </div>


                                                                    <div className="address">


                                                                        <MapPin size={15} />

                                                                        {
                                                                            order.address
                                                                        }


                                                                    </div>


                                                                </td>







                                                                <td>

                                                                    {
                                                                        order.items
                                                                    }

                                                                </td>






                                                                <td>


                                                                    Rp {

                                                                        Number(
                                                                            order.total_price
                                                                        )
                                                                            .toLocaleString(
                                                                                "id-ID"
                                                                            )

                                                                    }


                                                                </td>






                                                                <td>



                                                                    {
                                                                        order.status ===
                                                                            "WAITING_CONFIRMATION"

                                                                            ?


                                                                            <span className="waiting">

                                                                                Menunggu Konfirmasi

                                                                            </span>



                                                                            :



                                                                            order.status === "REJECTED"



                                                                                ?



                                                                                <span className="rejected">

                                                                                    Ditolak

                                                                                </span>



                                                                                :



                                                                                <span className="paid">

                                                                                    <CheckCircle size={15} />

                                                                                    Diterima

                                                                                </span>


                                                                    }



                                                                </td>








                                                                <td>



                                                                    {

                                                                        order.status ===
                                                                        "WAITING_CONFIRMATION"

                                                                        &&



                                                                        <div className="order-action">


                                                                            <button


                                                                                className="accept-btn"


                                                                                onClick={() =>


                                                                                    updateOrderStatus(

                                                                                        order.id,

                                                                                        "PREPARING"

                                                                                    )


                                                                                }


                                                                            >


                                                                                <CheckCircle size={16} />

                                                                                Terima


                                                                            </button>







                                                                            <button


                                                                                className="reject-btn"


                                                                                onClick={() =>


                                                                                    updateOrderStatus(

                                                                                        order.id,

                                                                                        "REJECTED"

                                                                                    )


                                                                                }


                                                                            >


                                                                                <XCircle size={16} />

                                                                                Tolak


                                                                            </button>



                                                                        </div>


                                                                    }



                                                                </td>




                                                            </tr>


                                                        ))

                                                    }



                                                </tbody>


                                            </table>



                                        </div>


                                    )

                        }



                    </div>





                </div>



            </main>



        </div>


    );


}