import {
    Send,
    Store,
    User,
    Edit3,
    Trash2,
    Plus,
    X,
} from "lucide-react";

import {
    useState,
    useEffect,
    useRef,
} from "react";

import "../../styles/chat.css";



type Seller = {

    id: number;

    name: string;

    status: string;

};



type Message = {

    id: number;

    sender: "buyer" | "seller";

    text: string;

};




export default function Chat() {


    const [sellers, setSellers] = useState<Seller[]>([

        {
            id: 1,
            name: "Warteg Bahari Jaya",
            status: "Online"
        },


        {
            id: 2,
            name: "Warteg Bu Sari",
            status: "Online"
        },


        {
            id: 3,
            name: "Warteg Maju Jaya",
            status: "Offline"
        }

    ]);





    const [activeSeller, setActiveSeller] =
        useState<Seller>(sellers[0]);





    const [messages, setMessages] = useState<
        Record<number, Message[]>
    >({


        1: [

            {
                id: 1,
                sender: "seller",
                text: "Halo kak, ada yang bisa kami bantu?"
            },

            {
                id: 2,
                sender: "buyer",
                text: "Apakah ayam geprek masih tersedia?"
            }

        ],


        2: [

            {
                id: 3,
                sender: "seller",
                text: "Selamat datang di Warteg Bu Sari"
            }

        ],


        3: [

            {
                id: 4,
                sender: "seller",
                text: "Silahkan tanya menu kami"
            }

        ]

    });






    const [text, setText] = useState("");



    const [
        selectedMessage,
        setSelectedMessage
    ] = useState<number | null>(null);



    const [
        editMode,
        setEditMode
    ] = useState(false);




    const [
        showAdd,
        setShowAdd
    ] = useState(false);




    const [
        newSeller,
        setNewSeller
    ] = useState("");






    const menuRef = useRef<HTMLDivElement>(null);





    const currentMessages =
        messages[activeSeller.id] || [];







    useEffect(() => {


        const close = (e: any) => {


            if (
                menuRef.current &&
                !menuRef.current.contains(e.target)
            ) {

                setSelectedMessage(null);

            }


        };



        document.addEventListener(
            "mousedown",
            close
        );



        return () => {

            document.removeEventListener(
                "mousedown",
                close
            );

        };


    }, []);









    const addSeller = () => {


        if (!newSeller.trim())
            return;



        const seller = {

            id: Date.now(),

            name: newSeller,

            status: "Online"

        };



        setSellers([

            ...sellers,

            seller

        ]);



        setMessages({

            ...messages,

            [seller.id]: []

        });



        setActiveSeller(seller);


        setNewSeller("");

        setShowAdd(false);


    };








    const deleteSeller = (id: number) => {


        const filtered =
            sellers.filter(
                seller => seller.id !== id
            );


        setSellers(filtered);



        if (activeSeller.id === id) {

            setActiveSeller(
                filtered[0]
            );

        }


    };









    const sendMessage = () => {


        if (!text.trim())
            return;



        if (editMode) {



            setMessages({

                ...messages,


                [activeSeller.id]:

                    currentMessages.map(msg =>


                        msg.id === selectedMessage

                            ?

                            {
                                ...msg,
                                text: text
                            }

                            :

                            msg


                    )


            });



            setEditMode(false);


        }



        else {


            setMessages({

                ...messages,


                [activeSeller.id]:


                    [

                        ...currentMessages,


                        {

                            id: Date.now(),

                            sender: "buyer",

                            text: text

                        }


                    ]


            });


        }



        setText("");

        setSelectedMessage(null);


    };










    const deleteMessage = (id: number) => {


        setMessages({

            ...messages,


            [activeSeller.id]:


                currentMessages.filter(
                    msg => msg.id !== id
                )


        });


        setSelectedMessage(null);


    };









    return (

        <div className="chat-page">


            <div className="chat-container">





                {/* SIDEBAR */}


                <aside className="chat-sidebar">



                    <div className="chat-sidebar-header">


                        <h2>
                            Chat
                        </h2>



                        <button

                            onClick={() =>
                                setShowAdd(!showAdd)
                            }

                        >

                            <Plus size={18} />

                        </button>


                    </div>







                    {
                        sellers.map(seller => (


                            <div

                                key={seller.id}

                                className={

                                    activeSeller.id === seller.id

                                        ?

                                        "chat-store active"

                                        :

                                        "chat-store"

                                }


                            >



                                <div

                                    className="chat-user"

                                    onClick={() => {

                                        setActiveSeller(seller);

                                        setSelectedMessage(null);

                                    }}

                                >


                                    <Store size={22} />



                                    <div>


                                        <strong>

                                            {seller.name}

                                        </strong>


                                        <span>

                                            {seller.status}

                                        </span>



                                    </div>


                                </div>





                                <button

                                    className="delete-chat"

                                    onClick={() => deleteSeller(seller.id)}

                                >

                                    <X size={16} />


                                </button>




                            </div>



                        ))
                    }







                    {
                        showAdd &&


                        <div className="add-chat-box">


                            <input

                                value={newSeller}

                                onChange={(e) =>
                                    setNewSeller(
                                        e.target.value
                                    )
                                }


                                placeholder="Nama warteg..."

                            />



                            <button

                                onClick={addSeller}

                            >

                                Tambah

                            </button>


                        </div>

                    }




                </aside>









                {/* CHAT ROOM */}


                <section className="chat-room">



                    <header>


                        <Store size={24} />


                        <div>


                            <strong>

                                {activeSeller.name}

                            </strong>


                            <span>

                                {activeSeller.status}

                            </span>



                        </div>


                    </header>









                    <div className="message-area">


                        {

                            currentMessages.map(msg => (


                                <div


                                    key={msg.id}


                                    onClick={() => {


                                        setSelectedMessage(

                                            selectedMessage === msg.id

                                                ?

                                                null

                                                :

                                                msg.id

                                        )


                                    }}


                                    className={

                                        msg.sender === "buyer"

                                            ?

                                            "message buyer"

                                            :

                                            "message seller"

                                    }



                                >



                                    {
                                        msg.sender === "buyer"

                                            ?

                                            <User size={15} />

                                            :

                                            <Store size={15} />

                                    }




                                    <span>

                                        {msg.text}

                                    </span>







                                    {
                                        selectedMessage === msg.id &&



                                        <div

                                            ref={menuRef}

                                            className="message-menu"

                                        >




                                            {
                                                msg.sender === "buyer" &&


                                                <button


                                                    onClick={(e) => {


                                                        e.stopPropagation();


                                                        setText(
                                                            msg.text
                                                        );


                                                        setEditMode(true);


                                                        setSelectedMessage(null);


                                                    }}


                                                >

                                                    <Edit3 size={14} />

                                                    Edit


                                                </button>

                                            }







                                            <button


                                                onClick={(e) => {


                                                    e.stopPropagation();


                                                    deleteMessage(
                                                        msg.id
                                                    );


                                                }}


                                            >

                                                <Trash2 size={14} />

                                                Hapus


                                            </button>




                                        </div>


                                    }




                                </div>


                            ))

                        }



                    </div>









                    <div className="chat-input">


                        <input

                            value={text}

                            onChange={(e) =>
                                setText(
                                    e.target.value
                                )
                            }


                            placeholder={
                                editMode

                                    ?

                                    "Edit pesan..."

                                    :

                                    "Tulis pesan..."
                            }

                        />



                        <button

                            onClick={sendMessage}

                        >

                            {
                                editMode

                                    ?

                                    <Edit3 />

                                    :

                                    <Send />

                            }

                        </button>



                    </div>





                </section>



            </div>


        </div>


    );


}