import { createFileRoute } from "@tanstack/react-router";
import { ConstructionPage } from "@/components/app-layout";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — ENERGIZA SOLLAR" },
      { name: "description", content: "Cadastro e histórico dos clientes atendidos." },
      { property: "og:title", content: "Clientes — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Cadastro e histórico dos clientes atendidos." },
    ],
  }),
  component: () => <ConstructionPage title="Clientes" />,
});
