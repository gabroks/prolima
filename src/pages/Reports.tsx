import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useClients } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { budgetStatusConfig, BudgetStatus, formatCurrency } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, FileText, DollarSign, Receipt,
  Target, Award, MapPin, CalendarRange, X, Download, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { toast } from "sonner";

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))",
  "hsl(var(--chart-2))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))",
];

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type PresetKey = "30d" | "90d" | "6m" | "12m" | "ytd" | "custom";

function getPresetRange(key: PresetKey): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let start: Date;
  switch (key) {
    case "30d": start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); break;
    case "90d": start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90); break;
    case "6m": start = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
    case "12m": start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    case "ytd": start = new Date(now.getFullYear(), 0, 1); break;
    default: start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }
  return { from: start.toISOString().split("T")[0], to };
}

function getPreviousPeriod(from: string, to: string): { from: string; to: string } {
  const f = new Date(from);
  const t = new Date(to);
  const durationMs = t.getTime() - f.getTime();
  const prevTo = new Date(f.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return { from: prevFrom.toISOString().split("T")[0], to: prevTo.toISOString().split("T")[0] };
}

function calcVariation(current: number, previous: number): { pct: number; direction: "up" | "down" | "neutral" } {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "neutral" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "neutral" };
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "6m", label: "6 meses" },
  { key: "12m", label: "12 meses" },
  { key: "ytd", label: "Ano atual" },
];

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

  // Current period data
  const filteredPayments = useMemo(() => payments.filter(p => p.date >= dateFrom && p.date <= dateTo), [payments, dateFrom, dateTo]);
  const filteredExpenses = useMemo(() => expenses.filter(e => e.date >= dateFrom && e.date <= dateTo), [expenses, dateFrom, dateTo]);
  const filteredBudgets = useMemo(() => budgets.filter(b => b.created_at.slice(0, 10) >= dateFrom && b.created_at.slice(0, 10) <= dateTo), [budgets, dateFrom, dateTo]);

  // Previous period data for comparison
  const prevPeriod = useMemo(() => getPreviousPeriod(dateFrom, dateTo), [dateFrom, dateTo]);
  const prevPayments = useMemo(() => payments.filter(p => p.date >= prevPeriod.from && p.date <= prevPeriod.to), [payments, prevPeriod]);
  const prevExpenses = useMemo(() => expenses.filter(e => e.date >= prevPeriod.from && e.date <= prevPeriod.to), [expenses, prevPeriod]);
  const prevBudgets = useMemo(() => budgets.filter(b => b.created_at.slice(0, 10) >= prevPeriod.from && b.created_at.slice(0, 10) <= prevPeriod.to), [budgets, prevPeriod]);

  // Current KPIs
  const totalReceitas = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalReceitas - totalDespesas;
  const totalBudgetValue = filteredBudgets.reduce((s, b) => s + Number(b.total), 0);
  const approvedCount = filteredBudgets.filter(b => b.status === "approved").length;
  const conversionRate = filteredBudgets.length > 0 ? Math.round((approvedCount / filteredBudgets.length) * 100) : 0;
  const ticketMedio = filteredBudgets.length > 0 ? totalBudgetValue / filteredBudgets.length : 0;
  const margem = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0;

  // Previous KPIs
  const prevReceitas = prevPayments.reduce((s, p) => s + Number(p.amount), 0);
  const prevDespesas = prevExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const prevSaldo = prevReceitas - prevDespesas;
  const prevApproved = prevBudgets.filter(b => b.status === "approved").length;
  const prevConversion = prevBudgets.length > 0 ? Math.round((prevApproved / prevBudgets.length) * 100) : 0;
  const prevTicket = prevBudgets.length > 0 ? prevBudgets.reduce((s, b) => s + Number(b.total), 0) / prevBudgets.length : 0;
  const prevMargem = prevReceitas > 0 ? Math.round(((prevReceitas - prevDespesas) / prevReceitas) * 100) : 0;

  // Variations
  const vReceitas = calcVariation(totalReceitas, prevReceitas);
  const vDespesas = calcVariation(totalDespesas, prevDespesas);
  const vSaldo = calcVariation(saldo, prevSaldo);
  const vConversion = calcVariation(conversionRate, prevConversion);
  const vTicket = calcVariation(ticketMedio, prevTicket);
  const vMargem = calcVariation(margem, prevMargem);

  // Monthly chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    filteredPayments.forEach(p => {
      const key = p.date.slice(0, 7);
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].receitas += Number(p.amount);
    });
    filteredExpenses.forEach(e => {
      const key = e.date.slice(0, 7);
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].despesas += Number(e.amount);
    });
    let accumulated = 0;
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split("-");
        accumulated += val.receitas - val.despesas;
        return {
          month: `${MONTH_NAMES[parseInt(m) - 1]}/${y.slice(2)}`,
          receitas: val.receitas,
          despesas: val.despesas,
          saldo: val.receitas - val.despesas,
          acumulado: accumulated,
        };
      });
  }, [filteredPayments, filteredExpenses]);

  // Top clients
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number; paid: number }> = {};
    filteredBudgets.forEach(b => {
      const key = b.client_id || b.client_name;
      if (!map[key]) map[key] = { name: b.client_name, value: 0, count: 0, paid: 0 };
      map[key].value += Number(b.total);
      map[key].count++;
    });
    filteredPayments.forEach(p => {
      const budget = budgets.find(b => b.id === p.budget_id);
      if (budget) {
        const key = budget.client_id || budget.client_name;
        if (map[key]) map[key].paid += Number(p.amount);
      }
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredBudgets, filteredPayments, budgets]);

  // Status distribution
  const statusData = useMemo(
    () => (Object.keys(budgetStatusConfig) as BudgetStatus[])
      .map(key => ({ name: budgetStatusConfig[key].label, value: filteredBudgets.filter(b => b.status === key).length }))
      .filter(d => d.value > 0),
    [filteredBudgets]
  );

  // Expense categories
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  // City + neighborhood distribution
  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach(c => {
      const city = c.city || "Sem cidade";
      const neighborhood = c.neighborhood;
      const label = neighborhood ? `${city} — ${neighborhood}` : city;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [clients]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const VariationBadge = ({ v, invertColor = false }: { v: ReturnType<typeof calcVariation>; invertColor?: boolean }) => {
    const isPositive = invertColor ? v.direction === "down" : v.direction === "up";
    const Icon = v.direction === "up" ? ArrowUpRight : v.direction === "down" ? ArrowDownRight : Minus;
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        v.direction === "neutral" ? "text-muted-foreground" : isPositive ? "text-primary" : "text-destructive"
      }`}>
        <Icon className="h-3 w-3" />
        {v.pct}%
      </span>
    );
  };

  const kpis = [
    { label: "Receitas", value: formatCurrency(totalReceitas), icon: TrendingUp, color: "text-primary", variation: vReceitas },
    { label: "Despesas", value: formatCurrency(totalDespesas), icon: TrendingDown, color: "text-destructive", variation: vDespesas, invertColor: true },
    { label: "Saldo", value: formatCurrency(saldo), icon: DollarSign, color: saldo >= 0 ? "text-primary" : "text-destructive", variation: vSaldo },
    { label: "Conversão", value: `${conversionRate}%`, icon: Target, color: "text-primary", variation: vConversion },
    { label: "Ticket Médio", value: formatCurrency(ticketMedio), icon: FileText, color: "text-primary", variation: vTicket },
    { label: "Margem", value: `${margem}%`, icon: Award, color: margem >= 0 ? "text-primary" : "text-destructive", variation: vMargem },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada do desempenho do seu negócio</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={monthlyData.length === 0}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      {/* Period Filter with Presets */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            Período
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(p => (
              <Button
                key={p.key}
                variant={activePreset === p.key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="date"
              value={dateFrom}
              onChange={e => handleCustomDate("from", e.target.value)}
              className="w-[140px] h-8 text-xs"
            />
            <span className="text-xs text-muted-foreground">até</span>
            <Input
              type="date"
              value={dateTo}
              onChange={e => handleCustomDate("to", e.target.value)}
              className="w-[140px] h-8 text-xs"
            />
          </div>
        </div>
      </Card>

      {/* KPI Cards with Variation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <k.icon className={`h-4 w-4 ${k.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</span>
              </div>
              <VariationBadge v={k.variation} invertColor={"invertColor" in k && !!k.invertColor} />
            </div>
            <p className="text-lg font-bold tabular-nums">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Bar + Accumulated Line */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Receitas vs Despesas por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado para o período selecionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatCurrency(v), name === "receitas" ? "Receitas" : "Despesas"]}
                    contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Saldo Acumulado</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Acumulado"]}
                    contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="acumulado"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Status Pie + Top Clients */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Clients */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />Top Clientes por Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado</p>
            ) : (
              <div className="space-y-4">
                {topClients.map((c, i) => {
                  const maxVal = topClients[0]?.value || 1;
                  const pct = Math.round((c.value / maxVal) * 100);
                  const paidPct = c.value > 0 ? Math.round((c.paid / c.value) * 100) : 0;
                  return (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                          <span className="text-sm font-medium">{c.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">{c.count} orç.</Badge>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{formatCurrency(c.value)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-14 text-right">{paidPct}% pago</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4 text-destructive" />Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa</p>
            ) : (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v)]}
                      contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {categoryData.map((c, i) => {
                    const total = categoryData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
                    return (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span>{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
                          <span className="font-semibold tabular-nums">{formatCurrency(c.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Status + City Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Orçamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [v, name]}
                      contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs">{d.name}</span>
                      <span className="text-xs font-bold tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />Distribuição por Cidades e Bairros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cityData.slice(0, 9).map(c => (
                <div key={c.name} className="rounded-lg border p-3 text-center">
                  <p className="text-lg font-bold tabular-nums">{c.value}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.name}</p>
                </div>
              ))}
              {cityData.length > 9 && (
                <div className="rounded-lg border p-3 text-center bg-muted/30">
                  <p className="text-lg font-bold tabular-nums">+{cityData.length - 9}</p>
                  <p className="text-xs text-muted-foreground">outras</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
