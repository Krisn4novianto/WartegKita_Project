import api from "./api";

export interface LoyaltyPoint {
    id: string;
    user_id: string;
    balance: number;
    lifetime_earned: number;
    lifetime_spent: number;
}

export interface PointTransaction {
    id: string;
    user_id: string;
    type: string;
    amount: number;
    source: string;
    reference_id?: string;
    description?: string;
    created_at: string;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    reward_points: number;
    is_active: boolean;
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    image_url?: string | null;
    point_cost: number;
    discount_type: string;
    discount_value: number;
    minimum_order: number;
    maximum_discount: number;
    stock: number;
    is_active: boolean;
}

export interface RewardRedemption {
    id: string;
    user_id: string;
    reward_id: string;
    points_spent: number;
    voucher_code: string;
    status: string;
    expires_at?: string;
    created_at: string;
    reward?: Reward;
}

function unwrap<T>(response: any): T {
    return (response?.data?.data ?? response?.data ?? []) as T;
}

export async function getCustomerPoints() {
    return unwrap<LoyaltyPoint>(await api.get("/users/points"));
}

export async function getPointHistory() {
    return unwrap<PointTransaction[]>(await api.get("/users/points/history"));
}

export async function getUserMissions() {
    return unwrap<any[]>(await api.get("/users/missions"));
}

export async function getRewards() {
    return unwrap<Reward[]>(await api.get("/users/rewards"));
}

export async function getMyRewards() {
    return unwrap<RewardRedemption[]>(await api.get("/users/rewards/my"));
}

export async function redeemReward(rewardId: string) {
    return unwrap<RewardRedemption>(
        await api.post(`/users/rewards/${encodeURIComponent(rewardId)}/redeem`),
    );
}
