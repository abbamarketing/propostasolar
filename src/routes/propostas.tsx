import { createFileRoute } from "@tanstack/react-router";
import { ConstructionPage } from "@/components/app-layout";

export const Route = createFileRoute("/propostas")({
  head: () => ({
    meta: [
      { title: "Propostas — ENERGIZA SOLLAR" },
      { name: "description", content: "Gerencie propostas comerciais geradas em PDF." },
      { property: "og:title", content: "Propostas — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Gerencie propostas comerciais geradas em PDF." },
    ],
  }),
  component: () => <ConstructionPage title="Propostas" />,
});
