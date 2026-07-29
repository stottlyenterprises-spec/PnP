import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const appManifest: MetadataRoute.Manifest & {
    share_target: {
      action: string;
      method: "GET";
      enctype: "application/x-www-form-urlencoded";
      params: { title: string; text: string; url: string };
    };
  } = {
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
    shortcuts: [
      {
        name: "Create a task",
        short_name: "New task",
        description: "Capture a task in D.E.E.D.S.",
        url: "/?capture=task",
      },
      {
        name: "Start a check-in",
        short_name: "Check in",
        description: "Open the current D.E.E.D.S. interview.",
        url: "/?period=breakfast",
      },
      {
        name: "Write in Journal",
        short_name: "Journal",
        description: "Capture a journal entry in D.E.E.D.S.",
        url: "/?capture=journal",
      },
    ],
    share_target: {
      action: "/?share=1",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
    icons: [
      {
        src: "/deeds-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
  return appManifest;
}
