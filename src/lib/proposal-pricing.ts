export type OtherCost = { descricao: string; valor: number };

export type PricingInputs = {
  modulo: { qtd: number; preco: number };
  inversor: { qtd: number; preco: number };
  custoEstrutura: number;
  custoCabosProtecoes: number;
  custoProjetoArt: number;
  custoMaoObra: number;
  outrosCustos: OtherCost[];
  margemPct: number;
};

export type PricingResult = {
  custoEquipamentos: number;
  custoOutros: number;
  custoTotal: number;
  valorMargem: number;
  valorFinal: number;
};

export type FinancialInputs = {
  valorInvestimento: number;
  geracaoMensalKwh: number;
  tarifaKwh: number;
  custoDisponibilidadeKwh: number;
  reajusteTarifaAnualPct: number;
  taxaDescontoAnualPct: number;
  vidaUtilAnos: number;
};

export type FinancialResult = {
  economiaMensal: number;
  economiaAnual: number;
  paybackSimples: number;
  paybackDescontado: number;
  co2EvitadoKgAno: number;
  economia25Anos: number;
};

function finite(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function calculatePricing(input: PricingInputs): PricingResult {
  const custoEquipamentos = finite(input.modulo.qtd) * finite(input.modulo.preco) + finite(input.inversor.qtd) * finite(input.inversor.preco);
  const custoOutros = input.outrosCustos.reduce((sum, item) => sum + finite(item.valor), 0);
  const custoTotal = custoEquipamentos + finite(input.custoEstrutura) + finite(input.custoCabosProtecoes) + finite(input.custoProjetoArt) + finite(input.custoMaoObra) + custoOutros;
  const valorMargem = custoTotal * finite(input.margemPct);
  const valorFinal = custoTotal + valorMargem;
  return { custoEquipamentos, custoOutros, custoTotal, valorMargem, valorFinal };
}

export function calculateFinancialAnalysis(input: FinancialInputs): FinancialResult {
  const energiaCompensavelMensal = Math.max(finite(input.geracaoMensalKwh) - finite(input.custoDisponibilidadeKwh), 0);
  const economiaMensal = energiaCompensavelMensal * finite(input.tarifaKwh);
  const economiaAnual = economiaMensal * 12;
  const paybackSimples = economiaAnual > 0 ? finite(input.valorInvestimento) / economiaAnual : 0;
  let acumulado = 0;
  let paybackDescontado = finite(input.vidaUtilAnos);
  for (let ano = 1; ano <= input.vidaUtilAnos; ano += 1) {
    const tarifaAno = finite(input.tarifaKwh) * Math.pow(1 + finite(input.reajusteTarifaAnualPct), ano);
    const economiaAno = energiaCompensavelMensal * 12 * tarifaAno;
    const valorPresente = economiaAno / Math.pow(1 + finite(input.taxaDescontoAnualPct), ano);
    acumulado += valorPresente;
    if (acumulado >= finite(input.valorInvestimento) && paybackDescontado === input.vidaUtilAnos) {
      const anterior = acumulado - valorPresente;
      paybackDescontado = ano - 1 + (finite(input.valorInvestimento) - anterior) / valorPresente;
    }
  }
  const co2EvitadoKgAno = finite(input.geracaoMensalKwh) * 12 * 0.084;
  return { economiaMensal, economiaAnual, paybackSimples, paybackDescontado, co2EvitadoKgAno, economia25Anos: acumulado };
}

export function calculatePmt(valorTotal: number, entrada: number, taxaMensalPct: number, prazoMeses: number) {
  const valorFinanciado = Math.max(finite(valorTotal) - finite(entrada), 0);
  const taxa = finite(taxaMensalPct) / 100;
  if (prazoMeses <= 0) return { valorFinanciado, valorParcela: 0, totalPago: finite(entrada), custoFinanciamento: 0 };
  const valorParcela = taxa > 0 ? (valorFinanciado * taxa) / (1 - Math.pow(1 + taxa, -prazoMeses)) : valorFinanciado / prazoMeses;
  const totalPago = valorParcela * prazoMeses + finite(entrada);
  return { valorFinanciado, valorParcela, totalPago, custoFinanciamento: totalPago - finite(valorTotal) };
}

export function defaultCableCost(kwp: number) {
  if (kwp <= 5) return 1200;
  if (kwp <= 10) return 1800;
  if (kwp <= 25) return 3500;
  if (kwp <= 75) return 7000;
  return 12000;
}

export function defaultProjectCost(kwp: number) {
  if (kwp <= 5) return 800;
  if (kwp <= 25) return 1500;
  if (kwp <= 75) return 3000;
  return 6000;
}

export function useProposalPricing(input: PricingInputs) {
  return calculatePricing(input);
}

export function useFinancialAnalysis(input: FinancialInputs) {
  return calculateFinancialAnalysis(input);
}
