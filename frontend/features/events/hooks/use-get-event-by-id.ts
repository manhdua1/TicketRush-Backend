import { useEffect, useState } from "react";
import { getEventById } from "../services/get-event-by-id";
import type { Event } from "../types";

export function useGetEventById(id: number) {
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!Number.isFinite(id) || id <= 0) {
			return;
		}

		let mounted = true;

		(async () => {
			setLoading(true);
			setError(null);
			const res = await getEventById(id);
			if (!mounted) return;
			if (!res.ok || !res.data) {
				setError(res.message || "Không thể tải sự kiện");
				setEvent(null);
			} else {
				setEvent(res.data.result);
			}
			setLoading(false);
		})();

		return () => {
			mounted = false;
		};
	}, [id]);

	return { event, loading, error } as const;
}
