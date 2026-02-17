import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { mockClients, mockBudgets, mockPayments, mockExpenses } from "@/data/mock";
import { budgetStatusConfig, BudgetStatus, formatCurrency, formatDate } from "@/lib/formatters";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, FileText, DollarSign, Receipt,
  Target, Award, MapPin, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

export default function Reports() {
  // Revenue & expenses by month
  const monthlyData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    mockPayments.forEach(p => {
      const key = p.date.slice(0, 7); // YYYY-MM
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].receitas += p.amount;
    });
    mockExpenses.forEach(e => {
      const key = e.date.slice(0, 7);
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].despesas += e.amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const [y, m] = key.split("-");
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return { month: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`, ...val, saldo: val.receitas - val.despesas };
      });
  }, []);

  // Top clients by budget value
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; value: number; count: number; paid: number }> = {};
    mockBudgets.forEach(b => {
      if (!map[b.clientId]) map[b.clientId] = { name: b.clientName, value: 0, count: 0, paid: 0 };
      map[b.clientId].value += b.total;
      map[b.clientId].count++;
    });
    mockPayments.forEach(p => {
      const budget = mockBudgets.find(b => b.id === p.budgetId);
      if (budget && map[budget.clientId]) map[budget.clientId].paid += p.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, []);

  // Budget status distribution
  const statusData = useMemo(() => {
    return (Object.keys(budgetStatusConfig) as BudgetStatus[]).map(key => {
      const cfg = budgetStatusConfig[key];
      return {
        name: cfg.label,
        value: mockBudgets.filter(b => b.status === key).length,
      };
    }).filter(d => d.value > 0);
  }, []);

  // Expense by category
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    mockExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, []);

  // Client cities
  const cityData = useMemo(() => {
    const map: Record<string, number> = {};
    mockClients.forEach(c => {
      const city = c.city || "Sem cidade";
      map[city] = (map[city] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, []);

  // KPIs
  const totalReceitas = mockPayments.reduce((s, p) => s + p.amount, 0);
  const totalDespesas = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const saldo = totalReceitas - totalDespesas;
  const totalBudgetValue = mockBudgets.reduce((s, b) => s + b.total, 0);
  const approvedValue = mockBudgets.filter(b => b.status === "approved").reduce((s, b) => s + b.total, 0);
  const conversionRate = mockBudgets.length > 0 ? Math.round((mockBudgets.filter(b => b.status === "approved").length / mockBudgets.length) * 100) : 0;
  const ticketMedio = mockBudgets.length > 0 ? totalBudgetValue / mockBudgets.length : 0;
  const margem = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Visão consolidada do desempenho do seu negócio</p>
      </div>

      {/* KPI Row */}
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
            <div className="flex items-center gap-2 mb-2">
              <k.icon className={`h-4 w-4 ${k.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{k.label}</span>
            </div>
            <p className="text-lg font-bold tabular-nums">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue vs Expenses */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Receitas vs Despesas por Mês</CardTitle>
            <CardDescription className="text-xs">Dados calculados a partir dos pagamentos e despesas registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado para exibir</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatCurrency(v), name === "receitas" ? "Receitas" : "Despesas"]}
                    contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }}
                  />
                  <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Budget Status */}
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
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} />
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
      </div>

      {/* Charts Row 2 */}
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
                        <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">{paidPct}% pago</span>
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
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} />
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

      {/* Client Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />Distribuição de Clientes por Cidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {cityData.map((c, i) => (
              <div key={c.name} className="rounded-lg border p-3 text-center">
                <p className="text-lg font-bold tabular-nums">{c.value}</p>
                <p className="text-xs text-muted-foreground truncate">{c.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
