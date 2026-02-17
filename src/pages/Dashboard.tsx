import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockClients, mockMaterials, mockBudgets, mockPayments, mockExpenses } from "@/data/mock";
import {
  Users, Package, FileText, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, FilePlus, Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, budgetStatusConfig } from "@/lib/formatters";

const chartData = [
  { month: "Set", receitas: 3200, despesas: 1800 },
  { month: "Out", receitas: 5100, despesas: 2400 },
  { month: "Nov", receitas: 4300, despesas: 3100 },
  { month: "Dez", receitas: 6700, despesas: 2800 },
  { month: "Jan", receitas: 4500, despesas: 3300 },
  { month: "Fev", receitas: 7200, despesas: 3500 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const totalReceitas = mockPayments.reduce((s, p) => s + p.amount, 0);
  const totalDespesas = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  const approvedBudgets = mockBudgets.filter(b => b.status === "approved");
  const totalApproved = approvedBudgets.reduce((s, b) => s + b.total, 0);
  const issuedCount = mockBudgets.filter(b => b.status !== "draft").length;
  const totalBudgetValue = mockBudgets.filter(b => b.status !== "draft").reduce((s, b) => s + b.total, 0);

  const recentBudgets = [...mockBudgets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const summaryCards = [
    {
      title: "Clientes",
      value: mockClients.length,
      subtitle: `${mockClients.filter(c => c.status === "active").length} ativos`,
      icon: Users,
      trend: "+2 este mês",
      trendUp: true,
      href: "/clientes",
    },
    {
      title: "Materiais",
      value: mockMaterials.length,
      subtitle: "no catálogo",
      icon: Package,
      trend: null,
      trendUp: true,
      href: "/materiais",
    },
    {
      title: "Orçamentos",
      value: mockBudgets.length,
      subtitle: `${approvedBudgets.length} aprovados`,
      icon: FileText,
      trend: `${issuedCount} emitidos`,
      trendUp: true,
      href: "/orcamentos",
    },
    {
      title: "Saldo",
      value: formatCurrency(saldo),
      subtitle: saldo >= 0 ? "Positivo" : "Negativo",
      icon: DollarSign,
      trend: saldo >= 0 ? "Saudável" : "Atenção",
      trendUp: saldo >= 0,
      href: "/financeiro",
    },
  ];

  const statusEntries = Object.entries(budgetStatusConfig).map(([key, config]) => ({
    key,
    ...config,
    count: mockBudgets.filter(b => b.status === key).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu negócio</p>
        </div>
        <Button onClick={() => navigate("/novo-orcamento")} className="shadow-md shadow-primary/20">
          <FilePlus className="h-4 w-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <Card
            key={card.title}
            className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group animate-slide-up"
            onClick={() => navigate(card.href)}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                  <card.icon className="h-5 w-5" />
                </div>
                {card.trend && (
                  <div className={`hidden sm:flex items-center gap-1 text-[11px] font-medium ${card.trendUp ? "text-primary" : "text-destructive"}`}>
                    {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{card.trend}</span>
                  </div>
                )}
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight">{card.value}</div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary + Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
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
                <span className="text-muted-foreground">Potencial de receita</span>
                <span className="font-semibold tabular-nums">{formatCurrency(totalBudgetValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "260ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Receitas vs Despesas — Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number, name: string) => [formatCurrency(v), name]}
                  contentStyle={{
                    borderRadius: "var(--radius)",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                    backgroundColor: "hsl(var(--card))",
                  }}
                  cursor={{ fill: "hsl(var(--muted))", radius: 4 }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status + Recent Budgets */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="animate-slide-up" style={{ animationDelay: "320ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Status dos Orçamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusEntries.map((s) => {
              const pct = Math.max((s.count / Math.max(mockBudgets.length, 1)) * 100, s.count > 0 ? 8 : 0);
              return (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${s.bg}`} />
                      <span className="font-medium">{s.label}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{s.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.bg} transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: "380ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Orçamentos Recentes
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary" onClick={() => navigate("/orcamentos")}>
              Ver todos →
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentBudgets.map((b) => {
                const st = budgetStatusConfig[b.status as keyof typeof budgetStatusConfig];
                return (
                  <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{b.number}</span>
                        <Badge variant={st.variant} className="text-[10px] px-1.5 h-5">
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{b.clientName}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(b.total)}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{formatDate(b.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
