import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/hooks/useClients";
import { useMaterials } from "@/hooks/useMaterials";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import {
  Users, Package, FileText, DollarSign, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, FilePlus, Clock, AlertCircle,
  UserPlus, Receipt, CalendarClock, Sparkles, ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency, formatDate, budgetStatusConfig, BudgetStatus } from "@/lib/formatters";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: materials = [] } = useMaterials();
  const { data: budgets = [], isLoading: loadingBudgets } = useBudgets();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();

  const isLoading = loadingClients || loadingBudgets;

  const totalReceitas = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  const approvedBudgets = budgets.filter(b => b.status === "approved");
  const totalApproved = approvedBudgets.reduce((s, b) => s + Number(b.total), 0);
  const pendingBudgets = budgets.filter(b => b.status === "issued" || b.status === "draft");
  const recentBudgets = useMemo(() => [...budgets].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5), [budgets]);

  const statusEntries = Object.entries(budgetStatusConfig).map(([key, config]) => ({
    key, ...config, count: budgets.filter(b => b.status === key).length,
  }));

  const chartData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    payments.forEach(p => { const key = p.date.slice(0, 7); if (!months[key]) months[key] = { receitas: 0, despesas: 0 }; months[key].receitas += Number(p.amount); });
    expenses.forEach(e => { const key = e.date.slice(0, 7); if (!months[key]) months[key] = { receitas: 0, despesas: 0 }; months[key].despesas += Number(e.amount); });
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => {
      const m = parseInt(key.split("-")[1]) - 1;
      return { month: monthNames[m], ...val };
    });
  }, [payments, expenses]);

  const summaryCards = [
    { title: "Clientes", value: clients.length, subtitle: `${clients.filter(c => c.status === "active").length} ativos`, icon: Users, trend: null, trendUp: true, href: "/clientes" },
    { title: "Materiais", value: materials.length, subtitle: "no catálogo", icon: Package, trend: null, trendUp: true, href: "/materiais" },
    { title: "Orçamentos", value: budgets.length, subtitle: `${approvedBudgets.length} aprovados`, icon: FileText, trend: `${pendingBudgets.length} pendentes`, trendUp: true, href: "/orcamentos" },
    { title: "Saldo", value: formatCurrency(saldo), subtitle: saldo >= 0 ? "Positivo" : "Negativo", icon: saldo >= 0 ? TrendingUp : TrendingDown, trend: saldo >= 0 ? "Saudável" : "Atenção", trendUp: saldo >= 0, href: "/financeiro" },
  ];

  const quickActions = [
    { label: "Novo Orçamento", icon: FilePlus, href: "/novo-orcamento", primary: true },
    { label: "Novo Cliente", icon: UserPlus, href: "/clientes" },
    { label: "Registrar Despesa", icon: Receipt, href: "/despesas" },
    { label: "Ver Financeiro", icon: DollarSign, href: "/financeiro" },
  ];

  const activityFeed = useMemo(() => {
    const items = [
      ...payments.map(p => ({ id: `pay-${p.id}`, type: "payment" as const, title: `Pagamento recebido — ${p.client_name}`, subtitle: formatCurrency(Number(p.amount)), date: p.date, icon: DollarSign, iconBg: "bg-primary/10 text-primary" })),
      ...expenses.map(e => ({ id: `exp-${e.id}`, type: "expense" as const, title: `Despesa — ${e.description}`, subtitle: formatCurrency(Number(e.amount)), date: e.date, icon: Receipt, iconBg: "bg-destructive/10 text-destructive" })),
      ...budgets.map(b => ({ id: `bud-${b.id}`, type: "budget" as const, title: `Orçamento ${b.number} — ${b.client_name}`, subtitle: budgetStatusConfig[b.status as BudgetStatus]?.label, date: b.created_at, icon: FileText, iconBg: "bg-info/10 text-[hsl(var(--info))]" })),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    return items;
  }, [payments, expenses, budgets]);

  const conversionRate = budgets.length > 0 ? Math.round((approvedBudgets.length / budgets.length) * 100) : 0;

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">{getGreeting()}! <Sparkles className="h-5 w-5 text-primary" /></h2>
          <p className="text-sm text-muted-foreground mt-0.5">Você tem <span className="font-semibold text-foreground">{pendingBudgets.length}</span> orçamento{pendingBudgets.length !== 1 && "s"} pendente{pendingBudgets.length !== 1 && "s"} hoje</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {quickActions.map(a => (
            <Button key={a.label} variant={a.primary ? "default" : "outline"} size="sm" className={a.primary ? "shadow-md shadow-primary/20" : ""} onClick={() => navigate(a.href)}>
              <a.icon className="h-4 w-4 mr-1.5" /><span className="hidden sm:inline">{a.label}</span><span className="sm:hidden">{a.label.split(" ")[0]}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <Card key={card.title} className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group animate-slide-up" onClick={() => navigate(card.href)} style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200"><card.icon className="h-5 w-5" /></div>
                {card.trend && <div className={`hidden sm:flex items-center gap-1 text-[11px] font-medium ${card.trendUp ? "text-primary" : "text-destructive"}`}>{card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}<span>{card.trend}</span></div>}
              </div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight">{card.value}</div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-slide-up" style={{ animationDelay: "250ms", animationFillMode: "backwards" }}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium mb-2">Taxa de Conversão</p>
            <div className="flex items-end gap-2 mb-3"><span className="text-3xl font-bold tracking-tight">{conversionRate}%</span><span className="text-xs text-muted-foreground mb-1">aprovados</span></div>
            <Progress value={conversionRate} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-2">{approvedBudgets.length} de {budgets.length} orçamentos convertidos</p>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "310ms", animationFillMode: "backwards" }}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium mb-2">Ticket Médio</p>
            <div className="flex items-end gap-2 mb-3"><span className="text-3xl font-bold tracking-tight tabular-nums">{formatCurrency(budgets.length > 0 ? budgets.reduce((s, b) => s + Number(b.total), 0) / budgets.length : 0)}</span></div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: "370ms", animationFillMode: "backwards" }}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium mb-2">Pendências</p>
            <div className="space-y-2.5">
              {pendingBudgets.length > 0 ? pendingBudgets.slice(0, 3).map(b => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                return (
                  <div key={b.id} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -mx-1 px-1 rounded transition-colors" onClick={() => navigate("/orcamentos")}>
                    <div className="flex items-center gap-2 min-w-0"><AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--warning))] shrink-0" /><span className="text-sm truncate">{b.number} — {b.client_name}</span></div>
                    <Badge variant={st.variant} className="text-[10px] h-5 shrink-0 ml-2">{st.label}</Badge>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground">Nenhuma pendência 🎉</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Resumo Financeiro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-primary" /><span className="text-sm">Receitas</span></div><span className="text-sm font-semibold text-primary tabular-nums">{formatCurrency(totalReceitas)}</span></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-destructive" /><span className="text-sm">Despesas</span></div><span className="text-sm font-semibold text-destructive tabular-nums">{formatCurrency(totalDespesas)}</span></div>
              <Separator />
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Saldo</span><span className={`text-base font-bold tabular-nums ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(saldo)}</span></div>
            </div>
            <div className="pt-3 border-t space-y-2.5">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Orçamentos aprovados</span><span className="font-semibold tabular-nums">{formatCurrency(totalApproved)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Margem estimada</span><span className="font-semibold tabular-nums text-primary">{totalReceitas > 0 ? `${Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100)}%` : "—"}</span></div>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs mt-2" onClick={() => navigate("/financeiro")}>Ver relatório completo <ChevronRight className="h-3.5 w-3.5 ml-1" /></Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "460ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Receitas vs Despesas — Últimos Meses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [formatCurrency(v), name]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
                <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-slide-up" style={{ animationDelay: "520ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status dos Orçamentos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {statusEntries.map((s) => {
              const pct = Math.max((s.count / Math.max(budgets.length, 1)) * 100, s.count > 0 ? 8 : 0);
              return (
                <div key={s.key} className="space-y-1.5">
                  <div className="flex justify-between text-sm"><div className="flex items-center gap-2"><div className={`h-2.5 w-2.5 rounded-full ${s.bg}`} /><span className="font-medium">{s.label}</span></div><span className="font-semibold tabular-nums">{s.count}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${s.bg} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "580ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />Orçamentos Recentes</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-primary hover:text-primary" onClick={() => navigate("/orcamentos")}>Ver todos →</Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentBudgets.map((b) => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                return (
                  <div key={b.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors cursor-pointer" onClick={() => navigate("/orcamentos")}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold">{b.number}</span><Badge variant={st.variant} className="text-[10px] px-1.5 h-5">{st.label}</Badge></div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{b.client_name}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(Number(b.total))}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{formatDate(b.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-slide-up" style={{ animationDelay: "640ms", animationFillMode: "backwards" }}>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><CalendarClock className="h-4 w-4 text-muted-foreground" />Atividade Recente</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-md ${item.iconBg} shrink-0 mt-0.5`}><item.icon className="h-3.5 w-3.5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5"><span className="text-xs font-medium text-muted-foreground">{item.subtitle}</span><span className="text-[10px] text-muted-foreground tabular-nums">• {formatDate(item.date)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
