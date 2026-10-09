import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/site/CategoryPage";

export const Route = createFileRoute("/culture")({
  head: () => ({
    meta: [
      { title: "Culture — SAC COMMUNITY" },
      { name: "description", content: "Traditions, heritage and cultural experiences near you." },
      { property: "og:title", content: "Culture — SAC COMMUNITY" },
      { property: "og:description", content: "Traditions, heritage and cultural experiences near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <CategoryPage cat={["Culture", "Festivals"]} title="Culture" text="Traditions, heritage and cultural experiences near you." />,
});
