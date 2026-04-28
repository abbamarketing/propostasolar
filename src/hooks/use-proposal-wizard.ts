import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];
type ProposalItemInsert = Database["public"]["Tables"]["proposal_items"]["Insert"];
type FinancingRow = Database["public"]["Tables"]["proposal_financing_options"]["Row"];
type FinancingInsert = Database["public"]["Tables"]["proposal_financing_options"]["Insert"];
type ProposalPhotoRow = Database["public"]["Tables"]["proposal_photos"]["Row"];
type ProposalPhotoInsert = Database["public"]["Tables"]["proposal_photos"]["Insert"];

type SaveState = "idle" | "saving" | "saved" | "error";

export type ProposalDraft = {
  client_id: string;
  cidade_projeto: string | null;
  uf_projeto: string | null;
  hsp_usado: number | null;
  tarifa_kwh: number | null;
  custo_disponibilidade_kwh: number | null;
  performance_ratio: number | null;
  consumo_estimado_kwh: number | null;
  energia_compensar_kwh: number | null;
  kwp_necessario: number | null;
  geracao_estimada_mensal: number | null;
  geracao_estimada_anual: number | null;
  modulo_id: string | null;
  modulo_marca: string | null;
  modulo_modelo: string | null;
  modulo_potencia_w: number | null;
  qtd_modulos: number | null;
  kwp_instalado: number | null;
  inversor_id: string | null;
  inversor_marca: string | null;
  inversor_modelo: string | null;
  inversor_potencia_kw: number | null;
  qtd_inversores: number | null;
  custo_modulos: number | null;
  custo_inversor: number | null;
  custo_estrutura: number | null;
  custo_cabos_protecoes: number | null;
  custo_projeto_art: number | null;
  custo_mao_obra: number | null;
  custo_outros: number | null;
  custo_total: number | null;
  margem_pct: number | null;
  valor_total: number | null;
  valor_a_vista: number | null;
  economia_mensal: number | null;
  economia_anual: number | null;
  payback_anos: number | null;
  payback_descontado_anos: number | null;
  co2_evitado_kg_ano: number | null;
  template: string | null;
  observacoes_comerciais: string | null;
  validade_dias: number | null;
  valido_ate: string | null;
  personalizar_garantias: boolean;
  garantia_modulo_anos: number | null;
  garantia_inversor_anos: number | null;
  garantia_instalacao_anos: number | null;
  prazo_execucao_dias_uteis: number | null;
  prazo_homologacao_dias: number | null;
};

export const emptyDraft: ProposalDraft = {
  client_id: "",
  cidade_projeto: null,
  uf_projeto: null,
  hsp_usado: null,
  tarifa_kwh: null,
  custo_disponibilidade_kwh: null,
  performance_ratio: 0.8,
  consumo_estimado_kwh: null,
  energia_compensar_kwh: null,
  kwp_necessario: null,
  geracao_estimada_mensal: null,
  geracao_estimada_anual: null,
  modulo_id: null,
  modulo_marca: null,
  modulo_modelo: null,
  modulo_potencia_w: null,
  qtd_modulos: null,
  kwp_instalado: null,
  inversor_id: null,
  inversor_marca: null,
  inversor_modelo: null,
  inversor_potencia_kw: null,
  qtd_inversores: 1,
  custo_modulos: null,
  custo_inversor: null,
  custo_estrutura: null,
  custo_cabos_protecoes: null,
  custo_projeto_art: null,
  custo_mao_obra: null,
  custo_outros: null,
  custo_total: null,
  margem_pct: 0.25,
  valor_total: null,
  valor_a_vista: null,
  economia_mensal: null,
  economia_anual: null,
  payback_anos: null,
  payback_descontado_anos: null,
  co2_evitado_kg_ano: null,
  template: "on-grid-residencial",
  observacoes_comerciais: null,
  validade_dias: 15,
  valido_ate: null,
  personalizar_garantias: false,
  garantia_modulo_anos: null,
  garantia_inversor_anos: null,
  garantia_instalacao_anos: 1,
  prazo_execucao_dias_uteis: 30,
  prazo_homologacao_dias: 90,
};

async function getCompanyId() {
  const { data, error } = await supabase.from("user_profiles").select("company_id").single();
  if (error) throw error;
  if (!data.company_id) throw new Error("Empresa não vinculada ao usuário.");
  return data.company_id;
}

function toDraft(row?: ProposalRow | null, fallbackClientId = ""): ProposalDraft {
  if (!row) return { ...emptyDraft, client_id: fallbackClientId };
  return {
    client_id: row.client_id,
    cidade_projeto: row.cidade_projeto,
    uf_projeto: row.uf_projeto,
    hsp_usado: row.hsp_usado,
    tarifa_kwh: row.tarifa_kwh,
    custo_disponibilidade_kwh: row.custo_disponibilidade_kwh,
    performance_ratio: row.performance_ratio ?? 0.8,
    consumo_estimado_kwh: row.consumo_estimado_kwh,
    energia_compensar_kwh: row.energia_compensar_kwh,
    kwp_necessario: row.kwp_necessario,
    geracao_estimada_mensal: row.geracao_estimada_mensal,
    geracao_estimada_anual: row.geracao_estimada_anual,
    modulo_id: row.modulo_id,
    modulo_marca: row.modulo_marca,
    modulo_modelo: row.modulo_modelo,
    modulo_potencia_w: row.modulo_potencia_w,
    qtd_modulos: row.qtd_modulos,
    kwp_instalado: row.kwp_instalado,
    inversor_id: row.inversor_id,
    inversor_marca: row.inversor_marca,
    inversor_modelo: row.inversor_modelo,
    inversor_potencia_kw: row.inversor_potencia_kw,
    qtd_inversores: row.qtd_inversores ?? 1,
    custo_modulos: row.custo_modulos,
    custo_inversor: row.custo_inversor,
    custo_estrutura: row.custo_estrutura,
    custo_cabos_protecoes: row.custo_cabos_protecoes,
    custo_projeto_art: row.custo_projeto_art,
    custo_mao_obra: row.custo_mao_obra,
    custo_outros: row.custo_outros,
    custo_total: row.custo_total,
    margem_pct: row.margem_pct ?? 0.25,
    valor_total: row.valor_total,
    valor_a_vista: row.valor_a_vista,
    economia_mensal: row.economia_mensal,
    economia_anual: row.economia_anual,
    payback_anos: row.payback_anos,
    payback_descontado_anos: row.payback_descontado_anos,
    co2_evitado_kg_ano: row.co2_evitado_kg_ano,
    template: row.template ?? "on-grid-residencial",
    observacoes_comerciais: row.observacoes_comerciais,
    validade_dias: row.validade_dias ?? 15,
    valido_ate: row.valido_ate,
    personalizar_garantias: row.personalizar_garantias ?? false,
    garantia_modulo_anos: row.garantia_modulo_anos,
    garantia_inversor_anos: row.garantia_inversor_anos,
    garantia_instalacao_anos: row.garantia_instalacao_anos ?? 1,
    prazo_execucao_dias_uteis: row.prazo_execucao_dias_uteis ?? 30,
    prazo_homologacao_dias: row.prazo_homologacao_dias ?? 90,
  };
}

function toPayload(draft: ProposalDraft): ProposalUpdate {
  return { ...draft, garantia_instalacao_anos: draft.garantia_instalacao_anos ?? 1, prazo_execucao_dias_uteis: draft.prazo_execucao_dias_uteis ?? 30, prazo_homologacao_dias: draft.prazo_homologacao_dias ?? 90, status: "rascunho" };
}

export function useProposal(proposalId?: string) {
  return useQuery({
    queryKey: ["proposal", proposalId],
    enabled: Boolean(proposalId),
    queryFn: async () => {
      const { data, error } = await supabase.from("proposals").select("*").eq("id", proposalId ?? "").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useProposalItems(proposalId?: string) {
  return useQuery({
    queryKey: ["proposal-items", proposalId],
    enabled: Boolean(proposalId),
    queryFn: async () => {
      const { data, error } = await supabase.from("proposal_items").select("*").eq("proposal_id", proposalId ?? "").order("ordem");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertProposalItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ proposalId, items }: { proposalId: string; items: Omit<ProposalItemInsert, "proposal_id">[] }) => {
      const { error: deleteError } = await supabase.from("proposal_items").delete().eq("proposal_id", proposalId);
      if (deleteError) throw deleteError;
      if (items.length === 0) return;
      const { error } = await supabase.from("proposal_items").insert(items.map((item) => ({ ...item, proposal_id: proposalId })));
      if (error) throw error;
    },
    onSuccess: (_data, vars) => queryClient.invalidateQueries({ queryKey: ["proposal-items", vars.proposalId] }),
  });
}

export function useProposalFinancing(proposalId?: string) {
  return useQuery({
    queryKey: ["proposal-financing", proposalId],
    enabled: Boolean(proposalId),
    queryFn: async () => {
      const { data, error } = await supabase.from("proposal_financing_options").select("*").eq("proposal_id", proposalId ?? "").order("prazo_meses");
      if (error) throw error;
      return data as FinancingRow[];
    },
  });
}

export function useCreateFinancingOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FinancingInsert) => {
      const { data, error } = await supabase.from("proposal_financing_options").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ["proposal-financing", data.proposal_id] }),
  });
}

export function useUpdateFinancingOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<FinancingInsert> & { id: string; proposal_id: string }) => {
      const { data, error } = await supabase.from("proposal_financing_options").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ["proposal-financing", data.proposal_id] }),
  });
}

export function useDeleteFinancingOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, proposalId }: { id: string; proposalId: string }) => {
      const { error } = await supabase.from("proposal_financing_options").delete().eq("id", id);
      if (error) throw error;
      return proposalId;
    },
    onSuccess: (proposalId) => queryClient.invalidateQueries({ queryKey: ["proposal-financing", proposalId] }),
  });
}

export function useProposalPhotos(proposalId?: string) {
  return useQuery({
    queryKey: ["proposal-photos", proposalId],
    enabled: Boolean(proposalId),
    queryFn: async () => {
      const { data, error } = await supabase.from("proposal_photos").select("*").eq("proposal_id", proposalId ?? "").order("ordem");
      if (error) throw error;
      return data as ProposalPhotoRow[];
    },
  });
}

export function useProposalPhotoMutations(proposalId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["proposal-photos", proposalId] });
  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      if (!proposalId) throw new Error("Salve a proposta antes de anexar fotos.");
      const accepted = files.slice(0, 6);
      const rows: ProposalPhotoInsert[] = [];
      for (const [index, file] of accepted.entries()) {
        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) throw new Error("Envie apenas JPG, PNG ou WebP.");
        if (file.size > 5 * 1024 * 1024) throw new Error("Cada imagem deve ter até 5MB.");
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `proposals/${proposalId}/photos/${Date.now()}-${index}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("proposal-photos").upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("proposal-photos").getPublicUrl(path);
        rows.push({ proposal_id: proposalId, url: data.publicUrl, legenda: "", ordem: index });
      }
      const { data, error } = await supabase.from("proposal_photos").insert(rows).select();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: async (photo: Pick<ProposalPhotoRow, "id" | "legenda" | "ordem">) => {
      const { data, error } = await supabase.from("proposal_photos").update({ legenda: photo.legenda, ordem: photo.ordem }).eq("id", photo.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase.from("proposal_photos").delete().eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
  return { upload, update, remove };
}

export function useProposalContext(proposal?: Pick<ProposalRow, "company_id" | "vendedor_id"> | null) {
  return useQuery({
    queryKey: ["proposal-context", proposal?.company_id, proposal?.vendedor_id],
    enabled: Boolean(proposal?.company_id || proposal?.vendedor_id),
    queryFn: async () => {
      const [companyResult, sellerResult] = await Promise.all([
        proposal?.company_id ? supabase.from("companies").select("nome_fantasia, razao_social, logo_url, email, telefone, whatsapp").eq("id", proposal.company_id).single() : Promise.resolve({ data: null, error: null }),
        proposal?.vendedor_id ? supabase.from("user_profiles").select("nome, email, telefone, avatar_url, cargo").eq("id", proposal.vendedor_id).single() : Promise.resolve({ data: null, error: null }),
      ]);
      if (companyResult.error) throw companyResult.error;
      if (sellerResult.error) throw sellerResult.error;
      return { company: companyResult.data, seller: sellerResult.data };
    },
  });
}

export function useProposalAutosave({ proposalId, initialClientId }: { proposalId?: string; initialClientId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const proposal = useProposal(proposalId);
  const [draft, setDraft] = useState<ProposalDraft>(() => ({ ...emptyDraft, client_id: initialClientId ?? "" }));
  const [activeId, setActiveId] = useState(proposalId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hydrated = useRef(false);
  const lastSavedJson = useRef(JSON.stringify(draft));

  useEffect(() => {
    if (proposal.data && !hydrated.current) {
      const next = toDraft(proposal.data);
      setDraft(next);
      lastSavedJson.current = JSON.stringify(next);
      setSavedAt(new Date(proposal.data.updated_at));
      hydrated.current = true;
    }
  }, [proposal.data]);

  useEffect(() => {
    if (!proposalId && initialClientId && !draft.client_id) setDraft((current) => ({ ...current, client_id: initialClientId }));
  }, [draft.client_id, initialClientId, proposalId]);

  const mutation = useMutation({
    mutationFn: async (payload: ProposalDraft) => {
      if (!payload.client_id) return null;
      setSaveState("saving");
      if (!activeId) {
        const [{ data: userData }, companyId] = await Promise.all([supabase.auth.getUser(), getCompanyId()]);
        const { data, error } = await supabase.from("proposals").insert({ ...toPayload(payload), client_id: payload.client_id, company_id: companyId, vendedor_id: userData.user?.id ?? null }).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("proposals").update(toPayload(payload)).eq("id", activeId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (!data) return;
      setActiveId(data.id);
      setSaveState("saved");
      setSavedAt(new Date());
      setHasUnsavedChanges(false);
      const json = JSON.stringify(toDraft(data));
      lastSavedJson.current = json;
      queryClient.setQueryData(["proposal", data.id], data);
      if (!proposalId) navigate({ to: "/propostas/$id/editar", params: { id: data.id }, replace: true });
    },
    onError: () => setSaveState("error"),
  });

  const draftJson = useMemo(() => JSON.stringify(draft), [draft]);

  useEffect(() => {
    if (draftJson === lastSavedJson.current || !draft.client_id) return;
    setHasUnsavedChanges(true);
    const timer = window.setTimeout(() => mutation.mutate(draft), 1000);
    return () => window.clearTimeout(timer);
  }, [draft, draft.client_id, draftJson, mutation]);

  function retry() {
    mutation.mutate(draft);
  }

  return { proposal: proposal.data, isLoading: proposal.isLoading, draft, setDraft, activeId, saveState, savedAt, hasUnsavedChanges, retry, isSaving: mutation.isPending };
}
