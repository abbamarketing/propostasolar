import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export type ClientRow = Tables["clients"]["Row"];
export type ClientInsert = Omit<Tables["clients"]["Insert"], "company_id" | "created_by">;
export type ClientUpdate = Omit<Tables["clients"]["Update"], "company_id" | "created_by"> & { id: string };
export type ClientDocumentRow = Tables["client_documents"]["Row"];
export type DocumentCategory = "conta_luz" | "rg_cnpj" | "comprovante_endereco" | "outros";

export type ClientWithProposalCount = ClientRow & {
  proposal_count: number;
  last_activity: string | null;
};

export type ClientListParams = {
  search?: string;
  tipo?: "todos" | "PF" | "PJ";
  cidade?: string;
  concessionaria?: string;
  page?: number;
};

const pageSize = 20;

async function getCompanyId() {
  const { data, error } = await supabase.from("user_profiles").select("company_id").single();
  if (error) throw error;
  if (!data.company_id) throw new Error("Empresa não vinculada ao usuário.");
  return data.company_id;
}

async function getSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

export function useClients({ search = "", tipo = "todos", cidade = "", concessionaria = "", page = 1 }: ClientListParams) {
  return useQuery({
    queryKey: ["clients", { search, tipo, cidade, concessionaria, page }],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase.from("clients").select("*", { count: "exact" }).is("deleted_at", null).order("updated_at", { ascending: false }).range(from, to);
      if (search.trim()) {
        const term = search.trim();
        query = query.or(`nome.ilike.%${term}%,cpf_cnpj.ilike.%${term}%,email.ilike.%${term}%,telefone.ilike.%${term}%`);
      }
      if (tipo !== "todos") query = query.eq("tipo", tipo);
      if (cidade.trim()) query = query.ilike("endereco_cidade", `%${cidade.trim()}%`);
      if (concessionaria && concessionaria !== "todas") query = query.eq("concessionaria", concessionaria);
      const { data, error, count } = await query;
      if (error) throw error;
      const ids = (data ?? []).map((client) => client.id);
      const proposalCounts = new Map<string, number>();
      let lastByClient = new Map<string, string>();
      if (ids.length > 0) {
        const { data: proposals, error: proposalError } = await supabase.from("proposals").select("client_id, updated_at").in("client_id", ids);
        if (proposalError) throw proposalError;
        lastByClient = new Map<string, string>();
        for (const proposal of proposals ?? []) {
          proposalCounts.set(proposal.client_id, (proposalCounts.get(proposal.client_id) ?? 0) + 1);
          const current = lastByClient.get(proposal.client_id);
          if (!current || proposal.updated_at > current) lastByClient.set(proposal.client_id, proposal.updated_at);
        }
      }
      return {
        rows: (data ?? []).map((client) => ({ ...client, proposal_count: proposalCounts.get(client.id) ?? 0, last_activity: lastByClient.get(client.id) ?? client.updated_at })),
        total: count ?? 0,
        pageSize,
      };
    },
  });
}

export function useClient(id?: string) {
  return useQuery({
    queryKey: ["client", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id ?? "").is("deleted_at", null).single();
      if (error) throw error;
      const { count, error: countError } = await supabase.from("proposals").select("id", { count: "exact", head: true }).eq("client_id", data.id);
      if (countError) throw countError;
      return { ...data, proposal_count: count ?? 0, last_activity: data.updated_at };
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientInsert) => {
      const [{ data: userData }, companyId] = await Promise.all([supabase.auth.getUser(), getCompanyId()]);
      const { data, error } = await supabase.from("clients").insert({ ...payload, company_id: companyId, created_by: userData.user?.id ?? null }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente criado com sucesso."); },
    onError: () => toast.error("Não foi possível salvar o cliente."),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: ClientUpdate) => {
      const { data, error } = await supabase.from("clients").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["clients"] }); qc.invalidateQueries({ queryKey: ["client", data.id] }); toast.success("Cliente atualizado com sucesso."); },
    onError: () => toast.error("Não foi possível atualizar o cliente."),
  });
}

export function useSoftDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast.success("Cliente excluído com sucesso."); },
    onError: () => toast.error("Não foi possível excluir o cliente."),
  });
}

export function useClientDocuments(clientId?: string) {
  return useQuery({
    queryKey: ["client-documents", clientId],
    enabled: Boolean(clientId),
    queryFn: async () => {
      const { data, error } = await supabase.from("client_documents").select("*").eq("client_id", clientId ?? "").order("created_at", { ascending: false });
      if (error) throw error;
      return Promise.all((data ?? []).map(async (doc) => ({ ...doc, signedUrl: await getSignedUrl(doc.storage_path) })));
    },
  });
}

export function useUploadClientDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, file, categoria }: { clientId: string; file: File; categoria: DocumentCategory }) => {
      if (file.size > 5 * 1024 * 1024) throw new Error("Arquivo maior que 5MB.");
      const companyId = await getCompanyId();
      const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
      const baseName = categoria === "conta_luz" ? "conta-luz" : categoria;
      const path = `clients/${clientId}/${baseName}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("client-documents").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data, error } = await supabase.from("client_documents").insert({ company_id: companyId, client_id: clientId, categoria, nome_arquivo: file.name, storage_path: path, url: path, mime_type: file.type, tamanho_bytes: file.size }).select().single();
      if (error) throw error;
      if (categoria === "conta_luz") await supabase.from("clients").update({ conta_luz_url: path }).eq("id", clientId);
      return data;
    },
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: ["client-documents", vars.clientId] }); qc.invalidateQueries({ queryKey: ["client", vars.clientId] }); toast.success("Documento enviado com sucesso."); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível enviar o documento."),
  });
}

export const concessionarias = ["CEMIG", "Energisa", "Cemig D", "Equatorial", "Enel", "Light", "Copel", "CPFL", "Celesc", "Coelba", "Coelce", "Celg", "Eletrobras", "EDP", "Neoenergia", "RGE", "Outra"] as const;
export const estados = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
