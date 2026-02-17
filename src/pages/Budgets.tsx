import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockBudgets } from "@/data/mock";
import { Search } from "lucide-react";
import { formatCurrency, formatDate, budgetStatusConfig } from "@/lib/formatters";

export default function Budgets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = mockBudgets
    .filter((b) => {
      const matchSearch = b.clientName.toLowerCase().includes(search.toLowerCase()) || b.number.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => sortBy === "date" ? b.createdAt.localeCompare(a.createdAt) : 0);

  const totalValue = filtered.reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orçamentos</h2>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente ou número…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
            <SelectItem value="issued">Emitidos</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Data de emissão</SelectItem>
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
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum orçamento encontrado</TableCell></TableRow>
              ) : filtered.map((b) => {
                const st = budgetStatusConfig[b.status as keyof typeof budgetStatusConfig];
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.number}</TableCell>
                    <TableCell>{b.clientName}</TableCell>
                    <TableCell>{formatDate(b.createdAt)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(b.total)}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Total de orçamentos: {filtered.length}</span>
        <span className="font-semibold text-foreground tabular-nums">Valor total: {formatCurrency(totalValue)}</span>
      </div>
    </div>
  );
}
