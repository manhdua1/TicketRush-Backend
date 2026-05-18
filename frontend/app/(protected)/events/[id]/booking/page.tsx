import SeatSelectionScreen from "@/features/booking/components/seat-selection-screen";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SeatSelectionScreen eventId={Number(id)} />;
}
