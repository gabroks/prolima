import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface MonthComparison {
  curTotal: number;
  prevTotal: number;
  curCount: number;
  diff: number;
}

interface Props {
  totalApproved: number;
  totalReceived: number;
  balance: number;
  profit: number;
  profitMargin?: string;
  monthComparison?: MonthComparison;
}

export function FinancialSummaryCards({ totalApproved, totalReceived, balance, profit, profitMargin, monthComparison }: Props) {
  const cards = [
    {
      label: "Orç. Aprovados",
      value: formatCurrency(totalApproved),
      icon: DollarSign,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "Total Recebido",
      value: formatCurrency(totalReceived),
      icon: TrendingUp,
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      extra: monthComparison && monthComparison.prevTotal > 0
        ? `${monthComparison.diff > 0 ? "+" : ""}${monthComparison.diff.toFixed(1)}% vs mês anterior`
        : monthComparison ? `${monthComparison.curCount} este mês` : null,
      trendUp: monthComparison ? monthComparison.diff > 0 : undefined,
    },
    {
      label: "A Receber",
      value: formatCurrency(balance),
      icon: balance > 0 ? AlertCircle : CheckCircle2,
      bgColor: balance > 0 ? "bg-yellow-500/10" : "bg-primary/10",
      iconColor: balance > 0 ? "text-yellow-600" : "text-primary",
    },
    {
      label: "Lucro Líquido",
      value: formatCurrency(profit),
      icon: profit >= 0 ? TrendingUp : TrendingDown,
      bgColor: profit >= 0 ? "bg-primary/10" : "bg-destructive/10",
      iconColor: profit >= 0 ? "text-primary" : "text-destructive",
      extra: profitMargin ? `Margem: ${profitMargin}%` : null,
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
                  {"trendUp" in c && c.trendUp !== undefined && (
                    c.trendUp
                      ? <ArrowUpRight className="h-3 w-3 text-primary" />
                      : <ArrowDownRight className="h-3 w-3 text-destructive" />
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
