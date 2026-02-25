import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import type { DbPayment } from "@/hooks/usePayments";

interface Props {
  payments: DbPayment[];
  activeFiltersCount: number;
  onOpenNew: () => void;
  onEdit: (p: DbPayment) => void;
  onDelete: (id: string) => void;
}

const methodBadgeVariant = (m: string) => {
  switch (m) {
    case "PIX": return "default" as const;
    case "Cartão": return "outline" as const;
    default: return "secondary" as const;
  }
};

export function PaymentsTable({ payments, activeFiltersCount, onOpenNew, onEdit, onDelete }: Props) {
  return (
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
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{activeFiltersCount > 0 ? "Nenhum pagamento encontrado" : "Nenhum pagamento registrado"}</p>
                  {activeFiltersCount === 0 && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={onOpenNew}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />Registrar primeiro pagamento
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : payments.map(p => (
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(p.id)}>
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
  );
}
