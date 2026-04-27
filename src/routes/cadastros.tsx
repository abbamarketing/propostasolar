import { createFileRoute } from "@tanstack/react-router";
import { ConstructionPage } from "@/components/app-layout";

export const Route = createFileRoute("/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros — ENERGIZA SOLLAR" },
      { name: "description", content: "Módulos, inversores, cidades e tarifas." },
      { property: "og:title", content: "Cadastros — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Módulos, inversores, cidades e tarifas." },
    ],
  }),
  component: () => <ConstructionPage title="Cadastros" />,
});
