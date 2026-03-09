import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { ChatProvider } from "@/lib/chat-context";
import DevExtensionErrorShield from "@/components/system/DevExtensionErrorShield";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOHUTOU - Plateforme Ananas du Bénin",
  description:
    "Plateforme de commercialisation des ananas au Bénin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DevExtensionErrorShield />
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
