"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getDisplayImageUrl } from "@/lib/images";
import type { Announcement } from "@/types";
import FadeIn from "@/components/motion/FadeIn";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import { ArrowLeft, Package, Calendar, Scale, Phone, MessageCircle } from "lucide-react";
import { useChat } from "@/lib/chat-context";
import { useAuth } from "@/lib/auth-context";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openChat, fetchConversations } = useChat();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Announcement>(`/announcements/${id}`)
      .then((r) => setAnnouncement(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleStartChat = async () => {
    if (!announcement || !user) return;
    setStartingChat(true);
    try {
      const res = await api.post("/conversations", {
        participant_id: announcement.producer_id,
        announcement_id: announcement.id,
      });
      openChat(res.data.id);
      await fetchConversations();
      router.push("/dashboard");
    } catch {
      // Silently fail
    } finally {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FadeIn>
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Annonce introuvable</h3>
            <p className="text-sm text-gray-500 mb-4">Cette annonce n&apos;existe pas ou a ete supprimee.</p>
            <Link href="/announcements" className="text-green-700 font-medium text-sm hover:underline">
              Retour aux annonces
            </Link>
          </div>
        </FadeIn>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Je suis interesse par votre annonce "${announcement.variety}" sur TOHUTOU`
  )}`;
  const displayImageUrl = getDisplayImageUrl(announcement.photo_url);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-green-700 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-green-100 transition-colors">
            TOHUTOU
          </Link>
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-sm hover:text-green-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux annonces
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg shadow-green-900/5 border border-gray-100 overflow-hidden">
          <div className="md:grid md:grid-cols-2">
            {/* Image */}
            <FadeIn className="relative">
              {displayImageUrl ? (
                <motion.div
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="relative h-64 md:h-full overflow-hidden"
                >
                  <Image
                    src={displayImageUrl}
                    alt={announcement.variety}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                    className="object-cover"
                  />
                </motion.div>
              ) : (
                <div className="h-64 md:h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-green-300" />
                </div>
              )}
            </FadeIn>

            {/* Details */}
            <FadeIn direction="right" delay={0.15}>
              <div className="p-6 md:p-8 space-y-6">
                {/* Title & Price */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">{announcement.variety}</h2>
                    <AnimatedBadge variant="success">{announcement.maturity}</AnimatedBadge>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <p className="text-sm text-green-700 font-medium">Prix</p>
                    <p className="text-2xl font-bold text-green-800">
                      {Number(announcement.price).toLocaleString()} FCFA
                    </p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Scale className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Quantite</p>
                      <p className="font-semibold text-sm text-gray-900">{Number(announcement.quantity)} kg</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Package className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Maturite</p>
                      <p className="font-semibold text-sm text-gray-900">{announcement.maturity}</p>
                    </div>
                  </div>
                  {announcement.harvest_date && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Date de recolte</p>
                        <p className="font-semibold text-sm text-gray-900">
                          {new Date(announcement.harvest_date).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Publiee le</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {new Date(announcement.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <AnimatedButton className="w-full py-3">
                      <Phone className="w-4 h-4" />
                      Contacter via WhatsApp
                    </AnimatedButton>
                  </a>

                  {user && user.id !== announcement.producer_id && (
                    <AnimatedButton
                      variant="secondary"
                      className="w-full py-3"
                      loading={startingChat}
                      onClick={handleStartChat}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Envoyer un message
                    </AnimatedButton>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour a la liste des annonces
          </Link>
        </div>
      </main>
    </div>
  );
}
