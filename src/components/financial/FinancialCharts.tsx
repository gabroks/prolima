import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart as PieChartIcon, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const METHOD_COLORS: Record<string, string> = {
  PIX: "hsl(var(--primary))",
  Dinheiro: "hsl(var(--chart-4))",
  Cartão: "hsl(var(--chart-3))",
  Boleto: "hsl(var(--chart-5))",
  Transferência: "hsl(var(--chart-2))",
};

const tooltipStyle = {
  borderRadius: "var(--radius)",
  border: "1px solid hsl(var(--border))",
  fontSize: "12px",
  backgroundColor: "hsl(var(--card))",
};

interface Props {
  totalApproved: number;
  totalReceived: number;
  balance: number;
  receivedPct: number;
  methodBreakdown: { name: string; value: number }[];
  monthlyRevenue: { month: string; total: number }[];
}

export function FinancialCharts({ totalApproved, totalReceived, balance, receivedPct, methodBreakdown, monthlyRevenue }: Props) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold">Progresso de Recebimento</p>
              <p className="text-xs text-muted-foreground mt-0.5">{receivedPct}% do valor aprovado já foi recebido</p>
            </div>
            <span className="text-2xl font-bold tabular-nums text-primary">{receivedPct}%</span>
          </div>
          <Progress value={receivedPct} className="h-3 mb-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Aprovado</p><p className="text-sm font-semibold tabular-nums">{formatCurrency(totalApproved)}</p></div>
            <div><p className="text-xs text-muted-foreground">Recebido</p><p className="text-sm font-semibold tabular-nums text-primary">{formatCurrency(totalReceived)}</p></div>
            <div><p className="text-xs text-muted-foreground">Pendente</p><p className="text-sm font-semibold tabular-nums text-[hsl(var(--warning))]">{formatCurrency(balance)}</p></div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-3">
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />Métodos de Pagamento
          </p>
          {methodBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <RechartsPie>
                  <Pie data={methodBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25} strokeWidth={2}>
                    {methodBreakdown.map((entry) => <Cell key={entry.name} fill={METHOD_COLORS[entry.name] || "hsl(var(--muted))"} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={tooltipStyle} />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {methodBreakdown.map(m => (
                  <div key={m.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: METHOD_COLORS[m.name] }} />
                      <span>{m.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums">{formatCurrency(m.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum pagamento</p>
          )}
        </Card>
      </div>

      {monthlyRevenue.length > 1 && (
        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />Evolução Mensal de Receitas
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), "Receitas"]} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
}
