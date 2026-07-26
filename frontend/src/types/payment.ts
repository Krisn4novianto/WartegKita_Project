export type PaymentMethod =
    | "qris"
    | "bank_transfer"
    | "virtual_account"
    | "paypal"
    | "cod";

export interface PaymentOption {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: string;
}