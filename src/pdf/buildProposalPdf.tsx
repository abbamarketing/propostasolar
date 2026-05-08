import { createRoot } from "react-dom/client";
import { ProposalPrintable } from "./ProposalPrintable";
import type { ProposalPdfData } from "./types";

/**
 * Gera PDF A4 (4 páginas) a partir do componente HTML imprimível,
 * usando html2pdf.js que respeita @page + page-break-after.
 */
export async function buildProposalBlob(data: ProposalPdfData): Promise<Blob> {
  if (typeof window === "undefined") throw new Error("PDF só pode ser gerado no navegador.");
  const html2pdf = (await import("html2pdf.js")).default;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "-10000px";
  host.style.left = "0";
  host.style.width = "210mm";
  host.style.zIndex = "-1";
  host.style.background = "#FFFFFF";
  document.body.appendChild(host);

  const root = createRoot(host);
  await new Promise<void>((resolve) => {
    root.render(<ProposalPrintable data={data} />);
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 80)));
  });

  // Aguarda imagens
  const imgs = Array.from(host.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener("load", () => res(), { once: true });
            img.addEventListener("error", () => res(), { once: true });
          })
    )
  );
  if (document.fonts?.ready) await document.fonts.ready;

  const target = host.querySelector("#proposta-pdf") as HTMLElement | null;
  if (!target) throw new Error("Conteúdo da proposta não encontrado.");

  try {
    const blob: Blob = await html2pdf()
      .from(target)
      .set({
        margin: 0,
        filename: `proposta-energiza-${data.proposal.numero || "sem-numero"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, backgroundColor: "#FFFFFF" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .outputPdf("blob");
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}
