import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, DollarSign, Receipt, FileText } from "lucide-react";
import { formatCurrency, formatDate, budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { Tables } from "@/integrations/supabase/types";

interface RecentActivityProps {
  payments: Tables<"payments">[];
  expenses: Tables<"expenses">[];
  budgets: BudgetWithItems[];
}

export function RecentActivity({ payments, expenses, budgets }: RecentActivityProps) {
  const activityFeed = useMemo(() => {
    const items = [
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        title: `Pagamento recebido — ${p.client_name}`,
        subtitle: formatCurrency(Number(p.amount)),
        date: p.date,
        icon: DollarSign,
        iconBg: "bg-primary/10 text-primary",
      })),
      ...expenses.map((e) => ({
        id: `exp-${e.id}`,
        title: `Despesa — ${e.description}`,
        subtitle: formatCurrency(Number(e.amount)),
        date: e.date,
        icon: Receipt,
        iconBg: "bg-destructive/10 text-destructive",
      })),
      ...budgets.map((b) => ({
        id: `bud-${b.id}`,
        title: `Orçamento ${b.number} — ${b.client_name}`,
        subtitle: budgetStatusConfig[b.status as BudgetStatus]?.label,
        date: b.created_at,
        icon: FileText,
        iconBg: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]",
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
    return items;
  }, [payments, expenses, budgets]);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "640ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activityFeed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
          ) : (
            activityFeed.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-md ${item.iconBg} shrink-0 mt-0.5`}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{item.subtitle}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">• {formatDate(item.date)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
