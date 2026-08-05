import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import CustomerLayout from "./layouts/CustomerLayout";

/* =====================================================
   AUTH
===================================================== */

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/auth/ForgotPassword";

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
        ================================================= */}

        <Route element={<CustomerLayout />}>

          {/* HOME */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* EXPLORE */}

          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />

          {/* STORE */}

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

              Support both:
              /cart
              /cart/:storeId
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
              PROFILE
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

        {/* =================================================
            SELLER
        ================================================= */}

        <Route
          path="/seller/:seller_id/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/:seller_id/profile"
          element={
            <ProtectedRoute>
              <BusinessProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/:seller_id/orders"
          element={
            <ProtectedRoute>
              <SellerOrders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/seller/:seller_id/menus"
          element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}