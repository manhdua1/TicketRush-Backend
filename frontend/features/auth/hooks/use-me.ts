"use client";

import { useQuery } from "@tanstack/react-query";

import { getMe, type Me } from "@/features/auth/services/me";

export const ME_QUERY_KEY = ["me"] as const;

export function useMe() {
  return useQuery<Me | null>({
    queryKey: ME_QUERY_KEY,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const result = await getMe();

      if (!result.ok) {
        return null;
      }

      return result.result;
    },
  });
}
