"use client";

import { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import type { Organization } from "@/types";

interface OrgContextType {
  org: Organization | null;
  loading: boolean;
  error: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<Organization>(`/organizations/by-slug/${slug}`)
      .then((r) => setOrg(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <OrgContext.Provider value={{ org, loading, error }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
