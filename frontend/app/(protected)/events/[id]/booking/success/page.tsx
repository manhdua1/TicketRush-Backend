import { Suspense } from "react";
import PaymentSuccessScreen from "@/features/booking/components/payment-success-screen";

interface SearchParams {
  event?: string;
  date?: string;
  total?: string;
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0E0E15]" />}>
      <PaymentSuccessScreen
        eventName={params.event || "Không xác định"}
        eventDate={params.date || "Không xác định"}
        totalAmount={parseInt(params.total || "0", 10)}
      />
    </Suspense>
  );
}