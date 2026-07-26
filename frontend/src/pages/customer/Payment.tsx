import { useEffect, useState } from "react";

import {
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";


import api from "../../services/api";

import {
    useCartStore
} from "../../store/cartStore";


import {
    PaymentMethod
} from "../../types/types";


import "../../styles/payment.css";


import QRISPayment from "./Payment/QRISPayment";
import BankTransferPayment from "./Payment/BankTransferPayment";
import VirtualAccountPayment from "./Payment/VirtualAccountPayment";
import PaypalPayment from "./Payment/PaypalPayment";
import CODPayment from "./Payment/CODPayment";



// =====================================
// SESUAI BACKEND
// =====================================

interface OrderItem {

    menu_id: number;

    quantity: number;

}



interface Order {

    id: number;

    restaurant_name?: string;

    payment_method: PaymentMethod;

    total_amount: number;

    status: string;

    items: OrderItem[];

}




export default function Payment() {

    console.log("PAYMENT PAGE RENDER");

    const {
        id
    } = useParams();



    const navigate = useNavigate();



    const clearCart =
        useCartStore(
            state => state.clear
        );



    const [
        order,
        setOrder
    ] = useState<Order | null>(null);



    const [
        loading,
        setLoading
    ] = useState(true);





    // =====================================
    // GET ORDER
    // =====================================

    useEffect(() => {


        if (!id) {

            setLoading(false);

            return;

        }



        async function fetchOrder() {


            try {


                const response =
                    await api.get(
                        `/orders/${id}`
                    );


                console.log(
                    "ORDER:",
                    response.data
                );


                setOrder({
                    ...response.data,
                    items: response.data.items || []
                });


            } catch (error) {


                console.error(error);


                setOrder(null);


            } finally {


                setLoading(false);


            }

        }



        fetchOrder();



    }, [id]);






    const paymentLabels: Record<
        PaymentMethod,
        string
    > = {


        qris:
            "QRIS",


        bank_transfer:
            "Transfer Bank",


        virtual_account:
            "Virtual Account",


        paypal:
            "PayPal",


        cod:
            "Cash On Delivery",


    };







    // =====================================
    // PAYMENT SUCCESS
    // =====================================

    async function handleSuccess() {


        console.log(
            "BUTTON PAYMENT CLICK"
        );


        if (!order) {

            console.log(
                "ORDER KOSONG"
            );

            return;

        }



        try {


            console.log(
                "PAY ORDER ID:",
                order.id
            );



            await api.put(
                `/orders/${order.id}/pay`
            );



            console.log(
                "PAY BERHASIL"
            );



            clearCart();



            navigate(
                "/order-success",
                {

                    state: {

                        orderId:
                            order.id,


                        total:
                            order.total_amount,


                        restaurant:
                            order.restaurant_name,


                        paymentMethod:
                            order.payment_method,

                    }

                }
            );



        } catch (error) {


            console.error(
                "PAY ERROR",
                error
            );


            alert(
                "Pembayaran gagal."
            );


        }


    }




    function renderPaymentMethod() {


        if (!order)
            return null;



        switch (
        order.payment_method
        ) {


            case "qris":

                return (
                    <QRISPayment
                        total={
                            order.total_amount
                        }
                    />
                );



            case "bank_transfer":

                return (
                    <BankTransferPayment
                        total={
                            order.total_amount
                        }
                    />
                );



            case "virtual_account":

                return (
                    <VirtualAccountPayment
                        total={
                            order.total_amount
                        }
                    />
                );



            case "paypal":

                return (
                    <PaypalPayment
                        total={
                            order.total_amount
                        }
                    />
                );



            case "cod":

                return (
                    <CODPayment
                        total={
                            order.total_amount
                        }
                    />
                );


            default:

                return null;


        }


    }







    if (loading) {

        return (

            <div className="payment-loading">

                Memuat pembayaran...

            </div>

        );

    }





    if (!order) {

        return (

            <div className="payment-loading">


                <h2>
                    Order tidak ditemukan
                </h2>



                <button

                    className="payment-back-button"

                    onClick={() =>
                        navigate("/orders")
                    }

                >

                    Kembali

                </button>


            </div>

        );

    }







    return (

        <div className="payment-page">


            <div className="payment-container">



                {/* HEADER */}

                <div className="payment-top">


                    <button

                        className="back-button"

                        onClick={() =>
                            navigate(-1)
                        }

                    >

                        <ArrowLeft size={22} />

                        Kembali


                    </button>





                    <div className="payment-hero">


                        <div className="payment-header">


                            <h1>
                                Selesaikan Pembayaran
                            </h1>


                            <p>
                                Silakan selesaikan pembayaran sesuai metode.
                            </p>


                        </div>



                    </div>



                </div>









                <div className="payment-layout">





                    <main className="payment-main">





                        <section className="payment-card">


                            <div className="checkout-card-header">


                                <div className="checkout-number">

                                    1

                                </div>



                                <div>

                                    <h2>
                                        Status Pembayaran
                                    </h2>


                                    <p>
                                        Status: {order.status}
                                    </p>


                                </div>


                            </div>



                            <div className="payment-status">


                                <CheckCircle2 />


                                <div>


                                    <strong>
                                        Menunggu Pembayaran
                                    </strong>


                                    <p>
                                        Pesanan #{order.id}
                                    </p>


                                </div>


                            </div>



                        </section>









                        <section className="payment-card">


                            <h2>
                                Metode Pembayaran
                            </h2>



                            <div className="method-box">


                                <strong>

                                    {
                                        paymentLabels[
                                        order.payment_method
                                        ]
                                    }

                                </strong>


                            </div>



                        </section>









                        <section className="payment-card">


                            <h2>
                                Instruksi Pembayaran
                            </h2>



                            {
                                renderPaymentMethod()
                            }


                        </section>





                    </main>









                    <aside className="payment-summary">





                        <div className="summary-header">


                            <h2>
                                Ringkasan Pesanan
                            </h2>



                            <span>

                                {
                                    order.items.length
                                }
                                {" "}menu

                            </span>


                        </div>







                        <div className="payment-items">


                            {

                                order.items.map(
                                    (item, index) => (


                                        <div

                                            key={index}

                                            className="checkout-item"

                                        >


                                            <div>

                                                <strong>
                                                    {item.menu_name}
                                                </strong>

                                                <span>

                                                    Jumlah:
                                                    {" "}
                                                    {item.quantity}

                                                </span>


                                            </div>



                                        </div>


                                    ))

                            }


                        </div>








                        <div className="summary-divider" />








                        <div className="summary-total">


                            <span>
                                Total Bayar
                            </span>



                            <strong>

                                Rp{" "}

                                {
                                    Number(
                                        order.total_amount
                                    )
                                        .toLocaleString(
                                            "id-ID"
                                        )
                                }


                            </strong>


                        </div>








                        <button

                            className="checkout-pay-button"

                            onClick={
                                handleSuccess
                            }

                        >

                            <CheckCircle2 size={20} />


                            Konfirmasi Pembayaran


                        </button>






                    </aside>






                </div>






            </div>



        </div>

    );

}