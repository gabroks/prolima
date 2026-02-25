import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { FilterBar } from "@/components/shared/FilterBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatePayment, useUpdatePayment, useDeletePayment, type PaymentForm, type DbPayment } from "@/hooks/usePayments";
import { useFinancialData, useFilteredPayments, type SortKey } from "@/hooks/useFinancialData";
import { Plus, Search, ArrowUpDown, CalendarDays, Download } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";
import { formatCurrency } from "@/lib/formatters";
import { FinancialSummaryCards } from "@/components/financial/FinancialSummaryCards";
import { FinancialCharts } from "@/components/financial/FinancialCharts";
import { PaymentFormDialog } from "@/components/financial/PaymentFormDialog";
import { PaymentsTable } from "@/components/financial/PaymentsTable";
import { BudgetsFinancialTable } from "@/components/financial/BudgetsFinancialTable";

const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão", "Boleto", "Transferência"];
const PAGE_SIZE = 15;

export default function Financial() {
  const {
    budgets, payments, approvedBudgets,
    isLoading, isError,
    totals, monthComparison, methodBreakdown, monthlyRevenue, periodBounds,
  } = useFinancialData();

  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePaymentMut = useDeletePayment();

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PaymentForm>>({ method: "PIX", date: new Date().toISOString().split("T")[0] });

  const filteredPayments = useFilteredPayments(payments, periodBounds, { search, methodFilter, periodFilter, sortBy });

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const pagedPayments = useMemo(() => filteredPayments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filteredPayments, page]);
  const resetPage = () => setPage(0);
  const filteredTotal = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const activeFiltersCount = [methodFilter !== "all", periodFilter !== "all", !!search].filter(Boolean).length;

  const paymentToDelete = useMemo(() => {
    if (!deleteId) return null;
    return payments.find(p => p.id === deleteId) || null;
  }, [deleteId, payments]);

  const openNew = () => { setEditingId(null); setForm({ method: "PIX", date: new Date().toISOString().split("T")[0] }); setDialogOpen(true); };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") { openNew(); setSearchParams({}, { replace: true }); }
  }, [searchParams]);

  const openEdit = (p: DbPayment) => {
    setEditingId(p.id);
    setForm({ budgetId: p.budget_id || "", budgetNumber: p.budget_number, clientName: p.client_name, amount: Number(p.amount), method: p.method, date: p.date, notes: p.notes || undefined });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.budgetId || !form.amount || form.amount <= 0) { toast.error("Selecione um orçamento e informe o valor"); return; }
    const budget = approvedBudgets.find(b => b.id === form.budgetId);
    const fullForm: PaymentForm = {
      budgetId: form.budgetId!, budgetNumber: budget?.number || form.budgetNumber || "",
      clientName: budget?.client_name || form.clientName || "", amount: form.amount!,
      method: form.method || "PIX", date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
    };
    const onSuccess = () => { setDialogOpen(false); setForm({ method: "PIX" }); setEditingId(null); };
    if (editingId) { updatePayment.mutate({ id: editingId, form: fullForm }, { onSuccess }); }
    else { createPayment.mutate(fullForm, { onSuccess }); }
  };

  const handleDelete = () => { if (!deleteId) return; deletePaymentMut.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); };
  const clearFilters = () => { setSearch(""); setMethodFilter("all"); setPeriodFilter("all"); resetPage(); };

  const exportPaymentsCSV = useCallback(() => {
    exportToCSV({
      headers: ["Data", "Cliente", "Orçamento", "Valor", "Método", "Observações"],
      rows: filteredPayments.map(p => [p.date, p.client_name, p.budget_number, String(p.amount), p.method, p.notes || ""]),
      filename: "pagamentos",
      successMessage: `${filteredPayments.length} pagamentos exportados`,
    });
  }, [filteredPayments]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CalendarDays className="h-10 w-10 text-destructive mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">Erro ao carregar dados financeiros</h3>
        <p className="text-sm text-muted-foreground mt-1">Verifique sua conexão e tente novamente.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Financeiro</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle de pagamentos e receitas
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-primary font-medium">• {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredPayments.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportPaymentsCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          )}
          <Button onClick={openNew} className="shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />Registrar Pagamento
          </Button>
        </div>
      </div>

      <FinancialSummaryCards totalApproved={totals.totalApproved} totalReceived={totals.totalReceived} balance={totals.balance} profit={totals.profit} profitMargin={totals.profitMargin} monthComparison={monthComparison} />
      <FinancialCharts totalApproved={totals.totalApproved} totalReceived={totals.totalReceived} balance={totals.balance} receivedPct={totals.receivedPct} methodBreakdown={methodBreakdown} monthlyRevenue={monthlyRevenue} />

      <FilterBar
        activeFiltersCount={activeFiltersCount}
        onClearFilters={clearFilters}
        searchInput={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente, nº orçamento, notas…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
          </div>
        }
        filters={<>
          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Método" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Pagamentos ({payments.length})</TabsTrigger>
          <TabsTrigger value="budgets">Orçamentos ({budgets.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="payments">
          <PaymentsTable payments={pagedPayments} activeFiltersCount={activeFiltersCount} onOpenNew={openNew} onEdit={openEdit} onDelete={setDeleteId} onClearFilters={clearFilters} />
        </TabsContent>
        <TabsContent value="budgets">
          <BudgetsFinancialTable budgets={budgets} payments={payments} search={search} />
        </TabsContent>
      </Tabs>

      <PaginationFooter
        page={page} totalPages={totalPages} totalItems={filteredPayments.length} pageSize={PAGE_SIZE}
        onPageChange={setPage} label="pagamentos"
        extraInfo={<span className="text-xs font-semibold text-primary tabular-nums">Total filtrado: {formatCurrency(filteredTotal)}</span>}
        filterSummary={activeFiltersCount > 0 ? [methodFilter !== "all" && methodFilter, periodFilter !== "all" && (periodFilter === "this-month" ? "Este mês" : periodFilter === "last-month" ? "Mês passado" : periodFilter === "this-quarter" ? "Trimestre" : "Este ano"), search && `"${search}"`].filter(Boolean).join(", ") : undefined}
      />

      <PaymentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} form={form} setForm={setForm} onSave={handleSave} editingId={editingId} approvedBudgets={approvedBudgets} payments={payments} isSaving={createPayment.isPending || updatePayment.isPending} />

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir pagamento?" isDeleting={deletePaymentMut.isPending}
        description={<>{paymentToDelete && <span className="block mb-2 font-medium text-foreground">"{paymentToDelete.client_name}" — {formatCurrency(Number(paymentToDelete.amount))} via {paymentToDelete.method}{paymentToDelete.budget_number && ` • Orç. ${paymentToDelete.budget_number}`}</span>}Esta ação não pode ser desfeita. O pagamento será removido permanentemente.</>}
      />
    </div>
  );
}
