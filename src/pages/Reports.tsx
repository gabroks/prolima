import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/shared/PageStates";
import { useClients } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { budgetStatusConfig, BudgetStatus, formatCurrency } from "@/lib/formatters";
import {
  TrendingUp, TrendingDown, DollarSign, Target, FileText, Award, Download,
} from "lucide-react";
import { toast } from "sonner";
import { ReportPeriodFilter, getPresetRange, type PresetKey } from "@/components/reports/ReportPeriodFilter";
import { ReportKPICards, type KPI } from "@/components/reports/ReportKPICards";
import { ReportCharts } from "@/components/reports/ReportCharts";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getPreviousPeriod(from: string, to: string) {
  const f = new Date(from);
  const t = new Date(to);
  const durationMs = t.getTime() - f.getTime();
  const prevTo = new Date(f.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom.toISOString().split("T")[0], to: prevTo.toISOString().split("T")[0] };
}

function calcVariation(current: number, previous: number) {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, direction: (current > 0 ? "up" : "neutral") as "up" | "down" | "neutral" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), direction: (pct > 0 ? "up" : pct < 0 ? "down" : "neutral") as "up" | "down" | "neutral" };
}

export default function Reports() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: budgets = [], isLoading: lb } = useBudgets();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();

  const [activePreset, setActivePreset] = useState<PresetKey>("6m");
  const defaultRange = getPresetRange("6m");
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);

  const isLoading = lc || lb;

  const handlePreset = (key: PresetKey) => {
    setActivePreset(key);
    const range = getPresetRange(key);
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const handleCustomDate = (field: "from" | "to", value: string) => {
    setActivePreset("custom");
    if (field === "from") setDateFrom(value);
    else setDateTo(value);
  };

  // Filtered data
  const filteredPayments = useMemo(() => payments.filter(p => p.date >= dateFrom && p.date <= dateTo), [payments, dateFrom, dateTo]);
  const filteredExpenses = useMemo(() => expenses.filter(e => e.date >= dateFrom && e.date <= dateTo), [expenses, dateFrom, dateTo]);
  const filteredBudgets = useMemo(() => budgets.filter(b => b.created_at.slice(0, 10) >= dateFrom && b.created_at.slice(0, 10) <= dateTo), [budgets, dateFrom, dateTo]);

  // Previous period
  const prevPeriod = useMemo(() => getPreviousPeriod(dateFrom, dateTo), [dateFrom, dateTo]);
  const prevPayments = useMemo(() => payments.filter(p => p.date >= prevPeriod.from && p.date <= prevPeriod.to), [payments, prevPeriod]);
  const prevExpenses = useMemo(() => expenses.filter(e => e.date >= prevPeriod.from && e.date <= prevPeriod.to), [expenses, prevPeriod]);
  const prevBudgets = useMemo(() => budgets.filter(b => b.created_at.slice(0, 10) >= prevPeriod.from && b.created_at.slice(0, 10) <= prevPeriod.to), [budgets, prevPeriod]);

  // KPIs
  const totalReceitas = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalReceitas - totalDespesas;
  const totalBudgetValue = filteredBudgets.reduce((s, b) => s + Number(b.total), 0);
  const approvedCount = filteredBudgets.filter(b => b.status === "approved").length;
  const conversionRate = filteredBudgets.length > 0 ? Math.round((approvedCount / filteredBudgets.length) * 100) : 0;
  const ticketMedio = filteredBudgets.length > 0 ? totalBudgetValue / filteredBudgets.length : 0;
  const margem = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0;

  const prevReceitas = prevPayments.reduce((s, p) => s + Number(p.amount), 0);
  const prevDespesas = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const prevSaldo = prevReceitas - prevDespesas;
  const prevApproved = prevBudgets.filter(b => b.status === "approved").length;
  const prevConversion = prevBudgets.length > 0 ? Math.round((prevApproved / prevBudgets.length) * 100) : 0;
  const prevTicket = prevBudgets.length > 0 ? prevBudgets.reduce((s, b) => s + Number(b.total), 0) / prevBudgets.length : 0;
  const prevMargem = prevReceitas > 0 ? Math.round(((prevReceitas - prevDespesas) / prevReceitas) * 100) : 0;

  const vReceitas = calcVariation(totalReceitas, prevReceitas);
  const vDespesas = calcVariation(totalDespesas, prevDespesas);
  const vSaldo = calcVariation(saldo, prevSaldo);
  const vConversion = calcVariation(conversionRate, prevConversion);
  const vTicket = calcVariation(ticketMedio, prevTicket);
  const vMargem = calcVariation(margem, prevMargem);

  // Chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    filteredPayments.forEach(p => { const k = p.date.slice(0, 7); if (!months[k]) months[k] = { receitas: 0, despesas: 0 }; months[k].receitas += Number(p.amount); });
    filteredExpenses.forEach(e => { const k = e.date.slice(0, 7); if (!months[k]) months[k] = { receitas: 0, despesas: 0 }; months[k].despesas += Number(e.amount); });
    let acc = 0;
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => {
      const [y, m] = key.split("-");
      acc += val.receitas - val.despesas;
      return { month: `${MONTH_NAMES[parseInt(m) - 1]}/${y.slice(2)}`, receitas: val.receitas, despesas: val.despesas, saldo: val.receitas - val.despesas, acumulado: acc };
    });
  }, [filteredPayments, filteredExpenses]);

  const topClients = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number; paid: number }> = {};
    filteredBudgets.forEach(b => { const k = b.client_id || b.client_name; if (!map[k]) map[k] = { name: b.client_name, value: 0, count: 0, paid: 0 }; map[k].value += Number(b.total); map[k].count++; });
    filteredPayments.forEach(p => { const budget = budgets.find(b => b.id === p.budget_id); if (budget) { const k = budget.client_id || budget.client_name; if (map[k]) map[k].paid += Number(p.amount); } });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredBudgets, filteredPayments, budgets]);

  const statusData = useMemo(
    () => (Object.keys(budgetStatusConfig) as BudgetStatus[]).map(key => ({ name: budgetStatusConfig[key].label, value: filteredBudgets.filter(b => b.status === key).length })).filter(d => d.value > 0),
    [filteredBudgets]
  );

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach(c => { const city = c.city || "Sem cidade"; const nb = c.neighborhood; const label = nb ? `${city} — ${nb}` : city; map[label] = (map[label] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [clients]);

  // NEW: Top suppliers by expense
  const topSuppliers = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    filteredExpenses.forEach(e => {
      const name = e.supplier_name || "Sem fornecedor";
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += Number(e.amount);
      map[name].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filteredExpenses]);

  // NEW: Payment method distribution
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPayments.forEach(p => { map[p.method] = (map[p.method] || 0) + Number(p.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredPayments]);

  // CSV export
  const handleExportCSV = () => {
    const rows: string[][] = [["Mês", "Receitas", "Despesas", "Saldo", "Acumulado"]];
    monthlyData.forEach(d => rows.push([d.month, d.receitas.toFixed(2), d.despesas.toFixed(2), d.saldo.toFixed(2), d.acumulado.toFixed(2)]));
    rows.push([]);
    rows.push(["Indicador", "Atual", "Anterior", "Variação"]);
    rows.push(["Receitas", totalReceitas.toFixed(2), prevReceitas.toFixed(2), `${vReceitas.direction === "up" ? "+" : "-"}${vReceitas.pct}%`]);
    rows.push(["Despesas", totalDespesas.toFixed(2), prevDespesas.toFixed(2), `${vDespesas.direction === "up" ? "+" : "-"}${vDespesas.pct}%`]);
    rows.push(["Saldo", saldo.toFixed(2), prevSaldo.toFixed(2), `${vSaldo.direction === "up" ? "+" : "-"}${vSaldo.pct}%`]);
    rows.push(["Conversão", `${conversionRate}%`, `${prevConversion}%`, `${vConversion.direction === "up" ? "+" : "-"}${vConversion.pct}%`]);
    rows.push(["Ticket Médio", ticketMedio.toFixed(2), prevTicket.toFixed(2), `${vTicket.direction === "up" ? "+" : "-"}${vTicket.pct}%`]);
    rows.push(["Margem", `${margem}%`, `${prevMargem}%`, `${vMargem.direction === "up" ? "+" : "-"}${vMargem.pct}%`]);
    rows.push([]);
    rows.push(["Top Clientes", "Valor", "Orçamentos", "Pago"]);
    topClients.forEach(c => rows.push([c.name, c.value.toFixed(2), String(c.count), c.paid.toFixed(2)]));
    rows.push([]);
    rows.push(["Categoria Despesa", "Valor"]);
    categoryData.forEach(c => rows.push([c.name, c.value.toFixed(2)]));
    rows.push([]);
    rows.push(["Top Fornecedores", "Total", "Despesas"]);
    topSuppliers.forEach(s => rows.push([s.name, s.total.toFixed(2), String(s.count)]));
    rows.push([]);
    rows.push(["Método de Pagamento", "Valor"]);
    paymentMethodData.forEach(m => rows.push([m.name, m.value.toFixed(2)]));

    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${dateFrom}-a-${dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  if (isLoading) return <PageLoading cards={6} />;

  const kpis: KPI[] = [
    { label: "Receitas", value: formatCurrency(totalReceitas), icon: TrendingUp, color: "text-primary", variation: vReceitas },
    { label: "Despesas", value: formatCurrency(totalDespesas), icon: TrendingDown, color: "text-destructive", variation: vDespesas, invertColor: true },
    { label: "Saldo", value: formatCurrency(saldo), icon: DollarSign, color: saldo >= 0 ? "text-primary" : "text-destructive", variation: vSaldo },
    { label: "Conversão", value: `${conversionRate}%`, icon: Target, color: "text-primary", variation: vConversion },
    { label: "Ticket Médio", value: formatCurrency(ticketMedio), icon: FileText, color: "text-primary", variation: vTicket },
    { label: "Margem", value: `${margem}%`, icon: Award, color: margem >= 0 ? "text-primary" : "text-destructive", variation: vMargem },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada do desempenho do seu negócio</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={monthlyData.length === 0}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      <ReportPeriodFilter
        activePreset={activePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPreset={handlePreset}
        onCustomDate={handleCustomDate}
      />

      <ReportKPICards kpis={kpis} />

      <ReportCharts
        monthlyData={monthlyData}
        topClients={topClients}
        statusData={statusData}
        categoryData={categoryData}
        cityData={cityData}
        topSuppliers={topSuppliers}
        paymentMethodData={paymentMethodData}
      />
    </div>
  );
}
