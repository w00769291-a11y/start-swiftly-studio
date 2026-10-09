import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/gaming")({
  head: () => ({
    meta: [
      { title: "Gaming — SAC COMMUNITY" },
      { name: "description", content: "Esports tournaments, LAN cups and gaming arenas across India." },
      { property: "og:title", content: "Gaming — SAC COMMUNITY" },
      { property: "og:description", content: "Esports tournaments, LAN cups and gaming arenas across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <CategoryPage cat={["Gaming"]} title="Gaming" text="Esports tournaments, LAN cups and gaming arenas across India." />,
});
