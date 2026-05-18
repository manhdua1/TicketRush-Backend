import NavBar from "@/components/shared/navbar";
import ChangePasswordDashboard from "@/features/user/components/change-password-dashboard";

export default function ProfileChangePasswordPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main className="pt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ChangePasswordDashboard />
        </div>
      </main>
    </div>
  );
}
