import type { ProposalPdfData } from "./types";
import logoUrl from "@/assets/energiza-solar-logo.png";

/**
 * Componente HTML imprimível (A4). Usado tanto para preview no app
 * quanto para gerar PDF via html2pdf (canvas → jsPDF).
 *
 * Padrão de design fixo (3 páginas):
 *   1) Capa branded (verde Energiza + accent amarelo)
 *   2) Visão geral (sistema, situação, geração mensal, escopo)
 *   3) Investimento, garantias, financiamento e aceite
 *
 * Branding: logo Energiza Solar, paleta #15803D / #16A34A / #FBBF24
 * sobre fundo navy #0F172A. Tipografia: Inter (sans).
 */

const COLORS = {
  green: "#16A34A",
  greenDark: "#15803D",
  greenSoft: "#DCFCE7",
  navy: "#0F172A",
  slate: "#475569",
  slateSoft: "#F1F5F9",
  border: "#E2E8F0",
  yellow: "#FBBF24",
  white: "#FFFFFF",
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const monthKeys = ["hsp_jan", "hsp_fev", "hsp_mar", "hsp_abr", "hsp_mai", "hsp_jun", "hsp_jul", "hsp_ago", "hsp_set", "hsp_out", "hsp_nov", "hsp_dez"];

const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
const num = (v: number, d = 0) => (Number(v) || 0).toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });
const shortDate = (v?: string | null) => (v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—");
const calcEconomia25 = (anual: number, years = 25) => {
  let total = 0;
  for (let i = 1; i <= years; i++) total += anual * Math.pow(1.08, i - 1);
  return total;
};

export function ProposalPrintable({ data }: { data: ProposalPdfData }) {
  const { proposal, client, company, seller, items, financing, cityIrradiance } = data;
  const fechado = Boolean(proposal.valor_fechado_modo);
  const showItems = !fechado;

  const monthly = monthKeys.map(
    (k) => (cityIrradiance?.[k] || cityIrradiance?.hsp_medio || proposal.hsp_usado || 5)
      * (proposal.kwp_instalado || 0) * 30 * (proposal.performance_ratio || 0.8)
  );
  const chartMax = Math.max(...monthly, 1);
  const economia25 = calcEconomia25(proposal.economia_anual || 0);
  const logo = company?.logo_url || logoUrl;
  const brandName = company?.nome_fantasia || "ENERGIZA SOLAR";

  const escopo: Array<[string, string]> = [
    [`Módulos ${proposal.modulo_marca || ""} ${proposal.modulo_modelo || ""}`.trim(), `${proposal.qtd_modulos || 0} × ${proposal.modulo_potencia_w || 0}W`],
    [`Inversor ${proposal.inversor_marca || ""} ${proposal.inversor_modelo || ""}`.trim(), `${proposal.qtd_inversores || 1} × ${proposal.inversor_potencia_kw || 0}kW`],
    ["Estrutura de fixação certificada", `${proposal.qtd_modulos || 0} placas`],
    ["Cabos, conectores e proteções", "Incluso"],
    ["Projeto técnico + ART", "Incluso"],
    ["Instalação, comissionamento e homologação", "Incluso"],
  ];

  const itemRows: Array<[string, string, string]> = items && items.length > 0
    ? items.map((it) => [String(it.descricao ?? ""), `${num(Number(it.quantidade) || 0, 0)} ${it.unidade ?? ""}`, money(Number(it.valor_total) || 0)])
    : [
        [`Módulo ${proposal.modulo_marca || ""} ${proposal.modulo_modelo || ""} ${proposal.modulo_potencia_w || ""}W`, `${proposal.qtd_modulos || 0}x`, money(proposal.custo_modulos || 0)],
        [`Inversor ${proposal.inversor_marca || ""} ${proposal.inversor_modelo || ""} ${proposal.inversor_potencia_kw || ""}kW`, `${proposal.qtd_inversores || 1}x`, money(proposal.custo_inversor || 0)],
        ["Estrutura", `${proposal.qtd_modulos || 0} placas`, money(proposal.custo_estrutura || 0)],
        ["Cabos e proteções", "1 conjunto", money(proposal.custo_cabos_protecoes || 0)],
        ["Projeto + ART", "1 serviço", money(proposal.custo_projeto_art || 0)],
        ["Instalação e mão de obra", "1 serviço", money(proposal.custo_mao_obra || 0)],
      ];

  return (
    <div className="proposal-printable" style={rootStyle}>
      <style>{css}</style>

      {/* ====== PÁGINA 1 — CAPA ====== */}
      <section className="pp-page pp-cover">
        <div className="pp-cover-bg" />
        <div className="pp-cover-wave" />
        <div className="pp-cover-wave2" />

        <header className="pp-cover-header">
          <div className="pp-cover-logo-chip">
            <img src={logo} alt={brandName} />
          </div>
          <span className="pp-cover-tag">Energia que transforma</span>
        </header>

        <div className="pp-cover-body">
          <span className="pp-eyebrow">PROPOSTA COMERCIAL</span>
          <h1 className="pp-cover-title">
            Sistema fotovoltaico
            <br />
            sob medida para você
          </h1>
          <span className="pp-cover-divider" />
          <span className="pp-cover-number">Nº {proposal.numero || "—"}</span>
        </div>

        <div className="pp-cover-card">
          <span className="pp-card-label">Preparada para</span>
          <h2 className="pp-cover-client">{client?.nome || "Cliente"}</h2>

          <div className="pp-cover-meta">
            <Meta label="Local" value={`${proposal.cidade_projeto || client?.endereco_cidade || "—"}/${proposal.uf_projeto || client?.endereco_uf || ""}`} />
            <Meta label="Emissão" value={shortDate(new Date().toISOString().slice(0, 10))} />
            <Meta label="Válida até" value={shortDate(proposal.valido_ate)} />
          </div>

          <div className="pp-cover-seller">
            <span className="pp-card-label">Consultor responsável</span>
            <span className="pp-cover-meta-value">
              {seller?.nome || "Equipe comercial"}
              {seller?.telefone ? ` · ${seller.telefone}` : company?.telefone ? ` · ${company.telefone}` : ""}
            </span>
          </div>
        </div>
      </section>

      {/* ====== PÁGINA 2 — VISÃO GERAL ====== */}
      <section className="pp-page pp-content">
        <PageHeader logo={logo} brandName={brandName} />

        <h2 className="pp-h1">Sua proposta de energia solar</h2>
        <p className="pp-lead">
          Olá {client?.nome?.split(" ")[0] || "cliente"}, este é o sistema fotovoltaico dimensionado para o seu consumo,
          com economia projetada para os próximos 25 anos.
        </p>

        <div className="pp-kpis">
          <Kpi label="Potência" value={`${num(proposal.kwp_instalado, 2)} kWp`} />
          <Kpi label="Geração" value={`${num(proposal.geracao_estimada_mensal)} kWh/mês`} />
          <Kpi label="Economia/mês" value={money(proposal.economia_mensal || 0)} />
          <Kpi label="Payback" value={`${num(proposal.payback_anos, 1)} anos`} />
        </div>

        <div className="pp-two-col">
          <div>
            <h3 className="pp-h3">Situação atual</h3>
            <div className="pp-info">
              <InfoRow label="Conta de luz" value={money(client?.conta_luz_media || 0)} />
              <InfoRow label="Consumo" value={`${num(proposal.consumo_estimado_kwh)} kWh/mês`} />
              <InfoRow label="Tarifa" value={`${money(proposal.tarifa_kwh || 0)}/kWh`} />
              <InfoRow label="Concessionária" value={client?.concessionaria || "—"} />
            </div>
          </div>
          <div>
            <h3 className="pp-h3">Escopo do fornecimento</h3>
            <ul className="pp-bullets">
              {escopo.map(([label, qty]) => (
                <li key={label}>
                  <span className="pp-bullet-dot" />
                  <span className="pp-bullet-text">{label}</span>
                  <span className="pp-bullet-qty">{qty}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="pp-h3" style={{ marginTop: 14 }}>Geração mensal estimada (kWh)</h3>
        <div className="pp-chart">
          {monthly.map((v, i) => (
            <div key={months[i]} className="pp-bar-wrap">
              <div className="pp-bar" style={{ height: `${Math.max(6, 100 * (v / chartMax))}px` }} />
              <span className="pp-bar-label">{months[i]}</span>
            </div>
          ))}
        </div>

        <PageFooter company={company} pageNumber={2} totalPages={3} />
      </section>

      {/* ====== PÁGINA 3 — INVESTIMENTO ====== */}
      <section className="pp-page pp-content">
        <PageHeader logo={logo} brandName={brandName} />

        <h2 className="pp-h1">Investimento e condições</h2>

        <div className="pp-pay-hero">
          <span className="pp-pay-label">Investimento total à vista</span>
          <span className="pp-pay-value">{money(proposal.valor_total || 0)}</span>
          <span className="pp-pay-sub">Economia projetada em 25 anos: {money(economia25)}</span>
        </div>

        {showItems ? (
          <>
            <h3 className="pp-h3">Composição do investimento</h3>
            <table className="pp-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: 90 }}>Qtd</th>
                  <th style={{ width: 110, textAlign: "right" }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td style={{ textAlign: "right" }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        {financing.length ? (
          <>
            <h3 className="pp-h3">Opções de financiamento</h3>
            <div className="pp-fin-grid">
              {financing.slice(0, 4).map((f) => (
                <div key={f.id} className="pp-fin-card">
                  <span className="pp-fin-bank">{f.banco}</span>
                  <span className="pp-fin-value">
                    {f.prazo_meses}x {money(f.valor_parcela || 0)}
                  </span>
                  <span className="pp-fin-sub">
                    Total: {money(((f.valor_parcela || 0) * (f.prazo_meses || 0)) + (f.entrada || 0))}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="pp-two-col" style={{ marginTop: 14 }}>
          <div>
            <h3 className="pp-h3">Garantias e prazos</h3>
            <div className="pp-info">
              <InfoRow label="Módulos" value={`${proposal.garantia_modulo_anos || 25} anos`} />
              <InfoRow label="Inversor" value={`${proposal.garantia_inversor_anos || 10} anos`} />
              <InfoRow label="Instalação" value={`${proposal.garantia_instalacao_anos || 1} ano`} />
              <InfoRow label="Execução" value={`${proposal.prazo_execucao_dias_uteis || 30} dias úteis`} />
              <InfoRow label="Homologação" value={`Até ${proposal.prazo_homologacao_dias || 90} dias`} />
            </div>
          </div>
          <div>
            <h3 className="pp-h3">Etapas do projeto</h3>
            <ol className="pp-timeline">
              {["Pagamento", "Projeto", "Instalação", "Homologação", "Operando"].map((step, i) => (
                <li key={step}>
                  <span className="pp-step-num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="pp-validity">Proposta válida até {shortDate(proposal.valido_ate)}</p>
          </div>
        </div>

        {proposal.observacoes_comerciais ? (
          <p className="pp-obs">
            <strong>Observações: </strong>
            {String(proposal.observacoes_comerciais).replace(/[*#_]/g, "").slice(0, 280)}
          </p>
        ) : null}

        <div className="pp-sign">
          <div>
            <span className="pp-sign-line" />
            <span className="pp-sign-label">{client?.nome || "Cliente"}</span>
          </div>
          <div>
            <span className="pp-sign-line" />
            <span className="pp-sign-label">{brandName}</span>
          </div>
        </div>

        <PageFooter company={company} pageNumber={3} totalPages={3} />
      </section>
    </div>
  );
}

function PageHeader({ logo, brandName }: { logo: string; brandName: string }) {
  return (
    <header className="pp-head">
      <img src={logo} alt={brandName} className="pp-head-logo" />
      <span className="pp-head-rule" />
    </header>
  );
}

function PageFooter({ company, pageNumber, totalPages }: { company: any; pageNumber: number; totalPages: number }) {
  return (
    <footer className="pp-foot">
      <span>
        {company?.email || "energizasolar@gmail.com"} · {company?.telefone || "(38) 9895-9015"}
      </span>
      <span>
        {pageNumber}/{totalPages}
      </span>
    </footer>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="pp-kpi">
      <span className="pp-kpi-label">{label}</span>
      <span className="pp-kpi-value">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="pp-info-row">
      <span className="pp-info-label">{label}</span>
      <span className="pp-info-value">{value}</span>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="pp-meta-col">
      <span className="pp-card-label">{label}</span>
      <span className="pp-cover-meta-value">{value}</span>
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: COLORS.navy,
  background: "#F8FAFC",
};

const css = `
.proposal-printable * { box-sizing: border-box; }
.proposal-printable { font-size: 11px; line-height: 1.5; }
.pp-page {
  width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 16mm;
  background: ${COLORS.white}; position: relative; page-break-after: always;
  break-after: page; overflow: hidden;
}
.pp-page:last-of-type { page-break-after: auto; break-after: auto; }

/* ===== COVER ===== */
.pp-cover { padding: 0; color: ${COLORS.white}; }
.pp-cover-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, ${COLORS.greenDark} 0%, #064E3B 60%, ${COLORS.navy} 100%);
}
.pp-cover-wave {
  position: absolute; left: 0; right: 0; bottom: 0; height: 35%;
  background: radial-gradient(ellipse at 20% 100%, ${COLORS.green}55 0%, transparent 60%);
}
.pp-cover-wave2 {
  position: absolute; left: 0; right: 0; bottom: 0; height: 22%;
  background: radial-gradient(ellipse at 80% 100%, ${COLORS.yellow}33 0%, transparent 55%);
}
.pp-cover-header {
  position: relative; z-index: 1;
  padding: 16mm 16mm 0; display: flex; align-items: center; justify-content: space-between;
}
.pp-cover-logo-chip {
  background: ${COLORS.white}; border-radius: 10px; padding: 8px 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}
.pp-cover-logo-chip img { height: 38px; display: block; }
.pp-cover-tag { color: #BBF7D0; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; }

.pp-cover-body { position: relative; z-index: 1; padding: 22mm 16mm 0; }
.pp-eyebrow { color: #BBF7D0; font-size: 11px; letter-spacing: 4px; font-weight: 600; }
.pp-cover-title {
  margin: 14px 0 0; color: ${COLORS.white}; font-weight: 800;
  font-size: 38px; line-height: 1.12; letter-spacing: -0.5px;
}
.pp-cover-divider { display: block; width: 64px; height: 4px; background: ${COLORS.yellow}; margin: 16px 0 12px; border-radius: 2px; }
.pp-cover-number { color: ${COLORS.white}; font-size: 14px; font-weight: 600; }

.pp-cover-card {
  position: absolute; left: 16mm; right: 16mm; bottom: 16mm; z-index: 2;
  background: ${COLORS.white}; color: ${COLORS.navy};
  border-radius: 16px; padding: 22px 24px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.25);
}
.pp-card-label { color: ${COLORS.slate}; font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; font-weight: 600; }
.pp-cover-client { margin: 4px 0 14px; font-size: 22px; font-weight: 800; color: ${COLORS.navy}; }
.pp-cover-meta {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
  padding-top: 14px; border-top: 1px solid ${COLORS.border};
}
.pp-meta-col { display: flex; flex-direction: column; gap: 3px; }
.pp-cover-meta-value { color: ${COLORS.navy}; font-size: 11px; font-weight: 600; }
.pp-cover-seller { margin-top: 14px; padding-top: 12px; border-top: 1px solid ${COLORS.border}; display: flex; flex-direction: column; gap: 3px; }

/* ===== HEADER / FOOTER conteúdo ===== */
.pp-head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.pp-head-logo { height: 28px; }
.pp-head-rule { flex: 1; height: 2px; background: linear-gradient(90deg, ${COLORS.green}, ${COLORS.yellow}); border-radius: 2px; }
.pp-foot {
  position: absolute; left: 16mm; right: 16mm; bottom: 10mm;
  display: flex; justify-content: space-between; color: ${COLORS.slate}; font-size: 9px;
  padding-top: 8px; border-top: 1px solid ${COLORS.border};
}

/* ===== TIPOGRAFIA ===== */
.pp-h1 { font-size: 22px; font-weight: 800; color: ${COLORS.navy}; margin: 4px 0 8px; letter-spacing: -0.3px; }
.pp-h3 { font-size: 11px; font-weight: 700; color: ${COLORS.navy}; margin: 12px 0 8px; text-transform: uppercase; letter-spacing: 0.6px; }
.pp-lead { font-size: 11.5px; color: ${COLORS.navy}; margin: 0 0 14px; line-height: 1.6; }

/* ===== KPIs ===== */
.pp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 4px 0 14px; }
.pp-kpi {
  background: linear-gradient(135deg, ${COLORS.greenSoft}, #F0FDF4);
  border: 1px solid #BBF7D0; border-radius: 10px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 4px;
}
.pp-kpi-label { font-size: 9px; color: ${COLORS.greenDark}; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
.pp-kpi-value { font-size: 16px; font-weight: 800; color: ${COLORS.navy}; }

/* ===== TWO COL + INFO ===== */
.pp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.pp-info { background: ${COLORS.slateSoft}; border-radius: 10px; padding: 4px 12px; }
.pp-info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid ${COLORS.border}; font-size: 10px; }
.pp-info-row:last-child { border-bottom: none; }
.pp-info-label { color: ${COLORS.slate}; }
.pp-info-value { color: ${COLORS.navy}; font-weight: 600; }

/* ===== BULLETS ===== */
.pp-bullets { list-style: none; margin: 0; padding: 12px; background: ${COLORS.slateSoft}; border-radius: 10px; }
.pp-bullets li { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 10px; color: ${COLORS.navy}; }
.pp-bullet-dot { width: 6px; height: 6px; border-radius: 50%; background: ${COLORS.green}; flex-shrink: 0; }
.pp-bullet-text { flex: 1; }
.pp-bullet-qty { color: ${COLORS.slate}; font-size: 9px; font-weight: 600; }

/* ===== CHART ===== */
.pp-chart {
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 6px;
  align-items: end; height: 130px; padding: 6px 4px 18px;
  border-bottom: 1px solid ${COLORS.border};
}
.pp-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pp-bar {
  width: 18px; background: linear-gradient(180deg, ${COLORS.green}, ${COLORS.greenDark});
  border-radius: 3px 3px 0 0; min-height: 6px;
}
.pp-bar-label { font-size: 8px; color: ${COLORS.slate}; }

/* ===== PAGAMENTO ===== */
.pp-pay-hero {
  background: linear-gradient(135deg, ${COLORS.greenDark}, ${COLORS.navy});
  color: ${COLORS.white}; border-radius: 14px; padding: 22px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  margin-bottom: 14px; position: relative; overflow: hidden;
}
.pp-pay-hero::after {
  content: ""; position: absolute; right: -40px; top: -40px; width: 160px; height: 160px;
  background: radial-gradient(circle, ${COLORS.yellow}55, transparent 70%);
}
.pp-pay-label { color: #BBF7D0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600; }
.pp-pay-value { color: ${COLORS.white}; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
.pp-pay-sub { color: #BBF7D0; font-size: 10px; }

/* ===== TABLE ===== */
.pp-table { width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid ${COLORS.border}; }
.pp-table thead { background: ${COLORS.navy}; }
.pp-table th { color: ${COLORS.white}; font-size: 9px; font-weight: 700; padding: 8px 10px; text-align: left; text-transform: uppercase; letter-spacing: 0.6px; }
.pp-table td { padding: 8px 10px; font-size: 10px; color: ${COLORS.navy}; border-top: 1px solid ${COLORS.border}; }
.pp-table tbody tr:nth-child(even) td { background: ${COLORS.slateSoft}; }

/* ===== FINANCING ===== */
.pp-fin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.pp-fin-card { border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 10px 12px; background: ${COLORS.white}; display: flex; flex-direction: column; gap: 2px; }
.pp-fin-bank { font-weight: 700; color: ${COLORS.navy}; font-size: 10px; }
.pp-fin-value { color: ${COLORS.greenDark}; font-weight: 800; font-size: 13px; }
.pp-fin-sub { color: ${COLORS.slate}; font-size: 9px; }

/* ===== TIMELINE ===== */
.pp-timeline { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 5px; }
.pp-timeline li {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px;
  background: ${COLORS.slateSoft}; border-radius: 8px; font-size: 10px; color: ${COLORS.navy}; font-weight: 600;
}
.pp-step-num {
  width: 22px; height: 22px; border-radius: 50%; background: ${COLORS.green}; color: ${COLORS.white};
  display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;
}
.pp-validity { font-size: 9px; color: ${COLORS.slate}; margin-top: 8px; }

.pp-obs { font-size: 9px; color: ${COLORS.slate}; line-height: 1.6; margin-top: 12px; padding: 10px 12px; background: ${COLORS.slateSoft}; border-radius: 8px; border-left: 3px solid ${COLORS.green}; }
.pp-obs strong { color: ${COLORS.navy}; }

/* ===== ASSINATURA ===== */
.pp-sign { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 22px; }
.pp-sign > div { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pp-sign-line { display: block; width: 100%; height: 1px; background: ${COLORS.navy}; margin-top: 22px; }
.pp-sign-label { font-size: 9px; color: ${COLORS.slate}; }
`;
