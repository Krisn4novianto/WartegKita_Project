import {
    ArrowLeft,
    Edit3,
    Send,
    ShieldAlert,
    Store,
    Trash2,
    User,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import api from "../../services/api";

import {
    containsBlockedContent,
    CHAT_MODERATION_WARNING,
} from "../../utils/chatModeration";

import "../../styles/chat.css";


/* =========================================================
   TYPES
========================================================= */

type Seller = {
    id: string;

    store_name?: string;
    nama_warteg?: string;

    deskripsi?: string;

    image?: string;
    image_url?: string;

    /* Operating hours */
    jam_buka?: string;
    jam_tutup?: string;

    opening_time?: string;
    closing_time?: string;

    /* Backend store status */
    is_open?: boolean;
    status?: string;
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

    sender_role: "buyer" | "seller";

    message: string;

    created_at?: string;
    updated_at?: string;
};


/* =========================================================
   SELLER HELPERS
========================================================= */

const getSellerName = (
    seller?: Seller | null,
): string => {
    return (
        seller?.nama_warteg ||
        seller?.store_name ||
        "Warteg"
    );
};


const getSellerImage = (
    seller?: Seller | null,
): string => {
    return (
        seller?.image_url ||
        seller?.image ||
        ""
    );
};


/* =========================================================
   API RESPONSE HELPER
========================================================= */

const getResponseData = (
    response: any,
) => {
    return (
        response?.data?.data ??
        response?.data ??
        []
    );
};


/* =========================================================
   TIME HELPERS
========================================================= */

const parseTimeToMinutes = (
    value?: string,
): number | null => {
    if (!value) {
        return null;
    }


    const normalized =
        String(value).trim();


    const match =
        normalized.match(
            /^(\d{1,2}):(\d{2})/,
        );


    if (!match) {
        return null;
    }


    const hour =
        Number(match[1]);


    const minute =
        Number(match[2]);


    if (
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59
    ) {
        return null;
    }


    return (
        hour * 60 +
        minute
    );
};


/* =========================================================
   STORE OPEN STATUS
========================================================= */

const isSellerOpen = (
    seller?: Seller | null,
): boolean => {

    if (!seller) {
        return false;
    }


    /* -----------------------------------------------------
       1. BACKEND BOOLEAN
    ----------------------------------------------------- */

    if (
        typeof seller.is_open ===
        "boolean"
    ) {
        return seller.is_open;
    }


    /* -----------------------------------------------------
       2. BACKEND STATUS
    ----------------------------------------------------- */

    if (seller.status) {

        const status =
            seller.status
                .toLowerCase()
                .trim();


        if (
            [
                "closed",
                "close",
                "tutup",
                "inactive",
                "offline",
            ].includes(status)
        ) {
            return false;
        }


        if (
            [
                "open",
                "opened",
                "buka",
                "active",
                "online",
            ].includes(status)
        ) {
            return true;
        }
    }


    /* -----------------------------------------------------
       3. OPERATING HOURS
    ----------------------------------------------------- */

    const openingTime =
        seller.jam_buka ||
        seller.opening_time;


    const closingTime =
        seller.jam_tutup ||
        seller.closing_time;


    /*
     * Kalau backend tidak mengirim jam,
     * jangan blokir chat.
     */

    if (
        !openingTime ||
        !closingTime
    ) {
        return true;
    }


    const openingMinutes =
        parseTimeToMinutes(
            openingTime,
        );


    const closingMinutes =
        parseTimeToMinutes(
            closingTime,
        );


    /*
     * Format jam invalid.
     */

    if (
        openingMinutes === null ||
        closingMinutes === null
    ) {
        return true;
    }


    /* -----------------------------------------------------
       CURRENT TIME - ASIA/JAKARTA
    ----------------------------------------------------- */

    const now =
        new Date();


    const jakartaTime =
        new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone:
                    "Asia/Jakarta",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false,
            },
        ).format(now);


    const currentMinutes =
        parseTimeToMinutes(
            jakartaTime,
        );


    if (
        currentMinutes === null
    ) {
        return true;
    }


    /* -----------------------------------------------------
       NORMAL SCHEDULE
       Example: 08:00 - 22:00
    ----------------------------------------------------- */

    if (
        openingMinutes <
        closingMinutes
    ) {
        return (
            currentMinutes >=
            openingMinutes &&
            currentMinutes <
            closingMinutes
        );
    }


    /* -----------------------------------------------------
       OVERNIGHT SCHEDULE
       Example: 18:00 - 02:00
    ----------------------------------------------------- */

    if (
        openingMinutes >
        closingMinutes
    ) {
        return (
            currentMinutes >=
            openingMinutes ||
            currentMinutes <
            closingMinutes
        );
    }


    /*
     * Opening == closing
     *
     * Anggap 24 jam.
     */

    return true;
};


/* =========================================================
   COMPONENT
========================================================= */

export default function Chat() {

    const navigate =
        useNavigate();


    const [
        searchParams,
    ] = useSearchParams();


    /* =====================================================
       REQUESTED SELLER
    ===================================================== */

    const requestedSellerID =
        searchParams.get(
            "seller_id",
        );


    /* =====================================================
       SELLER STATE
    ===================================================== */

    const [
        activeSeller,
        setActiveSeller,
    ] =
        useState<Seller | null>(
            null,
        );


    /* =====================================================
       ROOM STATE
    ===================================================== */

    const [
        room,
        setRoom,
    ] =
        useState<ChatRoom | null>(
            null,
        );


    /* =====================================================
       MESSAGE STATE
    ===================================================== */

    const [
        messages,
        setMessages,
    ] =
        useState<Message[]>(
            [],
        );


    /* =====================================================
       INPUT STATE
    ===================================================== */

    const [
        text,
        setText,
    ] =
        useState("");


    /* =====================================================
       EDIT STATE
    ===================================================== */

    const [
        editingMessageID,
        setEditingMessageID,
    ] =
        useState<string | null>(
            null,
        );


    /* =====================================================
       MESSAGE MENU STATE
    ===================================================== */

    const [
        selectedMessageID,
        setSelectedMessageID,
    ] =
        useState<string | null>(
            null,
        );


    /* =====================================================
       WARNING STATE
    ===================================================== */

    const [
        chatWarning,
        setChatWarning,
    ] =
        useState<string | null>(
            null,
        );


    /* =====================================================
       LOADING STATE
    ===================================================== */

    const [
        loadingSeller,
        setLoadingSeller,
    ] =
        useState(true);


    const [
        loadingMessages,
        setLoadingMessages,
    ] =
        useState(false);


    /* =====================================================
       REFS
    ===================================================== */

    const messageEndRef =
        useRef<HTMLDivElement>(
            null,
        );


    const inputRef =
        useRef<HTMLInputElement>(
            null,
        );


    /* =====================================================
       STORE STATUS
    ===================================================== */

    const sellerIsOpen =
        isSellerOpen(
            activeSeller,
        );


    /* =====================================================
       DERIVED SELLER DATA
    ===================================================== */

    const sellerName =
        getSellerName(
            activeSeller,
        );


    const sellerImage =
        getSellerImage(
            activeSeller,
        );


    /* =====================================================
       LOAD SELLER
    ===================================================== */

    useEffect(() => {

        let cancelled =
            false;


        const loadSeller =
            async () => {

                if (
                    !requestedSellerID
                ) {
                    setLoadingSeller(
                        false,
                    );

                    return;
                }


                try {

                    setLoadingSeller(
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


                    const seller =
                        sellerArray
                            .map(
                                (
                                    item: any,
                                ): Seller => ({
                                    id:
                                        String(
                                            item?.id ??
                                            item?.seller_id ??
                                            "",
                                        ),

                                    store_name:
                                        item?.store_name,

                                    nama_warteg:
                                        item?.nama_warteg,

                                    deskripsi:
                                        item?.deskripsi ??
                                        item?.description,

                                    image:
                                        item?.image,

                                    image_url:
                                        item?.image_url,

                                    jam_buka:
                                        item?.jam_buka,

                                    jam_tutup:
                                        item?.jam_tutup,

                                    opening_time:
                                        item?.opening_time,

                                    closing_time:
                                        item?.closing_time,

                                    is_open:
                                        typeof item?.is_open ===
                                            "boolean"
                                            ? item.is_open
                                            : undefined,

                                    status:
                                        item?.status,
                                }),
                            )
                            .find(
                                (
                                    item: Seller,
                                ) =>
                                    item.id ===
                                    requestedSellerID,
                            );


                    setActiveSeller(
                        seller ||
                        null,
                    );

                } catch (
                error
                ) {

                    console.error(
                        "Gagal memuat seller:",
                        error,
                    );


                    setActiveSeller(
                        null,
                    );

                } finally {

                    if (
                        !cancelled
                    ) {
                        setLoadingSeller(
                            false,
                        );
                    }
                }
            };


        loadSeller();


        return () => {
            cancelled =
                true;
        };

    }, [
        requestedSellerID,
    ]);


    /* =====================================================
       CREATE / GET CHAT ROOM
    ===================================================== */

    useEffect(() => {

        /*
         * Belum ada seller.
         */

        if (
            !activeSeller?.id
        ) {

            setRoom(null);
            setMessages([]);

            return;
        }


        /*
         * WARTEG TUTUP
         *
         * Jangan membuat chat room.
         */

        if (
            !sellerIsOpen
        ) {

            setRoom(null);
            setMessages([]);
            setLoadingMessages(false);

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
                        !data?.id
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


                    setRoom(null);

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
        activeSeller?.id,
        sellerIsOpen,
    ]);


    /* =====================================================
       LOAD MESSAGES
    ===================================================== */

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
            !room?.id ||
            !sellerIsOpen
        ) {
            return;
        }


        loadMessages();

    }, [
        room?.id,
        sellerIsOpen,
    ]);


    /* =====================================================
       AUTO SCROLL
    ===================================================== */

    useEffect(() => {

        messageEndRef.current?.scrollIntoView(
            {
                behavior:
                    "smooth",
            },
        );

    }, [
        messages,
    ]);


    /* =====================================================
       CLEAR WARNING
    ===================================================== */

    useEffect(() => {

        if (
            !text.trim() &&
            chatWarning
        ) {

            setChatWarning(
                null,
            );
        }

    }, [
        text,
        chatWarning,
    ]);


    /* =====================================================
       SUBMIT MESSAGE
    ===================================================== */

    const submitMessage =
        async () => {

            const message =
                text.trim();


            /*
             * Jangan kirim:
             *
             * - kosong
             * - tidak ada room
             * - warteg tutup
             */

            if (
                !message ||
                !room?.id ||
                !sellerIsOpen
            ) {
                return;
            }


            /* -------------------------------------------------
               MODERATION
            ------------------------------------------------- */

            if (
                containsBlockedContent(
                    message,
                )
            ) {

                setChatWarning(
                    CHAT_MODERATION_WARNING,
                );

                return;
            }


            try {

                /* ---------------------------------------------
                   EDIT MESSAGE
                --------------------------------------------- */

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

                    setChatWarning(
                        null,
                    );


                    await loadMessages();

                    return;
                }


                /* ---------------------------------------------
                   SEND MESSAGE
                --------------------------------------------- */

                await api.post(
                    "/chat/messages",
                    {
                        chat_room_id:
                            room.id,

                        message,
                    },
                );


                setText("");

                setChatWarning(
                    null,
                );


                await loadMessages();

            } catch (
            error: any
            ) {

                console.error(
                    "Gagal mengirim pesan:",
                    error,
                );


                const backendMessage =
                    error?.response?.data?.message ||
                    error?.response?.data?.error;


                setChatWarning(
                    backendMessage ||
                    "Pesan gagal dikirim. Silakan coba lagi.",
                );
            }
        };


    /* =====================================================
       START EDIT
    ===================================================== */

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

            setChatWarning(
                null,
            );


            setTimeout(() => {

                inputRef.current?.focus();

            }, 50);
        };


    /* =====================================================
       DELETE MESSAGE
    ===================================================== */

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


    /* =====================================================
       CANCEL EDIT
    ===================================================== */

    const cancelEdit =
        () => {

            setEditingMessageID(
                null,
            );

            setText("");

            setChatWarning(
                null,
            );
        };


    /* =====================================================
       HEADER BACK
       Kembali ke halaman sebelumnya.
    ===================================================== */

    const handleBack =
        () => {
            navigate(-1);
        };


    /* =====================================================
       GO TO EXPLORE
       Khusus closed store.
    ===================================================== */

    const handleExplore =
        () => {

            /*
             * Ganti route ini kalau route Explore
             * di project kamu menggunakan path berbeda.
             */

            navigate(
                "/explore",
            );
        };


    /* =====================================================
       LOADING SELLER
    ===================================================== */

    if (
        loadingSeller
    ) {

        return (
            <div className="chat-page">

                <div className="chat-loading">

                    <div className="chat-loading-spinner" />

                    <p>
                        Membuka chat...
                    </p>

                </div>

            </div>
        );
    }


    /* =====================================================
       SELLER NOT FOUND
    ===================================================== */

    if (
        !requestedSellerID ||
        !activeSeller
    ) {

        return (
            <div className="chat-page">

                <div className="chat-error-page">

                    <div className="chat-error-icon">

                        <Store
                            size={28}
                        />

                    </div>


                    <h2>
                        Warteg tidak ditemukan
                    </h2>


                    <p>
                        Percakapan tidak dapat
                        dibuka karena data warteg
                        tidak tersedia.
                    </p>


                    <button
                        type="button"
                        onClick={
                            handleBack
                        }
                    >

                        <ArrowLeft
                            size={17}
                        />

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
        <div className="chat-page">

            <div className="chat-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="chat-room-header">

                    <button
                        type="button"
                        className="chat-back-button"
                        onClick={
                            handleBack
                        }
                        aria-label="Kembali"
                    >

                        <ArrowLeft
                            size={20}
                        />

                    </button>


                    <div className="chat-room-avatar">

                        {sellerImage ? (

                            <img
                                src={
                                    sellerImage
                                }
                                alt={
                                    sellerName
                                }
                            />

                        ) : (

                            <Store
                                size={21}
                            />

                        )}

                    </div>


                    <div className="chat-room-title">

                        <strong>
                            {sellerName}
                        </strong>


                        <span
                            className={
                                sellerIsOpen
                                    ? "chat-status-open"
                                    : "chat-status-closed"
                            }
                        >

                            <span className="chat-status-dot" />

                            {sellerIsOpen
                                ? "Sedang buka"
                                : "Sedang tutup"}

                        </span>

                    </div>

                </header>


                {/* =================================================
                    OPEN STORE
                ================================================= */}

                {sellerIsOpen ? (

                    <>

                        {/* =================================================
                            SAFETY NOTICE
                        ================================================= */}

                        <div className="chat-safety-notice">

                            <div className="chat-safety-icon">

                                <ShieldAlert
                                    size={18}
                                />

                            </div>


                            <div className="chat-safety-content">

                                <strong>
                                    Jaga komunikasi tetap sopan
                                </strong>


                                <p>
                                    Jangan kirim kata kasar,
                                    pornografi, pelecehan,
                                    ancaman, atau konten yang
                                    melanggar aturan WartegKita.
                                </p>

                            </div>

                        </div>


                        {/* =================================================
                            MESSAGE AREA
                        ================================================= */}

                        <div
                            className="message-area"
                            onClick={() =>
                                setSelectedMessageID(
                                    null,
                                )
                            }
                        >

                            {/* -------------------------------------------------
                                LOADING
                            ------------------------------------------------- */}

                            {loadingMessages ? (

                                <div className="chat-message-loading">

                                    <div className="chat-loading-spinner" />

                                    <span>
                                        Membuka percakapan...
                                    </span>

                                </div>

                            ) : messages.length === 0 ? (

                                /* -------------------------------------------------
                                   EMPTY CHAT
                                ------------------------------------------------- */

                                <div className="chat-empty">

                                    <div className="chat-empty-icon">

                                        {sellerImage ? (

                                            <img
                                                src={
                                                    sellerImage
                                                }
                                                alt=""
                                            />

                                        ) : (

                                            <Store
                                                size={30}
                                            />

                                        )}

                                    </div>


                                    <h3>
                                        Mulai percakapan
                                    </h3>


                                    <p>
                                        Tanyakan menu,
                                        ketersediaan, atau
                                        informasi pesanan
                                        kepada{" "}

                                        <strong>
                                            {sellerName}
                                        </strong>

                                        .
                                    </p>

                                </div>

                            ) : (

                                /* -------------------------------------------------
                                   MESSAGE LIST
                                ------------------------------------------------- */

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

                                                    {/* ---------------------------------------------
                                                        AVATAR
                                                    --------------------------------------------- */}

                                                    <div className="message-avatar">

                                                        {isBuyer ? (

                                                            <User
                                                                size={14}
                                                            />

                                                        ) : (

                                                            <Store
                                                                size={14}
                                                            />

                                                        )}

                                                    </div>


                                                    {/* ---------------------------------------------
                                                        CONTENT
                                                    --------------------------------------------- */}

                                                    <div className="message-content">

                                                        <span>
                                                            {
                                                                message.message
                                                            }
                                                        </span>


                                                        {editingMessageID ===
                                                            message.id && (

                                                                <small>
                                                                    Sedang diedit
                                                                </small>

                                                            )}

                                                    </div>


                                                    {/* ---------------------------------------------
                                                        MENU
                                                    --------------------------------------------- */}

                                                    {selectedMessageID ===
                                                        message.id && (

                                                            <div
                                                                className="message-menu"
                                                                onClick={(
                                                                    event,
                                                                ) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >

                                                                {isBuyer && (

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

                                                                )}


                                                                {isBuyer && (

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

                                                                )}

                                                            </div>

                                                        )}

                                                </div>

                                            </div>
                                        );
                                    },
                                )
                            )}


                            <div
                                ref={
                                    messageEndRef
                                }
                            />

                        </div>


                        {/* =================================================
                            WARNING
                        ================================================= */}

                        {chatWarning && (

                            <div
                                className="chat-warning"
                                role="alert"
                            >

                                <ShieldAlert
                                    size={17}
                                />


                                <span>
                                    {
                                        chatWarning
                                    }
                                </span>


                                <button
                                    type="button"
                                    onClick={() =>
                                        setChatWarning(
                                            null,
                                        )
                                    }
                                    aria-label="Tutup"
                                >
                                    ×
                                </button>

                            </div>

                        )}


                        {/* =================================================
                            INPUT
                        ================================================= */}

                        <div
                            className={
                                editingMessageID
                                    ? "chat-input-wrapper editing"
                                    : "chat-input-wrapper"
                            }
                        >

                            {/* -------------------------------------------------
                                EDITING BAR
                            ------------------------------------------------- */}

                            {editingMessageID && (

                                <div className="editing-bar">

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

                            )}


                            {/* -------------------------------------------------
                                INPUT BOX
                            ------------------------------------------------- */}

                            <div className="chat-input">

                                <input
                                    ref={
                                        inputRef
                                    }
                                    type="text"
                                    value={
                                        text
                                    }
                                    maxLength={
                                        500
                                    }
                                    autoComplete="off"
                                    onChange={(
                                        event,
                                    ) => {

                                        setText(
                                            event.target.value,
                                        );


                                        if (
                                            chatWarning
                                        ) {

                                            setChatWarning(
                                                null,
                                            );
                                        }

                                    }}
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

                                    {editingMessageID ? (

                                        <Edit3
                                            size={18}
                                        />

                                    ) : (

                                        <Send
                                            size={18}
                                        />

                                    )}

                                </button>

                            </div>

                        </div>

                    </>

                ) : (

                    /* =================================================
                       CLOSED STORE STATE
                    ================================================= */

                    <main className="chat-closed-state">

                        <div className="chat-closed-card">

                            {/* ---------------------------------------------
                                STORE ILLUSTRATION
                            --------------------------------------------- */}

                            <div className="chat-closed-icon">

                                <Store
                                    size={42}
                                    strokeWidth={1.8}
                                />

                            </div>


                            {/* ---------------------------------------------
                                BADGE
                            --------------------------------------------- */}

                            <span className="chat-closed-badge">
                                WARTEG SEDANG TUTUP
                            </span>


                            {/* ---------------------------------------------
                                TITLE
                            --------------------------------------------- */}

                            <h1>
                                Waduh, wartegnya lagi tutup 😴
                            </h1>


                            {/* ---------------------------------------------
                                DESCRIPTION
                            --------------------------------------------- */}

                            <p className="chat-closed-description">

                                Jangan khawatir, besok lagi yaa!
                                <br />

                                Kamu bisa ngobrol dengan{" "}

                                <strong>
                                    {sellerName}
                                </strong>

                                {" "}saat wartegnya buka lagi.

                            </p>


                            {/* ---------------------------------------------
                                STORE INFO
                            --------------------------------------------- */}

                            <div className="chat-closed-store">

                                <div className="chat-closed-store-icon">

                                    {sellerImage ? (

                                        <img
                                            src={
                                                sellerImage
                                            }
                                            alt={
                                                sellerName
                                            }
                                        />

                                    ) : (

                                        <Store
                                            size={20}
                                        />

                                    )}

                                </div>


                                <div className="chat-closed-store-info">

                                    <strong>
                                        {sellerName}
                                    </strong>


                                    <span>
                                        Chat tersedia saat warteg buka
                                    </span>

                                </div>

                            </div>


                            {/* ---------------------------------------------
                                EXPLORE CTA
                            --------------------------------------------- */}

                            <button
                                type="button"
                                className="chat-explore-button"
                                onClick={
                                    handleExplore
                                }
                            >

                                <Store
                                    size={17}
                                />

                                Yuk cari warteg lain

                            </button>

                        </div>

                    </main>

                )}

            </div>

        </div>
    );
}