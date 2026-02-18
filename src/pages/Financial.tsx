import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments, useCreatePayment, useUpdatePayment, useDeletePayment, type PaymentForm, type DbPayment } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { Plus, Search, Pencil, Trash2, CreditCard, ArrowUpDown, CheckCircle2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import { FinancialSummaryCards } from "@/components/financial/FinancialSummaryCards";
import { FinancialCharts } from "@/components/financial/FinancialCharts";
import { PaymentFormDialog } from "@/components/financial/PaymentFormDialog";

const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão", "Boleto", "Transferência"];
type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
const PAGE_SIZE = 15;

export default function Financial() {
  const { data: budgets = [], isLoading: lb } = useBudgets();
  const { data: payments = [], isLoading: lp } = usePayments();
  const { data: expenses = [] } = useExpenses();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePaymentMut = useDeletePayment();

  const approvedBudgets = budgets.filter(b => b.status === "approved");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PaymentForm>>({ method: "PIX", date: new Date().toISOString().split("T")[0] });

  const totalApproved = approvedBudgets.reduce((s, b) => s + Number(b.total), 0);
  const totalReceived = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalApproved - totalReceived;
  const profit = totalReceived - totalExpenses;
  const receivedPct = totalApproved > 0 ? Math.round((totalReceived / totalApproved) * 100) : 0;
  const profitMargin = totalReceived > 0 ? ((profit / totalReceived) * 100).toFixed(1) : "0.0";

  // Month-over-month
  const monthComparison = useMemo(() => {
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const curTotal = payments.filter(p => p.date.startsWith(curMonth)).reduce((s, p) => s + Number(p.amount), 0);
    const prevTotal = payments.filter(p => p.date.startsWith(prevMonth)).reduce((s, p) => s + Number(p.amount), 0);
    const curCount = payments.filter(p => p.date.startsWith(curMonth)).length;
    return { curTotal, prevTotal, curCount, diff: prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0 };
  }, [payments]);

  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.method] = (map[p.method] || 0) + Number(p.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    payments.forEach(p => { const key = p.date.slice(0, 7); months[key] = (months[key] || 0) + Number(p.amount); });
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ month: monthNames[parseInt(key.split("-")[1]) - 1], total }));
  }, [payments]);

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

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase();
    let result = payments.filter(p => {
      const matchSearch = !q || p.client_name.toLowerCase().includes(q) || p.budget_number.toLowerCase().includes(q) || (p.notes?.toLowerCase().includes(q));
      const matchMethod = methodFilter === "all" || p.method === methodFilter;
      let matchPeriod = true;
      if (periodFilter === "this-month") matchPeriod = p.date >= periodBounds["this-month"];
      else if (periodFilter === "last-month") matchPeriod = p.date >= periodBounds["last-month"] && p.date <= periodBounds["last-month-end"];
      else if (periodFilter === "this-quarter") matchPeriod = p.date >= periodBounds["this-quarter"];
      else if (periodFilter === "this-year") matchPeriod = p.date >= periodBounds["this-year"];
      return matchSearch && matchMethod && matchPeriod;
    });
    switch (sortBy) {
      case "date-desc": result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc": result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "amount-desc": result.sort((a, b) => Number(b.amount) - Number(a.amount)); break;
      case "amount-asc": result.sort((a, b) => Number(a.amount) - Number(b.amount)); break;
    }
    return result;
  }, [payments, search, methodFilter, periodFilter, sortBy, periodBounds]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const pagedPayments = useMemo(() => filteredPayments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filteredPayments, page]);
  const resetPage = () => setPage(0);
  const filteredTotal = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);

  const activeFiltersCount = [methodFilter !== "all", periodFilter !== "all", !!search].filter(Boolean).length;

  const filteredBudgets = useMemo(() => {
    const q = search.toLowerCase();
    return approvedBudgets.filter(b => !q || b.client_name.toLowerCase().includes(q) || b.number.toLowerCase().includes(q));
  }, [search, approvedBudgets]);

  const paymentToDelete = useMemo(() => {
    if (!deleteId) return null;
    return payments.find(p => p.id === deleteId) || null;
  }, [deleteId, payments]);

  const openNew = () => { setEditingId(null); setForm({ method: "PIX", date: new Date().toISOString().split("T")[0] }); setDialogOpen(true); };
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

  const methodBadgeVariant = (m: string) => {
    switch (m) { case "PIX": return "default" as const; case "Cartão": return "outline" as const; default: return "secondary" as const; }
  };

  if (lb || lp) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-64" />
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
        <Button onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Registrar Pagamento
        </Button>
      </div>

      <FinancialSummaryCards totalApproved={totalApproved} totalReceived={totalReceived} balance={balance} profit={profit} profitMargin={profitMargin} monthComparison={monthComparison} />
      <FinancialCharts totalApproved={totalApproved} totalReceived={totalReceived} balance={balance} receivedPct={receivedPct} methodBreakdown={methodBreakdown} monthlyRevenue={monthlyRevenue} />

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente, nº orçamento, notas…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Método" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearFilters}>Limpar filtros</Button>
        )}
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
                        <p>{activeFiltersCount > 0 ? "Nenhum pagamento encontrado" : "Nenhum pagamento registrado"}</p>
                        {activeFiltersCount === 0 && (
                          <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar primeiro pagamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : pagedPayments.map(p => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(p.client_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium font-mono text-xs">{p.budget_number}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{p.client_name}</p>
                            {p.notes && <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{p.notes}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{p.client_name}</TableCell>
                      <TableCell className="tabular-nums font-semibold text-primary">{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={methodBadgeVariant(p.method)}>{p.method}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                        Nenhum orçamento aprovado
                      </TableCell>
                    </TableRow>
                  ) : filteredBudgets.map(b => {
                    const received = payments.filter(p => p.budget_id === b.id).reduce((s, p) => s + Number(p.amount), 0);
                    const pending = Number(b.total) - received;
                    const pct = Number(b.total) > 0 ? Math.round((received / Number(b.total)) * 100) : 0;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium font-mono text-xs">{b.number}</TableCell>
                        <TableCell>{b.client_name}</TableCell>
                        <TableCell className="tabular-nums font-medium">{formatCurrency(Number(b.total))}</TableCell>
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
                            <Badge variant="outline" className="text-xs">{formatCurrency(pending)}</Badge>
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

      <PaginationFooter
        page={page} totalPages={totalPages} totalItems={filteredPayments.length} pageSize={PAGE_SIZE}
        onPageChange={setPage} label="pagamentos"
        extraInfo={<span className="text-xs font-semibold text-primary tabular-nums">Total filtrado: {formatCurrency(filteredTotal)}</span>}
        filterSummary={activeFiltersCount > 0 ? [methodFilter !== "all" && methodFilter, periodFilter !== "all" && (periodFilter === "this-month" ? "Este mês" : periodFilter === "last-month" ? "Mês passado" : periodFilter === "this-quarter" ? "Trimestre" : "Este ano"), search && `"${search}"`].filter(Boolean).join(", ") : undefined}
      />

      <PaymentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        editingId={editingId}
        approvedBudgets={approvedBudgets}
        payments={payments}
        isSaving={createPayment.isPending || updatePayment.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir pagamento?" isDeleting={deletePaymentMut.isPending}
        description={<>{paymentToDelete && <span className="block mb-2 font-medium text-foreground">"{paymentToDelete.client_name}" — {formatCurrency(Number(paymentToDelete.amount))} via {paymentToDelete.method}{paymentToDelete.budget_number && ` • Orç. ${paymentToDelete.budget_number}`}</span>}Esta ação não pode ser desfeita. O pagamento será removido permanentemente.</>}
      />
    </div>
  );
}
