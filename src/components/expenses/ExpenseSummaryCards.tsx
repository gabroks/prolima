import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  totalEntradas: number;
  totalDespesas: number;
  saldo: number;
  avgExpense: number;
}

export function ExpenseSummaryCards({ totalEntradas, totalDespesas, saldo, avgExpense }: Props) {
  const cards = [
    { label: "Total Entradas", value: formatCurrency(totalEntradas), icon: TrendingUp, color: "text-primary" },
    { label: "Total Despesas", value: formatCurrency(totalDespesas), icon: TrendingDown, color: "text-destructive" },
    { label: "Saldo", value: formatCurrency(saldo), icon: Wallet, color: saldo >= 0 ? "text-primary" : "text-destructive" },
    { label: "Ticket Médio", value: formatCurrency(avgExpense), icon: Tag, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map(c => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold tabular-nums truncate">{c.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
