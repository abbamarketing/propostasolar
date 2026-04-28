import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Edit, FilePlus2, MoreHorizontal, Paperclip, Trash2, Upload, UserRound } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/formatters";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient, useClientDocuments, useSoftDeleteClient, useUploadClientDocument, type DocumentCategory } from "@/hooks/use-clients";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({ meta: [{ title: "Detalhe do cliente — ENERGIZA SOLAR" }, { name: "description", content: "Dados, propostas e documentos do cliente." }] }),
  component: ClientDetailPage,
});

const categoryLabels: Record<DocumentCategory, string> = {
  conta_luz: "Conta de luz",
  rg_cnpj: "RG/CNPJ",
  comprovante_endereco: "Comprovante de endereço",
  outros: "Outros",
};

function ClientDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate({ from: "/clientes/$id" });
  const client = useClient(id);
  const remove = useSoftDeleteClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (client.isLoading) return <AppLayout><div className="p-4 md:p-8"><Skeleton className="h-56 w-full" /></div></AppLayout>;
  if (!client.data) return <AppLayout><div className="p-4 md:p-8"><EmptyState icon={UserRound} title="Cliente não encontrado" description="O cadastro pode ter sido removido." /></div></AppLayout>;

  const initials = client.data.nome.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <AppLayout>
      <div className="border-b bg-surface px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border"><AvatarFallback className="bg-primary text-xl font-black text-primary-foreground">{initials}</AvatarFallback></Avatar>
            <div><div className="mb-2 flex items-center gap-2"><Badge variant="outline">{client.data.tipo}</Badge><Badge>{client.data.proposal_count} propostas</Badge></div><h1 className="font-display text-3xl font-black text-foreground">{client.data.nome}</h1><p className="text-sm text-muted-foreground">{client.data.email ?? "Sem e-mail"} · {client.data.telefone ?? "Sem telefone"}</p></div>
          </div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link to="/clientes/$id/editar" params={{ id }}><Edit className="h-4 w-4" />Editar</Link></Button><Button asChild><Link to="/propostas/nova" search={{ clientId: id }}><FilePlus2 className="h-4 w-4" />Nova proposta</Link></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
        </div>
      </div>
      <section className="p-4 md:p-8">
        <Tabs defaultValue="dados"><TabsList className="mb-6"><TabsTrigger value="dados">Dados</TabsTrigger><TabsTrigger value="propostas">Propostas</TabsTrigger><TabsTrigger value="documentos">Documentos</TabsTrigger></TabsList><TabsContent value="dados"><DataTab id={id} client={client.data} /></TabsContent><TabsContent value="propostas"><ProposalsTab id={id} /></TabsContent><TabsContent value="documentos"><DocumentsTab id={id} /></TabsContent></Tabs>
      </section>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>O cliente será ocultado da listagem, preservando o histórico existente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={async () => { await remove.mutateAsync(id); navigate({ to: "/clientes" }); }}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </AppLayout>
  );
}

function DataTab({ id, client }: { id: string; client: NonNullable<ReturnType<typeof useClient>["data"]> }) {
  return <div className="grid gap-4 xl:grid-cols-2"><InfoCard title="Identificação" editId={id} items={[["Tipo", client.tipo], [client.tipo === "PJ" ? "Razão Social" : "Nome", client.nome], ["Nome fantasia", client.nome_fantasia], ["CPF/CNPJ", client.cpf_cnpj], ["RG/IE", client.rg_ie]]} /><InfoCard title="Contato" editId={id} items={[["E-mail", client.email], ["Telefone", client.telefone], ["WhatsApp", client.whatsapp]]} /><InfoCard title="Endereço" editId={id} items={[["CEP", client.endereco_cep], ["Logradouro", `${client.endereco_logradouro ?? ""}, ${client.endereco_numero ?? ""}`.trim()], ["Complemento", client.endereco_complemento], ["Bairro", client.endereco_bairro], ["Cidade/UF", client.endereco_cidade ? `${client.endereco_cidade}/${client.endereco_uf ?? ""}` : null]]} /><InfoCard title="Energia" editId={id} items={[["Concessionária", client.concessionaria], ["Instalação UC", client.numero_instalacao], ["Ligação", client.tipo_ligacao], ["Telhado", client.tipo_telhado], ["Conta média", client.conta_luz_media ? <Money value={client.conta_luz_media} /> : null], ["Consumo médio", client.consumo_medio_kwh ? `${client.consumo_medio_kwh} kWh/mês` : null], ["Observações", client.observacoes]]} /></div>;
}

function InfoCard({ title, editId, items }: { title: string; editId: string; items: [string, React.ReactNode][] }) {
  return <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{title}</CardTitle><Button variant="outline" size="sm" asChild><Link to="/clientes/$id/editar" params={{ id: editId }}>Editar</Link></Button></CardHeader><CardContent className="grid gap-3">{items.map(([label, value]) => <div key={label} className="grid gap-1 border-b pb-2 last:border-0"><span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span><span className="text-sm text-foreground">{value || "—"}</span></div>)}</CardContent></Card>;
}

function ProposalsTab({ id }: { id: string }) {
  return <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Propostas</CardTitle><Button asChild><Link to="/propostas/nova" search={{ clientId: id }}><FilePlus2 className="h-4 w-4" />Nova proposta</Link></Button></CardHeader><CardContent><EmptyState icon={FilePlus2} title="Sem propostas ainda" description="As propostas deste cliente aparecerão aqui no próximo módulo." /></CardContent></Card>;
}

function DocumentsTab({ id }: { id: string }) {
  const docs = useClientDocuments(id);
  const upload = useUploadClientDocument();
  const [categoria, setCategoria] = useState<DocumentCategory>("outros");
  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) await upload.mutateAsync({ clientId: id, file, categoria });
  }
  return <Card className="shadow-soft"><CardHeader className="gap-4 md:flex-row md:items-center md:justify-between"><CardTitle>Documentos</CardTitle><div className="flex flex-col gap-2 md:flex-row"><Select value={categoria} onValueChange={(value) => setCategoria(value as DocumentCategory)}><SelectTrigger className="md:w-56"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Button variant="outline" asChild><label><Upload className="h-4 w-4" />Enviar arquivos<Input type="file" multiple accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => handleFiles(event.target.files)} /></label></Button></div></CardHeader><CardContent>{docs.isLoading ? <Skeleton className="h-32 w-full" /> : (docs.data?.length ?? 0) === 0 ? <EmptyState icon={Paperclip} title="Nenhum documento enviado" description="Envie conta de luz, documentos ou comprovantes do cliente." /> : <div className="grid gap-3">{docs.data?.map((doc) => <a key={doc.id} href={doc.signedUrl ?? "#"} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"><div><p className="font-semibold text-foreground">{doc.nome_arquivo}</p><p className="text-sm text-muted-foreground">{categoryLabels[doc.categoria as DocumentCategory] ?? "Outros"} · {doc.mime_type ?? "arquivo"}</p></div><Badge variant="outline">Abrir</Badge></a>)}</div>}</CardContent></Card>;
}
