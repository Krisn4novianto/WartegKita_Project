import {
    ArrowRight,
    CheckCircle2,
    Gift,
    LockKeyhole,
    Star,
    TicketCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";
import "../../styles/components/Mission and Reward/RewardSection.css";

interface Reward {
    id: string;
    name: string;
    description: string;
    imageUrl?: string | null;
    pointCost: number;
    discountType: string;
    discountValue: number;
    minimumOrder: number;
    maximumDiscount: number;
    stock: number;
    isActive: boolean;
}

interface UserReward {
    id: string;
    voucherCode: string;
    status: string;
    expiresAt?: string | null;
    reward?: Reward | null;
}

interface Props {
    loyaltyPoints?: number;
    onRedeemed?: () => void | Promise<void>;
}

function unwrap(response: any): any {
    return response?.data?.data ?? response?.data ?? [];
}

function extractList(raw: any, key: string): any[] {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.[key])) return raw[key];
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
}

function normalizeReward(item: any): Reward {
    return {
        id: String(item?.id ?? item?.reward_id),
        name: item?.name ?? item?.title ?? "Reward WartegKita",
        description: item?.description ?? "Reward WartegKita.",
        imageUrl: item?.image_url ?? item?.imageUrl ?? null,
        pointCost: Math.max(0, Number(item?.point_cost ?? item?.pointCost ?? 0)),
        discountType: String(item?.discount_type ?? item?.discountType ?? "FIXED").toUpperCase(),
        discountValue: Number(item?.discount_value ?? item?.discountValue ?? 0),
        minimumOrder: Number(item?.minimum_order ?? item?.minimumOrder ?? 0),
        maximumDiscount: Number(item?.maximum_discount ?? item?.maximumDiscount ?? 0),
        stock: Number(item?.stock ?? -1),
        isActive: Boolean(item?.is_active ?? item?.active ?? true),
    };
}

function normalizeUserReward(item: any): UserReward {
    return {
        id: String(item?.id),
        voucherCode: item?.voucher_code ?? item?.voucherCode ?? "-",
        status: String(item?.status ?? "ACTIVE").toUpperCase(),
        expiresAt: item?.expires_at ?? item?.expiresAt ?? null,
        reward: item?.reward ? normalizeReward(item.reward) : null,
    };
}

function formatRupiah(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function discountLabel(reward: Reward) {
    return reward.discountType === "PERCENTAGE"
        ? `${reward.discountValue}% OFF`
        : `${formatRupiah(reward.discountValue)} OFF`;
}

export default function RewardSection({ loyaltyPoints = 0, onRedeemed }: Props) {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [myRewards, setMyRewards] = useState<UserReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [redeemingId, setRedeemingId] = useState<string | null>(null);

    const loadRewards = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const [rewardResponse, myRewardResponse] = await Promise.all([
                api.get("/users/rewards"),
                api.get("/users/rewards/my"),
            ]);

            setRewards(
                extractList(unwrap(rewardResponse), "rewards")
                    .map(normalizeReward)
                    .filter((reward) => reward.isActive),
            );

            setMyRewards(
                extractList(unwrap(myRewardResponse), "rewards")
                    .map(normalizeUserReward),
            );
        } catch (err) {
            console.error("Load rewards error:", err);
            setError("Reward belum dapat dimuat. Coba lagi beberapa saat.");
            setRewards([]);
            setMyRewards([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadRewards();
    }, [loadRewards]);

    const redeemReward = async (reward: Reward) => {
        if (reward.stock === 0) {
            await Swal.fire({
                icon: "warning",
                title: "Reward Habis",
                text: "Reward ini sedang tidak tersedia.",
                confirmButtonColor: "#16a34a",
            });
            return;
        }

        if (loyaltyPoints < reward.pointCost) {
            await Swal.fire({
                icon: "info",
                title: "Poin Belum Cukup",
                text: `Kamu masih membutuhkan ${reward.pointCost - loyaltyPoints} poin lagi.`,
                confirmButtonColor: "#16a34a",
            });
            return;
        }

        const confirm = await Swal.fire({
            icon: "question",
            title: "Tukar Poin?",
            html: `Gunakan <strong>${reward.pointCost} poin</strong> untuk mendapatkan <strong>${reward.name}</strong>.`,
            showCancelButton: true,
            confirmButtonText: "Ya, Tukarkan",
            cancelButtonText: "Batal",
            confirmButtonColor: "#16a34a",
            reverseButtons: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            setRedeemingId(reward.id);
            await api.post(`/users/rewards/${encodeURIComponent(reward.id)}/redeem`);

            await Promise.resolve(onRedeemed?.());
            await loadRewards();

            await Swal.fire({
                icon: "success",
                title: "Reward Berhasil Ditukar!",
                text: "Voucher kamu sudah masuk ke bagian Reward Saya.",
                confirmButtonColor: "#16a34a",
            });
        } catch (err: any) {
            console.error("Redeem reward error:", err);
            await Swal.fire({
                icon: "error",
                title: "Gagal Menukar Reward",
                text:
                    err?.response?.data?.message ??
                    "Reward gagal ditukarkan. Silakan coba lagi.",
                confirmButtonColor: "#16a34a",
            });
        } finally {
            setRedeemingId(null);
        }
    };

    return (
        <section className="loyalty-section reward-section" id="rewards">
            <div className="loyalty-subheading reward-heading">
                <div>
                    <div className="section-eyebrow">
                        <Gift size={16} /> TUKAR POIN
                    </div>
                    <h3>Reward WartegKita</h3>
                    <p>
                        Gunakan poin yang sudah kamu kumpulkan untuk mendapatkan voucher dan potongan belanja.
                    </p>
                </div>

                <div className="reward-balance-pill">
                    <Star size={15} /> {loyaltyPoints.toLocaleString("id-ID")} poin
                </div>
            </div>

            {loading && (
                <div className="loyalty-empty-state reward-empty-state">
                    <Gift size={26} />
                    <strong>Memuat reward...</strong>
                    <p>Sedang mengambil reward terbaru.</p>
                </div>
            )}

            {!loading && error && (
                <div className="loyalty-empty-state reward-empty-state">
                    <Gift size={26} />
                    <strong>Reward tidak tersedia</strong>
                    <p>{error}</p>
                    <button type="button" className="reward-retry-button" onClick={() => void loadRewards()}>
                        Coba Lagi
                    </button>
                </div>
            )}

            {!loading && !error && rewards.length === 0 && (
                <div className="loyalty-empty-state reward-empty-state">
                    <Gift size={26} />
                    <strong>Belum ada reward aktif</strong>
                    <p>Reward baru akan muncul ketika tersedia.</p>
                </div>
            )}

            {!loading && !error && rewards.length > 0 && (
                <div className="reward-grid">
                    {rewards.map((reward) => {
                        const canRedeem = reward.stock !== 0 && loyaltyPoints >= reward.pointCost;
                        const missingPoints = Math.max(0, reward.pointCost - loyaltyPoints);

                        return (
                            <article key={reward.id} className={`reward-card ${canRedeem ? "available" : "locked"}`}>
                                {reward.imageUrl ? (
                                    <img src={reward.imageUrl} alt={reward.name} className="reward-image" />
                                ) : (
                                    <div className="reward-icon"><Gift size={23} /></div>
                                )}

                                <div className="reward-content">
                                    <span className="reward-discount">{discountLabel(reward)}</span>
                                    <h4>{reward.name}</h4>
                                    <p>{reward.description}</p>

                                    {reward.minimumOrder > 0 && (
                                        <small className="reward-minimum-order">
                                            Min. order {formatRupiah(reward.minimumOrder)}
                                        </small>
                                    )}

                                    <div className="reward-footer">
                                        <span className="reward-points">
                                            <Star size={14} /> {reward.pointCost.toLocaleString("id-ID")} poin
                                        </span>

                                        {reward.stock === 0 ? (
                                            <span className="reward-stock-empty">Habis</span>
                                        ) : canRedeem ? (
                                            <button
                                                type="button"
                                                className="reward-redeem-button"
                                                disabled={redeemingId === reward.id}
                                                onClick={() => void redeemReward(reward)}
                                            >
                                                {redeemingId === reward.id ? "Memproses..." : "Tukar Poin"}
                                                {redeemingId !== reward.id && <ArrowRight size={15} />}
                                            </button>
                                        ) : (
                                            <span className="reward-locked-label">
                                                <LockKeyhole size={14} /> Kurang {missingPoints} poin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            <div className="my-rewards-block">
                <div className="my-rewards-heading">
                    <div>
                        <div className="section-eyebrow">
                            <TicketCheck size={16} /> REWARD SAYA
                        </div>
                        <h4>Voucher yang Sudah Kamu Tukar</h4>
                    </div>
                </div>

                {myRewards.length === 0 ? (
                    <div className="my-rewards-empty">
                        <Gift size={20} />
                        <span>Belum ada voucher. Kumpulkan poin lalu tukarkan reward di atas.</span>
                    </div>
                ) : (
                    <div className="my-rewards-list">
                        {myRewards.map((item) => (
                            <div className="my-reward-item" key={item.id}>
                                <div className="my-reward-icon"><TicketCheck size={19} /></div>
                                <div className="my-reward-info">
                                    <strong>{item.reward?.name ?? "Voucher WartegKita"}</strong>
                                    <span>Kode: <b>{item.voucherCode}</b></span>
                                    {item.expiresAt && (
                                        <small>Berakhir {new Date(item.expiresAt).toLocaleDateString("id-ID")}</small>
                                    )}
                                </div>
                                <span className={`my-reward-status ${item.status.toLowerCase()}`}>
                                    {item.status === "ACTIVE" ? <CheckCircle2 size={14} /> : null}
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
