import { Suspense } from "react";

import EventsDiscoveryScreen from "../../features/events/components/events-discovery-screen";

export default function Page() {
  return (
    <div className="min-h-dvh">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
            <div className="h-10 w-56 skeleton rounded-full" />
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-3xl border border-border bg-surface/35"
                >
                  <div className="aspect-video w-full skeleton" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-4/5 skeleton rounded-full" />
                    <div className="h-3 w-3/5 skeleton rounded-full" />
                    <div className="h-3 w-2/3 skeleton rounded-full" />
                    <div className="h-4 w-2/5 skeleton rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <EventsDiscoveryScreen />
      </Suspense>
    </div>
  );
}
