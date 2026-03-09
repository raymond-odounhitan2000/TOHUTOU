"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function OrgDelegatePage() {
  const { org } = useOrg();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    api
      .get<Announcement[]>("/announcements/pending")
      .then((r) => setAnnouncements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!org) return null;

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/announcements/${id}/status`, { status: "approved" });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason.trim()) return;
    try {
      await api.put(`/announcements/${id}/status`, {
        status: "rejected",
        rejection_reason: rejectionReason.trim(),
      });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setRejecting(null);
      setRejectionReason("");
    } catch {}
  };

  const pendingCount = announcements.length;

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="h-7 w-56 rounded-lg"
            style={{
              background:
                "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <Skeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div>
      <FadeIn>
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-white/50 bg-white/85 px-5 py-4 shadow-lg shadow-emerald-900/5 backdrop-blur-sm">
          <p
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{ borderColor: `${org.primary_color}55`, color: org.primary_color }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Espace validation
          </p>
          <h2 className="text-2xl font-bold text-gray-900">
            Validation des annonces
          </h2>
          {pendingCount > 0 && (
            <AnimatedBadge color={org.primary_color}>
              {pendingCount}
            </AnimatedBadge>
          )}
        </div>
      </FadeIn>

      {announcements.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Tout est en ordre"
          description="Aucune annonce en attente de validation"
          color={org.primary_color}
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {announcements.map((a) => {
              const displayImageUrl = getDisplayImageUrl(a.photo_url);
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.3 },
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4 flex flex-col sm:flex-row gap-4">
                    {displayImageUrl && (
                      <div className="relative h-24 w-full sm:w-24 overflow-hidden rounded-xl">
                        <Image
                          src={displayImageUrl}
                          alt={a.variety}
                          fill
                          sizes="(max-width: 640px) 100vw, 96px"
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-lg">
                          {a.variety}
                        </p>
                        <AnimatedBadge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </AnimatedBadge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {Number(a.quantity)} kg &middot; {a.maturity} &middot;{" "}
                        <span
                          className="font-semibold"
                          style={{ color: org.primary_color }}
                        >
                          {Number(a.price).toLocaleString()} FCFA
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2">
                      <AnimatedButton
                        onClick={() => handleApprove(a.id)}
                        color={org.primary_color}
                        className="flex-1 sm:flex-none"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approuver
                      </AnimatedButton>
                      <AnimatedButton
                        variant="danger"
                        onClick={() =>
                          setRejecting(rejecting === a.id ? null : a.id)
                        }
                        className="flex-1 sm:flex-none"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                      </AnimatedButton>
                    </div>
                  </div>

                  <AnimatePresence>
                    {rejecting === a.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motif du rejet
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                            rows={2}
                            placeholder="Indiquez le motif..."
                            style={
                              {
                                "--tw-ring-color": org.primary_color,
                              } as React.CSSProperties
                            }
                          />
                          <div className="flex gap-2 mt-2">
                            <AnimatedButton
                              variant="danger"
                              onClick={() => handleReject(a.id)}
                              disabled={!rejectionReason.trim()}
                            >
                              Confirmer le rejet
                            </AnimatedButton>
                            <AnimatedButton
                              variant="ghost"
                              onClick={() => {
                                setRejecting(null);
                                setRejectionReason("");
                              }}
                            >
                              Annuler
                            </AnimatedButton>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
