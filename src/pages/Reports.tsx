import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, FileText, DollarSign, Receipt,
  Target, Award, MapPin, CalendarRange, X, Download,
} from "lucide-react";
import { toast } from "sonner";

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))",
  "hsl(var(--chart-2))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))",
];

function getDefaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return {
    from: start.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
}

export default function Reports() {
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: budgets = [], isLoading: lb } = useBudgets();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();

  const defaults = getDefaultRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const hasFilter = dateFrom !== defaults.from || dateTo !== defaults.to;

  const clearFilter = () => { setDateFrom(defaults.from); setDateTo(defaults.to); };

  const isLoading = lc || lb;

  // Filter data by date range
  const filteredPayments = useMemo(() => payments.filter(p => p.date >= dateFrom && p.date <= dateTo), [payments, dateFrom, dateTo]);
  const filteredExpenses = useMemo(() => expenses.filter(e => e.date >= dateFrom && e.date <= dateTo), [expenses, dateFrom, dateTo]);
  const filteredBudgets = useMemo(() => budgets.filter(b => b.created_at.slice(0, 10) >= dateFrom && b.created_at.slice(0, 10) <= dateTo), [budgets, dateFrom, dateTo]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    filteredPayments.forEach(p => { const key = p.date.slice(0, 7); if (!months[key]) months[key] = { receitas: 0, despesas: 0 }; months[key].receitas += Number(p.amount); });
    filteredExpenses.forEach(e => { const key = e.date.slice(0, 7); if (!months[key]) months[key] = { receitas: 0, despesas: 0 }; months[key].despesas += Number(e.amount); });
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => {
      const [y, m] = key.split("-");
      return { month: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`, ...val, saldo: val.receitas - val.despesas };
    });
  }, [filteredPayments, filteredExpenses]);

  const topClients = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number; paid: number }> = {};
    filteredBudgets.forEach(b => { if (!map[b.client_id || b.client_name]) map[b.client_id || b.client_name] = { name: b.client_name, value: 0, count: 0, paid: 0 }; map[b.client_id || b.client_name].value += Number(b.total); map[b.client_id || b.client_name].count++; });
    filteredPayments.forEach(p => { const budget = budgets.find(b => b.id === p.budget_id); if (budget) { const key = budget.client_id || budget.client_name; if (map[key]) map[key].paid += Number(p.amount); } });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredBudgets, filteredPayments, budgets]);

  const statusData = useMemo(() => (Object.keys(budgetStatusConfig) as BudgetStatus[]).map(key => ({ name: budgetStatusConfig[key].label, value: filteredBudgets.filter(b => b.status === key).length })).filter(d => d.value > 0), [filteredBudgets]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    clients.forEach(c => { const city = c.city || "Sem cidade"; map[city] = (map[city] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const totalReceitas = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalReceitas - totalDespesas;
  const totalBudgetValue = filteredBudgets.reduce((s, b) => s + Number(b.total), 0);
  const conversionRate = filteredBudgets.length > 0 ? Math.round((filteredBudgets.filter(b => b.status === "approved").length / filteredBudgets.length) * 100) : 0;
  const ticketMedio = filteredBudgets.length > 0 ? totalBudgetValue / filteredBudgets.length : 0;
  const margem = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0;

  const handleExportCSV = () => {
    const rows = [["Mês", "Receitas", "Despesas", "Saldo"]];
    monthlyData.forEach(d => rows.push([d.month, d.receitas.toFixed(2), d.despesas.toFixed(2), d.saldo.toFixed(2)]));
    rows.push([]);
    rows.push(["Indicador", "Valor"]);
    rows.push(["Total Receitas", totalReceitas.toFixed(2)]);
    rows.push(["Total Despesas", totalDespesas.toFixed(2)]);
    rows.push(["Saldo", saldo.toFixed(2)]);
    rows.push(["Conversão", `${conversionRate}%`]);
    rows.push(["Ticket Médio", ticketMedio.toFixed(2)]);
    rows.push(["Margem", `${margem}%`]);
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
    toast.success("Relatório exportado com sucesso!");
  };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold">Relatórios</h2><p className="text-sm text-muted-foreground mt-0.5">Visão consolidada do desempenho do seu negócio</p></div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={monthlyData.length === 0}>
          <Download className="h-4 w-4 mr-1.5" />Exportar CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            Período
          </div>
          <div className="flex items-end gap-3 flex-wrap flex-1">
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px] h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px] h-9" />
            </div>
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilter} className="h-9 text-xs text-muted-foreground">
                <X className="h-3.5 w-3.5 mr-1" />Limpar
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Receitas", value: formatCurrency(totalReceitas), icon: TrendingUp, color: "text-primary" },
          { label: "Despesas", value: formatCurrency(totalDespesas), icon: TrendingDown, color: "text-destructive" },
          { label: "Saldo", value: formatCurrency(saldo), icon: DollarSign, color: saldo >= 0 ? "text-primary" : "text-destructive" },
          { label: "Conversão", value: `${conversionRate}%`, icon: Target, color: "text-primary" },
          { label: "Ticket Médio", value: formatCurrency(ticketMedio), icon: FileText, color: "text-primary" },
          { label: "Margem", value: `${margem}%`, icon: Award, color: margem >= 0 ? "text-primary" : "text-destructive" },
        ].map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-2 mb-2"><k.icon className={`h-4 w-4 ${k.color}`} /><span className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</span></div>
            <p className="text-lg font-bold tabular-nums">{k.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Receitas vs Despesas por Mês</CardTitle></CardHeader><CardContent>
          {monthlyData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado para exibir</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name === "receitas" ? "Receitas" : "Despesas"]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Orçamentos por Status</CardTitle></CardHeader><CardContent>
          {statusData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">Sem dados</p> : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">{statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} /></PieChart></ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3">{statusData.map((d, i) => <div key={d.name} className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} /><span className="text-xs">{d.name}</span><span className="text-xs font-bold tabular-nums">{d.value}</span></div>)}</div>
            </div>
          )}
        </CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Top Clientes por Valor</CardTitle></CardHeader><CardContent>
          {topClients.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado</p> : (
            <div className="space-y-4">{topClients.map((c, i) => { const maxVal = topClients[0]?.value || 1; const pct = Math.round((c.value / maxVal) * 100); const paidPct = c.value > 0 ? Math.round((c.paid / c.value) * 100) : 0; return (
              <div key={c.name} className="space-y-1.5">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span><span className="text-sm font-medium">{c.name}</span><Badge variant="outline" className="text-[9px] h-4 px-1">{c.count} orç.</Badge></div><span className="text-sm font-bold tabular-nums">{formatCurrency(c.value)}</span></div>
                <div className="flex items-center gap-2"><div className="flex-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div><span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">{paidPct}% pago</span></div>
              </div>); })}</div>
          )}
        </CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-destructive" />Despesas por Categoria</CardTitle></CardHeader><CardContent>
          {categoryData.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa</p> : (
            <div className="flex flex-col gap-4">
              <ResponsiveContainer width="100%" height={180}><PieChart><Pie data={categoryData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} dataKey="value">{categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} /></PieChart></ResponsiveContainer>
              <div className="space-y-2">{categoryData.map((c, i) => { const total = categoryData.reduce((s, d) => s + d.value, 0); const pct = total > 0 ? Math.round((c.value / total) * 100) : 0; return (
                <div key={c.name} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} /><span>{c.name}</span></div><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground tabular-nums">{pct}%</span><span className="font-semibold tabular-nums">{formatCurrency(c.value)}</span></div></div>); })}</div>
            </div>
          )}
        </CardContent></Card>
      </div>

      <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Distribuição de Clientes por Cidade</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{cityData.map((c) => <div key={c.name} className="rounded-lg border p-3 text-center"><p className="text-lg font-bold tabular-nums">{c.value}</p><p className="text-xs text-muted-foreground truncate">{c.name}</p></div>)}</div>
      </CardContent></Card>
    </div>
  );
}
