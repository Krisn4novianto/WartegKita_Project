import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import CustomerLayout from "./layouts/CustomerLayout";

/* ==========================
   CUSTOMER
========================== */

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


/* ==========================
   SELLER
========================== */

import SellerDashboard from "./pages/seller/Dashboard";
import BusinessProfile from "./pages/seller/BusinessProfile";
import MenuPage from "./pages/seller/MenuPage";

// nanti buat file ini:
// src/pages/seller/Orders.tsx
import SellerOrders from "./pages/seller/Orders";


export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==========================
            CUSTOMER
        ========================== */}

        <Route element={<CustomerLayout />}>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/explore"
            element={<Explore />}
          />

          <Route
            path="/store/:id"
            element={<StoreDetail />}
          />

          <Route
            path="/cart/:storeId"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/payment/:id"
            element={<Payment />}
          />

          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:id"
            element={<OrderDetail />}
          />

          <Route
            path="/chat"
            element={<Chat />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

        </Route>



        {/* ==========================
            SELLER
        ========================== */}

        <Route
          path="/seller/:seller_id/dashboard"
          element={<SellerDashboard />}
        />


        <Route
          path="/seller/:seller_id/profile"
          element={<BusinessProfile />}
        />


        <Route
          path="/seller/:seller_id/orders"
          element={<SellerOrders />}
        />


        <Route
          path="/seller/:seller_id/menus"
          element={<MenuPage />}
        />


      </Routes>

    </BrowserRouter>
  );
}