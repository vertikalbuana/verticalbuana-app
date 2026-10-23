import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PT Vertikal Buana",
  description: "Monitoring Proyek Rope Access",
};

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}