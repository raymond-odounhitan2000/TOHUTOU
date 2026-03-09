"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { getDisplayImageUrl } from "@/lib/images";
import type { Announcement, Organization, Cooperative, PaginatedAnnouncements } from "@/types";
import FadeIn from "@/components/motion/FadeIn";
import StaggerContainer from "@/components/motion/StaggerContainer";
import StaggerItem from "@/components/motion/StaggerItem";
import Skeleton from "@/components/ui/Skeleton";
import {
  Search,
  MapPin,
  Package,
  Filter,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock3,
  Building2,
} from "lucide-react";

type StatusFilter = "all" | Announcement["status"];

const STATUS_STYLES: Record<Announcement["status"], { label: string; className: string }> = {
  pending: {
    label: "En validation",
    className: "border-amber-300 bg-amber-50 text-amber-800",
  },
  approved: {
    label: "Disponible",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  rejected: {
    label: "Refusee",
    className: "border-rose-300 bg-rose-50 text-rose-800",
  },
  sold: {
    label: "Vendue",
    className: "border-slate-300 bg-slate-100 text-slate-700",
  },
};

const numberFormatter = new Intl.NumberFormat("fr-FR");

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [orgFilter, setOrgFilter] = useState<number | "">("");
  const [coopFilter, setCoopFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/organizations").then((r) => setOrganizations(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!orgFilter) return undefined;
    let active = true;

    api
      .get(`/cooperatives?organization_id=${orgFilter}`)
      .then((r) => {
        if (active) setCooperatives(r.data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [orgFilter]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), size: "12" });
    if (orgFilter) params.set("organization_id", String(orgFilter));
    if (coopFilter) params.set("cooperative_id", String(coopFilter));

    api
      .get<PaginatedAnnouncements>(`/announcements?${params}`)
      .then((r) => {
        if (!active) return;
        setAnnouncements(r.data.items);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, orgFilter, coopFilter]);

  const filteredAnnouncements = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return announcements.filter((announcement) => {
      const statusOk = statusFilter === "all" || announcement.status === statusFilter;
      const searchOk = !search || announcement.variety.toLowerCase().includes(search);
      return statusOk && searchOk;
    });
  }, [announcements, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const approved = announcements.filter((a) => a.status === "approved").length;
    const pending = announcements.filter((a) => a.status === "pending").length;
    const totalQuantity = announcements.reduce((sum, a) => sum + Number(a.quantity || 0), 0);
    const averagePrice =
      announcements.length > 0
        ? announcements.reduce((sum, a) => sum + Number(a.price || 0), 0) / announcements.length
        : 0;

    return {
      approved,
      pending,
      totalQuantity,
      averagePrice,
    };
  }, [announcements]);

  const hasClientFilter = statusFilter !== "all" || searchTerm.trim().length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f8f4]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-yellow-200/35 blur-3xl" />
      </div>

      <header className="relative border-b border-white/40 bg-gradient-to-br from-emerald-900 via-green-800 to-lime-800 text-white shadow-xl shadow-emerald-950/20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold ring-1 ring-white/30">
              T
            </span>
            <span className="text-xl font-semibold tracking-tight">TOHUTOU</span>
          </Link>
          <nav className="flex gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-white/40 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur transition hover:bg-white/25"
            >
              Connexion
            </Link>
          </nav>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-5 md:pb-14">
          <FadeIn delay={0.05}>
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90">
                  <Sparkles className="h-3.5 w-3.5" />
                  Marche en direct
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Annonces d&apos;ananas, en temps reel
                </h1>
                <p className="mt-3 text-sm text-white/80 md:text-base">
                  Une vitrine vivante des offres des producteurs. Filtre, compare, et trouve rapidement les lots qui t&apos;interessent.
                </p>
              </div>
            </div>
          </FadeIn>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="rounded-2xl border border-white/30 bg-white/12 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Publiees</p>
              <p className="mt-2 text-2xl font-semibold">{numberFormatter.format(total)}</p>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/12 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Disponibles</p>
              <p className="mt-2 text-2xl font-semibold">{numberFormatter.format(stats.approved)}</p>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/12 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">En validation</p>
              <p className="mt-2 text-2xl font-semibold">{numberFormatter.format(stats.pending)}</p>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/12 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Prix moyen</p>
              <p className="mt-2 text-2xl font-semibold">{numberFormatter.format(Math.round(stats.averagePrice))} FCFA</p>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="relative mx-auto -mt-8 w-full max-w-7xl flex-1 px-4 pb-10">
        <FadeIn delay={0.12}>
          <motion.div
            layout
            className="mb-8 rounded-3xl border border-emerald-100 bg-white/85 p-5 shadow-xl shadow-emerald-950/5 backdrop-blur md:p-6"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4 text-emerald-700" />
              Filtrer intelligemment
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une variete..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={orgFilter}
                  onChange={(e) => {
                    const nextOrgFilter = e.target.value ? Number(e.target.value) : "";
                    setLoading(true);
                    setOrgFilter(nextOrgFilter);
                    setCoopFilter("");
                    setPage(1);
                    if (!nextOrgFilter) {
                      setCooperatives([]);
                    }
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Toutes les organisations</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={coopFilter}
                  onChange={(e) => {
                    setLoading(true);
                    setCoopFilter(e.target.value ? Number(e.target.value) : "");
                    setPage(1);
                  }}
                  disabled={!orgFilter}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <option value="">Toutes les cooperatives</option>
                  {cooperatives.map((cooperative) => (
                    <option key={cooperative.id} value={cooperative.id}>
                      {cooperative.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">Tous les statuts</option>
                <option value="approved">Disponibles</option>
                <option value="pending">En validation</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" />
                {numberFormatter.format(stats.totalQuantity)} kg visibles
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                <Clock3 className="h-3.5 w-3.5" />
                Les annonces en validation sont affichees pour la demo
              </span>
            </div>
          </motion.div>
        </FadeIn>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-0 shadow-sm">
                <div
                  className="h-52"
                  style={{
                    background: "linear-gradient(90deg, #eef2f7 25%, #e2e8f0 50%, #eef2f7 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s ease-in-out infinite",
                  }}
                />
                <div className="space-y-3 p-4">
                  <Skeleton variant="text" count={2} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <FadeIn>
            <div className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-14 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Package className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                {announcements.length === 0 ? "Aucune annonce publiee" : "Aucun resultat avec ces filtres"}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
                {announcements.length === 0
                  ? "Publie une annonce depuis ton tableau de bord. Elle apparaitra ici automatiquement."
                  : "Essaie de reinitialiser les filtres pour retrouver les annonces disponibles."}
              </p>
              {announcements.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  Reinitialiser les filtres locaux
                </button>
              )}
            </div>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAnnouncements.map((announcement) => {
              const statusStyle = STATUS_STYLES[announcement.status] || STATUS_STYLES.pending;
              const displayImageUrl = getDisplayImageUrl(announcement.photo_url);
              return (
                <StaggerItem key={announcement.id}>
                  <Link href={`/announcements/${announcement.id}`} className="group block">
                    <motion.article
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm transition group-hover:shadow-xl group-hover:shadow-emerald-950/10"
                    >
                      {displayImageUrl ? (
                        <div className="relative h-56 overflow-hidden">
                          <motion.img
                            whileHover={{ scale: 1.07 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            src={displayImageUrl}
                            alt={announcement.variety}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                          <span
                            className={`absolute left-3 top-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                      ) : (
                        <div className="relative flex h-56 items-center justify-center bg-gradient-to-br from-emerald-100 to-lime-100">
                          <Package className="h-14 w-14 text-emerald-500/70" />
                          <span
                            className={`absolute left-3 top-3 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-xl font-semibold tracking-tight text-slate-900 transition group-hover:text-emerald-700">
                            {announcement.variety}
                          </h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {announcement.maturity}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Quantite</p>
                            <p className="mt-1 font-semibold text-slate-800">
                              {numberFormatter.format(Number(announcement.quantity))} kg
                            </p>
                          </div>
                          <div className="rounded-xl bg-emerald-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-emerald-700/70">Prix</p>
                            <p className="mt-1 font-semibold text-emerald-800">
                              {numberFormatter.format(Number(announcement.price))} FCFA
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                          <span>{new Date(announcement.created_at).toLocaleDateString("fr-FR")}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 transition group-hover:gap-2">
                            Voir details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {pages > 1 && !hasClientFilter && (
          <FadeIn>
            <div className="mb-8 mt-10 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page === 1}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Precedent
              </button>
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                {page} / {pages}
              </span>
              <button
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.min(pages, p + 1));
                }}
                disabled={page === pages}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}
