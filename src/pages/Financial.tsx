import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { mockBudgets, mockPayments, mockExpenses } from "@/data/mock";
import { Payment } from "@/types";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Search, Pencil, Trash2,
  CreditCard, ArrowUpDown, CheckCircle2, AlertCircle, PieChart,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão", "Boleto", "Transferência"];

const METHOD_COLORS: Record<string, string> = {
  PIX: "hsl(var(--primary))",
  Dinheiro: "hsl(var(--chart-4))",
  Cartão: "hsl(var(--chart-3))",
  Boleto: "hsl(var(--chart-5))",
  Transferência: "hsl(var(--chart-2))",
};

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const emptyForm: Partial<Payment> = { method: "PIX" };

export default function Financial() {
  const approvedBudgets = mockBudgets.filter((b) => b.status === "approved");
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Payment>>(emptyForm);

  const totalApproved = approvedBudgets.reduce((s, b) => s + b.total, 0);
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalApproved - totalReceived;
  const profit = totalReceived - totalExpenses;
  const receivedPct = totalApproved > 0 ? Math.round((totalReceived / totalApproved) * 100) : 0;

  // Method breakdown for pie chart
  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.method] = (map[p.method] || 0) + p.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    let result = payments.filter(p => {
      const matchSearch = !q || p.clientName.toLowerCase().includes(q) || p.budgetNumber.toLowerCase().includes(q);
      const matchMethod = methodFilter === "all" || p.method === methodFilter;
      return matchSearch && matchMethod;
    });
    switch (sortBy) {
      case "date-desc": result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc": result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "amount-desc": result.sort((a, b) => b.amount - a.amount); break;
      case "amount-asc": result.sort((a, b) => a.amount - b.amount); break;
    }
    return result;
  }, [payments, search, methodFilter, sortBy]);

  const filteredBudgets = useMemo(() => {
    const q = search.toLowerCase();
    return approvedBudgets.filter(b =>
      !q || b.clientName.toLowerCase().includes(q) || b.number.toLowerCase().includes(q)
    );
  }, [search, approvedBudgets]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Payment) => { setEditingId(p.id); setForm({ ...p }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.budgetId || !form.amount || form.amount <= 0) {
      toast.error("Selecione um orçamento e informe o valor");
      return;
    }
    const budget = approvedBudgets.find((b) => b.id === form.budgetId);
    if (editingId) {
      setPayments(prev => prev.map(p => p.id === editingId ? { ...p, ...form, budgetNumber: budget?.number || p.budgetNumber, clientName: budget?.clientName || p.clientName } as Payment : p));
      toast.success("Pagamento atualizado!");
    } else {
      const newPayment: Payment = {
        id: Date.now().toString(), budgetId: form.budgetId!, budgetNumber: budget?.number || "",
        clientName: budget?.clientName || "", amount: form.amount!, method: form.method || "PIX",
        date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
      };
      setPayments(prev => [...prev, newPayment]);
      toast.success("Pagamento registrado!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setPayments(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Pagamento removido!");
  };

  const methodBadgeVariant = (method: string) => {
    switch (method) {
      case "PIX": return "default" as const;
      case "Cartão": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Controle de pagamentos e receitas</p>
        </div>
        <Button onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Registrar Pagamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Orç. Aprovados", value: formatCurrency(totalApproved), icon: DollarSign, color: "text-primary" },
          { label: "Total Recebido", value: formatCurrency(totalReceived), icon: TrendingUp, color: "text-primary" },
          { label: "A Receber", value: formatCurrency(balance), icon: balance > 0 ? AlertCircle : CheckCircle2, color: balance > 0 ? "text-[hsl(var(--warning))]" : "text-primary" },
          { label: "Lucro Líquido", value: formatCurrency(profit), icon: profit >= 0 ? TrendingUp : TrendingDown, color: profit >= 0 ? "text-primary" : "text-destructive" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold tabular-nums truncate">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Progress + Method Breakdown */}
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
            <div>
              <p className="text-xs text-muted-foreground">Aprovado</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(totalApproved)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="text-sm font-semibold tabular-nums text-primary">{formatCurrency(totalReceived)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendente</p>
              <p className="text-sm font-semibold tabular-nums text-[hsl(var(--warning))]">{formatCurrency(balance)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-3">
            <PieChart className="h-4 w-4 text-muted-foreground" />
            Métodos de Pagamento
          </p>
          {methodBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <RechartsPie>
                  <Pie data={methodBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} innerRadius={25} strokeWidth={2}>
                    {methodBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={METHOD_COLORS[entry.name] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} />
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

      {/* Search + Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou número…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Método" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Mais recente</SelectItem>
            <SelectItem value="date-asc">Mais antigo</SelectItem>
            <SelectItem value="amount-desc">Maior valor</SelectItem>
            <SelectItem value="amount-asc">Menor valor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos ({payments.length})</TabsTrigger>
          <TabsTrigger value="budgets">Orçamentos Aprovados ({approvedBudgets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orçamento</TableHead>
                    <TableHead className="hidden md:table-cell">Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden sm:table-cell">Método</TableHead>
                    <TableHead className="hidden md:table-cell">Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>{search || methodFilter !== "all" ? "Nenhum pagamento encontrado" : "Nenhum pagamento registrado"}</p>
                        {!search && methodFilter === "all" && (
                          <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar primeiro pagamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium font-mono text-xs">{p.budgetNumber}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{p.clientName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{p.clientName}</TableCell>
                      <TableCell className="tabular-nums font-semibold text-primary">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={methodBadgeVariant(p.method)}>{p.method}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="hidden sm:table-cell">Recebido</TableHead>
                    <TableHead className="hidden sm:table-cell">Progresso</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>Nenhum orçamento aprovado</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBudgets.map((b) => {
                    const received = payments.filter(p => p.budgetId === b.id).reduce((s, p) => s + p.amount, 0);
                    const pending = b.total - received;
                    const pct = b.total > 0 ? Math.round((received / b.total) * 100) : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium font-mono text-xs">{b.number}</TableCell>
                        <TableCell>{b.clientName}</TableCell>
                        <TableCell className="tabular-nums font-medium">{formatCurrency(b.total)}</TableCell>
                        <TableCell className="hidden sm:table-cell tabular-nums text-primary">{formatCurrency(received)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs tabular-nums font-medium w-8 text-right">{pct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {pending <= 0 ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Quitado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-[hsl(var(--warning))]">
                              {formatCurrency(pending)}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Exibindo {filteredPayments.length} de {payments.length} pagamentos
        {methodFilter !== "all" && <> • Filtro: <span className="font-medium text-foreground">{methodFilter}</span></>}
      </p>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Pagamento" : "Registrar Pagamento"}</DialogTitle>
            <DialogDescription>Preencha os dados do pagamento.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Orçamento *</Label>
              <Select value={form.budgetId || ""} onValueChange={(v) => setForm({ ...form, budgetId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um orçamento" /></SelectTrigger>
                <SelectContent>{approvedBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} — {b.clientName} ({formatCurrency(b.total)})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.method || "PIX"} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações do pagamento…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
