"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 0,
          staleTime: 30_000,
          gcTime: 10 * 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });

    // debug browser only
    if (typeof window !== "undefined") {
      // @ts-expect-error debug helper on window
      window.rq = browserQueryClient;
    }
  }

  return browserQueryClient;
}

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}