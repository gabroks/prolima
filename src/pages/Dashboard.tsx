import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/useClients";
import { useMaterials } from "@/hooks/useMaterials";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { Users, FileText, TrendingUp, TrendingDown, Sparkles, CalendarDays, Layers, Truck } from "lucide-react";
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

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getPrevMonthKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthKey(d);
}

export default function Dashboard() {
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: materials = [], isLoading: loadingMaterials } = useMaterials();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();
  const { data: suppliers = [] } = useSuppliers();
  const { data: profile } = useCurrentProfile();

  const isLoading = loadingClients || loadingBudgets || loadingMaterials || loadingPayments || loadingExpenses;

  const userName = profile?.name || profile?.email?.split("@")[0] || "";
  const todayFormatted = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(() => getMonthKey(now), [now]);
  const prevMonthKey = useMemo(() => getPrevMonthKey(now), [now]);

  const monthPayments = useMemo(() => payments.filter((p) => p.date.startsWith(currentMonthKey)), [payments, currentMonthKey]);
  const monthExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(currentMonthKey)), [expenses, currentMonthKey]);
  const prevMonthPayments = useMemo(() => payments.filter((p) => p.date.startsWith(prevMonthKey)), [payments, prevMonthKey]);
  const prevMonthExpenses = useMemo(() => expenses.filter((e) => e.date.startsWith(prevMonthKey)), [expenses, prevMonthKey]);

  const totalReceitas = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const monthReceitas = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const monthDespesas = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthSaldo = monthReceitas - monthDespesas;

  const prevMonthReceitas = prevMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
  const prevMonthDespesas = prevMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const prevMonthSaldo = prevMonthReceitas - prevMonthDespesas;

  const approvedBudgets = budgets.filter((b) => b.status === "approved");
  const totalApproved = approvedBudgets.reduce((s, b) => s + Number(b.total), 0);
  const pendingBudgets = budgets.filter((b) => b.status === "issued" || b.status === "draft");
  const rejectedBudgets = budgets.filter((b) => b.status === "rejected");

  // Month-over-month budget count
  const monthBudgets = budgets.filter(b => b.created_at.startsWith(currentMonthKey)).length;
  const prevMonthBudgets = budgets.filter(b => b.created_at.startsWith(prevMonthKey)).length;
  const budgetDiff = monthBudgets - prevMonthBudgets;

  // Saldo comparison
  const saldoDiff = monthSaldo - prevMonthSaldo;
  const saldoTrendLabel = saldoDiff > 0 ? `+${formatCurrency(saldoDiff)}` : saldoDiff < 0 ? formatCurrency(saldoDiff) : "Estável";

  const activeClients = clients.filter((c) => c.status === "active").length;
  const activeSuppliers = suppliers.filter((s) => s.active).length;

  // Material categories count
  const materialCategories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category));
    return cats.size;
  }, [materials]);

  // Top clients by payment volume
  const topClients = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.client_name] = (map[p.client_name] || 0) + Number(p.amount); });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [payments]);

  // Pending budgets total value
  const pendingTotal = pendingBudgets.reduce((s, b) => s + Number(b.total), 0);

  const summaryCards = [
    { title: "Clientes", value: clients.length, subtitle: `${activeClients} ativo${activeClients !== 1 ? "s" : ""}`, icon: Users, trend: null, trendUp: true, href: "/clientes" },
    { title: "Orçamentos", value: budgets.length, subtitle: `${approvedBudgets.length} aprovado${approvedBudgets.length !== 1 ? "s" : ""}`, icon: FileText, trend: budgetDiff !== 0 ? `${budgetDiff > 0 ? "+" : ""}${budgetDiff} este mês` : null, trendUp: budgetDiff >= 0, href: "/orcamentos" },
    { title: "Fornecedores", value: suppliers.length, subtitle: `${activeSuppliers} ativo${activeSuppliers !== 1 ? "s" : ""}`, icon: Truck, trend: null, trendUp: true, href: "/fornecedores" },
    { title: "Saldo do Mês", value: formatCurrency(monthSaldo), subtitle: monthSaldo >= 0 ? "Positivo" : "Negativo", icon: monthSaldo >= 0 ? TrendingUp : TrendingDown, trend: saldoTrendLabel, trendUp: saldoDiff >= 0, href: "/financeiro", negative: monthSaldo < 0 },
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {getGreeting()}{userName ? `, ${userName}` : ""}! <Sparkles className="h-5 w-5 text-primary" />
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize">
              <CalendarDays className="h-3.5 w-3.5" />
              {todayFormatted}
            </p>
            <span className="text-muted-foreground/40">•</span>
            <p className="text-xs text-muted-foreground">
              {pendingBudgets.length > 0 ? (
                <><span className="font-semibold text-foreground">{pendingBudgets.length}</span>{" "}pendência{pendingBudgets.length !== 1 && "s"} ({formatCurrency(pendingTotal)})</>
              ) : (
                "Tudo em dia 🎉"
              )}
            </p>
          </div>
        </div>
        <QuickActions />
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Conversion Metrics */}
      <ConversionMetrics budgets={budgets} approvedBudgets={approvedBudgets} pendingBudgets={pendingBudgets} rejectedCount={rejectedBudgets.length} />

      {/* Financial Summary + Revenue Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <FinancialSummary
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          totalApproved={totalApproved}
          monthReceitas={monthReceitas}
          monthDespesas={monthDespesas}
          prevMonthReceitas={prevMonthReceitas}
          prevMonthDespesas={prevMonthDespesas}
          topClients={topClients}
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
