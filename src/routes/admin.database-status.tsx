import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Database, ShieldAlert } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

type StatusRow = {
  label: string;
  count: number;
};

export const Route = createFileRoute("/admin/database-status")({
  head: () => ({
    meta: [
      { title: "Status do Banco — ENERGIZA SOLAR" },
      { name: "description", content: "Validação administrativa das tabelas e dados iniciais." },
      { property: "og:title", content: "Status do Banco — ENERGIZA SOLAR" },
      { property: "og:description", content: "Contagens de registros para confirmar a configuração inicial." },
    ],
  }),
  component: DatabaseStatusPage,
});

async function countRows(label: string, loader: () => Promise<{ count: number | null }>): Promise<StatusRow> {
  const result = await loader();
  return { label, count: result.count ?? 0 };
}

async function getTableCounts(): Promise<StatusRow[]> {
  const loaders = [
    countRows("companies", async () => {
      const { count, error } = await supabase.from("companies").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("user_profiles", async () => {
      const { count, error } = await supabase.from("user_profiles").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("user_roles", async () => {
      const { count, error } = await supabase.from("user_roles").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("clients", async () => {
      const { count, error } = await supabase.from("clients").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("products_modules", async () => {
      const { count, error } = await supabase.from("products_modules").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("products_inverters", async () => {
      const { count, error } = await supabase.from("products_inverters").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("cities_irradiance", async () => {
      const { count, error } = await supabase.from("cities_irradiance").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("tariffs", async () => {
      const { count, error } = await supabase.from("tariffs").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("structure_costs", async () => {
      const { count, error } = await supabase.from("structure_costs").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("proposals", async () => {
      const { count, error } = await supabase.from("proposals").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("proposal_items", async () => {
      const { count, error } = await supabase.from("proposal_items").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("proposal_financing_options", async () => {
      const { count, error } = await supabase.from("proposal_financing_options").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
    countRows("proposal_photos", async () => {
      const { count, error } = await supabase.from("proposal_photos").select("id", { count: "exact", head: true });
      if (error) throw error;
      return { count };
    }),
  ];

  return Promise.all(loaders);
}

async function getIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("role", "admin").maybeSingle();
  if (error) throw error;
  return data?.role === "admin";
}

function DatabaseStatusPage() {
  const adminQuery = useQuery({ queryKey: ["admin-role"], queryFn: getIsAdmin });
  const countsQuery = useQuery({
    queryKey: ["database-status"],
    queryFn: getTableCounts,
    enabled: adminQuery.data === true,
  });

  return (
    <AppLayout>
      <PageHeader
        title="Status do banco"
        subtitle="Contagem de registros para validar tabelas, permissões e dados iniciais."
      />
      <section className="p-4 md:p-8">
        {adminQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : adminQuery.data !== true ? (
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <ShieldAlert className="mb-4 h-12 w-12 text-destructive" />
              <h2 className="text-xl font-black text-foreground">Acesso restrito</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Esta página é exclusiva para administradores da ENERGIZA SOLAR.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <Database className="h-5 w-5 text-primary" />
                Tabelas configuradas
              </CardTitle>
              <Badge variant="secondary">Admin</Badge>
            </CardHeader>
            <CardContent>
              {countsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : countsQuery.isError ? (
                <p className="text-sm text-destructive">Não foi possível carregar as contagens.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela</TableHead>
                      <TableHead className="text-right">Linhas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countsQuery.data?.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right font-display text-lg font-black">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </AppLayout>
  );
}
