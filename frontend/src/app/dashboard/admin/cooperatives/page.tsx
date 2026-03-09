"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { Cooperative, Organization } from "@/types";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedModal from "@/components/ui/AnimatedModal";
import AnimatedList from "@/components/ui/AnimatedList";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Users, Plus, Pencil, Trash2, X, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function CooperativesPage() {
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOrg, setFilterOrg] = useState<number | "">("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchCoops = () => {
    const params = filterOrg ? `?organization_id=${filterOrg}` : "";
    api.get<Cooperative[]>(`/cooperatives${params}`).then((r) => {
      setCoops(r.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    api.get<Organization[]>("/organizations").then((r) => setOrgs(r.data));
  }, []);

  useEffect(fetchCoops, [filterOrg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    if (editing) {
      await api.put(`/cooperatives/${editing}`, { name, description, organization_id: organizationId });
    } else {
      await api.post("/cooperatives", { name, description, organization_id: organizationId });
    }
    setName("");
    setDescription("");
    setOrganizationId("");
    setEditing(null);
    fetchCoops();
  };

  const handleEdit = (c: Cooperative) => {
    setEditing(c.id);
    setName(c.name);
    setDescription(c.description || "");
    setOrganizationId(c.organization_id);
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/cooperatives/${id}`);
    setDeleteId(null);
    fetchCoops();
  };

  const cancelEdit = () => {
    setEditing(null); setName(""); setDescription(""); setOrganizationId("");
  };

  const orgName = (orgId: number) => orgs.find((o) => o.id === orgId)?.name || `#${orgId}`;

  return (
    <PageTransition>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Cooperatives</h2>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-48">
            <label htmlFor="coop-org" className="block text-sm font-medium text-gray-700 mb-1">
              Organisation <span className="text-red-500">*</span>
            </label>
            <select
              id="coop-org"
              required
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value ? Number(e.target.value) : "")}
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
            >
              <option value="">Organisation *</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="coop-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="coop-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la cooperative"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="coop-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="coop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <AnimatedButton type="submit" variant="primary" className="text-sm">
            <Plus className="w-4 h-4" />
            {editing ? "Modifier" : "Ajouter"}
          </AnimatedButton>
          {editing && (
            <AnimatedButton type="button" variant="ghost" onClick={cancelEdit} className="text-sm">
              <X className="w-4 h-4" />
              Annuler
            </AnimatedButton>
          )}
        </div>
      </motion.form>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-4 flex items-center gap-2"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filterOrg}
          onChange={(e) => setFilterOrg(e.target.value ? Number(e.target.value) : "")}
          className="border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
        >
          <option value="">Toutes les organisations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </motion.div>

      {/* List */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : coops.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucune cooperative"
          description="Ajoutez votre premiere cooperative ci-dessus"
          color="#9333ea"
        />
      ) : (
        <AnimatedList>
          {coops.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                  <p className="text-xs text-green-700 font-medium">{orgName(c.organization_id)}</p>
                  {c.description && <p className="text-sm text-gray-500 truncate">{c.description}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <AnimatedButton variant="ghost" onClick={() => handleEdit(c)} className="text-sm px-3 py-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </AnimatedButton>
                <AnimatedButton variant="danger" onClick={() => setDeleteId(c.id)} className="text-sm px-3 py-1.5">
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </AnimatedButton>
              </div>
            </div>
          ))}
        </AnimatedList>
      )}

      {/* Delete confirmation modal */}
      <AnimatedModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Confirmer la suppression"
      >
        <p className="text-sm text-gray-600 mb-6">
          Etes-vous sur de vouloir supprimer cette cooperative ? Cette action est irreversible.
        </p>
        <div className="flex gap-3 justify-end">
          <AnimatedButton variant="ghost" onClick={() => setDeleteId(null)} className="text-sm">
            Annuler
          </AnimatedButton>
          <AnimatedButton variant="danger" onClick={() => deleteId && handleDelete(deleteId)} className="text-sm">
            <Trash2 className="w-4 h-4" />
            Supprimer
          </AnimatedButton>
        </div>
      </AnimatedModal>
    </PageTransition>
  );
}
