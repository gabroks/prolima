import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  totalApproved: number;
  totalReceived: number;
  balance: number;
  profit: number;
}

export function FinancialSummaryCards({ totalApproved, totalReceived, balance, profit }: Props) {
  const cards = [
    { label: "Orç. Aprovados", value: formatCurrency(totalApproved), icon: DollarSign, color: "text-primary" },
    { label: "Total Recebido", value: formatCurrency(totalReceived), icon: TrendingUp, color: "text-primary" },
    { label: "A Receber", value: formatCurrency(balance), icon: balance > 0 ? AlertCircle : CheckCircle2, color: balance > 0 ? "text-[hsl(var(--warning))]" : "text-primary" },
    { label: "Lucro Líquido", value: formatCurrency(profit), icon: profit >= 0 ? TrendingUp : TrendingDown, color: profit >= 0 ? "text-primary" : "text-destructive" },
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
