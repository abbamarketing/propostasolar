import { createFileRoute } from "@tanstack/react-router";
import { ConstructionPage } from "@/components/app-layout";

export const Route = createFileRoute("/propostas/nova")({
  head: () => ({
    meta: [
      { title: "Nova proposta — ENERGIZA SOLLAR" },
      { name: "description", content: "Fluxo guiado para dimensionamento e precificação." },
      { property: "og:title", content: "Nova proposta — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Fluxo guiado para dimensionamento e precificação." },
    ],
  }),
  component: () => <ConstructionPage title="Nova proposta" />,
});
