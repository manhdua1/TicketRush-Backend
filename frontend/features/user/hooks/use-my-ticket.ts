"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { getMyTicket, type TicketInfo } from "@/features/user/services/get-my-ticket";

export const MY_TICKETS_QUERY_KEY = ["my-tickets"] as const;

export type TicketCategoryFilter = "ALL" | "UPCOMING" | "ENDED" | "CANCELLED";

export type TicketSortKey = "EVENT_DATE" | "PURCHASE_DATE" | "PRICE";

function isTicketEnded(ticket: TicketInfo, now: Date): boolean {
  const end = new Date(ticket.endTime);
  if (!Number.isNaN(end.getTime())) return end.getTime() < now.getTime();

  const start = new Date(ticket.startTime);
  if (!Number.isNaN(start.getTime())) return start.getTime() < now.getTime();

  return false;
}

function isTicketCancelled(status: string): boolean {
  const normalized = status.trim().toUpperCase();
  return ["CANCELLED", "CANCELED", "FAILED"].includes(normalized);
}

function compareNumbersDesc(a: number, b: number): number {
  return b - a;
}

function compareDates(aIso: string, bIso: string): number {
  const aTime = new Date(aIso).getTime();
  const bTime = new Date(bIso).getTime();
  if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
  return aTime - bTime;
}

export function useMyTickets() {
  const [categoryFilter, setCategoryFilter] = useState<TicketCategoryFilter>("ALL");
  const [sortKey, setSortKey] = useState<TicketSortKey>("EVENT_DATE");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const query = useQuery<TicketInfo[]>({
    queryKey: MY_TICKETS_QUERY_KEY,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const result = await getMyTicket();
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result.data?.result ?? [];
    },
  });

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    const now = new Date();
    const query_lower = searchQuery.toLowerCase().trim();

    const categoryItems = items.filter((ticket) => {
      const cancelled = isTicketCancelled(ticket.status);
      
      // Filter by category
      if (categoryFilter === "CANCELLED") {
        if (!cancelled) return false;
      } else if (categoryFilter === "ENDED") {
        if (cancelled || !isTicketEnded(ticket, now)) return false;
      } else if (categoryFilter === "UPCOMING") {
        if (cancelled || isTicketEnded(ticket, now)) return false;
      }
      // categoryFilter === "ALL" includes everything (including cancelled)
      
      // Filter by search query
      if (query_lower) {
        const searchable = [
          ticket.eventTitle,
          ticket.venue,
          ticket.zoneName,
          ticket.seatLabel,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(query_lower)) return false;
      }

      return true;
    });

    const sorted = [...categoryItems].sort((a, b) => {
      if (sortKey === "PRICE") {
        return compareNumbersDesc(a.price, b.price);
      }

      if (sortKey === "PURCHASE_DATE") {
        return compareDates(b.issuedAt, a.issuedAt);
      }

      const byEvent = compareDates(a.startTime, b.startTime);
      if (categoryFilter === "UPCOMING") return byEvent;
      return -byEvent;
    });

    return sorted;
  }, [categoryFilter, query.data, sortKey, searchQuery]);

  const visibleTickets = useMemo(
    () => filtered.slice(0, Math.max(0, visibleCount)),
    [filtered, visibleCount],
  );

  const hasMore = visibleTickets.length < filtered.length;

  function loadMore() {
    setVisibleCount((count) => Math.min(count + 6, filtered.length));
  }

  function resetVisible() {
    setVisibleCount(6);
  }

  return {
    ...query,
    categoryFilter,
    setCategoryFilter: (next: TicketCategoryFilter) => {
      setCategoryFilter(next);
      resetVisible();
    },
    sortKey,
    setSortKey: (next: TicketSortKey) => {
      setSortKey(next);
      resetVisible();
    },
    searchQuery,
    setSearchQuery: (next: string) => {
      setSearchQuery(next);
      resetVisible();
    },
    tickets: visibleTickets,
    totalCount: filtered.length,
    hasMore,
    loadMore,
  };
}
