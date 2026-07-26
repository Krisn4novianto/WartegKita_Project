export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERING"
  | "COMPLETED"
  | "CANCELLED";


// ==============================
// SELLER
// ==============================

export interface Seller {
  id: number;

  store_name: string;

  description: string;

  address: string;

  is_open: boolean;

  rating?: number;

  distance_km?: number;

  image?: string;
}


// ==============================
// MENU
// ==============================

export interface Menu {

  id: number;


  // backend mengirim string "1"
  seller_id?: number | string;


  name: string;


  description?: string;


  price: number;


  stock?: number;


  is_available?: boolean;


  category?: string;


  image?: string;

}



// ==============================
// CART
// ==============================

export interface CartItem {

  id?: number;

  menu_id?: number;


  menu: Menu;


  quantity: number;

}



// ==============================
// ORDER
// ==============================

export interface OrderItem {

  id: number;


  menu_id?: number;


  menu_name: string;


  quantity: number;


  subtotal: number;

}



export interface Order {

  id: number;


  order_number: string;


  status: OrderStatus;


  total_amount: number;


  items: OrderItem[];

}