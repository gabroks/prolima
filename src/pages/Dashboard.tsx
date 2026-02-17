import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockClients, mockMaterials, mockBudgets, mockPayments, mockExpenses } from "@/data/mock";
import { Users, Package, FileText, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const budgetsThisMonth = mockBudgets.filter(b => b.status !== "draft").length;
  const totalBudgetValue = mockBudgets.filter(b => b.status !== "draft").reduce((s, b) => s + b.total, 0);

  const summaryCards = [
    { title: "Clientes", value: mockClients.length, icon: Users, color: "text-primary", onClick: () => navigate("/clientes") },
    { title: "Materiais", value: mockMaterials.length, icon: Package, color: "text-info", onClick: () => navigate("/materiais") },
    { title: "Orçamentos", value: mockBudgets.length, icon: FileText, color: "text-warning", onClick: () => navigate("/orcamentos") },
    { title: "Saldo", value: `R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: saldo >= 0 ? "text-primary" : "text-destructive", onClick: () => navigate("/financeiro") },
  ];

  const statusCounts = {
    draft: mockBudgets.filter(b => b.status === "draft").length,
    issued: mockBudgets.filter(b => b.status === "issued").length,
    approved: mockBudgets.filter(b => b.status === "approved").length,
    rejected: mockBudgets.filter(b => b.status === "rejected").length,
  };
  const statusTotal = Math.max(mockBudgets.length, 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={card.onClick}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receitas e Despesas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">Total Receitas</span>
              </div>
              <span className="font-semibold text-primary">R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm">Total Despesas</span>
              </div>
              <span className="font-semibold text-destructive">R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempenho do Mês</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Orçamentos emitidos</span>
              <span className="font-semibold">{budgetsThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Potencial de receita</span>
              <span className="font-semibold">R$ {totalBudgetValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receitas vs Despesas (Últimos 6 Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Legend />
              <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 64%, 32%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status dos Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            { label: "Rascunho", count: statusCounts.draft, color: "bg-muted-foreground" },
            { label: "Emitido", count: statusCounts.issued, color: "bg-[hsl(var(--info))]" },
            { label: "Aprovado", count: statusCounts.approved, color: "bg-primary" },
            { label: "Rejeitado", count: statusCounts.rejected, color: "bg-destructive" },
          ]).map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{s.label}</span>
                <span className="font-medium">{s.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${(s.count / statusTotal) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
