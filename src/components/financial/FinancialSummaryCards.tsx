import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SummaryCards, type SummaryCardItem } from "@/components/shared/SummaryCards";

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
  const receivedExtra = monthComparison && monthComparison.prevTotal > 0
    ? `${monthComparison.diff > 0 ? "+" : ""}${monthComparison.diff.toFixed(1)}% vs mês anterior`
    : monthComparison ? `${monthComparison.curCount} este mês` : null;

  const items: SummaryCardItem[] = [
    { label: "Orç. Aprovados", value: formatCurrency(totalApproved), icon: DollarSign },
    { label: "Total Recebido", value: formatCurrency(totalReceived), icon: TrendingUp, extra: receivedExtra },
    {
      label: "A Receber", value: formatCurrency(balance),
      icon: balance > 0 ? AlertCircle : CheckCircle2,
      bgColor: balance > 0 ? "bg-yellow-500/10" : "bg-primary/10",
      iconColor: balance > 0 ? "text-yellow-600" : "text-primary",
    },
    {
      label: "Lucro Líquido", value: formatCurrency(profit),
      icon: profit >= 0 ? TrendingUp : TrendingDown,
      bgColor: profit >= 0 ? "bg-primary/10" : "bg-destructive/10",
      iconColor: profit >= 0 ? "text-primary" : "text-destructive",
      extra: profitMargin ? `Margem: ${profitMargin}%` : null,
    },
  ];

  return <SummaryCards items={items} />;
}
