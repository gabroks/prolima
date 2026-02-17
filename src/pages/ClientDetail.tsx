import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockClients, mockBudgets, mockPayments, mockExpenses } from "@/data/mock";
import {
  ArrowLeft, Phone, Mail, MapPin, FileText, DollarSign, Calendar,
  Pencil, MessageCircle, TrendingUp, Receipt, ExternalLink,
} from "lucide-react";
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

  const clientExpenses = useMemo(() =>
    mockExpenses.filter(e => clientBudgets.some(b => b.id === e.budgetId)),
    [clientBudgets]
  );

  // Timeline: merge budgets, payments, expenses
  const timeline = useMemo(() => {
    const items = [
      ...clientBudgets.map(b => ({
        id: `b-${b.id}`, type: "budget" as const,
        title: `Orçamento ${b.number} — ${budgetStatusConfig[b.status as BudgetStatus]?.label}`,
        subtitle: b.serviceDescription || "Sem descrição",
        value: b.total, date: b.createdAt, icon: FileText,
        color: "bg-primary/10 text-primary",
      })),
      ...clientPayments.map(p => ({
        id: `p-${p.id}`, type: "payment" as const,
        title: `Pagamento recebido — ${p.method}`,
        subtitle: p.notes || p.budgetNumber,
        value: p.amount, date: p.date, icon: DollarSign,
        color: "bg-primary/10 text-primary",
      })),
      ...clientExpenses.map(e => ({
        id: `e-${e.id}`, type: "expense" as const,
        title: `Despesa — ${e.description}`,
        subtitle: e.supplierName || e.category,
        value: -e.amount, date: e.date, icon: Receipt,
        color: "bg-destructive/10 text-destructive",
      })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return items;
  }, [clientBudgets, clientPayments, clientExpenses]);

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
  const totalExpenses = clientExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalPaid - totalExpenses;
  const paidPct = totalValue > 0 ? Math.min(100, Math.round((totalPaid / totalValue) * 100)) : 0;

  const formatWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/55${digits}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Detalhe do Cliente</h2>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 flex-wrap">
            <Avatar className="h-16 w-16 shrink-0 ring-4 ring-primary/10">
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
              <p className="text-xs text-muted-foreground mt-1 font-mono">{client.document}</p>

              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-muted-foreground">
                <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="h-3.5 w-3.5" />{client.phone}
                </a>
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5" />{client.email}
                  </a>
                )}
                {client.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />{client.city}{client.neighborhood ? `, ${client.neighborhood}` : ""}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />Cliente desde {formatDate(client.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href={formatWhatsApp(client.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border hover:bg-muted transition-colors"
                title="WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
              </a>
              <Button variant="outline" size="sm" onClick={() => navigate("/clientes")}>
                <Pencil className="h-3.5 w-3.5 mr-2" />Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Orçamentos", value: totalBudgets, icon: FileText },
          { label: "Aprovados", value: totalApproved, icon: FileText },
          { label: "Valor Total", value: formatCurrency(totalValue), icon: DollarSign },
          { label: "Recebido", value: formatCurrency(totalPaid), icon: DollarSign },
          { label: "Lucro", value: formatCurrency(profit), icon: TrendingUp, highlight: profit >= 0 },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <c.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className={`text-sm font-bold tabular-nums truncate ${
                  'highlight' in c ? (c.highlight ? "text-primary" : "text-destructive") : ""
                }`}>{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Payment Progress */}
      {totalValue > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso de pagamento</span>
            <span className="text-sm tabular-nums font-semibold text-primary">{paidPct}%</span>
          </div>
          <Progress value={paidPct} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Recebido: {formatCurrency(totalPaid)}</span>
            <span>Pendente: {formatCurrency(totalValue - totalPaid)}</span>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Budget History */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Histórico de Orçamentos</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/novo-orcamento")}>
                + Novo Orçamento
              </Button>
            </div>
            <CardDescription>{totalBudgets} orçamento{totalBudgets !== 1 && "s"} vinculado{totalBudgets !== 1 && "s"}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead className="hidden sm:table-cell">Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Nenhum orçamento</p>
                    </TableCell>
                  </TableRow>
                ) : clientBudgets.map(b => {
                  const st = budgetStatusConfig[b.status as BudgetStatus];
                  return (
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate("/orcamentos")}>
                      <TableCell>
                        <div>
                          <p className="font-medium font-mono text-xs">{b.number}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(b.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs truncate max-w-[180px]">{b.serviceDescription || "—"}</TableCell>
                      <TableCell className="tabular-nums font-semibold text-sm">{formatCurrency(b.total)}</TableCell>
                      <TableCell><Badge variant={st.variant} className="text-[10px]">{st.label}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Linha do Tempo</CardTitle>
            <CardDescription>Atividades recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade registrada</p>
            ) : (
              <div className="space-y-4">
                {timeline.slice(0, 8).map((item, idx) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.color}`}>
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      {idx < Math.min(timeline.length - 1, 7) && (
                        <div className="w-px h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-xs font-medium leading-snug">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold tabular-nums ${item.value >= 0 ? "text-primary" : "text-destructive"}`}>
                          {item.value >= 0 ? "+" : ""}{formatCurrency(Math.abs(item.value))}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(item.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
