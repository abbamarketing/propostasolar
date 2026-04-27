import type { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b bg-background/80 px-4 py-5 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Home className="h-3.5 w-3.5" />
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{title}</span>
        </div>
        <h1 className="font-display text-2xl font-black tracking-normal text-foreground md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
