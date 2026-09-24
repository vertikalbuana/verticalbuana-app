import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PT Vertikal Buana",
    short_name: "Vertikal Buana",
    description: "Monitoring proyek konstruksi PT Vertikal Buana",
    start_url: "/login",
    display: "standalone",
    background_color: "#0B1C2C",
    theme_color: "#0B1C2C",
    icons: [
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}