import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockBudgets } from "@/data/mock";
import { Budget } from "@/types";
import { Search, FileText, CheckCircle, XCircle, Clock, Eye, Copy, FilePlus } from "lucide-react";
import { formatCurrency, formatDate, budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);

  const filtered = budgets
    .filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = b.clientName.toLowerCase().includes(q) || b.number.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalValue = filtered.reduce((s, b) => s + b.total, 0);
  const counts = {
    total: budgets.length,
    approved: budgets.filter(b => b.status === "approved").length,
    issued: budgets.filter(b => b.status === "issued").length,
    draft: budgets.filter(b => b.status === "draft").length,
  };

  const changeStatus = (id: string, newStatus: BudgetStatus) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    const label = budgetStatusConfig[newStatus].label;
    toast.success(`Status alterado para ${label}`);
    if (detailBudget?.id === id) {
      setDetailBudget(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const duplicate = (budget: Budget) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      number: `ORC-${String(budgets.length + 1).padStart(3, "0")}`,
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setBudgets(prev => [newBudget, ...prev]);
    toast.success(`Orçamento duplicado como ${newBudget.number}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Orçamentos</h2>
        <Button onClick={() => navigate("/novo-orcamento")}><FilePlus className="h-4 w-4 mr-2" />Novo Orçamento</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, icon: FileText, color: "text-primary" },
          { label: "Aprovados", value: counts.approved, icon: CheckCircle, color: "text-primary" },
          { label: "Emitidos", value: counts.issued, icon: Clock, color: "text-blue-500" },
          { label: "Rascunhos", value: counts.draft, icon: XCircle, color: "text-muted-foreground" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold tabular-nums">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou número…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="issued">Emitidos</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum orçamento encontrado</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((b) => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                return (
                  <TableRow key={b.id} className="group cursor-pointer" onClick={() => setDetailBudget(b)}>
                    <TableCell className="font-medium font-mono text-xs">{b.number}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{b.clientName}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{formatDate(b.createdAt)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(b.createdAt)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatCurrency(b.total)}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailBudget(b)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(b)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Exibindo {filtered.length} de {budgets.length} orçamentos</span>
        <span className="font-semibold text-foreground tabular-nums">Valor total: {formatCurrency(totalValue)}</span>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailBudget} onOpenChange={() => setDetailBudget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailBudget && (() => {
            const st = budgetStatusConfig[detailBudget.status as BudgetStatus];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <DialogTitle className="font-mono">{detailBudget.number}</DialogTitle>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                  <DialogDescription>{detailBudget.clientName} • {detailBudget.serviceDescription || "Sem descrição"}</DialogDescription>
                </DialogHeader>

                {/* Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Cliente</span><p className="font-medium">{detailBudget.clientName}</p></div>
                  <div><span className="text-muted-foreground">Data</span><p className="font-medium">{formatDate(detailBudget.createdAt)}</p></div>
                  <div><span className="text-muted-foreground">Validade</span><p className="font-medium">{detailBudget.validityDate ? formatDate(detailBudget.validityDate) : "—"}</p></div>
                  <div><span className="text-muted-foreground">Entrega</span><p className="font-medium">{detailBudget.deliveryDate ? formatDate(detailBudget.deliveryDate) : "—"}</p></div>
                </div>

                <Separator />

                {/* Items */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Itens ({detailBudget.items.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Material</TableHead>
                          <TableHead className="text-xs">Qtd</TableHead>
                          <TableHead className="text-xs">Unit.</TableHead>
                          <TableHead className="text-xs text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailBudget.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs">{item.materialName}</TableCell>
                            <TableCell className="text-xs tabular-nums">{item.qty} {item.unit}</TableCell>
                            <TableCell className="text-xs tabular-nums">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-xs tabular-nums text-right font-medium">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatCurrency(detailBudget.subtotal)}</span></div>
                  {detailBudget.totalDiscount > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="tabular-nums text-destructive">- {formatCurrency(detailBudget.totalDiscount)}</span></div>
                  )}
                  {detailBudget.freight > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="tabular-nums">+ {formatCurrency(detailBudget.freight)}</span></div>
                  )}
                  {detailBudget.otherCosts > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Outros custos</span><span className="tabular-nums">+ {formatCurrency(detailBudget.otherCosts)}</span></div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span className="text-primary tabular-nums">{formatCurrency(detailBudget.total)}</span></div>
                </div>

                {detailBudget.paymentTerms && (
                  <div className="text-sm"><span className="text-muted-foreground">Pagamento:</span> <span className="font-medium">{detailBudget.paymentTerms}</span></div>
                )}

                {/* Status Actions */}
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Alterar Status</h4>
                  <div className="flex gap-2 flex-wrap">
                    {(["draft", "issued", "approved", "rejected"] as BudgetStatus[])
                      .filter(s => s !== detailBudget.status)
                      .map(s => {
                        const cfg = budgetStatusConfig[s];
                        return (
                          <Button key={s} variant="outline" size="sm" onClick={() => changeStatus(detailBudget.id, s)}>
                            <Badge variant={cfg.variant} className="mr-2">{cfg.label}</Badge>
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
