import { pdf } from "@react-pdf/renderer";
import { ProposalPDF } from "./ProposalPDF";
import type { ProposalPdfData } from "./types";

export async function buildProposalBlob(data: ProposalPdfData): Promise<Blob> {
  return pdf(<ProposalPDF data={data} />).toBlob();
}