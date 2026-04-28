import { PDFViewer } from "@react-pdf/renderer";
import { ProposalPDF } from "@/pdf/ProposalPDF";
import type { ProposalPdfData } from "@/pdf/types";

export default function ProposalPdfViewer({ data, className = "" }: { data: ProposalPdfData; className?: string }) {
  return <PDFViewer className={className} showToolbar><ProposalPDF data={data} /></PDFViewer>;
}