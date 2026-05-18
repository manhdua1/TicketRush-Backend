import { API_ENDPOINTS } from "@/lib/api-config";

export type Gender = "MALE" | "FEMALE" | "OTHER" | string;
export type AgeGroup = "UNDER_18" | "18_24" | "25_34" | "35_44" | "45_PLUS" | string;

type GenderStat = {
    gender: Gender;
    count: number;
    percentage: number; // 0..100
};

type AgeGroupStat = {
    ageGroup: AgeGroup;
    count: number;
    percentage: number; // 0..100
};

export type AudienceStats = {
    eventId: number | string;
    totalBuyers: number;
    genderStats: GenderStat[];
    ageGroupStats: AgeGroupStat[];
};

export type GetEventAudiencesResponse = {
    code: number;
    message: string;
    result?: AudienceStats;
    results?: AudienceStats;
    data?: AudienceStats;
};

function readMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") return null;
    if (!("message" in payload)) return null;
    const msg = (payload as { message?: unknown }).message;
    return typeof msg === "string" ? msg : null;
}

function unwrapAudience(payload: unknown): AudienceStats {
    if (!payload || typeof payload !== "object") {
        throw new Error("Dữ liệu thống kê khán giả không hợp lệ");
    }

    const record = payload as Record<string, unknown>;
    const result = (record.result ?? record.results ?? record.data ?? null) as unknown;

    if (result && typeof result === "object") {
        return result as AudienceStats;
    }

    return record as unknown as AudienceStats;
}

export const getEventAudiences = async (eventId: number | string): Promise<AudienceStats> => {
    const url = `${API_ENDPOINTS.admin.events}/${eventId}/audience`;

    if (!url) {
        throw new Error("Chưa cấu hình API để lấy thống kê khán giả");
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
            },
        });
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(readMessage(payload) || "Không thể tải thống kê khán giả");
        }

        return unwrapAudience(payload);
    } catch (error) {
        console.error("Error fetching event audiences:", error);
        throw error;
    }
};
