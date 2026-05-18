import NavBar from "@/components/shared/navbar";
import ProfileDashboard from "@/features/user/components/profile-dashboard";

export default function ProfilePage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ProfileDashboard />
        </div>
      </main>
    </div>
  );
}
