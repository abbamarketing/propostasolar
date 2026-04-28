import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Camera, Save, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { CnpjInput, PhoneInput, CepInput } from "@/components/inputs/masked-inputs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const api = supabase as any;

const setStringField = (setForm: React.Dispatch<React.SetStateAction<any>>, key: string) => (value: string) => {
  setForm((current: any) => ({ ...current, [key]: value }));
};

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — ENERGIZA SOLAR" }, { name: "description", content: "Dados da empresa, usuários e perfil." }] }),
  component: SettingsPage,
});

function useProfile() {
  return useQuery({ queryKey: ["my-profile-settings"], queryFn: async () => { const { data, error } = await supabase.from("user_profiles").select("*").single(); if (error) throw error; return data; } });
}
function useCompany(companyId?: string | null) {
  return useQuery({ queryKey: ["company-settings", companyId], enabled: Boolean(companyId), queryFn: async () => { const { data, error } = await supabase.from("companies").select("*").eq("id", companyId!).single(); if (error) throw error; return data; } });
}
function useUsers() {
  return useQuery({ queryKey: ["company-users-settings"], queryFn: async () => { const { data, error } = await supabase.from("user_profiles").select("*").order("nome"); if (error) throw error; return data ?? []; } });
}

function SettingsPage() {
  const profile = useProfile();
  const company = useCompany(profile.data?.company_id);
  return <AppLayout><PageHeader title="Configurações" subtitle="Administre empresa, usuários e seu perfil." /><section className="p-4 md:p-8"><Tabs defaultValue="empresa"><TabsList><TabsTrigger value="empresa">Empresa</TabsTrigger><TabsTrigger value="usuarios">Usuários</TabsTrigger><TabsTrigger value="perfil">Meu perfil</TabsTrigger></TabsList><TabsContent value="empresa" className="mt-6"><CompanyForm company={company.data} companyId={profile.data?.company_id} /></TabsContent><TabsContent value="usuarios" className="mt-6"><UsersPanel companyId={profile.data?.company_id} /></TabsContent><TabsContent value="perfil" className="mt-6"><ProfileForm profile={profile.data} /></TabsContent></Tabs></section></AppLayout>;
}

function CompanyForm({ company, companyId }: { company: any; companyId?: string | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (company) setForm(company); }, [company]);
  const save = useMutation({ mutationFn: async () => { const { error } = await api.from("companies").update(form).eq("id", companyId); if (error) throw error; }, onSuccess: () => { toast.success("Empresa atualizada."); queryClient.invalidateQueries({ queryKey: ["company-settings"] }); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar empresa.") });
  const uploadLogo = async (file?: File) => { if (!file || !companyId) return; const path = `${companyId}/logo.png`; const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true }); if (error) return toast.error(error.message); const { data } = supabase.storage.from("company-assets").getPublicUrl(path); setForm((f: any) => ({ ...f, logo_url: data.publicUrl })); toast.success("Logo carregada. Salve para aplicar."); };
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 /> Empresa</CardTitle></CardHeader><CardContent className="space-y-6"><div className="flex flex-wrap items-center gap-4"><div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-surface">{form.logo_url ? <img src={form.logo_url} alt="Logo da empresa" className="h-full w-full object-contain" /> : <Camera className="text-muted-foreground" />}</div><Input type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files?.[0])} className="max-w-xs" /></div><div className="grid gap-4 md:grid-cols-2"><Field label="Razão social" value={form.razao_social} onChange={setStringField(setForm, "razao_social")} /><Field label="Nome fantasia" value={form.nome_fantasia} onChange={setStringField(setForm, "nome_fantasia")} /><Masked label="CNPJ" as={CnpjInput} value={form.cnpj} onChange={setStringField(setForm, "cnpj")} /><Field label="IE" value={form.inscricao_estadual} onChange={setStringField(setForm, "inscricao_estadual")} /><Masked label="CEP" as={CepInput} value={form.endereco_cep} onChange={setStringField(setForm, "endereco_cep")} /><Field label="Cidade" value={form.endereco_cidade} onChange={setStringField(setForm, "endereco_cidade")} /><Field label="UF" value={form.endereco_uf} onChange={setStringField(setForm, "endereco_uf")} /><Field label="Logradouro" value={form.endereco_logradouro} onChange={setStringField(setForm, "endereco_logradouro")} /><Field label="E-mail" value={form.email} onChange={setStringField(setForm, "email")} /><Masked label="Telefone" as={PhoneInput} value={form.telefone} onChange={setStringField(setForm, "telefone")} /><Masked label="WhatsApp" as={PhoneInput} value={form.whatsapp} onChange={setStringField(setForm, "whatsapp")} /><Field label="Site" value={form.site} onChange={setStringField(setForm, "site")} /><Color label="Cor primária" value={form.cor_primaria} onChange={setStringField(setForm, "cor_primaria")} /><Color label="Cor secundária" value={form.cor_secundaria} onChange={setStringField(setForm, "cor_secundaria")} /><Field label="Responsável técnico" value={form.responsavel_tecnico_nome} onChange={setStringField(setForm, "responsavel_tecnico_nome")} /><Field label="CREA" value={form.responsavel_tecnico_crea} onChange={setStringField(setForm, "responsavel_tecnico_crea")} /><Field label="E-mail técnico" value={form.responsavel_tecnico_email} onChange={setStringField(setForm, "responsavel_tecnico_email")} /></div><Button onClick={() => save.mutate()} disabled={save.isPending}><Save /> Salvar empresa</Button></CardContent></Card>;
}

function UsersPanel({ companyId }: { companyId?: string | null }) {
  const queryClient = useQueryClient();
  const users = useUsers();
  const [email, setEmail] = useState("");
  const invite = useMutation({ mutationFn: async () => { const { error } = await api.from("user_profiles").insert({ company_id: companyId, email, nome: email.split("@")[0], ativo: true }); if (error) throw error; }, onSuccess: () => { toast.success("Usuário pendente criado."); setEmail(""); queryClient.invalidateQueries({ queryKey: ["company-users-settings"] }); }, onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao criar usuário.") });
  const update = useMutation({ mutationFn: async ({ id, patch }: any) => { const { error } = await api.from("user_profiles").update(patch).eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success("Usuário atualizado."); queryClient.invalidateQueries({ queryKey: ["company-users-settings"] }); } });
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users /> Usuários</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" /><Button onClick={() => invite.mutate()} disabled={!email || invite.isPending}><UserPlus /> Convidar</Button></div><div className="space-y-2">{users.data?.map((u: any) => <div key={u.id} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_160px_120px]"><div><p className="font-medium">{u.nome}</p><p className="text-sm text-muted-foreground">{u.email}</p></div><Select defaultValue="vendedor"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="vendedor">Vendedor</SelectItem></SelectContent></Select><div className="flex items-center gap-2"><Switch checked={u.ativo} onCheckedChange={(ativo) => update.mutate({ id: u.id, patch: { ativo } })} /><span className="text-sm">Ativo</span></div></div>)}</div></CardContent></Card>;
}

function ProfileForm({ profile }: { profile: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);
  const save = useMutation({ mutationFn: async () => { const { error } = await api.from("user_profiles").update({ nome: form.nome, telefone: form.telefone, cargo: form.cargo, avatar_url: form.avatar_url }).eq("id", profile.id); if (error) throw error; }, onSuccess: () => { toast.success("Perfil atualizado."); queryClient.invalidateQueries({ queryKey: ["my-profile-settings"] }); } });
  return <Card><CardHeader><CardTitle>Meu perfil</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Nome" value={form.nome} onChange={setStringField(setForm, "nome")} /><Masked label="Telefone" as={PhoneInput} value={form.telefone} onChange={setStringField(setForm, "telefone")} /><Field label="Cargo" value={form.cargo} onChange={setStringField(setForm, "cargo")} /><Field label="Avatar URL" value={form.avatar_url} onChange={setStringField(setForm, "avatar_url")} /><div className="md:col-span-2"><Button onClick={() => save.mutate()}><Save /> Salvar perfil</Button></div></CardContent></Card>;
}

function Field({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string) => void }) { return <div className="space-y-2"><Label>{label}</Label><Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>; }
function Masked({ label, value, onChange, as: Comp }: any) { return <div className="space-y-2"><Label>{label}</Label><Comp value={value ?? ""} onChange={(e: any) => onChange(e.target.value)} /></div>; }
function Color({ label, value, onChange }: { label: string; value?: string | null; onChange: (v: string) => void }) { return <div className="space-y-2"><Label>{label}</Label><Input type="color" value={value ?? "#16A34A"} onChange={(e) => onChange(e.target.value)} /></div>; }
