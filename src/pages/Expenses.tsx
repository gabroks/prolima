import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { mockBudgets, mockPayments, mockSuppliers, mockExpenses } from "@/data/mock";
import { Expense } from "@/types";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Search, Pencil, Trash2, Receipt,
  ArrowUpDown, Tag, BarChart3, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";

const CATEGORIES = ["Material", "Serviço", "Fixo", "Transporte", "Alimentação", "Manutenção", "Equipamento", "Outros"] as const;

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

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const emptyForm: Partial<Expense> = { category: "Material" };

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [search, setSearch] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Expense>>(emptyForm);

  const totalEntradas = mockPayments.reduce((s, p) => s + p.amount, 0);
  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0);
  const saldo = totalEntradas - totalDespesas;
  const avgExpense = expenses.length > 0 ? totalDespesas / expenses.length : 0;

  // Category breakdown for chart
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    expenses.forEach(e => {
      const key = e.date.slice(0, 7);
      months[key] = (months[key] || 0) + e.amount;
    });
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, total]) => {
        const m = parseInt(key.split("-")[1]) - 1;
        return { month: monthNames[m], total };
      });
  }, [expenses]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = expenses.filter((e) => {
      const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.supplierName?.toLowerCase().includes(q));
      const matchBudget = budgetFilter === "all" || (budgetFilter === "none" ? !e.budgetId : e.budgetId === budgetFilter);
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchSearch && matchBudget && matchCategory;
    });

    switch (sortBy) {
      case "date-desc": result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc": result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "amount-desc": result.sort((a, b) => b.amount - a.amount); break;
      case "amount-asc": result.sort((a, b) => a.amount - b.amount); break;
    }
    return result;
  }, [expenses, search, budgetFilter, categoryFilter, sortBy]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: Expense) => { setEditingId(e.id); setForm({ ...e }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.description || !form.amount || form.amount <= 0) {
      toast.error("Informe a descrição e o valor");
      return;
    }
    const budget = mockBudgets.find((b) => b.id === form.budgetId);
    const supplier = mockSuppliers.find((s) => s.id === form.supplierId);
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? {
        ...e, ...form,
        budgetNumber: budget?.number || e.budgetNumber,
        supplierName: supplier?.name || e.supplierName,
      } as Expense : e));
      toast.success("Despesa atualizada!");
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(), budgetId: form.budgetId, budgetNumber: budget?.number,
        description: form.description!, supplierId: form.supplierId, supplierName: supplier?.name,
        category: form.category || "Material", amount: form.amount!,
        date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
      };
      setExpenses(prev => [...prev, newExpense]);
      toast.success("Despesa registrada!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setExpenses(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
    toast.success("Despesa removida!");
  };

  const categoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case "Material": return "default" as const;
      case "Fixo": return "destructive" as const;
      case "Serviço": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Controle e categorize seus gastos</p>
        </div>
        <Button onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Nova Despesa
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Entradas", value: formatCurrency(totalEntradas), icon: TrendingUp, color: "text-primary" },
          { label: "Total Despesas", value: formatCurrency(totalDespesas), icon: TrendingDown, color: "text-destructive" },
          { label: "Saldo", value: formatCurrency(saldo), icon: Wallet, color: saldo >= 0 ? "text-primary" : "text-destructive" },
          { label: "Ticket Médio", value: formatCurrency(avgExpense), icon: Tag, color: "text-muted-foreground" },
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

      {/* Category Breakdown Chart */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            Despesas por Categoria
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryBreakdown} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {categoryBreakdown.map((entry) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "hsl(var(--muted))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Monthly Trend */}
      {monthlyTrend.length > 1 && (
        <Card className="p-5">
          <p className="text-sm font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Evolução Mensal de Despesas
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), "Despesas"]} contentStyle={{ borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", fontSize: "12px", backgroundColor: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou fornecedor…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={budgetFilter} onValueChange={setBudgetFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Orçamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="none">Sem orçamento</SelectItem>
            {mockBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number}</SelectItem>)}
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Fornecedor</TableHead>
                <TableHead className="hidden md:table-cell">Orçamento</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{search || categoryFilter !== "all" || budgetFilter !== "all" ? "Nenhuma despesa encontrada" : "Nenhuma despesa registrada"}</p>
                    {!search && categoryFilter === "all" && budgetFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar primeira despesa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                        <Badge variant={categoryBadgeVariant(e.category)} className="text-[10px] h-5">{e.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">{formatDate(e.date)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={categoryBadgeVariant(e.category)}>{e.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{e.supplierName || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{e.budgetNumber || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-destructive">{formatCurrency(e.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(e.id)}>
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

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Exibindo {filtered.length} de {expenses.length} despesas
          {categoryFilter !== "all" && <> • <span className="font-medium text-foreground">{categoryFilter}</span></>}
        </span>
        <span className="font-semibold text-destructive tabular-nums">Total filtrado: {formatCurrency(filteredTotal)}</span>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            <DialogDescription>Preencha os dados da despesa.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Descrição *</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva a despesa" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category || "Material"} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
            </div>
            <div>
              <Label>Orçamento</Label>
              <Select value={form.budgetId || "none"} onValueChange={(v) => setForm({ ...form, budgetId: v === "none" ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {mockBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} — {b.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplierId || "none"} onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {mockSuppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações adicionais…" />
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
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
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
