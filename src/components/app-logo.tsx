import { cn } from "@/lib/utils";
import energizaSolarLogo from "@/assets/energiza-solar-logo.png";

type AppLogoProps = {
  inverse?: boolean;
};

export function AppLogo({ inverse = true }: AppLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={energizaSolarLogo}
        alt="Energiza Solar"
        className={cn("h-12 w-auto object-contain", inverse ? "brightness-0 invert" : "")}
      />
    </div>
  );
}
