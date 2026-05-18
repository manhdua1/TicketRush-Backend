import Footer from "@/components/shared/footer";
import Hero from "@/components/homepage/hero";
import NavBar from "@/components/shared/navbar";
import TrendingEventsSection from "@/features/events/components/trending-events-section";
import CategorySection, {
  type CategoryEventsMap,
} from "@/features/events/components/category-section";
import { getTrendingEvents } from "@/features/events/services/get-trending-events";
import { getSpotlightEvent } from "@/features/events/services/get-spotlight-event";
import { getEvents } from "@/features/events/services/get-events";
import type { Category } from "@/features/events/types";

const CATEGORIES: Category[] = [
  "LIVE_MUSIC",
  "PERFORMING_ARTS",
  "SPORTS",
  "SEMINARS_AND_WORKSHOPS",
  "TOURS_AND_EXPERIENCES",
  "OTHER",
];

export default async function Home() {
  // Fetch everything in parallel
  const [spotlightRes, trendingRes, ...categoryResults] = await Promise.all([
    getSpotlightEvent(),
    getTrendingEvents(),
    ...CATEGORIES.map((type) =>
      getEvents({ type, page: 1, size: 5 }).then((res) =>
        res.ok && res.data ? res.data.result.content : [],
      ),
    ),
  ]);

  // Build category map
  const categoryEvents: CategoryEventsMap = {};
  CATEGORIES.forEach((cat, i) => {
    categoryEvents[cat] = categoryResults[i] as Awaited<typeof categoryResults[0]>;
  });

  // Spotlight: only use if it's a valid event with an id
  const spotlightEvent =
    spotlightRes.result && spotlightRes.result.id ? spotlightRes.result : null;

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="pt-20">
        {/* Spotlight hero or fallback */}
        <Hero spotlightEvent={spotlightEvent} />

        {/* Trending events slider */}
        <TrendingEventsSection events={trendingRes.result ?? []} />

        {/* Per-category sections */}
        <CategorySection categoryEvents={categoryEvents} />
      </main>
      <Footer />
    </div>
  );
}
