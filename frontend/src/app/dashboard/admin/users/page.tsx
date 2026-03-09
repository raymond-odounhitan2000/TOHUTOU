"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { User, UserRole } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedList from "@/components/ui/AnimatedList";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { UserCircle, Shield, Filter, Check, X, Calendar, AlertCircle } from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  delegate: "Delegue",
  producer: "Producteur",
  buyer: "Acheteur",
};

const ROLE_BADGE_VARIANT: Record<UserRole, "info" | "success" | "warning" | "default"> = {
  admin: "info",
  delegate: "warning",
  producer: "success",
  buyer: "default",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("buyer");

  const fetchUsers = () => {
    const params = filterRole ? `?role=${filterRole}` : "";
    api.get<User[]>(`/users${params}`).then((r) => {
      setUsers(r.data);
      setLoading(false);
    });
  };

  useEffect(fetchUsers, [filterRole]);

  const handleRoleChange = async (userId: number) => {
    await api.put(`/users/${userId}/role`, { role: newRole });
    setChangingRole(null);
    fetchUsers();
  };

  return (
    <PageTransition>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Utilisateurs</h2>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 flex items-center gap-2"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as UserRole | "")}
          className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
        >
          <option value="">Tous les roles</option>
          <option value="admin">Admin</option>
          <option value="delegate">Delegue</option>
          <option value="producer">Producteur</option>
          <option value="buyer">Acheteur</option>
        </select>
      </motion.div>

      {/* List */}
      {loading ? (
        <Skeleton variant="card" count={4} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Aucun utilisateur"
          description="Aucun utilisateur ne correspond aux criteres"
        />
      ) : (
        <AnimatedList>
          {users.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                    <UserCircle className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      {u.first_name} {u.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">{u.phone}</p>
                    {u.member_number && (
                      <p className="text-xs text-gray-400">No membre : {u.member_number}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <AnimatedBadge variant={ROLE_BADGE_VARIANT[u.role]}>
                    <Shield className="w-3 h-3 mr-1" />
                    {ROLE_LABELS[u.role]}
                  </AnimatedBadge>
                  {changingRole !== u.id && (
                    <AnimatedButton
                      variant="ghost"
                      onClick={() => { setChangingRole(u.id); setNewRole(u.role); }}
                      className="text-xs px-3 py-1.5"
                    >
                      Changer role
                    </AnimatedButton>
                  )}
                </div>
              </div>

              {/* Role change expand section */}
              <AnimatePresence>
                {changingRole === u.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <span className="text-sm text-gray-600">Nouveau role :</span>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
                      >
                        <option value="buyer">Acheteur</option>
                        <option value="producer">Producteur</option>
                        <option value="delegate">Delegue</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="flex gap-2">
                        <AnimatedButton
                          variant="primary"
                          onClick={() => handleRoleChange(u.id)}
                          className="text-sm px-3 py-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Confirmer
                        </AnimatedButton>
                        <AnimatedButton
                          variant="ghost"
                          onClick={() => setChangingRole(null)}
                          className="text-sm px-3 py-1.5"
                        >
                          <X className="w-4 h-4" />
                          Annuler
                        </AnimatedButton>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                Inscrit le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                {!u.is_active && (
                  <span className="ml-2 text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Inactif
                  </span>
                )}
              </div>
            </div>
          ))}
        </AnimatedList>
      )}
    </PageTransition>
  );
}
