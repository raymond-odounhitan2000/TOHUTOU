"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getDisplayImageUrl } from "@/lib/images";
import type { Announcement } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import AnimatedButton from "@/components/ui/AnimatedButton";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { Plus, Package, ClipboardList, Trash2, ShoppingCart, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { text: string; variant: "success" | "warning" | "danger" | "default" }> = {
  pending: { text: "En attente", variant: "warning" },
  approved: { text: "Approuvee", variant: "success" },
  rejected: { text: "Refusee", variant: "danger" },
  sold: { text: "Vendue", variant: "default" },
};

export default function ProducerAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Announcement[]>("/announcements/my")
      .then((r) => setAnnouncements(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkSold = async (id: number) => {
    await api.put(`/announcements/${id}/sold`);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "sold" } : a))
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await api.delete(`/announcements/${id}`);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mes annonces</h2>
        <Link href="/dashboard/producer/announcements/new">
          <AnimatedButton variant="primary" className="text-sm">
            <Plus className="w-4 h-4" />
            Nouvelle annonce
          </AnimatedButton>
        </Link>
      </div>

      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Aucune annonce"
          description="Aucune annonce pour le moment"
          action={
            <Link
              href="/dashboard/producer/announcements/new"
              className="text-green-700 font-medium text-sm hover:underline"
            >
              Creer votre premiere annonce
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {announcements.map((a) => {
              const status = statusConfig[a.status] || statusConfig.pending;
              const displayImageUrl = getDisplayImageUrl(a.photo_url);
              return (
                <motion.div
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, x: -30, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {displayImageUrl ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={displayImageUrl}
                            alt={a.variety}
                            fill
                            sizes="80px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-green-700" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">{a.variety}</h3>
                          <AnimatedBadge variant={status.variant}>
                            {status.text}
                          </AnimatedBadge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {Number(a.quantity)} kg &middot;{" "}
                          <span className="font-medium text-gray-700">{Number(a.price).toLocaleString()} FCFA</span>
                          {" "}&middot; {a.maturity}
                        </p>
                        {a.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Motif : {a.rejection_reason}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(a.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.status === "approved" && (
                        <AnimatedButton
                          variant="ghost"
                          onClick={() => handleMarkSold(a.id)}
                          className="text-xs px-3 py-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Marquer vendue
                        </AnimatedButton>
                      )}
                      <AnimatedButton
                        variant="danger"
                        onClick={() => handleDelete(a.id)}
                        className="text-xs px-3 py-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </AnimatedButton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </PageTransition>
  );
}
