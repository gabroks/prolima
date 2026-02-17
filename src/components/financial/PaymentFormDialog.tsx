import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentForm } from "@/hooks/usePayments";
import { formatCurrency } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";

const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão", "Boleto", "Transferência"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Partial<PaymentForm>;
  setForm: (form: Partial<PaymentForm>) => void;
  onSave: () => void;
  editingId: string | null;
  approvedBudgets: BudgetWithItems[];
  isSaving?: boolean;
}

export function PaymentFormDialog({ open, onOpenChange, form, setForm, onSave, editingId, approvedBudgets, isSaving }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar Pagamento" : "Registrar Pagamento"}</DialogTitle>
          <DialogDescription>Preencha os dados do pagamento.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Orçamento *</Label>
            <Select value={form.budgetId || ""} onValueChange={(v) => setForm({ ...form, budgetId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione um orçamento" /></SelectTrigger>
              <SelectContent>
                {approvedBudgets.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.number} — {b.client_name} ({formatCurrency(Number(b.total))})
                  </SelectItem>
                ))}
              </SelectContent>
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
              <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>{editingId ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
