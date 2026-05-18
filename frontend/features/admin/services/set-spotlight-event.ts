import { API_ENDPOINTS } from "@/lib/api-config";
import { Event } from "@/features/events/types";

export async function setSpotlightEvent(eventId: number, spotlight: boolean): Promise<Event> {
    const url = `${API_ENDPOINTS.admin.events}/${eventId}/spotlight`;

    if (!url) {
        throw new Error("API endpoint for setting spotlight event is not defined.");
    }
    try {
        const response = await fetch(url, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ spotlight: spotlight }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to set spotlight event");
        }

        const eventData: Event = await response.json();
        return eventData;
    } catch (error) {
        console.error("Error setting spotlight event:", error);
        throw error;
    }
}
