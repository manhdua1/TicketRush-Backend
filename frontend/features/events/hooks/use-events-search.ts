"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import type { Category } from "@/features/events/types";
import {
  getEvents,
  type GetEventsRequest,
} from "@/features/events/services/get-events";

export const EVENTS_QUERY_KEY = ["events"] as const;
const EVENTS_SESSION_STORAGE_KEY = "ticketrush.events.search";

export type EventsViewMode = "grid" | "list";

export type EventsSearchState = {
  name: string;
  type?: Category;
  dstfrom: string;
  dstto: string;
  page: number;
  size: number;
  view: EventsViewMode;
};

const DEFAULT_GRID_SIZE = 9;
const DEFAULT_LIST_SIZE = 10;

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function parseViewMode(value: string | null): EventsViewMode {
  if (value === "list") return "list";
  return "grid";
}

function parseCategory(value: string | null): Category | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toUpperCase();
  const categories: ReadonlyArray<Category> = [
    "LIVE_MUSIC",
    "PERFORMING_ARTS",
    "SPORTS",
    "SEMINARS_AND_WORKSHOPS",
    "TOURS_AND_EXPERIENCES",
    "OTHER",
  ];

  return categories.includes(normalized as Category)
    ? (normalized as Category)
    : undefined;
}

function buildQueryString(state: EventsSearchState): string {
  const params = new URLSearchParams();

  if (state.name.trim()) params.set("name", state.name.trim());
  if (state.type) params.set("type", state.type);
  if (state.dstfrom.trim()) params.set("dstfrom", state.dstfrom.trim());
  if (state.dstto.trim()) params.set("dstto", state.dstto.trim());
  params.set("page", Math.max(1, state.page).toString());
  params.set("size", Math.max(1, state.size).toString());
  if (state.view !== "grid") params.set("view", state.view);

  return params.toString();
}

function readStoredSearch(): EventsSearchState | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(EVENTS_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<EventsSearchState>;

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      type: parseCategory(typeof parsed.type === "string" ? parsed.type : null),
      dstfrom: typeof parsed.dstfrom === "string" ? parsed.dstfrom : "",
      dstto: typeof parsed.dstto === "string" ? parsed.dstto : "",
      page: clampInt(
        typeof parsed.page === "number" ? parsed.page : 1,
        1,
        10_000,
      ),
      size: clampInt(
        typeof parsed.size === "number"
          ? parsed.size
          : DEFAULT_GRID_SIZE,
        1,
        50,
      ),
      view: parsed.view === "list" ? "list" : "grid",
    };
  } catch {
    return null;
  }
}

export function useEventsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasRestoredFromStorage = useRef(false);

  const state: EventsSearchState = useMemo(() => {
    const name = searchParams.get("name") ?? "";
    const type = parseCategory(searchParams.get("type"));
    const dstfrom = searchParams.get("dstfrom") ?? "";
    const dstto = searchParams.get("dstto") ?? "";

    const view = parseViewMode(searchParams.get("view"));
    const fallbackSize = view === "list" ? DEFAULT_LIST_SIZE : DEFAULT_GRID_SIZE;

    const sizeParam = searchParams.get("size");
    const size = clampInt(
      parseIntParam(sizeParam, fallbackSize),
      1,
      50,
    );
    const page = clampInt(parseIntParam(searchParams.get("page"), 1), 1, 10_000);

    return {
      name,
      type,
      dstfrom,
      dstto,
      page,
      size,
      view,
    };
  }, [searchParams]);

  const updateQuery = useCallback(
    (patch: Partial<EventsSearchState>, options?: { resetPage?: boolean }) => {
      const resetPage = options?.resetPage ?? false;
      const nextParams = new URLSearchParams(searchParams.toString());

      const nextState: EventsSearchState = {
        ...state,
        ...patch,
        page: resetPage ? 1 : patch.page ?? state.page,
      };

      const setOrDelete = (key: string, value: string | undefined) => {
        if (!value) nextParams.delete(key);
        else nextParams.set(key, value);
      };

      setOrDelete("name", nextState.name.trim() || undefined);
      setOrDelete("type", nextState.type);
      setOrDelete("dstfrom", nextState.dstfrom.trim() || undefined);
      setOrDelete("dstto", nextState.dstto.trim() || undefined);

      nextParams.set("page", Math.max(1, nextState.page).toString());
      nextParams.set("size", Math.max(1, nextState.size).toString());
      setOrDelete("view", nextState.view === "grid" ? undefined : nextState.view);

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams, state],
  );

  const request: GetEventsRequest = useMemo(
    () => ({
      name: state.name,
      type: state.type,
      dstfrom: state.dstfrom,
      dstto: state.dstto,
      page: state.page,
      size: state.size,
    }),
    [state],
  );

  const query = useQuery({
    queryKey: [...EVENTS_QUERY_KEY, request] as const,
    queryFn: async () => {
      const result = await getEvents(request);
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result.data!.result;
    },
  });

  useEffect(() => {
    if (pathname !== "/events" || hasRestoredFromStorage.current) {
      return;
    }

    hasRestoredFromStorage.current = true;

    if (searchParams.toString()) {
      return;
    }

    const stored = readStoredSearch();
    if (!stored) {
      return;
    }

    const nextQuery = buildQueryString(stored);
    if (!nextQuery) {
      return;
    }

    router.replace(`${pathname}?${nextQuery}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (pathname !== "/events" || typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      EVENTS_SESSION_STORAGE_KEY,
      JSON.stringify(state),
    );
  }, [pathname, state]);

  return {
    ...query,
    state,
    request,
    setName: (name: string) => updateQuery({ name }, { resetPage: true }),
    setType: (type?: Category) => updateQuery({ type }, { resetPage: true }),
    setDstFrom: (dstfrom: string) => updateQuery({ dstfrom }, { resetPage: true }),
    setDstTo: (dstto: string) => updateQuery({ dstto }, { resetPage: true }),
    setPage: (page: number) => updateQuery({ page }),
    setView: (view: EventsViewMode) =>
      updateQuery(
        {
          view,
          size: view === "list" ? DEFAULT_LIST_SIZE : DEFAULT_GRID_SIZE,
        },
        { resetPage: true },
      ),
    setSize: (size: number) => updateQuery({ size }, { resetPage: true }),
    clearFilters: () =>
      updateQuery(
        {
          name: "",
          type: undefined,
          dstfrom: "",
          dstto: "",
          page: 1,
          size: DEFAULT_GRID_SIZE,
          view: "grid",
        },
        { resetPage: false },
      ),
  };
}
