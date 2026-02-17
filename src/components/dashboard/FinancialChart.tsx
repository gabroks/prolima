import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface ChartDataPoint {
  month: string;
  receitas: number;
  despesas: number;
}

interface FinancialChartProps {
  data: ChartDataPoint[];
}

export function FinancialChart({ data }: FinancialChartProps) {
  return (
    <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "460ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Receitas vs Despesas — Últimos Meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
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
      </CardContent>
    </Card>
  );
}
