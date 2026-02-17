import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { budgetStatusConfig } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";

interface BudgetStatusChartProps {
  budgets: BudgetWithItems[];
}

export function BudgetStatusChart({ budgets }: BudgetStatusChartProps) {
  const statusEntries = Object.entries(budgetStatusConfig).map(([key, config]) => ({
    key,
    ...config,
    count: budgets.filter((b) => b.status === key).length,
  }));

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "520ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Status dos Orçamentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusEntries.map((s) => {
          const pct = Math.max((s.count / Math.max(budgets.length, 1)) * 100, s.count > 0 ? 8 : 0);
          return (
            <div key={s.key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${s.bg}`} />
                  <span className="font-medium">{s.label}</span>
                </div>
                <span className="font-semibold tabular-nums">{s.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.bg} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
