import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { mockBudgets, mockPayments, mockExpenses, mockSuppliers } from "@/data/mock";
import { Expense } from "@/types";
import { TrendingUp, TrendingDown, Wallet, Plus } from "lucide-react";
import { toast } from "sonner";

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Expense>>({ category: "Material" });

  const totalEntradas = mockPayments.reduce((s, p) => s + p.amount, 0);
  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0);
  const saldo = totalEntradas - totalDespesas;

  const filteredExpenses = budgetFilter === "all" ? expenses : expenses.filter((e) => e.budgetId === budgetFilter);

  const handleSave = () => {
    if (!form.description || !form.amount) { toast.error("Preencha os campos obrigatórios"); return; }
    const budget = mockBudgets.find((b) => b.id === form.budgetId);
    const supplier = mockSuppliers.find((s) => s.id === form.supplierId);
    const newExpense: Expense = {
      id: Date.now().toString(), budgetId: form.budgetId, budgetNumber: budget?.number,
      description: form.description!, supplierId: form.supplierId, supplierName: supplier?.name,
      category: form.category || "Material", amount: form.amount!,
      date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
    };
    setExpenses([...expenses, newExpense]);
    setDialogOpen(false);
    setForm({ category: "Material" });
    toast.success("Despesa registrada com sucesso!");
  };

  const summaryCards = [
    { title: "Total de Entradas", value: totalEntradas, icon: TrendingUp, color: "text-primary" },
    { title: "Total de Despesas", value: totalDespesas, icon: TrendingDown, color: "text-destructive" },
    { title: "Saldo Total", value: saldo, icon: Wallet, color: saldo >= 0 ? "text-primary" : "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Despesa</Button>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Balanço por Orçamento</CardTitle>
            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos os Orçamentos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Orçamentos</SelectItem>
                {mockBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} - {b.clientName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma despesa encontrada</TableCell></TableRow>
              ) : filteredExpenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.description}</TableCell>
                  <TableCell>{e.category}</TableCell>
                  <TableCell>{e.supplierName || "—"}</TableCell>
                  <TableCell>{new Date(e.date).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-destructive font-medium">R$ {e.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Orçamento</Label>
              <Select value={form.budgetId || ""} onValueChange={(v) => setForm({ ...form, budgetId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {mockBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} - {b.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Descrição *</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplierId || ""} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum fornecedor" /></SelectTrigger>
                <SelectContent>
                  {mockSuppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Material">Material</SelectItem>
                  <SelectItem value="Serviço">Serviço</SelectItem>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Transporte">Transporte</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor *</Label><Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} /></div>
            <div><Label>Data</Label><Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
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
