import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  MessageSquareText,
  Store,
  Check,
  Pencil,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useCartStore,
} from "../../store/cartStore";

import api from "../../services/api";

import "../../styles/cart.css";


/* =====================================================
   IMAGE URL
===================================================== */

const getImageUrl = (
  image?: string | null,
): string => {

  if (!image) {
    return "/images/no-image.png";
  }

  const value =
    String(image).trim();

  if (!value) {
    return "/images/no-image.png";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const baseURL =
    api.defaults.baseURL ?? "";

  let origin =
    baseURL;

  try {

    if (
      baseURL.startsWith("http://") ||
      baseURL.startsWith("https://")
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

  return `${origin.replace(
    /\/$/,
    "",
  )}/${value.replace(
    /^\//,
    "",
  )}`;
};


/* =====================================================
   PRICE
===================================================== */

const formatPrice = (
  value: number,
): string => {

  return `Rp ${(
    Number(value) || 0
  ).toLocaleString(
    "id-ID",
  )}`;

};


/* =====================================================
   CART PAGE
===================================================== */

export default function Cart() {

  const navigate =
    useNavigate();

  const {
    storeId: urlStoreId,
  } =
    useParams<{
      storeId?: string;
    }>();


  /* =================================================
     CART STORE
  ================================================= */

  const items =
    useCartStore(
      state =>
        state.items,
    );

  const storeId =
    useCartStore(
      state =>
        state.storeId,
    );

  const increase =
    useCartStore(
      state =>
        state.increase,
    );

  const decrease =
    useCartStore(
      state =>
        state.decrease,
    );

  const remove =
    useCartStore(
      state =>
        state.remove,
    );

  const setItemNote =
    useCartStore(
      state =>
        state.setItemNote,
    );

  const total =
    useCartStore(
      state =>
        state.total(),
    );


  /* =================================================
     SELLER ID

     Prioritas:
     1. Zustand storeId
     2. URL storeId
     3. seller_id dari menu cart
  ================================================= */

  const sellerId =
    String(
      storeId ??
      urlStoreId ??
      items[0]?.menu?.seller_id ??
      "",
    ).trim();


  /* =================================================
     SELLER DATA
  ================================================= */

  const [
    sellerName,
    setSellerName,
  ] = useState(
    "Memuat warteg...",
  );


  const [
    sellerLoading,
    setSellerLoading,
  ] = useState(
    false,
  );


  /* =================================================
     LOAD SELLER
  ================================================= */

  useEffect(() => {

    let cancelled = false;

    const loadSeller = async () => {

      if (!sellerId) {

        setSellerName(
          "Warteg",
        );

        setSellerLoading(
          false,
        );

        return;

      }

      setSellerLoading(
        true,
      );

      try {

        const response =
          await api.get(
            `/sellers/${encodeURIComponent(
              sellerId,
            )}`,
          );

        if (cancelled) {
          return;
        }

        const seller =
          response.data?.data ??
          response.data?.seller ??
          response.data;

        const name =
          seller?.name ??
          seller?.seller_name ??
          seller?.nama_warung ??
          seller?.nama ??
          seller?.store_name ??
          seller?.warung_name ??
          "";

        const normalizedName =
          String(
            name,
          ).trim();

        setSellerName(
          normalizedName ||
          "Warteg",
        );

      } catch (error) {

        console.error(
          "Gagal memuat data seller:",
          error,
        );

        if (!cancelled) {

          setSellerName(
            "Warteg",
          );

        }

      } finally {

        if (!cancelled) {

          setSellerLoading(
            false,
          );

        }

      }

    };

    loadSeller();

    return () => {

      cancelled = true;

    };

  }, [sellerId]);


  /* =================================================
     NOTE DRAFT

     draft = tulisan yang sedang diketik user.

     Draft TIDAK sama dengan item.note.

     item.note:
     -> nilai yang benar-benar sudah disimpan.

     noteDrafts:
     -> nilai sementara sebelum tombol Simpan
        ditekan.
  ================================================= */

  const [
    noteDrafts,
    setNoteDrafts,
  ] = useState<
    Record<string, string>
  >({});


  /* =================================================
     EDIT MODE
  ================================================= */

  const [
    editingNotes,
    setEditingNotes,
  ] = useState<
    Record<string, boolean>
  >({});


  /* =================================================
     SAVED FEEDBACK
  ================================================= */

  const [
    savedNotes,
    setSavedNotes,
  ] = useState<
    Record<string, boolean>
  >({});


  /* =================================================
     INITIALIZE NOTE DRAFTS

     Hanya buat draft kalau belum ada.

     Jangan overwrite draft yang sedang
     diketik user.
  ================================================= */

  useEffect(() => {

    setNoteDrafts(
      previous => {

        const next: Record<
          string,
          string
        > = {
          ...previous,
        };

        items.forEach(
          item => {

            const itemId =
              String(
                item.id,
              );

            /*
             * Kalau draft belum ada,
             * ambil dari note yang SUDAH tersimpan.
             */

            if (
              !Object.prototype.hasOwnProperty.call(
                next,
                itemId,
              )
            ) {

              next[itemId] =
                item.note ??
                "";

            }

          },
        );

        /*
         * Bersihkan draft dari item
         * yang sudah tidak ada di cart.
         */

        const validIds =
          new Set(
            items.map(
              item =>
                String(
                  item.id,
                ),
            ),
          );

        Object.keys(
          next,
        ).forEach(
          itemId => {

            if (
              !validIds.has(
                itemId,
              )
            ) {

              delete next[
                itemId
              ];

            }

          },
        );

        return next;

      },
    );

  }, [items]);


  /* =================================================
     NOTE CHANGE

     PENTING:

     DI SINI TIDAK ADA setItemNote().

     User hanya mengubah draft lokal.
  ================================================= */

  const handleNoteChange = (
    itemId: string,
    value: string,
  ) => {

    setNoteDrafts(
      previous => ({
        ...previous,
        [itemId]: value,
      }),
    );

    /*
     * Jangan ubah item.note.
     *
     * Jangan panggil setItemNote().
     */

    setSavedNotes(
      previous => ({
        ...previous,
        [itemId]: false,
      }),
    );

  };


  /* =================================================
     OPEN EDIT NOTE
  ================================================= */

  const handleEditNote = (
    itemId: string,
  ) => {

    const item =
      items.find(
        current =>
          String(
            current.id,
          ) === itemId,
      );

    /*
     * Saat edit dibuka,
     * draft dimulai dari note yang
     * BENAR-BENAR sudah tersimpan.
     */

    setNoteDrafts(
      previous => ({
        ...previous,
        [itemId]:
          item?.note ??
          "",
      }),
    );

    setEditingNotes(
      previous => ({
        ...previous,
        [itemId]: true,
      }),
    );

    setSavedNotes(
      previous => ({
        ...previous,
        [itemId]: false,
      }),
    );

  };


  /* =================================================
     SAVE NOTE

     SATU-SATUNYA tempat note masuk
     ke Zustand.
  ================================================= */

  const handleSaveNote = (
    itemId: string,
  ) => {

    const value =
      noteDrafts[itemId] ?? "";

    const cleanValue =
      value.trim();

    /*
     * BARU DI SINI note benar-benar
     * disimpan ke Zustand.
     */

    setItemNote(
      itemId,
      cleanValue,
    );

    /*
     * Pastikan draft juga mengikuti
     * nilai yang telah disimpan.
     */

    setNoteDrafts(
      previous => ({
        ...previous,
        [itemId]: cleanValue,
      }),
    );

    /*
     * Tutup textarea.
     */

    setEditingNotes(
      previous => ({
        ...previous,
        [itemId]: false,
      }),
    );

    /*
     * Feedback tersimpan.
     */

    setSavedNotes(
      previous => ({
        ...previous,
        [itemId]: true,
      }),
    );

    window.setTimeout(() => {

      setSavedNotes(
        previous => ({
          ...previous,
          [itemId]: false,
        }),
      );

    }, 1800);

  };


  /* =================================================
     NOTE BLUR

     BLUR TIDAK BOLEH MENYIMPAN.

     User bisa klik:
     - tempat lain
     - tombol
     - quantity
     - halaman lain

     tanpa otomatis menyimpan draft.
  ================================================= */

  const handleNoteBlur = (
    _itemId: string,
  ) => {

    /*
     * Sengaja kosong.
     *
     * Tidak ada setItemNote().
     */

  };


  /* =================================================
     TOTAL ITEMS
  ================================================= */

  const totalItems =
    items.reduce(
      (
        sum,
        item,
      ) => {

        return (
          sum +
          (
            Number(
              item.quantity,
            ) || 0
          )
        );

      },
      0,
    );


  /* =================================================
     CART VALIDATION
  ================================================= */

  const cartBelongsToUrlStore =
    !urlStoreId ||
    !sellerId ||
    String(
      urlStoreId,
    ) ===
    String(
      sellerId,
    );


  /* =================================================
     BACK
  ================================================= */

  const handleBack = () => {

    if (sellerId) {

      navigate(
        `/store/${encodeURIComponent(
          sellerId,
        )}`,
      );

      return;

    }

    navigate(
      "/explore",
    );

  };


  /* =================================================
     CHECKOUT

     Hanya note yang sudah disimpan
     yang akan dibawa ke checkout.

     Draft yang belum disimpan
     TIDAK dipaksa masuk.
  ================================================= */

  const handleCheckout = () => {

    if (
      !items.length ||
      total <= 0 ||
      !sellerId
    ) {
      return;
    }

    navigate(
      "/checkout",
    );

  };


  /* =================================================
     EMPTY CART
  ================================================= */

  if (
    items.length === 0
  ) {

    return (

      <div className="cart-page empty-cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">

            <ShoppingBag
              size={42}
            />

          </div>

          <h1>
            Keranjang masih kosong
          </h1>

          <p>
            Belum ada makanan yang
            kamu tambahkan ke
            keranjang.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/explore",
              )
            }
          >
            Cari Makanan
          </button>

        </div>

      </div>

    );

  }


  /* =================================================
     WRONG STORE
  ================================================= */

  if (
    !cartBelongsToUrlStore
  ) {

    return (

      <div className="cart-page empty-cart-page">

        <div className="empty-cart">

          <div className="empty-cart-icon">

            <Store
              size={42}
            />

          </div>

          <h1>
            Keranjang berbeda
          </h1>

          <p>
            Keranjang ini berisi
            pesanan dari warteg lain.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={
              handleBack
            }
          >
            Kembali
          </button>

        </div>

      </div>

    );

  }


  /* =================================================
     RENDER
  ================================================= */

  return (

    <div className="cart-page">


      {/* =================================================
         HERO
      ================================================= */}

      <header className="cart-hero">

        <div className="cart-hero-inner">

          <button
            type="button"
            className="cart-back-button"
            onClick={
              handleBack
            }
          >

            <ArrowLeft
              size={17}
            />

            <span>
              Kembali
            </span>

          </button>


          <div className="cart-hero-content">

            <div className="cart-eyebrow">

              <ShoppingBag
                size={13}
              />

              <span>
                KERANJANG
              </span>

            </div>


            <h1>
              Keranjang Pesanan
            </h1>


            <p>
              Atur jumlah menu dan
              tambahkan catatan khusus
              untuk setiap pesananmu.
            </p>

          </div>


          {/* =================================================
             PROGRESS
          ================================================= */}

          <div className="cart-progress">

            <div className="cart-progress-step active">

              <span className="cart-step-number">
                1
              </span>

              <span>
                Keranjang
              </span>

            </div>


            <div className="cart-progress-line" />


            <div className="cart-progress-step">

              <span className="cart-step-number">
                2
              </span>

              <span>
                Checkout
              </span>

            </div>


            <div className="cart-progress-line" />


            <div className="cart-progress-step">

              <span className="cart-step-number">
                3
              </span>

              <span>
                Pembayaran
              </span>

            </div>

          </div>

        </div>

      </header>


      {/* =================================================
         MAIN
      ================================================= */}

      <div className="cart-container">

        <div className="cart-layout">


          {/* =================================================
             LEFT
          ================================================= */}

          <main className="cart-main">


            {/* =================================================
               SELLER
            ================================================= */}

            <section className="cart-seller-card">

              <div className="cart-seller-icon">

                <Store
                  size={19}
                />

              </div>


              <div className="cart-seller-info">

                <span>
                  Pesanan dari
                </span>

                <strong>

                  {sellerLoading
                    ? "Memuat warteg..."
                    : sellerName}

                </strong>

              </div>

            </section>


            {/* =================================================
               MENU
            ================================================= */}

            <section className="cart-menu-section">

              <div className="cart-section-header">

                <div>

                  <h2>
                    Menu Pesanan
                  </h2>

                  <p>
                    {totalItems} item dalam
                    keranjang
                  </p>

                </div>

              </div>


              <div className="cart-item-list">

                {items.map(
                  item => {

                    const price =
                      Number(
                        item.menu?.price,
                      ) || 0;

                    const quantity =
                      Number(
                        item.quantity,
                      ) || 0;

                    const subtotal =
                      price *
                      quantity;

                    const itemId =
                      String(
                        item.id,
                      );

                    const imageUrl =
                      getImageUrl(
                        item.menu?.image,
                      );


                    /*
                     * NOTE YANG SUDAH DISIMPAN
                     *
                     * Ini sumber kebenaran
                     * untuk menentukan apakah
                     * catatan sudah tersimpan.
                     */

                    const savedNote =
                      String(
                        item.note ??
                        "",
                      );


                    /*
                     * NOTE DRAFT
                     *
                     * Ini hanya untuk textarea.
                     */

                    const draftNote =
                      Object.prototype.hasOwnProperty.call(
                        noteDrafts,
                        itemId,
                      )
                        ? noteDrafts[
                        itemId
                        ]
                        : savedNote;


                    const isEditing =
                      editingNotes[
                      itemId
                      ] === true;


                    const isSaved =
                      savedNotes[
                      itemId
                      ] === true;


                    /*
                     * PENTING:
                     *
                     * Apakah textarea harus tampil?
                     *
                     * 1. Sedang edit
                     * ATAU
                     *
                     * 2. Belum ada note yang
                     *    benar-benar tersimpan.
                     *
                     * BUKAN berdasarkan draftNote.
                     *
                     * Jadi mengetik "n" tidak akan
                     * membuat textarea hilang.
                     */

                    const showNoteEditor =
                      isEditing ||
                      !savedNote.trim();


                    return (

                      <article
                        key={
                          itemId
                        }
                        className="cart-item-card"
                      >


                        {/* =================================================
                           PRODUCT HEADER
                        ================================================= */}

                        <div className="cart-item-header">

                          <div className="cart-item-product">

                            <div className="cart-image-wrapper">

                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  item.menu.name
                                }
                                className="cart-image"
                                onError={
                                  event => {

                                    if (
                                      event.currentTarget.src.endsWith(
                                        "/images/no-image.png",
                                      )
                                    ) {
                                      return;
                                    }

                                    event.currentTarget.src =
                                      "/images/no-image.png";

                                  }
                                }
                              />

                            </div>


                            <div className="cart-product-info">

                              <h3>
                                {
                                  item.menu.name
                                }
                              </h3>

                              <span className="cart-product-price">

                                {formatPrice(
                                  price,
                                )}

                                <small>
                                  {" "}
                                  / item
                                </small>

                              </span>

                            </div>

                          </div>


                          <button
                            type="button"
                            className="cart-remove-button"
                            onClick={() =>
                              remove(
                                item.id,
                              )
                            }
                            aria-label={`Hapus ${item.menu.name}`}
                            title="Hapus menu"
                          >

                            <Trash2
                              size={17}
                            />

                          </button>

                        </div>


                        {/* =================================================
                           NOTE AREA
                        ================================================= */}

                        <div className="cart-note-section">

                          {showNoteEditor ? (

                            <div className="cart-note-box">

                              <div className="cart-note-header">

                                <div className="cart-note-title">

                                  <div className="cart-note-icon">

                                    <MessageSquareText
                                      size={16}
                                    />

                                  </div>

                                  <div>

                                    <strong>
                                      Catatan untuk menu
                                    </strong>

                                    <span>
                                      Opsional
                                    </span>

                                  </div>

                                </div>


                                <span className="cart-note-counter">

                                  {
                                    draftNote.length
                                  }
                                  /200

                                </span>

                              </div>


                              <textarea
                                className="cart-note-input"
                                value={
                                  draftNote
                                }
                                maxLength={
                                  200
                                }
                                rows={
                                  3
                                }
                                autoFocus={
                                  isEditing
                                }
                                placeholder="Contoh: nasi sedikit, sambal dipisah, tidak pakai bawang..."
                                onChange={
                                  event =>
                                    handleNoteChange(
                                      itemId,
                                      event.target.value,
                                    )
                                }
                                onBlur={() =>
                                  handleNoteBlur(
                                    itemId,
                                  )
                                }
                              />


                              <div className="cart-note-bottom">

                                <span className="cart-note-helper">

                                  Catatan ini akan
                                  diberikan ke penjual.

                                </span>


                                <button
                                  type="button"
                                  className="cart-save-note"
                                  onClick={() =>
                                    handleSaveNote(
                                      itemId,
                                    )
                                  }
                                >

                                  <Check
                                    size={14}
                                  />

                                  <span>
                                    Simpan Catatan
                                  </span>

                                </button>

                              </div>

                            </div>

                          ) : (

                            <div className="cart-saved-note">

                              <div className="cart-saved-note-left">

                                <div className="cart-saved-note-icon">

                                  <Check
                                    size={15}
                                  />

                                </div>


                                <div className="cart-saved-note-content">

                                  <div className="cart-saved-note-heading">

                                    <span>
                                      Catatan
                                    </span>

                                    {isSaved && (

                                      <span className="cart-saved-badge">

                                        Tersimpan

                                      </span>

                                    )}

                                  </div>


                                  <p>
                                    {
                                      savedNote
                                    }
                                  </p>

                                </div>

                              </div>


                              <button
                                type="button"
                                className="cart-edit-note"
                                onClick={() =>
                                  handleEditNote(
                                    itemId,
                                  )
                                }
                              >

                                <Pencil
                                  size={14}
                                />

                                <span>
                                  Edit Catatan
                                </span>

                              </button>

                            </div>

                          )}

                        </div>


                        {/* =================================================
                           FOOTER
                        ================================================= */}

                        <div className="cart-item-footer">


                          {/* QUANTITY */}

                          <div className="cart-quantity">

                            <button
                              type="button"
                              onClick={() =>
                                decrease(
                                  item.id,
                                )
                              }
                              aria-label="Kurangi jumlah"
                            >

                              <Minus
                                size={15}
                              />

                            </button>


                            <span>
                              {
                                quantity
                              }
                            </span>


                            <button
                              type="button"
                              onClick={() =>
                                increase(
                                  item.id,
                                )
                              }
                              aria-label="Tambah jumlah"
                            >

                              <Plus
                                size={15}
                              />

                            </button>

                          </div>


                          {/* SUBTOTAL */}

                          <div className="cart-item-subtotal">

                            <span>
                              Subtotal
                            </span>

                            <strong>
                              {formatPrice(
                                subtotal,
                              )}
                            </strong>

                          </div>

                        </div>

                      </article>

                    );

                  },
                )}

              </div>

            </section>

          </main>


          {/* =================================================
             SUMMARY
          ================================================= */}

          <aside className="cart-summary">

            <div className="cart-summary-card">


              <div className="cart-summary-header">

                <div className="cart-summary-icon">

                  <ShoppingBag
                    size={18}
                  />

                </div>


                <div>

                  <h3>
                    Ringkasan Pesanan
                  </h3>

                  <p>
                    {sellerLoading
                      ? "Memuat..."
                      : sellerName}
                  </p>

                </div>

              </div>


              <div className="cart-summary-details">

                <div className="cart-summary-row">

                  <span>
                    Total item
                  </span>

                  <strong>
                    {totalItems}
                  </strong>

                </div>


                <div className="cart-summary-row">

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      total,
                    )}
                  </strong>

                </div>


                <div className="cart-summary-row">

                  <span>
                    Biaya layanan
                  </span>

                  <strong className="free">
                    Gratis
                  </strong>

                </div>

              </div>


              <div className="cart-summary-divider" />


              <div className="cart-summary-total">

                <span>
                  Total pembayaran
                </span>

                <strong>
                  {formatPrice(
                    total,
                  )}
                </strong>

              </div>


              <button
                type="button"
                className="cart-checkout-button"
                disabled={
                  !items.length ||
                  total <= 0 ||
                  !sellerId
                }
                onClick={
                  handleCheckout
                }
              >

                <span>
                  Lanjut ke Checkout
                </span>

                <ArrowRight
                  size={18}
                />

              </button>


              <div className="cart-secure-info">

                <span>
                  🔒
                </span>

                <p>
                  Pembayaran aman.
                  Metode pembayaran
                  dipilih di langkah
                  berikutnya.
                </p>

              </div>

            </div>

          </aside>

        </div>

      </div>

    </div>

  );

}