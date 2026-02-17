import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { mockBudgets, mockPayments, mockSuppliers } from "@/data/mock";
import { Expense } from "@/types";
import { mockExpenses } from "@/data/mock";
import { TrendingUp, TrendingDown, Wallet, Plus, Search, Pencil, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";

const categories = ["Material", "Serviço", "Fixo", "Transporte", "Alimentação", "Outros"] as const;
const emptyForm: Partial<Expense> = { category: "Material" };

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [search, setSearch] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Expense>>(emptyForm);

  const totalEntradas = mockPayments.reduce((s, p) => s + p.amount, 0);
  const totalDespesas = expenses.reduce((s, e) => s + e.amount, 0);
  const saldo = totalEntradas - totalDespesas;

  const filtered = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.description.toLowerCase().includes(q) || (e.supplierName?.toLowerCase().includes(q));
    const matchBudget = budgetFilter === "all" || e.budgetId === budgetFilter;
    const matchCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchSearch && matchBudget && matchCategory;
  });

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (e: Expense) => { setEditingId(e.id); setForm({ ...e }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.description || !form.amount || form.amount <= 0) {
      toast.error("Informe a descrição e o valor");
      return;
    }
    const budget = mockBudgets.find((b) => b.id === form.budgetId);
    const supplier = mockSuppliers.find((s) => s.id === form.supplierId);
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? {
        ...e, ...form,
        budgetNumber: budget?.number || e.budgetNumber,
        supplierName: supplier?.name || e.supplierName,
      } as Expense : e));
      toast.success("Despesa atualizada!");
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(), budgetId: form.budgetId, budgetNumber: budget?.number,
        description: form.description!, supplierId: form.supplierId, supplierName: supplier?.name,
        category: form.category || "Material", amount: form.amount!,
        date: form.date || new Date().toISOString().split("T")[0], notes: form.notes,
      };
      setExpenses(prev => [...prev, newExpense]);
      toast.success("Despesa registrada!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setExpenses(prev => prev.filter(e => e.id !== deleteId));
    setDeleteId(null);
    toast.success("Despesa removida!");
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "Material": return "default" as const;
      case "Fixo": return "secondary" as const;
      case "Serviço": return "outline" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova Despesa</Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total de Entradas", value: totalEntradas, icon: TrendingUp, color: "text-primary" },
          { label: "Total de Despesas", value: totalDespesas, icon: TrendingDown, color: "text-destructive" },
          { label: "Saldo", value: saldo, icon: Wallet, color: saldo >= 0 ? "text-primary" : "text-destructive" },
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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por descrição ou fornecedor…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={budgetFilter} onValueChange={setBudgetFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Orçamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {mockBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead className="hidden md:table-cell">Fornecedor</TableHead>
                <TableHead className="hidden md:table-cell">Orçamento</TableHead>
                <TableHead className="hidden lg:table-cell">Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhuma despesa encontrada</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{e.category}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={categoryColor(e.category)}>{e.category}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{e.supplierName || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{e.budgetNumber || "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(e.date)}</TableCell>
                  <TableCell className="tabular-nums font-medium text-destructive">{formatCurrency(e.amount)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(e.id)}>
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

      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Exibindo {filtered.length} de {expenses.length} despesas</span>
        <span className="font-semibold text-destructive tabular-nums">Total filtrado: {formatCurrency(filtered.reduce((s, e) => s + e.amount, 0))}</span>
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
            <DialogDescription>Preencha os dados da despesa.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Descrição *</Label>
              <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Orçamento</Label>
              <Select value={form.budgetId || "none"} onValueChange={(v) => setForm({ ...form, budgetId: v === "none" ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {mockBudgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} — {b.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fornecedor</Label>
              <Select value={form.supplierId || "none"} onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? undefined : v })}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {mockSuppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category || "Material"} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
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
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
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
