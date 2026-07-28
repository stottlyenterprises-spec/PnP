import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Progress, Not Perfection",
    short_name: "PNP",
    description: "Personal planning, health, and work in one place.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#15281f",
    categories: ["productivity", "lifestyle", "health"],
    icons: [
      {
        src: "/pnp-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
