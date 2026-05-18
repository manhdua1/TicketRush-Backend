import AdminEventDetail from "@/features/admin/components/events/admin-event-detail";

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEventDetail eventId={Number(id)} />;
}

