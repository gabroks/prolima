import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageLoading, PageError, TableEmpty } from "@/components/shared/PageStates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBudgets } from "@/hooks/useBudgets";
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, type ExpenseForm, type DbExpense } from "@/hooks/useExpenses";
import { Plus, Search, Pencil, Trash2, Receipt, ArrowUpDown, CalendarDays, Download } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";
import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCards";
import { ExpenseCharts } from "@/components/expenses/ExpenseCharts";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";

const CATEGORIES = ["Material", "Serviço", "Fixo", "Transporte", "Alimentação", "Manutenção", "Equipamento", "Outros"] as const;

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
const PAGE_SIZE = 15;
const emptyForm: Partial<ExpenseForm> = { category: "Material", date: new Date().toISOString().split("T")[0] };

export default function Expenses() {
  const { data: expenses = [], isLoading, isError } = useExpenses();
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

  // Month-over-month comparison
  const monthComparison = useMemo(() => {
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const curTotal = expenses.filter(e => e.date.startsWith(curMonth)).reduce((s, e) => s + Number(e.amount), 0);
    const prevTotal = expenses.filter(e => e.date.startsWith(prevMonth)).reduce((s, e) => s + Number(e.amount), 0);
    const curCount = expenses.filter(e => e.date.startsWith(curMonth)).length;
    return { curTotal, prevTotal, curCount, diff: prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0 };
  }, [expenses]);

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
      const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.supplier_name?.toLowerCase().includes(q)) || (e.notes?.toLowerCase().includes(q)) || (e.budget_number?.includes(q));
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

  const activeFiltersCount = [categoryFilter !== "all", supplierFilter !== "all", budgetFilter !== "all", periodFilter !== "all", !!search].filter(Boolean).length;

  const expenseToDelete = useMemo(() => {
    if (!deleteId) return null;
    return expenses.find(e => e.id === deleteId) || null;
  }, [deleteId, expenses]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") { openNew(); setSearchParams({}, { replace: true }); }
  }, [searchParams]);
  const openEdit = (e: DbExpense) => {
    setEditingId(e.id);
    setForm({
      budgetId: e.budget_id || undefined, budgetNumber: e.budget_number || undefined,
      description: e.description, supplierId: e.supplier_id || undefined,
      supplierName: e.supplier_name || undefined, category: e.category,
      amount: Number(e.amount), date: e.date, notes: e.notes || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.description) { toast.error("Informe a descrição da despesa"); return; }
    if (!form.amount || form.amount <= 0) { toast.error("Informe um valor válido"); return; }
    const budget = budgets.find((b) => b.id === form.budgetId);
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    const fullForm: ExpenseForm = {
      description: form.description!, amount: form.amount!,
      category: form.category || "Material",
      date: form.date || new Date().toISOString().split("T")[0],
      budgetId: form.budgetId, budgetNumber: budget?.number || form.budgetNumber,
      supplierId: form.supplierId, supplierName: supplier?.name || form.supplierName,
      notes: form.notes,
    };
    const onSuccess = () => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); };
    if (editingId) { updateExpense.mutate({ id: editingId, form: fullForm }, { onSuccess }); }
    else { createExpense.mutate(fullForm, { onSuccess }); }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteExpenseMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const clearFilters = () => { setSearch(""); setCategoryFilter("all"); setSupplierFilter("all"); setBudgetFilter("all"); setPeriodFilter("all"); resetPage(); };

  const exportCSV = useCallback(() => {
    exportToCSV({
      headers: ["Data", "Descrição", "Categoria", "Fornecedor", "Orçamento", "Valor", "Observações"],
      rows: filtered.map(e => [
        e.date, e.description, e.category, e.supplier_name || "",
        e.budget_number || "", String(e.amount), e.notes || "",
      ]),
      filename: "despesas",
      successMessage: `${filtered.length} despesas exportadas`,
    });
  }, [filtered]);

  const categoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case "Material": return "default" as const;
      case "Fixo": return "destructive" as const;
      case "Serviço": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  if (isLoading) return <PageLoading />;
  if (isError) return <PageError icon={Receipt} title="Erro ao carregar despesas" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle e categorize seus gastos
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-primary font-medium">• {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          )}
          <Button onClick={openNew} className="shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />Nova Despesa
          </Button>
        </div>
      </div>

      <ExpenseSummaryCards totalEntradas={totalEntradas} totalDespesas={totalDespesas} saldo={saldo} avgExpense={avgExpense} monthComparison={monthComparison} />
      <ExpenseCharts categoryBreakdown={categoryBreakdown} monthlyTrend={monthlyTrend} />

      <FilterBar
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
        searchInput={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar descrição, fornecedor, notas, nº orçamento…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
          </div>
        }
        filters={<>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={supplierFilter} onValueChange={(v) => { setSupplierFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="Fornecedor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos fornecedores</SelectItem>
              <SelectItem value="none">Sem fornecedor</SelectItem>
              {expenseSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[150px]">
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
            <SelectTrigger className="w-full md:w-[170px]"><SelectValue placeholder="Orçamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="none">Sem orçamento</SelectItem>
              {budgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-full md:w-[160px]">
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
        </>}
      />

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
                <TableEmpty icon={Receipt} colSpan={7} hasFilters={activeFiltersCount > 0} emptyMessage="Nenhuma despesa registrada" filteredMessage="Nenhuma despesa encontrada com os filtros aplicados" createLabel="Registrar primeira despesa" onClearFilters={clearFilters} onCreate={openNew} />
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
                        {e.notes && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{e.notes}</p>}
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

      <PaginationFooter
        page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE}
        onPageChange={setPage} label="despesas"
        extraInfo={<span className="text-xs font-semibold text-destructive tabular-nums">Total filtrado: {formatCurrency(filteredTotal)}</span>}
        filterSummary={activeFiltersCount > 0 ? [categoryFilter !== "all" && categoryFilter, supplierFilter !== "all" && supplierFilter !== "none" && expenseSuppliers.find(s => s.id === supplierFilter)?.name, supplierFilter === "none" && "Sem fornecedor", periodFilter !== "all" && (periodFilter === "this-month" ? "Este mês" : periodFilter === "last-month" ? "Mês passado" : periodFilter === "this-quarter" ? "Trimestre" : "Este ano"), budgetFilter !== "all" && budgetFilter !== "none" && `Orç. ${budgets.find(b => b.id === budgetFilter)?.number}`, budgetFilter === "none" && "Sem orçamento", search && `"${search}"`].filter(Boolean).join(", ") : undefined}
      />

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

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir despesa?" isDeleting={deleteExpenseMut.isPending}
        description={<>{expenseToDelete && <span className="block mb-2 font-medium text-foreground">"{expenseToDelete.description}" — {formatCurrency(Number(expenseToDelete.amount))}{expenseToDelete.supplier_name && ` • ${expenseToDelete.supplier_name}`}{expenseToDelete.budget_number && ` • Orç. ${expenseToDelete.budget_number}`}</span>}Esta ação não pode ser desfeita. A despesa será removida permanentemente.</>}
      />
    </div>
  );
}
