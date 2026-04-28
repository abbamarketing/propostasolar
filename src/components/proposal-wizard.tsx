import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown, CircleAlert, CircleHelp, Clock, Loader2, Plus, RefreshCcw, Save, Search, UserRound } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCities, useInverters, useModules, useTariffs, type CityRow, type InverterRow, type ModuleRow } from "@/hooks/use-catalog-data";
import { concessionarias, useClient, useClients, useCreateClient, useUpdateClient, type ClientRow } from "@/hooks/use-clients";
import { type ProposalDraft, useProposalAutosave } from "@/hooks/use-proposal-wizard";
import { calculateSolarSizing } from "@/lib/solar-sizing";
import { cn } from "@/lib/utils";

const steps = ["Cliente", "Dimensionamento", "Precificação", "Personalização", "Revisão"] as const;
const stepOneSchema = z.object({ client_id: z.string().uuid("Selecione um cliente para avançar.") });
const stepTwoSchema = z.object({ modulo_id: z.string().uuid("Selecione o módulo."), inversor_id: z.string().uuid("Selecione o inversor."), kwp_instalado: z.number().positive("Informe uma potência instalada válida.") });

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
    return false;
  }

  function next() {
    const result = step === 0 ? stepOneSchema.safeParse({ client_id: autosave.draft.client_id }) : stepTwoSchema.safeParse({ modulo_id: autosave.draft.modulo_id, inversor_id: autosave.draft.inversor_id, kwp_instalado: autosave.draft.kwp_instalado ?? 0 });
    if (!result.success) {
      setValidationMessage(result.error.issues[0]?.message ?? "Preencha os campos obrigatórios.");
      return;
    }
    setValidationMessage("");
    setStep((current) => Math.min(current + 1, 2));
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
              const completed = index === 0 ? Boolean(autosave.draft.client_id) : index === 1 ? Boolean(autosave.draft.modulo_id && autosave.draft.inversor_id && (autosave.draft.kwp_instalado ?? 0) > 0) : false;
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
        {step >= 2 ? <Card className="shadow-soft"><CardContent className="py-12 text-center text-muted-foreground">As próximas etapas serão implementadas nos próximos prompts.</CardContent></Card> : null}
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex items-center justify-between gap-3"><Button variant="outline" onClick={back}>Voltar</Button><span className="hidden text-sm text-muted-foreground md:inline">Salvo automaticamente</span><Button onClick={next} disabled={step >= 2}>Próximo</Button></div>
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
