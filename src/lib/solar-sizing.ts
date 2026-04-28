export type SolarInputs = {
  contaLuzMedia: number;
  tarifaKwh: number;
  custoDisponibilidade: number;
  hsp: number;
  performanceRatio: number;
  metaCompensacao: number;
};

export type SolarSizing = {
  consumoEstimadoKwh: number;
  energiaACompensarKwh: number;
  kWpNecessario: number;
  geracaoMensalKwh: number;
  geracaoAnualKwh: number;
};

function safePositive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateSolarSizing(input: SolarInputs): SolarSizing {
  const contaLuzMedia = safePositive(input.contaLuzMedia);
  const tarifaKwh = safePositive(input.tarifaKwh);
  const hsp = safePositive(input.hsp);
  const performanceRatio = safePositive(input.performanceRatio);
  const consumoEstimadoKwh = tarifaKwh > 0 ? contaLuzMedia / tarifaKwh : 0;
  const energiaACompensarKwh = Math.max(consumoEstimadoKwh - safePositive(input.custoDisponibilidade), 0) * safePositive(input.metaCompensacao);
  const energiaDiaria = energiaACompensarKwh / 30;
  const kWpNecessario = hsp > 0 && performanceRatio > 0 ? energiaDiaria / (hsp * performanceRatio) : 0;
  const geracaoMensalKwh = kWpNecessario * hsp * 30 * performanceRatio;
  const geracaoAnualKwh = geracaoMensalKwh * 12;
  return { consumoEstimadoKwh, energiaACompensarKwh, kWpNecessario, geracaoMensalKwh, geracaoAnualKwh };
}

export function useSolarSizing(input: SolarInputs) {
  return calculateSolarSizing(input);
}
