import {
    ArrowLeft,
    Edit3,
    MoreVertical,
    Send,
    Store,
    Trash2,
    User,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import api from "../../services/api";

import "../../styles/chat.css";


/* =====================================================
   TYPES
===================================================== */

type Seller = {
    id: string;

    store_name?: string;

    nama_warteg?: string;

    deskripsi?: string;

    image?: string;

    image_url?: string;
};


type ChatRoom = {
    id: string;

    buyer_id: string;

    seller_id: string;
};


type Message = {
    id: string;

    chat_room_id: string;

    sender_id: string;

    sender_role:
    | "buyer"
    | "seller";

    message: string;

    created_at?: string;

    updated_at?: string;
};


/* =====================================================
   HELPERS
===================================================== */

const getSellerName = (
    seller?: Seller | null,
) => {

    return (
        seller?.nama_warteg ||
        seller?.store_name ||
        "Warteg"
    );
};


const getResponseData = (
    response: any,
) => {

    return (
        response?.data?.data ??
        response?.data ??
        []
    );
};


/* =====================================================
   COMPONENT
===================================================== */

export default function Chat() {

    const navigate =
        useNavigate();


    const [
        searchParams,
    ] =
        useSearchParams();


    const requestedSellerID =
        searchParams.get(
            "seller_id",
        );


    /* =================================================
       SELLERS
    ================================================= */

    const [
        sellers,
        setSellers,
    ] =
        useState<Seller[]>(
            [],
        );


    const [
        activeSeller,
        setActiveSeller,
    ] =
        useState<Seller | null>(
            null,
        );


    /* =================================================
       ROOM
    ================================================= */

    const [
        room,
        setRoom,
    ] =
        useState<ChatRoom | null>(
            null,
        );


    /* =================================================
       MESSAGES
    ================================================= */

    const [
        messages,
        setMessages,
    ] =
        useState<Message[]>(
            [],
        );


    /* =================================================
       INPUT
    ================================================= */

    const [
        text,
        setText,
    ] =
        useState("");


    /* =================================================
       EDIT
    ================================================= */

    const [
        editingMessageID,
        setEditingMessageID,
    ] =
        useState<string | null>(
            null,
        );


    /* =================================================
       MENU
    ================================================= */

    const [
        selectedMessageID,
        setSelectedMessageID,
    ] =
        useState<string | null>(
            null,
        );


    /* =================================================
       LOADING
    ================================================= */

    const [
        loadingSellers,
        setLoadingSellers,
    ] =
        useState(true);


    const [
        loadingMessages,
        setLoadingMessages,
    ] =
        useState(false);


    /* =================================================
       REFS
    ================================================= */

    const messageEndRef =
        useRef<HTMLDivElement>(
            null,
        );


    /* =================================================
       LOAD SELLERS
    ================================================= */

    useEffect(() => {

        let cancelled =
            false;


        const loadSellers =
            async () => {

                try {

                    setLoadingSellers(
                        true,
                    );


                    const response =
                        await api.get(
                            "/sellers",
                        );


                    if (
                        cancelled
                    ) {
                        return;
                    }


                    const data =
                        getResponseData(
                            response,
                        );


                    const sellerArray =
                        Array.isArray(
                            data,
                        )
                            ? data
                            : [];


                    const normalized:
                        Seller[] =
                        sellerArray
                            .map(
                                (
                                    seller: any,
                                ) => ({

                                    id:
                                        String(
                                            seller?.id ??
                                            seller?.seller_id ??
                                            "",
                                        ),

                                    store_name:
                                        seller?.store_name,

                                    nama_warteg:
                                        seller?.nama_warteg,

                                    deskripsi:
                                        seller?.deskripsi ??
                                        seller?.description,

                                    image:
                                        seller?.image,

                                    image_url:
                                        seller?.image_url,

                                }),
                            )
                            .filter(
                                (
                                    seller,
                                ) =>
                                    Boolean(
                                        seller.id,
                                    ),
                            );


                    setSellers(
                        normalized,
                    );


                    /*
                        Kalau URL mengandung seller_id,
                        otomatis pilih seller tersebut.
                    */

                    if (
                        requestedSellerID
                    ) {

                        const requestedSeller =
                            normalized.find(
                                (
                                    seller,
                                ) =>
                                    seller.id ===
                                    requestedSellerID,
                            );


                        if (
                            requestedSeller
                        ) {

                            setActiveSeller(
                                requestedSeller,
                            );

                            return;
                        }
                    }


                    /*
                        Kalau tidak ada seller
                        yang diminta, pilih pertama.
                    */

                    if (
                        normalized.length > 0
                    ) {

                        setActiveSeller(
                            normalized[0],
                        );
                    }

                } catch (
                error
                ) {

                    console.error(
                        "Gagal memuat seller:",
                        error,
                    );

                } finally {

                    if (
                        !cancelled
                    ) {

                        setLoadingSellers(
                            false,
                        );
                    }
                }
            };


        loadSellers();


        return () => {

            cancelled =
                true;
        };

    }, [
        requestedSellerID,
    ]);


    /* =================================================
       CREATE / GET ROOM
    ================================================= */

    useEffect(() => {

        if (
            !activeSeller?.id
        ) {

            setRoom(null);

            setMessages([]);

            return;
        }


        let cancelled =
            false;


        const createRoom =
            async () => {

                try {

                    setLoadingMessages(
                        true,
                    );

                    setMessages([]);

                    setRoom(null);


                    const response =
                        await api.post(
                            "/chat/rooms",
                            {
                                seller_id:
                                    activeSeller.id,
                            },
                        );


                    if (
                        cancelled
                    ) {
                        return;
                    }


                    const data =
                        getResponseData(
                            response,
                        );


                    if (
                        !data ||
                        !data.id
                    ) {

                        throw new Error(
                            "Chat room tidak valid.",
                        );
                    }


                    setRoom(
                        data,
                    );

                } catch (
                error
                ) {

                    console.error(
                        "Gagal membuat chat room:",
                        error,
                    );

                } finally {

                    if (
                        !cancelled
                    ) {

                        setLoadingMessages(
                            false,
                        );
                    }
                }
            };


        createRoom();


        return () => {

            cancelled =
                true;
        };

    }, [
        activeSeller,
    ]);


    /* =================================================
       LOAD MESSAGES
    ================================================= */

    const loadMessages =
        async () => {

            if (
                !room?.id
            ) {
                return;
            }


            try {

                const response =
                    await api.get(
                        `/chat/rooms/${room.id}/messages`,
                    );


                const data =
                    getResponseData(
                        response,
                    );


                setMessages(
                    Array.isArray(
                        data,
                    )
                        ? data
                        : [],
                );

            } catch (
            error
            ) {

                console.error(
                    "Gagal memuat pesan:",
                    error,
                );
            }
        };


    useEffect(() => {

        if (
            !room?.id
        ) {
            return;
        }


        loadMessages();

    }, [
        room?.id,
    ]);


    /* =================================================
       AUTO SCROLL
    ================================================= */

    useEffect(() => {

        messageEndRef.current?.scrollIntoView(
            {
                behavior: "smooth",
            },
        );

    }, [
        messages,
    ]);


    /* =================================================
       SELLER SORTING
    ================================================= */

    const sortedSellers =
        useMemo(
            () => {

                if (
                    !requestedSellerID
                ) {

                    return sellers;
                }


                return [
                    ...sellers,
                ].sort(
                    (
                        first,
                        second,
                    ) => {

                        if (
                            first.id ===
                            requestedSellerID
                        ) {
                            return -1;
                        }

                        if (
                            second.id ===
                            requestedSellerID
                        ) {
                            return 1;
                        }

                        return 0;
                    },
                );

            },
            [
                sellers,
                requestedSellerID,
            ],
        );


    /* =================================================
       SEND / UPDATE MESSAGE
    ================================================= */

    const submitMessage =
        async () => {

            const message =
                text.trim();


            if (
                !message
            ) {
                return;
            }


            if (
                !room?.id
            ) {
                return;
            }


            try {

                /*
                    EDIT
                */

                if (
                    editingMessageID
                ) {

                    await api.put(
                        `/chat/messages/${editingMessageID}`,
                        {
                            message,
                        },
                    );

                    setEditingMessageID(
                        null,
                    );

                    setText("");

                    setSelectedMessageID(
                        null,
                    );

                    await loadMessages();

                    return;
                }


                /*
                    SEND
                */

                await api.post(
                    "/chat/messages",
                    {
                        chat_room_id:
                            room.id,

                        message,
                    },
                );


                setText("");

                await loadMessages();

            } catch (
            error
            ) {

                console.error(
                    "Gagal mengirim pesan:",
                    error,
                );
            }
        };


    /* =================================================
       EDIT MESSAGE
    ================================================= */

    const startEdit =
        (
            message: Message,
        ) => {

            if (
                message.sender_role !==
                "buyer"
            ) {

                return;
            }


            setText(
                message.message,
            );


            setEditingMessageID(
                message.id,
            );


            setSelectedMessageID(
                null,
            );
        };


    /* =================================================
       DELETE MESSAGE
    ================================================= */

    const deleteMessage =
        async (
            messageID: string,
        ) => {

            const confirmed =
                window.confirm(
                    "Hapus pesan ini?",
                );


            if (
                !confirmed
            ) {
                return;
            }


            try {

                await api.delete(
                    `/chat/messages/${messageID}`,
                );


                setSelectedMessageID(
                    null,
                );


                setMessages(
                    (
                        previous,
                    ) =>
                        previous.filter(
                            (
                                message,
                            ) =>
                                message.id !==
                                messageID,
                        ),
                );

            } catch (
            error
            ) {

                console.error(
                    "Gagal menghapus pesan:",
                    error,
                );
            }
        };


    /* =================================================
       CANCEL EDIT
    ================================================= */

    const cancelEdit =
        () => {

            setEditingMessageID(
                null,
            );

            setText("");
        };


    /* =================================================
       LOADING
    ================================================= */

    if (
        loadingSellers
    ) {

        return (

            <div
                className="chat-page"
            >

                <div
                    className="chat-loading"
                >

                    <div
                        className="chat-loading-spinner"
                    />

                    <p>
                        Memuat chat...
                    </p>

                </div>

            </div>
        );
    }


    /* =================================================
       RENDER
    ================================================= */

    return (

        <div
            className="chat-page"
        >

            <div
                className="chat-container"
            >

                {/* =================================================
                    SIDEBAR
                ================================================= */}

                <aside
                    className="chat-sidebar"
                >

                    <div
                        className="chat-sidebar-header"
                    >

                        <button
                            type="button"
                            className="chat-back-button"
                            onClick={() =>
                                navigate(
                                    "/explore",
                                )
                            }
                        >

                            <ArrowLeft
                                size={19}
                            />

                        </button>


                        <div>

                            <span>
                                WARTEGKITA
                            </span>

                            <h2>
                                Chat Warteg
                            </h2>

                        </div>

                    </div>


                    <div
                        className="chat-sidebar-list"
                    >

                        {
                            sortedSellers.length ===
                                0 ? (

                                <div
                                    className="chat-no-seller"
                                >

                                    <Store
                                        size={28}
                                    />

                                    <p>
                                        Belum ada warteg.
                                    </p>

                                </div>

                            ) : (

                                sortedSellers.map(
                                    (
                                        seller,
                                    ) => (

                                        <button
                                            key={
                                                seller.id
                                            }
                                            type="button"
                                            className={
                                                activeSeller?.id ===
                                                    seller.id
                                                    ? "chat-store active"
                                                    : "chat-store"
                                            }
                                            onClick={() =>
                                                setActiveSeller(
                                                    seller,
                                                )
                                            }
                                        >

                                            <div
                                                className="chat-store-avatar"
                                            >

                                                <Store
                                                    size={20}
                                                />

                                            </div>


                                            <div
                                                className="chat-store-info"
                                            >

                                                <strong>
                                                    {
                                                        getSellerName(
                                                            seller,
                                                        )
                                                    }
                                                </strong>

                                                <span>
                                                    Chat dengan penjual
                                                </span>

                                            </div>

                                        </button>

                                    ),
                                )

                            )
                        }

                    </div>

                </aside>


                {/* =================================================
                    CHAT ROOM
                ================================================= */}

                <section
                    className="chat-room"
                >

                    {/* HEADER */}

                    <header
                        className="chat-room-header"
                    >

                        <div
                            className="chat-room-avatar"
                        >

                            <Store
                                size={22}
                            />

                        </div>


                        <div
                            className="chat-room-title"
                        >

                            <strong>
                                {
                                    getSellerName(
                                        activeSeller,
                                    )
                                }
                            </strong>

                            <span>
                                Chat Penjual
                            </span>

                        </div>

                    </header>


                    {/* MESSAGE AREA */}

                    <div
                        className="message-area"
                        onClick={() =>
                            setSelectedMessageID(
                                null,
                            )
                        }
                    >

                        {
                            loadingMessages ? (

                                <div
                                    className="chat-message-loading"
                                >

                                    <div
                                        className="chat-loading-spinner"
                                    />

                                    <span>
                                        Membuka percakapan...
                                    </span>

                                </div>

                            ) : messages.length ===
                                0 ? (

                                <div
                                    className="chat-empty"
                                >

                                    <div
                                        className="chat-empty-icon"
                                    >

                                        <Store
                                            size={30}
                                        />

                                    </div>

                                    <h3>
                                        Mulai percakapan
                                    </h3>

                                    <p>
                                        Kirim pesan kepada{" "}
                                        {
                                            getSellerName(
                                                activeSeller,
                                            )
                                        }.
                                    </p>

                                </div>

                            ) : (

                                messages.map(
                                    (
                                        message,
                                    ) => {

                                        const isBuyer =
                                            message.sender_role ===
                                            "buyer";


                                        return (

                                            <div
                                                key={
                                                    message.id
                                                }
                                                className={
                                                    isBuyer
                                                        ? "message-row buyer-row"
                                                        : "message-row seller-row"
                                                }
                                            >

                                                <div
                                                    className={
                                                        isBuyer
                                                            ? "message buyer"
                                                            : "message seller"
                                                    }
                                                    onClick={(
                                                        event,
                                                    ) => {

                                                        event.stopPropagation();

                                                        setSelectedMessageID(
                                                            (
                                                                current,
                                                            ) =>
                                                                current ===
                                                                    message.id
                                                                    ? null
                                                                    : message.id,
                                                        );

                                                    }}
                                                >

                                                    <div
                                                        className="message-avatar"
                                                    >

                                                        {
                                                            isBuyer
                                                                ? (
                                                                    <User
                                                                        size={14}
                                                                    />
                                                                )
                                                                : (
                                                                    <Store
                                                                        size={14}
                                                                    />
                                                                )
                                                        }

                                                    </div>


                                                    <div
                                                        className="message-content"
                                                    >

                                                        <span>
                                                            {
                                                                message.message
                                                            }
                                                        </span>


                                                        {
                                                            editingMessageID ===
                                                            message.id && (

                                                                <small>
                                                                    Sedang diedit
                                                                </small>

                                                            )
                                                        }

                                                    </div>


                                                    {
                                                        selectedMessageID ===
                                                        message.id && (

                                                            <div
                                                                className="message-menu"
                                                                onClick={(
                                                                    event,
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >

                                                                {
                                                                    isBuyer && (

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                startEdit(
                                                                                    message,
                                                                                )
                                                                            }
                                                                        >

                                                                            <Edit3
                                                                                size={14}
                                                                            />

                                                                            Edit

                                                                        </button>

                                                                    )
                                                                }


                                                                {
                                                                    isBuyer && (

                                                                        <button
                                                                            type="button"
                                                                            className="danger"
                                                                            onClick={() =>
                                                                                deleteMessage(
                                                                                    message.id,
                                                                                )
                                                                            }
                                                                        >

                                                                            <Trash2
                                                                                size={14}
                                                                            />

                                                                            Hapus

                                                                        </button>

                                                                    )
                                                                }

                                                            </div>

                                                        )
                                                    }

                                                </div>

                                            </div>
                                        );
                                    },
                                )

                            )
                        }


                        <div
                            ref={
                                messageEndRef
                            }
                        />

                    </div>


                    {/* INPUT */}

                    <div
                        className={
                            editingMessageID
                                ? "chat-input-wrapper editing"
                                : "chat-input-wrapper"
                        }
                    >

                        {
                            editingMessageID && (

                                <div
                                    className="editing-bar"
                                >

                                    <div>

                                        <Edit3
                                            size={15}
                                        />

                                        <span>
                                            Mengedit pesan
                                        </span>

                                    </div>


                                    <button
                                        type="button"
                                        onClick={
                                            cancelEdit
                                        }
                                    >
                                        Batal
                                    </button>

                                </div>

                            )
                        }


                        <div
                            className="chat-input"
                        >

                            <input
                                type="text"
                                value={
                                    text
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setText(
                                        event.target.value,
                                    )
                                }
                                onKeyDown={(
                                    event,
                                ) => {

                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {

                                        event.preventDefault();

                                        submitMessage();
                                    }
                                }}
                                placeholder={
                                    editingMessageID
                                        ? "Edit pesan..."
                                        : "Tulis pesan ke penjual..."
                                }
                            />


                            <button
                                type="button"
                                onClick={
                                    submitMessage
                                }
                                disabled={
                                    !text.trim() ||
                                    !room
                                }
                                aria-label={
                                    editingMessageID
                                        ? "Simpan perubahan"
                                        : "Kirim pesan"
                                }
                            >

                                {
                                    editingMessageID
                                        ? (
                                            <Edit3
                                                size={19}
                                            />
                                        )
                                        : (
                                            <Send
                                                size={19}
                                            />
                                        )
                                }

                            </button>

                        </div>

                    </div>

                </section>

            </div>

        </div>
    );
}