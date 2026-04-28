import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Copy, Download, Edit, FileText, MoreHorizontal, RotateCcw, Trash2, SearchX } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { EmptyState } from "@/components/empty-state";
import { ProposalStatusBadge, formatDate, formatMoney } from "@/components/proposal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteProposal, useDuplicateProposal, useProposal, useProposalEvents, useUpdateProposalStatus, type ProposalStatus } from "@/hooks/use-proposals";

export const Route = createFileRoute("/propostas/$id")({
  head: () => ({ meta: [{ title: "Detalhe da proposta — ENERGIZA SOLLAR" }, { name: "description", content: "Detalhe completo da proposta comercial." }] }),
  component: ProposalDetailPage,
});

function ProposalDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const proposal = useProposal(id);
  const events = useProposalEvents(id);
  const duplicate = useDuplicateProposal(id);
  const del = useDeleteProposal();
  const update = useUpdateProposalStatus(id);

  useEffect(() => {
    if (proposal.data?.status === "rascunho") navigate({ to: "/propostas/$id/editar", params: { id }, replace: true });
  }, [proposal.data?.status, id, navigate]);

  if (proposal.isLoading) return <AppLayout><section className="space-y-4 p-4 md:p-8"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></section></AppLayout>;
  if (!proposal.data) return <AppLayout><EmptyState icon={SearchX} title="Proposta não encontrada" description="Ela pode ter sido removida ou você não tem acesso." /></AppLayout>;
  const p = proposal.data;

  const copy = async (label: string, value?: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
  };

  return <AppLayout><section className="space-y-6 p-4 md:p-8"><header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><Button asChild variant="outline" size="icon" aria-label="Voltar"><Link to="/propostas"><ArrowLeft /></Link></Button><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black">{p.numero ?? "Proposta"}</h1><ProposalStatusBadge status={p.status} /></div><p className="text-sm text-muted-foreground">{p.clients?.nome ?? "Cliente"}</p></div></div><div className="flex gap-2">{p.status === "rascunho" ? <Button asChild variant="outline"><Link to="/propostas/$id/editar" params={{ id }}><Edit /> Editar</Link></Button> : null}{p.pdf_url ? <Button asChild><a href={p.pdf_url} target="_blank" rel="noreferrer"><Download /> Baixar PDF</a></Button> : null}<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Mais ações"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Ações</DropdownMenuLabel><DropdownMenuItem onClick={async () => { const newId = await duplicate.mutateAsync(); navigate({ to: "/propostas/$id/editar", params: { id: newId } }); }}><Copy /> Duplicar</DropdownMenuItem>{(["enviada", "negociacao", "aceita", "recusada"] as ProposalStatus[]).map((s) => <DropdownMenuItem key={s} onClick={() => update.mutate(s)}><RotateCcw /> Marcar {s}</DropdownMenuItem>)}<DropdownMenuSeparator />{p.status === "rascunho" ? <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm("Excluir este rascunho?")) del.mutate(id, { onSuccess: () => navigate({ to: "/propostas" }) }); }}><Trash2 /> Excluir</DropdownMenuItem> : null}</DropdownMenuContent></DropdownMenu></div></header><div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]"><div className="space-y-6"><Card><CardHeader><CardTitle>Cliente</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Info label="Nome" value={p.clients?.nome} /><Info label="CPF/CNPJ" value={p.clients?.cpf_cnpj} /><Info label="Cidade" value={`${p.clients?.endereco_cidade ?? p.cidade_projeto ?? "—"}/${p.clients?.endereco_uf ?? p.uf_projeto ?? ""}`} /><Info label="Consumo médio" value={`${Number(p.consumo_estimado_kwh ?? p.clients?.consumo_medio_kwh ?? 0).toFixed(0)} kWh/mês`} /></CardContent></Card><Card><CardHeader><CardTitle>Sistema dimensionado</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Info label="Potência" value={`${Number(p.kwp_instalado ?? 0).toFixed(2)} kWp`} /><Info label="Geração mensal" value={`${Number(p.geracao_estimada_mensal ?? 0).toFixed(0)} kWh`} /><Info label="Módulos" value={`${p.qtd_modulos ?? 0}x ${p.modulo_marca ?? ""} ${p.modulo_modelo ?? ""}`} /><Info label="Inversor" value={`${p.inversor_marca ?? ""} ${p.inversor_modelo ?? ""}`} /></CardContent></Card><Card><CardHeader><CardTitle>Investimento</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Info label="Valor total" value={formatMoney(p.valor_total)} /><Info label="Economia mensal" value={formatMoney(p.economia_mensal)} /><Info label="Payback" value={`${Number(p.payback_anos ?? 0).toFixed(1)} anos`} /><Info label="Financiamentos" value={`${p.proposal_financing_options?.length ?? 0} opções`} /></CardContent></Card><Card><CardHeader><CardTitle>Personalização</CardTitle></CardHeader><CardContent className="space-y-4"><Info label="Template" value={p.template} /><Info label="Observações" value={p.observacoes_comerciais || "—"} />{p.proposal_photos?.length ? <div className="grid grid-cols-3 gap-2">{p.proposal_photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.legenda ?? "Foto de projeto similar"} className="aspect-video rounded-lg object-cover" />)}</div> : null}</CardContent></Card></div><aside className="space-y-6"><Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="rounded-lg bg-surface p-3">Criada em {formatDate(p.created_at)} por {p.user_profiles?.nome ?? "—"}</div>{p.enviada_em ? <div className="rounded-lg bg-surface p-3">Enviada em {formatDate(p.enviada_em)}</div> : null}{p.aceita_em ? <div className="rounded-lg bg-surface p-3">Aceita em {formatDate(p.aceita_em)}</div> : null}{p.recusada_em ? <div className="rounded-lg bg-surface p-3">Recusada em {formatDate(p.recusada_em)}</div> : null}{events.data?.map((e: any) => <div key={e.id} className="rounded-lg bg-surface p-3">Status: {e.from_status ?? "—"} → {e.to_status}<br /><span className="text-muted-foreground">{formatDate(e.created_at)}</span></div>)}</CardContent></Card><Card><CardHeader><CardTitle>PDF disponível</CardTitle></CardHeader><CardContent className="space-y-2">{p.pdf_url ? <><Button asChild className="w-full"><a href={p.pdf_url} target="_blank" rel="noreferrer"><Download /> Baixar PDF</a></Button><Button asChild variant="outline" className="w-full"><a href={p.pdf_url} target="_blank" rel="noreferrer"><FileText /> Visualizar PDF</a></Button></> : <p className="text-sm text-muted-foreground">PDF ainda não salvo.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Contatos copiáveis</CardTitle></CardHeader><CardContent className="space-y-2"><CopyLine label="Telefone" value={p.clients?.telefone} onCopy={copy} /><CopyLine label="WhatsApp" value={p.clients?.whatsapp} onCopy={copy} /><CopyLine label="E-mail" value={p.clients?.email} onCopy={copy} /></CardContent></Card></aside></div></section></AppLayout>;
}

function Info({ label, value }: { label: string; value?: string | number | null }) { return <div><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value || "—"}</p></div>; }
function CopyLine({ label, value, onCopy }: { label: string; value?: string | null; onCopy: (label: string, value?: string | null) => void }) { return <div className="flex items-center justify-between gap-2 rounded-lg border p-3"><div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value || "—"}</p></div><Button size="icon" variant="ghost" disabled={!value} onClick={() => onCopy(label, value)} aria-label={`Copiar ${label}`}><Copy /></Button></div>; }
