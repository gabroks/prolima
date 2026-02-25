import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { WidgetEmpty } from "@/components/shared/WidgetEmpty";
import type { BudgetWithItems } from "@/hooks/useBudgets";

interface ExpiringBudgetsProps {
  budgets: BudgetWithItems[];
}

export function ExpiringBudgets({ budgets }: ExpiringBudgetsProps) {
  const navigate = useNavigate();

  const expiringBudgets = useMemo(() => {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split("T")[0];
    const futureStr = in7Days.toISOString().split("T")[0];

    return budgets
      .filter(b =>
        b.validity_date &&
        (b.status === "issued" || b.status === "draft") &&
        b.validity_date >= todayStr &&
        b.validity_date <= futureStr
      )
      .sort((a, b) => (a.validity_date ?? "").localeCompare(b.validity_date ?? ""));
  }, [budgets]);

  const expiredBudgets = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return budgets.filter(b =>
      b.validity_date &&
      b.validity_date < todayStr &&
      (b.status === "issued" || b.status === "draft")
    );
  }, [budgets]);

  const totalCount = expiringBudgets.length + expiredBudgets.length;

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "700ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Vencimentos
          {totalCount > 0 && (
            <Badge variant="destructive" className="text-[10px] h-4 px-1.5 ml-1">{totalCount}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary" onClick={() => navigate("/orcamentos")}>
          Ver todos →
        </Button>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <WidgetEmpty icon={CalendarClock} title="Nenhum vencimento próximo" subtitle="Todos os orçamentos em dia" />
        ) : (
          <div className="space-y-2">
            {expiredBudgets.slice(0, 3).map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between cursor-pointer hover:bg-destructive/5 -mx-2 px-2 py-2 rounded transition-colors"
                onClick={() => navigate(`/editar-orcamento/${b.id}`)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{b.number} — {b.client_name}</p>
                    <p className="text-[10px] text-destructive">Vencido em {formatDate(b.validity_date!)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">{formatCurrency(Number(b.total))}</span>
              </div>
            ))}
            {expiringBudgets.slice(0, 3).map(b => {
              const daysLeft = Math.ceil((new Date(b.validity_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/40 -mx-2 px-2 py-2 rounded transition-colors"
                  onClick={() => navigate(`/editar-orcamento/${b.id}`)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarClock className="h-3.5 w-3.5 text-warning shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.number} — {b.client_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {daysLeft === 0 ? "Vence hoje" : daysLeft === 1 ? "Vence amanhã" : `Vence em ${daysLeft} dias`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">{formatCurrency(Number(b.total))}</span>
                </div>
              );
            })}
            {totalCount > 6 && (
              <p
                className="text-[11px] text-muted-foreground cursor-pointer hover:text-primary transition-colors pt-1"
                onClick={() => navigate("/orcamentos")}
              >
                +{totalCount - 6} outro{totalCount - 6 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
