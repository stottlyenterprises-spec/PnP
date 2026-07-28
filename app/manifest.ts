import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "D.E.E.D.S. | Progress, Not Perfection",
    short_name: "D.E.E.D.S.",
    description: "Detect, explore, enable, drive, and sustain progress.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#15281f",
    categories: ["productivity", "lifestyle", "health"],
    icons: [
      {
        src: "/deeds-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
