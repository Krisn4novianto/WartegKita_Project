import {
    CheckCircle2,
    ChevronRight,
    ShoppingBag,
    Star,
    Target,
    User,
    WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "../../styles/components/Mission and Reward/MissionSection.css";

interface Mission {
    id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    rewardPoints: number;
    progress: number;
    completed: boolean;
    isActive: boolean;
    startAt?: string | null;
    endAt?: string | null;
}

function getResponseData(response: any): any {
    return response?.data?.data ?? response?.data ?? {};
}

function extractList(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.missions)) return raw.missions;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.data)) return raw.data;
    return [];
}

function normalizeMission(item: any): Mission {
    // Backend returns UserMission with the actual mission inside `mission`.
    // Accept both shapes so the component is compatible with older responses.
    const source = item?.mission ?? item;

    const target = Number(
        source?.target ??
        source?.target_progress ??
        source?.goal ??
        1,
    );

    const progress = Number(
        item?.progress ??
        item?.current_progress ??
        item?.current ??
        source?.progress ??
        0,
    );

    const rewardPoints = Number(
        source?.reward_points ??
        source?.rewardPoints ??
        source?.points ??
        source?.reward ??
        0,
    );

    const safeTarget = Number.isFinite(target) && target > 0 ? target : 1;
    const safeProgress = Number.isFinite(progress) ? Math.max(0, progress) : 0;

    return {
        id: String(source?.id ?? item?.mission_id ?? item?.id ?? crypto.randomUUID()),
        title: source?.title ?? source?.name ?? "Misi Customer",
        description:
            source?.description ??
            "Selesaikan misi ini untuk mendapatkan poin.",
        type: String(
            source?.type ?? source?.mission_type ?? "ORDER_COUNT",
        ).toUpperCase(),
        target: safeTarget,
        rewardPoints: Number.isFinite(rewardPoints) ? Math.max(0, rewardPoints) : 0,
        progress: Math.min(safeProgress, safeTarget),
        completed: Boolean(
            item?.completed ??
            item?.is_completed ??
            safeProgress >= safeTarget,
        ),
        isActive: Boolean(source?.is_active ?? source?.active ?? true),
        startAt: source?.start_at ?? null,
        endAt: source?.end_at ?? null,
    };
}

function getMissionIcon(type: string) {
    const normalized = type.toUpperCase();

    if (normalized.includes("SPEND")) {
        return <WalletCards size={20} />;
    }

    if (normalized.includes("PROFILE")) {
        return <User size={20} />;
    }

    return <ShoppingBag size={20} />;
}

function formatRupiah(value: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatMissionValue(mission: Mission, value: number): string {
    if (mission.type.includes("SPEND")) return formatRupiah(value);
    return String(value);
}

export default function MissionSection() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadMissions = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            // Do NOT require localStorage user/user_id here.
            // api.ts already sends the JWT and backend reads user_id from JWT.
            const response = await api.get("/users/missions");
            const raw = getResponseData(response);
            const list = extractList(raw);

            const normalized = list
                .map(normalizeMission)
                .filter((mission) => mission.isActive);

            setMissions(normalized);
        } catch (requestError: any) {
            console.error("Load missions error:", requestError);

            const backendMessage =
                requestError?.response?.data?.message ??
                requestError?.response?.data?.error;

            setError(
                backendMessage ||
                "Misi belum dapat dimuat. Pastikan backend dan database aktif.",
            );
            setMissions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMissions();
    }, [loadMissions]);

    const completedCount = missions.filter((mission) => mission.completed).length;

    return (
        <section className="loyalty-section mission-section" id="missions">
            <div className="loyalty-subheading">
                <div>
                    <div className="section-eyebrow">
                        <Target size={16} />
                        MISI WARTEGKITA
                    </div>
                    <h3>Misi Kamu</h3>
                    <p>Selesaikan misi dan dapatkan loyalty point tambahan.</p>
                </div>

                {!loading && missions.length > 0 && (
                    <span className="mission-counter">
                        <CheckCircle2 size={15} />
                        {completedCount}/{missions.length} selesai
                    </span>
                )}
            </div>

            {loading ? (
                <div className="loyalty-empty-state mission-empty-state">
                    <div className="mission-empty-icon"><Target size={24} /></div>
                    <strong className="mission-empty-title">Memuat Misi...</strong>
                    <p className="mission-empty-description">
                        Sedang mengambil misi aktif dari WartegKita.
                    </p>
                </div>
            ) : error ? (
                <div className="loyalty-empty-state mission-empty-state">
                    <div className="mission-empty-icon"><Target size={24} /></div>
                    <strong className="mission-empty-title">Misi Tidak Tersedia</strong>
                    <p className="mission-empty-description">{error}</p>
                    <button
                        type="button"
                        className="profile-primary-button"
                        onClick={() => void loadMissions()}
                    >
                        Coba Lagi
                    </button>
                </div>
            ) : missions.length === 0 ? (
                <div className="loyalty-empty-state mission-empty-state">
                    <div className="mission-empty-icon"><Target size={24} /></div>
                    <strong className="mission-empty-title">Belum Ada Misi Aktif</strong>
                    <p className="mission-empty-description">
                        Data misi belum tersedia atau semua misi sedang tidak aktif.
                    </p>
                </div>
            ) : (
                <div className="mission-grid">
                    {missions.map((mission) => {
                        const progress = Math.min(
                            100,
                            Math.round((mission.progress / mission.target) * 100),
                        );

                        return (
                            <article
                                key={mission.id}
                                className={`mission-card ${mission.completed ? "completed" : ""}`}
                            >
                                <div className="mission-card-top">
                                    <div className="mission-icon">
                                        {getMissionIcon(mission.type)}
                                    </div>
                                    <div className="mission-reward">
                                        <Star size={14} />
                                        +{mission.rewardPoints}
                                    </div>
                                </div>

                                <h4>{mission.title}</h4>
                                <p>{mission.description}</p>

                                <div className="mission-progress-info">
                                    <span>
                                        {formatMissionValue(mission, mission.progress)} / {formatMissionValue(mission, mission.target)}
                                    </span>
                                    <strong>{progress}%</strong>
                                </div>

                                <div className="mission-progress-track">
                                    <div
                                        className="mission-progress-fill"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {mission.completed ? (
                                    <div className="mission-completed">
                                        <CheckCircle2 size={15} />
                                        Misi selesai • +{mission.rewardPoints} poin
                                    </div>
                                ) : (
                                    <Link to="/explore" className="mission-action-button">
                                        <span>
                                            {mission.progress > 0
                                                ? "Lanjut Belanja"
                                                : "Mulai Misi"}
                                        </span>
                                        <ChevronRight size={17} />
                                    </Link>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
