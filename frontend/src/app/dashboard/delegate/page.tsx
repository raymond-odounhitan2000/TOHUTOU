"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { Announcement } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import AnimatedButton from "@/components/ui/AnimatedButton";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { CheckCircle, XCircle, Package, AlertCircle } from "lucide-react";

export default function DelegatePage() {
  const [pending, setPending] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionId, setRejectionId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [exitDirection, setExitDirection] = useState<Record<number, "approve" | "reject">>({});

  useEffect(() => {
    api
      .get<Announcement[]>("/announcements/pending")
      .then((r) => setPending(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: number) => {
    setExitDirection((prev) => ({ ...prev, [id]: "approve" }));
    await api.put(`/announcements/${id}/status`, { status: "approved" });
    setPending((prev) => prev.filter((a) => a.id !== id));
  };

  const handleReject = async (id: number) => {
    setExitDirection((prev) => ({ ...prev, [id]: "reject" }));
    await api.put(`/announcements/${id}/status`, {
      status: "rejected",
      rejection_reason: rejectionReason,
    });
    setPending((prev) => prev.filter((a) => a.id !== id));
    setRejectionId(null);
    setRejectionReason("");
  };

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Validation des annonces</h2>
        {pending.length > 0 && (
          <AnimatedBadge variant="warning">
            {pending.length} en attente
          </AnimatedBadge>
        )}
      </div>

      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : pending.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Tout est a jour"
          description="Aucune annonce en attente de validation"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {pending.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  x: exitDirection[a.id] === "approve" ? 50 : exitDirection[a.id] === "reject" ? -50 : 0,
                  transition: { duration: 0.3 },
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{a.variety}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {Number(a.quantity)} kg &middot;{" "}
                        <span className="font-medium text-gray-700">{Number(a.price).toLocaleString()} FCFA</span>
                        {" "}&middot; {a.maturity}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Soumise le {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <AnimatedButton
                      variant="primary"
                      onClick={() => handleApprove(a.id)}
                      className="text-sm px-4 py-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approuver
                    </AnimatedButton>
                    <AnimatedButton
                      variant="danger"
                      onClick={() => setRejectionId(rejectionId === a.id ? null : a.id)}
                      className="text-sm px-4 py-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser
                    </AnimatedButton>
                  </div>
                </div>

                <AnimatePresence>
                  {rejectionId === a.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <input
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Motif du refus (optionnel)"
                            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors"
                          />
                        </div>
                        <div className="flex gap-2">
                          <AnimatedButton
                            variant="danger"
                            onClick={() => handleReject(a.id)}
                            className="text-sm"
                          >
                            Confirmer le refus
                          </AnimatedButton>
                          <AnimatedButton
                            variant="ghost"
                            onClick={() => { setRejectionId(null); setRejectionReason(""); }}
                            className="text-sm"
                          >
                            Annuler
                          </AnimatedButton>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </PageTransition>
  );
}
