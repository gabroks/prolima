import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

interface FinancialSummaryProps {
  totalReceitas: number;
  totalDespesas: number;
  totalApproved: number;
}

export function FinancialSummary({ totalReceitas, totalDespesas, totalApproved }: FinancialSummaryProps) {
  const navigate = useNavigate();
  const saldo = totalReceitas - totalDespesas;
  const margem = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0;

  return (
    <Card className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-sm">Receitas</span>
            </div>
            <span className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(totalReceitas)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
              <span className="text-sm">Despesas</span>
            </div>
            <span className="text-sm font-semibold text-destructive tabular-nums">{formatCurrency(totalDespesas)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saldo</span>
            <span className={`text-base font-bold tabular-nums ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>
              {formatCurrency(saldo)}
            </span>
          </div>
        </div>
        <div className="pt-3 border-t space-y-2.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Orçamentos aprovados</span>
            <span className="font-semibold tabular-nums">{formatCurrency(totalApproved)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Margem estimada</span>
            <span className="font-semibold tabular-nums text-primary">{margem > 0 ? `${margem}%` : "—"}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs mt-2" onClick={() => navigate("/financeiro")}>
          Ver relatório completo <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
