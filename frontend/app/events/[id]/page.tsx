import Footer from "@/components/shared/footer";
import NavBar from "@/components/shared/navbar";

import EventDetailScreen from "../../../features/events/components/event-detail-screen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="pt-24">
        <EventDetailScreen eventId={Number(id)} />
      </main>
      <Footer />
    </div>
  );
}
