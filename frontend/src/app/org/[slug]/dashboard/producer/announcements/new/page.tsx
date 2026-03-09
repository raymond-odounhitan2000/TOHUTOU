"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/lib/api";
import { useOrg } from "@/lib/org-context";
import PageTransition from "@/components/motion/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AnimatedInput from "@/components/ui/AnimatedInput";
import AnimatedSelect from "@/components/ui/AnimatedSelect";
import AnimatedButton from "@/components/ui/AnimatedButton";
import FadeIn from "@/components/motion/FadeIn";
import { ImagePlus, X, AlertCircle, Upload } from "lucide-react";

const MAX_ANNOUNCEMENT_VALUE = 999_999_999_999.99;

function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as { response?: { data?: { detail?: unknown } } };
  const detail = axiosErr.response?.data?.detail;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object" && "msg" in entry) {
          return String((entry as { msg: unknown }).msg);
        }
        return null;
      })
      .filter(Boolean) as string[];
    if (messages.length > 0) return messages.join(" | ");
  }

  return "Erreur lors de la creation";
}

export default function OrgNewAnnouncementPage() {
  const { org } = useOrg();
  const [variety, setVariety] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [maturity, setMaturity] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  if (!org) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!variety.trim()) errors.variety = "La variete est requise";
    if (!quantity || Number(quantity) <= 0) errors.quantity = "Quantite invalide";
    if (Number(quantity) > MAX_ANNOUNCEMENT_VALUE) {
      errors.quantity = "Quantite trop grande (max 999 999 999 999,99)";
    }
    if (!price || Number(price) <= 0) errors.price = "Prix invalide";
    if (Number(price) > MAX_ANNOUNCEMENT_VALUE) {
      errors.price = "Prix trop grand (max 999 999 999 999,99)";
    }
    if (!maturity) errors.maturity = "Choisissez la maturite";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setFieldErrors((p) => ({ ...p, photo: "Format accepte : JPG, PNG ou WebP" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((p) => ({ ...p, photo: "Fichier trop volumineux (5 Mo max)" }));
      return;
    }
    setFieldErrors((p) => ({ ...p, photo: "" }));
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await api.post<{ url: string }>("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photoUrl = uploadRes.data.url;
        setUploadingPhoto(false);
      }
      await api.post("/announcements", {
        variety: variety.trim(),
        quantity: Number(quantity),
        price: Number(price),
        maturity,
        harvest_date: harvestDate || null,
        photo_url: photoUrl,
      });
      router.push(`/org/${org.slug}/dashboard/producer/announcements`);
    } catch (err: unknown) {
      setUploadingPhoto(false);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <FadeIn>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Nouvelle annonce
        </h2>
      </FadeIn>

      <AnimatedCard className="max-w-lg">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
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

          <AnimatedInput
            id="variety"
            label="Variete"
            required
            value={variety}
            onChange={(e) => {
              setVariety(e.target.value);
              setFieldErrors((p) => ({ ...p, variety: "" }));
            }}
            placeholder="Pain de sucre, Cayenne lisse..."
            error={fieldErrors.variety}
            color={org.primary_color}
          />

          <div className="grid grid-cols-2 gap-4">
            <AnimatedInput
              id="quantity"
              label="Quantite (kg)"
              required
              type="number"
              step="0.01"
              min="0"
              max={MAX_ANNOUNCEMENT_VALUE}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setFieldErrors((p) => ({ ...p, quantity: "" }));
              }}
              error={fieldErrors.quantity}
              color={org.primary_color}
            />
            <AnimatedInput
              id="price"
              label="Prix (FCFA)"
              required
              type="number"
              step="1"
              min="0"
              max={MAX_ANNOUNCEMENT_VALUE}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setFieldErrors((p) => ({ ...p, price: "" }));
              }}
              error={fieldErrors.price}
              color={org.primary_color}
            />
          </div>

          <AnimatedSelect
            id="maturity"
            label="Maturite"
            required
            value={maturity}
            onChange={(e) => {
              setMaturity(e.target.value);
              setFieldErrors((p) => ({ ...p, maturity: "" }));
            }}
            options={[
              { value: "vert", label: "Vert" },
              { value: "mi-mur", label: "Mi-mur" },
              { value: "mur", label: "Mur" },
            ]}
            error={fieldErrors.maturity}
            color={org.primary_color}
          />

          <AnimatedInput
            id="harvest"
            label="Date de recolte"
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            color={org.primary_color}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo{" "}
              <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <AnimatePresence mode="wait">
              {photoPreview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="relative rounded-xl overflow-hidden border border-gray-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Apercu"
                    className="w-full h-48 object-cover"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{
                    borderColor: org.primary_color,
                    backgroundColor: org.primary_color + "08",
                  }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Cliquez pour ajouter une photo
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    JPG, PNG ou WebP - 5 Mo max
                  </p>
                </motion.button>
              )}
            </AnimatePresence>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {fieldErrors.photo && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 mt-1"
              >
                {fieldErrors.photo}
              </motion.p>
            )}
          </div>

          <AnimatedButton
            type="submit"
            loading={loading}
            color={org.primary_color}
            className="w-full !py-3"
          >
            {uploadingPhoto ? (
              <>
                <Upload className="w-4 h-4" />
                Envoi de la photo...
              </>
            ) : (
              "Publier l'annonce"
            )}
          </AnimatedButton>
        </form>
      </AnimatedCard>
    </PageTransition>
  );
}
