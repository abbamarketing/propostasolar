import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ListParams = {
  search?: string;
  ativo?: boolean;
};

type CompanyScopedPayload = {
  company_id?: string;
};

async function getCompanyId() {
  const { data, error } = await supabase.from("user_profiles").select("company_id").single();
  if (error) throw error;
  if (!data.company_id) throw new Error("Empresa não vinculada ao usuário.");
  return data.company_id;
}

function withSearch<T extends { ilike: (column: string, pattern: string) => T; or: (filters: string) => T }>(query: T, search?: string, fields = "marca,modelo") {
  const trimmed = search?.trim();
  if (!trimmed) return query;
  const filter = fields
    .split(",")
    .map((field) => `${field}.ilike.%${trimmed}%`)
    .join(",");
  return query.or(filter);
}

function useListQuery<T>(key: readonly unknown[], queryFn: () => Promise<T[]>) {
  return useQuery({ queryKey: key, queryFn });
}

function useCreateMutation<TPayload extends CompanyScopedPayload>(key: readonly unknown[], table: "products_modules" | "products_inverters" | "structure_costs", label: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const companyId = payload.company_id ?? (await getCompanyId());
      const { data, error } = await supabase.from(table).insert({ ...payload, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success(`${label} criado com sucesso.`);
    },
    onError: () => toast.error(`Não foi possível criar ${label.toLowerCase()}.`),
  });
}

function useUpdateMutation<TPayload extends { id: string }>(key: readonly unknown[], table: "products_modules" | "products_inverters" | "structure_costs" | "cities_irradiance" | "tariffs", label: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: TPayload) => {
      const { data, error } = await supabase.from(table).update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success(`${label} atualizado com sucesso.`);
    },
    onError: () => toast.error(`Não foi possível atualizar ${label.toLowerCase()}.`),
  });
}

function useSoftDeleteMutation(key: readonly unknown[], table: "products_modules" | "products_inverters", label: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
      toast.success(`${label} inativado com sucesso.`);
    },
    onError: () => toast.error(`Não foi possível inativar ${label.toLowerCase()}.`),
  });
}

export function useModules({ search, ativo }: ListParams) {
  return useListQuery(["modules", { search, ativo }], async () => {
    let query = supabase.from("products_modules").select("*").order("marca");
    query = withSearch(query, search);
    if (ativo) query = query.eq("ativo", true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export function useModule(id?: string) {
  return useQuery({
    queryKey: ["module", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products_modules").select("*").eq("id", id ?? "").single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export const useCreateModule = () => useCreateMutation(["modules"], "products_modules", "Módulo");
export const useUpdateModule = () => useUpdateMutation(["modules"], "products_modules", "Módulo");
export const useDeleteModule = () => useSoftDeleteMutation(["modules"], "products_modules", "Módulo");

export function useInverters({ search, ativo }: ListParams) {
  return useListQuery(["inverters", { search, ativo }], async () => {
    let query = supabase.from("products_inverters").select("*").order("marca");
    query = withSearch(query, search);
    if (ativo) query = query.eq("ativo", true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export function useInverter(id?: string) {
  return useQuery({
    queryKey: ["inverter", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products_inverters").select("*").eq("id", id ?? "").single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });
}

export const useCreateInverter = () => useCreateMutation(["inverters"], "products_inverters", "Inversor");
export const useUpdateInverter = () => useUpdateMutation(["inverters"], "products_inverters", "Inversor");
export const useDeleteInverter = () => useSoftDeleteMutation(["inverters"], "products_inverters", "Inversor");

export function useStructures({ search }: ListParams) {
  return useListQuery(["structures", { search }], async () => {
    let query = supabase.from("structure_costs").select("*").order("tipo_telhado");
    const trimmed = search?.trim();
    if (trimmed) query = query.ilike("tipo_telhado", `%${trimmed}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export const useCreateStructure = () => useCreateMutation(["structures"], "structure_costs", "Estrutura");
export const useUpdateStructure = () => useUpdateMutation(["structures"], "structure_costs", "Estrutura");
export const useDeleteStructure = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("structure_costs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["structures"] });
      toast.success("Estrutura removida com sucesso.");
    },
    onError: () => toast.error("Não foi possível remover a estrutura."),
  });
};

export function useCities({ search }: ListParams) {
  return useListQuery(["cities", { search }], async () => {
    let query = supabase.from("cities_irradiance").select("*").order("cidade");
    const trimmed = search?.trim();
    if (trimmed) query = query.or(`cidade.ilike.%${trimmed}%,uf.ilike.%${trimmed}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export const useCreateCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.from("cities_irradiance").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Cidade criada com sucesso.");
    },
    onError: () => toast.error("Não foi possível criar a cidade. Verifique se você tem permissão de admin/gestor."),
  });
};
export const useUpdateCity = () => useUpdateMutation(["cities"], "cities_irradiance", "Cidade");
export const useDeleteCity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cities_irradiance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("Cidade removida com sucesso.");
    },
    onError: () => toast.error("Não foi possível remover a cidade."),
  });
};
export const useImportCities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      const { error } = await supabase.from("cities_irradiance").upsert(rows, { onConflict: "cidade,uf" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] });
      toast.success("CSV importado com sucesso.");
    },
    onError: () => toast.error("Não foi possível importar o CSV."),
  });
};

export function useTariffs({ search }: ListParams) {
  return useListQuery(["tariffs", { search }], async () => {
    let query = supabase.from("tariffs").select("*").order("concessionaria");
    const trimmed = search?.trim();
    if (trimmed) query = query.or(`concessionaria.ilike.%${trimmed}%,uf.ilike.%${trimmed}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  });
}

export const useCreateTariff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.from("tariffs").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tariffs"] });
      toast.success("Tarifa criada com sucesso.");
    },
    onError: () => toast.error("Não foi possível criar a tarifa. Verifique se você tem permissão de admin/gestor."),
  });
};
export const useUpdateTariff = () => useUpdateMutation(["tariffs"], "tariffs", "Tarifa");
export const useDeleteTariff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tariffs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tariffs"] });
      toast.success("Tarifa removida com sucesso.");
    },
    onError: () => toast.error("Não foi possível remover a tarifa."),
  });
};
