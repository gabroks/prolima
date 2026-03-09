import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, TrendingUp, TrendingDown, Sparkles, CalendarDays, Layers, Truck, AlertCircle, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useDashboardData } from "@/hooks/useDashboardData";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ConversionMetrics } from "@/components/dashboard/ConversionMetrics";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BudgetStatusChart } from "@/components/dashboard/BudgetStatusChart";
import { RecentBudgets } from "@/components/dashboard/RecentBudgets";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ExpiringBudgets } from "@/components/dashboard/ExpiringBudgets";
import { WelcomeOnboarding } from "@/components/dashboard/WelcomeOnboarding";
import { DashboardPeriodFilter, type DashboardPeriod, getDateRangeForPeriod } from "@/components/dashboard/DashboardPeriodFilter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const data = useDashboardData();
  const queryClient = useQueryClient();

  const dateRange = useMemo(() => getDateRangeForPeriod(period), [period]);

  const filteredPayments = useMemo(() => {
    if (!dateRange.from) return data.payments;
    return data.payments.filter(p => {
      const d = new Date(p.date);
      return d >= dateRange.from! && d <= dateRange.to;
    });
  }, [data.payments, dateRange]);

  const filteredExpenses = useMemo(() => {
    if (!dateRange.from) return data.expenses;
    return data.expenses.filter(e => {
      const d = new Date(e.date);
      return d >= dateRange.from! && d <= dateRange.to;
    });
  }, [data.expenses, dateRange]);

  const filteredReceitas = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const filteredDespesas = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["materials"] });
    queryClient.invalidateQueries({ queryKey: ["payments"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  if (data.isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando dashboard">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <div className="hidden sm:flex gap-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-28" />)}</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (data.hasError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente novamente.
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const todayFormatted = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Show onboarding only when user hasn't completed all setup steps
  const showOnboarding = data.clients.length === 0 || data.materials.length === 0 || data.budgets.length === 0;

  const summaryCards = [
    { title: "Clientes", value: data.clients.length, subtitle: `${data.activeClients} ativo${data.activeClients !== 1 ? "s" : ""}`, icon: Users, trend: null, trendUp: true, href: "/clientes" },
    { title: "Orçamentos", value: data.budgets.length, subtitle: `${data.approvedBudgets.length} aprovado${data.approvedBudgets.length !== 1 ? "s" : ""}`, icon: FileText, trend: data.budgetDiff !== 0 ? `${data.budgetDiff > 0 ? "+" : ""}${data.budgetDiff} este mês` : null, trendUp: data.budgetDiff >= 0, href: "/orcamentos" },
    { title: "Materiais", value: data.materials.length, subtitle: `${data.materialCategories} categoria${data.materialCategories !== 1 ? "s" : ""}`, icon: Layers, trend: null, trendUp: true, href: "/materiais" },
    { title: "Fornecedores", value: data.suppliers.length, subtitle: `${data.activeSuppliers} ativo${data.activeSuppliers !== 1 ? "s" : ""}`, icon: Truck, trend: null, trendUp: true, href: "/fornecedores" },
    { title: "Saldo do Período", value: formatCurrency(filteredReceitas - filteredDespesas), subtitle: (filteredReceitas - filteredDespesas) >= 0 ? "Positivo" : "Negativo", icon: (filteredReceitas - filteredDespesas) >= 0 ? TrendingUp : TrendingDown, trend: data.saldoTrendLabel, trendUp: data.saldoDiff >= 0, href: "/financeiro", negative: (filteredReceitas - filteredDespesas) < 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {getGreeting()}{data.userName ? `, ${data.userName}` : ""}! <Sparkles className="h-5 w-5 text-primary" />
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayFormatted}
            </p>
            <span className="text-muted-foreground/40">•</span>
            <p className="text-xs text-muted-foreground">
              {data.pendingBudgets.length > 0 ? (
                <><span className="font-semibold text-foreground">{data.pendingBudgets.length}</span>{" "}pendência{data.pendingBudgets.length !== 1 && "s"} ({formatCurrency(data.pendingTotal)})</>
              ) : (
                "Tudo em dia 🎉"
              )}
            </p>
          </div>
        </div>
        <DashboardPeriodFilter active={period} onChange={setPeriod} />
      </div>

      {/* Onboarding for new users - shows until core setup is complete */}
      {showOnboarding && (
        <WelcomeOnboarding
          userName={data.userName}
          hasClients={data.clients.length > 0}
          hasMaterials={data.materials.length > 0}
          hasBudgets={data.budgets.length > 0}
          hasSuppliers={data.suppliers.length > 0}
        />
      )}

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Conversion Metrics */}
      <ConversionMetrics budgets={data.budgets} approvedBudgets={data.approvedBudgets} pendingBudgets={data.pendingBudgets} rejectedCount={data.rejectedBudgets.length} pendingTotal={data.pendingTotal} />

      {/* Financial Summary + Revenue Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FinancialSummary
          totalReceitas={filteredReceitas}
          totalDespesas={filteredDespesas}
          totalApproved={data.totalApproved}
          monthReceitas={data.monthReceitas}
          monthDespesas={data.monthDespesas}
          prevMonthReceitas={data.prevMonthReceitas}
          prevMonthDespesas={data.prevMonthDespesas}
          topClients={data.topClients}
        />
        <RevenueChart payments={filteredPayments} expenses={filteredExpenses} />
      </div>

      {/* Status + Recent Budgets + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BudgetStatusChart budgets={data.budgets} />
        <RecentBudgets budgets={data.budgets} />
        <RecentActivity payments={data.payments} expenses={data.expenses} budgets={data.budgets} />
      </div>

      {/* Expiring Budgets */}
      <ExpiringBudgets budgets={data.budgets} />
    </div>
  );
}
