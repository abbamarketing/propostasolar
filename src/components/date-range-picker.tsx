import { addDays, endOfMonth, endOfYear, format, startOfMonth, startOfYear, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "@/hooks/use-proposals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const quickRanges = [
  { label: "Hoje", get: () => ({ from: new Date(), to: new Date() }) },
  { label: "Últimos 7 dias", get: () => ({ from: addDays(new Date(), -6), to: new Date() }) },
  { label: "Este mês", get: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mês passado", get: () => { const d = subMonths(new Date(), 1); return { from: startOfMonth(d), to: endOfMonth(d) }; } },
  { label: "Este ano", get: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];

export function defaultMonthRange(): DateRange {
  return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
}

export function DateRangePicker({ value, onChange, className }: { value: DateRange; onChange: (range: DateRange) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const label = `${format(value.from, "dd/MM", { locale: ptBR })} – ${format(value.to, "dd/MM/yyyy", { locale: ptBR })}`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-start text-left font-normal", className)} aria-label="Selecionar período">
          <CalendarIcon className="h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="grid gap-0 md:grid-cols-[160px_1fr]">
          <div className="border-b p-2 md:border-b-0 md:border-r">
            {quickRanges.map((range) => (
              <Button key={range.label} variant="ghost" className="w-full justify-start" onClick={() => { onChange(range.get()); setOpen(false); }}>
                {range.label}
              </Button>
            ))}
            <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">Personalizado</div>
          </div>
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(range) => range?.from && onChange({ from: range.from, to: range.to ?? range.from })}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
