import { Link } from "@tanstack/react-router";
import { BarChart3, CircleDollarSign, FileText, Plus, Target, WalletCards } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { EmptyState } from "@/components/empty-state";
import { Money, Percent } from "@/components/formatters";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const kpis = [
  {
    title: "Propostas no mês",
    icon: FileText,
    value: 12,
    subtitle: "Abril de 2026",
    trend: "+18%",
  },
  {
    title: "Valor total emitido",
    icon: CircleDollarSign,
    value: <Money value={286450} />,
    subtitle: "Propostas enviadas",
    trend: "+24%",
  },
  {
    title: "Taxa de conversão",
    icon: Target,
    value: <Percent value={0.375} />,
    subtitle: "Média mockada",
    trend: "+6%",
  },
  {
    title: "Ticket médio",
    icon: WalletCards,
    value: <Money value={23870.83} />,
    subtitle: "Por proposta",
    trend: "+11%",
  },
] as const;

export function DashboardPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Acompanhe o funil comercial e comece novas propostas fotovoltaicas."
        actions={
          <Button asChild>
            <Link to="/propostas/nova">
              <Plus className="h-4 w-4" />
              Nova proposta
            </Link>
          </Button>
        }
      />
      <section className="space-y-6 p-4 md:p-8">
        <div className="sun-sweep solar-grid rounded-xl border bg-surface p-6 shadow-soft">
          <div className="relative max-w-3xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-wide text-primary">ENERGIZA SOLLAR LTDA</p>
            <h2 className="font-display text-2xl font-black tracking-normal text-foreground md:text-4xl">
              Propostas solares profissionais, rápidas e padronizadas.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Dados mockados enquanto a autenticação, banco e storage são conectados nas próximas etapas.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-black">Últimas propostas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Histórico recente de propostas comerciais.</p>
            </div>
            <Skeleton className="hidden h-9 w-28 md:block" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <td colSpan={5} className="p-0">
                    <EmptyState
                      icon={BarChart3}
                      title="Nenhuma proposta ainda"
                      description="Crie a primeira proposta para iniciar o acompanhamento comercial da operação."
                      action={
                        <Button asChild variant="solar">
                          <Link to="/propostas/nova">
                            <Plus className="h-4 w-4" />
                            Criar primeira proposta
                          </Link>
                        </Button>
                      }
                    />
                  </td>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
