import { Document, Font, Image, LinearGradient, Page, Path, Rect, Stop, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import type React from "react";
import { DataTable, Disclaimer, KpiBox, PDFFooter, PDFHeader, SectionTitle, pdfStyles } from "./components/PDFKit";
import { type ProposalPdfData } from "./types";

// Register a real TTF font so bold rendering doesn't break with default Helvetica.
// Files served from /public/fonts (same origin as the app).
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Roboto-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const monthKeys = ["hsp_jan", "hsp_fev", "hsp_mar", "hsp_abr", "hsp_mai", "hsp_jun", "hsp_jul", "hsp_ago", "hsp_set", "hsp_out", "hsp_nov", "hsp_dez"];

export function ProposalPDF({ data }: { data: ProposalPdfData }) {
  const { proposal, client, company, seller, items, financing, photos, cityIrradiance } = data;
  const fechado = Boolean(proposal.valor_fechado_modo);
  const showItems = !fechado;
  // Layout fixo em 3 páginas: capa + visão geral + investimento/garantias
  const totalPages = 3;
  let page = 2;
  const internal = (children: React.ReactNode) => <Page size="A4" style={styles.page}><PDFHeader companyData={company} />{children}<PDFFooter pageNumber={page++} totalPages={totalPages} companyData={company} /></Page>;
  const economia25 = calcEconomia25(proposal.economia_anual || 0);
  const monthly = monthKeys.map((key) => ((cityIrradiance?.[key] || cityIrradiance?.hsp_medio || proposal.hsp_usado || 5) * (proposal.kwp_instalado || 0) * 30 * (proposal.performance_ratio || 0.8)));
  const chartMax = Math.max(...monthly, 1);
  const accumulated = Array.from({ length: 25 }, (_, i) => calcEconomia25(proposal.economia_anual || 0, i + 1));
  const itemRows: string[][] = (items && items.length > 0)
    ? items.map((item) => [String(item.descricao ?? ""), `${num(Number(item.quantidade) || 0, 0)} ${item.unidade ?? ""}`, money(Number(item.valor_total) || 0)])
    : [
        [`Módulo ${proposal.modulo_marca || ""} ${proposal.modulo_modelo || ""} ${proposal.modulo_potencia_w || ""}W`, `${proposal.qtd_modulos || 0}x`, money(proposal.custo_modulos || 0)],
        [`Inversor ${proposal.inversor_marca || ""} ${proposal.inversor_modelo || ""} ${proposal.inversor_potencia_kw || ""}kW`, `${proposal.qtd_inversores || 1}x`, money(proposal.custo_inversor || 0)],
        ["Estrutura", `${proposal.qtd_modulos || 0} placas`, money(proposal.custo_estrutura || 0)],
        ["Cabos e proteções", "1 conjunto", money(proposal.custo_cabos_protecoes || 0)],
        ["Projeto + ART", "1 serviço", money(proposal.custo_projeto_art || 0)],
        ["Instalação e mão de obra", "1 serviço", money(proposal.custo_mao_obra || 0)],
      ];

  const escopoRows: string[][] = [
    [`Módulos fotovoltaicos ${proposal.modulo_marca || ""} ${proposal.modulo_modelo || ""}`, `${proposal.qtd_modulos || 0} × ${proposal.modulo_potencia_w || 0}W`],
    [`Inversor ${proposal.inversor_marca || ""} ${proposal.inversor_modelo || ""}`, `${proposal.qtd_inversores || 1} × ${proposal.inversor_potencia_kw || 0}kW`],
    ["Estrutura de fixação certificada", `${proposal.qtd_modulos || 0} placas`],
    ["Cabos, conectores e proteções", "Incluso"],
    ["Projeto técnico + ART", "Incluso"],
    ["Instalação e comissionamento", "Incluso"],
    ["Homologação junto à concessionária", "Incluso"],
  ];

  return <Document title={`Proposta ${proposal.numero || ""}`} author={company?.nome_fantasia || "Energiza Solar"}>
    {/* COVER */}
    <Page size="A4" style={styles.cover}>
      <Svg style={styles.coverBg} viewBox="0 0 595 842">
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#15803D" />
          <Stop offset="100%" stopColor="#0B1220" />
        </LinearGradient>
        <Rect x="0" y="0" width="595" height="842" fill="url(#g)" />
        <Path d="M0 600 Q 200 540 400 620 T 800 600 L 800 842 L 0 842 Z" fill="#16A34A" opacity="0.18" />
        <Path d="M0 680 Q 250 620 500 700 T 800 680 L 800 842 L 0 842 Z" fill="#FBBF24" opacity="0.10" />
      </Svg>

      <View style={styles.coverHeader}>
        <Text style={styles.coverBrand}>{(company?.nome_fantasia || "ENERGIZA SOLAR").toUpperCase()}</Text>
        <Text style={styles.coverTagline}>Energia que transforma</Text>
      </View>

      <View style={styles.coverBody}>
        <Text style={styles.coverEyebrow}>PROPOSTA COMERCIAL</Text>
        <Text style={styles.coverTitle}>Sistema fotovoltaico{"\n"}sob medida para você</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverNumber}>Nº {proposal.numero || "—"}</Text>
      </View>

      <View style={styles.coverCard}>
        <Text style={styles.coverCardLabel}>Preparada para</Text>
        <Text style={styles.coverClient}>{client?.nome || "Cliente"}</Text>
        <View style={styles.coverMetaRow}>
          <View style={styles.coverMetaCol}>
            <Text style={styles.coverMetaLabel}>Local</Text>
            <Text style={styles.coverMetaValue}>{proposal.cidade_projeto || client?.endereco_cidade || "—"}/{proposal.uf_projeto || client?.endereco_uf || ""}</Text>
          </View>
          <View style={styles.coverMetaCol}>
            <Text style={styles.coverMetaLabel}>Emissão</Text>
            <Text style={styles.coverMetaValue}>{shortDate(new Date().toISOString().slice(0, 10))}</Text>
          </View>
          <View style={styles.coverMetaCol}>
            <Text style={styles.coverMetaLabel}>Válida até</Text>
            <Text style={styles.coverMetaValue}>{shortDate(proposal.valido_ate)}</Text>
          </View>
        </View>
        <View style={styles.coverSeller}>
          <Text style={styles.coverMetaLabel}>Consultor responsável</Text>
          <Text style={styles.coverMetaValue}>{seller?.nome || "Equipe comercial"}{seller?.telefone ? ` · ${seller.telefone}` : (company?.telefone ? ` · ${company.telefone}` : "")}</Text>
        </View>
      </View>
    </Page>

    {/* PAGE 2: Visão geral — situação, sistema e economia */}
    {internal(<>
      <SectionTitle>Sua proposta de energia solar</SectionTitle>
      <Text style={styles.lead}>Olá {client?.nome?.split(" ")[0] || "cliente"}, este é o sistema fotovoltaico dimensionado para o seu consumo, com economia projetada para os próximos 25 anos.</Text>

      <View style={styles.iconRow}>
        <KpiBox label="Potência" value={`${num(proposal.kwp_instalado, 2)} kWp`} />
        <KpiBox label="Geração" value={`${num(proposal.geracao_estimada_mensal)} kWh/mês`} />
        <KpiBox label="Economia/mês" value={money(proposal.economia_mensal || 0)} />
        <KpiBox label="Payback" value={`${num(proposal.payback_anos, 1)} anos`} />
      </View>

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.subTitleSm}>Situação atual</Text>
          <View style={styles.infoGrid}>
            <InfoRow label="Conta de luz" value={money(client?.conta_luz_media || 0)} />
            <InfoRow label="Consumo" value={`${num(proposal.consumo_estimado_kwh)} kWh/mês`} />
            <InfoRow label="Tarifa" value={`${money(proposal.tarifa_kwh || 0)}/kWh`} />
            <InfoRow label="Concessionária" value={client?.concessionaria || "—"} />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.subTitleSm}>Escopo do fornecimento</Text>
          <View style={styles.includedList}>
            {escopoRows.slice(0, 6).map(([label]) => <Text key={label} style={styles.includedItem}>• {label}</Text>)}
          </View>
        </View>
      </View>

      <Text style={styles.subTitleSm}>Geração mensal estimada (kWh)</Text>
      <BarChart values={monthly} max={chartMax} />
    </>)}

    {/* PAGE 3: Investimento, garantias e aceite */}
    {internal(<>
      <SectionTitle>Investimento e condições</SectionTitle>

      <View style={styles.payHero}>
        <Text style={styles.payHeroLabel}>Investimento total à vista</Text>
        <Text style={styles.payHeroValue}>{money(proposal.valor_total || 0)}</Text>
        <Text style={styles.payHeroSub}>Economia em 25 anos: {money(economia25)}</Text>
      </View>

      {showItems ? <>
        <Text style={styles.subTitleSm}>Composição do investimento</Text>
        <DataTable columns={["Item", "Qtd", "Valor"]} rows={itemRows} />
      </> : null}

      {financing.length ? <>
        <Text style={styles.subTitleSm}>Opções de financiamento</Text>
        <View style={styles.grid}>
          {financing.slice(0, 4).map((f) => <View key={f.id} style={styles.financeCard}>
            <Text style={styles.financeBank}>{f.banco}</Text>
            <Text style={styles.financeValue}>{f.prazo_meses}x {money(f.valor_parcela || 0)}</Text>
            <Text style={styles.financeSub}>Total: {money(((f.valor_parcela || 0) * (f.prazo_meses || 0)) + (f.entrada || 0))}</Text>
          </View>)}
        </View>
      </> : null}

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Text style={styles.subTitleSm}>Garantias e prazos</Text>
          <View style={styles.infoGrid}>
            <InfoRow label="Módulos" value={`${proposal.garantia_modulo_anos || 25} anos`} />
            <InfoRow label="Inversor" value={`${proposal.garantia_inversor_anos || 10} anos`} />
            <InfoRow label="Instalação" value={`${proposal.garantia_instalacao_anos || 1} ano`} />
            <InfoRow label="Execução" value={`${proposal.prazo_execucao_dias_uteis || 30} dias úteis`} />
            <InfoRow label="Homologação" value={`Até ${proposal.prazo_homologacao_dias || 90} dias`} />
          </View>
        </View>
        <View style={styles.col}>
          <Text style={styles.subTitleSm}>Etapas do projeto</Text>
          <View style={styles.timelineCol}>
            {["Pagamento", "Projeto", "Instalação", "Homologação", "Operando"].map((item, i) => <View key={item} style={styles.timelineItemRow}><Text style={styles.timelineNum}>{i + 1}</Text><Text style={styles.timelineLabelRow}>{item}</Text></View>)}
          </View>
          <Text style={styles.validity}>Proposta válida até {shortDate(proposal.valido_ate)}</Text>
        </View>
      </View>

      {proposal.observacoes_comerciais ? <Text style={styles.obs}><Text style={styles.obsLabel}>Observações: </Text>{String(proposal.observacoes_comerciais).replace(/[*#_]/g, "").slice(0, 280)}</Text> : null}

      <View style={styles.signatureRow}>
        <View style={styles.signatureBox}><Text style={styles.signatureLine}>_______________________________</Text><Text style={styles.signatureLabel}>{client?.nome || "Cliente"}</Text></View>
        <View style={styles.signatureBox}><Text style={styles.signatureLine}>_______________________________</Text><Text style={styles.signatureLabel}>{company?.nome_fantasia || "Energiza Solar"}</Text></View>
      </View>
    </>)}
  </Document>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

function BarChart({ values, max }: { values: number[]; max: number }) { return <View style={styles.chart}>{values.map((v, i) => <View key={months[i]} style={styles.barWrap}><View style={[styles.bar, { height: 90 * (v / max) }]} /><Text style={styles.chartLabel}>{months[i]}</Text></View>)}</View>; }
function AreaChart({ values, investment }: { values: number[]; investment: number }) { const max = Math.max(...values, investment, 1); return <View style={styles.area}>{values.map((v, i) => <View key={i} style={[styles.areaBar, { height: 90 * (v / max) }]} />)}<View style={[styles.investLine, { bottom: 10 + 90 * (investment / max) }]} /></View>; }
function money(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0); }
function num(v: number, digits = 0) { return (Number(v) || 0).toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits }); }
function shortDate(v?: string | null) { return v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—"; }
function calcEconomia25(anual: number, years = 25) { let total = 0; for (let i = 1; i <= years; i++) total += anual * Math.pow(1.08, i - 1); return total; }
function chunk<T>(rows: T[], size: number) { return Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, i * size + size)); }

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 50, color: pdfStyles.colors.text, fontSize: 10, fontFamily: "Roboto" },

  // COVER
  cover: { position: "relative", fontFamily: "Roboto" },
  coverBg: { position: "absolute", top: 0, left: 0, width: 595, height: 842 },
  coverHeader: { position: "absolute", top: 40, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coverBrand: { color: "#FFFFFF", fontSize: 13, fontWeight: 700, letterSpacing: 2 },
  coverTagline: { color: "#BBF7D0", fontSize: 9, fontWeight: 400 },
  coverBody: { position: "absolute", top: 200, left: 40, right: 40 },
  coverEyebrow: { color: "#BBF7D0", fontSize: 11, fontWeight: 500, letterSpacing: 4, marginBottom: 14 },
  coverTitle: { color: "#FFFFFF", fontSize: 34, fontWeight: 700, lineHeight: 1.15 },
  coverDivider: { width: 60, height: 3, backgroundColor: "#FBBF24", marginTop: 18, marginBottom: 14 },
  coverNumber: { color: "#FFFFFF", fontSize: 14, fontWeight: 500 },

  coverCard: { position: "absolute", left: 40, right: 40, bottom: 50, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 24 },
  coverCardLabel: { color: "#64748B", fontSize: 9, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 },
  coverClient: { color: "#0F172A", fontSize: 22, fontWeight: 700, marginTop: 4, marginBottom: 14 },
  coverMetaRow: { flexDirection: "row", gap: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  coverMetaCol: { flex: 1 },
  coverMetaLabel: { color: "#64748B", fontSize: 8, fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  coverMetaValue: { color: "#0F172A", fontSize: 11, fontWeight: 500 },
  coverSeller: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0" },

  // CONTENT
  lead: { fontSize: 12, lineHeight: 1.6, color: "#0F172A", marginBottom: 12, fontWeight: 500 },
  p: { fontSize: 10, lineHeight: 1.65, color: "#334155", marginBottom: 10 },
  subTitle: { fontSize: 12, fontWeight: 700, color: "#0F172A", marginTop: 14, marginBottom: 10 },
  iconRow: { flexDirection: "row", gap: 8, marginVertical: 14 },

  infoGrid: { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 4, marginBottom: 14 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  infoLabel: { color: "#64748B", fontSize: 10 },
  infoValue: { color: "#0F172A", fontSize: 10, fontWeight: 500 },

  warningCard: { backgroundColor: "#FEF2F2", borderLeftWidth: 4, borderLeftColor: "#DC2626", borderRadius: 8, padding: 16, marginTop: 14 },
  warningLabel: { color: "#991B1B", fontSize: 10, fontWeight: 500, marginBottom: 4 },
  warningValue: { color: "#7F1D1D", fontSize: 26, fontWeight: 700, marginBottom: 2 },
  warningSub: { color: "#991B1B", fontSize: 9 },

  heroCard: { backgroundColor: "#F0FDF4", borderLeftWidth: 4, borderLeftColor: "#16A34A", borderRadius: 8, padding: 18, marginBottom: 14 },
  heroLabel: { color: "#166534", fontSize: 10, fontWeight: 500, marginBottom: 4 },
  heroValue: { color: "#15803D", fontSize: 28, fontWeight: 700, marginBottom: 2 },
  heroSub: { color: "#166534", fontSize: 9 },

  payHero: { backgroundColor: "#15803D", borderRadius: 12, padding: 22, marginBottom: 16, alignItems: "center" },
  payHeroLabel: { color: "#BBF7D0", fontSize: 10, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  payHeroValue: { color: "#FFFFFF", fontSize: 32, fontWeight: 700 },
  payHeroSub: { color: "#BBF7D0", fontSize: 10, marginTop: 4 },

  includedList: { backgroundColor: "#F8FAFC", borderRadius: 8, padding: 14, gap: 6 },
  includedItem: { color: "#334155", fontSize: 10, lineHeight: 1.5 },

  chart: { height: 130, marginTop: 6, flexDirection: "row", alignItems: "flex-end", gap: 4, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#CBD5E1" },
  barWrap: { flex: 1, alignItems: "center" },
  bar: { width: 18, backgroundColor: "#16A34A", borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  chartLabel: { fontSize: 7, color: "#64748B", marginTop: 4 },
  area: { height: 130, marginTop: 6, flexDirection: "row", alignItems: "flex-end", gap: 2, position: "relative", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#CBD5E1" },
  areaBar: { flex: 1, backgroundColor: "#86EFAC" },
  investLine: { position: "absolute", left: 0, right: 0, height: 2, backgroundColor: "#FBBF24" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  financeCard: { width: "47%", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, padding: 12, backgroundColor: "#FFFFFF" },
  financeBank: { fontWeight: 700, color: "#0F172A", fontSize: 11, marginBottom: 4 },
  financeValue: { color: "#15803D", fontSize: 13, fontWeight: 700, marginBottom: 2 },
  financeSub: { color: "#64748B", fontSize: 9 },

  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  photoBox: { width: "47%" },
  photo: { height: 150, borderRadius: 10, objectFit: "cover" },
  caption: { marginTop: 5, fontSize: 8, color: "#64748B" },

  timeline: { flexDirection: "row", marginTop: 8, gap: 8 },
  timelineItem: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 8, padding: 10, alignItems: "center" },
  timelineNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#16A34A", color: "#FFFFFF", fontSize: 11, fontWeight: 700, textAlign: "center", paddingTop: 4, marginBottom: 6 },
  timelineLabel: { fontSize: 8, color: "#0F172A", fontWeight: 500, textAlign: "center" },

  signatureRow: { marginTop: 50, flexDirection: "row", gap: 30, justifyContent: "space-between" },
  signatureBox: { flex: 1, alignItems: "center" },
  signatureLine: { color: "#94A3B8", fontSize: 10 },
  signatureLabel: { fontSize: 9, color: "#475569", marginTop: 4, fontWeight: 500 },

  companyFooter: { marginTop: 30, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  companyName: { fontSize: 10, fontWeight: 700, color: "#0F172A", marginBottom: 3 },
  companyMeta: { fontSize: 8, color: "#64748B", lineHeight: 1.5 },
});
