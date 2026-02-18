import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudgets, useBudgetCount, useUpdateBudgetStatus, useDeleteBudget, useDuplicateBudget, type BudgetWithItems } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import {
  Search, FileText, CheckCircle, XCircle, Clock, Eye, Copy, FilePlus,
  ArrowUpDown, DollarSign, TrendingUp, Send, AlertCircle, Trash2, Download, Pencil,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { formatCurrency, formatDate, budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { downloadBudgetPdf } from "@/lib/generateBudgetPdf";

type SortKey = "date-desc" | "date-asc" | "value-desc" | "value-asc" | "client" | "number";
const PAGE_SIZE = 15;

export default function Budgets() {
  const navigate = useNavigate();
  const { data: budgets = [], isLoading } = useBudgets();
  const { data: budgetCount = 0 } = useBudgetCount();
  const { data: payments = [] } = usePayments();
  const updateStatus = useUpdateBudgetStatus();
  const deleteBudget = useDeleteBudget();
  const duplicateBudget = useDuplicateBudget();
  const { data: companySettings } = useCompanySettings();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(0);
  const [detailBudget, setDetailBudget] = useState<BudgetWithItems | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = budgets.filter((b) => {
      const matchSearch = !q || b.client_name.toLowerCase().includes(q) || b.number.toLowerCase().includes(q) || b.service_description?.toLowerCase().includes(q) || b.general_notes?.toLowerCase().includes(q) || b.payment_terms?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
    switch (sortBy) {
      case "date-desc": result.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case "date-asc": result.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "value-desc": result.sort((a, b) => Number(b.total) - Number(a.total)); break;
      case "value-asc": result.sort((a, b) => Number(a.total) - Number(b.total)); break;
      case "client": result.sort((a, b) => a.client_name.localeCompare(b.client_name)); break;
      case "number": result.sort((a, b) => a.number.localeCompare(b.number)); break;
    }
    return result;
  }, [budgets, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const resetPage = () => setPage(0);

  const totalValue = filtered.reduce((s, b) => s + Number(b.total), 0);
  const counts = {
    total: budgets.length,
    approved: budgets.filter(b => b.status === "approved").length,
    issued: budgets.filter(b => b.status === "issued").length,
    draft: budgets.filter(b => b.status === "draft").length,
    rejected: budgets.filter(b => b.status === "rejected").length,
  };
  const approvedValue = budgets.filter(b => b.status === "approved").reduce((s, b) => s + Number(b.total), 0);
  const conversionRate = budgets.length > 0 ? Math.round((counts.approved / budgets.length) * 100) : 0;

  // Month-over-month comparison
  const monthComparison = useMemo(() => {
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const curCount = budgets.filter(b => b.created_at.startsWith(curMonth)).length;
    const prevCount = budgets.filter(b => b.created_at.startsWith(prevMonth)).length;
    const curValue = budgets.filter(b => b.created_at.startsWith(curMonth)).reduce((s, b) => s + Number(b.total), 0);
    const prevValue = budgets.filter(b => b.created_at.startsWith(prevMonth)).reduce((s, b) => s + Number(b.total), 0);
    return {
      curCount, prevCount, curValue, prevValue,
      countDiff: curCount - prevCount,
      valueDiff: prevValue > 0 ? ((curValue - prevValue) / prevValue) * 100 : 0,
    };
  }, [budgets]);

  const paymentsMap = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { if (p.budget_id) map[p.budget_id] = (map[p.budget_id] || 0) + Number(p.amount); });
    return map;
  }, [payments]);

  const activeFiltersCount = [statusFilter !== "all", !!search].filter(Boolean).length;

  const budgetToDelete = useMemo(() => {
    if (!deleteId) return null;
    return budgets.find(b => b.id === deleteId) || null;
  }, [deleteId, budgets]);

  const changeStatus = (id: string, newStatus: BudgetStatus) => {
    updateStatus.mutate({ id, status: newStatus });
    const label = budgetStatusConfig[newStatus].label;
    toast.success(`Status alterado para ${label}`);
    if (detailBudget?.id === id) setDetailBudget(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const handleDuplicate = (budget: BudgetWithItems) => {
    const newNumber = `ORC-${String(budgetCount + 1).padStart(3, "0")}`;
    duplicateBudget.mutate({ budget, newNumber });
    setDetailBudget(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBudget.mutate(deleteId, { onSuccess: () => { setDeleteId(null); setDetailBudget(null); } });
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); resetPage(); };

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Orçamentos</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie e acompanhe todos os orçamentos
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-primary font-medium">• {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <Button onClick={() => navigate("/novo-orcamento")} className="shadow-md shadow-primary/20"><FilePlus className="h-4 w-4 mr-2" />Novo Orçamento</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total", value: counts.total, icon: FileText, color: "text-primary",
            sub: `${formatCurrency(totalValue)} total`,
            trend: monthComparison.countDiff !== 0 ? `${monthComparison.countDiff > 0 ? "+" : ""}${monthComparison.countDiff} este mês` : null,
            trendUp: monthComparison.countDiff >= 0,
          },
          { label: "Aprovados", value: counts.approved, icon: CheckCircle, color: "text-primary", sub: formatCurrency(approvedValue) },
          {
            label: "Pendentes", value: counts.issued + counts.draft, icon: Clock, color: "text-warning",
            sub: `${counts.issued} emitido${counts.issued !== 1 ? "s" : ""}, ${counts.draft} rascunho${counts.draft !== 1 ? "s" : ""}`,
          },
          {
            label: "Conversão", value: `${conversionRate}%`, icon: TrendingUp, color: "text-primary",
            sub: `${counts.approved} de ${counts.total}`,
            extra: counts.rejected > 0 ? `${counts.rejected} rejeitado${counts.rejected !== 1 ? "s" : ""}` : null,
          },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold tabular-nums">{c.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.sub}</p>
                {"trend" in c && c.trend && (
                  <p className={`text-[10px] flex items-center gap-0.5 ${c.trendUp ? "text-primary" : "text-destructive"}`}>
                    {c.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {c.trend}
                  </p>
                )}
                {"extra" in c && c.extra && (
                  <p className="text-[10px] text-destructive">{c.extra}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, número, descrição, notas…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="issued">Emitidos</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
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
            <SelectItem value="value-desc">Maior valor</SelectItem>
            <SelectItem value="value-asc">Menor valor</SelectItem>
            <SelectItem value="client">Cliente A-Z</SelectItem>
            <SelectItem value="number">Número</SelectItem>
          </SelectContent>
        </Select>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearFilters}>Limpar filtros</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Recebido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{activeFiltersCount > 0 ? "Nenhum orçamento encontrado" : "Nenhum orçamento cadastrado"}</p>
                    {activeFiltersCount === 0 && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/novo-orcamento")}>
                        <FilePlus className="h-3.5 w-3.5 mr-1.5" />Criar primeiro orçamento
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : paged.map((b) => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                const paid = paymentsMap[b.id] || 0;
                const paidPct = Number(b.total) > 0 ? Math.min(100, Math.round((paid / Number(b.total)) * 100)) : 0;
                return (
                  <TableRow key={b.id} className="group cursor-pointer" onClick={() => setDetailBudget(b)}>
                    <TableCell className="font-medium font-mono text-xs">{b.number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{b.client_name}</p>
                        {b.service_description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.service_description}</p>}
                        <p className="text-xs text-muted-foreground md:hidden">{formatDate(b.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{formatDate(b.created_at)}</TableCell>
                    <TableCell className="tabular-nums font-semibold text-sm">{formatCurrency(Number(b.total))}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {b.status === "approved" && paid > 0 ? (
                        <div className="space-y-1">
                          <span className="text-xs tabular-nums text-primary">{formatCurrency(paid)}</span>
                          <Progress value={paidPct} className="h-1.5 w-16" />
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailBudget(b)} title="Ver detalhes"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/editar-orcamento/${b.id}`)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadBudgetPdf(b, companySettings).then(() => toast.success("PDF gerado!"))} title="Baixar PDF"><Download className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(b)} disabled={duplicateBudget.isPending} title="Duplicar"><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(b.id)} disabled={deleteBudget.isPending} title="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationFooter
        page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE}
        onPageChange={setPage} label="orçamentos"
        extraInfo={<span className="text-xs font-semibold text-primary tabular-nums">Total filtrado: {formatCurrency(totalValue)}</span>}
        filterSummary={activeFiltersCount > 0 ? [statusFilter !== "all" && budgetStatusConfig[statusFilter as BudgetStatus]?.label, search && `"${search}"`].filter(Boolean).join(", ") : undefined}
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailBudget} onOpenChange={() => setDetailBudget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailBudget && (() => {
            const st = budgetStatusConfig[detailBudget.status as BudgetStatus];
            const paid = paymentsMap[detailBudget.id] || 0;
            const paidPct = Number(detailBudget.total) > 0 ? Math.min(100, Math.round((paid / Number(detailBudget.total)) * 100)) : 0;
            const items = detailBudget.budget_items || [];
            return (
              <>
                <div className="flex items-center gap-3"><DialogTitle className="font-mono">{detailBudget.number}</DialogTitle><Badge variant={st.variant}>{st.label}</Badge></div>
                <DialogDescription>{detailBudget.client_name} • {detailBudget.service_description || "Sem descrição"}</DialogDescription>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-[11px] text-muted-foreground uppercase tracking-wide">Cliente</span><p className="font-medium mt-0.5">{detailBudget.client_name}</p></div>
                  <div><span className="text-[11px] text-muted-foreground uppercase tracking-wide">Data</span><p className="font-medium mt-0.5">{formatDate(detailBudget.created_at)}</p></div>
                  <div><span className="text-[11px] text-muted-foreground uppercase tracking-wide">Validade</span><p className="font-medium mt-0.5">{detailBudget.validity_date ? formatDate(detailBudget.validity_date) : "—"}</p></div>
                  <div><span className="text-[11px] text-muted-foreground uppercase tracking-wide">Entrega</span><p className="font-medium mt-0.5">{detailBudget.delivery_date ? formatDate(detailBudget.delivery_date) : "—"}</p></div>
                </div>
                {detailBudget.status === "approved" && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Pagamento</span><span className="tabular-nums font-medium">{formatCurrency(paid)} de {formatCurrency(Number(detailBudget.total))}</span></div>
                    <Progress value={paidPct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{paidPct}% recebido</span><span>Restante: {formatCurrency(Number(detailBudget.total) - paid)}</span></div>
                  </div>
                )}
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Itens ({items.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Material</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Dimensões</TableHead>
                          <TableHead className="text-xs">Qtd</TableHead>
                          <TableHead className="text-xs">Unit.</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => {
                          const area = item.unit === "m²" && Number(item.width) > 0 && Number(item.height) > 0 ? (Number(item.width) / 100) * (Number(item.height) / 100) : 0;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="text-xs"><div><p className="font-medium">{item.material_name}</p>{item.notes && <p className="text-muted-foreground">{item.notes}</p>}</div></TableCell>
                              <TableCell className="text-xs hidden sm:table-cell">{Number(item.width) > 0 && Number(item.height) > 0 ? <div><span className="tabular-nums">{Number(item.width)} × {Number(item.height)} cm</span>{area > 0 && <p className="text-[10px] text-muted-foreground tabular-nums">= {area.toFixed(2)} m²</p>}</div> : "—"}</TableCell>
                              <TableCell className="text-xs tabular-nums">{item.qty} {item.unit}</TableCell>
                              <TableCell className="text-xs tabular-nums">{formatCurrency(Number(item.unit_price))}</TableCell>
                              <TableCell className="text-xs tabular-nums text-right font-medium">{formatCurrency(Number(item.total))}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatCurrency(Number(detailBudget.subtotal))}</span></div>
                  {Number(detailBudget.total_discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="tabular-nums text-destructive">− {formatCurrency(Number(detailBudget.total_discount))}</span></div>}
                  {Number(detailBudget.freight) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="tabular-nums">+ {formatCurrency(Number(detailBudget.freight))}</span></div>}
                  {Number(detailBudget.other_costs) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Outros custos</span><span className="tabular-nums">+ {formatCurrency(Number(detailBudget.other_costs))}</span></div>}
                  <Separator /><div className="flex justify-between font-bold text-base"><span>TOTAL</span><span className="text-primary tabular-nums">{formatCurrency(Number(detailBudget.total))}</span></div>
                </div>
                {detailBudget.payment_terms && <div className="text-sm"><span className="text-muted-foreground">Pagamento: </span><span className="font-medium">{detailBudget.payment_terms}</span></div>}
                {detailBudget.general_notes && <div className="text-sm"><span className="text-muted-foreground">Observações: </span><span>{detailBudget.general_notes}</span></div>}
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Ações</h4>
                  <div className="flex gap-2 flex-wrap">
                    {(["draft", "issued", "approved", "rejected"] as BudgetStatus[]).filter(s => s !== detailBudget.status).map(s => {
                      const cfg = budgetStatusConfig[s];
                      const icons: Record<string, typeof Send> = { draft: FileText, issued: Send, approved: CheckCircle, rejected: XCircle };
                      const Icon = icons[s] || AlertCircle;
                      return <Button key={s} variant="outline" size="sm" onClick={() => changeStatus(detailBudget.id, s)}><Icon className="h-3.5 w-3.5 mr-1.5" />{cfg.label}</Button>;
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="default" size="sm" onClick={() => downloadBudgetPdf(detailBudget, companySettings).then(() => toast.success("PDF gerado!"))}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />Baixar PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDetailBudget(null); navigate(`/editar-orcamento/${detailBudget.id}`); }}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(detailBudget)} disabled={duplicateBudget.isPending}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />Duplicar
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDeleteId(detailBudget.id); }} disabled={deleteBudget.isPending}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />Excluir
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir orçamento?" isDeleting={deleteBudget.isPending}
        description={<>{budgetToDelete && <span className="block mb-2 font-medium text-foreground">"{budgetToDelete.number}" — {budgetToDelete.client_name} — {formatCurrency(Number(budgetToDelete.total))}{budgetToDelete.service_description && <span className="block text-xs text-muted-foreground mt-0.5">{budgetToDelete.service_description}</span>}</span>}{(() => { const paid = deleteId ? paymentsMap[deleteId] || 0 : 0; if (paid > 0) return `⚠️ Este orçamento possui ${formatCurrency(paid)} em pagamentos vinculados. `; return ""; })()}Esta ação excluirá o orçamento e todos os seus itens permanentemente. Esta ação não pode ser desfeita.</>}
      />
    </div>
  );
}
