import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { PaymentForm } from "@/hooks/usePayments";
import { formatCurrency } from "@/lib/formatters";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { DbPayment } from "@/hooks/usePayments";

const PAYMENT_METHODS = ["PIX", "Dinheiro", "Cartão", "Boleto", "Transferência"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Partial<PaymentForm>;
  setForm: (form: Partial<PaymentForm>) => void;
  onSave: () => void;
  editingId: string | null;
  approvedBudgets: BudgetWithItems[];
  payments?: DbPayment[];
  isSaving?: boolean;
}

export function PaymentFormDialog({ open, onOpenChange, form, setForm, onSave, editingId, approvedBudgets, payments = [], isSaving }: Props) {
  // Auto-fill client name and budget number when a budget is selected
  const selectedBudget = approvedBudgets.find(b => b.id === form.budgetId);

  useEffect(() => {
    if (selectedBudget && !editingId) {
      setForm({
        ...form,
        budgetNumber: selectedBudget.number,
        clientName: selectedBudget.client_name,
      });
    }
  }, [form.budgetId]);

  // Calculate how much has been paid and remaining for the selected budget
  const budgetPaid = selectedBudget
    ? payments.filter(p => p.budget_id === selectedBudget.id).reduce((s, p) => s + Number(p.amount), 0)
    : 0;
  const budgetRemaining = selectedBudget ? Number(selectedBudget.total) - budgetPaid : 0;

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
                {approvedBudgets.map(b => {
                  const paid = payments.filter(p => p.budget_id === b.id).reduce((s, p) => s + Number(p.amount), 0);
                  const remaining = Number(b.total) - paid;
                  return (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="flex items-center gap-2">
                        {b.number} — {b.client_name} ({formatCurrency(Number(b.total))})
                        {remaining <= 0 && <Badge variant="default" className="text-[10px] px-1 py-0">Quitado</Badge>}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Show linked client and budget info */}
          {selectedBudget && (
            <div className="sm:col-span-2 bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Cliente</span>
                <span className="text-sm font-medium">{selectedBudget.client_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Valor do Orçamento</span>
                <span className="text-sm font-medium tabular-nums">{formatCurrency(Number(selectedBudget.total))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Já Recebido</span>
                <span className="text-sm font-medium tabular-nums text-primary">{formatCurrency(budgetPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Restante</span>
                <span className={`text-sm font-bold tabular-nums ${budgetRemaining <= 0 ? "text-primary" : "text-yellow-600"}`}>
                  {formatCurrency(Math.max(0, budgetRemaining))}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label>Valor (R$) *</Label>
            <Input type="number" step="0.01" min="0" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            {selectedBudget && budgetRemaining > 0 && (
              <button
                type="button"
                className="text-[10px] text-primary hover:underline mt-1"
                onClick={() => setForm({ ...form, amount: budgetRemaining })}
              >
                Preencher restante: {formatCurrency(budgetRemaining)}
              </button>
            )}
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
          <Button onClick={onSave} disabled={isSaving}>{isSaving ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{editingId ? "Atualizando…" : "Salvando…"}</> : editingId ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
