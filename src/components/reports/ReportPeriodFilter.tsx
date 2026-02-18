import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarRange } from "lucide-react";

export type PresetKey = "30d" | "90d" | "6m" | "12m" | "ytd" | "custom";

export const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "6m", label: "6 meses" },
  { key: "12m", label: "12 meses" },
  { key: "ytd", label: "Ano atual" },
];

export function getPresetRange(key: PresetKey): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let start: Date;
  switch (key) {
    case "30d": start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); break;
    case "90d": start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90); break;
    case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
    case "12m": start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    case "ytd": start = new Date(now.getFullYear(), 0, 1); break;
    default: start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }
  return { from: start.toISOString().split("T")[0], to };
}

interface Props {
  activePreset: PresetKey;
  dateFrom: string;
  dateTo: string;
  onPreset: (key: PresetKey) => void;
  onCustomDate: (field: "from" | "to", value: string) => void;
}

export function ReportPeriodFilter({ activePreset, dateFrom, dateTo, onPreset, onCustomDate }: Props) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarRange className="h-4 w-4" />
          Período
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(p => (
            <Button
              key={p.key}
              variant={activePreset === p.key ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onPreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input
            type="date"
            value={dateFrom}
            onChange={e => onCustomDate("from", e.target.value)}
            className="w-[140px] h-8 text-xs"
          />
          <span className="text-xs text-muted-foreground">até</span>
          <Input
            type="date"
            value={dateTo}
            onChange={e => onCustomDate("to", e.target.value)}
            className="w-[140px] h-8 text-xs"
          />
        </div>
      </div>
    </Card>
  );
}
