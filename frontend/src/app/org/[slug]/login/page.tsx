"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { AlertCircle, ShieldAlert, ArrowLeft, Phone, Lock } from "lucide-react";

export default function OrgLoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const { org } = useOrg();
  const router = useRouter();

  if (!org) return null;

  if (user) {
    if (user.organization_id !== org.id) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header
            style={{ backgroundColor: org.primary_color }}
            className="text-white shadow-md"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
                <span className="text-xl font-bold tracking-tight">
                  {org.name}
                </span>
              </div>
              <Link
                href="/"
                className="text-sm opacity-80 hover:opacity-100 transition-opacity"
              >
                TOHUTOU
              </Link>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
                className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <ShieldAlert className="w-8 h-8 text-orange-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Acces refuse
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                Vous n&apos;etes pas membre de{" "}
                <strong>{org.name}</strong>.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 font-medium hover:underline text-sm"
                style={{ color: org.primary_color }}
              >
                <ArrowLeft className="w-4 h-4" />
                Retour a l&apos;accueil
              </Link>
            </motion.div>
          </main>
        </div>
      );
    }
    router.replace(`/org/${org.slug}/dashboard`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Veuillez entrer votre numero de telephone");
      return;
    }
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }
    setLoading(true);
    try {
      await login(phone.replace(/\s/g, ""), password);
    } catch {
      setError("Telephone ou mot de passe incorrect");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header
        style={{ backgroundColor: org.primary_color }}
        className="text-white shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <span className="text-xl font-bold tracking-tight">
              {org.name}
            </span>
          </div>
          <Link
            href="/"
            className="text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            TOHUTOU
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25,
          }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.15,
              }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: org.primary_color + "20" }}
            >
              {org.logo_url ? (
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <span
                  className="text-2xl font-bold"
                  style={{ color: org.primary_color }}
                >
                  {org.name[0]}
                </span>
              )}
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900">{org.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Connectez-vous a votre espace
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telephone
              </label>
              <div className="flex">
                <span className="inline-flex items-center gap-1 px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <Phone className="w-3.5 h-3.5" />
                  +229
                </span>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="97 00 00 00"
                  className="flex-1 border border-gray-300 rounded-r-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                  style={
                    {
                      "--tw-ring-color": org.primary_color,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                  style={
                    {
                      "--tw-ring-color": org.primary_color,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            <AnimatedButton
              type="submit"
              loading={loading}
              color={org.primary_color}
              className="w-full !py-3"
            >
              Se connecter
            </AnimatedButton>

            <p className="text-center text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-medium hover:underline"
                style={{ color: org.primary_color }}
              >
                S&apos;inscrire
              </Link>
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
