"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Lock } from "lucide-react";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim()) { setError("Veuillez entrer votre numero de telephone"); return; }
    if (!password) { setError("Veuillez entrer votre mot de passe"); return; }
    setLoading(true);
    try {
      await login(phone.replace(/\s/g, ""), password);
      router.push("/dashboard");
    } catch {
      setError("Telephone ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50/30 to-white">
      {/* Top nav */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-green-800 hover:text-green-700 transition-colors"
          >
            TOHUTOU
          </Link>
          <Link
            href="/register"
            className="text-sm text-green-700 font-medium hover:text-green-800 transition-colors"
          >
            S&apos;inscrire
          </Link>
        </div>
      </header>

      {/* Centered card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="w-full max-w-sm"
        >
          {/* Header area */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Lock className="w-7 h-7 text-green-700" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
            <p className="text-sm text-gray-500 mt-1">Accedez a votre espace TOHUTOU</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-lg shadow-green-900/5 border border-gray-100 space-y-5"
          >
            {/* Error message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-xl border border-red-100 overflow-hidden"
                >
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phone input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Telephone
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                  +229
                </span>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="97 00 00 00"
                  className="flex-1 border border-gray-300 rounded-r-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
              />
            </div>

            {/* Submit */}
            <AnimatedButton
              type="submit"
              loading={loading}
              className="w-full py-3"
            >
              Se connecter
            </AnimatedButton>

            <p className="text-center text-sm text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-green-700 font-medium hover:underline">
                S&apos;inscrire
              </Link>
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
