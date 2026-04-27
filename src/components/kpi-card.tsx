import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  icon: LucideIcon;
  value: React.ReactNode;
  subtitle: string;
  trend?: string;
};

export function KpiCard({ title, icon: Icon, value, subtitle, trend }: KpiCardProps) {
  return (
    <Card className="group border-border/80 bg-card shadow-soft transition-transform duration-300 hover:-translate-y-1 hover:shadow-panel">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="font-display text-3xl font-black tracking-normal text-foreground">{value}</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{subtitle}</span>
          {trend ? (
            <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary")}>
              <ArrowUpRight className="h-3.5 w-3.5" />
              {trend}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
