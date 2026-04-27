import { zodResolver } from "@hookform/resolvers/zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarIcon, Cpu, MapPin, PanelTop, PlugZap, Receipt, Warehouse } from "lucide-react";
import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";
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
  type CityInsert,
  type CityRow,
  type InverterRow,
  type ModuleRow,
  type StructureRow,
  type TariffRow,
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

const numberFromInput = z.coerce.number({ invalid_type_error: "Informe um número válido." });
const moduleSchema = z.object({
  id: z.string().optional(),
  marca: z.string().min(2, "Informe pelo menos 2 caracteres."),
  modelo: z.string().min(2, "Informe pelo menos 2 caracteres."),
  potencia_w: numberFromInput.int("Informe um número inteiro.").min(100, "Mínimo 100 W.").max(700, "Máximo 700 W."),
  tecnologia: z.string().min(1, "Selecione a tecnologia."),
  eficiencia_pct: numberFromInput.min(10, "Mínimo 10%.").max(25, "Máximo 25%."),
  garantia_produto_anos: numberFromInput.int().min(1),
  garantia_geracao_anos: numberFromInput.int().min(1),
  preco_custo: numberFromInput.positive("Informe um valor maior que zero."),
  preco_venda: numberFromInput.positive("Informe um valor maior que zero."),
  ativo: z.boolean(),
}).refine((data) => data.preco_venda > data.preco_custo, { path: ["preco_venda"], message: "Preço de venda deve ser maior que o custo." });

const inverterSchema = z.object({
  id: z.string().optional(),
  marca: z.string().min(2, "Informe pelo menos 2 caracteres."),
  modelo: z.string().min(2, "Informe pelo menos 2 caracteres."),
  potencia_kw: numberFromInput.min(0.5, "Mínimo 0,5 kW.").max(500, "Máximo 500 kW."),
  mppts: numberFromInput.int().min(1).max(12),
  fases: z.enum(["mono", "bi", "tri"], { required_error: "Selecione as fases." }),
  tipo: z.enum(["string", "microinversor", "hibrido"], { required_error: "Selecione o tipo." }),
  garantia_anos: numberFromInput.int().min(1),
  preco_custo: numberFromInput.positive("Informe um valor maior que zero."),
  preco_venda: numberFromInput.positive("Informe um valor maior que zero."),
  ativo: z.boolean(),
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
  hsp_jan: numberFromInput.min(3).max(7.5).optional(),
  hsp_fev: numberFromInput.min(3).max(7.5).optional(),
  hsp_mar: numberFromInput.min(3).max(7.5).optional(),
  hsp_abr: numberFromInput.min(3).max(7.5).optional(),
  hsp_mai: numberFromInput.min(3).max(7.5).optional(),
  hsp_jun: numberFromInput.min(3).max(7.5).optional(),
  hsp_jul: numberFromInput.min(3).max(7.5).optional(),
  hsp_ago: numberFromInput.min(3).max(7.5).optional(),
  hsp_set: numberFromInput.min(3).max(7.5).optional(),
  hsp_out: numberFromInput.min(3).max(7.5).optional(),
  hsp_nov: numberFromInput.min(3).max(7.5).optional(),
  hsp_dez: numberFromInput.min(3).max(7.5).optional(),
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

type CatalogForm<T extends FieldValues> = UseFormReturn<T>;

function SelectField({ value, onChange, placeholder, options }: { value?: string; onChange: (value: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function NumberField({ field, placeholder }: { field: { value: unknown; onChange: (value: string) => void; onBlur: () => void; name: string; ref: React.Ref<HTMLInputElement> }; placeholder?: string }) {
  return <Input type="number" step="0.01" placeholder={placeholder} value={String(field.value ?? "")} onChange={(event) => field.onChange(event.target.value)} onBlur={field.onBlur} name={field.name} ref={field.ref} />;
}

function useCatalogAccess() {
  return useQuery({
    queryKey: ["catalog-access"],
    queryFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", authData.user.id).in("role", ["admin", "gestor"]);
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
        <Tabs value={tab} onValueChange={(value) => navigate({ search: (prev: { tab?: CatalogTab }) => ({ ...prev, tab: value as CatalogTab }) })}>
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

function ModulesTab() {
  const [search, setSearch] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [editing, setEditing] = useState<ModuleRow | null>(null);
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(search, 300);
  const query = useModules({ search: debounced, ativo: onlyActive });
  const create = useCreateModule();
  const update = useUpdateModule();
  const remove = useDeleteModule();
  return <><CrudTable title="Módulos" newLabel="Novo módulo" search={search} onSearchChange={setSearch} onlyActive={onlyActive} onOnlyActiveChange={setOnlyActive} rows={query.data ?? []} isLoading={query.isLoading} emptyIcon={PanelTop} emptyTitle="Nenhum módulo encontrado" emptyDescription="Cadastre painéis solares para usar no dimensionamento." onNew={() => { setEditing(null); setOpen(true); }} onEdit={(r) => { setEditing(r); setOpen(true); }} onDelete={(r) => remove.mutate(r.id)} columns={[{header:"Marca",cell:r=>r.marca},{header:"Modelo",cell:r=>r.modelo},{header:"Potência",cell:r=>`${r.potencia_w} W`},{header:"Tecnologia",cell:r=>r.tecnologia},{header:"Eficiência",cell:r=>r.eficiencia_pct?`${r.eficiencia_pct}%`:"—"},{header:"Garantia",cell:r=>`${r.garantia_produto_anos ?? 0}/${r.garantia_geracao_anos ?? 0} anos`},{header:"Preço Custo",cell:r=><Money value={r.preco_custo ?? 0}/>},{header:"Preço Venda",cell:r=><Money value={r.preco_venda ?? 0}/>},{header:"Status",cell:r=><StatusBadge active={r.ativo}/>}]} /><ModuleDialog open={open} row={editing} onOpenChange={setOpen} onSubmit={async (v)=>{ editing ? await update.mutateAsync({id: editing.id, ...v}) : await create.mutateAsync(v); setOpen(false); }} /></>;
}

function ModuleDialog({ open, row, onOpenChange, onSubmit }: { open: boolean; row: ModuleRow | null; onOpenChange: (v:boolean)=>void; onSubmit:(v: ModuleForm)=>Promise<void> }) {
  const form = useForm<ModuleForm>({ resolver: zodResolver(moduleSchema), values: { marca: row?.marca ?? "", modelo: row?.modelo ?? "", potencia_w: row?.potencia_w ?? 550, tecnologia: row?.tecnologia ?? "Monocristalino", eficiencia_pct: row?.eficiencia_pct ?? 21, garantia_produto_anos: row?.garantia_produto_anos ?? 12, garantia_geracao_anos: row?.garantia_geracao_anos ?? 25, preco_custo: row?.preco_custo ?? 0, preco_venda: row?.preco_venda ?? 0, ativo: row?.ativo ?? true }});
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{row?"Editar":"Novo"} módulo</DialogTitle><DialogDescription>Dados técnicos e comerciais do painel.</DialogDescription></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2"><TextField form={form} name="marca" label="Marca"/><TextField form={form} name="modelo" label="Modelo"/><TextField form={form} name="potencia_w" label="Potência W" type="number"/><FormField control={form.control} name="tecnologia" render={({field})=><FormItem><FormLabel>Tecnologia</FormLabel><SelectField value={field.value} onChange={field.onChange} placeholder="Selecione" options={tecnologias.map(x=>({value:x,label:x}))}/><FormMessage/></FormItem>}/><TextField form={form} name="eficiencia_pct" label="Eficiência %" type="number"/><TextField form={form} name="garantia_produto_anos" label="Garantia produto" type="number"/><TextField form={form} name="garantia_geracao_anos" label="Garantia geração" type="number"/><MoneyInput control={form.control} name="preco_custo" label="Preço custo"/><MoneyInput control={form.control} name="preco_venda" label="Preço venda"/><BoolField form={form} name="ativo" label="Ativo"/><DialogFooter className="md:col-span-2"><Button type="submit">Salvar</Button></DialogFooter></form></Form></DialogContent></Dialog>;
}

function InvertersTab() {
  const [search,setSearch]=useState(""); const [onlyActive,setOnlyActive]=useState(true); const [editing,setEditing]=useState<InverterRow|null>(null); const [open,setOpen]=useState(false); const debounced=useDebounce(search,300); const query=useInverters({search:debounced,ativo:onlyActive}); const create=useCreateInverter(); const update=useUpdateInverter(); const remove=useDeleteInverter();
  return <><CrudTable title="Inversores" newLabel="Novo inversor" search={search} onSearchChange={setSearch} onlyActive={onlyActive} onOnlyActiveChange={setOnlyActive} rows={query.data??[]} isLoading={query.isLoading} emptyIcon={PlugZap} emptyTitle="Nenhum inversor encontrado" emptyDescription="Cadastre inversores para usar nas propostas." onNew={()=>{setEditing(null);setOpen(true)}} onEdit={(r)=>{setEditing(r);setOpen(true)}} onDelete={(r)=>remove.mutate(r.id)} columns={[{header:"Marca",cell:r=>r.marca},{header:"Modelo",cell:r=>r.modelo},{header:"Potência kW",cell:r=>r.potencia_kw},{header:"MPPTs",cell:r=>r.mppts},{header:"Fases",cell:r=>faseLabels[r.fases??""]??"—"},{header:"Tipo",cell:r=>tipoLabels[r.tipo??""]??"—"},{header:"Garantia",cell:r=>`${r.garantia_anos??0} anos`},{header:"Preço Custo",cell:r=><Money value={r.preco_custo??0}/>},{header:"Preço Venda",cell:r=><Money value={r.preco_venda??0}/>},{header:"Status",cell:r=><StatusBadge active={r.ativo}/>}]} /><InverterDialog open={open} row={editing} onOpenChange={setOpen} onSubmit={async(v)=>{editing?await update.mutateAsync({id:editing.id,...v}):await create.mutateAsync(v);setOpen(false)}}/></>;
}
function InverterDialog({open,row,onOpenChange,onSubmit}:{open:boolean;row:InverterRow|null;onOpenChange:(v:boolean)=>void;onSubmit:(v:InverterForm)=>Promise<void>}){const form=useForm<InverterForm>({resolver:zodResolver(inverterSchema),values:{marca:row?.marca??"",modelo:row?.modelo??"",potencia_kw:row?.potencia_kw??5,mppts:row?.mppts??2,fases:(row?.fases as "mono"|"bi"|"tri")??"mono",tipo:(row?.tipo as "string"|"microinversor"|"hibrido")??"string",garantia_anos:row?.garantia_anos??10,preco_custo:row?.preco_custo??0,preco_venda:row?.preco_venda??0,ativo:row?.ativo??true}});return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{row?"Editar":"Novo"} inversor</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2"><TextField form={form} name="marca" label="Marca"/><TextField form={form} name="modelo" label="Modelo"/><TextField form={form} name="potencia_kw" label="Potência kW" type="number"/><TextField form={form} name="mppts" label="MPPTs" type="number"/><SelectFormField form={form} name="fases" label="Fases" options={[{value:"mono",label:"Mono"},{value:"bi",label:"Bi"},{value:"tri",label:"Tri"}]}/><SelectFormField form={form} name="tipo" label="Tipo" options={[{value:"string",label:"String"},{value:"microinversor",label:"Microinversor"},{value:"hibrido",label:"Híbrido"}]}/><TextField form={form} name="garantia_anos" label="Garantia" type="number"/><MoneyInput control={form.control} name="preco_custo" label="Preço custo"/><MoneyInput control={form.control} name="preco_venda" label="Preço venda"/><BoolField form={form} name="ativo" label="Ativo"/><DialogFooter className="md:col-span-2"><Button type="submit">Salvar</Button></DialogFooter></form></Form></DialogContent></Dialog>}

function StructuresTab(){const[search,setSearch]=useState("");const[editing,setEditing]=useState<StructureRow|null>(null);const[open,setOpen]=useState(false);const query=useStructures({search:useDebounce(search,300)});const create=useCreateStructure();const update=useUpdateStructure();const remove=useDeleteStructure();return <><CrudTable title="Estruturas" newLabel="Nova estrutura" search={search} onSearchChange={setSearch} showActiveFilter={false} rows={query.data??[]} isLoading={query.isLoading} emptyIcon={Warehouse} emptyTitle="Nenhuma estrutura encontrada" emptyDescription="Cadastre custos por tipo de telhado." onNew={()=>{setEditing(null);setOpen(true)}} onEdit={(r)=>{setEditing(r);setOpen(true)}} onDelete={(r)=>remove.mutate(r.id)} deleteLabel="Remover" searchPlaceholder="Buscar por tipo de telhado" columns={[{header:"Tipo Telhado",cell:r=>roofLabels[r.tipo_telhado]??r.tipo_telhado},{header:"Faixa Placas",cell:r=>`${r.placas_min} a ${r.placas_max}`},{header:"Custo por Placa",cell:r=><Money value={r.custo_por_placa}/>}]} /><StructureDialog open={open} row={editing} onOpenChange={setOpen} onSubmit={async(v)=>{editing?await update.mutateAsync({id:editing.id,...v}):await create.mutateAsync(v);setOpen(false)}}/></>}
function StructureDialog({open,row,onOpenChange,onSubmit}:{open:boolean;row:StructureRow|null;onOpenChange:(v:boolean)=>void;onSubmit:(v:StructureForm)=>Promise<void>}){const form=useForm<StructureForm>({resolver:zodResolver(structureSchema),values:{tipo_telhado:row?.tipo_telhado??"colonial",placas_min:row?.placas_min??1,placas_max:row?.placas_max??20,custo_por_placa:row?.custo_por_placa??0}});return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{row?"Editar":"Nova"} estrutura</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><SelectFormField form={form} name="tipo_telhado" label="Tipo telhado" options={telhados.map(x=>({value:x,label:roofLabels[x]}))}/><TextField form={form} name="placas_min" label="Placas mín." type="number"/><TextField form={form} name="placas_max" label="Placas máx." type="number"/><MoneyInput control={form.control} name="custo_por_placa" label="Custo por placa"/><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></Form></DialogContent></Dialog>}

function CitiesTab(){const[search,setSearch]=useState("");const[editing,setEditing]=useState<CityRow|null>(null);const[open,setOpen]=useState(false);const query=useCities({search:useDebounce(search,300)});const create=useCreateCity();const update=useUpdateCity();const remove=useDeleteCity();const importer=useImportCities();function importCsv(file:File){Papa.parse<Record<string,string>>(file,{header:true,skipEmptyLines:true,complete:(res)=>{const rows:CityInsert[]=res.data.map(r=>({cidade:r.cidade,uf:r.uf,hsp_medio:Number(r.hsp_medio),...Object.fromEntries(monthlyFields.map(f=>[f,r[f]?Number(r[f]):null]))}));importer.mutate(rows)}})}return <><CrudTable title="Cidades & HSP" newLabel="Nova cidade" search={search} onSearchChange={setSearch} showActiveFilter={false} rows={query.data??[]} isLoading={query.isLoading} emptyIcon={MapPin} emptyTitle="Nenhuma cidade encontrada" emptyDescription="Cadastre irradiação média por cidade." onNew={()=>{setEditing(null);setOpen(true)}} onEdit={(r)=>{setEditing(r);setOpen(true)}} onDelete={(r)=>remove.mutate(r.id)} deleteLabel="Remover" searchPlaceholder="Buscar por cidade ou UF" extraActions={<Button variant="outline" asChild><label>Importar lote (CSV)<input type="file" accept=".csv,text/csv" className="hidden" onChange={(e)=>e.target.files?.[0]&&importCsv(e.target.files[0])}/></label></Button>} columns={[{header:"Cidade",cell:r=>r.cidade},{header:"UF",cell:r=>r.uf},{header:"HSP Médio",cell:r=>r.hsp_medio}]} /><CityDialog open={open} row={editing} onOpenChange={setOpen} onSubmit={async(v)=>{const payload={...v,...Object.fromEntries(monthlyFields.map(f=>[f,v[f]??null]))};editing?await update.mutateAsync({id:editing.id,...payload}):await create.mutateAsync(payload);setOpen(false)}}/></>}
function CityDialog({open,row,onOpenChange,onSubmit}:{open:boolean;row:CityRow|null;onOpenChange:(v:boolean)=>void;onSubmit:(v:CityForm)=>Promise<void>}){const form=useForm<CityForm>({resolver:zodResolver(citySchema),values:{cidade:row?.cidade??"",uf:row?.uf??"MG",hsp_medio:row?.hsp_medio??5.5,...Object.fromEntries(monthlyFields.map(f=>[f,row?.[f]??undefined]))} as CityForm});return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{row?"Editar":"Nova"} cidade</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2"><TextField form={form} name="cidade" label="Cidade"/><SelectFormField form={form} name="uf" label="UF" options={estados.map(x=>({value:x,label:x}))}/><TextField form={form} name="hsp_medio" label="HSP Médio" type="number"/><Accordion type="single" collapsible className="md:col-span-2"><AccordionItem value="mensal"><AccordionTrigger>HSP por mês</AccordionTrigger><AccordionContent className="grid gap-3 md:grid-cols-3">{monthlyFields.map(f=><TextField key={f} form={form} name={f} label={f.replace("hsp_","").toUpperCase()} type="number"/>)}</AccordionContent></AccordionItem></Accordion><DialogFooter className="md:col-span-2"><Button type="submit">Salvar</Button></DialogFooter></form></Form></DialogContent></Dialog>}

function TariffsTab(){const[search,setSearch]=useState("");const[editing,setEditing]=useState<TariffRow|null>(null);const[open,setOpen]=useState(false);const query=useTariffs({search:useDebounce(search,300)});const create=useCreateTariff();const update=useUpdateTariff();const remove=useDeleteTariff();return <><CrudTable title="Tarifas" newLabel="Nova tarifa" search={search} onSearchChange={setSearch} showActiveFilter={false} rows={query.data??[]} isLoading={query.isLoading} emptyIcon={Receipt} emptyTitle="Nenhuma tarifa encontrada" emptyDescription="Cadastre tarifas por concessionária." onNew={()=>{setEditing(null);setOpen(true)}} onEdit={(r)=>{setEditing(r);setOpen(true)}} onDelete={(r)=>remove.mutate(r.id)} deleteLabel="Remover" searchPlaceholder="Buscar por concessionária ou UF" columns={[{header:"Concessionária",cell:r=>r.concessionaria},{header:"UF",cell:r=>r.uf},{header:"Classe",cell:r=>classeLabels[r.classe??""]??"—"},{header:"Valor R$/kWh",cell:r=>r.valor_kwh.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:4})},{header:"Bandeira",cell:r=>bandeiraLabels[r.bandeira_atual??""]??"—"},{header:"Atualizado em",cell:r=>format(new Date(`${r.atualizado_em}T00:00:00`),"dd/MM/yyyy")}]} /><TariffDialog open={open} row={editing} onOpenChange={setOpen} onSubmit={async(v)=>{const payload={...v,atualizado_em:format(v.atualizado_em,"yyyy-MM-dd")};editing?await update.mutateAsync({id:editing.id,...payload}):await create.mutateAsync(payload);setOpen(false)}}/></>}
function TariffDialog({open,row,onOpenChange,onSubmit}:{open:boolean;row:TariffRow|null;onOpenChange:(v:boolean)=>void;onSubmit:(v:TariffForm)=>Promise<void>}){const form=useForm<TariffForm>({resolver:zodResolver(tariffSchema),values:{concessionaria:row?.concessionaria??"",uf:row?.uf??"MG",classe:(row?.classe as TariffForm["classe"])??"residencial",subgrupo:row?.subgrupo??"",valor_kwh:row?.valor_kwh??0.985,bandeira_atual:(row?.bandeira_atual as TariffForm["bandeira_atual"])??"verde",atualizado_em:row?.atualizado_em?new Date(`${row.atualizado_em}T00:00:00`):new Date()}});return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{row?"Editar":"Nova"} tarifa</DialogTitle></DialogHeader><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4"><TextField form={form} name="concessionaria" label="Concessionária"/><SelectFormField form={form} name="uf" label="UF" options={estados.map(x=>({value:x,label:x}))}/><SelectFormField form={form} name="classe" label="Classe" options={Object.entries(classeLabels).map(([value,label])=>({value,label}))}/><TextField form={form} name="subgrupo" label="Subgrupo"/><MoneyInput control={form.control} name="valor_kwh" label="Valor R$/kWh" decimals={4}/><SelectFormField form={form} name="bandeira_atual" label="Bandeira" options={Object.entries(bandeiraLabels).map(([value,label])=>({value,label}))}/><DateField form={form}/><DialogFooter><Button type="submit">Salvar</Button></DialogFooter></form></Form></DialogContent></Dialog>}

function TextField<T extends FieldValues>({form,name,label,type="text"}:{form:CatalogForm<T>;name:FieldPath<T>;label:string;type?:string}){return <FormField control={form.control} name={name} render={({field})=><FormItem><FormLabel>{label}</FormLabel><FormControl>{type==="number"?<NumberField field={field}/>:<Input {...field} value={String(field.value??"")}/>}</FormControl><FormMessage/></FormItem>}/>}
function BoolField<T extends FieldValues>({form,name,label}:{form:CatalogForm<T>;name:FieldPath<T>;label:string}){return <FormField control={form.control} name={name} render={({field})=><FormItem className="flex items-center justify-between rounded-xl border p-3"><FormLabel>{label}</FormLabel><FormControl><Switch checked={Boolean(field.value)} onCheckedChange={field.onChange}/></FormControl></FormItem>}/>}
function SelectFormField<T extends FieldValues>({form,name,label,options}:{form:CatalogForm<T>;name:FieldPath<T>;label:string;options:{value:string;label:string}[]}){return <FormField control={form.control} name={name} render={({field})=><FormItem><FormLabel>{label}</FormLabel><SelectField value={String(field.value??"")} onChange={field.onChange} placeholder="Selecione" options={options}/><FormMessage/></FormItem>}/>}
function DateField({form}:{form:CatalogForm<TariffForm>}){return <FormField control={form.control} name="atualizado_em" render={({field})=><FormItem className="flex flex-col"><FormLabel>Atualizado em</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("justify-start text-left font-normal",!field.value&&"text-muted-foreground")}><CalendarIcon className="h-4 w-4"/>{field.value?format(field.value,"dd/MM/yyyy"):"Selecione"}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto"/></PopoverContent></Popover><FormMessage/></FormItem>}/>}
