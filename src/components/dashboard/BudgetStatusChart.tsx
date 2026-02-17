import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PieChart } from "lucide-react";
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

  const total = budgets.length;

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "520ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            Status dos Orçamentos
          </CardTitle>
          {total > 0 && <span className="text-xs text-muted-foreground tabular-nums">{total} total</span>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <PieChart className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">Nenhum orçamento</p>
            <p className="text-xs mt-0.5">Crie orçamentos para ver a distribuição</p>
          </div>
        ) : (
          statusEntries.map((s) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            const barWidth = Math.max(pct, s.count > 0 ? 8 : 0);
            return (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <div className="space-y-1.5 cursor-default" role="meter" aria-label={`${s.label}: ${s.count}`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${s.bg}`} />
                        <span className="font-medium">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                        <span className="font-semibold tabular-nums w-6 text-right">{s.count}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.bg} transition-all duration-700 ease-out`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {s.count} orçamento{s.count !== 1 && "s"} com status "{s.label}" ({pct}%)
                </TooltipContent>
              </Tooltip>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
