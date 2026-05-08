import { createRoot } from "react-dom/client";
import { ProposalPrintable } from "./ProposalPrintable";
import type { ProposalPdfData } from "./types";

/**
 * Gera o PDF da proposta a partir do componente HTML branded.
 *
 * Estratégia: monta o `<ProposalPrintable />` num container off-screen,
 * espera o paint + carregamento de imagens (logo, fotos), renderiza cada
 * página A4 com html2canvas-pro (suporta oklch/color-mix) e exporta com jsPDF.
 */
export async function buildProposalBlob(data: ProposalPdfData): Promise<Blob> {
  if (typeof window === "undefined") throw new Error("PDF só pode ser gerado no navegador.");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const host = document.createElement("div");
  // Off-screen mas renderizável (html2canvas precisa de layout real).
  host.style.position = "fixed";
  host.style.top = "-10000px";
  host.style.left = "0";
  host.style.width = "210mm";
  host.style.zIndex = "-1";
  host.style.background = "#FFFFFF";
  document.body.appendChild(host);

  // Isola o host de variáveis/herança do app, forçando cores em formato seguro (hex).
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
  document.head.appendChild(isolation);

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
  if (document.fonts?.ready) await document.fonts.ready;

  // Failsafe: sanitiza qualquer cor computada que ainda esteja em oklch().
  const props = ["color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "fill", "stroke"] as const;
  const fallback: Record<string, string> = { color: "#0F172A", backgroundColor: "transparent", borderColor: "#E2E8F0", borderTopColor: "#E2E8F0", borderRightColor: "#E2E8F0", borderBottomColor: "#E2E8F0", borderLeftColor: "#E2E8F0", outlineColor: "#E2E8F0", fill: "#0F172A", stroke: "#0F172A" };
  host.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const cs = getComputedStyle(el);
    for (const p of props) {
      const v = cs[p as any] as string;
      if (v && v.includes("oklch")) (el.style as any)[p] = fallback[p];
    }
  });

  try {
    const pages = Array.from(host.querySelectorAll<HTMLElement>(".pp-page"));
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
        logging: false,
        imageSmoothing: true,
        imageSmoothingQuality: "high",
      });
      if (i > 0) pdf.addPage("a4", "portrait");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    const blob = pdf.output("blob");
    return blob;
  } finally {
    root.unmount();
    host.remove();
    isolation.remove();
  }
}
