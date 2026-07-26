import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Progress, Not Perfection",
    short_name: "PNP",
    description: "A calm personal operating system for forward motion.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0e7",
    theme_color: "#15281f",
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
