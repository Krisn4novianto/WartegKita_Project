import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import CustomerLayout from "./layouts/CustomerLayout";

/* =====================================================
   AUTH
===================================================== */

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";

/* =====================================================
   CUSTOMER
===================================================== */

import Home from "./pages/customer/Home";
import Explore from "./pages/customer/Explore";
import StoreDetail from "./pages/customer/StoreDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Payment from "./pages/customer/Payment";
import OrderSuccess from "./pages/customer/OrderSuccess";
import Orders from "./pages/customer/Orders";
import OrderDetail from "./pages/customer/OrderDetail";
import Profile from "./pages/customer/Profile";
import Chat from "./pages/customer/Chat";

/* =====================================================
   SELLER
===================================================== */

import SellerDashboard from "./pages/seller/Dashboard";
import BusinessProfile from "./pages/seller/BusinessProfile";
import MenuPage from "./pages/seller/MenuPage";
import SellerOrders from "./pages/seller/Orders";

/* =====================================================
   CAMPAIGN
===================================================== */

import Campaign from "./pages/seller/Campaign/Campaign";
import CampaignDetail from "./pages/seller/Campaign/CampaignDetail";

/* =====================================================
   NOT FOUND
===================================================== */

function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  /* =====================================================
     DETECT SELLER URL

     SUPPORT:

     /sellers/:seller_id/...
     /seller/:seller_id/...
  ===================================================== */

  const sellerMatch =
    location.pathname.match(
      /^\/sellers\/([^/]+)/
    ) ||
    location.pathname.match(
      /^\/seller\/([^/]+)/
    );

  const sellerId =
    sellerMatch?.[1] ?? null;

  const isSellerPage =
    Boolean(sellerId);

  /* =====================================================
     BACK HANDLER
  ===================================================== */

  const handleBack = () => {
    if (sellerId) {
      navigate(
        `/sellers/${encodeURIComponent(
          sellerId
        )}/profile`
      );

      return;
    }

    navigate("/explore");
  };

  /* =====================================================
     RENDER

     Tidak ada CSS di sini.
     Styling 404 bisa ditaruh di CSS terpisah.
  ===================================================== */

  return (
    <div className="not-found-page">
      <h1 className="not-found-title">
        404
      </h1>

      <h2 className="not-found-heading">
        Halaman tidak ditemukan.
      </h2>

      <p className="not-found-description">
        URL yang kamu buka tidak tersedia.
      </p>

      <button
        type="button"
        className="not-found-button"
        onClick={handleBack}
      >
        {isSellerPage
          ? "Kembali ke Profile"
          : "Kembali ke Explore"}
      </button>
    </div>
  );
}

/* =====================================================
   APP
===================================================== */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
           AUTH
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* =================================================
           CUSTOMER

           Semua customer route menggunakan
           CustomerLayout.
        ================================================= */}

        <Route element={<CustomerLayout />}>

          {/* =================================================
             HOME
          ================================================= */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             EXPLORE
          ================================================= */}

          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             STORE DETAIL
          ================================================= */}

          <Route
            path="/store/:id"
            element={
              <ProtectedRoute>
                <StoreDetail />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             CART
          ================================================= */}

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cart/:storeId"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             CHECKOUT
          ================================================= */}

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             PAYMENT
          ================================================= */}

          <Route
            path="/payment/:orderId"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             ORDER SUCCESS
          ================================================= */}

          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             ORDERS
          ================================================= */}

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             ORDER DETAIL
          ================================================= */}

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             CHAT
          ================================================= */}

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />


          {/* =================================================
             CUSTOMER PROFILE
          ================================================= */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

        </Route>


        {/* =====================================================
           =====================================================
           SELLER — CANONICAL ROUTES
           =====================================================
        ===================================================== */}


        {/* =================================================
           SELLER DASHBOARD

           /sellers/:seller_id/dashboard
        ================================================= */}

        <Route
          path="/sellers/:seller_id/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           SELLER PROFILE

           /sellers/:seller_id/profile
        ================================================= */}

        <Route
          path="/sellers/:seller_id/profile"
          element={
            <ProtectedRoute>
              <BusinessProfile />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           SELLER ORDERS

           /sellers/:seller_id/orders
        ================================================= */}

        <Route
          path="/sellers/:seller_id/orders"
          element={
            <ProtectedRoute>
              <SellerOrders />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           SELLER MENUS

           /sellers/:seller_id/menus
        ================================================= */}

        <Route
          path="/sellers/:seller_id/menus"
          element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           SELLER CAMPAIGN

           /sellers/:seller_id/campaign

           CONTOH:

           /sellers/019fbe6b-93ec-7700-92d2-da12bf610dce/campaign
        ================================================= */}

        <Route
          path="/sellers/:seller_id/campaign"
          element={
            <ProtectedRoute>
              <Campaign />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           SELLER CAMPAIGN DETAIL

           /sellers/:seller_id/campaign/:campaign_id
        ================================================= */}

        <Route
          path="/sellers/:seller_id/campaign/:campaign_id"
          element={
            <ProtectedRoute>
              <CampaignDetail />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           SELLER CAMPAIGNS ALIAS

           Kalau kode lama masih menuju:

           /sellers/:seller_id/campaigns

           arahkan ke canonical:

           /sellers/:seller_id/campaign
        ================================================= */}

        <Route
          path="/sellers/:seller_id/campaigns"
          element={
            <Navigate
              to="../campaign"
              replace
            />
          }
        />


        {/* =====================================================
           =====================================================
           SELLER — LEGACY ROUTES
           =====================================================
        ===================================================== */}


        {/* =================================================
           LEGACY DASHBOARD

           /seller/:seller_id/dashboard
        ================================================= */}

        <Route
          path="/seller/:seller_id/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           LEGACY PROFILE

           /seller/:seller_id/profile
        ================================================= */}

        <Route
          path="/seller/:seller_id/profile"
          element={
            <ProtectedRoute>
              <BusinessProfile />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           LEGACY ORDERS

           /seller/:seller_id/orders
        ================================================= */}

        <Route
          path="/seller/:seller_id/orders"
          element={
            <ProtectedRoute>
              <SellerOrders />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           LEGACY MENUS

           /seller/:seller_id/menus
        ================================================= */}

        <Route
          path="/seller/:seller_id/menus"
          element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           LEGACY CAMPAIGN

           /seller/:seller_id/campaign

           Tetap didukung supaya URL lama tidak mati.
        ================================================= */}

        <Route
          path="/seller/:seller_id/campaign"
          element={
            <ProtectedRoute>
              <Campaign />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           LEGACY CAMPAIGN DETAIL

           /seller/:seller_id/campaign/:campaign_id
        ================================================= */}

        <Route
          path="/seller/:seller_id/campaign/:campaign_id"
          element={
            <ProtectedRoute>
              <CampaignDetail />
            </ProtectedRoute>
          }
        />


        {/* =================================================
           LEGACY CAMPAIGNS

           /seller/:seller_id/campaigns

           Redirect ke canonical:
           /sellers/:seller_id/campaign
        ================================================= */}

        <Route
          path="/seller/:seller_id/campaigns"
          element={
            <LegacyCampaignRedirect />
          }
        />


        {/* =================================================
           404
        ================================================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

/* =====================================================
   LEGACY CAMPAIGN REDIRECT

   Mengubah:

   /seller/:seller_id/campaigns

   menjadi:

   /sellers/:seller_id/campaign
===================================================== */

function LegacyCampaignRedirect() {
  const { seller_id } = useParamsSafe();

  if (!seller_id) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <Navigate
      to={`/sellers/${encodeURIComponent(
        seller_id
      )}/campaign`}
      replace
    />
  );
}

/* =====================================================
   SAFE PARAM HELPER

   Dipisahkan supaya App tetap bersih.
===================================================== */

function useParamsSafe() {
  const location = useLocation();

  const match =
    location.pathname.match(
      /^\/seller\/([^/]+)\/campaigns?$/
    );

  return {
    seller_id: match?.[1] ?? null,
  };
}