"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import {
  Menu,
  X,
  ClipboardList,
  Plus,
  CheckCircle,
  LayoutDashboard,
  Building2,
  Users,
  UserCircle,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Organization } from "@/types";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatPanel from "@/components/chat/ChatPanel";
import PageTransition from "@/components/motion/PageTransition";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

interface DashboardNavLinksProps {
  items: NavItem[];
  pathname: string;
  layoutIdPrefix: string;
  onItemClick?: () => void;
}

const navItems: NavItem[] = [
  { href: "/dashboard/producer/announcements", label: "Mes annonces", icon: ClipboardList, roles: ["producer"] },
  { href: "/dashboard/producer/announcements/new", label: "Nouvelle annonce", icon: Plus, roles: ["producer"] },
  { href: "/dashboard/delegate", label: "Validation", icon: CheckCircle, roles: ["delegate"] },
  { href: "/dashboard/admin", label: "Tableau de bord", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/dashboard/admin/organizations", label: "Organisations", icon: Building2, roles: ["admin"] },
  { href: "/dashboard/admin/cooperatives", label: "Cooperatives", icon: Users, roles: ["admin"] },
  { href: "/dashboard/admin/users", label: "Utilisateurs", icon: UserCircle, roles: ["admin"] },
  { href: "/profile", label: "Mon profil", icon: UserCircle, roles: ["admin", "delegate", "producer", "buyer"] },
];

function roleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Administrateur";
    case "delegate":
      return "Delegue";
    case "producer":
      return "Producteur";
    default:
      return "Acheteur";
  }
}

function DashboardNavLinks({
  items,
  pathname,
  layoutIdPrefix,
  onItemClick,
}: DashboardNavLinksProps) {
  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className="group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-sidebar-active`}
                className="absolute inset-0 rounded-2xl border border-emerald-200/80 bg-linear-to-r from-emerald-50 to-lime-50 shadow-[0_6px_20px_-15px_rgba(22,163,74,0.7)]"
                transition={{ type: "spring", stiffness: 340, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 flex items-center gap-3 ${
                isActive
                  ? "font-semibold text-emerald-800"
                  : "text-slate-600 group-hover:text-slate-900"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive
                    ? "text-emerald-700"
                    : "text-slate-400 transition-colors group-hover:text-slate-700"
                }`}
              />
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "admin" || !user.organization_id) return;

    let active = true;

    api
      .get<Organization>(`/organizations/${user.organization_id}`)
      .then((response) => {
        if (active) {
          router.replace(`/org/${response.data.slug}/dashboard`);
        }
      })
      .catch(() => {
        if (active) {
          router.replace("/announcements");
        }
      });

    return () => {
      active = false;
    };
  }, [loading, router, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-green-700 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (user.role === "admin" && user.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-green-700 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Redirection vers votre espace organisation...</p>
        </div>
      </div>
    );
  }

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute right-0 top-16 h-80 w-80 rounded-full bg-lime-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-200/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3.5 md:px-6">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-green-700 text-lg font-bold text-white shadow-lg shadow-emerald-700/35">
                T
              </span>
              <span className="text-lg font-semibold tracking-tight text-slate-900 md:text-xl">
                TOHUTOU
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5 md:gap-3.5">
            <NotificationBell />
            <div className="hidden rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 sm:block">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/90">
                {roleLabel(user.role)}
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {user.first_name} {user.last_name}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Deconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full w-72 overflow-y-auto border-r border-emerald-100 bg-linear-to-b from-white to-emerald-50/40 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-emerald-100/80 p-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/90">
                    {roleLabel(user.role)}
                  </p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-slate-700"
                  aria-label="Fermer le menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-3.5">
                <DashboardNavLinks
                  items={visibleItems}
                  pathname={pathname}
                  layoutIdPrefix="mobile"
                  onItemClick={() => setMenuOpen(false)}
                />
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-1">
        <nav className="sticky top-16.25 hidden h-[calc(100vh-65px)] w-72 shrink-0 overflow-y-auto border-r border-emerald-100/80 bg-white/70 p-5 backdrop-blur-lg md:block">
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Espace membre
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm">
            <div className="mb-2 px-2 pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Navigation
              </p>
            </div>
            <DashboardNavLinks
              items={visibleItems}
              pathname={pathname}
              layoutIdPrefix="desktop"
            />
          </div>
        </nav>

        <main className="relative z-10 min-w-0 flex-1 p-4 md:p-8">
          <PageTransition className="mx-auto w-full max-w-6xl">{children}</PageTransition>
        </main>
      </div>

      <ChatPanel />
    </div>
  );
}
