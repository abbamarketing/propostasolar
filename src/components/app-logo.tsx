import { cn } from "@/lib/utils";
import energizaSolarLogo from "@/assets/energiza-solar-logo.png";

type AppLogoProps = {
  inverse?: boolean;
};

export function AppLogo({ inverse = true }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", inverse && "rounded-lg bg-background/95 p-2 shadow-soft")}>
      <img
        src={energizaSolarLogo}
        alt="Energiza Solar"
        className="h-12 w-auto object-contain"
      />
    </div>
  );
}
