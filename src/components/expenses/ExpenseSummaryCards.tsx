import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface MonthComparison {
  curTotal: number;
  prevTotal: number;
  curCount: number;
  diff: number;
}

interface Props {
  totalEntradas: number;
  totalDespesas: number;
  saldo: number;
  avgExpense: number;
  monthComparison?: MonthComparison;
}

export function ExpenseSummaryCards({ totalEntradas, totalDespesas, saldo, avgExpense, monthComparison }: Props) {
  const cards = [
    {
      label: "Total Entradas",
      value: formatCurrency(totalEntradas),
      icon: TrendingUp,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Despesas",
      value: formatCurrency(totalDespesas),
      icon: TrendingDown,
      bgColor: "bg-destructive/10",
      iconColor: "text-destructive",
      extra: monthComparison && monthComparison.prevTotal > 0
        ? `${monthComparison.diff > 0 ? "+" : ""}${monthComparison.diff.toFixed(1)}% vs mês anterior`
        : monthComparison ? `${monthComparison.curCount} este mês` : null,
      trendUp: monthComparison ? monthComparison.diff > 0 : undefined,
    },
    {
      label: "Saldo",
      value: formatCurrency(saldo),
      icon: Wallet,
      bgColor: saldo >= 0 ? "bg-primary/10" : "bg-destructive/10",
      iconColor: saldo >= 0 ? "text-primary" : "text-destructive",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(avgExpense),
      icon: Tag,
      bgColor: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map(c => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.bgColor}`}>
              <c.icon className={`h-5 w-5 ${c.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold tabular-nums truncate">{c.value}</p>
              {"extra" in c && c.extra && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  {c.trendUp !== undefined && (
                    c.trendUp
                      ? <ArrowUpRight className="h-3 w-3 text-destructive" />
                      : <ArrowDownRight className="h-3 w-3 text-primary" />
                  )}
                  {c.extra}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
