import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export interface SummaryCardItem {
  label: string;
  value: string;
  icon: LucideIcon;
  bgColor?: string;
  iconColor?: string;
  extra?: string | null;
}

interface SummaryCardsProps {
  items: SummaryCardItem[];
  columns?: number;
}

export function SummaryCards({ items, columns = 4 }: SummaryCardsProps) {
  const gridCols = columns === 3 ? "grid-cols-1 sm:grid-cols-3" : columns === 5 ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {items.map((s) => (
        <Card key={s.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${s.bgColor || "bg-primary/10"} flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.iconColor || "text-primary"}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
              {s.extra && (
                <p className="text-[10px] text-muted-foreground truncate">{s.extra}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
