"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Skeleton from "@/components/ui/Skeleton";
import StatCard from "@/components/ui/StatCard";
import StaggerContainer from "@/components/motion/StaggerContainer";
import StaggerItem from "@/components/motion/StaggerItem";
import PageTransition from "@/components/motion/PageTransition";
import { Users, Building2, UsersRound, ClipboardList, Clock } from "lucide-react";

interface AdminStats {
  total_users: number;
  total_organizations: number;
  total_cooperatives: number;
  total_announcements: number;
  pending_membership_requests: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.get<AdminStats>("/stats/admin").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <PageTransition>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
        <Skeleton variant="stat" count={5} />
      </PageTransition>
    );
  }

  const cards = [
    { label: "Utilisateurs", value: stats.total_users, icon: Users, color: "#15803d" },
    { label: "Organisations", value: stats.total_organizations, icon: Building2, color: "#2563eb" },
    { label: "Cooperatives", value: stats.total_cooperatives, icon: UsersRound, color: "#9333ea" },
    { label: "Annonces", value: stats.total_announcements, icon: ClipboardList, color: "#d97706" },
    { label: "Demandes en attente", value: stats.pending_membership_requests, icon: Clock, color: "#ef4444" },
  ];

  return (
    <PageTransition>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {cards.map((c) => (
          <StaggerItem key={c.label}>
            <StatCard
              label={c.label}
              value={c.value}
              icon={c.icon}
              color={c.color}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageTransition>
  );
}
