import { TrendingUp, TrendingDown, Wallet, Tag } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SummaryCards, type SummaryCardItem } from "@/components/shared/SummaryCards";

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
  const despesaExtra = monthComparison && monthComparison.prevTotal > 0
    ? `${monthComparison.diff > 0 ? "+" : ""}${monthComparison.diff.toFixed(1)}% vs mês anterior`
    : monthComparison ? `${monthComparison.curCount} este mês` : null;

  const items: SummaryCardItem[] = [
    { label: "Total Entradas", value: formatCurrency(totalEntradas), icon: TrendingUp },
    { label: "Total Despesas", value: formatCurrency(totalDespesas), icon: TrendingDown, bgColor: "bg-destructive/10", iconColor: "text-destructive", extra: despesaExtra },
    { label: "Saldo", value: formatCurrency(saldo), icon: Wallet, bgColor: saldo >= 0 ? "bg-primary/10" : "bg-destructive/10", iconColor: saldo >= 0 ? "text-primary" : "text-destructive" },
    { label: "Ticket Médio", value: formatCurrency(avgExpense), icon: Tag, bgColor: "bg-muted", iconColor: "text-muted-foreground" },
  ];

  return <SummaryCards items={items} />;
}
