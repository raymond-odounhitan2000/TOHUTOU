"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { OrgProvider, useOrg } from "@/lib/org-context";
import { AuthProvider } from "@/lib/auth-context";

function OrgShell({ children }: { children: React.ReactNode }) {
  const { org, loading, error } = useOrg();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-green-700 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Organisation introuvable</h2>
          <p className="text-gray-500 text-sm mb-4">Cette organisation n&apos;existe pas sur TOHUTOU.</p>
          <Link href="/" className="text-green-700 font-medium hover:underline text-sm">
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <OrgProvider slug={slug}>
      <AuthProvider>
        <OrgShell>{children}</OrgShell>
      </AuthProvider>
    </OrgProvider>
  );
}
