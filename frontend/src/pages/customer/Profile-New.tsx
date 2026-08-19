import {
  User,
  ShoppingBag,
  MapPin,
  LogOut,
  Plus,
  Edit3,
  ChevronRight,
  ShieldCheck,
  Mail,
  Bell,
  HelpCircle,
  Star,
  Trophy,
  Gift,
  Target,
  CheckCircle2,
  LockKeyhole,
  Settings,
  WalletCards,
  ArrowRight,
  CircleHelp,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import api from "../../services/api";

import {
  getProvinces,
  getCities,
  getDistricts,
  Wilayah,
} from "../../services/wilayahApi";

import "../../styles/profile.css";

/* =========================================================
   TYPES
========================================================= */

interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

interface Address {
  label: string;
  detail: string;

  province: string;
  provinceId: number | "";

  city: string;
  cityId: number | "";

  district: string;
  districtId: number | "";

  postalCode: string;
  note: string;
}

interface LoyaltyMission {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  rewardPoints: number;
  completed: boolean;
  icon: "order" | "spend" | "profile";
}

interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  points: number;
  discount: string;
  active: boolean;
}

/* =========================================================
   DEFAULT ADDRESS
========================================================= */

const emptyAddress: Address = {
  label: "Rumah",

  detail: "",

  province: "",
  provinceId: "",

  city: "",
  cityId: "",

  district: "",
  districtId: "",

  postalCode: "",

  note: "",
};

/* =========================================================
   DEFAULT MISSIONS
========================================================= */

/*
 * Fallback mission digunakan ketika:
 *
 * 1. API mengembalikan []
 * 2. API belum tersedia
 * 3. API error / 404
 * 4. Backend belum mempunyai data mission
 *
 * Begitu backend mengembalikan data mission,
 * data backend otomatis menjadi prioritas.
 */

const DEFAULT_MISSIONS: LoyaltyMission[] = [
  {
    id: "default-order-1",
    title: "Pesan Makanan",
    description:
      "Lakukan 1 pesanan melalui WartegKita untuk mendapatkan poin.",
    progress: 0,
    target: 1,
    rewardPoints: 50,
    completed: false,
    icon: "order",
  },

  {
    id: "default-spend-1",
    title: "Belanja di WartegKita",
    description:
      "Capai total belanja Rp100.000 untuk mendapatkan poin tambahan.",
    progress: 0,
    target: 100000,
    rewardPoints: 100,
    completed: false,
    icon: "spend",
  },

  {
    id: "default-profile-1",
    title: "Lengkapi Profil",
    description:
      "Lengkapi informasi profil dan alamat pengiriman kamu.",
    progress: 0,
    target: 1,
    rewardPoints: 50,
    completed: false,
    icon: "profile",
  },
];

/* =========================================================
   DEFAULT REWARDS
========================================================= */

const DEFAULT_REWARDS: LoyaltyReward[] = [
  {
    id: "default-reward-50",
    title: "Voucher Hemat",
    description:
      "Gunakan poin untuk mendapatkan potongan harga pada pesanan berikutnya.",
    points: 100,
    discount: "Rp5.000",
    active: true,
  },

  {
    id: "default-reward-100",
    title: "Voucher Spesial",
    description:
      "Tukarkan poin kamu dengan voucher potongan harga.",
    points: 200,
    discount: "Rp10.000",
    active: true,
  },

  {
    id: "default-reward-250",
    title: "Voucher Premium",
    description:
      "Dapatkan potongan harga lebih besar untuk pesanan kamu.",
    points: 400,
    discount: "Rp20.000",
    active: true,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function getCurrentUserId(): string {
  try {
    const rawUser =
      localStorage.getItem("user");

    if (rawUser) {
      const parsed =
        JSON.parse(rawUser);

      if (parsed?.id) {
        return String(parsed.id);
      }

      if (parsed?.user_id) {
        return String(parsed.user_id);
      }
    }
  } catch {
    // Ignore invalid localStorage JSON
  }

  return (
    localStorage.getItem("user_id") ||
    ""
  );
}

function getResponseData(
  response: any,
): any {
  return (
    response?.data?.data ??
    response?.data ??
    {}
  );
}

function getErrorMessage(
  error: any,
  fallback: string,
): string {
  return (
    error?.response?.data?.message ??
    error?.response?.data?.error ??
    error?.message ??
    fallback
  );
}

function formatRupiah(
  value: number,
): string {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function formatMissionProgress(
  mission: LoyaltyMission,
): number {
  if (mission.target <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (mission.progress /
        mission.target) *
      100,
    ),
  );
}

/* =========================================================
   NORMALIZE MISSION
========================================================= */

function normalizeMission(
  item: any,
  index = 0,
): LoyaltyMission {
  const rawIcon =
    String(
      item?.icon ??
      item?.type ??
      item?.mission_type ??
      "order",
    ).toLowerCase();

  let icon:
    LoyaltyMission["icon"] =
    "order";

  if (
    rawIcon.includes("spend") ||
    rawIcon.includes("belanja") ||
    rawIcon.includes("amount")
  ) {
    icon = "spend";
  } else if (
    rawIcon.includes("profile") ||
    rawIcon.includes("profil")
  ) {
    icon = "profile";
  }

  const progress =
    Number(
      item?.progress ??
      item?.current_progress ??
      item?.current ??
      0,
    );

  const target =
    Number(
      item?.target ??
      item?.target_progress ??
      item?.goal ??
      1,
    );

  const rewardPoints =
    Number(
      item?.reward_points ??
      item?.points ??
      item?.reward ??
      0,
    );

  const safeProgress =
    Number.isFinite(progress)
      ? Math.max(0, progress)
      : 0;

  const safeTarget =
    Number.isFinite(target) &&
      target > 0
      ? target
      : 1;

  return {
    id: String(
      item?.id ??
      item?.mission_id ??
      `mission-${index}-${Date.now()}`,
    ),

    title:
      item?.title ??
      item?.name ??
      "Misi Customer",

    description:
      item?.description ??
      "Selesaikan misi ini untuk mendapatkan poin.",

    progress:
      safeProgress,

    target:
      safeTarget,

    rewardPoints:
      Number.isFinite(
        rewardPoints,
      )
        ? Math.max(
          0,
          rewardPoints,
        )
        : 0,

    completed:
      Boolean(
        item?.completed ??
        item?.is_completed ??
        safeProgress >=
        safeTarget,
      ),

    icon,
  };
}

/* =========================================================
   NORMALIZE REWARD
========================================================= */

function normalizeReward(
  item: any,
  index = 0,
): LoyaltyReward {
  const points =
    Number(
      item?.points ??
      item?.required_points ??
      item?.redeem_points ??
      0,
    );

  const discountValue =
    Number(
      item?.discount_amount ??
      item?.discount ??
      0,
    );

  let discount =
    item?.discount_display ??
    item?.discount_text ??
    "";

  if (
    !discount &&
    discountValue > 0
  ) {
    discount =
      formatRupiah(
        discountValue,
      );
  }

  if (!discount) {
    discount =
      item?.title ??
      "Reward";
  }

  return {
    id: String(
      item?.id ??
      item?.reward_id ??
      `reward-${index}-${Date.now()}`,
    ),

    title:
      item?.title ??
      item?.name ??
      "Reward",

    description:
      item?.description ??
      "Gunakan poin kamu untuk mendapatkan reward.",

    points:
      Number.isFinite(points)
        ? Math.max(0, points)
        : 0,

    discount,

    active:
      item?.active ??
      item?.is_active ??
      true,
  };
}

/* =========================================================
   EXTRACT LIST
========================================================= */

function extractList(
  raw: any,
  key: string,
): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (
    Array.isArray(
      raw?.[key],
    )
  ) {
    return raw[key];
  }

  if (
    Array.isArray(
      raw?.data,
    )
  ) {
    return raw.data;
  }

  if (
    Array.isArray(
      raw?.items,
    )
  ) {
    return raw.items;
  }

  return [];
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Profile() {
  const navigate =
    useNavigate();

  /* =====================================================
     USER
  ===================================================== */

  const [
    user,
    setUser,
  ] =
    useState<UserProfile | null>(
      null,
    );

  const [
    loadingUser,
    setLoadingUser,
  ] =
    useState(true);

  const [
    editProfile,
    setEditProfile,
  ] =
    useState(false);

  const [
    savingProfile,
    setSavingProfile,
  ] =
    useState(false);

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  /* =====================================================
     ADDRESS
  ===================================================== */

  const [
    showEditAddress,
    setShowEditAddress,
  ] =
    useState(false);

  const [
    savingAddress,
    setSavingAddress,
  ] =
    useState(false);

  const [
    savedAddress,
    setSavedAddress,
  ] =
    useState<Address | null>(
      null,
    );

  const [
    address,
    setAddress,
  ] =
    useState<Address>(
      emptyAddress,
    );

  const [
    provinces,
    setProvinces,
  ] =
    useState<Wilayah[]>([]);

  const [
    cities,
    setCities,
  ] =
    useState<Wilayah[]>([]);

  const [
    districts,
    setDistricts,
  ] =
    useState<Wilayah[]>([]);

  /* =====================================================
     LOYALTY
  ===================================================== */

  const [
    loyaltyPoints,
    setLoyaltyPoints,
  ] =
    useState(0);

  const [
    missions,
    setMissions,
  ] =
    useState<LoyaltyMission[]>(
      DEFAULT_MISSIONS,
    );

  const [
    rewards,
    setRewards,
  ] =
    useState<LoyaltyReward[]>(
      DEFAULT_REWARDS,
    );

  const [
    selectedReward,
    setSelectedReward,
  ] =
    useState<LoyaltyReward | null>(
      null,
    );

  const [
    loadingLoyalty,
    setLoadingLoyalty,
  ] =
    useState(true);

  const [
    redeemingReward,
    setRedeemingReward,
  ] =
    useState(false);

  /* =====================================================
     SETTINGS
  ===================================================== */

  const [
    activeSetting,
    setActiveSetting,
  ] =
    useState<string | null>(
      null,
    );

  /* =====================================================
     USER ID
  ===================================================== */

  const userId =
    useMemo(
      () =>
        getCurrentUserId(),
      [],
    );

  /* =====================================================
     LOAD USER
  ===================================================== */

  const loadUser =
    useCallback(
      async () => {
        try {
          setLoadingUser(
            true,
          );

          const currentUserId =
            getCurrentUserId();

          if (
            !currentUserId
          ) {
            console.warn(
              "User ID tidak ditemukan.",
            );

            return;
          }

          const response =
            await api.get(
              `/users/profile?user_id=${encodeURIComponent(
                currentUserId,
              )}`,
            );

          const data =
            getResponseData(
              response,
            );

          setUser(
            data,
          );

          setName(
            data?.name ??
            "",
          );

          setEmail(
            data?.email ??
            "",
          );
        } catch (
        error: any
        ) {
          console.error(
            "Load user error:",
            error,
          );

          await Swal.fire(
            {
              icon: "error",
              title:
                "Gagal Memuat Profil",
              text:
                getErrorMessage(
                  error,
                  "Data profil tidak dapat dimuat.",
                ),
              confirmButtonColor:
                "#16a34a",
            },
          );
        } finally {
          setLoadingUser(
            false,
          );
        }
      },
      [],
    );

  /* =====================================================
     LOAD ADDRESS
  ===================================================== */

  const loadAddress =
    useCallback(
      async () => {
        try {
          const currentUserId =
            getCurrentUserId();

          if (
            !currentUserId
          ) {
            return;
          }

          const response =
            await api.get(
              `/users/address?user_id=${encodeURIComponent(
                currentUserId,
              )}`,
            );

          const raw =
            response?.data
              ?.data ??
            response?.data;

          const data =
            Array.isArray(
              raw,
            )
              ? raw[0]
              : raw;

          if (!data) {
            setSavedAddress(
              null,
            );

            setAddress({
              ...emptyAddress,
            });

            return;
          }

          const result: Address =
          {
            label:
              data?.label ??
              "Rumah",

            detail:
              data?.detail ??
              "",

            province:
              data?.province_name ??
              "",

            provinceId:
              data?.province_id ??
              "",

            city:
              data?.city_name ??
              "",

            cityId:
              data?.city_id ??
              "",

            district:
              data?.district_name ??
              "",

            districtId:
              data?.district_id ??
              "",

            postalCode:
              data?.postal_code ??
              "",

            note:
              data?.note ??
              "",
          };

          setSavedAddress(
            result,
          );

          setAddress(
            result,
          );

          if (
            result.provinceId
          ) {
            const cityData =
              await getCities(
                result.provinceId,
              );

            setCities(
              cityData,
            );
          }

          if (
            result.cityId
          ) {
            const districtData =
              await getDistricts(
                result.cityId,
              );

            setDistricts(
              districtData,
            );
          }
        } catch (
        error
        ) {
          console.error(
            "Address error:",
            error,
          );
        }
      },
      [],
    );

  /* =====================================================
     LOAD POINTS
  ===================================================== */

  const loadLoyaltyPoints =
    useCallback(
      async () => {
        try {
          const currentUserId =
            getCurrentUserId();

          if (
            !currentUserId
          ) {
            return;
          }

          const response =
            await api.get(
              `/users/points?user_id=${encodeURIComponent(
                currentUserId,
              )}`,
            );

          const data =
            getResponseData(
              response,
            );

          const points =
            Number(
              data?.points ??
              data?.balance ??
              data?.total_points ??
              data?.current_points ??
              0,
            );

          setLoyaltyPoints(
            Number.isFinite(
              points,
            )
              ? Math.max(
                0,
                points,
              )
              : 0,
          );
        } catch (
        error
        ) {
          console.error(
            "Load loyalty points error:",
            error,
          );

          setLoyaltyPoints(
            0,
          );
        }
      },
      [],
    );

  /* =====================================================
     LOAD MISSIONS
  ===================================================== */

  const loadMissions =
    useCallback(
      async () => {
        try {
          const currentUserId =
            getCurrentUserId();

          /*
           * Kalau tidak ada user ID,
           * langsung gunakan fallback.
           */

          if (
            !currentUserId
          ) {
            setMissions(
              DEFAULT_MISSIONS,
            );

            return;
          }

          const response =
            await api.get(
              `/users/missions?user_id=${encodeURIComponent(
                currentUserId,
              )}`,
            );

          const raw =
            getResponseData(
              response,
            );

          const list =
            extractList(
              raw,
              "missions",
            );

          /*
           * API punya data
           * -> gunakan data API.
           *
           * API kosong
           * -> gunakan default mission.
           */

          if (
            list.length > 0
          ) {
            setMissions(
              list.map(
                (
                  item,
                  index,
                ) =>
                  normalizeMission(
                    item,
                    index,
                  ),
              ),
            );
          } else {
            setMissions(
              DEFAULT_MISSIONS,
            );
          }
        } catch (
        error
        ) {
          /*
           * API error bukan berarti
           * section mission harus kosong.
           */

          console.warn(
            "Mission API unavailable, using fallback missions.",
            error,
          );

          setMissions(
            DEFAULT_MISSIONS,
          );
        }
      },
      [],
    );

  /* =====================================================
     LOAD REWARDS
  ===================================================== */

  const loadRewards =
    useCallback(
      async () => {
        try {
          const currentUserId =
            getCurrentUserId();

          if (
            !currentUserId
          ) {
            setRewards(
              DEFAULT_REWARDS,
            );

            return;
          }

          const response =
            await api.get(
              `/users/rewards?user_id=${encodeURIComponent(
                currentUserId,
              )}`,
            );

          const raw =
            getResponseData(
              response,
            );

          const list =
            extractList(
              raw,
              "rewards",
            );

          if (
            list.length > 0
          ) {
            setRewards(
              list.map(
                (
                  item,
                  index,
                ) =>
                  normalizeReward(
                    item,
                    index,
                  ),
              ),
            );
          } else {
            setRewards(
              DEFAULT_REWARDS,
            );
          }
        } catch (
        error
        ) {
          console.warn(
            "Reward API unavailable, using fallback rewards.",
            error,
          );

          setRewards(
            DEFAULT_REWARDS,
          );
        }
      },
      [],
    );

  /* =====================================================
     LOAD LOYALTY
  ===================================================== */

  const loadLoyalty =
    useCallback(
      async () => {
        try {
          setLoadingLoyalty(
            true,
          );

          await Promise.all(
            [
              loadLoyaltyPoints(),
              loadMissions(),
              loadRewards(),
            ],
          );
        } finally {
          setLoadingLoyalty(
            false,
          );
        }
      },
      [
        loadLoyaltyPoints,
        loadMissions,
        loadRewards,
      ],
    );

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(
    () => {
      async function init() {
        try {
          const provinceData =
            await getProvinces();

          setProvinces(
            provinceData,
          );

          await Promise.all(
            [
              loadUser(),
              loadAddress(),
              loadLoyalty(),
            ],
          );
        } catch (
        error
        ) {
          console.error(
            "Profile initialization error:",
            error,
          );
        }
      }

      void init();
    },
    [
      loadUser,
      loadAddress,
      loadLoyalty,
    ],
  );

  /* =====================================================
     UPDATE PROFILE
  ===================================================== */

  async function updateUser() {
    if (
      !name.trim()
    ) {
      await Swal.fire(
        {
          icon: "warning",
          title:
            "Nama belum diisi",
          text:
            "Silakan masukkan nama kamu.",
          confirmButtonColor:
            "#16a34a",
        },
      );

      return;
    }

    if (
      !email.trim()
    ) {
      await Swal.fire(
        {
          icon: "warning",
          title:
            "Email belum diisi",
          text:
            "Silakan masukkan email kamu.",
          confirmButtonColor:
            "#16a34a",
        },
      );

      return;
    }

    const currentUserId =
      getCurrentUserId();

    if (
      !currentUserId
    ) {
      await Swal.fire(
        {
          icon: "error",
          title:
            "User ID Tidak Ditemukan",
          text:
            "Sesi pengguna tidak memiliki ID yang valid.",
        },
      );

      return;
    }

    try {
      setSavingProfile(
        true,
      );

      await api.put(
        "/users/profile",
        {
          user_id:
            currentUserId,

          name:
            name.trim(),

          email:
            email.trim(),
        },
      );

      await loadUser();

      setEditProfile(
        false,
      );

      await Swal.fire(
        {
          title:
            "Profil Berhasil Disimpan",
          text:
            "Informasi akun kamu berhasil diperbarui.",
          icon:
            "success",
          timer:
            1500,
          showConfirmButton:
            false,
        },
      );
    } catch (
    error: any
    ) {
      console.error(
        "Update user error:",
        error,
      );

      await Swal.fire(
        {
          title:
            "Gagal Menyimpan",
          text:
            getErrorMessage(
              error,
              "Profil gagal diperbarui.",
            ),
          icon:
            "error",
        },
      );
    } finally {
      setSavingProfile(
        false,
      );
    }
  }

  /* =====================================================
     ADDRESS HELPERS
  ===================================================== */

  function updateAddress(
    value: Partial<Address>,
  ) {
    setAddress(
      previous => ({
        ...previous,
        ...value,
      }),
    );
  }

  async function chooseProvince(
    value: string,
  ) {
    if (!value) {
      updateAddress(
        {
          provinceId:
            "",
          province:
            "",
          city:
            "",
          cityId:
            "",
          district:
            "",
          districtId:
            "",
          postalCode:
            "",
        },
      );

      setCities(
        [],
      );

      setDistricts(
        [],
      );

      return;
    }

    const provinceId =
      Number(value);

    const selected =
      provinces.find(
        item =>
          item.id ===
          provinceId,
      );

    updateAddress(
      {
        provinceId,

        province:
          selected?.name ??
          "",

        city:
          "",
        cityId:
          "",

        district:
          "",
        districtId:
          "",

        postalCode:
          "",
      },
    );

    setCities(
      [],
    );

    setDistricts(
      [],
    );

    try {
      const cityData =
        await getCities(
          provinceId,
        );

      setCities(
        cityData,
      );
    } catch (
    error
    ) {
      console.error(
        "Load cities error:",
        error,
      );
    }
  }

  async function chooseCity(
    value: string,
  ) {
    if (!value) {
      updateAddress(
        {
          city:
            "",
          cityId:
            "",
          district:
            "",
          districtId:
            "",
          postalCode:
            "",
        },
      );

      setDistricts(
        [],
      );

      return;
    }

    const cityId =
      Number(value);

    const selected =
      cities.find(
        item =>
          item.id ===
          cityId,
      );

    updateAddress(
      {
        cityId,

        city:
          selected?.name ??
          "",

        district:
          "",
        districtId:
          "",

        postalCode:
          "",
      },
    );

    setDistricts(
      [],
    );

    try {
      const districtData =
        await getDistricts(
          cityId,
        );

      setDistricts(
        districtData,
      );
    } catch (
    error
    ) {
      console.error(
        "Load districts error:",
        error,
      );
    }
  }

  function chooseDistrict(
    value: string,
  ) {
    if (!value) {
      updateAddress(
        {
          district:
            "",
          districtId:
            "",
        },
      );

      return;
    }

    const districtId =
      Number(value);

    const selected =
      districts.find(
        item =>
          item.id ===
          districtId,
      );

    updateAddress(
      {
        districtId,

        district:
          selected?.name ??
          "",
      },
    );
  }

  async function saveAddress() {
    if (
      !address.detail.trim() ||
      !address.province ||
      !address.city ||
      !address.district
    ) {
      await Swal.fire(
        {
          title:
            "Alamat Belum Lengkap",
          text:
            "Lengkapi alamat, provinsi, kabupaten/kota, dan kecamatan terlebih dahulu.",
          icon:
            "warning",
          confirmButtonColor:
            "#16a34a",
        },
      );

      return;
    }

    const currentUserId =
      getCurrentUserId();

    if (
      !currentUserId
    ) {
      await Swal.fire(
        {
          icon: "error",
          title:
            "User ID Tidak Ditemukan",
          text:
            "Sesi pengguna tidak memiliki ID yang valid.",
        },
      );

      return;
    }

    try {
      setSavingAddress(
        true,
      );

      await api.post(
        "/users/address",
        {
          user_id:
            currentUserId,

          label:
            address.label,

          detail:
            address.detail.trim(),

          province_id:
            address.provinceId,

          province_name:
            address.province,

          city_id:
            address.cityId,

          city_name:
            address.city,

          district_id:
            address.districtId,

          district_name:
            address.district,

          postal_code:
            address.postalCode,

          note:
            address.note.trim(),
        },
      );

      await loadAddress();

      setShowEditAddress(
        false,
      );

      await Swal.fire(
        {
          title:
            "Alamat Berhasil Disimpan",
          text:
            "Alamat pengiriman kamu berhasil diperbarui.",
          icon:
            "success",
          timer:
            1500,
          showConfirmButton:
            false,
        },
      );
    } catch (
    error: any
    ) {
      console.error(
        "Save address error:",
        error,
      );

      await Swal.fire(
        {
          title:
            "Gagal Menyimpan Alamat",
          text:
            getErrorMessage(
              error,
              "Alamat gagal disimpan.",
            ),
          icon:
            "error",
        },
      );
    } finally {
      setSavingAddress(
        false,
      );
    }
  }

  /* =====================================================
     LOYALTY CALCULATIONS
  ===================================================== */

  const completedMissionCount =
    missions.filter(
      mission =>
        mission.completed,
    ).length;

  const totalMissionCount =
    missions.length;

  const nextReward =
    rewards
      .filter(
        reward =>
          reward.active &&
          reward.points >
          loyaltyPoints,
      )
      .sort(
        (a, b) =>
          a.points -
          b.points,
      )[0] ??
    null;

  const pointsToNextReward =
    nextReward
      ? Math.max(
        0,
        nextReward.points -
        loyaltyPoints,
      )
      : 0;

  function getMissionIcon(
    type: LoyaltyMission["icon"],
  ) {
    if (
      type === "spend"
    ) {
      return (
        <WalletCards
          size={20}
        />
      );
    }

    if (
      type === "profile"
    ) {
      return (
        <User
          size={20}
        />
      );
    }

    return (
      <ShoppingBag
        size={20}
      />
    );
  }

  /* =====================================================
     REDEEM
  ===================================================== */

  async function redeemReward(
    reward: LoyaltyReward,
  ) {
    if (
      !reward.active
    ) {
      return;
    }

    if (
      loyaltyPoints <
      reward.points
    ) {
      await Swal.fire(
        {
          icon:
            "info",
          title:
            "Poin Belum Cukup",
          text:
            `Kamu membutuhkan ${reward.points -
            loyaltyPoints
            } poin lagi untuk menukar reward ini.`,
          confirmButtonColor:
            "#16a34a",
        },
      );

      return;
    }

    setSelectedReward(
      reward,
    );
  }

  async function confirmRedeemReward() {
    if (
      !selectedReward
    ) {
      return;
    }

    const currentUserId =
      getCurrentUserId();

    if (
      !currentUserId
    ) {
      await Swal.fire(
        {
          icon:
            "error",
          title:
            "User ID Tidak Ditemukan",
          text:
            "Sesi pengguna tidak memiliki ID yang valid.",
        },
      );

      return;
    }

    try {
      setRedeemingReward(
        true,
      );

      await api.post(
        `/users/rewards/${encodeURIComponent(
          selectedReward.id,
        )}/redeem`,
        {
          user_id:
            currentUserId,
        },
      );

      const rewardName =
        selectedReward.title;

      setSelectedReward(
        null,
      );

      await Promise.all(
        [
          loadLoyaltyPoints(),
          loadRewards(),
          loadMissions(),
        ],
      );

      await Swal.fire(
        {
          icon:
            "success",
          title:
            "Reward Berhasil Ditukar!",
          text:
            `${rewardName} berhasil ditambahkan ke reward kamu.`,
          confirmButtonColor:
            "#16a34a",
        },
      );
    } catch (
    error: any
    ) {
      console.error(
        "Redeem reward error:",
        error,
      );

      await Swal.fire(
        {
          icon:
            "error",
          title:
            "Gagal Menukar Reward",
          text:
            getErrorMessage(
              error,
              "Reward tidak dapat ditukar.",
            ),
          confirmButtonColor:
            "#16a34a",
        },
      );
    } finally {
      setRedeemingReward(
        false,
      );
    }
  }

  /* =====================================================
     SETTINGS
  ===================================================== */

  async function handleSettingClick(
    setting: string,
  ) {
    if (
      setting ===
      "Alamat Pengiriman"
    ) {
      setAddress(
        savedAddress ??
        {
          ...emptyAddress,
        },
      );

      setShowEditAddress(
        true,
      );

      setActiveSetting(
        null,
      );

      return;
    }

    setActiveSetting(
      setting,
    );

    await Swal.fire(
      {
        icon:
          "info",
        title:
          setting,
        text:
          "Menu ini siap diintegrasikan dengan halaman pengaturan customer WartegKita.",
        confirmButtonColor:
          "#16a34a",
        confirmButtonText:
          "Mengerti",
      },
    );

    setActiveSetting(
      null,
    );
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logout() {
    const result =
      await Swal.fire(
        {
          icon:
            "warning",

          title:
            "Keluar dari akun?",

          text:
            "Kamu akan keluar dari akun WartegKita di perangkat ini.",

          showCancelButton:
            true,

          confirmButtonText:
            "Ya, Logout",

          cancelButtonText:
            "Batal",

          reverseButtons:
            true,

          confirmButtonColor:
            "#dc2626",

          cancelButtonColor:
            "#6b7280",
        },
      );

    if (
      !result.isConfirmed
    ) {
      return;
    }

    localStorage.removeItem(
      "token",
    );

    localStorage.removeItem(
      "user",
    );

    localStorage.removeItem(
      "user_id",
    );

    navigate(
      "/login",
      {
        replace:
          true,
      },
    );
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loadingUser
  ) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-spinner" />

        <p>
          Memuat profil kamu...
        </p>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="profile-page">
      <div className="profile-container">

        {/* =================================================
                   HEADER
                ================================================= */}

        <header className="profile-header">
          <div>
            <div className="profile-eyebrow">
              <User size={16} />

              AKUN ANDA
            </div>

            <h1>
              Profil Saya
            </h1>

            <p>
              Kelola informasi akun,
              alamat pengiriman,
              poin, reward, dan
              pengaturan WartegKita.
            </p>
          </div>
        </header>

        {/* =================================================
                   PROFILE HERO
                ================================================= */}

        <section className="profile-hero">
          <div className="profile-hero-background">
            <div className="profile-hero-gradient" />

            <div className="profile-hero-decoration profile-decoration-one" />

            <div className="profile-hero-decoration profile-decoration-two" />
          </div>

          <div className="profile-hero-content">

            <div className="profile-avatar-area">
              <div className="profile-avatar">
                {user?.name
                  ?.charAt(
                    0,
                  )
                  .toUpperCase() ||
                  "U"}
              </div>
            </div>

            <div className="profile-information">

              {editProfile ? (
                <div className="profile-edit-form">

                  <div className="profile-edit-field">
                    <label>
                      Nama
                    </label>

                    <input
                      type="text"
                      value={
                        name
                      }
                      onChange={e =>
                        setName(
                          e.target
                            .value,
                        )
                      }
                      placeholder="Masukkan nama"
                    />
                  </div>

                  <div className="profile-edit-field">
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      value={
                        email
                      }
                      onChange={e =>
                        setEmail(
                          e.target
                            .value,
                        )
                      }
                      placeholder="Masukkan email"
                    />
                  </div>

                  <div className="profile-edit-actions">

                    <button
                      type="button"
                      className="profile-secondary-button"
                      onClick={() =>
                        setEditProfile(
                          false,
                        )
                      }
                      disabled={
                        savingProfile
                      }
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      className="profile-primary-button"
                      onClick={
                        updateUser
                      }
                      disabled={
                        savingProfile
                      }
                    >
                      <CheckCircle2
                        size={17}
                      />

                      {savingProfile
                        ? "Menyimpan..."
                        : "Simpan Perubahan"}
                    </button>

                  </div>
                </div>
              ) : (
                <>
                  <div className="profile-title-row">
                    <h2>
                      {user?.name ||
                        "Nama User"}
                    </h2>

                    <span className="profile-role-badge">
                      <User
                        size={14}
                      />

                      Customer
                    </span>
                  </div>

                  <p className="profile-email">
                    <Mail
                      size={16}
                    />

                    {user?.email ||
                      "email@example.com"}
                  </p>

                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={() => {
                      setName(
                        user?.name ??
                        "",
                      );

                      setEmail(
                        user?.email ??
                        "",
                      );

                      setEditProfile(
                        true,
                      );
                    }}
                  >
                    <Edit3
                      size={16}
                    />

                    Edit Profil
                  </button>
                </>
              )}
            </div>

            <div className="profile-point-mini-card">

              <div className="profile-point-mini-icon">
                <Star
                  size={20}
                />
              </div>

              <div>
                <span>
                  Poin WartegKita
                </span>

                <strong>
                  {loyaltyPoints}
                </strong>
              </div>

            </div>

          </div>
        </section>

        {/* =================================================
                   LOYALTY
                ================================================= */}

        <section className="loyalty-section">

          <div className="loyalty-heading">

            <div>
              <div className="section-eyebrow">
                <Star
                  size={16}
                />

                WARTEGKITA REWARDS
              </div>

              <h2>
                Kumpulkan Poin, Dapatkan Lebih Banyak Hemat
              </h2>

              <p>
                Selesaikan misi sederhana,
                kumpulkan poin, lalu tukarkan
                menjadi potongan harga untuk
                pesanan kamu.
              </p>
            </div>

            <div className="loyalty-point-balance">

              <div className="loyalty-point-icon">
                <Star
                  size={21}
                />
              </div>

              <div>
                <span>
                  Saldo Poin
                </span>

                <strong>
                  {loadingLoyalty
                    ? "..."
                    : loyaltyPoints}
                </strong>

                <small>
                  poin
                </small>
              </div>

            </div>

          </div>

          {/* =================================================
                       POINT PROGRESS
                    ================================================= */}

          <div className="loyalty-progress-card">

            <div className="loyalty-progress-left">

              <div className="loyalty-progress-icon">
                <Trophy
                  size={24}
                />
              </div>

              <div>

                <strong>
                  {loadingLoyalty
                    ? "Memuat reward..."
                    : nextReward
                      ? `Butuh ${pointsToNextReward} poin lagi`
                      : rewards.length >
                        0
                        ? "Semua reward sudah tersedia"
                        : "Belum ada reward tersedia"}
                </strong>

                <span>
                  {loadingLoyalty
                    ? "Mengambil data loyalty kamu."
                    : nextReward
                      ? `untuk mendapatkan ${nextReward.discount}`
                      : rewards.length >
                        0
                        ? "Pilih reward yang ingin kamu tukarkan."
                        : "Reward akan muncul ketika tersedia."}
                </span>

              </div>

            </div>

            <div className="loyalty-progress-right">

              <div className="loyalty-progress-numbers">

                <strong>
                  {loyaltyPoints}
                </strong>

                <span>
                  /
                  {nextReward?.points ??
                    loyaltyPoints}
                  {" "}poin
                </span>

              </div>

              <div className="loyalty-progress-track">

                <div
                  className="loyalty-progress-fill"
                  style={{
                    width:
                      `${nextReward
                        ? Math.min(
                          100,
                          Math.round(
                            (loyaltyPoints /
                              nextReward.points) *
                            100,
                          ),
                        )
                        : loyaltyPoints >
                          0
                          ? 100
                          : 0
                      }%`,
                  }}
                />

              </div>

            </div>

          </div>

          {/* =================================================
                       MISSIONS
                    ================================================= */}

          <div className="loyalty-subheading">

            <div>
              <h3>
                Misi Kamu
              </h3>

              <p>
                Selesaikan misi dan dapatkan poin tambahan.
              </p>
            </div>

            <span className="mission-counter">

              <CheckCircle2
                size={15}
              />

              {completedMissionCount}
              /
              {totalMissionCount}
              {" "}selesai

            </span>

          </div>

          <div className="mission-grid">

            {loadingLoyalty ? (
              <div className="loyalty-empty-state mission-empty-state mission-loading-state">

                <div className="mission-empty-icon">
                  <Target
                    size={24}
                  />
                </div>

                <strong className="mission-empty-title">
                  Memuat Misi...
                </strong>

                <p className="mission-empty-description">
                  Sedang mengambil data misi kamu.
                </p>

              </div>
            ) : (
              missions.map(
                mission => {
                  const progress =
                    formatMissionProgress(
                      mission,
                    );

                  return (
                    <article
                      key={
                        mission.id
                      }
                      className={`mission-card ${mission.completed
                        ? "completed"
                        : ""
                        }`}
                    >

                      <div className="mission-card-top">

                        <div className="mission-icon">
                          {getMissionIcon(
                            mission.icon,
                          )}
                        </div>

                        <div className="mission-reward">
                          <Star
                            size={14}
                          />

                          +
                          {
                            mission.rewardPoints
                          }
                        </div>

                      </div>

                      <h4>
                        {
                          mission.title
                        }
                      </h4>

                      <p>
                        {
                          mission.description
                        }
                      </p>

                      <div className="mission-progress-info">

                        <span>
                          {mission.icon ===
                            "spend"
                            ? formatRupiah(
                              mission.progress,
                            )
                            : mission.progress}

                          {" / "}

                          {mission.icon ===
                            "spend"
                            ? formatRupiah(
                              mission.target,
                            )
                            : mission.target}
                        </span>

                        <strong>
                          {
                            progress
                          }
                          %
                        </strong>

                      </div>

                      <div className="mission-progress-track">

                        <div
                          className="mission-progress-fill"
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />

                      </div>

                      {mission.completed ? (
                        <div className="mission-completed">
                          <CheckCircle2
                            size={15}
                          />

                          Misi selesai
                        </div>
                      ) : (
                        <div className="mission-in-progress">
                          <Target
                            size={15}
                          />

                          Sedang berjalan
                        </div>
                      )}

                    </article>
                  );
                },
              )
            )}

          </div>

          {/* =================================================
                       REWARDS
                    ================================================= */}

          <div className="loyalty-subheading rewards-heading">

            <div>
              <h3>
                Tukarkan Poin
              </h3>

              <p>
                Gunakan poin untuk mendapatkan potongan harga.
              </p>
            </div>

            <div className="reward-balance-small">
              <Star
                size={15}
              />

              {loyaltyPoints}
              {" "}poin
            </div>

          </div>

          <div className="reward-grid">

            {loadingLoyalty ? (
              <div className="loyalty-empty-state reward-empty-state reward-loading-state">

                <div className="reward-empty-icon">
                  <Gift
                    size={24}
                  />
                </div>

                <strong className="reward-empty-title">
                  Memuat Reward...
                </strong>

                <p className="reward-empty-description">
                  Sedang mengambil data reward kamu.
                </p>

              </div>
            ) : (
              rewards.map(
                reward => {
                  const canRedeem =
                    reward.active &&
                    loyaltyPoints >=
                    reward.points;

                  return (
                    <article
                      key={
                        reward.id
                      }
                      className={`reward-card ${!reward.active
                        ? "redeemed"
                        : ""
                        }`}
                    >

                      <div className="reward-icon">
                        <Gift
                          size={22}
                        />
                      </div>

                      <div className="reward-content">

                        <span className="reward-discount">
                          {
                            reward.discount
                          }
                        </span>

                        <h4>
                          {
                            reward.title
                          }
                        </h4>

                        <p>
                          {
                            reward.description
                          }
                        </p>

                        <div className="reward-footer">

                          <span className="reward-points">

                            <Star
                              size={14}
                            />

                            {
                              reward.points
                            }
                            {" "}poin

                          </span>

                          {reward.active ? (
                            <button
                              type="button"
                              className="reward-redeem-button"
                              disabled={
                                !canRedeem ||
                                redeemingReward
                              }
                              onClick={() =>
                                redeemReward(
                                  reward,
                                )
                              }
                            >

                              {canRedeem
                                ? redeemingReward
                                  ? "Memproses..."
                                  : "Tukar"
                                : `Kurang ${Math.max(
                                  0,
                                  reward.points -
                                  loyaltyPoints,
                                )} poin`}

                              {canRedeem &&
                                !redeemingReward && (
                                  <ArrowRight
                                    size={
                                      15
                                    }
                                  />
                                )}

                            </button>
                          ) : (
                            <span className="reward-redeemed">

                              <CheckCircle2
                                size={15}
                              />

                              Sudah ditukar

                            </span>
                          )}

                        </div>

                      </div>

                    </article>
                  );
                },
              )
            )}

          </div>

        </section>

        {/* =================================================
                   MAIN CONTENT
                ================================================= */}

        <div className="profile-main-grid">

          {/* ACCOUNT */}

          <section className="profile-card profile-account-card">

            <div className="section-heading">

              <div className="section-icon">
                <User
                  size={21}
                />
              </div>

              <div>
                <h3>
                  Informasi Akun
                </h3>

                <p>
                  Informasi dasar akun customer kamu.
                </p>
              </div>

            </div>

            <div className="profile-information-grid">

              <div className="profile-information-item">

                <div className="information-icon">
                  <User
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    Nama
                  </span>

                  <strong>
                    {user?.name ||
                      "Belum diisi"}
                  </strong>
                </div>

              </div>

              <div className="profile-information-item">

                <div className="information-icon">
                  <Mail
                    size={18}
                  />
                </div>

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {user?.email ||
                      "Belum diisi"}
                  </strong>
                </div>

              </div>

            </div>

            <button
              type="button"
              className="profile-outline-button"
              onClick={() => {
                setName(
                  user?.name ??
                  "",
                );

                setEmail(
                  user?.email ??
                  "",
                );

                setEditProfile(
                  true,
                );

                window.scrollTo(
                  {
                    top: 0,
                    behavior:
                      "smooth",
                  },
                );
              }}
            >
              <Edit3
                size={17}
              />

              Edit Informasi Akun
            </button>

          </section>

          {/* ORDERS */}

          <section className="profile-card profile-order-card">

            <div className="section-heading">

              <div className="section-icon">
                <ShoppingBag
                  size={21}
                />
              </div>

              <div>
                <h3>
                  Pesanan Saya
                </h3>

                <p>
                  Lihat dan pantau semua pesanan kamu.
                </p>
              </div>

            </div>

            <div className="order-highlight">

              <div className="order-highlight-icon">
                <ShoppingBag
                  size={23}
                />
              </div>

              <div>
                <strong>
                  Riwayat Pesanan
                </strong>

                <span>
                  Lihat pesanan yang sedang berjalan
                  dan pesanan sebelumnya.
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/orders",
                  )
                }
              >
                Lihat

                <ArrowRight
                  size={16}
                />
              </button>

            </div>

          </section>

        </div>

        {/* =================================================
                   ADDRESS
                ================================================= */}

        <section className="profile-card address-card">

          <div className="section-heading">

            <div className="section-icon">
              <MapPin
                size={21}
              />
            </div>

            <div>
              <h3>
                Alamat Pengiriman
              </h3>

              <p>
                Alamat yang digunakan untuk mengirim pesanan kamu.
              </p>
            </div>

          </div>

          {!showEditAddress ? (
            savedAddress ? (
              <div className="saved-address">

                <div className="saved-address-main">

                  <div className="saved-address-label">

                    <MapPin
                      size={16}
                    />

                    {savedAddress.label ||
                      "Alamat"}

                  </div>

                  {savedAddress.detail && (
                    <p className="saved-address-detail">
                      {
                        savedAddress.detail
                      }
                    </p>
                  )}

                  {(savedAddress.district ||
                    savedAddress.city) && (
                      <p className="saved-address-region">

                        {[
                          savedAddress.district,
                          savedAddress.city,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            ", ",
                          )}

                      </p>
                    )}

                  {(savedAddress.province ||
                    savedAddress.postalCode) && (
                      <p className="saved-address-province">

                        {[
                          savedAddress.province,
                          savedAddress.postalCode,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            " - ",
                          )}

                      </p>
                    )}

                  {savedAddress.note && (
                    <p className="saved-address-note">
                      Catatan kurir:
                      {" "}
                      {
                        savedAddress.note
                      }
                    </p>
                  )}

                </div>

                <button
                  type="button"
                  className="edit-address-button"
                  onClick={() => {
                    setAddress(
                      savedAddress,
                    );

                    setShowEditAddress(
                      true,
                    );
                  }}
                >
                  <Edit3
                    size={16}
                  />

                  Ubah Alamat
                </button>

              </div>
            ) : (
              <div className="empty-address">

                <div className="empty-address-icon">
                  <MapPin
                    size={25}
                  />
                </div>

                <div>
                  <strong>
                    Belum ada alamat
                  </strong>

                  <span>
                    Tambahkan alamat agar checkout lebih cepat.
                  </span>
                </div>

                <button
                  type="button"
                  className="add-address-btn"
                  onClick={() => {
                    setAddress(
                      {
                        ...emptyAddress,
                      },
                    );

                    setShowEditAddress(
                      true,
                    );
                  }}
                >
                  <Plus
                    size={17}
                  />

                  Tambah Alamat
                </button>

              </div>
            )
          ) : (
            <div className="address-form">

              <div className="address-form-heading">
                <div>
                  <h4>
                    {savedAddress
                      ? "Ubah Alamat"
                      : "Tambah Alamat"}
                  </h4>

                  <p>
                    Isi alamat lengkap untuk pengiriman pesanan.
                  </p>
                </div>
              </div>

              <div className="address-type">

                {[
                  "Rumah",
                  "Kantor",
                  "Kos",
                  "Lainnya",
                ].map(
                  item => (
                    <button
                      key={
                        item
                      }
                      type="button"
                      className={
                        address.label ===
                          item
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        updateAddress(
                          {
                            label:
                              item,
                          },
                        )
                      }
                    >
                      {
                        item
                      }
                    </button>
                  ),
                )}

              </div>

              <div className="address-form-grid">

                <div className="address-field full">

                  <label>
                    Alamat Lengkap
                  </label>

                  <textarea
                    placeholder="Contoh: Jl. Merdeka No. 10, RT 02/RW 03"
                    value={
                      address.detail
                    }
                    onChange={e =>
                      updateAddress(
                        {
                          detail:
                            e
                              .target
                              .value,
                        },
                      )
                    }
                  />

                </div>

                <div className="address-field">

                  <label>
                    Provinsi
                  </label>

                  <select
                    value={
                      address.provinceId
                    }
                    onChange={e =>
                      chooseProvince(
                        e
                          .target
                          .value,
                      )
                    }
                  >

                    <option value="">
                      Pilih Provinsi
                    </option>

                    {provinces.map(
                      item => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      ),
                    )}

                  </select>

                </div>

                <div className="address-field">

                  <label>
                    Kabupaten / Kota
                  </label>

                  <select
                    value={
                      address.cityId
                    }
                    onChange={e =>
                      chooseCity(
                        e
                          .target
                          .value,
                      )
                    }
                    disabled={
                      !address.provinceId
                    }
                  >

                    <option value="">
                      Pilih Kabupaten/Kota
                    </option>

                    {cities.map(
                      item => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      ),
                    )}

                  </select>

                </div>

                <div className="address-field">

                  <label>
                    Kecamatan
                  </label>

                  <select
                    value={
                      address.districtId
                    }
                    onChange={e =>
                      chooseDistrict(
                        e
                          .target
                          .value,
                      )
                    }
                    disabled={
                      !address.cityId
                    }
                  >

                    <option value="">
                      Pilih Kecamatan
                    </option>

                    {districts.map(
                      item => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      ),
                    )}

                  </select>

                </div>

                <div className="address-field">

                  <label>
                    Kode Pos
                  </label>

                  <input
                    inputMode="numeric"
                    placeholder="Contoh: 15111"
                    value={
                      address.postalCode
                    }
                    onChange={e =>
                      updateAddress(
                        {
                          postalCode:
                            e.target.value.replace(
                              /\D/g,
                              "",
                            ),
                        },
                      )
                    }
                  />

                </div>

                <div className="address-field full">

                  <label>
                    Catatan Kurir
                  </label>

                  <textarea
                    placeholder="Contoh: Rumah pagar hitam, sebelah minimarket."
                    value={
                      address.note
                    }
                    onChange={e =>
                      updateAddress(
                        {
                          note:
                            e
                              .target
                              .value,
                        },
                      )
                    }
                  />

                </div>

              </div>

              <div className="address-actions">

                <button
                  type="button"
                  className="profile-secondary-button"
                  onClick={() => {
                    setAddress(
                      savedAddress ??
                      {
                        ...emptyAddress,
                      },
                    );

                    setShowEditAddress(
                      false,
                    );
                  }}
                  disabled={
                    savingAddress
                  }
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="profile-primary-button"
                  onClick={
                    saveAddress
                  }
                  disabled={
                    savingAddress
                  }
                >

                  <CheckCircle2
                    size={17}
                  />

                  {savingAddress
                    ? "Menyimpan..."
                    : "Simpan Alamat"}

                </button>

              </div>

            </div>
          )}

        </section>

        {/* =================================================
                   SETTINGS
                ================================================= */}

        <section className="settings-section">

          <div className="settings-heading">

            <div>

              <div className="section-eyebrow">

                <Settings
                  size={16}
                />

                PENGATURAN AKUN

              </div>

              <h2>
                Pengaturan
              </h2>

              <p>
                Kelola keamanan, kontak,
                notifikasi, dan preferensi
                akun WartegKita kamu.
              </p>

            </div>

          </div>

          <div className="settings-card">

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                handleSettingClick(
                  "Akun & Keamanan",
                )
              }
            >
              <div className="setting-icon">
                <ShieldCheck
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Akun & Keamanan
                </strong>

                <span>
                  Kelola password dan keamanan akun
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                handleSettingClick(
                  "Email & Nomor HP",
                )
              }
            >
              <div className="setting-icon">
                <Mail
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Email & Nomor HP
                </strong>

                <span>
                  Kelola informasi kontak akun
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                handleSettingClick(
                  "Notifikasi",
                )
              }
            >
              <div className="setting-icon">
                <Bell
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Notifikasi
                </strong>

                <span>
                  Atur notifikasi pesanan dan promo
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                handleSettingClick(
                  "Alamat Pengiriman",
                )
              }
            >
              <div className="setting-icon">
                <MapPin
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Alamat Pengiriman
                </strong>

                <span>
                  Kelola alamat untuk checkout
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                document
                  .querySelector(
                    ".loyalty-section",
                  )
                  ?.scrollIntoView(
                    {
                      behavior:
                        "smooth",
                    },
                  )
              }
            >
              <div className="setting-icon">
                <Gift
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Poin & Reward
                </strong>

                <span>
                  Lihat misi dan tukarkan poin
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                handleSettingClick(
                  "Bantuan Customer",
                )
              }
            >
              <div className="setting-icon">
                <HelpCircle
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Bantuan
                </strong>

                <span>
                  Pusat bantuan WartegKita
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

            <button
              type="button"
              className="setting-item"
              onClick={() =>
                handleSettingClick(
                  "Privasi",
                )
              }
            >
              <div className="setting-icon">
                <LockKeyhole
                  size={19}
                />
              </div>

              <div className="setting-content">
                <strong>
                  Privasi
                </strong>

                <span>
                  Kelola preferensi dan privasi akun
                </span>
              </div>

              <ChevronRight
                size={19}
              />
            </button>

          </div>

        </section>

        {/* =================================================
                   QUICK INFO
                ================================================= */}

        <section className="profile-quick-info">

          <div>
            <CircleHelp
              size={17}
            />

            <span>
              Butuh bantuan dengan pesanan atau akun?
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              handleSettingClick(
                "Bantuan Customer",
              )
            }
          >
            Pusat Bantuan

            <ArrowRight
              size={15}
            />
          </button>

        </section>

        {/* =================================================
                   LOGOUT
                ================================================= */}

        <section className="profile-logout-section">

          <button
            type="button"
            className="profile-logout-button"
            onClick={
              logout
            }
          >
            <LogOut
              size={18}
            />

            Keluar dari Akun
          </button>

        </section>

      </div>

      {/* =====================================================
               REDEEM MODAL
            ===================================================== */}

      {selectedReward && (
        <div
          className="reward-modal-overlay"
          onClick={() => {
            if (
              !redeemingReward
            ) {
              setSelectedReward(
                null,
              );
            }
          }}
        >

          <div
            className="reward-modal"
            onClick={event =>
              event.stopPropagation()
            }
          >

            <div className="reward-modal-icon">
              <Gift
                size={28}
              />
            </div>

            <h3>
              Tukarkan Poin?
            </h3>

            <p>
              Kamu akan menggunakan{" "}
              <strong>
                {
                  selectedReward.points
                }{" "}
                poin
              </strong>{" "}
              untuk mendapatkan{" "}
              <strong>
                {
                  selectedReward.discount
                }
              </strong>
              .
            </p>

            <div className="reward-modal-summary">

              <span>
                Reward
              </span>

              <strong>
                {
                  selectedReward.title
                }
              </strong>

              <span>
                Poin digunakan
              </span>

              <strong>
                {
                  selectedReward.points
                }{" "}
                poin
              </strong>

            </div>

            <div className="reward-modal-actions">

              <button
                type="button"
                className="profile-secondary-button"
                onClick={() =>
                  setSelectedReward(
                    null,
                  )
                }
                disabled={
                  redeemingReward
                }
              >
                Batal
              </button>

              <button
                type="button"
                className="profile-primary-button"
                onClick={
                  confirmRedeemReward
                }
                disabled={
                  redeemingReward
                }
              >

                <Gift
                  size={17}
                />

                {redeemingReward
                  ? "Memproses..."
                  : "Tukarkan Poin"}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}