import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockClients, mockBudgets, mockPayments } from "@/data/mock";
import { ArrowLeft, Phone, Mail, MapPin, FileText, DollarSign, Calendar, Pencil } from "lucide-react";
import { formatCurrency, formatDate, budgetStatusConfig, BudgetStatus, getInitials } from "@/lib/formatters";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const client = mockClients.find(c => c.id === id);

  const clientBudgets = useMemo(() =>
    mockBudgets.filter(b => b.clientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [id]
  );

  const clientPayments = useMemo(() =>
    mockPayments.filter(p => clientBudgets.some(b => b.id === p.budgetId)),
    [clientBudgets]
  );

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Cliente não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Voltar para Clientes
        </Button>
      </div>
    );
  }

  const totalBudgets = clientBudgets.length;
  const totalApproved = clientBudgets.filter(b => b.status === "approved").length;
  const totalValue = clientBudgets.reduce((s, b) => s + b.total, 0);
  const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Detalhe do Cliente</h2>
      </div>

      {/* Client Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold">{client.name}</h3>
                <Badge variant={client.status === "active" ? "default" : "secondary"}>
                  {client.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {client.personType === "fisica" ? "Pessoa Física" : "Pessoa Jurídica"}
                </Badge>
              </div>
              {client.razaoSocial && <p className="text-sm text-muted-foreground mt-0.5">{client.razaoSocial}</p>}
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{client.phone}</span>
                {client.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{client.email}</span>}
                {client.city && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{client.city}{client.neighborhood ? `, ${client.neighborhood}` : ""}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Cliente desde {formatDate(client.createdAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{client.document}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/clientes")}>
              <Pencil className="h-3.5 w-3.5 mr-2" />Editar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Orçamentos", value: totalBudgets, icon: FileText, color: "text-primary" },
          { label: "Aprovados", value: totalApproved, icon: FileText, color: "text-primary" },
          { label: "Valor Total", value: formatCurrency(totalValue), icon: DollarSign, color: "text-primary" },
          { label: "Total Pago", value: formatCurrency(totalPaid), icon: DollarSign, color: "text-primary" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold tabular-nums">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Budget History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Orçamentos</CardTitle>
          <CardDescription>{totalBudgets} orçamentos vinculados a este cliente</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientBudgets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum orçamento para este cliente</p>
                  </TableCell>
                </TableRow>
              ) : clientBudgets.map(b => {
                const st = budgetStatusConfig[b.status as BudgetStatus];
                return (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/orcamentos")}>
                    <TableCell className="font-medium font-mono text-xs">{b.number}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm truncate max-w-[200px]">{b.serviceDescription || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(b.createdAt)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{formatCurrency(b.total)}</TableCell>
                    <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payments */}
      {clientPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos Recebidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Método</TableHead>
                  <TableHead className="hidden md:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.budgetNumber}</TableCell>
                    <TableCell className="tabular-nums font-medium text-primary">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline">{p.method}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(p.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
