"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useOrg } from "@/lib/org-context";
import type { User, UserRole } from "@/types";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import AnimatedButton from "@/components/ui/AnimatedButton";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { Check, Filter, Shield, UserCircle, X } from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  delegate: "Delegue",
  producer: "Producteur",
  buyer: "Acheteur",
};

const ROLE_BADGE_VARIANT: Record<UserRole, "info" | "warning" | "success" | "default"> = {
  admin: "info",
  delegate: "warning",
  producer: "success",
  buyer: "default",
};

const ASSIGNABLE_ROLES: UserRole[] = ["delegate", "producer", "buyer"];

export default function OrgMembersPage() {
  const { org } = useOrg();
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("producer");
  const [error, setError] = useState("");

  const fetchMembers = () => {
    const params = filterRole ? `?role=${filterRole}` : "";
    api
      .get<User[]>(`/users${params}`)
      .then((response) => {
        setMembers(response.data);
        setError("");
      })
      .catch(() => {
        setError("Impossible de charger les membres de l'organisation.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(fetchMembers, [filterRole]);

  const handleRoleChange = async (memberId: number) => {
    try {
      await api.put(`/users/${memberId}/role`, { role: newRole });
      setChangingRole(null);
      setError("");
      fetchMembers();
    } catch {
      setError("Impossible de modifier ce role.");
    }
  };

  if (!org || !user) return null;

  if (user.role !== "admin") {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
        Acces reserve a l&apos;administrateur de l&apos;organisation.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Membres de {org.name}</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | "")}
            className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 transition-colors"
            style={{ "--tw-ring-color": org.primary_color } as CSSProperties}
          >
            <option value="">Tous les roles</option>
            <option value="admin">Admin</option>
            <option value="delegate">Delegue</option>
            <option value="producer">Producteur</option>
            <option value="buyer">Acheteur</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Skeleton variant="card" count={4} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Aucun membre"
          description="Aucun membre ne correspond aux criteres."
          color={org.primary_color}
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {members.map((member) => (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AnimatedBadge variant={ROLE_BADGE_VARIANT[member.role]}>
                      <Shield className="mr-1 h-3 w-3" />
                      {ROLE_LABELS[member.role]}
                    </AnimatedBadge>
                    {member.role !== "admin" && changingRole !== member.id && (
                      <AnimatedButton
                        variant="ghost"
                        onClick={() => {
                          setChangingRole(member.id);
                          setNewRole(member.role === "admin" ? "producer" : member.role);
                        }}
                        className="px-3 py-1.5 text-xs"
                      >
                        Changer role
                      </AnimatedButton>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {changingRole === member.id && member.role !== "admin" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center">
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as UserRole)}
                          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 transition-colors"
                          style={{ "--tw-ring-color": org.primary_color } as CSSProperties}
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <AnimatedButton
                            onClick={() => handleRoleChange(member.id)}
                            color={org.primary_color}
                            className="px-3 py-1.5 text-sm"
                          >
                            <Check className="h-4 w-4" />
                            Confirmer
                          </AnimatedButton>
                          <AnimatedButton
                            variant="ghost"
                            onClick={() => setChangingRole(null)}
                            className="px-3 py-1.5 text-sm"
                          >
                            <X className="h-4 w-4" />
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
    </div>
  );
}
