import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { ClientForm, type ClientFormValues } from "@/components/client-form";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient, useUpdateClient, useUploadClientDocument } from "@/hooks/use-clients";

export const Route = createFileRoute("/clientes/$id/editar")({
  head: () => ({ meta: [{ title: "Editar cliente — ENERGIZA SOLLAR" }, { name: "description", content: "Edição de dados do cliente." }] }),
  component: EditClientPage,
});

function EditClientPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate({ from: "/clientes/$id/editar" });
  const client = useClient(id);
  const update = useUpdateClient();
  const upload = useUploadClientDocument();

  async function handleSubmit(values: ClientFormValues, _action: "save" | "proposal", lightBill?: File | null) {
    await update.mutateAsync({ id, ...values });
    if (lightBill) await upload.mutateAsync({ clientId: id, file: lightBill, categoria: "conta_luz" });
    navigate({ to: "/clientes/$id", params: { id } });
  }

  return (
    <AppLayout>
      <PageHeader title="Editar cliente" subtitle="Atualize os dados cadastrais e comerciais." />
      <section className="p-4 md:p-8">
        {client.isLoading ? <Skeleton className="h-96 w-full" /> : client.data ? <ClientForm initialData={client.data} onSubmit={handleSubmit} isSubmitting={update.isPending || upload.isPending} /> : null}
      </section>
    </AppLayout>
  );
}
