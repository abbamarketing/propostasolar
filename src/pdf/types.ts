export type ProposalPdfData = {
  proposal: Record<string, any>;
  client: Record<string, any> | null;
  company: Record<string, any> | null;
  seller: Record<string, any> | null;
  items: Record<string, any>[];
  financing: Record<string, any>[];
  photos: Record<string, any>[];
  cityIrradiance: Record<string, any> | null;
};

export const templateNames: Record<string, string> = {
  "on-grid-residencial": "On-Grid Residencial",
  "on-grid-comercial": "On-Grid Comercial",
  "off-grid": "Off-Grid (isolado)",
  rural: "Rural / Agronegócio",
  "comercial-gp": "Comercial Grande Porte",
};