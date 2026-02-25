import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ExpenseForm } from "@/hooks/useExpenses";
import type { BudgetWithItems } from "@/hooks/useBudgets";

const CATEGORIES = ["Material", "Serviço", "Fixo", "Transporte", "Alimentação", "Manutenção", "Equipamento", "Outros"] as const;

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Partial<ExpenseForm>;
  setForm: (form: Partial<ExpenseForm>) => void;
  onSave: () => void;
  editingId: string | null;
  budgets: BudgetWithItems[];
  suppliers: Supplier[];
  isSaving?: boolean;
}

export function ExpenseFormDialog({ open, onOpenChange, form, setForm, onSave, editingId, budgets, suppliers, isSaving }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
          <DialogDescription>Preencha os dados da despesa.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Descrição *</Label>
            <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva a despesa" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category || "Material"} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} placeholder="0,00" />
          </div>
          <div>
            <Label>Orçamento</Label>
            <Select value={form.budgetId || "none"} onValueChange={(v) => setForm({ ...form, budgetId: v === "none" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {budgets.map((b) => <SelectItem key={b.id} value={b.id}>{b.number} — {b.client_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fornecedor</Label>
            <Select value={form.supplierId || "none"} onValueChange={(v) => setForm({ ...form, supplierId: v === "none" ? undefined : v })}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Observações adicionais…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{editingId ? "Atualizando…" : "Salvando…"}</> : editingId ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
