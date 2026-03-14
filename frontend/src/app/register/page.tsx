"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import type { Organization, Cooperative, UserRole } from "@/types";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { UserPlus, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>("buyer");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [cooperativeId, setCooperativeId] = useState<number | "">("");
  const [memberNumber, setMemberNumber] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loadingCoops, setLoadingCoops] = useState(false);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setOrganizationsLoading(true);
    setOrganizationsError(false);
    api
      .get("/organizations")
      .then((r) => {
        const list = Array.isArray(r?.data) ? r.data : [];
        setOrganizations(list);
      })
      .catch(() => {
        setOrganizationsError(true);
        setOrganizations([]);
      })
      .finally(() => setOrganizationsLoading(false));
  }, []);

  useEffect(() => {
    if (organizationId) {
      setLoadingCoops(true);
      setCooperativeId("");
      api
        .get<Cooperative[]>(`/cooperatives?organization_id=${organizationId}`)
        .then((r) => setCooperatives(r.data))
        .catch(() => setCooperatives([]))
        .finally(() => setLoadingCoops(false));
    } else {
      setCooperatives([]);
      setCooperativeId("");
    }
  }, [organizationId]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "Le prenom est requis";
    if (!lastName.trim()) errors.lastName = "Le nom est requis";
    if (!phone.trim()) {
      errors.phone = "Le telephone est requis";
    } else if (phone.replace(/\s/g, "").length < 8) {
      errors.phone = "Numero de telephone invalide";
    }
    if (!password) {
      errors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      errors.password = "6 caracteres minimum";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post("/auth/register", {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.replace(/\s/g, ""),
        password,
        role,
        organization_id: organizationId || null,
        cooperative_id: cooperativeId || null,
        member_number: memberNumber || null,
      });
      router.push("/login");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string | Array<{ msg?: string }> }; status?: number } };
      const detail = axiosErr.response?.data?.detail;
      let message = "Erreur lors de l'inscription";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        message = detail.map((d) => (typeof d === "object" && d?.msg ? d.msg : String(d))).join(". ");
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field?: string) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent ${
      field && fieldErrors[field] ? "border-red-400 bg-red-50 focus:ring-red-400" : "border-gray-300"
    }`;

  const selectCls = () =>
    "w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-white transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent";

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
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Connexion
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-8 md:py-12">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <UserPlus className="w-7 h-7 text-green-700" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900">Creer un compte</h2>
            <p className="text-sm text-gray-500 mt-1">Rejoignez la plateforme de l&apos;ananas au Benin</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 md:p-8 rounded-2xl shadow-lg shadow-green-900/5 border border-gray-100 space-y-5"
          >
            {/* Error */}
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

            {/* Role selector with sliding indicator */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Je suis</label>
              <div className="relative grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                {/* Sliding indicator */}
                <motion.div
                  layoutId="role-indicator"
                  className="absolute top-1 bottom-1 bg-green-700 rounded-lg shadow-sm"
                  style={{ width: "calc(50% - 4px)" }}
                  animate={{ x: role === "buyer" ? 4 : "calc(100% + 4px)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className={`relative z-10 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    role === "buyer" ? "text-white" : "text-gray-600"
                  }`}
                >
                  Acheteur
                </button>
                <button
                  type="button"
                  onClick={() => setRole("producer")}
                  className={`relative z-10 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    role === "producer" ? "text-white" : "text-gray-600"
                  }`}
                >
                  Producteur
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prenom <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, firstName: "" })); }}
                  className={inputCls("firstName")}
                />
                {fieldErrors.firstName && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1">
                    {fieldErrors.firstName}
                  </motion.p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, lastName: "" })); }}
                  className={inputCls("lastName")}
                />
                {fieldErrors.lastName && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1">
                    {fieldErrors.lastName}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Telephone <span className="text-red-500">*</span>
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
                  onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: "" })); }}
                  placeholder="97 00 00 00"
                  className={`flex-1 border rounded-r-xl px-3.5 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent ${
                    fieldErrors.phone ? "border-red-400 bg-red-50 focus:ring-red-400" : "border-gray-300"
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1">
                  {fieldErrors.phone}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                  className={inputCls("password")}
                />
                {fieldErrors.password ? (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1">
                    {fieldErrors.password}
                  </motion.p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">6 caracteres min.</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmer <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors((p) => ({ ...p, confirmPassword: "" })); }}
                  className={inputCls("confirmPassword")}
                />
                {fieldErrors.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1">
                    {fieldErrors.confirmPassword}
                  </motion.p>
                )}
              </div>
            </div>

            {/* Producer-specific fields */}
            <AnimatePresence mode="wait">
              {role === "producer" && (
                <motion.div
                  key="producer-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 pt-2">Informations producteur</p>

                    <div>
                      <label htmlFor="org" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Organisation <span className="text-gray-400 font-normal">(optionnel)</span>
                      </label>
                      {organizationsLoading ? (
                        <p className="text-sm text-gray-500 py-2">Chargement des organisations...</p>
                      ) : (
                        <>
                          <select
                            id="org"
                            value={organizationId}
                            onChange={(e) => setOrganizationId(e.target.value ? Number(e.target.value) : "")}
                            className={selectCls()}
                          >
                            <option value="">-- Aucune --</option>
                            {organizations.map((o) => (
                              <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                          </select>
                          {organizationsError && (
                            <p className="text-xs text-amber-600 mt-1">
                              Impossible de charger la liste. Vérifiez la connexion ou réessayez plus tard.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {organizationId && (
                        <motion.div
                          key="coop-field"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div>
                            <label htmlFor="coop" className="block text-sm font-medium text-gray-700 mb-1.5">
                              Cooperative <span className="text-gray-400 font-normal">(optionnel)</span>
                            </label>
                            {loadingCoops ? (
                              <p className="text-sm text-gray-400 py-2">Chargement des cooperatives...</p>
                            ) : cooperatives.length === 0 ? (
                              <p className="text-sm text-gray-400 py-2">Aucune cooperative pour cette organisation</p>
                            ) : (
                              <select
                                id="coop"
                                value={cooperativeId}
                                onChange={(e) => setCooperativeId(e.target.value ? Number(e.target.value) : "")}
                                className={selectCls()}
                              >
                                <option value="">-- Aucune --</option>
                                {cooperatives.map((c) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div>
                      <label htmlFor="member" className="block text-sm font-medium text-gray-700 mb-1.5">
                        N. membre <span className="text-gray-400 font-normal">(optionnel)</span>
                      </label>
                      <input
                        id="member"
                        value={memberNumber}
                        onChange={(e) => setMemberNumber(e.target.value)}
                        placeholder="Si vous avez un numero de membre"
                        className={inputCls()}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <AnimatedButton
              type="submit"
              loading={loading}
              className="w-full py-3"
            >
              S&apos;inscrire
            </AnimatedButton>

            <p className="text-center text-sm text-gray-500">
              Deja un compte ?{" "}
              <Link href="/login" className="text-green-700 font-medium hover:underline">Se connecter</Link>
            </p>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
