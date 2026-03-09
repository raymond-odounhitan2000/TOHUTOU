"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { User, Mail, Phone, Hash, Shield, CalendarDays } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await api.put("/users/me", {
        first_name: firstName,
        last_name: lastName,
        email: email || null,
      });
      await refreshUser();
      setSuccess(true);
    } catch {
      setError("Erreur lors de la mise a jour");
    } finally {
      setSaving(false);
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrateur",
    delegate: "Delegue",
    producer: "Producteur",
    buyer: "Acheteur",
  };

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto py-8 px-4">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold mb-6 text-gray-900"
        >
          Mon profil
        </motion.h2>

        {/* Profile summary card */}
        <AnimatedCard className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg shrink-0"
            >
              {user.first_name[0]}{user.last_name[0]}
            </motion.div>
            <div>
              <p className="font-semibold text-gray-900">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
          </div>
          <div className="space-y-2.5 text-sm text-gray-500">
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-700" />
              {user.phone}
            </p>
            {user.member_number && (
              <p className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-green-700" />
                N. membre : {user.member_number}
              </p>
            )}
            <p className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-green-700" />
              Inscrit le {new Date(user.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </AnimatedCard>

        {/* Edit form */}
        <AnimatedCard className="p-6" delay={0.1}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="font-semibold text-gray-900">Modifier mes informations</h3>

            {/* Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100 overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-green-700 text-sm bg-green-50 p-3 rounded-xl border border-green-100 overflow-hidden"
                >
                  Profil mis a jour avec succes.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Prenom
                  </span>
                </label>
                <input
                  id="firstName"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Nom
                  </span>
                </label>
                <input
                  id="lastName"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email (optionnel)
                </span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
              />
            </div>

            <AnimatedButton
              type="submit"
              loading={saving}
              className="w-full py-2.5"
            >
              Enregistrer
            </AnimatedButton>
          </form>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
