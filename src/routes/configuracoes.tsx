import { createFileRoute } from "@tanstack/react-router";
import { ConstructionPage } from "@/components/app-layout";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — ENERGIZA SOLLAR" },
      { name: "description", content: "Preferências da empresa, usuários e proposta." },
      { property: "og:title", content: "Configurações — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Preferências da empresa, usuários e proposta." },
    ],
  }),
  component: () => <ConstructionPage title="Configurações" />,
});
