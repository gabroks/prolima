import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, TrendingUp, Target, XCircle } from "lucide-react";
import { WidgetEmpty } from "@/components/shared/WidgetEmpty";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import { budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";

interface ConversionMetricsProps {
  budgets: BudgetWithItems[];
  approvedBudgets: BudgetWithItems[];
  pendingBudgets: BudgetWithItems[];
  rejectedCount?: number;
  pendingTotal?: number;
}

export function ConversionMetrics({ budgets, approvedBudgets, pendingBudgets, rejectedCount = 0, pendingTotal: pendingTotalProp }: ConversionMetricsProps) {
  const navigate = useNavigate();

  const issuedOrBeyond = budgets.filter((b) => b.status !== "draft");
  const conversionRate = issuedOrBeyond.length > 0
    ? Math.round((approvedBudgets.length / issuedOrBeyond.length) * 100)
    : 0;

  const rejectionRate = issuedOrBeyond.length > 0
    ? Math.round((rejectedCount / issuedOrBeyond.length) * 100)
    : 0;

  const budgetsWithValue = budgets.filter((b) => Number(b.total) > 0);
  const ticketMedio = budgetsWithValue.length > 0
    ? budgetsWithValue.reduce((s, b) => s + Number(b.total), 0) / budgetsWithValue.length
    : 0;

  const pendingTotal = pendingTotalProp ?? pendingBudgets.reduce((s, b) => s + Number(b.total), 0);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="animate-slide-up" style={{ animationDelay: "250ms", animationFillMode: "backwards" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">Taxa de Conversão</p>
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold tracking-tight tabular-nums">{conversionRate}%</span>
                <span className="text-xs text-muted-foreground mb-1">aprovados</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-muted-foreground">
                  {approvedBudgets.length} de {issuedOrBeyond.length} emitidos
                </p>
                {rejectedCount > 0 && (
                  <p className="text-[11px] text-destructive flex items-center gap-0.5">
                    <XCircle className="h-3 w-3" />
                    {rejectedCount} rejeitado{rejectedCount !== 1 ? "s" : ""} ({rejectionRate}%)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Percentual de orçamentos emitidos que foram aprovados</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="animate-slide-up" style={{ animationDelay: "310ms", animationFillMode: "backwards" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-medium">Ticket Médio</p>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(ticketMedio)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Baseado em {budgetsWithValue.length} orçamento{budgetsWithValue.length !== 1 && "s"} com valor
              </p>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="text-xs">Valor médio por orçamento (apenas com valor &gt; 0)</TooltipContent>
      </Tooltip>

      <Card className="animate-slide-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: "370ms", animationFillMode: "backwards" }}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">Pendências</p>
            {pendingTotal > 0 && (
              <span className="text-[11px] font-semibold text-primary tabular-nums">{formatCurrency(pendingTotal)}</span>
            )}
          </div>
          <div className="space-y-2.5">
            {pendingBudgets.length > 0 ? (
              pendingBudgets.slice(0, 3).map((b) => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                return (
                  <div
                    key={b.id}
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={() => navigate("/orcamentos")}
                    onKeyDown={(e) => e.key === "Enter" && navigate("/orcamentos")}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="h-3.5 w-3.5 text-warning shrink-0" />
                      <span className="text-sm truncate">{b.number} — {b.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] tabular-nums text-muted-foreground">{formatCurrency(Number(b.total))}</span>
                      <Badge variant={st.variant} className="text-[10px] h-5">{st.label}</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <WidgetEmpty icon={AlertCircle} title="Nenhuma pendência" subtitle="Todos os orçamentos resolvidos" />
            )}
            {pendingBudgets.length > 3 && (
              <p
                className="text-[11px] text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate("/orcamentos")}
              >
                +{pendingBudgets.length - 3} pendência{pendingBudgets.length - 3 > 1 ? "s" : ""} não exibida{pendingBudgets.length - 3 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
