import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type ModuleRow = Tables["products_modules"]["Row"];
export type ModuleInsert = Omit<Tables["products_modules"]["Insert"], "company_id">;
export type ModuleUpdate = Tables["products_modules"]["Update"] & { id: string };
export type InverterRow = Tables["products_inverters"]["Row"];
export type InverterInsert = Omit<Tables["products_inverters"]["Insert"], "company_id">;
export type InverterUpdate = Tables["products_inverters"]["Update"] & { id: string };
export type StructureRow = Tables["structure_costs"]["Row"];
export type StructureInsert = Omit<Tables["structure_costs"]["Insert"], "company_id">;
export type StructureUpdate = Tables["structure_costs"]["Update"] & { id: string };
export type CityRow = Tables["cities_irradiance"]["Row"];
export type CityInsert = Tables["cities_irradiance"]["Insert"];
export type CityUpdate = Tables["cities_irradiance"]["Update"] & { id: string };
export type TariffRow = Tables["tariffs"]["Row"];
export type TariffInsert = Tables["tariffs"]["Insert"];
export type TariffUpdate = Tables["tariffs"]["Update"] & { id: string };

type ListParams = { search?: string; ativo?: boolean };

async function getCompanyId() {
  const { data, error } = await supabase.from("user_profiles").select("company_id").single();
  if (error) throw error;
  if (!data.company_id) throw new Error("Empresa não vinculada ao usuário.");
  return data.company_id;
}

export function useModules({ search, ativo }: ListParams) {
  return useQuery({
    queryKey: ["modules", { search, ativo }],
    queryFn: async () => {
      let query = supabase.from("products_modules").select("*").order("marca");
      if (search?.trim()) query = query.or(`marca.ilike.%${search.trim()}%,modelo.ilike.%${search.trim()}%`);
      if (ativo) query = query.eq("ativo", true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
export function useModule(id?: string) {
  return useQuery({ queryKey: ["module", id], queryFn: async () => {
    const { data, error } = await supabase.from("products_modules").select("*").eq("id", id ?? "").single();
    if (error) throw error; return data;
  }, enabled: Boolean(id) });
}
export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload: ModuleInsert) => {
    const { data, error } = await supabase.from("products_modules").insert({ ...payload, company_id: await getCompanyId() }).select().single();
    if (error) throw error; return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules"] }); toast.success("Módulo criado com sucesso."); }, onError: () => toast.error("Não foi possível criar o módulo.") });
}
export function useUpdateModule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...payload }: ModuleUpdate) => {
    const { data, error } = await supabase.from("products_modules").update(payload).eq("id", id).select().single();
    if (error) throw error; return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules"] }); toast.success("Módulo atualizado com sucesso."); }, onError: () => toast.error("Não foi possível atualizar o módulo.") });
}
export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => {
    const { error } = await supabase.from("products_modules").update({ ativo: false }).eq("id", id); if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["modules"] }); toast.success("Módulo inativado com sucesso."); }, onError: () => toast.error("Não foi possível inativar o módulo.") });
}

export function useInverters({ search, ativo }: ListParams) {
  return useQuery({ queryKey: ["inverters", { search, ativo }], queryFn: async () => {
    let query = supabase.from("products_inverters").select("*").order("marca");
    if (search?.trim()) query = query.or(`marca.ilike.%${search.trim()}%,modelo.ilike.%${search.trim()}%`);
    if (ativo) query = query.eq("ativo", true);
    const { data, error } = await query; if (error) throw error; return data;
  }});
}
export function useInverter(id?: string) {
  return useQuery({ queryKey: ["inverter", id], queryFn: async () => {
    const { data, error } = await supabase.from("products_inverters").select("*").eq("id", id ?? "").single();
    if (error) throw error; return data;
  }, enabled: Boolean(id) });
}
export function useCreateInverter() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload: InverterInsert) => {
    const { data, error } = await supabase.from("products_inverters").insert({ ...payload, company_id: await getCompanyId() }).select().single();
    if (error) throw error; return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["inverters"] }); toast.success("Inversor criado com sucesso."); }, onError: () => toast.error("Não foi possível criar o inversor.") });
}
export function useUpdateInverter() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...payload }: InverterUpdate) => {
    const { data, error } = await supabase.from("products_inverters").update(payload).eq("id", id).select().single(); if (error) throw error; return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["inverters"] }); toast.success("Inversor atualizado com sucesso."); }, onError: () => toast.error("Não foi possível atualizar o inversor.") });
}
export function useDeleteInverter() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("products_inverters").update({ ativo: false }).eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["inverters"] }); toast.success("Inversor inativado com sucesso."); }, onError: () => toast.error("Não foi possível inativar o inversor.") });
}

export function useStructures({ search }: ListParams) {
  return useQuery({ queryKey: ["structures", { search }], queryFn: async () => {
    let query = supabase.from("structure_costs").select("*").order("tipo_telhado");
    if (search?.trim()) query = query.ilike("tipo_telhado", `%${search.trim()}%`);
    const { data, error } = await query; if (error) throw error; return data;
  }});
}
export function useCreateStructure() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (payload: StructureInsert) => {
    const { data, error } = await supabase.from("structure_costs").insert({ ...payload, company_id: await getCompanyId() }).select().single(); if (error) throw error; return data;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["structures"] }); toast.success("Estrutura criada com sucesso."); }, onError: () => toast.error("Não foi possível criar a estrutura.") });
}
export function useUpdateStructure() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async ({ id, ...payload }: StructureUpdate) => { const { data, error } = await supabase.from("structure_costs").update(payload).eq("id", id).select().single(); if (error) throw error; return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["structures"] }); toast.success("Estrutura atualizada com sucesso."); }, onError: () => toast.error("Não foi possível atualizar a estrutura.") });
}
export function useDeleteStructure() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("structure_costs").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["structures"] }); toast.success("Estrutura removida com sucesso."); }, onError: () => toast.error("Não foi possível remover a estrutura.") });
}

export function useCities({ search }: ListParams) {
  return useQuery({ queryKey: ["cities", { search }], queryFn: async () => {
    let query = supabase.from("cities_irradiance").select("*").order("cidade");
    if (search?.trim()) query = query.or(`cidade.ilike.%${search.trim()}%,uf.ilike.%${search.trim()}%`);
    const { data, error } = await query; if (error) throw error; return data;
  }});
}
export function useCreateCity() { const qc = useQueryClient(); return useMutation({ mutationFn: async (payload: CityInsert) => { const { data, error } = await supabase.from("cities_irradiance").insert(payload).select().single(); if (error) throw error; return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities"] }); toast.success("Cidade criada com sucesso."); }, onError: () => toast.error("Não foi possível criar a cidade.") }); }
export function useUpdateCity() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...payload }: CityUpdate) => { const { data, error } = await supabase.from("cities_irradiance").update(payload).eq("id", id).select().single(); if (error) throw error; return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities"] }); toast.success("Cidade atualizada com sucesso."); }, onError: () => toast.error("Não foi possível atualizar a cidade.") }); }
export function useDeleteCity() { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("cities_irradiance").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities"] }); toast.success("Cidade removida com sucesso."); }, onError: () => toast.error("Não foi possível remover a cidade.") }); }
export function useImportCities() { const qc = useQueryClient(); return useMutation({ mutationFn: async (rows: CityInsert[]) => { const { error } = await supabase.from("cities_irradiance").upsert(rows, { onConflict: "cidade,uf" }); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities"] }); toast.success("CSV importado com sucesso."); }, onError: () => toast.error("Não foi possível importar o CSV.") }); }

export function useTariffs({ search }: ListParams) {
  return useQuery({ queryKey: ["tariffs", { search }], queryFn: async () => {
    let query = supabase.from("tariffs").select("*").order("concessionaria");
    if (search?.trim()) query = query.or(`concessionaria.ilike.%${search.trim()}%,uf.ilike.%${search.trim()}%`);
    const { data, error } = await query; if (error) throw error; return data;
  }});
}
export function useCreateTariff() { const qc = useQueryClient(); return useMutation({ mutationFn: async (payload: TariffInsert) => { const { data, error } = await supabase.from("tariffs").insert(payload).select().single(); if (error) throw error; return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["tariffs"] }); toast.success("Tarifa criada com sucesso."); }, onError: () => toast.error("Não foi possível criar a tarifa.") }); }
export function useUpdateTariff() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...payload }: TariffUpdate) => { const { data, error } = await supabase.from("tariffs").update(payload).eq("id", id).select().single(); if (error) throw error; return data; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["tariffs"] }); toast.success("Tarifa atualizada com sucesso."); }, onError: () => toast.error("Não foi possível atualizar a tarifa.") }); }
export function useDeleteTariff() { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("tariffs").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["tariffs"] }); toast.success("Tarifa removida com sucesso."); }, onError: () => toast.error("Não foi possível remover a tarifa.") }); }
