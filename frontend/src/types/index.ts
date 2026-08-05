export type OrderStatus =
  | "PENDING"
  | "WAITING_CONFIRMATION"
  | "CONFIRMED"
  | "PREPARING"
  | "COOKING"
  | "READY"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED"
  | "PAID"
  | "pending"
  | "completed"
  | "cancelled";

export interface MenuCategory {
  id: number | string;
  name: string;
  emoji: string;
  is_active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserAddress {
  id?: string;
  user_id?: string;
  label: string;
  detail: string;
  province_id: number;
  province_name: string;
  city_id: number;
  city_name: string;
  district_id: number;
  district_name: string;
  postal_code: string;
  note: string;
  latitude?: number;
  longitude?: number;
}

export interface Seller {
  id: string | number;
  store_name: string;
  description: string;
  address: string;
  is_open: boolean;
  rating?: number;
  distance_km?: number;
  image?: string;
}

/* =====================================================
   MENU
===================================================== */

export interface Menu {
  id: string;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id?: string | number;
  menu_id?: string | number;
  menu: Menu;
  quantity: number;
}

export interface OrderItem {
  id?: string | number;
  menu_id?: string | number;
  menu_name: string;
  name?: string;
  price?: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string | number;
  order_number: string;
  status: OrderStatus;
  payment_method?: string;
  total_amount: number;
  items: OrderItem[];
}