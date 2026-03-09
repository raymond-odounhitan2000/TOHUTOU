"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  Plus,
  CheckCircle,
  LogOut,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChatPanel from "@/components/chat/ChatPanel";
import PageTransition from "@/components/motion/PageTransition";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

export default function OrgDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { org } = useOrg();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto mb-3"
            style={{ color: org?.primary_color || "#15803d" }}
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.replace(`/org/${org.slug}/login`);
    return null;
  }

  if (user.organization_id !== org.id) {
    router.replace(`/org/${org.slug}/login`);
    return null;
  }

  const base = `/org/${org.slug}/dashboard`;

  const navItems: NavItem[] = [
    {
      href: `${base}/overview`,
      label: "Vue d'ensemble",
      icon: LayoutDashboard,
      roles: ["admin", "delegate", "producer", "buyer"],
    },
    {
      href: `${base}/producer/announcements`,
      label: "Mes annonces",
      icon: ClipboardList,
      roles: ["producer"],
    },
    {
      href: `${base}/producer/announcements/new`,
      label: "Nouvelle annonce",
      icon: Plus,
      roles: ["producer"],
    },
    {
      href: `${base}/delegate`,
      label: "Validation",
      icon: CheckCircle,
      roles: ["delegate", "admin"],
    },
    {
      href: `${base}/members`,
      label: "Membres",
      icon: UserCircle,
      roles: ["admin"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const NavLink = ({
    item,
    onClick,
  }: {
    item: NavItem;
    onClick?: () => void;
  }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
          isActive
            ? "font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="org-sidebar-active"
            className="absolute inset-0 rounded-xl"
            style={{ backgroundColor: org.primary_color + "15" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <span className="relative flex items-center gap-3">
          <Icon
            className="w-5 h-5 shrink-0"
            style={isActive ? { color: org.primary_color } : undefined}
          />
          <span style={isActive ? { color: org.primary_color } : undefined}>
            {item.label}
          </span>
        </span>
      </Link>
    );
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "delegate":
        return "Delegue";
      case "producer":
        return "Producteur";
      case "admin":
        return "Administrateur";
      default:
        return "Acheteur";
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-sky-200/20 blur-3xl" />
      </div>
      {/* Header */}
      <header
        style={{
          background: `linear-gradient(135deg, ${org.primary_color}, #0f5132)`,
        }}
        className="text-white shadow-lg shadow-emerald-950/20 sticky top-0 z-30 border-b border-white/20 backdrop-blur"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              {org.logo_url && (
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  width={32}
                  height={32}
                  unoptimized
                  className="w-8 h-8 rounded-full object-cover bg-white ring-2 ring-white/20"
                />
              )}
              <Link
                href={`/org/${org.slug}`}
                className="text-xl font-bold tracking-tight"
              >
                {org.name}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2">
              <UserCircle className="w-5 h-5 opacity-80" />
              <span className="text-sm opacity-90">
                {user.first_name} {user.last_name}
              </span>
            </div>
            <button
              onClick={() => {
                logout();
                router.push(`/org/${org.slug}/login`);
              }}
              className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Deconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {roleLabel(user.role)}
                  </p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-3 space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    onClick={() => setMenuOpen(false)}
                  />
                ))}
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-1">
        {/* Desktop sidebar */}
        <nav className="w-64 bg-white/75 border-r border-emerald-100 hidden md:block p-4 space-y-1 sticky top-13 h-[calc(100vh-52px)] overflow-y-auto backdrop-blur-xl">
          <div className="pb-3 mb-3 border-b border-emerald-100">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Navigation
            </p>
          </div>
          {visibleItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 min-w-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <ChatPanel />
    </div>
  );
}
