"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";
import { getDisplayImageUrl } from "@/lib/images";
import { useOrg } from "@/lib/org-context";
import type { Announcement } from "@/types";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import AnimatedButton from "@/components/ui/AnimatedButton";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import FadeIn from "@/components/motion/FadeIn";
import { ClipboardList, Plus, Trash2, Sparkles } from "lucide-react";

export default function OrgProducerAnnouncementsPage() {
  const { org } = useOrg();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Announcement[]>("/announcements/my")
      .then((r) => setAnnouncements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!org) return null;

  const base = `/org/${org.slug}/dashboard`;

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    approved: "Approuvee",
    rejected: "Rejetee",
    sold: "Vendue",
  };

  const statusVariant: Record<string, "warning" | "success" | "danger" | "info"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    sold: "info",
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div
            className="h-7 w-40 rounded-lg"
            style={{
              background:
                "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
          <div
            className="h-10 w-28 rounded-xl"
            style={{
              background:
                "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <Skeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <div>
      <FadeIn>
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/85 p-5 shadow-lg shadow-emerald-900/5 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className="mb-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]"
              style={{ borderColor: `${org.primary_color}55`, color: org.primary_color }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Espace producteur
            </p>
            <h2 className="text-2xl font-bold text-gray-900">Mes annonces</h2>
          </div>
          <Link href={`${base}/producer/announcements/new`}>
            <AnimatedButton color={org.primary_color}>
              <Plus className="w-4 h-4" />
              Nouvelle annonce
            </AnimatedButton>
          </Link>
        </div>
      </FadeIn>

      {announcements.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune annonce"
          description="Vous n'avez pas encore d'annonces"
          color={org.primary_color}
          action={
            <Link
              href={`${base}/producer/announcements/new`}
              className="font-medium hover:underline text-sm"
              style={{ color: org.primary_color }}
            >
              Creer ma premiere annonce
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {announcements.map((a) => {
              const displayImageUrl = getDisplayImageUrl(a.photo_url);
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:shadow-md transition-shadow"
                >
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
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{a.variety}</p>
                      <AnimatedBadge variant={statusVariant[a.status]}>
                        {statusLabel[a.status]}
                      </AnimatedBadge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {Number(a.quantity)} kg &middot; {a.maturity}
                    </p>
                    {a.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        Motif : {a.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className="text-lg font-bold whitespace-nowrap"
                      style={{ color: org.primary_color }}
                    >
                      {Number(a.price).toLocaleString()} FCFA
                    </p>
                    <AnimatedButton
                      variant="danger"
                      onClick={() => handleDelete(a.id)}
                      className="!px-3 !py-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AnimatedButton>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
