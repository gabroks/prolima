import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Variation {
  pct: number;
  direction: "up" | "down" | "neutral";
}

function VariationBadge({ v, invertColor = false }: { v: Variation; invertColor?: boolean }) {
  const isPositive = invertColor ? v.direction === "down" : v.direction === "up";
  const Icon = v.direction === "up" ? ArrowUpRight : v.direction === "down" ? ArrowDownRight : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
      v.direction === "neutral" ? "text-muted-foreground" : isPositive ? "text-primary" : "text-destructive"
    }`}>
      <Icon className="h-3 w-3" />
      {v.pct}%
    </span>
  );
}

export interface KPI {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  variation: Variation;
  invertColor?: boolean;
}

export function ReportKPICards({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map(k => (
        <Card key={k.label} className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</span>
            </div>
            <VariationBadge v={k.variation} invertColor={k.invertColor} />
          </div>
          <p className="text-lg font-bold tabular-nums">{k.value}</p>
        </Card>
      ))}
    </div>
  );
}
