import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProposalStatus } from "@/hooks/use-proposals";

export const statusLabels: Record<ProposalStatus, string> = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  negociacao: "Em negociação",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
};

export const statusColor: Record<ProposalStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-border",
  enviada: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  negociacao: "bg-accent/20 text-accent-foreground border-accent/40",
  aceita: "bg-success/15 text-success border-success/25",
  recusada: "bg-destructive/15 text-destructive border-destructive/25",
  expirada: "bg-muted text-muted-foreground border-border",
};

export function ProposalStatusBadge({ status }: { status: string | null }) {
  const key = (status || "rascunho") as ProposalStatus;
  return (
    <Badge variant="outline" className={cn("gap-1 font-semibold", statusColor[key])}>
      {key === "expirada" ? <Clock className="h-3 w-3" /> : null}
      {statusLabels[key] ?? status}
    </Badge>
  );
}

export function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
}

export function validityText(status?: string | null, validUntil?: string | null) {
  if (status === "rascunho") return { text: "—", expired: false };
  if (!validUntil) return { text: "—", expired: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${validUntil}T00:00:00`);
  const diff = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (diff >= 0) return { text: `Válida por mais ${diff} dia${diff === 1 ? "" : "s"}`, expired: false };
  const days = Math.abs(diff);
  return { text: `Expirada há ${days} dia${days === 1 ? "" : "s"}`, expired: true };
}
