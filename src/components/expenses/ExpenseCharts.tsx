import { Card } from "@/components/ui/card";
import { BarChart3, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  Material: "hsl(var(--primary))",
  Serviço: "hsl(var(--chart-3))",
  Fixo: "hsl(var(--chart-2))",
  Transporte: "hsl(var(--chart-4))",
  Alimentação: "hsl(var(--chart-5))",
  Manutenção: "hsl(var(--chart-1))",
  Equipamento: "hsl(var(--chart-3))",
  Outros: "hsl(var(--muted-foreground))",
};

interface Props {
  categoryBreakdown: { name: string; value: number }[];
  monthlyTrend: { month: string; total: number }[];
}

export function ExpenseCharts({ categoryBreakdown, monthlyTrend }: Props) {
  const tooltipStyle = {
    borderRadius: "var(--radius)",
    border: "1px solid hsl(var(--border))",
    fontSize: "12px",
    backgroundColor: "hsl(var(--card))",
  };

  return (
    <>
      {categoryBreakdown.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />Despesas por Categoria
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryBreakdown} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {categoryBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "hsl(var(--muted))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {monthlyTrend.length > 1 && (
        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />Evolução Mensal de Despesas
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), "Despesas"]} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
}
