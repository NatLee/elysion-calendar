import type { Metadata } from "next";

import { SITE } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  title: `${SITE.title} · ${SITE.name}`,
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW">
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
