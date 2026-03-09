"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import type { Organization } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const redirectByRole = async () => {
      if (loading) return;
      if (!user) {
        router.replace("/login");
        return;
      }

      switch (user.role) {
        case "admin":
          if (user.organization_id) {
            try {
              const response = await api.get<Organization>(
                `/organizations/${user.organization_id}`
              );
              if (active) {
                router.replace(`/org/${response.data.slug}/dashboard`);
              }
            } catch {
              if (active) {
                router.replace("/announcements");
              }
            }
            return;
          }
          router.replace("/dashboard/admin");
          return;
        case "delegate":
          router.replace("/dashboard/delegate");
          return;
        case "producer":
          router.replace("/dashboard/producer/announcements");
          return;
        case "buyer":
          router.replace("/announcements");
          return;
      }
    };

    redirectByRole();

    return () => {
      active = false;
    };
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirection...</p>
    </div>
  );
}
