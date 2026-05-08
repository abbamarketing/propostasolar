import { ProposalPrintable } from "@/pdf/ProposalPrintable";
import type { ProposalPdfData } from "@/pdf/types";

/**
 * Preview HTML da proposta — espelha exatamente o que vai para o PDF.
 * Renderiza as 3 páginas A4 num container scrollável.
 */
export default function ProposalPdfViewer({ data, className = "" }: { data: ProposalPdfData; className?: string }) {
  return (
    <div className={`overflow-auto rounded-lg border bg-slate-100 ${className}`}>
      <div className="py-4">
        <ProposalPrintable data={data} />
      </div>
    </div>
  );
}
