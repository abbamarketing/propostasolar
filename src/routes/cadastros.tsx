import { zodResolver } from "@hookform/resolvers/zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Cpu, MapPin, PanelTop, PlugZap, Receipt, Warehouse } from "lucide-react";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AppLayout } from "@/components/app-layout";
import { CrudTable } from "@/components/crud-table";
import { Money } from "@/components/formatters";
import { MoneyInput } from "@/components/inputs/money-input";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useCities,
  useCreateCity,
  useCreateInverter,
  useCreateModule,
  useCreateStructure,
  useCreateTariff,
  useDeleteCity,
  useDeleteInverter,
  useDeleteModule,
  useDeleteStructure,
  useDeleteTariff,
  useImportCities,
  useInverters,
  useModules,
  useStructures,
  useTariffs,
  useUpdateCity,
  useUpdateInverter,
  useUpdateModule,
  useUpdateStructure,
  useUpdateTariff,
} from "@/hooks/use-catalog-data";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const tabs = ["modulos", "inversores", "estruturas", "cidades", "tarifas"] as const;
type CatalogTab = (typeof tabs)[number];
const tabLabels: Record<CatalogTab, string> = {
  modulos: "Módulos",
  inversores: "Inversores",
  estruturas: "Estruturas",
  cidades: "Cidades & HSP",
  tarifas: "Tarifas",
};

const searchSchema = z.object({ tab: fallback(z.enum(tabs), "modulos").default("modulos") });

export const Route = createFileRoute("/cadastros")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Cadastros — ENERGIZA SOLLAR" },
      { name: "description", content: "Cadastros administrativos de equipamentos, HSP e tarifas." },
      { property: "og:title", content: "Cadastros — ENERGIZA SOLLAR" },
      { property: "og:description", content: "Mantenha o catálogo base para propostas solares." },
    ],
  }),
  component: CadastrosPage,
});

type ModuleRow = Awaited<ReturnType<typeof supabase.from<"products_modules">>>;
type Module = NonNullable<Awaited<ReturnType<typeof useModules>>["data"]>[number];
type Inverter = NonNullable<Awaited<ReturnType<typeof useInverters>>["data"]>[number];
type Structure = NonNullable<Awaited<ReturnType<typeof useStructures>>["data"]>[number];
type City = NonNullable<Awaited<ReturnType<typeof useCities>>["data"]>[number];
type Tariff = NonNullable<Awaited<ReturnType<typeof useTariffs>>["data"]>[number];

const numberFromInput = z.coerce.number({ invalid_type_error: "Informe um número válido." });
const moduleSchema = z.object({
  id: z.string().optional(),
  marca: z.string().min(2, "Informe pelo menos 2 caracteres."),
  modelo: z.string().min(2, "Informe pelo menos 2 caracteres."),
  potencia_w: numberFromInput.int("Informe um número inteiro.").min(100, "Mínimo 100 W.").max(700, "Máximo 700 W."),
  tecnologia: z.string().min(1, "Selecione a tecnologia."),
  eficiencia_pct: numberFromInput.min(10, "Mínimo 10%.").max(25, "Máximo 25%."),
  garantia_produto_anos: numberFromInput.int().min(1).default(12),
  garantia_geracao_anos: numberFromInput.int().min(1).default(25),
  preco_custo: numberFromInput.positive("Informe um valor maior que zero."),
  preco_venda: numberFromInput.positive("Informe um valor maior que zero."),
  ativo: z.boolean().default(true),
}).refine((data) => data.preco_venda > data.preco_custo, { path: ["preco_venda"], message: "Preço de venda deve ser maior que o custo." });

const inverterSchema = z.object({
  id: z.string().optional(),
  marca: z.string().min(2, "Informe pelo menos 2 caracteres."),
  modelo: z.string().min(2, "Informe pelo menos 2 caracteres."),
  potencia_kw: numberFromInput.min(0.5, "Mínimo 0,5 kW.").max(500, "Máximo 500 kW."),
  mppts: numberFromInput.int().min(1).max(12).default(2),
  fases: z.enum(["mono", "bi", "tri"], { required_error: "Selecione as fases." }),
  tipo: z.enum(["string", "microinversor", "hibrido"], { required_error: "Selecione o tipo." }),
  garantia_anos: numberFromInput.int().min(1).default(10),
  preco_custo: numberFromInput.positive("Informe um valor maior que zero."),
  preco_venda: numberFromInput.positive("Informe um valor maior que zero."),
  ativo: z.boolean().default(true),
}).refine((data) => data.preco_venda > data.preco_custo, { path: ["preco_venda"], message: "Preço de venda deve ser maior que o custo." });

const structureSchema = z.object({
  id: z.string().optional(),
  tipo_telhado: z.string().min(1, "Selecione o tipo de telhado."),
  placas_min: numberFromInput.int().min(1, "Mínimo 1 placa."),
  placas_max: numberFromInput.int().min(1, "Mínimo 1 placa."),
  custo_por_placa: numberFromInput.positive("Informe um valor maior que zero."),
}).refine((data) => data.placas_max > data.placas_min, { path: ["placas_max"], message: "Máximo deve ser maior que mínimo." });

const monthlyFields = ["hsp_jan", "hsp_fev", "hsp_mar", "hsp_abr", "hsp_mai", "hsp_jun", "hsp_jul", "hsp_ago", "hsp_set", "hsp_out", "hsp_nov", "hsp_dez"] as const;
const citySchema = z.object({
  id: z.string().optional(),
  cidade: z.string().min(2, "Informe a cidade."),
  uf: z.string().length(2, "Selecione a UF."),
  hsp_medio: numberFromInput.min(3, "Mínimo 3,0.").max(7.5, "Máximo 7,5."),
  hsp_jan: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_fev: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_mar: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_abr: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_mai: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_jun: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_jul: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_ago: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_set: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_out: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_nov: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
  hsp_dez: numberFromInput.min(3).max(7.5).optional().or(z.literal("").transform(() => undefined)),
});

const tariffSchema = z.object({
  id: z.string().optional(),
  concessionaria: z.string().min(2, "Informe a concessionária."),
  uf: z.string().length(2, "Selecione a UF."),
  classe: z.enum(["residencial", "comercial", "rural", "industrial"], { required_error: "Selecione a classe." }),
  subgrupo: z.string().optional(),
  valor_kwh: numberFromInput.min(0.3, "Mínimo R$ 0,30.").max(2.5, "Máximo R$ 2,50."),
  bandeira_atual: z.enum(["verde", "amarela", "vermelha1", "vermelha2"], { required_error: "Selecione a bandeira." }),
  atualizado_em: z.date({ required_error: "Selecione a data." }),
});

type ModuleForm = z.infer<typeof moduleSchema>;
type InverterForm = z.infer<typeof inverterSchema>;
type StructureForm = z.infer<typeof structureSchema>;
type CityForm = z.infer<typeof citySchema>;
type TariffForm = z.infer<typeof tariffSchema>;

const estados = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const tecnologias = ["Monocristalino", "Policristalino", "Bifacial", "PERC", "TopCon", "Outro"];
const telhados = ["colonial", "fibrocimento", "metalico", "laje", "solo", "outro"];
const roofLabels: Record<string, string> = { colonial: "Colonial", fibrocimento: "Fibrocimento", metalico: "Metálico", laje: "Laje", solo: "Solo", outro: "Outro" };
const faseLabels: Record<string, string> = { mono: "Mono", bi: "Bi", tri: "Tri" };
const tipoLabels: Record<string, string> = { string: "String", microinversor: "Microinversor", hibrido: "Híbrido" };
const classeLabels: Record<string, string> = { residencial: "Residencial", comercial: "Comercial", rural: "Rural", industrial: "Industrial" };
const bandeiraLabels: Record<string, string> = { verde: "Verde", amarela: "Amarela", vermelha1: "Vermelha 1", vermelha2: "Vermelha 2" };

function StatusBadge({ active }: { active?: boolean | null }) {
  return <Badge variant={active ? "default" : "secondary"}>{active ? "Ativo" : "Inativo"}</Badge>;
}

function SelectField({ value, onChange, placeholder, options }: { value?: string; onChange: (value: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function NumberField({ field, placeholder }: { field: { value: unknown; onChange: (value: string) => void; onBlur: () => void; name: string; ref: React.Ref<HTMLInputElement> }; placeholder?: string }) {
  return <Input type="number" step="any" placeholder={placeholder} value={String(field.value ?? "")} onChange={(event) => field.onChange(event.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} />;
}

function useCatalogAccess() {
  return useQuery({
    queryKey: ["catalog-access"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").in("role", ["admin", "gestor"]);
      if (error) throw error;
      return data.length > 0;
    },
  });
}

function CadastrosPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: "/cadastros" });
  const access = useCatalogAccess();

  useEffect(() => {
    if (access.data === false) {
      toast.error("Acesso negado");
      navigate({ to: "/dashboard" });
    }
  }, [access.data, navigate]);

  if (access.isLoading || access.data === false) {
    return <AppLayout><PageHeader title="Cadastros" subtitle="Validando permissões administrativas..." /></AppLayout>;
  }

  return (
    <AppLayout>
      <PageHeader title="Cadastros" subtitle="Mantenha catálogos técnicos e comerciais usados nas propostas." />
      <section className="p-4 md:p-8">
        <Tabs value={tab} onValueChange={(value) => navigate({ search: (prev) => ({ ...prev, tab: value as CatalogTab }) })}>
          <TabsList className="mb-6 h-auto flex-wrap justify-start">
            {tabs.map((item) => <TabsTrigger key={item} value={item}>{tabLabels[item]}</TabsTrigger>)}
          </TabsList>
          <TabsContent value="modulos"><ModulesTab /></TabsContent>
          <TabsContent value="inversores"><InvertersTab /></TabsContent>
          <TabsContent value="estruturas"><StructuresTab /></TabsContent>
          <TabsContent value="cidades"><CitiesTab /></TabsContent>
          <TabsContent value="tarifas"><TariffsTab /></TabsContent>
        </Tabs>
      </section>
    </AppLayout>
  );
}
