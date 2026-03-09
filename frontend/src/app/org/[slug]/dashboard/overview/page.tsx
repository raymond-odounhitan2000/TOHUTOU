"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { getDisplayImageUrl } from "@/lib/images";
import { useOrg } from "@/lib/org-context";
import type { Announcement } from "@/types";
import PageTransition from "@/components/motion/PageTransition";
import StatCard from "@/components/ui/StatCard";
import StaggerContainer from "@/components/motion/StaggerContainer";
import StaggerItem from "@/components/motion/StaggerItem";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import FadeIn from "@/components/motion/FadeIn";
import {
  Users,
  Building2,
  ClipboardList,
  CheckCircle,
  Clock,
  Package,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

interface OrgStats {
  total_members: number;
  total_cooperatives: number;
  total_announcements: number;
  approved_announcements: number;
  pending_announcements: number;
}

export default function OrgOverviewPage() {
  const { org } = useOrg();
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    Promise.all([
      api.get<OrgStats>(`/stats/organization/${org.id}`),
      api.get<{ items: Announcement[] }>(
        `/announcements?organization_id=${org.id}&size=5`
      ),
    ])
      .then(([statsRes, annRes]) => {
        setStats(statsRes.data);
        setAnnouncements(annRes.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org]);

  if (!org) return null;

  if (loading) {
    return (
      <PageTransition>
        <div className="mb-6">
          <div
            className="h-7 w-48 rounded-lg mb-2"
            style={{
              background:
                "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
          <div
            className="h-4 w-72 rounded-lg"
            style={{
              background:
                "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <Skeleton variant="stat" count={5} />
        <div className="mt-8">
          <Skeleton variant="card" count={3} />
        </div>
      </PageTransition>
    );
  }

  const statCards = stats
    ? [
        {
          label: "Membres",
          value: stats.total_members,
          icon: Users,
        },
        {
          label: "Cooperatives",
          value: stats.total_cooperatives,
          icon: Building2,
        },
        {
          label: "Annonces",
          value: stats.total_announcements,
          icon: ClipboardList,
        },
        {
          label: "Approuvees",
          value: stats.approved_announcements,
          icon: CheckCircle,
        },
        {
          label: "En attente",
          value: stats.pending_announcements,
          icon: Clock,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-sm md:p-8">
          <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-lime-200/35 blur-3xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p
                className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ borderColor: `${org.primary_color}55`, color: org.primary_color }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tableau organisation
              </p>
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{org.name}</h2>
              {org.description && (
                <p className="mt-2 text-sm text-slate-600 line-clamp-2 md:text-base">
                  {org.description}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                <p className="text-slate-500">Annonces actives</p>
                <p className="mt-1 text-lg font-semibold text-emerald-700">
                  {stats?.approved_announcements ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                <p className="text-slate-500">Validation</p>
                <p className="mt-1 text-lg font-semibold text-amber-700">
                  {stats?.pending_announcements ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {statCards.map((card, index) => (
          <StaggerItem key={card.label}>
            <StatCard
              label={card.label}
              value={card.value}
              icon={card.icon}
              color={org.primary_color}
              delay={index * 0.05}
            />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.3}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Annonces recentes
          </h3>
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Vue temps reel
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </FadeIn>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucune annonce"
          description="Aucune annonce pour le moment"
          color={org.primary_color}
        />
      ) : (
        <StaggerContainer staggerDelay={0.1} className="space-y-3">
          {announcements.map((a) => {
            const displayImageUrl = getDisplayImageUrl(a.photo_url);
            return (
              <StaggerItem key={a.id}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow">
                  {displayImageUrl && (
                    <div className="relative h-20 w-full sm:w-20 overflow-hidden rounded-xl">
                      <Image
                        src={displayImageUrl}
                        alt={a.variety}
                        fill
                        sizes="(max-width: 640px) 100vw, 80px"
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{a.variety}</p>
                    <p className="text-sm text-gray-500">
                      {Number(a.quantity)} kg &middot; {a.maturity}
                    </p>
                  </div>
                  <p
                    className="text-lg font-bold whitespace-nowrap"
                    style={{ color: org.primary_color }}
                  >
                    {Number(a.price).toLocaleString()} FCFA
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}
