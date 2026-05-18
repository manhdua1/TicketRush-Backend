import { API_ENDPOINTS } from '@/lib/api-config';

type EventStats = {
    eventId: number;
    eventTitle: string;
    venue: string;
    startTime: string;
    endTime: string;
    posterUrl: string;
    totalTickets: number;
    soldTickets: number;
    lockedTickets: number;
    remainingTickets: number;
    remainingRates: number;
}

export type OnSaleLowTicketsResponse = {
    code: number;
    message: string;
    results: EventStats[];
}

function readMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") return null;
    if (!("message" in payload)) return null;
    const msg = (payload as { message?: unknown }).message;
    return typeof msg === "string" ? msg : null;
}

export async function getOnSaleLowTickets(): Promise<OnSaleLowTicketsResponse> {
    const url = API_ENDPOINTS.admin.onSaleLowTickets;

    if (!url) {
        throw new Error('API endpoint for on-sale low tickets is not defined');
    }

    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const payload: unknown = await res.json();

        if (!res.ok) {
            throw new Error(readMessage(payload) || 'Failed to fetch on-sale low tickets');
        }

        // Some backends may respond with `result` instead of `results`.
        if (payload && typeof payload === "object") {
            const record = payload as Record<string, unknown>;
            if (!("results" in record) && "result" in record) {
                record.results = record.result;
            }
            if (!Array.isArray(record.results)) {
                record.results = [];
            }
            return record as unknown as OnSaleLowTicketsResponse;
        }

        throw new Error("Invalid on-sale low tickets payload");
    } catch (error) {
        console.error('Error fetching on-sale low tickets:', error);
        throw error;
    }
}


