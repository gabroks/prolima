import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import { Users, Receipt, MapPin, Truck, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(var(--chart-3))", "hsl(var(--chart-4))",
  "hsl(var(--chart-2))", "hsl(var(--chart-5))", "hsl(var(--muted-foreground))",
];

const tooltipStyle = {
  borderRadius: "var(--radius)",
  border: "1px solid hsl(var(--border))",
  fontSize: "12px",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

const tickStyle = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const yAxisFormatter = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);

interface MonthlyData {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
  acumulado: number;
}

interface TopClient {
  name: string;
  value: number;
  count: number;
  paid: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface TopSupplier {
  name: string;
  total: number;
  count: number;
}

interface Props {
  monthlyData: MonthlyData[];
  topClients: TopClient[];
  statusData: ChartData[];
  categoryData: ChartData[];
  cityData: ChartData[];
  topSuppliers: TopSupplier[];
  paymentMethodData: ChartData[];
}

export function ReportCharts({
  monthlyData, topClients, statusData, categoryData, cityData, topSuppliers, paymentMethodData,
}: Props) {
  return (
    <>
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
                  <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={50} tickFormatter={yAxisFormatter} />
                  <Tooltip
                    formatter={(v: number, name: string) => [formatCurrency(v), name === "receitas" ? "Receitas" : "Despesas"]}
                    contentStyle={tooltipStyle}
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
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={yAxisFormatter} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), "Acumulado"]} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Top Clients + Expense Categories */}
      <div className="grid gap-4 lg:grid-cols-2">
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
                    <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={tooltipStyle} />
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

      {/* Charts Row 3: Status + City */}
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
                    <Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={tooltipStyle} />
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

      {/* Charts Row 4: Top Suppliers + Payment Methods (NEW) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />Top Fornecedores por Despesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa com fornecedor</p>
            ) : (
              <div className="space-y-4">
                {topSuppliers.map((s, i) => {
                  const maxVal = topSuppliers[0]?.total || 1;
                  const pct = Math.round((s.total / maxVal) * 100);
                  return (
                    <div key={s.name} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}.</span>
                          <span className="text-sm font-medium">{s.name}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">{s.count} desp.</Badge>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{formatCurrency(s.total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-chart-3 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />Recebimentos por Método
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum pagamento</p>
            ) : (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} dataKey="value">
                      {paymentMethodData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {paymentMethodData.map((c, i) => {
                    const total = paymentMethodData.reduce((s, d) => s + d.value, 0);
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
    </>
  );
}
