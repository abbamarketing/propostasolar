import { createFileRoute } from "@tanstack/react-router";
import { ConstructionPage } from "@/components/app-layout";

export const Route = createFileRoute("/propostas/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da proposta — ENERGIZA SOLLAR" },
      { name: "description", content: "Visualização, revisão e emissão de PDF." },
      { property: "og:title", content: "Detalhe da proposta — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Visualização, revisão e emissão de PDF." },
    ],
  }),
  component: () => <ConstructionPage title="Detalhe da proposta" />,
});
