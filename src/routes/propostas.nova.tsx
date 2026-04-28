import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { ProposalWizard } from "@/components/proposal-wizard";

const searchSchema = z.object({ clientId: z.string().optional() });

export const Route = createFileRoute("/propostas/nova")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Nova proposta — ENERGIZA SOLLAR" },
      { name: "description", content: "Wizard de criação de proposta solar." },
      { property: "og:title", content: "Nova proposta — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Wizard de criação de proposta solar." },
    ],
  }),
  component: NewProposalPage,
});

function NewProposalPage() {
  const { clientId } = Route.useSearch();
  return <ProposalWizard initialClientId={clientId} />;
}
