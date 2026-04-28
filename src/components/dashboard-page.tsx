import { Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, DollarSign, Download, Eye, FileText, Plus, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { DateRangePicker, defaultMonthRange } from "@/components/date-range-picker";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProposalStatusBadge, formatDate, formatMoney, statusLabels } from "@/components/proposal-shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardMetrics } from "@/hooks/use-proposals";

const COLORS = ["var(--muted-foreground)", "var(--chart-2)", "var(--accent)", "var(--success)", "var(--destructive)", "var(--muted-foreground)"];

function Trend({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={positive ? "inline-flex items-center gap-1 text-success" : "inline-flex items-center gap-1 text-destructive"}><Icon className="h-3.5 w-3.5" />{Math.abs(value).toFixed(0)}%</span>;
}

function Kpi({ title, value, subtitle, icon: Icon, change }: { title: string; value: string | number; subtitle: React.ReactNode; icon: any; change?: number }) {
  return <Card className="shadow-soft"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-muted-foreground">{title}</p><div className="mt-2 text-3xl font-black text-foreground">{value}</div></div><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon /></div></div><div className="mt-4 flex items-center justify-between text-sm"><span className="text-muted-foreground">{subtitle}</span>{change != null ? <Trend value={change} /> : null}</div></CardContent></Card>;
}

export function DashboardPage() {
  const [range, setRange] = useState(defaultMonthRange());
  const { data, isLoading, error } = useDashboardMetrics(range);
  return (
    <AppLayout>
      <PageHeader title="Dashboard" subtitle="KPIs vivos da operação comercial." actions={<div className="flex flex-wrap gap-2"><DateRangePicker value={range} onChange={setRange} /><Button asChild><Link to="/propostas/nova"><Plus /> Nova proposta</Link></Button></div>} />
      <section className="space-y-6 p-4 md:p-8">
        {error ? <Card><CardContent className="p-6 text-sm text-destructive">Algo deu errado ao carregar o dashboard.</CardContent></Card> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading || !data ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />) : <>
            <Kpi title="Propostas emitidas" value={data.kpis.issued.value} subtitle="vs. período anterior" icon={FileText} change={data.kpis.issued.change} />
            <Kpi title="Valor total emitido" value={formatMoney(data.kpis.total.value)} subtitle="vs. período anterior" icon={DollarSign} change={data.kpis.total.change} />
            <Kpi title="Taxa de conversão" value={`${(data.kpis.conversion.value * 100).toFixed(1)}%`} subtitle={`${data.kpis.conversion.accepted} de ${data.kpis.conversion.total} aceitas`} icon={TrendingUp} />
            <Kpi title="Ticket médio" value={formatMoney(data.kpis.averageTicket.value)} subtitle="vs. período anterior" icon={Target} change={data.kpis.averageTicket.change} />
          </>}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
          <Card className="shadow-soft"><CardHeader><CardTitle>Propostas por status</CardTitle></CardHeader><CardContent className="h-80">{data?.byStatus?.some((x) => x.total) ? <ResponsiveContainer><PieChart><Pie data={data.byStatus} dataKey="total" nameKey="status" innerRadius={70} outerRadius={105}>{data.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={(v, n) => [v, statusLabels[n as keyof typeof statusLabels] ?? n]} /></PieChart></ResponsiveContainer> : <EmptyState title="Sem dados no período" description="As propostas aparecerão aqui conforme forem criadas." />}</CardContent></Card>
          <Card className="shadow-soft"><CardHeader><CardTitle>Evolução mensal</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer><LineChart data={data?.monthly ?? []}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="mes" /><YAxis tickFormatter={(v) => `R$${Number(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v) => formatMoney(Number(v))} /><Line dataKey="emitido" name="Valor emitido" stroke="var(--chart-2)" strokeWidth={3} /><Line dataKey="aceito" name="Valor aceito" stroke="var(--success)" strokeWidth={3} /></LineChart></ResponsiveContainer></CardContent></Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <Card className="shadow-soft"><CardHeader><CardTitle>Top vendedores</CardTitle></CardHeader><CardContent className="h-80">{data?.topSellers?.length ? <ResponsiveContainer><BarChart data={data.topSellers} layout="vertical" margin={{ left: 20 }}><XAxis type="number" hide /><YAxis type="category" dataKey="nome" width={120} /><Tooltip formatter={(v) => formatMoney(Number(v))} /><Bar dataKey="valor" fill="var(--primary)" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer> : <EmptyState title="Sem vendas aceitas" description="O ranking aparece quando houver propostas aceitas." />}</CardContent></Card>
          <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Últimas propostas</CardTitle><Button asChild variant="outline" size="sm"><Link to="/propostas">Ver todas</Link></Button></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead>kWp</TableHead><TableHead>Vendedor</TableHead><TableHead>Atualizada</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader><TableBody>{data?.latest?.length ? data.latest.map((p) => <TableRow key={p.id} className="cursor-pointer"><TableCell><Link to="/propostas/$id" params={{ id: p.id }} className="font-semibold">{p.numero ?? "—"}</Link></TableCell><TableCell>{p.clients?.nome ?? "—"}</TableCell><TableCell><ProposalStatusBadge status={p.status} /></TableCell><TableCell>{formatMoney(p.valor_total)}</TableCell><TableCell>{Number(p.kwp_instalado ?? 0).toFixed(2)}</TableCell><TableCell>{p.user_profiles?.nome ?? "—"}</TableCell><TableCell>{formatDate(p.updated_at)}</TableCell><TableCell><div className="flex gap-1"><Button asChild size="icon" variant="ghost" aria-label="Ver proposta"><Link to="/propostas/$id" params={{ id: p.id }}><Eye /></Link></Button>{p.pdf_url ? <Button asChild size="icon" variant="ghost" aria-label="Baixar PDF"><a href={p.pdf_url} target="_blank" rel="noreferrer"><Download /></a></Button> : null}</div></TableCell></TableRow>) : <TableRow><TableCell colSpan={8}><EmptyState title="Nenhuma proposta ainda" description="Crie a primeira proposta para iniciar os indicadores." action={<Button asChild><Link to="/propostas/nova"><Plus /> Nova proposta</Link></Button>} /></TableCell></TableRow>}</TableBody></Table></CardContent></Card>
        </div>
      </section>
    </AppLayout>
  );
}
