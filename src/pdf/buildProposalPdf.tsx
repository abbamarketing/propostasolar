import { createRoot } from "react-dom/client";
import { ProposalPrintable } from "./ProposalPrintable";
import type { ProposalPdfData } from "./types";

/**
 * Gera o PDF da proposta a partir do componente HTML branded.
 *
 * Estratégia: monta o `<ProposalPrintable />` num container off-screen,
 * espera o paint + carregamento de imagens (logo, fotos) e converte para
 * PDF A4 multi-página com html2pdf.js (html2canvas + jsPDF).
 */
export async function buildProposalBlob(data: ProposalPdfData): Promise<Blob> {
  if (typeof window === "undefined") throw new Error("PDF só pode ser gerado no navegador.");
  const html2pdf = (await import("html2pdf.js")).default;

  const host = document.createElement("div");
  // Off-screen mas renderizável (html2canvas precisa de layout real).
  host.style.position = "fixed";
  host.style.top = "-10000px";
  host.style.left = "0";
  host.style.width = "210mm";
  host.style.zIndex = "-1";
  host.style.background = "#FFFFFF";
  document.body.appendChild(host);

  // html2canvas não suporta oklch (Tailwind v4). Isola o host de variáveis/herança
  // do app, forçando cores em formato seguro (hex) dentro do printable.
  const isolation = document.createElement("style");
  isolation.textContent = `
    .proposal-printable, .proposal-printable * {
      --background: #FFFFFF; --foreground: #0F172A;
      --primary: #16A34A; --primary-foreground: #FFFFFF;
      --secondary: #F1F5F9; --secondary-foreground: #0F172A;
      --muted: #F1F5F9; --muted-foreground: #475569;
      --accent: #FBBF24; --accent-foreground: #0F172A;
      --border: #E2E8F0; --input: #E2E8F0; --ring: #16A34A;
      --card: #FFFFFF; --card-foreground: #0F172A;
      --popover: #FFFFFF; --popover-foreground: #0F172A;
      --destructive: #DC2626; --destructive-foreground: #FFFFFF;
    }
  `;
  host.appendChild(isolation);

  const root = createRoot(host);
  await new Promise<void>((resolve) => {
    root.render(<ProposalPrintable data={data} />);
    // 2 frames + tick para garantir layout + fontes
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 60)));
  });

  // Aguarda imagens (logo, fotos) carregarem completamente.
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

  try {
    const blob: Blob = await html2pdf()
      .from(host)
      .set({
        margin: 0,
        filename: `proposta.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#FFFFFF", letterRendering: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        
        pagebreak: { mode: ["css", "legacy"], avoid: [".pp-table", ".pp-pay-hero", ".pp-kpi", ".pp-fin-card"] },
      } as any)
      .outputPdf("blob");
    return blob;
  } finally {
    root.unmount();
    host.remove();
  }
}
