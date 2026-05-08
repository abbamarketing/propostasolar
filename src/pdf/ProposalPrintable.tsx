import type { ProposalPdfData } from "./types";
import logoUrl from "@/assets/energiza-solar-logo.png";

/**
 * Proposta comercial Energiza Solar — 4 páginas A4.
 * Tipografia + hierarquia, sem ícones decorativos, sem zebra, sem badges.
 */

const money = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
const num = (v: number, d = 0) => (Number(v) || 0).toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d });
const shortDate = (v?: string | null) => (v ? new Date(`${v}T12:00:00`).toLocaleDateString("pt-BR") : "—");
const projecao25 = (gastoMensal: number) => {
  let total = 0;
  for (let i = 1; i <= 25; i++) total += gastoMensal * 12 * Math.pow(1.08, i - 1);
  return total;
};
const economia25 = (anual: number) => {
  let total = 0;
  for (let i = 1; i <= 25; i++) total += anual * Math.pow(1.08, i - 1);
  return total;
};

export function ProposalPrintable({ data }: { data: ProposalPdfData }) {
  const { proposal, client, company, seller, items, financing } = data;
  const fechado = Boolean(proposal.valor_fechado_modo);

  const logo = company?.logo_url || logoUrl;
  const numero = proposal.numero || "—";
  const clienteNome = client?.nome || "Cliente";
  const cidadeUf = `${proposal.cidade_projeto || client?.endereco_cidade || "—"}/${proposal.uf_projeto || client?.endereco_uf || ""}`;
  const emissao = shortDate(new Date().toISOString().slice(0, 10));
  const validade = shortDate(proposal.valido_ate);
  const vendedor = seller?.nome || "Equipe comercial";
  const contatoVendedor = seller?.telefone || seller?.email || company?.telefone || "(38) 9895-9015";

  const contaLuz = client?.conta_luz_media || 0;
  const consumo = proposal.consumo_estimado_kwh || 0;
  const concessionaria = client?.concessionaria || "—";
  const ligacao = client?.tipo_ligacao || proposal.tipo_ligacao || "—";
  const tarifa = proposal.tarifa_kwh || 0;
  const projecao = projecao25(contaLuz);

  const kwp = proposal.kwp_instalado || 0;
  const geracao = proposal.geracao_estimada_mensal || 0;
  const economiaMensal = proposal.economia_mensal || 0;
  const economiaAnual = proposal.economia_anual || economiaMensal * 12;
  const payback = proposal.payback_anos || 0;
  const paybackDesc = proposal.payback_descontado_anos || payback;
  const econ25 = economia25(economiaAnual);

  const equipamentos: Array<[string, string, string]> = items && items.length > 0
    ? items.map((it) => [String(it.descricao ?? ""), `${num(Number(it.quantidade) || 0)} ${it.unidade ?? ""}`.trim(), money(Number(it.valor_total) || 0)])
    : [
        [
          `Módulo ${proposal.modulo_marca || ""} ${proposal.modulo_modelo || ""} ${proposal.modulo_potencia_w ? `${proposal.modulo_potencia_w}W` : ""}`.trim() || "Módulo fotovoltaico",
          `${proposal.qtd_modulos || 0} un`,
          fechado ? "—" : money(proposal.custo_modulos || 0),
        ],
        [
          `Inversor ${proposal.inversor_marca || ""} ${proposal.inversor_modelo || ""} ${proposal.inversor_potencia_kw ? `${proposal.inversor_potencia_kw}kW` : ""}`.trim() || "Inversor",
          `${proposal.qtd_inversores || 1} un`,
          fechado ? "—" : money(proposal.custo_inversor || 0),
        ],
        ["Estrutura de fixação", `${proposal.qtd_modulos || 0} placas`, fechado ? "—" : money(proposal.custo_estrutura || 0)],
        ["Cabos, conectores e proteções", "1 conjunto", fechado ? "—" : money(proposal.custo_cabos_protecoes || 0)],
        ["Projeto técnico e ART", "1 serviço", fechado ? "—" : money(proposal.custo_projeto_art || 0)],
        ["Instalação e comissionamento", "1 serviço", fechado ? "—" : money(proposal.custo_mao_obra || 0)],
      ];

  const valorTotal = proposal.valor_total || 0;
  const fin = financing?.[0];
  const entrada = fin?.entrada || 0;
  const prazo = fin?.prazo_meses || 0;
  const parcela = fin?.valor_parcela || 0;
  const saldo = Math.max(valorTotal - entrada, 0);

  return (
    <div id="proposta-pdf" className="proposta-root">
      <style>{css}</style>

      {/* ===== PÁGINA 1 — CAPA ===== */}
      <section className="page page-cover">
        <div className="cover-top">
          <img src={logo} alt="Energiza Solar" className="cover-logo" />
          <div className="cover-eyebrow">PROPOSTA COMERCIAL</div>
          <div className="cover-numero">Nº {numero}</div>
        </div>

        <div className="cover-mid">
          <div className="cover-mid-label">PREPARADA PARA</div>
          <h1 className="cover-cliente">{clienteNome}</h1>
          <div className="cover-cidade">{cidadeUf}</div>
        </div>

        <div className="cover-bot">
          <div className="cover-grid">
            <div>
              <div className="cover-meta-label">EMISSÃO</div>
              <div className="cover-meta-value">{emissao}</div>
            </div>
            <div>
              <div className="cover-meta-label">VENDEDOR RESPONSÁVEL</div>
              <div className="cover-meta-value">{vendedor}</div>
            </div>
            <div>
              <div className="cover-meta-label">VALIDADE</div>
              <div className="cover-meta-value">{validade}</div>
            </div>
            <div>
              <div className="cover-meta-label">CONTATO</div>
              <div className="cover-meta-value">{contatoVendedor}</div>
            </div>
          </div>
        </div>

        <div className="cover-stripe" />
      </section>

      {/* ===== PÁGINA 2 — DIAGNÓSTICO + SISTEMA ===== */}
      <section className="page">
        <PageHeader logo={logo} numero={numero} cliente={clienteNome} />

        <h2 className="h1">Sua situação atual de energia</h2>
        <div className="diag-grid">
          <Field label="Conta de luz mensal" value={money(contaLuz)} />
          <Field label="Consumo estimado" value={`${num(consumo)} kWh`} />
          <Field label="Concessionária" value={concessionaria} />
          <Field label="Tipo de ligação" value={String(ligacao)} />
          <Field label="Tarifa aplicada" value={`${money(tarifa)}/kWh`} />
        </div>

        <div className="quote-block">
          Sem energia solar, em 25 anos com reajustes médios de 8% a.a., o gasto projetado seria de
          {" "}<strong className="quote-value">{money(projecao)}</strong>.
        </div>

        <h2 className="h1" style={{ marginTop: 14 }}>O sistema dimensionado para você</h2>
        <div className="kpi-grid">
          <Kpi label="Potência" value={`${num(kwp, 2)} kWp`} />
          <Kpi label="Geração mensal" value={`${num(geracao)} kWh`} />
          <Kpi label="Economia mensal" value={money(economiaMensal)} />
          <Kpi label="Payback" value={`${num(payback, 1)} anos`} />
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ width: "22%" }}>Qtd.</th>
              <th style={{ width: "24%", textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {equipamentos.map((row, i) => (
              <tr key={i}>
                <td>{row[0]}</td>
                <td>{row[1]}</td>
                <td style={{ textAlign: "right" }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <PageFooter />
      </section>

      {/* ===== PÁGINA 3 — ECONOMIA + INVESTIMENTO ===== */}
      <section className="page">
        <PageHeader logo={logo} numero={numero} cliente={clienteNome} />

        <h2 className="h1">Quanto você vai economizar</h2>
        <div className="hero-num">
          <div className="hero-num-label">ECONOMIA ESTIMADA EM 25 ANOS</div>
          <div className="hero-num-value">{money(econ25)}</div>
        </div>

        <table className="data-table">
          <tbody>
            <tr><td>Economia mensal</td><td style={{ textAlign: "right" }}>{money(economiaMensal)}</td></tr>
            <tr><td>Economia anual</td><td style={{ textAlign: "right" }}>{money(economiaAnual)}</td></tr>
            <tr><td>Payback simples</td><td style={{ textAlign: "right" }}>{num(payback, 1)} anos</td></tr>
            <tr><td>Payback descontado</td><td style={{ textAlign: "right" }}>{num(paybackDesc, 1)} anos</td></tr>
          </tbody>
        </table>

        <p className="caption">
          A partir do {Math.ceil(payback)}º ano, o sistema passa a gerar economia líquida.
        </p>

        <h2 className="h1" style={{ marginTop: 18 }}>Como pagar</h2>
        <div className="invest-card">
          <div className="invest-label">INVESTIMENTO TOTAL</div>
          <div className="invest-value">{money(valorTotal)}</div>
          <div className="invest-divider" />
          <div className="invest-line">
            {prazo > 0 ? (
              <>Entrada {money(entrada)} · Saldo {money(saldo)} em {prazo}× {money(parcela)}{fin?.banco ? ` · ${fin.banco}` : ""}</>
            ) : (
              <>Pagamento à vista · {money(valorTotal)}</>
            )}
          </div>
        </div>

        <PageFooter />
      </section>

      {/* ===== PÁGINA 4 — GARANTIAS, EXECUÇÃO, FECHAMENTO ===== */}
      <section className="page page-last">
        <PageHeader logo={logo} numero={numero} cliente={clienteNome} />

        <h2 className="h1">Garantias e prazos</h2>
        <table className="data-table">
          <thead>
            <tr><th>Item</th><th style={{ width: "40%", textAlign: "right" }}>Prazo</th></tr>
          </thead>
          <tbody>
            <tr><td>Módulo solar</td><td style={{ textAlign: "right" }}>{proposal.garantia_modulo_anos || 25} anos</td></tr>
            <tr><td>Inversor</td><td style={{ textAlign: "right" }}>{proposal.garantia_inversor_anos || 10} anos</td></tr>
            <tr><td>Instalação</td><td style={{ textAlign: "right" }}>{proposal.garantia_instalacao_anos || 1} ano</td></tr>
            <tr><td>Execução</td><td style={{ textAlign: "right" }}>{proposal.prazo_execucao_dias_uteis || 30} dias úteis</td></tr>
            <tr><td>Homologação</td><td style={{ textAlign: "right" }}>até {proposal.prazo_homologacao_dias || 90} dias</td></tr>
          </tbody>
        </table>

        <h2 className="h1" style={{ marginTop: 18 }}>Fluxo de execução</h2>
        <div className="steps">
          {["Pagamento", "Projeto", "Instalação", "Homologação", "Sistema operando"].map((s, i, arr) => (
            <div key={s} className="step">
              <div className="step-row">
                <div className="step-num">{i + 1}</div>
                {i < arr.length - 1 ? <div className="step-line" /> : null}
              </div>
              <div className="step-label">{s}</div>
            </div>
          ))}
        </div>

        <div className="validity-block">
          Esta proposta é válida até {validade}. Após esta data, valores podem sofrer alteração devido a flutuações cambiais e tarifárias.
        </div>

        <div className="institutional">
          <div className="inst-name">ENERGIZA SOLAR LTDA</div>
          <div className="inst-line">CNPJ 66.050.090/0001-33</div>
          {company?.endereco ? <div className="inst-line">{company.endereco}</div> : null}
          <div className="inst-line">energizasollar@gmail.com · (38) 9895-9015</div>
        </div>

        <PageFooter />
      </section>
    </div>
  );
}

function PageHeader({ logo, numero, cliente }: { logo: string; numero: string; cliente: string }) {
  return (
    <header className="page-head">
      <img src={logo} alt="Energiza Solar" className="head-logo" />
      <div className="head-meta">Nº {numero} · {cliente}</div>
    </header>
  );
}

function PageFooter() {
  return (
    <footer className="page-foot">
      CNPJ 66.050.090/0001-33 · energizasollar@gmail.com · (38) 9895-9015
    </footer>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

const css = `
.proposta-root, .proposta-root * { box-sizing: border-box; }
.proposta-root {
  --brand-primary: #F59E0B;
  --brand-primary-dark: #B45309;
  --brand-accent: #0F766E;
  --ink-900: #111827;
  --ink-700: #374151;
  --ink-500: #6B7280;
  --ink-300: #D1D5DB;
  --ink-100: #F3F4F6;
  --paper: #FFFFFF;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  color: var(--ink-700);
  font-size: 11px;
  line-height: 1.45;
  background: #E5E7EB;
}

.proposta-root .page {
  width: 210mm;
  height: 297mm;
  padding: 18mm 16mm;
  background: var(--paper);
  color: var(--ink-700);
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 0 auto 16px;
  page-break-after: always;
  break-after: page;
  overflow: hidden;
}
.proposta-root .page.page-last { page-break-after: avoid; break-after: avoid; }

/* ===== HEADER / FOOTER ===== */
.page-head {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid var(--ink-300);
  padding-bottom: 10px; margin-bottom: 16px;
}
.head-logo { height: 28px; display: block; }
.head-meta { font-size: 10px; color: var(--ink-500); font-weight: 500; letter-spacing: 0.04em; }

.page-foot {
  margin-top: auto;
  border-top: 1px solid var(--ink-300);
  padding-top: 8px;
  font-size: 9.5px;
  color: var(--ink-500);
  text-align: center;
}

/* ===== TIPOGRAFIA ===== */
.proposta-root .h1 {
  font-size: 22px; font-weight: 700; color: var(--ink-900);
  margin: 0 0 12px; line-height: 1.2; letter-spacing: -0.01em;
}
.proposta-root .h2 { font-size: 16px; font-weight: 600; color: var(--ink-900); margin: 0 0 8px; line-height: 1.2; }
.caption { font-size: 11px; color: var(--ink-500); font-style: italic; margin: 8px 0 0; }

/* ===== CAPA ===== */
.page-cover { padding: 0; }
.cover-top {
  height: 35%; padding: 18mm 16mm 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
}
.cover-logo { height: 60px; display: block; }
.cover-eyebrow {
  font-size: 12px; font-weight: 500; color: var(--ink-500);
  letter-spacing: 0.2em;
}
.cover-numero { font-size: 18px; font-weight: 700; color: var(--ink-900); }

.cover-mid {
  height: 40%; background: var(--ink-100);
  padding: 28px 16mm; display: flex; flex-direction: column; justify-content: center; gap: 10px;
}
.cover-mid-label {
  font-size: 10px; font-weight: 500; color: var(--ink-500); letter-spacing: 0.15em;
}
.cover-cliente {
  margin: 0; font-size: 32px; font-weight: 700; color: var(--ink-900);
  line-height: 1.15; letter-spacing: -0.01em;
}
.cover-cidade { font-size: 14px; font-weight: 400; color: var(--ink-700); }

.cover-bot {
  height: 25%; padding: 22px 16mm 28px;
  display: flex; align-items: center;
}
.cover-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px 32px; width: 100%;
}
.cover-meta-label {
  font-size: 9.5px; font-weight: 500; color: var(--ink-500);
  letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 4px;
}
.cover-meta-value { font-size: 11.5px; font-weight: 500; color: var(--ink-900); }

.cover-stripe {
  position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--brand-primary);
}

/* ===== DIAGNÓSTICO ===== */
.diag-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 24px;
  margin-bottom: 14px;
}
.field-label {
  font-size: 9.5px; color: var(--ink-500); font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
}
.field-value { font-size: 14px; font-weight: 600; color: var(--ink-900); }

.quote-block {
  background: var(--ink-100);
  border-left: 3px solid var(--brand-accent);
  padding: 14px 16px;
  font-size: 11.5px; color: var(--ink-700);
  margin: 6px 0 0;
}
.quote-value { font-size: 18px; font-weight: 700; color: var(--ink-900); }

/* ===== KPIs ===== */
.kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  margin: 4px 0 14px;
}
.kpi { padding: 4px 0; }
.kpi-label {
  font-size: 9.5px; color: var(--ink-500); font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;
}
.kpi-value { font-size: 16px; font-weight: 700; color: var(--ink-900); }

/* ===== TABELA ===== */
.data-table {
  width: 100%; border-collapse: collapse; margin: 4px 0 0;
}
.data-table thead th {
  background: var(--ink-100); color: var(--ink-700);
  font-size: 9.5px; font-weight: 600; text-align: left;
  text-transform: uppercase; letter-spacing: 0.1em;
  padding: 8px 10px;
  border-bottom: 1px solid var(--ink-300);
}
.data-table tbody td {
  padding: 9px 10px; font-size: 11px; color: var(--ink-700);
  border-bottom: 1px solid var(--ink-300);
}
.data-table tbody tr:last-child td { border-bottom: none; }

/* ===== HERO NUM (economia) ===== */
.hero-num { text-align: center; padding: 18px 0 14px; }
.hero-num-label {
  font-size: 10px; color: var(--ink-500); font-weight: 500;
  letter-spacing: 0.15em; margin-bottom: 8px;
}
.hero-num-value { font-size: 36px; font-weight: 700; color: var(--brand-accent); line-height: 1.1; }

/* ===== INVESTIMENTO ===== */
.invest-card {
  border: 1px solid var(--ink-300); border-radius: 4px;
  padding: 20px; margin-top: 4px;
}
.invest-label {
  font-size: 10px; color: var(--ink-500); font-weight: 500;
  letter-spacing: 0.15em;
}
.invest-value { font-size: 28px; font-weight: 700; color: var(--ink-900); margin: 6px 0 12px; line-height: 1.1; }
.invest-divider { height: 1px; background: var(--ink-300); margin: 0 0 12px; }
.invest-line { font-size: 11px; color: var(--ink-700); }

/* ===== STEPS ===== */
.steps {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 0;
  margin-top: 8px;
}
.step { display: flex; flex-direction: column; align-items: stretch; }
.step-row { display: flex; align-items: center; }
.step-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--brand-primary); color: #FFFFFF;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex: 0 0 24px;
}
.step-line { flex: 1; height: 1px; background: var(--ink-300); }
.step-label { font-size: 10px; font-weight: 500; color: var(--ink-700); margin-top: 8px; }

/* ===== VALIDITY + INSTITUCIONAL ===== */
.validity-block {
  background: var(--ink-100); padding: 16px;
  font-size: 11px; color: var(--ink-700); margin-top: 18px; border-radius: 2px;
}
.institutional { margin-top: 16px; }
.inst-name { font-size: 12px; font-weight: 700; color: var(--ink-900); margin-bottom: 4px; }
.inst-line { font-size: 10px; color: var(--ink-700); line-height: 1.5; }
`;
