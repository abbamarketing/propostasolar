import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { BatteryCharging, Building2, Check, ChevronsUpDown, CircleAlert, CircleHelp, Clock, GripVertical, Home, ImageIcon, Loader2, Plus, RefreshCcw, Save, Search, Tractor, Trash2, Upload, Warehouse } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ClientForm, type ClientFormValues } from "@/components/client-form";
import { MoneyInput } from "@/components/inputs/money-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCities, useInverters, useModules, useStructures, useTariffs, type CityRow, type InverterRow } from "@/hooks/use-catalog-data";
import { concessionarias, useClient, useClients, useCreateClient, useUpdateClient, type ClientRow } from "@/hooks/use-clients";
import { type ProposalDraft, useCreateFinancingOption, useDeleteFinancingOption, useProposalAutosave, useProposalContext, useProposalFinancing, useProposalPhotoMutations, useProposalPhotos, useUpsertProposalItems, useUpdateFinancingOption } from "@/hooks/use-proposal-wizard";
import { calculateFinancialAnalysis, calculatePmt, calculatePricing, defaultCableCost, defaultProjectCost, type OtherCost } from "@/lib/proposal-pricing";
import { calculateSolarSizing } from "@/lib/solar-sizing";
import { cn } from "@/lib/utils";

const steps = ["Cliente", "Dimensionamento", "Precificação", "Personalização", "Revisão"] as const;
const stepOneSchema = z.object({ client_id: z.string().uuid("Selecione um cliente para avançar.") });
const stepTwoSchema = z.object({ modulo_id: z.string().uuid("Selecione o módulo."), inversor_id: z.string().uuid("Selecione o inversor."), kwp_instalado: z.number().positive("Informe uma potência instalada válida.") });
const stepThreeSchema = z.object({ valor_total: z.number().positive("Defina um valor final maior que zero.") });
const stepFourSchema = z.object({ template: z.string().min(1, "Selecione um template.") });

type ProposalWizardProps = { proposalId?: string; initialClientId?: string };
type SaveStatusProps = { state: "idle" | "saving" | "saved" | "error"; savedAt: Date | null; onRetry: () => void };

export function ProposalWizard({ proposalId, initialClientId }: ProposalWizardProps) {
  const navigate = useNavigate();
  const autosave = useProposalAutosave({ proposalId, initialClientId });
  const { setDraft } = autosave;
  const [step, setStep] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");
  const client = useClient(autosave.draft.client_id || undefined);
  const title = autosave.proposal?.numero ? `Proposta ${autosave.proposal.numero}` : "Nova Proposta";

  useBlocker({
    shouldBlockFn: () => autosave.hasUnsavedChanges && !window.confirm("Há mudanças não salvas. Deseja sair mesmo assim?"),
    enableBeforeUnload: autosave.hasUnsavedChanges,
  });

  const updateDraft = useCallback((patch: Partial<ProposalDraft>) => {
    setDraft((current) => {
      const changed = Object.entries(patch).some(([key, value]) => current[key as keyof ProposalDraft] !== value);
      return changed ? { ...current, ...patch } : current;
    });
  }, [setDraft]);

  function canOpen(target: number) {
    if (target <= step) return true;
    if (target === 1) return stepOneSchema.safeParse({ client_id: autosave.draft.client_id }).success;
    if (target === 2) return stepTwoSchema.safeParse({ modulo_id: autosave.draft.modulo_id, inversor_id: autosave.draft.inversor_id, kwp_instalado: autosave.draft.kwp_instalado ?? 0 }).success;
    if (target === 3) return stepThreeSchema.safeParse({ valor_total: autosave.draft.valor_total ?? 0 }).success;
    if (target === 4) return stepFourSchema.safeParse({ template: autosave.draft.template ?? "on-grid-residencial" }).success;
    return false;
  }

  function next() {
    const result = step === 0 ? stepOneSchema.safeParse({ client_id: autosave.draft.client_id }) : step === 1 ? stepTwoSchema.safeParse({ modulo_id: autosave.draft.modulo_id, inversor_id: autosave.draft.inversor_id, kwp_instalado: autosave.draft.kwp_instalado ?? 0 }) : step === 2 ? stepThreeSchema.safeParse({ valor_total: autosave.draft.valor_total ?? 0 }) : stepFourSchema.safeParse({ template: autosave.draft.template ?? "on-grid-residencial" });
    if (!result.success) {
      setValidationMessage(result.error.issues[0]?.message ?? "Preencha os campos obrigatórios.");
      return;
    }
    setValidationMessage("");
    setStep((current) => Math.min(current + 1, 4));
  }

  function back() {
    if (step === 0) navigate({ to: "/propostas" });
    else setStep((current) => Math.max(0, current - 1));
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-col gap-4 px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" asChild aria-label="Voltar"><Link to="/propostas">←</Link></Button>
              <div><h1 className="font-display text-2xl font-black md:text-3xl">{title}</h1><p className="text-sm text-muted-foreground">Rascunho de proposta fotovoltaica</p></div>
            </div>
            <div className="flex items-center gap-2"><Badge variant="secondary">{autosave.proposal?.status ?? "rascunho"}</Badge><SaveStatus state={autosave.saveState} savedAt={autosave.savedAt} onRetry={autosave.retry} /></div>
          </div>
          <nav className="grid gap-2 md:grid-cols-5">
            {steps.map((label, index) => {
              const completed = index === 0 ? Boolean(autosave.draft.client_id) : index === 1 ? Boolean(autosave.draft.modulo_id && autosave.draft.inversor_id && (autosave.draft.kwp_instalado ?? 0) > 0) : index === 2 ? (autosave.draft.valor_total ?? 0) > 0 : index === 3 ? Boolean(autosave.draft.template) : false;
              const current = index === step;
              return <button key={label} type="button" disabled={!canOpen(index)} onClick={() => setStep(index)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors", current && "border-primary bg-primary/10 text-primary", completed && !current && "border-success/40 bg-success/10 text-success", !current && !completed && "text-muted-foreground", !canOpen(index) && "cursor-not-allowed opacity-55")}><span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">{completed ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>{label}</button>;
            })}
          </nav>
        </div>
      </header>
      <main className="px-4 py-6 md:px-8">
        {validationMessage ? <Alert className="mb-4"><CircleAlert className="h-4 w-4" /><AlertTitle>Verifique antes de avançar</AlertTitle><AlertDescription>{validationMessage}</AlertDescription></Alert> : null}
        {step === 0 ? <ClientStep selectedClient={client.data ?? null} selectedClientId={autosave.draft.client_id} onSelect={(selected) => updateDraft({ client_id: selected.id, cidade_projeto: selected.endereco_cidade, uf_projeto: selected.endereco_uf, tarifa_kwh: autosave.draft.tarifa_kwh, custo_disponibilidade_kwh: defaultAvailability(selected.tipo_ligacao) })} /> : null}
        {step === 1 ? <SizingStep draft={autosave.draft} client={client.data ?? null} updateDraft={updateDraft} /> : null}
        {step === 2 ? <PricingStep proposalId={autosave.activeId} draft={autosave.draft} client={client.data ?? null} updateDraft={updateDraft} /> : null}
        {step === 3 ? <PersonalizationStep proposalId={autosave.activeId} proposal={autosave.proposal ?? null} draft={autosave.draft} client={client.data ?? null} updateDraft={updateDraft} /> : null}
        {step >= 4 ? <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">A revisão e geração de PDF serão implementadas no próximo prompt.</CardContent></Card> : null}
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex items-center justify-between gap-3"><Button variant="outline" onClick={back}>Voltar</Button><span className="hidden text-sm text-muted-foreground md:inline">Salvo automaticamente</span><Button onClick={next} disabled={step >= 4}>Próximo</Button></div>
      </footer>
    </div>
  );
}

function SaveStatus({ state, savedAt, onRetry }: SaveStatusProps) {
  if (state === "saving") return <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Salvando...</span>;
  if (state === "error") return <Button variant="outline" size="sm" onClick={onRetry}><RefreshCcw className="h-4 w-4" />Erro ao salvar</Button>;
  if (savedAt) return <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Salvo às {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>;
  return <span className="text-sm text-muted-foreground">Auto-save ativo</span>;
}

function ClientStep({ selectedClient, selectedClientId, onSelect }: { selectedClient: ClientRow | null; selectedClientId: string; onSelect: (client: ClientRow) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"new" | "edit" | null>(null);
  const clients = useClients({ search, page: 1 });
  const create = useCreateClient();
  const update = useUpdateClient();

  async function submitClient(values: ClientFormValues) {
    const saved = dialog === "edit" && selectedClient ? await update.mutateAsync({ id: selectedClient.id, ...values }) : await create.mutateAsync(values);
    onSelect(saved);
    setDialog(null);
  }

  return <div className="mx-auto max-w-5xl space-y-4"><Card className="shadow-soft"><CardHeader><CardTitle>Selecione o cliente desta proposta</CardTitle></CardHeader><CardContent><Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" className="h-auto min-h-14 w-full justify-between px-4 py-3"><span className="flex items-center gap-3 text-left">{selectedClient ? <ClientAvatar client={selectedClient} /> : <Search className="h-5 w-5 text-muted-foreground" />}<span>{selectedClient ? selectedClient.nome : "Buscar por nome, CPF ou CNPJ"}</span></span><ChevronsUpDown className="h-4 w-4 opacity-60" /></Button></PopoverTrigger><PopoverContent className="w-[min(720px,calc(100vw-2rem))] p-0" align="start"><Command shouldFilter={false}><CommandInput value={search} onValueChange={setSearch} placeholder="Digite nome, CPF/CNPJ, e-mail ou telefone" /><CommandList><CommandEmpty>Nenhum cliente encontrado.</CommandEmpty><CommandGroup>{clients.data?.rows.map((client) => <CommandItem key={client.id} value={client.id} onSelect={() => { onSelect(client); setOpen(false); }} className="py-3"><ClientAvatar client={client} /><div className="min-w-0"><p className="font-semibold">{client.nome}</p><p className="text-xs text-muted-foreground">{client.cpf_cnpj} · {client.endereco_cidade ?? "Sem cidade"}</p></div></CommandItem>)}</CommandGroup></CommandList><div className="border-t p-2"><Button variant="ghost" className="w-full justify-start" onClick={() => { setOpen(false); setDialog("new"); }}><Plus className="h-4 w-4" />Cadastrar novo cliente</Button></div></Command></PopoverContent></Popover></CardContent></Card>{selectedClient ? <ClientSummary client={selectedClient} onChange={() => setOpen(true)} onEdit={() => setDialog("edit")} /> : null}<Dialog open={Boolean(dialog)} onOpenChange={(value) => !value && setDialog(null)}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{dialog === "edit" ? "Editar cliente" : "Cadastrar novo cliente"}</DialogTitle></DialogHeader><ClientForm initialData={dialog === "edit" ? selectedClient : null} onSubmit={submitClient} isSubmitting={create.isPending || update.isPending} /></DialogContent></Dialog></div>;
}

function ClientAvatar({ client }: { client: ClientRow }) {
  const initials = client.nome.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <Avatar><AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials || "CL"}</AvatarFallback></Avatar>;
}

function ClientSummary({ client, onChange, onEdit }: { client: ClientRow; onChange: () => void; onEdit: () => void }) {
  return <Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{client.nome}</CardTitle><div className="flex gap-2"><Button variant="outline" size="sm" onClick={onChange}>Trocar cliente</Button><Button variant="outline" size="sm" onClick={onEdit}>Editar cliente</Button></div></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Info label="Tipo e cidade" value={`${client.tipo} · ${client.endereco_cidade ?? "—"}/${client.endereco_uf ?? ""}`} /><Info label="Contato" value={`${client.telefone ?? "Sem telefone"} · ${client.email ?? "Sem e-mail"}`} /><Info label="Energia" value={`${client.concessionaria ?? "—"} · ${client.tipo_ligacao ?? "—"} · ${client.tipo_telhado ?? "—"}`} /><Info label="Conta e consumo" value={`${money(client.conta_luz_media ?? 0)} · ${client.consumo_medio_kwh ?? "—"} kWh`} /></CardContent></Card>;
}

function SizingStep({ draft, client, updateDraft }: { draft: ProposalDraft; client: ClientRow | null; updateDraft: (patch: Partial<ProposalDraft>) => void }) {
  const cities = useCities({ search: "" });
  const tariffs = useTariffs({ search: "" });
  const modules = useModules({ search: "", ativo: true });
  const inverters = useInverters({ search: "", ativo: true });
  const [metaCompensacao, setMetaCompensacao] = useState(1);
  const selectedCity = cities.data?.find((city) => city.cidade === draft.cidade_projeto && city.uf === draft.uf_projeto) ?? null;
  const selectedModule = modules.data?.find((module) => module.id === draft.modulo_id) ?? null;
  const selectedInverter = inverters.data?.find((inverter) => inverter.id === draft.inversor_id) ?? null;
  const contaMedia = client?.conta_luz_media ?? 0;
  const tarifa = draft.tarifa_kwh ?? findTariff(tariffs.data ?? [], client?.concessionaria ?? "", client?.endereco_uf ?? draft.uf_projeto ?? "")?.valor_kwh ?? 0;
  const hsp = draft.hsp_usado ?? selectedCity?.hsp_medio ?? 0;
  const pr = draft.performance_ratio ?? 0.8;
  const disponibilidade = draft.custo_disponibilidade_kwh ?? defaultAvailability(client?.tipo_ligacao);
  const sizing = calculateSolarSizing({ contaLuzMedia: contaMedia, tarifaKwh: tarifa, custoDisponibilidade: disponibilidade, hsp, performanceRatio: pr, metaCompensacao });
  const suggestedModules = selectedModule ? Math.ceil((sizing.kWpNecessario * 1000) / selectedModule.potencia_w) : 0;
  const qtdModules = draft.qtd_modulos ?? suggestedModules;
  const kwpInstalled = selectedModule && qtdModules > 0 ? (qtdModules * selectedModule.potencia_w) / 1000 : 0;
  const realGenerationMonthly = kwpInstalled > 0 ? kwpInstalled * hsp * 30 * pr : sizing.geracaoMensalKwh;
  const compatibleInverters = (inverters.data ?? []).filter((inverter) => isCompatibleInverter(inverter, kwpInstalled, client?.tipo_ligacao));
  const inverterRatio = selectedInverter?.potencia_kw ? kwpInstalled / selectedInverter.potencia_kw : 1;

  useEffect(() => {
    if (!draft.cidade_projeto && client?.endereco_cidade && cities.data) {
      const match = cities.data.find((city) => city.cidade.toLowerCase() === client.endereco_cidade?.toLowerCase() && city.uf === client.endereco_uf);
      if (match) updateDraft({ cidade_projeto: match.cidade, uf_projeto: match.uf, hsp_usado: match.hsp_medio });
    }
  }, [cities.data, client, draft.cidade_projeto, updateDraft]);

  useEffect(() => {
    if (!draft.tarifa_kwh && client?.concessionaria) {
      const match = findTariff(tariffs.data ?? [], client.concessionaria, client.endereco_uf ?? "");
      if (match) updateDraft({ tarifa_kwh: match.valor_kwh });
    }
  }, [client, draft.tarifa_kwh, tariffs.data, updateDraft]);

  useEffect(() => {
    updateDraft({ consumo_estimado_kwh: sizing.consumoEstimadoKwh, energia_compensar_kwh: sizing.energiaACompensarKwh, kwp_necessario: sizing.kWpNecessario, geracao_estimada_mensal: realGenerationMonthly, geracao_estimada_anual: realGenerationMonthly * 12, kwp_instalado: kwpInstalled || null });
  }, [kwpInstalled, realGenerationMonthly, sizing.consumoEstimadoKwh, sizing.energiaACompensarKwh, sizing.kWpNecessario, updateDraft]);

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]"><div className="space-y-4"><CardBlock title="Localização do projeto"><CitySelect cities={cities.data ?? []} value={`${draft.cidade_projeto ?? ""}/${draft.uf_projeto ?? ""}`} onSelect={(city) => updateDraft({ cidade_projeto: city.cidade, uf_projeto: city.uf, hsp_usado: city.hsp_medio })} /><NumberField label="HSP" value={hsp} hint={selectedCity ? `Cidade: ${selectedCity.hsp_medio.toFixed(2)} h/dia` : "Selecione uma cidade"} step="0.01" onChange={(value) => updateDraft({ hsp_usado: value })} /></CardBlock><CardBlock title="Concessionária e tarifa"><Select value={client?.concessionaria ?? "CEMIG"} onValueChange={() => undefined}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{concessionarias.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><TariffField value={tarifa} onChange={(value) => updateDraft({ tarifa_kwh: value })} /><NumberField label="Custo de disponibilidade (kWh)" value={disponibilidade} hint={`Padrão: ${defaultAvailability(client?.tipo_ligacao)} kWh`} onChange={(value) => updateDraft({ custo_disponibilidade_kwh: value })} /></CardBlock><CardBlock title="Parâmetros técnicos"><SliderField label="Performance Ratio" value={pr} min={0.7} max={0.9} step={0.01} suffix="%" tooltip="Eficiência real do sistema considerando perdas (cabeamento, temperatura, sujeira). Padrão: 80%." onChange={(value) => updateDraft({ performance_ratio: value })} /><SliderField label="Compensação desejada" value={metaCompensacao} min={0.8} max={1} step={0.01} suffix="%" tooltip="Percentual da conta que o sistema deve cobrir" onChange={setMetaCompensacao} /></CardBlock><CardBlock title="Seleção de equipamentos"><Select value={draft.modulo_id ?? ""} onValueChange={(id) => { const module = modules.data?.find((item) => item.id === id); updateDraft({ modulo_id: module?.id ?? null, modulo_marca: module?.marca ?? null, modulo_modelo: module?.modelo ?? null, modulo_potencia_w: module?.potencia_w ?? null, qtd_modulos: module ? Math.ceil((sizing.kWpNecessario * 1000) / module.potencia_w) : null }); }}><SelectTrigger><SelectValue placeholder="Selecione o módulo" /></SelectTrigger><SelectContent>{modules.data?.map((module) => <SelectItem key={module.id} value={module.id}>{module.marca} {module.modelo} · {module.potencia_w}W</SelectItem>)}</SelectContent></Select><NumberField label="Quantidade de módulos" value={qtdModules} hint={suggestedModules ? `Sugestão: ${suggestedModules} placas` : "Selecione um módulo"} onChange={(value) => updateDraft({ qtd_modulos: Math.round(value) })} /><Select value={draft.inversor_id ?? ""} onValueChange={(id) => { const inverter = inverters.data?.find((item) => item.id === id); updateDraft({ inversor_id: inverter?.id ?? null, inversor_marca: inverter?.marca ?? null, inversor_modelo: inverter?.modelo ?? null, inversor_potencia_kw: inverter?.potencia_kw ?? null }); }}><SelectTrigger><SelectValue placeholder="Selecione o inversor compatível" /></SelectTrigger><SelectContent>{compatibleInverters.map((inverter) => <SelectItem key={inverter.id} value={inverter.id}>{inverter.marca} {inverter.modelo} · {inverter.potencia_kw}kW · {inverter.fases ?? "fases"}</SelectItem>)}</SelectContent></Select><NumberField label="Quantidade de inversores" value={draft.qtd_inversores ?? 1} onChange={(value) => updateDraft({ qtd_inversores: Math.round(value) })} />{selectedInverter && (inverterRatio > 1.3 || inverterRatio < 0.7) ? <Alert><CircleAlert className="h-4 w-4" /><AlertTitle>Atenção à compatibilidade</AlertTitle><AlertDescription>{inverterRatio > 1.3 ? "Sistema sobredimensionado para este inversor." : "Sistema subdimensionado para este inversor."}</AlertDescription></Alert> : null}</CardBlock></div><SizingSummary contaMedia={contaMedia} tarifa={tarifa} disponibilidade={disponibilidade} meta={metaCompensacao} hsp={hsp} pr={pr} sizing={sizing} kwpInstalled={kwpInstalled} realGenerationMonthly={realGenerationMonthly} /></div>;
}

function PricingStep({ proposalId, draft, client, updateDraft }: { proposalId?: string; draft: ProposalDraft; client: ClientRow | null; updateDraft: (patch: Partial<ProposalDraft>) => void }) {
  const modules = useModules({ search: "", ativo: true });
  const inverters = useInverters({ search: "", ativo: true });
  const structures = useStructures({ search: client?.tipo_telhado ?? "" });
  const financing = useProposalFinancing(proposalId);
  const createFinancing = useCreateFinancingOption();
  const updateFinancing = useUpdateFinancingOption();
  const deleteFinancing = useDeleteFinancingOption();
  const upsertItems = useUpsertProposalItems();
  const [manualStructure, setManualStructure] = useState(Boolean(draft.custo_estrutura));
  const [laborMode, setLaborMode] = useState<"wp" | "fixo">("wp");
  const [laborWp, setLaborWp] = useState(0.8);
  const [otherCosts, setOtherCosts] = useState<OtherCost[]>([]);
  const [financingOpen, setFinancingOpen] = useState(false);
  const module = modules.data?.find((item) => item.id === draft.modulo_id);
  const inverter = inverters.data?.find((item) => item.id === draft.inversor_id);
  const qtdModulos = draft.qtd_modulos ?? 0;
  const qtdInversores = draft.qtd_inversores ?? 1;
  const moduleUnit = module?.preco_venda ?? 0;
  const inverterUnit = inverter?.preco_venda ?? 0;
  const kwp = draft.kwp_instalado ?? 0;
  const structureMatch = (structures.data ?? []).find((item) => item.tipo_telhado === client?.tipo_telhado && item.placas_min <= qtdModulos && item.placas_max >= qtdModulos);
  const defaultStructure = structureMatch ? structureMatch.custo_por_placa * qtdModulos : 0;
  const structureCost = manualStructure ? draft.custo_estrutura ?? defaultStructure : defaultStructure;
  const cableDefault = defaultCableCost(kwp);
  const projectDefault = defaultProjectCost(kwp);
  const cableCost = draft.custo_cabos_protecoes ?? cableDefault;
  const projectCost = draft.custo_projeto_art ?? projectDefault;
  const laborCost = laborMode === "wp" ? kwp * 1000 * laborWp : draft.custo_mao_obra ?? 0;
  const margemPct = draft.margem_pct ?? 0.25;
  const pricing = calculatePricing({ modulo: { qtd: qtdModulos, preco: moduleUnit }, inversor: { qtd: qtdInversores, preco: inverterUnit }, custoEstrutura: structureCost, custoCabosProtecoes: cableCost, custoProjetoArt: projectCost, custoMaoObra: laborCost, outrosCustos: otherCosts, margemPct });
  const financial = calculateFinancialAnalysis({ valorInvestimento: pricing.valorFinal, geracaoMensalKwh: draft.geracao_estimada_mensal ?? 0, tarifaKwh: draft.tarifa_kwh ?? 0, custoDisponibilidadeKwh: draft.custo_disponibilidade_kwh ?? 0, reajusteTarifaAnualPct: 0.08, taxaDescontoAnualPct: 0.1, vidaUtilAnos: 25 });

  useEffect(() => {
    updateDraft({ custo_modulos: qtdModulos * moduleUnit, custo_inversor: qtdInversores * inverterUnit, custo_estrutura: structureCost, custo_cabos_protecoes: cableCost, custo_projeto_art: projectCost, custo_mao_obra: laborCost, custo_outros: pricing.custoOutros, custo_total: pricing.custoTotal, valor_total: pricing.valorFinal, valor_a_vista: pricing.valorFinal, economia_mensal: financial.economiaMensal, economia_anual: financial.economiaAnual, payback_anos: financial.paybackSimples, payback_descontado_anos: financial.paybackDescontado, co2_evitado_kg_ano: financial.co2EvitadoKgAno });
  }, [cableCost, financial.co2EvitadoKgAno, financial.economiaAnual, financial.economiaMensal, financial.paybackDescontado, financial.paybackSimples, laborCost, moduleUnit, pricing.custoOutros, pricing.custoTotal, pricing.valorFinal, projectCost, qtdInversores, qtdModulos, inverterUnit, structureCost, updateDraft]);

  useEffect(() => {
    if (!proposalId) return;
    const items = buildProposalItems({ draft, client, module, inverter, qtdModulos, qtdInversores, moduleUnit, inverterUnit, structureCost, cableCost, projectCost, laborCost, otherCosts });
    const timer = window.setTimeout(() => upsertItems.mutate({ proposalId, items }), 1200);
    return () => window.clearTimeout(timer);
  }, [proposalId, draft.modulo_modelo, draft.inversor_modelo, client?.tipo_telhado, module?.marca, inverter?.marca, qtdModulos, qtdInversores, moduleUnit, inverterUnit, structureCost, cableCost, projectCost, laborCost, otherCosts, upsertItems]);

  async function insertDefaultFinancing() {
    if (!proposalId) return;
    const defaults = [{ banco: "BV", prazo: 60, taxa: 1.99 }, { banco: "Solfácil", prazo: 72, taxa: 1.69 }, { banco: "Solfácil", prazo: 84, taxa: 1.69 }];
    for (const item of defaults) {
      const calc = calculatePmt(pricing.valorFinal, 0, item.taxa, item.prazo);
      await createFinancing.mutateAsync({ proposal_id: proposalId, banco: item.banco, prazo_meses: item.prazo, taxa_mensal: item.taxa, entrada: 0, valor_parcela: calc.valorParcela, valor_total_financiado: calc.valorFinanciado, incluir_proposta: true });
    }
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]"><div className="space-y-4"><Card className="shadow-soft"><CardHeader><CardTitle>Equipamentos</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qtd</TableHead><TableHead>Valor unit.</TableHead><TableHead>Total</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Módulo {draft.modulo_marca} {draft.modulo_modelo}</TableCell><TableCell>{qtdModulos}</TableCell><TableCell>{money(moduleUnit)}</TableCell><TableCell>{money(qtdModulos * moduleUnit)}</TableCell></TableRow><TableRow><TableCell>Inversor {draft.inversor_marca} {draft.inversor_modelo}</TableCell><TableCell>{qtdInversores}</TableCell><TableCell>{money(inverterUnit)}</TableCell><TableCell>{money(qtdInversores * inverterUnit)}</TableCell></TableRow></TableBody></Table><div className="mt-4 text-right font-bold">Subtotal equipamentos: {money(pricing.custoEquipamentos)}</div></CardContent></Card><CardBlock title="Estrutura"><Info label="Tipo / placas" value={`${client?.tipo_telhado ?? "—"} · ${qtdModulos} placas`} /><Info label="Custo por placa" value={structureMatch ? money(structureMatch.custo_por_placa) : "—"} />{!structureMatch ? <Alert className="md:col-span-2"><CircleAlert className="h-4 w-4" /><AlertDescription>Configure custo de estrutura para este tipo/quantidade nos Cadastros</AlertDescription></Alert> : null}<div className="md:col-span-2"><Button type="button" variant="outline" onClick={() => setManualStructure((value) => !value)}>Editar manualmente</Button>{manualStructure ? <NumberField label="Custo de estrutura" value={structureCost} onChange={(value) => updateDraft({ custo_estrutura: value })} /> : <p className="mt-3 font-bold">Total: {money(structureCost)}</p>}</div></CardBlock><EditableCost title="Cabos e proteções" value={cableCost} hint={`Default: ${money(cableDefault)}`} onChange={(value) => updateDraft({ custo_cabos_protecoes: value })} /><EditableCost title="Projeto + ART" value={projectCost} hint={`Default: ${money(projectDefault)}`} onChange={(value) => updateDraft({ custo_projeto_art: value })} /><CardBlock title="Mão de obra"><RadioGroup value={laborMode} onValueChange={(value) => setLaborMode(value as "wp" | "fixo")} className="flex gap-3"><label className="flex items-center gap-2 rounded-lg border px-3 py-2"><RadioGroupItem value="wp" />R$/Wp</label><label className="flex items-center gap-2 rounded-lg border px-3 py-2"><RadioGroupItem value="fixo" />Fixo</label></RadioGroup>{laborMode === "wp" ? <NumberField label="Valor por Wp" value={laborWp} step="0.01" hint="Default: R$ 0,80/Wp" onChange={setLaborWp} /> : <NumberField label="Valor fixo" value={draft.custo_mao_obra ?? 0} onChange={(value) => updateDraft({ custo_mao_obra: value })} />}<Info label="Total mão de obra" value={money(laborCost)} /></CardBlock><Card className="shadow-soft"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Outros custos</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => setOtherCosts((rows) => [...rows, { descricao: "", valor: 0 }])}><Plus className="h-4 w-4" />Adicionar</Button></CardHeader><CardContent className="space-y-3">{otherCosts.map((item, index) => <div key={index} className="grid gap-2 md:grid-cols-[1fr_180px_40px]"><Input placeholder="Descrição" value={item.descricao} onChange={(event) => setOtherCosts((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, descricao: event.target.value } : row))} /><Input type="number" value={item.valor} onChange={(event) => setOtherCosts((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, valor: event.target.valueAsNumber || 0 } : row))} /><Button type="button" variant="ghost" size="icon" onClick={() => setOtherCosts((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card><CardBlock title="Margem"><SliderField label="Margem aplicada" value={margemPct} min={0.1} max={0.35} step={0.01} suffix="%" tooltip="Margem aplicada sobre o custo total" onChange={(value) => updateDraft({ margem_pct: value })} /><Info label="Valor da margem" value={money(pricing.valorMargem)} /></CardBlock></div><FinancialSummary pricing={pricing} financial={financial} financing={financing.data ?? []} proposalId={proposalId} onInsertDefaults={insertDefaultFinancing} onAdd={() => setFinancingOpen(true)} onToggle={(row, checked) => updateFinancing.mutate({ id: row.id, proposal_id: row.proposal_id, incluir_proposta: checked })} onDelete={(row) => deleteFinancing.mutate({ id: row.id, proposalId: row.proposal_id })} /><FinancingDialog open={financingOpen} onOpenChange={setFinancingOpen} proposalId={proposalId} valorTotal={pricing.valorFinal} onCreate={(payload) => createFinancing.mutateAsync(payload)} /></div>;
}

function EditableCost({ title, value, hint, onChange }: { title: string; value: number; hint: string; onChange: (value: number) => void }) { return <CardBlock title={title}><NumberField label="Valor" value={value} hint={hint} onChange={onChange} /></CardBlock>; }

function buildProposalItems({ draft, client, module, inverter, qtdModulos, qtdInversores, moduleUnit, inverterUnit, structureCost, cableCost, projectCost, laborCost, otherCosts }: { draft: ProposalDraft; client: ClientRow | null; module?: { marca: string; modelo: string } | null; inverter?: { marca: string; modelo: string } | null; qtdModulos: number; qtdInversores: number; moduleUnit: number; inverterUnit: number; structureCost: number; cableCost: number; projectCost: number; laborCost: number; otherCosts: OtherCost[] }) {
  const base = [
    { ordem: 1, categoria: "equipamento", descricao: `Módulo ${module?.marca ?? draft.modulo_marca ?? ""} ${module?.modelo ?? draft.modulo_modelo ?? ""} (${qtdModulos} unidades)`, quantidade: qtdModulos, unidade: "un", valor_unitario: moduleUnit, valor_total: qtdModulos * moduleUnit },
    { ordem: 2, categoria: "equipamento", descricao: `Inversor ${inverter?.marca ?? draft.inversor_marca ?? ""} ${inverter?.modelo ?? draft.inversor_modelo ?? ""}`, quantidade: qtdInversores, unidade: "un", valor_unitario: inverterUnit, valor_total: qtdInversores * inverterUnit },
    { ordem: 3, categoria: "estrutura", descricao: `Estrutura para telhado ${client?.tipo_telhado ?? "—"} (${qtdModulos} placas)`, quantidade: qtdModulos, unidade: "serviço", valor_unitario: qtdModulos > 0 ? structureCost / qtdModulos : structureCost, valor_total: structureCost },
    { ordem: 4, categoria: "instalacao", descricao: "Cabos e proteções", quantidade: 1, unidade: "serviço", valor_unitario: cableCost, valor_total: cableCost },
    { ordem: 5, categoria: "projeto", descricao: "Projeto técnico + ART", quantidade: 1, unidade: "serviço", valor_unitario: projectCost, valor_total: projectCost },
    { ordem: 6, categoria: "instalacao", descricao: "Instalação e mão de obra", quantidade: 1, unidade: "serviço", valor_unitario: laborCost, valor_total: laborCost },
  ];
  return [...base, ...otherCosts.map((item, index) => ({ ordem: 7 + index, categoria: "outros", descricao: item.descricao || "Outros custos", quantidade: 1, unidade: "un", valor_unitario: item.valor, valor_total: item.valor }))];
}

const proposalTemplates = [
  { value: "on-grid-residencial", title: "On-Grid Residencial", description: "Para sistemas conectados à rede em residências", icon: Home },
  { value: "on-grid-comercial", title: "On-Grid Comercial", description: "Para empresas, lojas, escritórios", icon: Building2 },
  { value: "off-grid", title: "Off-Grid (isolado)", description: "Sistemas com baterias, sem rede", icon: BatteryCharging },
  { value: "rural", title: "Rural / Agronegócio", description: "Propriedades rurais, irrigação", icon: Tractor },
  { value: "comercial-gp", title: "Comercial Grande Porte", description: "Acima de 75 kWp", icon: Warehouse },
];

function PersonalizationStep({ proposalId, proposal, draft, client, updateDraft }: { proposalId?: string; proposal: { numero: string | null; company_id: string; vendedor_id: string | null } | null; draft: ProposalDraft; client: ClientRow | null; updateDraft: (patch: Partial<ProposalDraft>) => void }) {
  const modules = useModules({ search: "", ativo: true });
  const inverters = useInverters({ search: "", ativo: true });
  const photos = useProposalPhotos(proposalId);
  const photoMutations = useProposalPhotoMutations(proposalId);
  const context = useProposalContext(proposal);
  const financing = useProposalFinancing(proposalId);
  const [dragId, setDragId] = useState<string | null>(null);
  const selectedTemplate = proposalTemplates.find((item) => item.value === (draft.template ?? "on-grid-residencial")) ?? proposalTemplates[0];
  const selectedModule = modules.data?.find((item) => item.id === draft.modulo_id);
  const selectedInverter = inverters.data?.find((item) => item.id === draft.inversor_id);
  const validade = draft.validade_dias ?? 15;
  const validUntil = useMemo(() => addDays(validade), [validade]);
  const commercialNotes = draft.observacoes_comerciais ?? "";

  useEffect(() => {
    if (!draft.template) updateDraft({ template: "on-grid-residencial" });
  }, [draft.template, updateDraft]);

  useEffect(() => {
    if (draft.valido_ate !== validUntil.iso) updateDraft({ valido_ate: validUntil.iso });
  }, [draft.valido_ate, updateDraft, validUntil.iso]);

  useEffect(() => {
    if (!draft.personalizar_garantias) {
      updateDraft({ garantia_modulo_anos: selectedModule?.garantia_geracao_anos ?? 25, garantia_inversor_anos: selectedInverter?.garantia_anos ?? 10, garantia_instalacao_anos: 1, prazo_execucao_dias_uteis: 30, prazo_homologacao_dias: 90 });
    }
  }, [draft.personalizar_garantias, selectedInverter?.garantia_anos, selectedModule?.garantia_geracao_anos, updateDraft]);

  function onFiles(files: FileList | null) {
    if (!files || !proposalId) return;
    const current = photos.data?.length ?? 0;
    photoMutations.upload.mutate(Array.from(files).slice(0, Math.max(0, 6 - current)));
  }

  function reorder(dropId: string) {
    if (!dragId || dragId === dropId || !photos.data) return;
    const rows = [...photos.data];
    const from = rows.findIndex((item) => item.id === dragId);
    const to = rows.findIndex((item) => item.id === dropId);
    if (from < 0 || to < 0) return;
    const [moved] = rows.splice(from, 1);
    rows.splice(to, 0, moved);
    rows.forEach((photo, ordem) => photoMutations.update.mutate({ id: photo.id, legenda: photo.legenda, ordem }));
    setDragId(null);
  }

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)]"><div className="space-y-4"><Card className="shadow-soft"><CardHeader><CardTitle>Template da proposta</CardTitle></CardHeader><CardContent><RadioGroup value={draft.template ?? "on-grid-residencial"} onValueChange={(template) => updateDraft({ template })} className="grid gap-3 md:grid-cols-2">{proposalTemplates.map((template) => <TemplateCard key={template.value} template={template} selected={template.value === (draft.template ?? "on-grid-residencial")} />)}</RadioGroup></CardContent></Card><Card className="shadow-soft"><CardHeader><CardTitle>Fotos de projetos similares</CardTitle></CardHeader><CardContent className="space-y-4"><label className={cn("flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors", !proposalId && "cursor-not-allowed opacity-60")}><Upload className="mb-2 h-8 w-8 text-muted-foreground" /><span className="font-semibold">Arraste imagens ou clique para enviar</span><span className="text-sm text-muted-foreground">JPG, PNG ou WebP · até 6 fotos · 5MB cada</span><input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!proposalId || (photos.data?.length ?? 0) >= 6} onChange={(event) => onFiles(event.target.files)} /></label><Button type="button" variant="outline" disabled>{/* TODO: selecionar fotos da biblioteca da empresa */}<ImageIcon className="h-4 w-4" />Selecionar da biblioteca</Button><div className="grid gap-3 md:grid-cols-2">{photos.data?.map((photo) => <div key={photo.id} draggable onDragStart={() => setDragId(photo.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(photo.id)} className="rounded-lg border bg-card p-2"><div className="relative aspect-video overflow-hidden rounded-md bg-muted"><img src={photo.url} alt={photo.legenda || "Foto de projeto similar"} className="h-full w-full object-cover" /><GripVertical className="absolute left-2 top-2 h-5 w-5 rounded bg-background/80 p-0.5" /></div><div className="mt-2 flex gap-2"><Input maxLength={100} placeholder="Legenda da foto" value={photo.legenda ?? ""} onChange={(event) => photoMutations.update.mutate({ id: photo.id, ordem: photo.ordem ?? 0, legenda: event.target.value.slice(0, 100) })} /><Button type="button" variant="ghost" size="icon" onClick={() => photoMutations.remove.mutate(photo.id)}><Trash2 className="h-4 w-4" /></Button></div></div>)}</div></CardContent></Card><Card className="shadow-soft"><CardHeader><CardTitle>Observações comerciais</CardTitle></CardHeader><CardContent className="space-y-2"><Textarea rows={8} maxLength={2000} value={commercialNotes} placeholder="Ex: Prazo de entrega de 45 dias após assinatura. Condições especiais para pagamento à vista..." onChange={(event) => updateDraft({ observacoes_comerciais: event.target.value.slice(0, 2000) })} /><p className="text-right text-xs text-muted-foreground">{commercialNotes.length}/2000 caracteres</p></CardContent></Card><CardBlock title="Validade e detalhes"><NumberField label="Validade da proposta (dias)" value={validade} hint={`Válida até ${validUntil.label}`} onChange={(value) => updateDraft({ validade_dias: Math.max(1, Math.round(value)) })} /><Info label="Número da proposta" value={proposal?.numero ?? "Gerando..."} /><SellerCard seller={context.data?.seller ?? null} /></CardBlock><Collapsible defaultOpen={false}><Card className="shadow-soft"><CardHeader><CollapsibleTrigger asChild><button type="button" className="flex w-full items-center justify-between text-left"><CardTitle>Garantias e prazos</CardTitle><Switch checked={draft.personalizar_garantias} onCheckedChange={(checked) => updateDraft({ personalizar_garantias: checked })} /></button></CollapsibleTrigger></CardHeader><CollapsibleContent><CardContent className="grid gap-4 md:grid-cols-2">{draft.personalizar_garantias ? <><NumberField label="Garantia do módulo (anos)" value={draft.garantia_modulo_anos ?? selectedModule?.garantia_geracao_anos ?? 25} onChange={(value) => updateDraft({ garantia_modulo_anos: Math.round(value) })} /><NumberField label="Garantia do inversor (anos)" value={draft.garantia_inversor_anos ?? selectedInverter?.garantia_anos ?? 10} onChange={(value) => updateDraft({ garantia_inversor_anos: Math.round(value) })} /><NumberField label="Garantia da instalação (anos)" value={draft.garantia_instalacao_anos ?? 1} onChange={(value) => updateDraft({ garantia_instalacao_anos: Math.round(value) })} /><NumberField label="Prazo de execução (dias úteis)" value={draft.prazo_execucao_dias_uteis ?? 30} onChange={(value) => updateDraft({ prazo_execucao_dias_uteis: Math.round(value) })} /><NumberField label="Prazo de homologação (dias)" value={draft.prazo_homologacao_dias ?? 90} onChange={(value) => updateDraft({ prazo_homologacao_dias: Math.round(value) })} /></> : <div className="md:col-span-2 grid gap-3 md:grid-cols-3"><Info label="Módulo" value={`${draft.garantia_modulo_anos ?? selectedModule?.garantia_geracao_anos ?? 25} anos`} /><Info label="Inversor" value={`${draft.garantia_inversor_anos ?? selectedInverter?.garantia_anos ?? 10} anos`} /><Info label="Instalação" value="1 ano" /><Info label="Execução" value="30 dias úteis" /><Info label="Homologação" value="90 dias" /></div>}</CardContent></CollapsibleContent></Card></Collapsible></div><ProposalCoverPreview template={selectedTemplate} draft={draft} proposal={proposal} client={client} company={context.data?.company ?? null} photosCount={photos.data?.length ?? 0} financingCount={financing.data?.filter((item) => item.incluir_proposta).length ?? 0} /></div>;
}

function TemplateCard({ template, selected }: { template: (typeof proposalTemplates)[number]; selected: boolean }) { const Icon = template.icon; return <label className={cn("cursor-pointer rounded-lg border p-4 transition-colors", selected && "border-primary bg-primary/10")}><RadioGroupItem value={template.value} className="sr-only" /><div className="mb-3 flex aspect-[16/9] items-center justify-center rounded-md bg-muted"><Icon className="h-12 w-12 text-primary" /></div><p className="font-bold">{template.title}</p><p className="text-sm text-muted-foreground">{template.description}</p></label>; }
function SellerCard({ seller }: { seller: { nome: string; email: string; telefone: string | null; avatar_url: string | null; cargo: string | null } | null }) { return <div className="md:col-span-2 rounded-lg border p-3"><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Vendedor responsável</p><div className="flex items-center gap-3"><Avatar>{seller?.avatar_url ? <img src={seller.avatar_url} alt={seller.nome} className="h-full w-full object-cover" /> : null}<AvatarFallback>{seller?.nome?.slice(0, 2).toUpperCase() ?? "VD"}</AvatarFallback></Avatar><div><p className="font-semibold">{seller?.nome ?? "Usuário logado"}</p><p className="text-sm text-muted-foreground">{seller?.email ?? "—"} {seller?.telefone ? `· ${seller.telefone}` : ""}</p></div></div></div>; }
function ProposalCoverPreview({ template, draft, proposal, client, company, photosCount, financingCount }: { template: (typeof proposalTemplates)[number]; draft: ProposalDraft; proposal: { numero: string | null } | null; client: ClientRow | null; company: { nome_fantasia: string | null; razao_social: string; logo_url: string | null } | null; photosCount: number; financingCount: number }) { const Icon = template.icon; const blocks = ["Capa", "Compromisso ENERGIZA SOLLAR", "Análise da conta", "Sistema dimensionado", "Equipamentos detalhados", "Análise financeira", financingCount > 0 ? "Opções de pagamento" : null, photosCount > 0 ? "Fotos de projetos similares" : null, "Observações", "Garantias e prazos", "Validade e dados de contato"].filter(Boolean) as string[]; return <aside className="xl:sticky xl:top-40 xl:self-start"><Card className="shadow-soft"><CardHeader><CardTitle>Preview da capa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="overflow-hidden rounded-lg border bg-card"><div className="bg-primary p-5 text-primary-foreground"><div className="mb-10 flex items-center justify-between gap-3"><div className="flex items-center gap-3">{company?.logo_url ? <img src={company.logo_url} alt={company.nome_fantasia ?? company.razao_social} className="h-10 w-10 rounded bg-background object-contain" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-background/20"><Icon className="h-6 w-6" /></div>}<span className="text-sm font-bold">{company?.nome_fantasia ?? "ENERGIZA SOLLAR"}</span></div><span className="text-xs">{new Date().toLocaleDateString("pt-BR")}</span></div><p className="text-xs uppercase tracking-wide opacity-80">{template.title}</p><h2 className="mt-2 text-3xl font-black">PROPOSTA COMERCIAL</h2></div><div className="space-y-4 p-5"><Info label="Número" value={proposal?.numero ?? "2026-0001"} /><Info label="Cliente" value={client?.nome ?? "Cliente selecionado"} /><Info label="Sistema" value={`${number(draft.kwp_instalado ?? 0, 2)} kWp`} /><Info label="Valor total" value={money(draft.valor_total ?? 0)} /></div></div><div className="rounded-lg border p-4"><h3 className="mb-3 font-bold">Blocos do PDF</h3><div className="space-y-2">{blocks.map((block) => <p key={block} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" />{block}</p>)}</div></div></CardContent></Card></aside>; }
function addDays(days: number) { const date = new Date(); date.setDate(date.getDate() + Math.max(1, Math.round(days || 15))); return { iso: date.toISOString().slice(0, 10), label: date.toLocaleDateString("pt-BR") }; }

function FinancialSummary({ pricing, financial, financing, proposalId, onInsertDefaults, onAdd, onToggle, onDelete }: { pricing: ReturnType<typeof calculatePricing>; financial: ReturnType<typeof calculateFinancialAnalysis>; financing: { id: string; proposal_id: string; banco: string | null; prazo_meses: number | null; valor_parcela: number | null; incluir_proposta: boolean }[]; proposalId?: string; onInsertDefaults: () => void; onAdd: () => void; onToggle: (row: { id: string; proposal_id: string }, checked: boolean) => void; onDelete: (row: { id: string; proposal_id: string }) => void }) { return <aside className="xl:sticky xl:top-40 xl:self-start"><Card className="shadow-soft"><CardHeader><CardTitle>Resumo financeiro</CardTitle></CardHeader><CardContent className="space-y-5"><SummaryGroup title="Composição" rows={[["Equipamentos", money(pricing.custoEquipamentos)], ["Estrutura", money(pricing.custoTotal - pricing.custoEquipamentos - pricing.custoOutros)], ["Outros", money(pricing.custoOutros)], ["Custo total", money(pricing.custoTotal)], ["Margem", money(pricing.valorMargem)], ["VALOR FINAL", money(pricing.valorFinal)]]} /><SummaryGroup title="Análise financeira" rows={[["Economia mensal", money(financial.economiaMensal)], ["Economia anual", money(financial.economiaAnual)], ["Payback", `${number(financial.paybackSimples, 1)} anos`], ["CO₂ evitado", `${number(financial.co2EvitadoKgAno)} kg/ano`]]} /><div className="rounded-lg border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Financiamento</h3><Button size="sm" variant="outline" disabled={!proposalId} onClick={onAdd}><Plus className="h-4 w-4" />Adicionar</Button></div><div className="space-y-2">{financing.map((row) => <div key={row.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={row.incluir_proposta} onChange={(event) => onToggle(row, event.target.checked)} />{row.banco} {row.prazo_meses}x {money(row.valor_parcela ?? 0)}</label><Button variant="ghost" size="icon" onClick={() => onDelete(row)}><Trash2 className="h-4 w-4" /></Button></div>)}</div><Button className="mt-3 w-full" variant="outline" disabled={!proposalId} onClick={onInsertDefaults}>Inserir simulações padrão</Button></div></CardContent></Card></aside>; }

const bankRates: Record<string, number> = { BV: 1.99, Santander: 1.89, Sicredi: 1.75, "Solfácil": 1.69, Outro: 1.99 };
function FinancingDialog({ open, onOpenChange, proposalId, valorTotal, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; proposalId?: string; valorTotal: number; onCreate: (payload: { proposal_id: string; banco: string; prazo_meses: number; taxa_mensal: number; entrada: number; valor_parcela: number; valor_total_financiado: number; incluir_proposta: boolean }) => Promise<unknown> }) { const form = useForm({ defaultValues: { banco: "BV", prazo: 60, taxa: 1.99, entrada: 0 } }); const banco = form.watch("banco"); const prazo = form.watch("prazo"); const taxa = form.watch("taxa"); const entrada = form.watch("entrada"); const calc = calculatePmt(valorTotal, entrada, taxa, prazo); useEffect(() => { form.setValue("taxa", bankRates[banco] ?? 1.99); }, [banco, form]); async function submit() { if (!proposalId) return; await onCreate({ proposal_id: proposalId, banco, prazo_meses: prazo, taxa_mensal: taxa, entrada, valor_parcela: calc.valorParcela, valor_total_financiado: calc.valorFinanciado, incluir_proposta: true }); onOpenChange(false); } return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Adicionar simulação</DialogTitle></DialogHeader><div className="grid gap-4"><Select value={banco} onValueChange={(value) => form.setValue("banco", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(bankRates).map((bank) => <SelectItem key={bank} value={bank}>{bank}</SelectItem>)}</SelectContent></Select><Select value={String(prazo)} onValueChange={(value) => form.setValue("prazo", Number(value))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[24, 36, 48, 60, 72, 84, 96, 120].map((months) => <SelectItem key={months} value={String(months)}>{months} meses</SelectItem>)}</SelectContent></Select><NumberField label="Taxa mensal (% a.m.)" value={taxa} step="0.0001" onChange={(value) => form.setValue("taxa", value)} /><NumberField label="Entrada" value={entrada} onChange={(value) => form.setValue("entrada", value)} /><div className="rounded-lg border p-3 text-sm"><p>Parcela: <strong>{money(calc.valorParcela)}</strong></p><p>Total pago: <strong>{money(calc.totalPago)}</strong></p><p>Custo do financiamento: <strong>{money(calc.custoFinanciamento)}</strong></p></div><Button onClick={submit} disabled={!proposalId}>Salvar simulação</Button></div></DialogContent></Dialog>; }

function CardBlock({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="shadow-soft"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent></Card>; }
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div><p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p><p className="font-medium">{value || "—"}</p></div>; }
function money(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(value); }
function number(value: number, digits = 0) { return Number.isFinite(value) ? value.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits }) : "0"; }
function defaultAvailability(tipo?: string | null) { if (tipo === "trifasica") return 100; if (tipo === "bifasica") return 50; return 30; }
function findTariff(tariffs: { concessionaria: string; uf: string; valor_kwh: number }[], concessionaria: string, uf: string) { return tariffs.find((tariff) => tariff.concessionaria.toLowerCase() === concessionaria.toLowerCase() && tariff.uf === uf) ?? tariffs.find((tariff) => tariff.uf === uf); }
function isCompatibleInverter(inverter: InverterRow, kwp: number, tipo?: string | null) { const byPower = kwp <= 0 || (inverter.potencia_kw >= kwp * 0.7 && inverter.potencia_kw <= kwp * 1.3); const fases = (inverter.fases ?? "").toLowerCase(); const byPhase = tipo === "trifasica" ? fases.includes("tri") : tipo === "bifasica" ? fases.includes("bi") || fases.includes("mono") : fases.includes("mono") || !fases; return byPower && byPhase; }

function CitySelect({ cities, value, onSelect }: { cities: CityRow[]; value: string; onSelect: (city: CityRow) => void }) { const [open, setOpen] = useState(false); return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><Button variant="outline" className="justify-between"><span>{value === "/" ? "Cidade do projeto" : value}</span><ChevronsUpDown className="h-4 w-4 opacity-60" /></Button></PopoverTrigger><PopoverContent className="w-80 p-0"><Command><CommandInput placeholder="Buscar cidade" /><CommandList><CommandEmpty>Nenhuma cidade.</CommandEmpty><CommandGroup>{cities.map((city) => <CommandItem key={city.id} value={`${city.cidade} ${city.uf}`} onSelect={() => { onSelect(city); setOpen(false); }}>{city.cidade}/{city.uf}<span className="ml-auto text-xs text-muted-foreground">HSP {city.hsp_medio}</span></CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover>; }
function TariffField({ value, onChange }: { value: number; onChange: (value: number) => void }) { const form = useForm<{ tarifa: number }>({ resolver: zodResolver(z.object({ tarifa: z.number().min(0) })), values: { tarifa: value } }); return <Form {...form}><MoneyInput control={form.control} name="tarifa" label="Tarifa kWh" decimals={4} /><input type="hidden" value={value} onChange={() => undefined} />{form.watch("tarifa") !== value ? <SyncValue value={form.watch("tarifa")} onChange={onChange} /> : null}</Form>; }
function SyncValue({ value, onChange }: { value: number; onChange: (value: number) => void }) { useEffect(() => onChange(value), [onChange, value]); return null; }
function NumberField({ label, value, hint, step = "1", onChange }: { label: string; value: number; hint?: string; step?: string; onChange: (value: number) => void }) { return <div className="space-y-2"><label className="text-sm font-medium">{label}</label><Input type="number" step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(event.target.valueAsNumber || 0)} />{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>; }
function SliderField({ label, value, min, max, step, suffix, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; tooltip: string; onChange: (value: number) => void }) { return <TooltipProvider><div className="space-y-3"><div className="flex items-center justify-between gap-2"><label className="inline-flex items-center gap-1 text-sm font-medium">{label}<Tooltip><TooltipTrigger asChild><CircleHelp className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent>{tooltip}</TooltipContent></Tooltip></label><span className="text-sm font-bold">{suffix === "%" ? `${Math.round(value * 100)}%` : value}</span></div><Slider min={min} max={max} step={step} value={[value]} onValueChange={([next]) => onChange(next ?? value)} /></div></TooltipProvider>; }
function SizingSummary({ contaMedia, tarifa, disponibilidade, meta, hsp, pr, sizing, kwpInstalled, realGenerationMonthly }: { contaMedia: number; tarifa: number; disponibilidade: number; meta: number; hsp: number; pr: number; sizing: ReturnType<typeof calculateSolarSizing>; kwpInstalled: number; realGenerationMonthly: number }) { return <aside className="xl:sticky xl:top-40 xl:self-start"><Card className="shadow-soft"><CardHeader><CardTitle>Resumo do dimensionamento</CardTitle></CardHeader><CardContent className="space-y-5"><SummaryGroup title="Análise da conta" rows={[["Conta média", money(contaMedia)], ["Tarifa", `${money(tarifa)}/kWh`], ["Consumo estimado", `${number(sizing.consumoEstimadoKwh)} kWh/mês`], ["Disponibilidade", `-${number(disponibilidade)} kWh`], ["A compensar", `${number(sizing.energiaACompensarKwh)} kWh/mês`], [`× meta ${Math.round(meta * 100)}%`, `${number(sizing.energiaACompensarKwh)} kWh/mês`]]} /><SummaryGroup title="Sistema necessário" rows={[["HSP", `${number(hsp, 2)} h/dia`], ["PR", `${Math.round(pr * 100)}%`], ["kWp necessário", `${number(sizing.kWpNecessario, 2)} kWp`], ["kWp instalado", kwpInstalled ? `${number(kwpInstalled, 2)} kWp` : "—"], ["Geração mensal", `${number(realGenerationMonthly)} kWh/mês`], ["Geração anual", `${number(realGenerationMonthly * 12)} kWh/ano`], ["Cobertura", sizing.consumoEstimadoKwh > 0 ? `${number((realGenerationMonthly / sizing.consumoEstimadoKwh) * 100)}%` : "—"]]} /></CardContent></Card></aside>; }
function SummaryGroup({ title, rows }: { title: string; rows: [string, string][] }) { return <div className="rounded-lg border p-4"><h3 className="mb-3 font-bold">{title}</h3><div className="space-y-2">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-semibold">{value}</span></div>)}</div></div>; }
