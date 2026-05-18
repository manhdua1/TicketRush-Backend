import { useEffect, useState, useMemo } from "react";
import { getEvents } from "../services/get-events";
import type { Event, Category } from "../types";

export function useRelatedEvents(currentEventId: number, eventType: Category | undefined) {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRelatedEvents = async () => {
      if (!eventType) {
        setAllEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const response = await getEvents({ type: eventType, page: 1, size: 6 });

      if (!response.ok || !response.data?.result) {
        setError(response.message || "Không thể tải các sự kiện liên quan");
        setAllEvents([]);
        setLoading(false);
        return;
      }

      const filtered = response.data.result.content
        .filter((event) => event.id !== currentEventId)
        .slice(0, 6);

      setAllEvents(filtered);
      setCurrentPage(1);
      setLoading(false);
    };

    fetchRelatedEvents();
  }, [currentEventId, eventType]);

  // Group events into pages (3 events per page)
  const pages = useMemo(() => {
    const pageSize = 3;
    const result: Event[][] = [];
    for (let i = 0; i < allEvents.length; i += pageSize) {
      result.push(allEvents.slice(i, i + pageSize));
    }
    return result;
  }, [allEvents]);

  const currentEvents = pages[currentPage - 1] || [];
  const totalPages = pages.length;
  const isFirst = currentPage === 1;
  const isLast = totalPages === 0 || currentPage >= totalPages;

  const goToNextPage = () => {
    if (!isLast) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (!isFirst) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return {
    events: currentEvents,
    totalPages,
    currentPage,
    isFirst,
    isLast,
    loading,
    error,
    goToNextPage,
    goToPrevPage,
  };
}
