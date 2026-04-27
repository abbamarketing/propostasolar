import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type NumericValueProps = {
  value: number;
};

type DateBRProps = {
  value: Date;
};

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function Money({ value }: NumericValueProps) {
  return <>{brlFormatter.format(value)}</>;
}

export function Percent({ value }: NumericValueProps) {
  return <>{percentFormatter.format(value)}</>;
}

export function DateBR({ value }: DateBRProps) {
  return <>{format(value, "dd/MM/yyyy", { locale: ptBR })}</>;
}
