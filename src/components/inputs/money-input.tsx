import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type MoneyInputProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  label?: string;
  decimals?: number;
  placeholder?: string;
};

function formatCurrency(value: number | null | undefined, decimals: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function parseCurrency(value: string, decimals: number) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 10 ** decimals;
}

export function MoneyInput<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  decimals = 2,
  placeholder = "R$ 0,00",
}: MoneyInputProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            <Input
              inputMode="decimal"
              placeholder={placeholder}
              value={formatCurrency(Number(field.value ?? 0), decimals)}
              onChange={(event) => field.onChange(parseCurrency(event.target.value, decimals))}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
