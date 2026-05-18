import NavBar from "@/components/shared/navbar";
import MyTicketsDashboard from "@/features/user/components/my-tickets-dashboard";

export default function ProfileTicketsPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MyTicketsDashboard />
        </div>
      </main>
    </div>
  );
}
