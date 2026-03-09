"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { useEffect } from "react";

export default function OrgHomePage() {
  const { user, loading } = useAuth();
  const { org } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (loading || !org) return;
    if (user) {
      router.replace(`/org/${org.slug}/dashboard`);
    } else {
      router.replace(`/org/${org.slug}/login`);
    }
  }, [user, loading, org, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="animate-spin h-8 w-8 text-green-700" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
