import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, FileText, Filter } from "lucide-react";
import { TableEmpty } from "@/components/shared/PageStates";
import { formatCurrency } from "@/lib/formatters";
import { budgetStatusConfig, type BudgetStatus } from "@/lib/formatters";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { DbPayment } from "@/hooks/usePayments";

const PAGE_SIZE = 15;

interface Props {
  budgets: BudgetWithItems[];
  payments: DbPayment[];
  search: string;
}

export function BudgetsFinancialTable({ budgets, payments, search }: Props) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filteredBudgets = useMemo(() => {
    const q = search.toLowerCase();
    return budgets.filter(b => {
      const matchSearch = !q || b.client_name.toLowerCase().includes(q) || b.number.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, budgets, statusFilter]);

  const totalPages = Math.ceil(filteredBudgets.length / PAGE_SIZE);
  const pagedBudgets = useMemo(() => filteredBudgets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filteredBudgets, page]);

  const getStatusConfig = (status: string) => {
    return budgetStatusConfig[status as BudgetStatus] || { label: status, variant: "secondary" as const };
  };

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(budgetStatusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden sm:table-cell">Situação</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="hidden sm:table-cell">Recebido</TableHead>
                <TableHead className="hidden sm:table-cell">Progresso</TableHead>
                <TableHead>Status Pgto.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {pagedBudgets.length === 0 ? (
                <TableEmpty
                  icon={FileText}
                  colSpan={7}
                  hasFilters={statusFilter !== "all" || !!search}
                  emptyMessage="Nenhum orçamento cadastrado"
                  filteredMessage="Nenhum orçamento encontrado com os filtros aplicados"
                  createLabel="Ver orçamentos"
                  onClearFilters={() => { setStatusFilter("all"); setPage(0); }}
                  onCreate={() => {}}
                />
              ) : pagedBudgets.map(b => {
                const received = payments.filter(p => p.budget_id === b.id).reduce((s, p) => s + Number(p.amount), 0);
                const pending = Number(b.total) - received;
                const pct = Number(b.total) > 0 ? Math.round((received / Number(b.total)) * 100) : 0;
                const statusCfg = getStatusConfig(b.status);
                return (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/editar-orcamento/${b.id}`)}
                  >
                    <TableCell className="font-medium font-mono text-xs text-primary hover:underline">{b.number}</TableCell>
                    <TableCell>{b.client_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={statusCfg.variant} className="text-xs">
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
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

      {totalPages > 1 && (
        <PaginationFooter
          page={page}
          totalPages={totalPages}
          totalItems={filteredBudgets.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          label="orçamentos"
        />
      )}
    </div>
  );
}
