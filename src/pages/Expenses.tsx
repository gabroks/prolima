import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBudgets } from "@/hooks/useBudgets";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, type ExpenseForm, type DbExpense } from "@/hooks/useExpenses";
import { Plus, Search, Pencil, Trash2, Receipt, ArrowUpDown, CalendarDays } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import { toast } from "sonner";
import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCards";
import { ExpenseCharts } from "@/components/expenses/ExpenseCharts";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";

const CATEGORIES = ["Material", "Serviço", "Fixo", "Transporte", "Alimentação", "Manutenção", "Equipamento", "Outros"] as const;

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
const PAGE_SIZE = 15;
const emptyForm: Partial<ExpenseForm> = { category: "Material", date: new Date().toISOString().split("T")[0] };

export default function Expenses() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: payments = [] } = usePayments();
  const { data: budgets = [] } = useBudgets();
  const { data: suppliers = [] } = useSuppliers();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpenseMut = useDeleteExpense();

  const [search, setSearch] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ExpenseForm>>(emptyForm);

  const totalEntradas = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const saldo = totalEntradas - totalDespesas;
  const avgExpense = expenses.length > 0 ? totalDespesas / expenses.length : 0;

  // Suppliers that have expenses
  const expenseSuppliers = useMemo(() => {
    const ids = new Set(expenses.map(e => e.supplier_id).filter(Boolean));
    return suppliers.filter(s => ids.has(s.id));
  }, [expenses, suppliers]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {};
    expenses.forEach(e => { const key = e.date.slice(0, 7); months[key] = (months[key] || 0) + Number(e.amount); });
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([key, total]) => ({ month: monthNames[parseInt(key.split("-")[1]) - 1], total }));
  }, [expenses]);

  // Period boundaries
  const periodBounds = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return {
      "this-month": new Date(y, m, 1).toISOString().split("T")[0],
      "last-month": new Date(y, m - 1, 1).toISOString().split("T")[0],
      "last-month-end": new Date(y, m, 0).toISOString().split("T")[0],
      "this-quarter": new Date(y, Math.floor(m / 3) * 3, 1).toISOString().split("T")[0],
      "this-year": `${y}-01-01`,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = expenses.filter((e) => {
      const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.supplier_name?.toLowerCase().includes(q));
      const matchBudget = budgetFilter === "all" || (budgetFilter === "none" ? !e.budget_id : e.budget_id === budgetFilter);
      const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchSupplier = supplierFilter === "all" || (supplierFilter === "none" ? !e.supplier_id : e.supplier_id === supplierFilter);

      let matchPeriod = true;
      if (periodFilter === "this-month") matchPeriod = e.date >= periodBounds["this-month"];
      else if (periodFilter === "last-month") matchPeriod = e.date >= periodBounds["last-month"] && e.date <= periodBounds["last-month-end"];
      else if (periodFilter === "this-quarter") matchPeriod = e.date >= periodBounds["this-quarter"];
      else if (periodFilter === "this-year") matchPeriod = e.date >= periodBounds["this-year"];

      return matchSearch && matchBudget && matchCategory && matchSupplier && matchPeriod;
    });
    switch (sortBy) {
      case "date-desc": result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc": result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "amount-desc": result.sort((a, b) => Number(b.amount) - Number(a.amount)); break;
      case "amount-asc": result.sort((a, b) => Number(a.amount) - Number(b.amount)); break;
    }
    return result;
  }, [expenses, search, budgetFilter, categoryFilter, supplierFilter, periodFilter, sortBy, periodBounds]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const resetPage = () => setPage(0);
  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: DbExpense) => {
    setEditingId(e.id);
    setForm({
      budgetId: e.budget_id || undefined,
      budgetNumber: e.budget_number || undefined,
      description: e.description,
      supplierId: e.supplier_id || undefined,
      supplierName: e.supplier_name || undefined,
      category: e.category,
      amount: Number(e.amount),
      date: e.date,
      notes: e.notes || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.description) { toast.error("Informe a descrição da despesa"); return; }
    if (!form.amount || form.amount <= 0) { toast.error("Informe um valor válido"); return; }
    const budget = budgets.find((b) => b.id === form.budgetId);
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    const fullForm: ExpenseForm = {
      description: form.description!,
      amount: form.amount!,
      category: form.category || "Material",
      date: form.date || new Date().toISOString().split("T")[0],
      budgetId: form.budgetId,
      budgetNumber: budget?.number || form.budgetNumber,
      supplierId: form.supplierId,
      supplierName: supplier?.name || form.supplierName,
      notes: form.notes,
    };
    const onSuccess = () => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); };
    if (editingId) {
      updateExpense.mutate({ id: editingId, form: fullForm }, { onSuccess });
    } else {
      createExpense.mutate(fullForm, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteExpenseMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const categoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case "Material": return "default" as const;
      case "Fixo": return "destructive" as const;
      case "Serviço": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

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

      <ExpenseSummaryCards totalEntradas={totalEntradas} totalDespesas={totalDespesas} saldo={saldo} avgExpense={avgExpense} />
      <ExpenseCharts categoryBreakdown={categoryBreakdown} monthlyTrend={monthlyTrend} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição ou fornecedor…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={(v) => { setSupplierFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos fornecedores</SelectItem>
            <SelectItem value="none">Sem fornecedor</SelectItem>
            {expenseSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[150px]">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="this-month">Este mês</SelectItem>
            <SelectItem value="last-month">Mês passado</SelectItem>
            <SelectItem value="this-quarter">Trimestre</SelectItem>
            <SelectItem value="this-year">Este ano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={budgetFilter} onValueChange={(v) => { setBudgetFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Orçamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="none">Sem orçamento</SelectItem>
            {budgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number}</SelectItem>)}
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
                    <p>
                      {search || categoryFilter !== "all" || budgetFilter !== "all" || supplierFilter !== "all" || periodFilter !== "all"
                        ? "Nenhuma despesa encontrada"
                        : "Nenhuma despesa registrada"}
                    </p>
                    {!search && categoryFilter === "all" && budgetFilter === "all" && supplierFilter === "all" && periodFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar primeira despesa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : paged.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
                        <AvatarFallback className="bg-destructive/10 text-destructive text-xs font-semibold">
                          {getInitials(e.description)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{e.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                          <Badge variant={categoryBadgeVariant(e.category)} className="text-[10px] h-5">{e.category}</Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(e.date)}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={categoryBadgeVariant(e.category)}>{e.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{e.supplier_name || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{e.budget_number || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{formatDate(e.date)}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-destructive">{formatCurrency(Number(e.amount))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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

      {/* Pagination */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-muted-foreground">
          Exibindo {filtered.length > 0 ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} despesas
          {categoryFilter !== "all" && <> • <span className="font-medium text-foreground">{categoryFilter}</span></>}
          {supplierFilter !== "all" && supplierFilter !== "none" && <> • <span className="font-medium text-foreground">{expenseSuppliers.find(s => s.id === supplierFilter)?.name}</span></>}
          {periodFilter !== "all" && <> • <span className="font-medium text-foreground">{periodFilter === "this-month" ? "Este mês" : periodFilter === "last-month" ? "Mês passado" : periodFilter === "this-quarter" ? "Trimestre" : "Este ano"}</span></>}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-destructive tabular-nums">Total filtrado: {formatCurrency(filteredTotal)}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próximo</Button>
            </div>
          )}
        </div>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        editingId={editingId}
        budgets={budgets}
        suppliers={suppliers}
        isSaving={createExpense.isPending || updateExpense.isPending}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const expense = deleteId ? expenses.find(e => e.id === deleteId) : null;
                if (expense) {
                  return `"${expense.description}" — ${formatCurrency(Number(expense.amount))}. Esta ação não pode ser desfeita.`;
                }
                return "Esta ação não pode ser desfeita.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteExpenseMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteExpenseMut.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}