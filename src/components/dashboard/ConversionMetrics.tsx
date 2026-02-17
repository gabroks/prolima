import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import { budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";

interface ConversionMetricsProps {
  budgets: BudgetWithItems[];
  approvedBudgets: BudgetWithItems[];
  pendingBudgets: BudgetWithItems[];
}

export function ConversionMetrics({ budgets, approvedBudgets, pendingBudgets }: ConversionMetricsProps) {
  const navigate = useNavigate();
  const conversionRate = budgets.length > 0 ? Math.round((approvedBudgets.length / budgets.length) * 100) : 0;
  const ticketMedio = budgets.length > 0 ? budgets.reduce((s, b) => s + Number(b.total), 0) / budgets.length : 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="animate-slide-up" style={{ animationDelay: "250ms", animationFillMode: "backwards" }}>
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground font-medium mb-2">Taxa de Conversão</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold tracking-tight">{conversionRate}%</span>
            <span className="text-xs text-muted-foreground mb-1">aprovados</span>
          </div>
          <Progress value={conversionRate} className="h-2" />
          <p className="text-[11px] text-muted-foreground mt-2">
            {approvedBudgets.length} de {budgets.length} orçamentos convertidos
          </p>
        </CardContent>
      </Card>

      <Card className="animate-slide-up" style={{ animationDelay: "310ms", animationFillMode: "backwards" }}>
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground font-medium mb-2">Ticket Médio</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrency(ticketMedio)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Valor médio por orçamento
          </p>
        </CardContent>
      </Card>

      <Card className="animate-slide-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: "370ms", animationFillMode: "backwards" }}>
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground font-medium mb-2">Pendências</p>
          <div className="space-y-2.5">
            {pendingBudgets.length > 0 ? (
              pendingBudgets.slice(0, 3).map((b) => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded transition-colors"
                    onClick={() => navigate("/orcamentos")}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--warning))] shrink-0" />
                      <span className="text-sm truncate">{b.number} — {b.client_name}</span>
                    </div>
                    <Badge variant={st.variant} className="text-[10px] h-5 shrink-0 ml-2">{st.label}</Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma pendência 🎉</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
