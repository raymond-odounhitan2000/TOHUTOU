"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { Organization } from "@/types";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedButton from "@/components/ui/AnimatedButton";
import AnimatedModal from "@/components/ui/AnimatedModal";
import AnimatedList from "@/components/ui/AnimatedList";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Building2, Plus, Pencil, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchOrgs = () => {
    api.get<Organization[]>("/organizations").then((r) => { setOrgs(r.data); setLoading(false); });
  };

  useEffect(fetchOrgs, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/organizations/${editing}`, { name, description });
    } else {
      await api.post("/organizations", { name, description });
    }
    setName(""); setDescription(""); setEditing(null);
    fetchOrgs();
  };

  const handleEdit = (org: Organization) => {
    setEditing(org.id); setName(org.name); setDescription(org.description || "");
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/organizations/${id}`);
    setDeleteId(null);
    fetchOrgs();
  };

  const cancelEdit = () => {
    setEditing(null); setName(""); setDescription("");
  };

  return (
    <PageTransition>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Organisations</h2>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="org-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'organisation"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-colors"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="org-desc" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="org-desc"
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

      {/* List */}
      {loading ? (
        <Skeleton variant="card" count={3} />
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucune organisation"
          description="Ajoutez votre premiere organisation ci-dessus"
        />
      ) : (
        <AnimatedList>
          {orgs.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{o.name}</h3>
                  {o.description && <p className="text-sm text-gray-500 truncate">{o.description}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <AnimatedButton variant="ghost" onClick={() => handleEdit(o)} className="text-sm px-3 py-1.5">
                  <Pencil className="w-3.5 h-3.5" />
                  Modifier
                </AnimatedButton>
                <AnimatedButton variant="danger" onClick={() => setDeleteId(o.id)} className="text-sm px-3 py-1.5">
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
          Etes-vous sur de vouloir supprimer cette organisation ? Cette action est irreversible.
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
