import { API_ENDPOINTS } from "@/lib/api-config";

export type TotalEventsOnSaleResponse = {
    code: number;
    message: string;
    result: number;
}

export async function getTotalEventsOnSale(): Promise<TotalEventsOnSaleResponse> {
    const url = API_ENDPOINTS.admin.totalEventsOnSale;

    if (!url) {
        throw new Error('API endpoint for total events on sale is not defined');
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
            throw new Error(errorData.message || 'Failed to fetch total events on sale');
        }
        const data: TotalEventsOnSaleResponse = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching total events on sale:', error);
        throw error;
    }
}
