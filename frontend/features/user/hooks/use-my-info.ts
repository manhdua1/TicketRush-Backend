"use client";

import { useQuery } from "@tanstack/react-query";

import { getMyInfo, type Info } from "@/features/user/services/get-my-info";

export const MY_INFO_QUERY_KEY = ["my-info"] as const;

export function useMyInfo() {
  return useQuery<Info | null>({
    queryKey: MY_INFO_QUERY_KEY,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const result = await getMyInfo();

      if (!result.ok) {
        throw new Error(result.message);
      }

      return result.data!.result;
    },
  });
}
