import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { BarChart3, Check, Copy, Download, Edit, Eye, FileDown, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { DateRangePicker } from "@/components/date-range-picker";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProposalStatusBadge, formatDate, formatMoney, statusLabels, validityText } from "@/components/proposal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useDeleteProposal, useDuplicateProposal, useProposalsList, useProposalSellers, useUpdateProposalStatus, type ProposalStatus } from "@/hooks/use-proposals";

const searchSchema = z.object({ page: z.coerce.number().catch(1), q: z.string().catch(""), status: z.string().catch(""), seller: z.string().catch(""), city: z.string().catch(""), sort: z.string().catch("updated_at"), dir: z.enum(["asc", "desc"]).catch("desc") });
const statuses = Object.keys(statusLabels) as ProposalStatus[];

export const Route = createFileRoute("/propostas")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Propostas — ENERGIZA SOLAR" }, { name: "description", content: "Listagem de propostas com filtros, busca e ações em lote." }] }),
  component: ProposalsPage,
});

function ProposalsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/propostas" });
  const [selected, setSelected] = useState<string[]>([]);
  const [range, setRange] = useState<{ from: Date; to: Date } | null>(null);
  const [valueRange, setValueRange] = useState([0, 500000]);
  const q = useDebounce(search.q, 300);
  const activeStatuses = search.status ? (search.status.split(",").filter(Boolean) as ProposalStatus[]) : [];
  const filters = useMemo(() => ({ search: q, statuses: activeStatuses, from: range?.from, to: range?.to, sellerId: search.seller || undefined, city: search.city || undefined, minValue: valueRange[0] || undefined, maxValue: valueRange[1] < 500000 ? valueRange[1] : undefined }), [q, activeStatuses.join(","), range, search.seller, search.city, valueRange]);
  const sortColumn = ["numero", "valor_total", "created_at", "updated_at", "valido_ate"].includes(search.sort) ? search.sort as any : "updated_at";
  const { data, isLoading } = useProposalsList({ filters, page: search.page, pageSize: 20, sort: { column: sortColumn, direction: search.dir } });
  const sellers = useProposalSellers();
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / 20));
  const hasFilters = Boolean(search.q || search.status || search.seller || search.city || range || valueRange[0] || valueRange[1] < 500000);

  const setSearch = (patch: Partial<typeof search>) => navigate({ search: (prev: any) => ({ ...prev, ...patch }) });
  const toggleStatus = (status: ProposalStatus) => { const next = activeStatuses.includes(status) ? activeStatuses.filter((s) => s !== status) : [...activeStatuses, status]; setSearch({ status: next.join(","), page: 1 }); };
  const toggleSort = (column: string) => setSearch({ sort: column, dir: search.sort === column && search.dir === "asc" ? "desc" : "asc" });
  const clearFilters = () => { setRange(null); setValueRange([0, 500000]); navigate({ search: { page: 1, q: "", status: "", seller: "", city: "", sort: "updated_at", dir: "desc" } }); };
  const exportCsv = () => { const csv = Papa.unparse((data?.rows ?? []).filter((p) => selected.includes(p.id)).map((p) => ({ numero: p.numero, cliente: p.clients?.nome, status: statusLabels[p.status as ProposalStatus], valor: p.valor_total, kwp: p.kwp_instalado }))); const blob = new Blob([csv], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "propostas.csv"; a.click(); URL.revokeObjectURL(url); };

  return <AppLayout><PageHeader title="Propostas" subtitle={`${data?.count ?? 0} propostas encontradas`} actions={<Button asChild><Link to="/propostas/nova"><Plus /> Nova proposta</Link></Button>} /><section className="space-y-4 p-4 md:p-8"><Card><CardContent className="space-y-4 p-4"><div className="grid gap-3 xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_1fr]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search.q} onChange={(e) => setSearch({ q: e.target.value, page: 1 })} placeholder="Buscar nº, cliente ou CPF/CNPJ" className="pl-9" /></div><div className="flex flex-wrap gap-2">{statuses.map((s) => <Button key={s} size="sm" variant={activeStatuses.includes(s) ? "default" : "outline"} onClick={() => toggleStatus(s)}>{statusLabels[s]}</Button>)}</div><DateRangePicker value={range ?? { from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() }} onChange={(r) => { setRange(r); setSearch({ page: 1 }); }} /><Select value={search.seller || "all"} onValueChange={(v) => setSearch({ seller: v === "all" ? "" : v, page: 1 })}><SelectTrigger><SelectValue placeholder="Vendedor" /></SelectTrigger><SelectContent><SelectItem value="all">Todos vendedores</SelectItem>{sellers.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent></Select><Input value={search.city} onChange={(e) => setSearch({ city: e.target.value, page: 1 })} placeholder="Cidade" /></div><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div><p className="mb-2 text-xs font-medium text-muted-foreground">Faixa de valor: {formatMoney(valueRange[0])} — {formatMoney(valueRange[1])}</p><Slider value={valueRange} min={0} max={500000} step={5000} onValueChange={setValueRange} /></div>{hasFilters ? <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button> : null}</div></CardContent></Card>{selected.length ? <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-surface p-3 text-sm"><strong>{selected.length} selecionadas</strong><Button size="sm" variant="outline" onClick={exportCsv}><FileDown /> Exportar CSV</Button><BulkStatus ids={selected} status="enviada" /><BulkDelete ids={selected} rows={data?.rows ?? []} /></div> : null}<Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead><Checkbox checked={Boolean(data?.rows?.length && selected.length === data.rows.length)} onCheckedChange={(c) => setSelected(c ? (data?.rows ?? []).map((p) => p.id) : [])} /></TableHead>{[["numero","Número"],["cliente","Cliente"],["status","Status"],["valor_total","Valor"],["kwp","kWp"],["vendedor","Vendedor"],["created_at","Criada em"],["updated_at","Atualizada"],["valido_ate","Validade"]].map(([key, label]) => <TableHead key={key} onClick={() => ["numero","valor_total","created_at","updated_at","valido_ate"].includes(key) && toggleSort(key)} className="cursor-pointer">{label}</TableHead>)}<TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={11} className="p-6">Carregando propostas...</TableCell></TableRow> : data?.rows?.length ? data.rows.map((p) => <ProposalRow key={p.id} proposal={p} selected={selected.includes(p.id)} onSelect={(checked) => setSelected((old) => checked ? [...old, p.id] : old.filter((id) => id !== p.id))} />) : <TableRow><TableCell colSpan={11}><EmptyState icon={BarChart3} title="Nenhuma proposta encontrada" description="Ajuste os filtros ou crie uma nova proposta." action={<Button asChild><Link to="/propostas/nova"><Plus /> Nova proposta</Link></Button>} /></TableCell></TableRow>}</TableBody></Table></CardContent></Card><div className="flex items-center justify-between"><Button variant="outline" disabled={search.page <= 1} onClick={() => setSearch({ page: search.page - 1 })}>Anterior</Button><span className="text-sm text-muted-foreground">Página {search.page} de {totalPages}</span><Button variant="outline" disabled={search.page >= totalPages} onClick={() => setSearch({ page: search.page + 1 })}>Próxima</Button></div></section></AppLayout>;
}

function ProposalRow({ proposal, selected, onSelect }: { proposal: any; selected: boolean; onSelect: (checked: boolean) => void }) {
  const v = validityText(proposal.status, proposal.valido_ate);
  return <TableRow><TableCell><Checkbox checked={selected} onCheckedChange={(c) => onSelect(Boolean(c))} /></TableCell><TableCell><Link to="/propostas/$id" params={{ id: proposal.id }} className="font-semibold hover:underline">{proposal.numero ?? "—"}</Link></TableCell><TableCell><div className="font-medium">{proposal.clients?.nome ?? "—"}</div><div className="text-xs text-muted-foreground">{proposal.clients?.cpf_cnpj}</div></TableCell><TableCell><ProposalStatusBadge status={proposal.status} /></TableCell><TableCell>{formatMoney(proposal.valor_total)}</TableCell><TableCell>{Number(proposal.kwp_instalado ?? 0).toFixed(2)}</TableCell><TableCell>{proposal.user_profiles?.nome ?? "—"}</TableCell><TableCell>{formatDate(proposal.created_at)}</TableCell><TableCell>{formatDate(proposal.updated_at)}</TableCell><TableCell className={v.expired ? "text-destructive" : ""}>{v.text}</TableCell><TableCell><RowActions proposal={proposal} /></TableCell></TableRow>;
}

function RowActions({ proposal }: { proposal: any }) {
  const duplicate = useDuplicateProposal(proposal.id);
  const del = useDeleteProposal();
  const update = useUpdateProposalStatus(proposal.id);
  const navigate = useNavigate();
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Ações da proposta"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Ações</DropdownMenuLabel><DropdownMenuItem onClick={() => navigate({ to: "/propostas/$id", params: { id: proposal.id } })}><Eye /> Visualizar</DropdownMenuItem>{proposal.status === "rascunho" ? <DropdownMenuItem onClick={() => navigate({ to: "/propostas/$id/editar", params: { id: proposal.id } })}><Edit /> Editar</DropdownMenuItem> : null}<DropdownMenuItem onClick={async () => { const id = await duplicate.mutateAsync(); navigate({ to: "/propostas/$id/editar", params: { id } }); }}><Copy /> Duplicar</DropdownMenuItem><DropdownMenuSeparator />{(["enviada", "aceita", "recusada"] as ProposalStatus[]).map((s) => <DropdownMenuItem key={s} onClick={() => update.mutate(s)}><Check /> Marcar como {statusLabels[s].toLowerCase()}</DropdownMenuItem>)}{proposal.pdf_url ? <DropdownMenuItem asChild><a href={proposal.pdf_url} target="_blank" rel="noreferrer"><Download /> Baixar PDF</a></DropdownMenuItem> : null}{proposal.status === "rascunho" ? <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => confirm("Excluir este rascunho?") && del.mutate(proposal.id)}><Trash2 /> Excluir</DropdownMenuItem></> : null}</DropdownMenuContent></DropdownMenu>;
}

function BulkStatus({ ids, status }: { ids: string[]; status: ProposalStatus }) {
  return <Button size="sm" variant="outline" onClick={() => ids.forEach(() => {})}><Check /> Marcar como enviadas</Button>;
}
function BulkDelete({ ids, rows }: { ids: string[]; rows: any[] }) {
  const del = useDeleteProposal();
  return <Button size="sm" variant="outline" onClick={() => rows.filter((r) => ids.includes(r.id) && r.status === "rascunho").forEach((r) => del.mutate(r.id))}><X /> Excluir rascunhos</Button>;
}
