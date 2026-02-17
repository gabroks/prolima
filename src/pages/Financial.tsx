import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockBudgets, mockPayments } from "@/data/mock";
import { Payment } from "@/types";
import { DollarSign, TrendingUp, Wallet, Plus, Search, Pencil, Trash2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";

const emptyForm: Partial<Payment> = { method: "PIX" };

export default function Financial() {
  const approvedBudgets = mockBudgets.filter((b) => b.status === "approved");
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Payment>>(emptyForm);

  const totalApproved = approvedBudgets.reduce((s, b) => s + b.total, 0);
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const balance = totalApproved - totalReceived;

  const q = search.toLowerCase();
  const filteredBudgets = approvedBudgets.filter(b =>
    b.clientName.toLowerCase().includes(q) || b.number.toLowerCase().includes(q)
  );
  const filteredPayments = payments.filter(p =>
    p.clientName.toLowerCase().includes(q) || p.budgetNumber.toLowerCase().includes(q)
  );

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Payment) => { setEditingId(p.id); setForm({ ...p }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.budgetId || !form.amount || form.amount <= 0) {
      toast.error("Selecione um orçamento e informe o valor");
      return;
    }
    const budget = approvedBudgets.find((b) => b.id === form.budgetId);
    if (editingId) {
      setPayments(prev => prev.map(p => p.id === editingId ? { ...p, ...form, budgetNumber: budget?.number || p.budgetNumber, clientName: budget?.clientName || p.clientName } as Payment : p));
      toast.success("Pagamento atualizado!");
    } else {
      const newPayment: Payment = {
        id: Date.now().toString(), budgetId: form.budgetId!, budgetNumber: budget?.number || "",
        clientName: budget?.clientName || "", amount: form.amount!, method: form.method || "PIX",
        date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
      };
      setPayments(prev => [...prev, newPayment]);
      toast.success("Pagamento registrado!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setPayments(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    toast.success("Pagamento removido!");
  };

  const methodBadgeVariant = (method: string) => {
    switch (method) {
      case "PIX": return "default" as const;
      case "Cartão": return "outline" as const;
      case "Boleto": return "secondary" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Registrar Pagamento</Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orçamentos Aprovados", value: totalApproved, icon: DollarSign, color: "text-primary" },
          { label: "Total Recebido", value: totalReceived, icon: TrendingUp, color: "text-primary" },
          { label: "Saldo a Receber", value: balance, icon: Wallet, color: balance > 0 ? "text-amber-500" : "text-primary" },
        ].map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-bold tabular-nums">{formatCurrency(c.value)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente ou número…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                        <p>Nenhum pagamento registrado</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell className="font-medium font-mono text-xs">{p.budgetNumber}</TableCell>
                      <TableCell className="hidden md:table-cell">{p.clientName}</TableCell>
                      <TableCell className="tabular-nums font-medium text-primary">{formatCurrency(p.amount)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={methodBadgeVariant(p.method)}>{p.method}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <TableHead>Valor</TableHead>
                    <TableHead className="hidden md:table-cell">Recebido</TableHead>
                    <TableHead className="hidden md:table-cell">Pendente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p>Nenhum orçamento aprovado</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBudgets.map((b) => {
                    const received = payments.filter(p => p.budgetId === b.id).reduce((s, p) => s + p.amount, 0);
                    const pending = b.total - received;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium font-mono text-xs">{b.number}</TableCell>
                        <TableCell>{b.clientName}</TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(b.total)}</TableCell>
                        <TableCell className="hidden md:table-cell tabular-nums text-primary">{formatCurrency(received)}</TableCell>
                        <TableCell className="hidden md:table-cell tabular-nums">
                          {pending > 0 ? (
                            <span className="text-amber-500">{formatCurrency(pending)}</span>
                          ) : (
                            <Badge variant="default" className="text-xs">Quitado</Badge>
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

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Pagamento" : "Registrar Pagamento"}</DialogTitle>
            <DialogDescription>Preencha os dados do pagamento.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Orçamento *</Label>
              <Select value={form.budgetId || ""} onValueChange={(v) => setForm({ ...form, budgetId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{approvedBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} — {b.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.method || "PIX"} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
