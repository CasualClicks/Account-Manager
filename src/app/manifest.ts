import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ledgerly — Account manager",
    short_name: "Ledgerly",
    description: "A calm, clear home for your business accounts.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7f4",
    theme_color: "#f6f7f4",
  };
}
