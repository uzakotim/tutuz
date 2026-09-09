"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Decorative blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -left-20 h-[350px] w-[350px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #4F46E5 0%, #7C3AED 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -right-20 h-[300px] w-[300px] rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #FBBF24 0%, #F59E0B 100%)" }}
      />
      <AuthForm />
    </div>
  );
}
