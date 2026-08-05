import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  Search,
  UserRound,
  ReceiptText,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import api from "../../services/api";

import SellerNavbar from "./SellerNavbar";

import "../../styles/seller/Dashboard.css";


/* =====================================================
   TYPES
===================================================== */

interface DashboardSummary {
  total_revenue: number;
  total_transactions: number;
  total_items_sold: number;
  total_customers: number;
}


interface SalesChartItem {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
}


interface TopProduct {
  menu_id: string;
  menu_name: string;
  quantity: number;
  revenue: number;
}


interface CustomerRow {
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  transaction_count: number;
  total_items: number;
  total_spent: number;
  last_purchase: string;
}


interface DashboardResponse {
  summary: DashboardSummary;
  sales_chart: SalesChartItem[];
  top_products: TopProduct[];
  customers: CustomerRow[];
  period?: string;
}


/* =====================================================
   DEFAULT DATA
===================================================== */

const EMPTY_SUMMARY: DashboardSummary = {
  total_revenue: 0,
  total_transactions: 0,
  total_items_sold: 0,
  total_customers: 0,
};


const EMPTY_DASHBOARD: DashboardResponse = {
  summary: EMPTY_SUMMARY,
  sales_chart: [],
  top_products: [],
  customers: [],
};


/* =====================================================
   UUID VALIDATION
===================================================== */

/**
 * Backend WartegKita menggunakan UUID.
 *
 * Contoh:
 * 019fb5bd-1a29-7bfa-9675-d2b1c228388f
 *
 * Regex ini menerima UUID v1-v8.
 */
const isValidUUID = (
  value?: string
): boolean => {

  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
};


/* =====================================================
   NUMBER HELPERS
===================================================== */

const toNumber = (
  value: unknown
): number => {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


/* =====================================================
   FORMAT RUPIAH
===================================================== */

const formatRupiah = (
  value: number
): string => {

  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(
    toNumber(value)
  );
};


/* =====================================================
   FORMAT NUMBER
===================================================== */

const formatNumber = (
  value: number
): string => {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    toNumber(value)
  );
};


/* =====================================================
   FORMAT DATE
===================================================== */

const formatDate = (
  value?: string
): string => {

  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


/* =====================================================
   INITIALS
===================================================== */

const getInitials = (
  name?: string
): string => {

  if (!name?.trim()) {
    return "U";
  }

  const parts =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2);

  return parts
    .map(
      item =>
        item
          .charAt(0)
          .toUpperCase()
    )
    .join("");
};


/* =====================================================
   CSV ESCAPE
===================================================== */

const escapeCsv = (
  value: unknown
): string => {

  const text =
    String(
      value ?? ""
    );

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
};


/* =====================================================
   EXPORT CUSTOMER
===================================================== */

const downloadExcel = (
  customers: CustomerRow[]
): void => {

  if (!customers.length) {

    window.alert(
      "Belum ada data pembelian customer."
    );

    return;
  }


  const headers = [
    "No",
    "Nama Pembeli",
    "Email",
    "Nomor Telepon",
    "Jumlah Transaksi",
    "Total Item",
    "Total Belanja",
    "Pembelian Terakhir",
  ];


  const rows =
    customers.map(
      (
        customer,
        index
      ) => [

          index + 1,

          customer.name ||
          "Customer",

          customer.email ||
          "-",

          customer.phone ||
          "-",

          toNumber(
            customer.transaction_count
          ),

          toNumber(
            customer.total_items
          ),

          toNumber(
            customer.total_spent
          ),

          formatDate(
            customer.last_purchase
          ),

        ]
    );


  const csvContent = [
    headers,
    ...rows,
  ]
    .map(
      row =>
        row
          .map(
            escapeCsv
          )
          .join(",")
    )
    .join("\n");


  const blob =
    new Blob(
      [
        "\uFEFF",
        csvContent,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;

  link.download =
    `wartegkita-pembeli-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;


  document.body.appendChild(
    link
  );

  link.click();

  document.body.removeChild(
    link
  );


  URL.revokeObjectURL(
    url
  );
};


/* =====================================================
   NORMALIZE DASHBOARD
===================================================== */

const normalizeDashboard = (
  raw: any
): DashboardResponse => {

  const source =
    raw?.data ||
    raw ||
    {};


  const summary =
    source?.summary ||
    {};


  const salesChart =
    Array.isArray(
      source?.sales_chart
    )
      ? source.sales_chart
      : [];


  const topProducts =
    Array.isArray(
      source?.top_products
    )
      ? source.top_products
      : [];


  const customers =
    Array.isArray(
      source?.customers
    )
      ? source.customers
      : [];


  return {

    summary: {

      total_revenue:
        toNumber(
          summary?.total_revenue
        ),

      total_transactions:
        toNumber(
          summary?.total_transactions
        ),

      total_items_sold:
        toNumber(
          summary?.total_items_sold
        ),

      total_customers:
        toNumber(
          summary?.total_customers
        ),

    },


    sales_chart:
      salesChart.map(
        (item: any) => ({

          date:
            String(
              item?.date ??
              ""
            ),

          label:
            String(
              item?.label ??
              item?.date ??
              ""
            ),

          revenue:
            toNumber(
              item?.revenue
            ),

          transactions:
            toNumber(
              item?.transactions
            ),

        })
      ),


    top_products:
      topProducts.map(
        (item: any) => ({

          menu_id:
            String(
              item?.menu_id ??
              ""
            ),

          menu_name:
            String(
              item?.menu_name ??
              "Menu"
            ),

          quantity:
            toNumber(
              item?.quantity
            ),

          revenue:
            toNumber(
              item?.revenue
            ),

        })
      ),


    customers:
      customers.map(
        (item: any) => ({

          user_id:
            String(
              item?.user_id ??
              ""
            ),

          name:
            String(
              item?.name ??
              item?.username ??
              "Customer"
            ),

          email:
            item?.email
              ? String(
                item.email
              )
              : "",

          phone:
            item?.phone
              ? String(
                item.phone
              )
              : "",

          transaction_count:
            toNumber(
              item?.transaction_count
            ),

          total_items:
            toNumber(
              item?.total_items
            ),

          total_spent:
            toNumber(
              item?.total_spent
            ),

          last_purchase:
            String(
              item?.last_purchase ??
              ""
            ),

        })
      ),

    period:
      source?.period
        ? String(
          source.period
        )
        : undefined,

  };
};


/* =====================================================
   COMPONENT
===================================================== */

export default function Dashboard() {

  /* =================================================
     ROUTE PARAMETER
  ================================================= */

  const {
    seller_id: routeSellerId,
  } = useParams<{
    seller_id: string;
  }>();


  /* =================================================
     NAVBAR
  ================================================= */

  const [
    openMenu,
    setOpenMenu,
  ] = useState(true);


  /* =================================================
     DATA STATE
  ================================================= */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    period,
    setPeriod,
  ] = useState("30");


  const [
    customerSearch,
    setCustomerSearch,
  ] = useState("");


  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardResponse>(
    EMPTY_DASHBOARD
  );


  /* =================================================
     SELLER ID
  ================================================= */

  /**
   * PRIORITAS:
   *
   * 1. seller_id dari URL
   * 2. localStorage seller_id
   * 3. localStorage user.seller_id
   * 4. localStorage user.sellerId
   *
   * Karena halaman seller menggunakan route:
   *
   * /seller/:seller_id/dashboard
   *
   * maka URL menjadi sumber utama.
   */
  const sellerId =
    useMemo(() => {

      const routeId =
        routeSellerId?.trim();

      if (routeId) {
        return routeId;
      }


      const storedSellerId =
        localStorage.getItem(
          "seller_id"
        )?.trim();


      if (storedSellerId) {
        return storedSellerId;
      }


      const storedUser =
        localStorage.getItem(
          "user"
        );


      if (!storedUser) {
        return "";
      }


      try {

        const parsed =
          JSON.parse(
            storedUser
          );


        return String(
          parsed?.seller_id ||
          parsed?.sellerId ||
          parsed?.seller?.id ||
          ""
        ).trim();

      } catch (
      parseError
      ) {

        console.error(
          "Gagal membaca localStorage user:",
          parseError
        );

        return "";
      }

    }, [
      routeSellerId,
    ]);


  /* =================================================
     SELLER ID VALIDATION
  ================================================= */

  const sellerIdIsValid =
    useMemo(
      () =>
        isValidUUID(
          sellerId
        ),
      [
        sellerId,
      ]
    );


  /* =================================================
     LOAD DASHBOARD
  ================================================= */

  const loadDashboard =
    useCallback(
      async (
        showRefresh = false
      ) => {

        /* ===========================================
           VALIDASI SELLER ID
        =========================================== */

        if (!sellerId) {

          setDashboard(
            EMPTY_DASHBOARD
          );

          setError(
            "Seller ID tidak ditemukan pada URL maupun session login."
          );

          setLoading(false);

          setRefreshing(false);

          return;
        }


        if (!sellerIdIsValid) {

          setDashboard(
            EMPTY_DASHBOARD
          );

          setError(
            `Seller ID "${sellerId}" bukan UUID yang valid.`
          );

          setLoading(false);

          setRefreshing(false);

          return;
        }


        try {

          if (showRefresh) {

            setRefreshing(
              true
            );

          } else {

            setLoading(
              true
            );

          }


          setError("");


          console.log(
            "[Dashboard] Seller ID:",
            sellerId
          );


          console.log(
            "[Dashboard] Period:",
            period
          );


          /* =========================================
             API
          ========================================= */

          const response =
            await api.get(
              `/sellers/dashboard/${encodeURIComponent(
                sellerId
              )}`,
              {
                params: {
                  period,
                },
              }
            );


          console.log(
            "[Dashboard] Response:",
            response.data
          );


          /* =========================================
             NORMALIZE
          ========================================= */

          const normalized =
            normalizeDashboard(
              response.data
            );


          setDashboard(
            normalized
          );


        } catch (
        err: any
        ) {

          console.error(
            "[Dashboard] GET ERROR:",
            err
          );


          console.error(
            "[Dashboard] RESPONSE:",
            err?.response?.data
          );


          const backendMessage =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.response?.data?.detail;


          if (
            err?.response?.status === 404
          ) {

            setError(
              "Data dashboard seller tidak ditemukan. Pastikan endpoint dashboard dan Seller ID sudah benar."
            );

          } else if (
            err?.response?.status === 401 ||
            err?.response?.status === 403
          ) {

            setError(
              "Session seller tidak valid atau tidak memiliki akses ke dashboard."
            );

          } else {

            setError(
              backendMessage ||
              "Gagal memuat data dashboard."
            );

          }


        } finally {

          setLoading(
            false
          );

          setRefreshing(
            false
          );

        }

      },
      [
        sellerId,
        sellerIdIsValid,
        period,
      ]
    );


  /* =================================================
     LOAD WHEN SELLER / PERIOD CHANGES
  ================================================= */

  useEffect(() => {

    loadDashboard();

  }, [
    loadDashboard,
  ]);


  /* =================================================
     FILTER CUSTOMERS
  ================================================= */

  const filteredCustomers =
    useMemo(() => {

      const customers =
        dashboard.customers ||
        [];


      const keyword =
        customerSearch
          .trim()
          .toLowerCase();


      if (!keyword) {
        return customers;
      }


      return customers.filter(
        customer => {

          const name =
            customer.name
              ?.toLowerCase() ||
            "";


          const email =
            customer.email
              ?.toLowerCase() ||
            "";


          const phone =
            customer.phone
              ?.toLowerCase() ||
            "";


          const userId =
            customer.user_id
              ?.toLowerCase() ||
            "";


          return (
            name.includes(
              keyword
            ) ||

            email.includes(
              keyword
            ) ||

            phone.includes(
              keyword
            ) ||

            userId.includes(
              keyword
            )
          );

        }
      );

    }, [
      dashboard.customers,
      customerSearch,
    ]);


  /* =================================================
     CHART DATA
  ================================================= */

  const chartData =
    useMemo(() => {

      return (
        dashboard.sales_chart ||
        []
      )
        .slice(-14);

    }, [
      dashboard.sales_chart,
    ]);


  /* =================================================
     MAX REVENUE
  ================================================= */

  const maxRevenue =
    useMemo(() => {

      if (
        !chartData.length
      ) {
        return 1;
      }


      return Math.max(
        ...chartData.map(
          item =>
            toNumber(
              item.revenue
            )
        ),
        1
      );

    }, [
      chartData,
    ]);


  /* =================================================
     MAX PRODUCT
  ================================================= */

  const maxProductQuantity =
    useMemo(() => {

      if (
        !dashboard.top_products?.length
      ) {
        return 1;
      }


      return Math.max(
        ...dashboard.top_products.map(
          item =>
            toNumber(
              item.quantity
            )
        ),
        1
      );

    }, [
      dashboard.top_products,
    ]);


  /* =================================================
     SUMMARY
  ================================================= */

  const summary =
    dashboard.summary ||
    EMPTY_SUMMARY;


  /* =================================================
     PAGE
  ================================================= */

  return (

    <div
      className={
        `seller-layout ${openMenu
          ? "menu-open"
          : "menu-close"
        }`
      }
    >

      {/* =================================================
          SELLER NAVBAR
      ================================================= */}

      <SellerNavbar
        openMenu={
          openMenu
        }
        setOpenMenu={
          setOpenMenu
        }
      />


      {/* =================================================
          SELLER CONTENT
      ================================================= */}

      <main className="seller-content">

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="seller-dashboard-loading">

            <div className="dashboard-loading-card">

              <div className="dashboard-loading-spinner">

                <RefreshCw
                  size={26}
                />

              </div>


              <strong>
                Memuat dashboard...
              </strong>


              <span>
                Menyiapkan data transaksi
                warteg kamu
              </span>

            </div>

          </div>

        ) : error ? (

          /* =================================================
             ERROR
          ================================================= */

          <div className="seller-dashboard-error">

            <div className="dashboard-error-card">

              <div className="dashboard-error-icon">
                !
              </div>


              <h2>
                Dashboard tidak dapat dimuat
              </h2>


              <p>
                {error}
              </p>


              <div className="dashboard-error-detail">

                {sellerId && (
                  <span>
                    Seller ID:{" "}
                    <strong>
                      {sellerId}
                    </strong>
                  </span>
                )}

              </div>


              <button
                type="button"
                onClick={() =>
                  loadDashboard(
                    true
                  )
                }
                disabled={
                  refreshing
                }
              >

                <RefreshCw
                  size={18}
                  className={
                    refreshing
                      ? "is-spinning"
                      : ""
                  }
                />

                {refreshing
                  ? "Memuat..."
                  : "Coba Lagi"}

              </button>

            </div>

          </div>

        ) : (

          /* =================================================
             DASHBOARD
          ================================================= */

          <div className="seller-dashboard">

            {/* =================================================
                HEADER
            ================================================= */}

            <section className="dashboard-header">

              <div className="dashboard-header-content">

                <div>

                  <div className="dashboard-eyebrow">

                    <BarChart3
                      size={17}
                    />

                    ANALYTICS WARTEGKITA

                  </div>


                  <h1>
                    Dashboard Penjualan
                  </h1>


                  <p>
                    Pantau pendapatan,
                    transaksi, produk terjual,
                    dan pelanggan warteg kamu
                    dalam satu tempat.
                  </p>

                </div>


                <button
                  type="button"
                  className="dashboard-refresh-button"
                  onClick={() =>
                    loadDashboard(
                      true
                    )
                  }
                  disabled={
                    refreshing
                  }
                >

                  <RefreshCw
                    size={18}
                    className={
                      refreshing
                        ? "is-spinning"
                        : ""
                    }
                  />


                  {refreshing
                    ? "Memuat..."
                    : "Refresh"}

                </button>

              </div>

            </section>


            {/* =================================================
                FILTER PERIOD
            ================================================= */}

            <section className="dashboard-filter">

              <div className="dashboard-filter-left">

                <div className="filter-icon">

                  <CalendarDays
                    size={18}
                  />

                </div>


                <div>

                  <span>
                    Periode analisis
                  </span>


                  <strong>

                    {period === "7"
                      ? "7 Hari Terakhir"
                      : period === "30"
                        ? "30 Hari Terakhir"
                        : "90 Hari Terakhir"}

                  </strong>

                </div>

              </div>


              <div className="period-select">

                <select
                  value={
                    period
                  }
                  onChange={
                    event =>
                      setPeriod(
                        event.target.value
                      )
                  }
                >

                  <option value="7">
                    7 Hari
                  </option>

                  <option value="30">
                    30 Hari
                  </option>

                  <option value="90">
                    90 Hari
                  </option>

                </select>


                <ChevronDown
                  size={17}
                />

              </div>

            </section>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <section className="dashboard-summary-grid">

              {/* REVENUE */}

              <article className="dashboard-stat-card revenue">

                <div className="dashboard-stat-icon">

                  <Wallet
                    size={23}
                  />

                </div>


                <div className="dashboard-stat-content">

                  <span>
                    Total Pendapatan
                  </span>


                  <strong>
                    {formatRupiah(
                      summary.total_revenue
                    )}
                  </strong>


                  <small>
                    Dari order selesai
                  </small>

                </div>


                <div className="stat-trend">

                  <ArrowUpRight
                    size={16}
                  />

                </div>

              </article>


              {/* TRANSACTIONS */}

              <article className="dashboard-stat-card transaction">

                <div className="dashboard-stat-icon">

                  <ShoppingBag
                    size={23}
                  />

                </div>


                <div className="dashboard-stat-content">

                  <span>
                    Transaksi Selesai
                  </span>


                  <strong>
                    {formatNumber(
                      summary.total_transactions
                    )}
                  </strong>


                  <small>
                    Order COMPLETED
                  </small>

                </div>

              </article>


              {/* PRODUCTS */}

              <article className="dashboard-stat-card product">

                <div className="dashboard-stat-icon">

                  <Package
                    size={23}
                  />

                </div>


                <div className="dashboard-stat-content">

                  <span>
                    Produk Terjual
                  </span>


                  <strong>
                    {formatNumber(
                      summary.total_items_sold
                    )}
                  </strong>


                  <small>
                    Total quantity
                  </small>

                </div>

              </article>


              {/* CUSTOMERS */}

              <article className="dashboard-stat-card customer">

                <div className="dashboard-stat-icon">

                  <Users
                    size={23}
                  />

                </div>


                <div className="dashboard-stat-content">

                  <span>
                    Pembeli
                  </span>


                  <strong>
                    {formatNumber(
                      summary.total_customers
                    )}
                  </strong>


                  <small>
                    Customer unik
                  </small>

                </div>

              </article>

            </section>


            {/* =================================================
                ANALYTICS
            ================================================= */}

            <section className="analytics-grid">

              {/* =================================================
                  REVENUE CHART
              ================================================= */}

              <article className="analytics-card revenue-chart-card">

                <div className="analytics-card-header">

                  <div>

                    <div className="analytics-title-icon">

                      <TrendingUp
                        size={19}
                      />

                    </div>


                    <div>

                      <h2>
                        Pendapatan
                      </h2>


                      <p>
                        Performa pendapatan
                        berdasarkan order yang
                        sudah selesai
                      </p>

                    </div>

                  </div>


                  <span className="analytics-badge">
                    COMPLETED
                  </span>

                </div>


                <div className="revenue-chart">

                  <div className="chart-y-axis">

                    <span>
                      {formatRupiah(
                        maxRevenue
                      )}
                    </span>


                    <span>
                      {formatRupiah(
                        maxRevenue / 2
                      )}
                    </span>


                    <span>
                      Rp 0
                    </span>

                  </div>


                  <div className="chart-area">

                    <div className="chart-grid-line line-1" />

                    <div className="chart-grid-line line-2" />

                    <div className="chart-grid-line line-3" />


                    {chartData.length ? (

                      <div className="chart-bars">

                        {chartData.map(
                          (
                            item,
                            index
                          ) => {

                            const revenue =
                              toNumber(
                                item.revenue
                              );


                            const height =
                              Math.max(
                                (
                                  revenue /
                                  maxRevenue
                                ) *
                                100,
                                3
                              );


                            return (

                              <div
                                className="chart-bar-wrapper"
                                key={
                                  `${item.date}-${index}`
                                }
                              >

                                <div className="chart-tooltip">

                                  <strong>
                                    {formatRupiah(
                                      revenue
                                    )}
                                  </strong>


                                  <span>
                                    {formatNumber(
                                      item.transactions
                                    )} transaksi
                                  </span>

                                </div>


                                <div
                                  className="chart-bar"
                                  style={{
                                    height:
                                      `${height}%`,
                                  }}
                                />


                                <span className="chart-label">
                                  {item.label}
                                </span>

                              </div>

                            );

                          }
                        )}

                      </div>

                    ) : (

                      <div className="chart-empty">

                        <BarChart3
                          size={36}
                        />


                        <span>
                          Belum ada transaksi selesai
                        </span>

                      </div>

                    )}

                  </div>

                </div>

              </article>


              {/* =================================================
                  TOP PRODUCTS
              ================================================= */}

              <article className="analytics-card top-products-card">

                <div className="analytics-card-header">

                  <div>

                    <div className="analytics-title-icon orange">

                      <Package
                        size={19}
                      />

                    </div>


                    <div>

                      <h2>
                        Produk Terlaris
                      </h2>


                      <p>
                        Berdasarkan jumlah
                        terjual
                      </p>

                    </div>

                  </div>

                </div>


                <div className="top-products-list">

                  {dashboard.top_products?.length ? (

                    dashboard.top_products
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (
                          product,
                          index
                        ) => {

                          const quantity =
                            toNumber(
                              product.quantity
                            );


                          const width =
                            Math.max(
                              (
                                quantity /
                                maxProductQuantity
                              ) *
                              100,
                              8
                            );


                          return (

                            <div
                              className="top-product-item"
                              key={
                                product.menu_id ||
                                `${product.menu_name}-${index}`
                              }
                            >

                              <div className="product-rank">

                                {index + 1}

                              </div>


                              <div className="product-main">

                                <div className="product-row">

                                  <strong>
                                    {
                                      product.menu_name ||
                                      "Menu"
                                    }
                                  </strong>


                                  <span>
                                    {
                                      formatNumber(
                                        quantity
                                      )
                                    }{" "}
                                    terjual
                                  </span>

                                </div>


                                <div className="product-progress">

                                  <div
                                    style={{
                                      width:
                                        `${width}%`,
                                    }}
                                  />

                                </div>


                                <small>
                                  {formatRupiah(
                                    product.revenue
                                  )}
                                </small>

                              </div>

                            </div>

                          );

                        }
                      )

                  ) : (

                    <div className="analytics-empty-small">

                      <Package
                        size={30}
                      />


                      <span>
                        Belum ada produk terjual.
                      </span>

                    </div>

                  )}

                </div>

              </article>

            </section>


            {/* =================================================
                CUSTOMER
            ================================================= */}

            <section className="customer-section">

              <div className="customer-section-header">

                <div className="customer-heading">

                  <div className="customer-heading-icon">

                    <Users
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Customer yang Sudah Membeli
                    </h2>


                    <p>
                      Daftar pembeli berdasarkan
                      transaksi yang sudah selesai.
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="download-excel-button"
                  onClick={() =>
                    downloadExcel(
                      filteredCustomers
                    )
                  }
                >

                  <FileSpreadsheet
                    size={18}
                  />

                  Download Excel


                  <Download
                    size={16}
                  />

                </button>

              </div>


              {/* =================================================
                  CUSTOMER SEARCH
              ================================================= */}

              <div className="customer-toolbar">

                <div className="customer-search">

                  <Search
                    size={18}
                  />


                  <input
                    type="text"
                    value={
                      customerSearch
                    }
                    onChange={
                      event =>
                        setCustomerSearch(
                          event.target.value
                        )
                    }
                    placeholder="Cari nama, email, atau nomor telepon..."
                  />

                </div>


                <div className="customer-count">

                  <strong>
                    {formatNumber(
                      filteredCustomers.length
                    )}
                  </strong>


                  <span>
                    customer
                  </span>

                </div>

              </div>


              {/* =================================================
                  CUSTOMER TABLE
              ================================================= */}

              <div className="customer-table-wrapper">

                <table className="customer-table">

                  <thead>

                    <tr>

                      <th>
                        Pembeli
                      </th>

                      <th>
                        Kontak
                      </th>

                      <th>
                        Transaksi
                      </th>

                      <th>
                        Item
                      </th>

                      <th>
                        Total Belanja
                      </th>

                      <th>
                        Pembelian Terakhir
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredCustomers.length ? (

                      filteredCustomers.map(
                        (
                          customer,
                          index
                        ) => (

                          <tr
                            key={
                              customer.user_id ||
                              `${customer.name}-${index}`
                            }
                          >

                            {/* CUSTOMER */}

                            <td>

                              <div className="customer-profile">

                                <div className="customer-avatar">

                                  {getInitials(
                                    customer.name
                                  )}

                                </div>


                                <div>

                                  <strong>
                                    {
                                      customer.name ||
                                      "Customer"
                                    }
                                  </strong>


                                  <span>

                                    ID:{" "}

                                    {
                                      customer.user_id
                                        ? customer.user_id.slice(
                                          0,
                                          8
                                        )
                                        : "-"
                                    }

                                    ...

                                  </span>

                                </div>

                              </div>

                            </td>


                            {/* CONTACT */}

                            <td>

                              <div className="customer-contact">

                                {customer.email ? (

                                  <span>
                                    {
                                      customer.email
                                    }
                                  </span>

                                ) : null}


                                {customer.phone ? (

                                  <span>
                                    {
                                      customer.phone
                                    }
                                  </span>

                                ) : null}


                                {!customer.email &&
                                  !customer.phone ? (

                                  <span>
                                    -
                                  </span>

                                ) : null}

                              </div>

                            </td>


                            {/* TRANSACTION */}

                            <td>

                              <span className="table-number">

                                {
                                  formatNumber(
                                    customer.transaction_count
                                  )
                                }

                              </span>

                            </td>


                            {/* ITEM */}

                            <td>

                              <span className="table-number">

                                {
                                  formatNumber(
                                    customer.total_items
                                  )
                                }

                              </span>

                            </td>


                            {/* TOTAL */}

                            <td>

                              <strong className="customer-spending">

                                {
                                  formatRupiah(
                                    customer.total_spent
                                  )
                                }

                              </strong>

                            </td>


                            {/* LAST PURCHASE */}

                            <td>

                              <span className="last-purchase">

                                <ReceiptText
                                  size={15}
                                />


                                {
                                  formatDate(
                                    customer.last_purchase
                                  )
                                }

                              </span>

                            </td>

                          </tr>

                        )
                      )

                    ) : (

                      <tr>

                        <td
                          colSpan={6}
                          className="customer-table-empty"
                        >

                          <div>

                            <UserRound
                              size={42}
                            />


                            <strong>
                              Belum ada pembelian
                            </strong>


                            <span>
                              Customer yang
                              menyelesaikan order
                              akan muncul di sini.
                            </span>

                          </div>

                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </section>


            {/* =================================================
                DATA NOTE
            ================================================= */}

            <div className="dashboard-data-note">

              <BarChart3
                size={17}
              />


              <span>

                Statistik pendapatan dan transaksi
                hanya menghitung order dengan status{" "}

                <strong>
                  COMPLETED
                </strong>.

              </span>

            </div>

          </div>

        )}

      </main>

    </div>

  );
}