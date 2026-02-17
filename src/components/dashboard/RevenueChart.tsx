import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { BarChart3 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface RevenueChartProps {
  payments: Tables<"payments">[];
  expenses: Tables<"expenses">[];
}

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function RevenueChart({ payments, expenses }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const months: Record<string, { receitas: number; despesas: number }> = {};
    payments.forEach((p) => {
      const key = p.date.slice(0, 7);
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].receitas += Number(p.amount);
    });
    expenses.forEach((e) => {
      const key = e.date.slice(0, 7);
      if (!months[key]) months[key] = { receitas: 0, despesas: 0 };
      months[key].despesas += Number(e.amount);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, val]) => ({
        month: MONTH_NAMES[parseInt(key.split("-")[1]) - 1],
        ...val,
      }));
  }, [payments, expenses]);

  return (
    <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "460ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Receitas vs Despesas — Últimos Meses</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
            <BarChart3 className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Sem dados financeiros</p>
            <p className="text-xs mt-1">Registre pagamentos ou despesas para ver o gráfico</p>
          </div>
        ) : (
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
              <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
