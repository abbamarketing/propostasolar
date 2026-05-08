import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ProposalPdfData } from "@/pdf/types";

export function useProposalForPdf(proposalId?: string) {
  return useQuery({
    queryKey: ["proposal-pdf", proposalId],
    enabled: Boolean(proposalId),
    queryFn: async (): Promise<ProposalPdfData> => {
      const { data: proposal, error } = await supabase.from("proposals").select("*").eq("id", proposalId ?? "").maybeSingle();
      if (error) throw error;
      if (!proposal) throw new Error("Proposta não encontrada.");
      const [client, company, seller, items, financing, photos, city] = await Promise.all([
        supabase.from("clients").select("*").eq("id", proposal.client_id).maybeSingle(),
        supabase.from("companies").select("*").eq("id", proposal.company_id).maybeSingle(),
        proposal.vendedor_id ? supabase.from("user_profiles").select("*").eq("id", proposal.vendedor_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from("proposal_items").select("*").eq("proposal_id", proposal.id).order("ordem"),
        supabase.from("proposal_financing_options").select("*").eq("proposal_id", proposal.id).eq("incluir_proposta", true).order("prazo_meses"),
        supabase.from("proposal_photos").select("*").eq("proposal_id", proposal.id).order("ordem"),
        proposal.cidade_projeto && proposal.uf_projeto ? supabase.from("cities_irradiance").select("*").eq("cidade", proposal.cidade_projeto).eq("uf", proposal.uf_projeto).maybeSingle() : Promise.resolve({ data: null, error: null }),
      ]);
      for (const result of [client, company, seller, items, financing, photos, city]) if (result.error) throw result.error;
      return { proposal, client: client.data, company: company.data, seller: seller.data, items: items.data ?? [], financing: financing.data ?? [], photos: photos.data ?? [], cityIrradiance: city.data };
    },
  });
}

export function useProposalPdfActions(proposalId?: string, data?: ProposalPdfData) {
  const queryClient = useQueryClient();
  const generate = async () => {
    if (!data || !proposalId) throw new Error("Dados da proposta indisponíveis.");
    const { buildProposalBlob } = await import("@/pdf/buildProposalPdf");
    return buildProposalBlob(data);
  };
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const blob = await generate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposta-${data?.proposal.numero || proposalId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => handlePdfError(error),
  });
  const saveMutation = useMutation({
    mutationFn: async () => {
      const blob = await generate();
      const proposal = data!.proposal;
      const path = `${proposal.company_id}/${proposal.id}/${proposal.numero || proposal.id}.pdf`;
      const { error: uploadError } = await supabase.storage.from("proposal-pdfs").upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("proposal-pdfs").getPublicUrl(path);
      const { error: updateError } = await supabase.from("proposals").update({ pdf_url: publicData.publicUrl, status: "enviada", enviada_em: new Date().toISOString() }).eq("id", proposal.id);
      if (updateError) throw updateError;
      await queryClient.invalidateQueries({ queryKey: ["proposal", proposal.id] });
      await queryClient.invalidateQueries({ queryKey: ["proposal-pdf", proposal.id] });
      toast.success("PDF salvo no histórico.");
      return publicData.publicUrl;
    },
    onError: (error) => handlePdfError(error),
  });
  const signedLinkMutation = useMutation({
    mutationFn: async () => {
      const proposal = data?.proposal;
      if (!proposal?.pdf_url) throw new Error("Salve o PDF antes de copiar o link.");
      const path = `${proposal.company_id}/${proposal.id}/${proposal.numero || proposal.id}.pdf`;
      const { data: signed, error } = await supabase.storage.from("proposal-pdfs").createSignedUrl(path, 60 * 60 * 24 * 7);
      if (error) throw error;
      await navigator.clipboard.writeText(signed.signedUrl);
      toast.success("Link copiado para a área de transferência.");
      return signed.signedUrl;
    },
    onError: (error) => handlePdfError(error),
  });
  return { isGenerating: downloadMutation.isPending, isSaving: saveMutation.isPending, download: () => downloadMutation.mutateAsync(), saveToStorage: () => saveMutation.mutateAsync(), getSignedLink: () => signedLinkMutation.mutateAsync() };
}

function handlePdfError(error: unknown) {
  console.error("Erro ao gerar PDF", error);
  toast.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : "falha desconhecida"}`);
}