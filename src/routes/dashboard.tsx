import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/dashboard-page";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ENERGIZA SOLLAR" },
      { name: "description", content: "Indicadores comerciais mockados da operação de propostas solares." },
      { property: "og:title", content: "Dashboard — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Acompanhe propostas, conversão e ticket médio da operação solar." },
    ],
  }),
  component: DashboardPage,
});
