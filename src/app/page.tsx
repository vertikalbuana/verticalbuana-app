import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT Vertikal Buana",
  description: "Monitoring Proyek Rope Access",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}