import * as React from "react";
import { Input } from "@/components/ui/input";

type MaskedInputProps = Omit<React.ComponentProps<typeof Input>, "onChange"> & {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function applyMask(value: string, pattern: string) {
  const digits = onlyDigits(value);
  let result = "";
  let index = 0;

  for (const char of pattern) {
    if (char === "0") {
      if (!digits[index]) break;
      result += digits[index];
      index += 1;
    } else if (digits[index]) {
      result += char;
    }
  }

  return result;
}

function createMaskedInput(pattern: string, maxLength: number) {
  return React.forwardRef<HTMLInputElement, MaskedInputProps>(({ value, onChange, ...props }, ref) => {
    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      event.target.value = applyMask(event.target.value.slice(0, maxLength), pattern);
      onChange?.(event);
    }

    return <Input ref={ref} value={typeof value === "string" ? applyMask(value, pattern) : value} onChange={handleChange} {...props} />;
  });
}

export const CnpjInput = createMaskedInput("00.000.000/0000-00", 18);
export const CpfInput = createMaskedInput("000.000.000-00", 14);
export const PhoneInput = createMaskedInput("(00) 00000-0000", 15);
export const CepInput = createMaskedInput("00000-000", 9);

CnpjInput.displayName = "CnpjInput";
CpfInput.displayName = "CpfInput";
PhoneInput.displayName = "PhoneInput";
CepInput.displayName = "CepInput";
