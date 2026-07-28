export type OrderStatus =
    | "PENDING"
    | "WAITING_CONFIRMATION"
    | "CONFIRMED"
    | "PREPARING"
    | "COOKING"
    | "READY"
    | "DELIVERING"
    | "COMPLETED"
    | "CANCELLED";

export type PaymentMethod =
    | "qris"
    | "bank_transfer"
    | "virtual_account"
    | "paypal"
    | "cod";

export type DeliveryType =
    | "delivery"
    | "pickup";

export interface Seller {
    id: string | number;

    store_name: string;

    description: string;

    address: string;

    is_open: boolean;

    rating?: number;

    distance_km?: number;
}

export interface MenuCategory {
    id: string | number;

    name: string;

    emoji: string;

    is_active: boolean;
}

export interface Menu {
    id: string | number;

    seller_id?: string | number;

    name: string;

    description: string;

    price: number;

    stock: number;

    is_available: boolean;

    category: string;

    image: string;
}

export interface CartItem {
    id: string | number;

    menu_id: string | number;

    quantity: number;

    notes?: string;

    menu: Menu;
}

export interface CreateOrderItem {
    menu_id: string | number;

    quantity: number;

    notes?: string;
}

export interface CreateOrderPayload {
    items: CreateOrderItem[];

    payment_method: PaymentMethod;

    delivery_type: DeliveryType;

    address: string;

    total_amount: number;
}

export interface OrderItem {
    id: string | number;

    menu_id: string | number;

    menu_name?: string;

    name?: string;

    price: number;

    quantity: number;

    subtotal: number;
}

export interface Order {
    id: string | number;

    order_number: string;

    status: OrderStatus;

    payment_method: PaymentMethod;

    delivery_type: DeliveryType;

    address: string;

    total_amount: number;

    items: OrderItem[];
}