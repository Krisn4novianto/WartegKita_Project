import api from "./api";

export interface Wilayah {
    id: number;
    name: string;
}

export async function getProvinces(): Promise<Wilayah[]> {
    try {
        const response = await api.get("/wilayah/provinces");
        return response.data;
    } catch (error) {
        console.error("Get Provinces Error:", error);
        return [];
    }
}

export async function getCities(
    provinceId: number
): Promise<Wilayah[]> {
    try {
        const response = await api.get(
            `/wilayah/cities/${provinceId}`
        );

        return response.data;
    } catch (error) {
        console.error("Get Cities Error:", error);
        return [];
    }
}

export async function getDistricts(
    cityId: number
): Promise<Wilayah[]> {
    try {
        const response = await api.get(
            `/wilayah/districts/${cityId}`
        );

        return response.data;
    } catch (error) {
        console.error("Get Districts Error:", error);
        return [];
    }
}