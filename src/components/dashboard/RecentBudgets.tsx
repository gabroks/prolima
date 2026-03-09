import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { WidgetEmpty } from "@/components/shared/WidgetEmpty";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatRelativeDate, budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";

interface RecentBudgetsProps {
  budgets: BudgetWithItems[];
}

export function RecentBudgets({ budgets }: RecentBudgetsProps) {
  const navigate = useNavigate();
  const recentBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [budgets]
  );

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "580ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Orçamentos Recentes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary" onClick={() => navigate("/orcamentos")}>
          Ver todos →
        </Button>
      </CardHeader>
      <CardContent>
        {recentBudgets.length === 0 ? (
          <WidgetEmpty icon={Clock} title="Nenhum orçamento ainda" subtitle="Crie seu primeiro orçamento para vê-lo aqui" />
        ) : (
          <div className="divide-y">
            {recentBudgets.map((b) => {
              const st = budgetStatusConfig[b.status as BudgetStatus];
              return (
                <div
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  onClick={() => navigate(`/editar-orcamento/${b.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/editar-orcamento/${b.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{b.number}</span>
                      <Badge variant={st.variant} className="text-[10px] px-1.5 h-5">{st.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{b.client_name}</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(Number(b.total))}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{formatRelativeDate(b.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
