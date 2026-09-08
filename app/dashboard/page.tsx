import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";

function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Dashboard />
    </Suspense>
  );
}