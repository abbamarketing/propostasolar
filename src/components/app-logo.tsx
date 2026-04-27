import { SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  inverse?: boolean;
};

export function AppLogo({ inverse = true }: AppLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-solar text-solar-foreground shadow-soft">
        <SunMedium className="h-6 w-6" />
      </div>
      <div className="leading-tight">
        <p className={cn("font-display text-sm font-black tracking-wide", inverse ? "text-sidebar-foreground" : "text-foreground")}>ENERGIZA</p>
        <p className="font-display text-sm font-black tracking-wide text-primary">SOLLAR</p>
      </div>
    </div>
  );
}
