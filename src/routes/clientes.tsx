import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Edit, Eye, FilePlus2, Search, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { concessionarias, useClients, useSoftDeleteClient, type ClientWithProposalCount } from "@/hooks/use-clients";
import { useDebounce } from "@/hooks/use-debounce";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — ENERGIZA SOLAR" },
      { name: "description", content: "Cadastro e histórico dos clientes atendidos." },
      { property: "og:title", content: "Clientes — ENERGIZA SOLAR" },
      { property: "og:description", content: "Cadastro e histórico dos clientes atendidos." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const location = useLocation();
  const navigate = useNavigate({ from: "/clientes" });
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<"todos" | "PF" | "PJ">("todos");
  const [cidade, setCidade] = useState("");
  const [concessionaria, setConcessionaria] = useState("todas");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<ClientWithProposalCount | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const debouncedCidade = useDebounce(cidade, 300);
  const clients = useClients({ search: debouncedSearch, tipo, cidade: debouncedCidade, concessionaria, page });
  const remove = useSoftDeleteClient();
  const totalPages = Math.max(1, Math.ceil((clients.data?.total ?? 0) / (clients.data?.pageSize ?? 20)));
  const cityOptions = useMemo(() => Array.from(new Set((clients.data?.rows ?? []).map((client) => client.endereco_cidade).filter(Boolean))) as string[], [clients.data?.rows]);

  function resetPage(callback: () => void) {
    setPage(1);
    callback();
  }

  if (location.pathname !== "/clientes") return <Outlet />;

  return (
    <AppLayout>
      <PageHeader title="Clientes" subtitle="Gerencie dados cadastrais, energia e documentos dos clientes." actions={<Button asChild><Link to="/clientes/novo"><UserPlus className="h-4 w-4" />Novo cliente</Link></Button>} />
      <section className="p-4 md:p-8">
        <Card className="shadow-soft">
          <CardHeader className="gap-4">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_.5fr_.7fr_.7fr]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Buscar por nome, CPF/CNPJ, e-mail ou telefone" className="pl-9" />
              </div>
              <Select value={tipo} onValueChange={(value) => resetPage(() => setTipo(value as "todos" | "PF" | "PJ"))}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="PF">PF</SelectItem><SelectItem value="PJ">PJ</SelectItem></SelectContent>
              </Select>
              <div>
                <Input list="client-cities" value={cidade} onChange={(event) => resetPage(() => setCidade(event.target.value))} placeholder="Cidade" />
                <datalist id="client-cities">{cityOptions.map((option) => <option key={option} value={option} />)}</datalist>
              </div>
              <Select value={concessionaria} onValueChange={(value) => resetPage(() => setConcessionaria(value))}>
                <SelectTrigger><SelectValue placeholder="Concessionária" /></SelectTrigger>
                <SelectContent><SelectItem value="todas">Todas</SelectItem>{concessionarias.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {clients.isLoading ? <LoadingRows /> : (clients.data?.rows.length ?? 0) === 0 ? <EmptyState icon={UserPlus} title="Nenhum cliente cadastrado ainda" description="Crie o primeiro cliente para iniciar o histórico comercial." action={<Button asChild><Link to="/clientes/novo">Novo cliente</Link></Button>} /> : (
              <div className="space-y-4 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CPF/CNPJ</TableHead><TableHead>Tipo</TableHead><TableHead>Cidade/UF</TableHead><TableHead>Concessionária</TableHead><TableHead>Telefone</TableHead><TableHead>Propostas</TableHead><TableHead>Última atividade</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>{clients.data?.rows.map((client) => <ClientRowView key={client.id} client={client} onDelete={() => setDeleting(client)} />)}</TableBody>
                </Table>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>Página {page} de {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima</Button></div></div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>O cliente será ocultado da listagem, preservando o histórico existente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={async () => { if (deleting) await remove.mutateAsync(deleting.id); setDeleting(null); }}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function ClientRowView({ client, onDelete }: { client: ClientWithProposalCount; onDelete: () => void }) {
  const navigate = useNavigate();
  const proposalTone = client.proposal_count > 0 ? "default" : "secondary";
  return <TableRow className="cursor-pointer" onClick={() => navigate({ to: "/clientes/$id", params: { id: client.id } })}><TableCell className="font-semibold">{client.nome}</TableCell><TableCell>{client.cpf_cnpj}</TableCell><TableCell><Badge variant="outline">{client.tipo}</Badge></TableCell><TableCell>{client.endereco_cidade ? `${client.endereco_cidade}/${client.endereco_uf ?? ""}` : "—"}</TableCell><TableCell>{client.concessionaria ?? "—"}</TableCell><TableCell>{client.telefone ?? "—"}</TableCell><TableCell><Badge variant={proposalTone}>{client.proposal_count}</Badge></TableCell><TableCell>{new Date(client.last_activity ?? client.updated_at).toLocaleDateString("pt-BR")}</TableCell><TableCell className="text-right" onClick={(event) => event.stopPropagation()}><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" asChild aria-label="Ver cliente"><Link to="/clientes/$id" params={{ id: client.id }}><Eye className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" asChild aria-label="Editar cliente"><Link to="/clientes/$id/editar" params={{ id: client.id }}><Edit className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" asChild aria-label="Nova proposta"><Link to="/propostas/nova" search={{ clientId: client.id }}><FilePlus2 className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" onClick={onDelete} aria-label="Excluir cliente"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>;
}

function LoadingRows() { return <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>; }
