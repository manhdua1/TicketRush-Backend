import { API_ENDPOINTS } from "@/lib/api-config";

type Point = {
    label: string;
    startTime: string;
    endTime: string;
    revenue: number;
};

export type RevenueTrendResponse = {
    code: number;
    message: string;
    result: {
        period: string;
        totalRevenue: number;
        points: Point[];
    }
};

export async function getRevenueTrend(period: "DAY" | "WEEK" | "MONTH"): Promise<RevenueTrendResponse> {
    const url = `${API_ENDPOINTS.admin.revenueTrend}?period=${period}`;

    if (!url) {
        throw new Error('API endpoint for revenue trend is not defined');
    }

    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to fetch revenue trend');
        }
        const data: RevenueTrendResponse = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        throw error;
    }
}



