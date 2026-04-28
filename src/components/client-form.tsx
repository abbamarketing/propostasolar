import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Control, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CepInput, CnpjInput, CpfInput, PhoneInput } from "@/components/inputs/masked-inputs";
import { MoneyInput } from "@/components/inputs/money-input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type ClientRow, concessionarias, estados } from "@/hooks/use-clients";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/lib/br-validation";

const optionalEmail = z.preprocess(
  (value) => value === "" ? null : value,
  z.string().email("Informe um e-mail válido.").nullable().optional(),
) as z.ZodType<string | null | undefined>;
const optionalNumber = z.preprocess(
  (value) => value === "" || value === null || value === undefined || Number.isNaN(value) ? null : Number(value),
  z.number().min(0, "Informe um valor maior ou igual a zero.").nullable().optional(),
) as z.ZodType<number | null | undefined>;
export const clientFormSchema = z.object({
  tipo: z.enum(["PF", "PJ"], { required_error: "Selecione o tipo de cliente." }),
  nome: z.string().trim().min(2, "Informe pelo menos 2 caracteres."),
  nome_fantasia: z.string().trim().optional().nullable(),
  cpf_cnpj: z.string().min(1, "Informe o documento."),
  rg_ie: z.string().trim().optional().nullable(),
  email: optionalEmail,
  telefone: z.string().optional().nullable().refine((value) => !value || [10, 11].includes(onlyDigits(value).length), "Telefone deve ter 10 ou 11 dígitos."),
  whatsapp: z.string().optional().nullable().refine((value) => !value || [10, 11].includes(onlyDigits(value).length), "WhatsApp deve ter 10 ou 11 dígitos."),
  endereco_cep: z.string().optional().nullable().refine((value) => !value || onlyDigits(value).length === 8, "CEP deve ter 8 dígitos."),
  endereco_logradouro: z.string().trim().optional().nullable(),
  endereco_numero: z.string().trim().optional().nullable(),
  endereco_complemento: z.string().trim().optional().nullable(),
  endereco_bairro: z.string().trim().optional().nullable(),
  endereco_cidade: z.string().trim().optional().nullable(),
  endereco_uf: z.string().optional().nullable(),
  concessionaria: z.string().min(1, "Selecione a concessionária."),
  numero_instalacao: z.string().trim().optional().nullable(),
  tipo_ligacao: z.enum(["monofasica", "bifasica", "trifasica"], { required_error: "Selecione o tipo de ligação." }),
  tipo_telhado: z.string().min(1, "Selecione o tipo de telhado."),
  conta_luz_media: optionalNumber,
  consumo_medio_kwh: optionalNumber,
  conta_luz_url: z.string().optional().nullable(),
  observacoes: z.string().max(2000, "Use no máximo 2000 caracteres.").optional().nullable(),
}).superRefine((data, ctx) => {
  const digits = onlyDigits(data.cpf_cnpj);
  if (data.tipo === "PF" && (digits.length !== 11 || !isValidCpf(digits))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf_cnpj"], message: "CPF inválido." });
  if (data.tipo === "PJ" && (digits.length !== 14 || !isValidCnpj(digits))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf_cnpj"], message: "CNPJ inválido." });
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

type ClientFormProps = {
  initialData?: ClientRow | null;
  onSubmit: (values: ClientFormValues, action: "save" | "proposal", lightBill?: File | null) => Promise<void>;
  isSubmitting?: boolean;
};

type BrasilApiCnpj = {
  razao_social?: string;
  nome_fantasia?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  complemento?: string;
};

const roofOptions = [
  { value: "colonial", label: "Colonial" },
  { value: "fibrocimento", label: "Fibrocimento" },
  { value: "metalico", label: "Metálico" },
  { value: "laje", label: "Laje" },
  { value: "solo", label: "Solo" },
  { value: "outro", label: "Outro" },
];

export function clientToFormValues(client?: ClientRow | null): ClientFormValues {
  return {
    tipo: client?.tipo === "PJ" ? "PJ" : "PF",
    nome: client?.nome ?? "",
    nome_fantasia: client?.nome_fantasia ?? "",
    cpf_cnpj: client?.cpf_cnpj ?? "",
    rg_ie: client?.rg_ie ?? "",
    email: client?.email ?? "",
    telefone: client?.telefone ?? "",
    whatsapp: client?.whatsapp ?? "",
    endereco_cep: client?.endereco_cep ?? "",
    endereco_logradouro: client?.endereco_logradouro ?? "",
    endereco_numero: client?.endereco_numero ?? "",
    endereco_complemento: client?.endereco_complemento ?? "",
    endereco_bairro: client?.endereco_bairro ?? "",
    endereco_cidade: client?.endereco_cidade ?? "",
    endereco_uf: client?.endereco_uf ?? "MG",
    concessionaria: client?.concessionaria ?? "CEMIG",
    numero_instalacao: client?.numero_instalacao ?? "",
    tipo_ligacao: client?.tipo_ligacao === "bifasica" || client?.tipo_ligacao === "trifasica" ? client.tipo_ligacao : "monofasica",
    tipo_telhado: client?.tipo_telhado ?? "colonial",
    conta_luz_media: client?.conta_luz_media ?? 0,
    consumo_medio_kwh: client?.consumo_medio_kwh ?? null,
    conta_luz_url: client?.conta_luz_url ?? null,
    observacoes: client?.observacoes ?? "",
  };
}

export function ClientForm({ initialData, onSubmit, isSubmitting = false }: ClientFormProps) {
  const isEditing = Boolean(initialData?.id);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const [sameWhatsapp, setSameWhatsapp] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [lightBill, setLightBill] = useState<File | null>(null);
  const [mobileStep, setMobileStep] = useState(0);
  const formValues = useMemo(() => clientToFormValues(initialData), [initialData]);
  const form = useForm<ClientFormValues>({ resolver: zodResolver(clientFormSchema), defaultValues: formValues });
  const tipo = form.watch("tipo");
  const telefone = form.watch("telefone");
  const previewUrl = useMemo(() => lightBill && lightBill.type.startsWith("image/") ? URL.createObjectURL(lightBill) : null, [lightBill]);

  useEffect(() => { firstInputRef.current?.focus(); }, []);
  useEffect(() => { form.reset(formValues); }, [form, formValues]);
  useEffect(() => { if (sameWhatsapp) form.setValue("whatsapp", telefone ?? "", { shouldValidate: true }); }, [form, sameWhatsapp, telefone]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function lookupCep() {
    const cep = onlyDigits(form.getValues("endereco_cep") ?? "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) throw new Error("CEP não encontrado");
      const data = await response.json() as ViaCepResponse;
      if (data.erro) throw new Error("CEP não encontrado");
      form.setValue("endereco_logradouro", data.logradouro ?? "");
      form.setValue("endereco_bairro", data.bairro ?? "");
      form.setValue("endereco_cidade", data.localidade ?? "");
      form.setValue("endereco_uf", data.uf ?? "MG");
      if (data.complemento) form.setValue("endereco_complemento", data.complemento);
    } catch {
      toast.error("CEP não encontrado");
    } finally {
      setCepLoading(false);
    }
  }

  async function lookupCnpj() {
    const cnpj = onlyDigits(form.getValues("cpf_cnpj"));
    if (tipo !== "PJ" || cnpj.length !== 14 || !isValidCnpj(cnpj)) return;
    setCnpjLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error("CNPJ não encontrado");
      const data = await response.json() as BrasilApiCnpj;
      form.setValue("nome", data.razao_social ?? form.getValues("nome"), { shouldValidate: true });
      form.setValue("nome_fantasia", data.nome_fantasia ?? "");
      form.setValue("endereco_cep", data.cep ?? "");
      form.setValue("endereco_logradouro", data.logradouro ?? "");
      form.setValue("endereco_numero", data.numero ?? "");
      form.setValue("endereco_complemento", data.complemento ?? "");
      form.setValue("endereco_bairro", data.bairro ?? "");
      form.setValue("endereco_cidade", data.municipio ?? "");
      form.setValue("endereco_uf", data.uf ?? "MG");
    } catch {
      toast.error("Não foi possível consultar o CNPJ.");
    } finally {
      setCnpjLoading(false);
    }
  }

  function submit(action: "save" | "proposal") {
    return form.handleSubmit((values) => onSubmit(values, action, lightBill));
  }

  const sectionNames = ["Identificação", "Contato", "Endereço", "Energia"];
  const sections = [
    <IdentificationSection key="id" form={form} tipo={tipo} isEditing={isEditing} cnpjLoading={cnpjLoading} lookupCnpj={lookupCnpj} firstInputRef={firstInputRef} />,
    <ContactSection key="contact" form={form} sameWhatsapp={sameWhatsapp} setSameWhatsapp={setSameWhatsapp} />,
    <AddressSection key="address" form={form} cepLoading={cepLoading} lookupCep={lookupCep} />,
    <EnergySection key="energy" form={form} lightBill={lightBill} setLightBill={setLightBill} previewUrl={previewUrl} />,
  ];

  return (
    <Form {...form}>
      <form onSubmit={submit("save")} className="space-y-6">
        <div className="md:hidden">
          <Card className="shadow-soft">
            <CardHeader><CardTitle>{sectionNames[mobileStep]}</CardTitle></CardHeader>
            <CardContent>{sections[mobileStep]}</CardContent>
          </Card>
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" disabled={mobileStep === 0} onClick={() => setMobileStep((step) => Math.max(0, step - 1))}>Voltar</Button>
            {mobileStep < sections.length - 1 ? <Button type="button" onClick={() => setMobileStep((step) => Math.min(sections.length - 1, step + 1))}>Próximo</Button> : <SubmitButtons isEditing={isEditing} isSubmitting={isSubmitting} onProposal={submit("proposal")} />}
          </div>
        </div>
        <Accordion type="multiple" defaultValue={["identificacao", "contato", "endereco", "energia"]} className="hidden space-y-4 md:block">
          <FormAccordionItem value="identificacao" title="Identificação">{sections[0]}</FormAccordionItem>
          <FormAccordionItem value="contato" title="Contato">{sections[1]}</FormAccordionItem>
          <FormAccordionItem value="endereco" title="Endereço">{sections[2]}</FormAccordionItem>
          <FormAccordionItem value="energia" title="Dados de energia">{sections[3]}</FormAccordionItem>
        </Accordion>
        <Card className="hidden shadow-soft md:block"><CardContent className="pt-6"><TextareaField form={form} name="observacoes" label="Observações" /></CardContent></Card>
        <div className="hidden justify-end gap-2 md:flex"><SubmitButtons isEditing={isEditing} isSubmitting={isSubmitting} onProposal={submit("proposal")} /></div>
      </form>
    </Form>
  );
}

function SubmitButtons({ isEditing, isSubmitting, onProposal }: { isEditing: boolean; isSubmitting: boolean; onProposal: () => void }) {
  return <><Button type="submit" disabled={isSubmitting}><Save className="h-4 w-4" />Salvar</Button>{!isEditing ? <Button type="button" variant="outline" disabled={isSubmitting} onClick={onProposal}><Zap className="h-4 w-4" />Salvar e nova proposta</Button> : null}</>;
}

function FormAccordionItem({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return <Card className="mb-4 shadow-soft"><AccordionItem value={value} className="border-0"><CardHeader><AccordionTrigger className="py-0 hover:no-underline"><CardTitle>{title}</CardTitle></AccordionTrigger></CardHeader><AccordionContent><CardContent>{children}</CardContent></AccordionContent></AccordionItem></Card>;
}

function IdentificationSection({ form, tipo, isEditing, cnpjLoading, lookupCnpj, firstInputRef }: { form: UseFormReturn<ClientFormValues>; tipo: "PF" | "PJ"; isEditing: boolean; cnpjLoading: boolean; lookupCnpj: () => void; firstInputRef: React.RefObject<HTMLInputElement | null> }) {
  return <div className="grid gap-4 md:grid-cols-2"><FormField control={form.control} name="tipo" render={({ field }) => <FormItem className="md:col-span-2"><FormLabel>Tipo de cliente</FormLabel><FormControl><RadioGroup value={field.value} onValueChange={field.onChange} disabled={isEditing} className="flex gap-4"><RadioOption value="PF" label="PF" /><RadioOption value="PJ" label="PJ" /></RadioGroup></FormControl><FormMessage /></FormItem>} /><TextField form={form} name="nome" label={tipo === "PJ" ? "Razão Social" : "Nome"} inputRef={firstInputRef} />{tipo === "PJ" ? <TextField form={form} name="nome_fantasia" label="Nome fantasia" /> : null}<FormField control={form.control} name="cpf_cnpj" render={({ field }) => <FormItem><FormLabel>{tipo === "PJ" ? "CNPJ" : "CPF"}</FormLabel><FormControl><div className="relative">{tipo === "PJ" ? <CnpjInput {...field} value={field.value} onBlur={() => { field.onBlur(); lookupCnpj(); }} /> : <CpfInput {...field} value={field.value} />}{cnpjLoading ? <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" /> : null}</div></FormControl><FormMessage /></FormItem>} /><TextField form={form} name="rg_ie" label="RG ou IE" /></div>;
}

function ContactSection({ form, sameWhatsapp, setSameWhatsapp }: { form: UseFormReturn<ClientFormValues>; sameWhatsapp: boolean; setSameWhatsapp: (value: boolean) => void }) {
  return <div className="grid gap-4 md:grid-cols-2"><TextField form={form} name="email" label="E-mail" type="email" /><MaskedField form={form} name="telefone" label="Telefone" component={PhoneInput} /><MaskedField form={form} name="whatsapp" label="WhatsApp" component={PhoneInput} /><label className="flex items-center gap-2 self-end text-sm font-medium"><Checkbox checked={sameWhatsapp} onCheckedChange={(checked) => setSameWhatsapp(checked === true)} />É o mesmo que o telefone</label></div>;
}

function AddressSection({ form, cepLoading, lookupCep }: { form: UseFormReturn<ClientFormValues>; cepLoading: boolean; lookupCep: () => void }) {
  return <div className="grid gap-4 md:grid-cols-3"><FormField control={form.control} name="endereco_cep" render={({ field }) => <FormItem><FormLabel>CEP</FormLabel><FormControl><div className="relative"><CepInput {...field} value={field.value ?? ""} onBlur={() => { field.onBlur(); lookupCep(); }} />{cepLoading ? <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" /> : null}</div></FormControl><FormMessage /></FormItem>} /><TextField form={form} name="endereco_logradouro" label="Logradouro" className="md:col-span-2" /><TextField form={form} name="endereco_numero" label="Número" /><TextField form={form} name="endereco_complemento" label="Complemento" /><TextField form={form} name="endereco_bairro" label="Bairro" /><TextField form={form} name="endereco_cidade" label="Cidade" /><SelectField form={form} name="endereco_uf" label="UF" options={estados.map((uf) => ({ value: uf, label: uf }))} /></div>;
}

function EnergySection({ form, lightBill, setLightBill, previewUrl }: { form: UseFormReturn<ClientFormValues>; lightBill: File | null; setLightBill: (file: File | null) => void; previewUrl: string | null }) {
  return <div className="grid gap-4 md:grid-cols-2"><SelectField form={form} name="concessionaria" label="Concessionária" options={concessionarias.map((item) => ({ value: item, label: item }))} /><TextField form={form} name="numero_instalacao" label="Número da instalação (UC)" /><FormField control={form.control} name="tipo_ligacao" render={({ field }) => <FormItem><FormLabel>Tipo de ligação</FormLabel><FormControl><RadioGroup value={field.value} onValueChange={field.onChange} className="flex flex-wrap gap-4"><RadioOption value="monofasica" label="Monofásica" /><RadioOption value="bifasica" label="Bifásica" /><RadioOption value="trifasica" label="Trifásica" /></RadioGroup></FormControl><FormMessage /></FormItem>} /><SelectField form={form} name="tipo_telhado" label="Tipo de telhado" options={roofOptions} /><MoneyInput control={form.control} name="conta_luz_media" label="Conta de luz média mensal" /><TextField form={form} name="consumo_medio_kwh" label="Consumo médio (kWh/mês)" type="number" /><div className="md:col-span-2"><FormLabel>Upload da conta de luz</FormLabel><Input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setLightBill(event.target.files?.[0] ?? null)} />{lightBill ? <div className="mt-3 rounded-lg border p-3 text-sm text-muted-foreground">{previewUrl ? <img src={previewUrl} alt="Prévia da conta de luz" className="max-h-48 rounded-md border object-contain" /> : <span>Ver PDF: {lightBill.name}</span>}</div> : null}</div><div className="md:col-span-2"><TextareaField form={form} name="observacoes" label="Observações" /></div></div>;
}

function RadioOption({ value, label }: { value: string; label: string }) { return <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><RadioGroupItem value={value} />{label}</label>; }

function TextField<T extends FieldValues>({ form, name, label, type = "text", className, inputRef }: { form: UseFormReturn<T>; name: FieldPath<T>; label: string; type?: string; className?: string; inputRef?: React.Ref<HTMLInputElement> }) {
  return <FormField control={form.control} name={name} render={({ field }) => <FormItem className={className}><FormLabel>{label}</FormLabel><FormControl><Input {...field} ref={inputRef ?? field.ref} type={type} value={String(field.value ?? "")} onChange={(event) => field.onChange(type === "number" ? event.target.valueAsNumber : event.target.value)} /></FormControl><FormMessage /></FormItem>} />;
}

function MaskedField<T extends FieldValues>({ form, name, label, component: Component }: { form: UseFormReturn<T>; name: FieldPath<T>; label: string; component: React.ForwardRefExoticComponent<React.ComponentProps<typeof Input> & React.RefAttributes<HTMLInputElement>> }) {
  return <FormField control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><FormControl><Component {...field} value={String(field.value ?? "")} /></FormControl><FormMessage /></FormItem>} />;
}

function SelectField<T extends FieldValues>({ form, name, label, options }: { form: UseFormReturn<T>; name: FieldPath<T>; label: string; options: { value: string; label: string }[] }) {
  return <FormField control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><Select value={String(field.value ?? "")} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />;
}

function TextareaField<T extends FieldValues>({ form, name, label }: { form: UseFormReturn<T>; name: FieldPath<T>; label: string }) {
  return <FormField control={form.control} name={name} render={({ field }) => <FormItem><FormLabel>{label}</FormLabel><FormControl><Textarea {...field} value={String(field.value ?? "")} rows={5} /></FormControl><FormMessage /></FormItem>} />;
}
