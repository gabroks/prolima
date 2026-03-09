import { Button } from "@/components/ui/button";
import { CalendarRange } from "lucide-react";

export type DashboardPeriod = "month" | "quarter" | "year" | "all";

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: "month", label: "Mês" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "Ano" },
  { key: "all", label: "Tudo" },
];

export function getDateRangeForPeriod(period: DashboardPeriod): { from: Date | null; to: Date } {
  const now = new Date();
  const to = now;
  switch (period) {
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to };
    case "quarter":
      return { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to };
    case "all":
      return { from: null, to };
  }
}

interface Props {
  active: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
}

export function DashboardPeriodFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <CalendarRange className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            variant={active === p.key ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => onChange(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
