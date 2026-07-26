import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaymentMethod =
    | "qris"
    | "bank_transfer"
    | "virtual_account"
    | "paypal"
    | "cod";

export type PickupMethod =
    | "delivery"
    | "pickup";

interface CheckoutState {

    pickupMethod: PickupMethod;

    address: string;

    paymentMethod: PaymentMethod;

    setCheckout: (
        data: Partial<CheckoutState>
    ) => void;

    resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
    persist(
        (set) => ({

            pickupMethod: "delivery",

            address: "",

            paymentMethod: "qris",

            setCheckout: (data) =>
                set((state) => ({
                    ...state,
                    ...data,
                })),

            resetCheckout: () =>
                set({
                    pickupMethod: "delivery",
                    address: "",
                    paymentMethod: "qris",
                }),

        }),
        {
            name: "checkout-storage",
        }
    )
);