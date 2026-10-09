import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "Sports — SAC COMMUNITY" },
      { name: "description", content: "Championships, leagues, fixtures and results from every ground in India." },
      { property: "og:title", content: "Sports — SAC COMMUNITY" },
      { property: "og:description", content: "Championships, leagues, fixtures and results from every ground in India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <CategoryPage cat={["Sports"]} title="Sports" text="Championships, leagues, fixtures and results from every ground in India." />,
});
