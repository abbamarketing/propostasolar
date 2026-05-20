import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type Profile = Database["public"]["Tables"]["user_profiles"]["Row"];
type Company = Database["public"]["Tables"]["companies"]["Row"];
type Financing = Database["public"]["Tables"]["proposal_financing_options"]["Row"];
type Photo = Database["public"]["Tables"]["proposal_photos"]["Row"];

export type ProposalStatus = "rascunho" | "enviada" | "negociacao" | "aceita" | "recusada" | "expirada";
export type DateRange = { from: Date; to: Date };
export type ProposalListRow = Proposal & { clients: Pick<Client, "nome" | "cpf_cnpj" | "email" | "telefone" | "endereco_cidade" | "endereco_uf"> | null; user_profiles: Pick<Profile, "nome" | "avatar_url" | "email"> | null };
export type ProposalDetail = Proposal & { clients: Client | null; companies: Company | null; user_profiles: Profile | null; proposal_financing_options: Financing[]; proposal_photos: Photo[]; proposal_items: Database["public"]["Tables"]["proposal_items"]["Row"][] };

export type ProposalFilters = {
  search?: string;
  statuses?: ProposalStatus[];
  from?: Date;
  to?: Date;
  sellerId?: string;
  minValue?: number;
  maxValue?: number;
  city?: string;
};

export type ProposalSort = { column: "numero" | "valor_total" | "created_at" | "updated_at" | "valido_ate"; direction: "asc" | "desc" };

const api = supabase as any;
const nonDraftStatuses: ProposalStatus[] = ["enviada", "negociacao", "aceita", "recusada", "expirada"];
export const proposalSortableColumns = ["numero", "valor_total", "created_at", "updated_at", "valido_ate"] as const;

function isoStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoEnd(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function previousRange(range: DateRange): DateRange {
  const days = Math.max(1, Math.ceil((range.to.getTime() - range.from.getTime()) / 86400000) + 1);
  const prevTo = new Date(range.from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - days + 1);
  return { from: prevFrom, to: prevTo };
}

function changePct(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return ((current - previous) / previous) * 100;
}

async function fetchPeriodRows(range: DateRange) {
  const { data, error } = await api
    .from("proposals")
    .select("*")
    .is("deleted_at", null)
    .gte("created_at", isoStart(range.from))
    .lte("created_at", isoEnd(range.to));
  if (error) throw error;
  return (data ?? []) as Proposal[];
}

async function hydrateList(rows: Proposal[]): Promise<ProposalListRow[]> {
  const clientIds = [...new Set(rows.map((p) => p.client_id).filter(Boolean))];
  const sellerIds = [...new Set(rows.map((p) => p.vendedor_id).filter(Boolean))];
  const [clientsRes, sellersRes] = await Promise.all([
    clientIds.length ? api.from("clients").select("nome,cpf_cnpj,email,telefone,endereco_cidade,endereco_uf,id").in("id", clientIds) : Promise.resolve({ data: [], error: null }),
    sellerIds.length ? api.from("user_profiles").select("id,nome,avatar_url,email").in("id", sellerIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (clientsRes.error) throw clientsRes.error;
  if (sellersRes.error) throw sellersRes.error;
  const clients = new Map((clientsRes.data ?? []).map((c: any) => [c.id, c]));
  const sellers = new Map((sellersRes.data ?? []).map((u: any) => [u.id, u]));
  return rows.map((p) => ({ ...p, clients: clients.get(p.client_id) ?? null, user_profiles: p.vendedor_id ? sellers.get(p.vendedor_id) ?? null : null })) as ProposalListRow[];
}

export function useDashboardMetrics(range: DateRange) {
  return useQuery({
    queryKey: ["dashboard-metrics", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const prev = previousRange(range);
      const [currentRows, previousRows, latestRaw, sellersRes] = await Promise.all([
        fetchPeriodRows(range),
        fetchPeriodRows(prev),
        api.from("proposals").select("*").is("deleted_at", null).order("updated_at", { ascending: false }).limit(10),
        api.from("user_profiles").select("id,nome,email,avatar_url"),
      ]);
      if (latestRaw.error) throw latestRaw.error;
      if (sellersRes.error) throw sellersRes.error;
      const latest = await hydrateList((latestRaw.data ?? []) as Proposal[]);
      const issued = currentRows.filter((p) => p.status !== "rascunho");
      const prevIssued = previousRows.filter((p) => p.status !== "rascunho");
      const accepted = issued.filter((p) => p.status === "aceita");
      const prevAccepted = prevIssued.filter((p) => p.status === "aceita");
      const sum = (rows: Proposal[]) => rows.reduce((acc, p) => acc + Number(p.valor_total ?? 0), 0);
      const avg = (rows: Proposal[]) => (rows.length ? sum(rows) / rows.length : 0);
      const byStatus = (["rascunho", ...nonDraftStatuses] as ProposalStatus[]).map((status) => ({ status, total: currentRows.filter((p) => p.status === status).length }));
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - (5 - i));
        return d;
      });
      const monthFrom = new Date(months[0]);
      const monthlyRes = await api.from("proposals").select("status,valor_total,created_at").is("deleted_at", null).gte("created_at", isoStart(monthFrom));
      if (monthlyRes.error) throw monthlyRes.error;
      const monthlyRows = (monthlyRes.data ?? []) as Proposal[];
      const monthly = months.map((month) => {
        const key = month.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
        const rows = monthlyRows.filter((p) => {
          const d = new Date(p.created_at);
          return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() && p.status !== "rascunho";
        });
        return { mes: key, emitido: sum(rows), aceito: sum(rows.filter((p) => p.status === "aceita")) };
      });
      const sellers = (sellersRes.data ?? []) as Pick<Profile, "id" | "nome" | "avatar_url" | "email">[];
      const topSellers = sellers.map((seller) => ({ ...seller, valor: sum(accepted.filter((p) => p.vendedor_id === seller.id)) })).filter((s) => s.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 5);
      return { kpis: { issued: { value: issued.length, change: changePct(issued.length, prevIssued.length) }, total: { value: sum(issued), change: changePct(sum(issued), sum(prevIssued)) }, conversion: { value: issued.length ? accepted.length / issued.length : 0, accepted: accepted.length, total: issued.length }, averageTicket: { value: avg(accepted), change: changePct(avg(accepted), avg(prevAccepted)) } }, byStatus, monthly, topSellers, latest };
    },
  });
}

export function useProposalsList({ filters, page, pageSize, sort }: { filters: ProposalFilters; page: number; pageSize: number; sort: ProposalSort }) {
  return useQuery({
    queryKey: ["proposals-list", filters, page, pageSize, sort],
    queryFn: async () => {
      let query = api.from("proposals").select("*", { count: "exact" }).is("deleted_at", null);
      if (filters.statuses?.length) query = query.in("status", filters.statuses);
      if (filters.from) query = query.gte("created_at", isoStart(filters.from));
      if (filters.to) query = query.lte("created_at", isoEnd(filters.to));
      if (filters.sellerId) query = query.eq("vendedor_id", filters.sellerId);
      if (filters.minValue != null) query = query.gte("valor_total", filters.minValue);
      if (filters.maxValue != null) query = query.lte("valor_total", filters.maxValue);
      if (filters.city) query = query.ilike("cidade_projeto", `%${filters.city}%`);
      if (filters.search?.trim()) query = query.ilike("numero", `%${filters.search.trim()}%`);
      const from = (page - 1) * pageSize;
      const { data, error, count } = await query.order(sort.column, { ascending: sort.direction === "asc" }).range(from, from + pageSize - 1);
      if (error) throw error;
      let rows = await hydrateList((data ?? []) as Proposal[]);
      if (filters.search?.trim()) {
        const term = filters.search.trim().toLowerCase();
        rows = rows.filter((p) => (p.numero ?? "").toLowerCase().includes(term) || (p.clients?.nome ?? "").toLowerCase().includes(term) || (p.clients?.cpf_cnpj ?? "").toLowerCase().includes(term));
      }
      return { rows, count: filters.search?.trim() ? rows.length : count ?? 0 };
    },
  });
}

export function useProposal(id?: string) {
  return useQuery({
    queryKey: ["proposal-detail", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: proposal, error } = await api.from("proposals").select("*").eq("id", id).is("deleted_at", null).single();
      if (error) throw error;
      const [client, company, seller, financing, photos, items] = await Promise.all([
        api.from("clients").select("*").eq("id", proposal.client_id).maybeSingle(),
        api.from("companies").select("*").eq("id", proposal.company_id).maybeSingle(),
        proposal.vendedor_id ? api.from("user_profiles").select("*").eq("id", proposal.vendedor_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        api.from("proposal_financing_options").select("*").eq("proposal_id", proposal.id),
        api.from("proposal_photos").select("*").eq("proposal_id", proposal.id).order("ordem"),
        api.from("proposal_items").select("*").eq("proposal_id", proposal.id).order("ordem"),
      ]);
      for (const result of [client, company, seller, financing, photos, items]) if (result.error) throw result.error;
      return { ...proposal, clients: client.data, companies: company.data, user_profiles: seller.data, proposal_financing_options: financing.data ?? [], proposal_photos: photos.data ?? [], proposal_items: items.data ?? [] } as ProposalDetail;
    },
  });
}
export function useProposalEvents(id?: string) {
  return useQuery({
    queryKey: ["proposal-events", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await api.from("proposal_status_events").select("*,user_profiles(nome,email)").eq("proposal_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProposalSellers() {
  return useQuery({
    queryKey: ["proposal-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_profiles").select("id,nome,email,avatar_url,cargo,telefone,ativo,company_id").eq("ativo", true).order("nome");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateProposalStatus(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: ProposalStatus) => {
      if (!id) throw new Error("Proposta não informada.");
      const current = await api.from("proposals").select("status,company_id").eq("id", id).single();
      if (current.error) throw current.error;
      const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "enviada") payload.enviada_em = new Date().toISOString();
      if (status === "aceita") payload.aceita_em = new Date().toISOString();
      if (status === "recusada") payload.recusada_em = new Date().toISOString();
      const { error } = await api.from("proposals").update(payload).eq("id", id);
      if (error) throw error;
      await api.from("proposal_status_events").insert({ proposal_id: id, company_id: current.data.company_id, from_status: current.data.status, to_status: status });
      return status;
    },
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: ["proposal-detail", id] });
      const previous = queryClient.getQueryData(["proposal-detail", id]);
      queryClient.setQueryData(["proposal-detail", id], (old: any) => (old ? { ...old, status } : old));
      return { previous };
    },
    onError: (error, _status, context) => {
      queryClient.setQueryData(["proposal-detail", id], context?.previous);
      toast.error(error instanceof Error ? error.message : "Não foi possível mudar o status.");
    },
    onSuccess: () => toast.success("Status atualizado."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
      queryClient.invalidateQueries({ queryKey: ["proposal-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useBulkUpdateProposalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ProposalStatus }) => {
      if (!ids.length) return 0;
      const payload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (status === "enviada") payload.enviada_em = new Date().toISOString();
      if (status === "aceita") payload.aceita_em = new Date().toISOString();
      if (status === "recusada") payload.recusada_em = new Date().toISOString();
      const { error } = await api.from("proposals").update(payload).in("id", ids);
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success(`${count} proposta${count === 1 ? "" : "s"} atualizada${count === 1 ? "" : "s"}.`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar as propostas."),
  });
}

export function useDuplicateProposal(id?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Proposta não informada.");
      const { data, error } = await api.from("proposals").select("*").eq("id", id).single();
      if (error) throw error;
      const { id: _id, numero: _numero, created_at: _created, updated_at: _updated, enviada_em: _env, aceita_em: _ace, recusada_em: _rec, pdf_url: _pdf, deleted_at: _del, ...copy } = data;
      const { data: newProposal, error: insertError } = await api.from("proposals").insert({ ...copy, status: "rascunho", numero: null }).select("id").single();
      if (insertError) throw insertError;
      try {
        const [items, financing, photos] = await Promise.all([
          api.from("proposal_items").select("*").eq("proposal_id", id),
          api.from("proposal_financing_options").select("*").eq("proposal_id", id),
          api.from("proposal_photos").select("*").eq("proposal_id", id),
        ]);
        if (items.data?.length) await api.from("proposal_items").insert(items.data.map(({ id: _i, proposal_id: _p, ...row }: any) => ({ ...row, proposal_id: newProposal.id })));
        if (financing.data?.length) await api.from("proposal_financing_options").insert(financing.data.map(({ id: _i, proposal_id: _p, ...row }: any) => ({ ...row, proposal_id: newProposal.id })));
        if (photos.data?.length) await api.from("proposal_photos").insert(photos.data.map(({ id: _i, proposal_id: _p, ...row }: any) => ({ ...row, proposal_id: newProposal.id })));
      } catch (copyError) {
        await api.from("proposals").update({ deleted_at: new Date().toISOString() }).eq("id", newProposal.id);
        throw copyError;
      }
      return newProposal.id as string;
    },
    onSuccess: () => {
      toast.success("Proposta duplicada como rascunho.");
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível duplicar."),
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.from("proposals").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("status", "rascunho");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rascunho excluído.");
      queryClient.invalidateQueries({ queryKey: ["proposals-list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível excluir."),
  });
}

export function useGlobalProposalSearch(term: string) {
  return useQuery({
    queryKey: ["global-proposal-search", term],
    enabled: term.trim().length > 1,
    queryFn: async () => {
      const q = `%${term.trim()}%`;
      const { data, error } = await api.from("proposals").select("id,numero,status,clients(nome)").is("deleted_at", null).or(`numero.ilike.${q},clients.nome.ilike.${q}`).limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
}
