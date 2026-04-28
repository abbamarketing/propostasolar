import { createFileRoute } from "@tanstack/react-router";
import { ProposalWizard } from "@/components/proposal-wizard";

export const Route = createFileRoute("/propostas/$id/editar")({
  head: () => ({
    meta: [
      { title: "Editar proposta — ENERGIZA SOLAR" },
      { name: "description", content: "Continuação de rascunho de proposta solar." },
      { property: "og:title", content: "Editar proposta — ENERGIZA SOLAR" },
      { property: "og:description", content: "Continuação de rascunho de proposta solar." },
    ],
  }),
  component: EditProposalPage,
});

function EditProposalPage() {
  const { id } = Route.useParams();
  return <ProposalWizard proposalId={id} />;
}
