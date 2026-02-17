import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { mockBudgets, mockPayments } from "@/data/mock";
import { Payment } from "@/types";
import { DollarSign, TrendingUp, Wallet, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function Financial() {
  const approvedBudgets = mockBudgets.filter((b) => b.status === "approved");
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Payment>>({ method: "Dinheiro" });

  const totalApproved = approvedBudgets.reduce((s, b) => s + b.total, 0);
  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const balance = totalApproved - totalReceived;

  const handleSave = () => {
    if (!form.budgetId || !form.amount) { toast.error("Preencha os campos obrigatórios"); return; }
    const budget = approvedBudgets.find((b) => b.id === form.budgetId);
    const newPayment: Payment = {
      id: Date.now().toString(), budgetId: form.budgetId!, budgetNumber: budget?.number || "",
      clientName: budget?.clientName || "", amount: form.amount!, method: form.method || "Dinheiro",
      date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
    };
    setPayments([...payments, newPayment]);
    setDialogOpen(false);
    setForm({ method: "Dinheiro" });
    toast.success("Pagamento registrado com sucesso!");
  };

  const summaryCards = [
    { title: "Total em Orçamentos Aprovados", value: totalApproved, icon: DollarSign, color: "text-primary" },
    { title: "Total Recebido", value: totalReceived, icon: TrendingUp, color: "text-primary" },
    { title: "Saldo a Receber", value: balance, icon: Wallet, color: balance > 0 ? "text-[hsl(var(--warning))]" : "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Registrar Pagamento</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {card.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente ou número…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Orçamentos Aprovados</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedBudgets.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum orçamento aprovado</TableCell></TableRow>
              ) : approvedBudgets.filter(b => b.clientName.toLowerCase().includes(search.toLowerCase()) || b.number.includes(search)).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.number}</TableCell>
                  <TableCell>{b.clientName}</TableCell>
                  <TableCell>R$ {b.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Pagamento</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Orçamento *</Label>
              <Select value={form.budgetId} onValueChange={(v) => setForm({ ...form, budgetId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{approvedBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} - {b.clientName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor *</Label><Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Data do Pagamento</Label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
