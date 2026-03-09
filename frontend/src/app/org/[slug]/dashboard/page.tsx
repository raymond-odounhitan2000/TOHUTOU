"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { useEffect } from "react";

export default function OrgDashboardRedirect() {
  const { user } = useAuth();
  const { org } = useOrg();
  const router = useRouter();

  useEffect(() => {
    if (!user || !org) return;
    const base = `/org/${org.slug}/dashboard`;
    if (user.role === "producer") router.replace(`${base}/producer/announcements`);
    else if (user.role === "delegate") router.replace(`${base}/delegate`);
    else router.replace(`${base}/overview`);
  }, [user, org, router]);

  return null;
}
