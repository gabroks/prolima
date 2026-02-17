import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/useClients";
import { useMaterials } from "@/hooks/useMaterials";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { Users, Package, FileText, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ConversionMetrics } from "@/components/dashboard/ConversionMetrics";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { BudgetStatusChart } from "@/components/dashboard/BudgetStatusChart";
import { RecentBudgets } from "@/components/dashboard/RecentBudgets";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: materials = [], isLoading: loadingMaterials } = useMaterials();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();

  const isLoading = loadingClients || loadingBudgets || loadingMaterials || loadingPayments || loadingExpenses;

  // Current month filter for financial data
  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const monthPayments = useMemo(() => payments.filter((p) => p.date.startsWith(currentMonthKey)), [payments, currentMonthKey]);
  const monthExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(currentMonthKey)), [expenses, currentMonthKey]);

  const totalReceitas = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  const monthReceitas = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const monthDespesas = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthSaldo = monthReceitas - monthDespesas;

  const approvedBudgets = budgets.filter((b) => b.status === "approved");
  const totalApproved = approvedBudgets.reduce((s, b) => s + Number(b.total), 0);
  const pendingBudgets = budgets.filter((b) => b.status === "issued" || b.status === "draft");

  const summaryCards = [
    { title: "Clientes", value: clients.length, subtitle: `${clients.filter((c) => c.status === "active").length} ativos`, icon: Users, trend: null, trendUp: true, href: "/clientes" },
    { title: "Materiais", value: materials.length, subtitle: "no catálogo", icon: Package, trend: null, trendUp: true, href: "/materiais" },
    { title: "Orçamentos", value: budgets.length, subtitle: `${approvedBudgets.length} aprovados`, icon: FileText, trend: `${pendingBudgets.length} pendentes`, trendUp: true, href: "/orcamentos" },
    { title: "Saldo do Mês", value: formatCurrency(monthSaldo), subtitle: monthSaldo >= 0 ? "Positivo" : "Negativo", icon: monthSaldo >= 0 ? TrendingUp : TrendingDown, trend: monthSaldo >= 0 ? "Saudável" : "Atenção", trendUp: monthSaldo >= 0, href: "/financeiro" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Carregando dashboard">
        <div className="flex items-center justify-between">
          <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
          <div className="hidden sm:flex gap-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-28" />)}</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[140px] rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[320px] rounded-xl" />
          <Skeleton className="h-[320px] lg:col-span-2 rounded-xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[280px] rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {getGreeting()}! <Sparkles className="h-5 w-5 text-primary" />
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingBudgets.length > 0 ? (
              <>Você tem <span className="font-semibold text-foreground">{pendingBudgets.length}</span>{" "}orçamento{pendingBudgets.length !== 1 && "s"} pendente{pendingBudgets.length !== 1 && "s"}</>
            ) : (
              "Tudo em dia — nenhuma pendência no momento 🎉"
            )}
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Conversion Metrics */}
      <ConversionMetrics budgets={budgets} approvedBudgets={approvedBudgets} pendingBudgets={pendingBudgets} />

      {/* Financial Summary + Revenue Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FinancialSummary
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          totalApproved={totalApproved}
          monthReceitas={monthReceitas}
          monthDespesas={monthDespesas}
        />
        <RevenueChart payments={payments} expenses={expenses} />
      </div>

      {/* Status + Recent Budgets + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BudgetStatusChart budgets={budgets} />
        <RecentBudgets budgets={budgets} />
        <RecentActivity payments={payments} expenses={expenses} budgets={budgets} />
      </div>
    </div>
  );
}
