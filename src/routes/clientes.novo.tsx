import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { ClientForm, type ClientFormValues } from "@/components/client-form";
import { PageHeader } from "@/components/page-header";
import { useCreateClient, useUploadClientDocument } from "@/hooks/use-clients";

export const Route = createFileRoute("/clientes/novo")({
  head: () => ({ meta: [{ title: "Novo cliente — ENERGIZA SOLAR" }, { name: "description", content: "Cadastro de cliente." }] }),
  component: NewClientPage,
});

function NewClientPage() {
  const navigate = useNavigate({ from: "/clientes/novo" });
  const create = useCreateClient();
  const upload = useUploadClientDocument();

  async function handleSubmit(values: ClientFormValues, action: "save" | "proposal", lightBill?: File | null) {
    const client = await create.mutateAsync(values);
    if (lightBill) await upload.mutateAsync({ clientId: client.id, file: lightBill, categoria: "conta_luz" });
    if (action === "proposal") navigate({ to: "/propostas/nova", search: { clientId: client.id } });
    else navigate({ to: "/clientes/$id", params: { id: client.id } });
  }

  return <AppLayout><PageHeader title="Novo cliente" subtitle="Cadastre identificação, contato, endereço e dados de energia." /><section className="p-4 md:p-8"><ClientForm onSubmit={handleSubmit} isSubmitting={create.isPending || upload.isPending} /></section></AppLayout>;
}
