import { API_ENDPOINTS } from "@/lib/api-config";

export type TotalRevenueResponse = {
    code: number;
    message: string;
    result: number;
};

export async function getTotalRevenue(): Promise<TotalRevenueResponse> {
    const url = API_ENDPOINTS.admin.totalRevenue;

    if (!url) {
        throw new Error('API endpoint for total revenue is not defined');
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
            throw new Error(errorData.message || 'Failed to fetch total revenue');
        }
        const data: TotalRevenueResponse = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching total revenue:', error);
        throw error;
    }
}
