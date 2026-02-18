import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MaterialForm } from "@/hooks/useMaterials";

const CHARGE_UNITS = ["m²", "metro", "unidade", "kg", "litro", "peça"];
const MEASURE_UNITS = ["centímetro", "metro", "milímetro", "unidade"];

interface MaterialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: MaterialForm;
  onFormChange: (form: MaterialForm) => void;
  onSave: () => void;
  isEditing: boolean;
  isPending: boolean;
  categories: string[];
}

export function MaterialFormDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSave,
  isEditing,
  isPending,
  categories,
}: MaterialFormDialogProps) {
  const updateField = (field: keyof MaterialForm, value: string | number) =>
    onFormChange({ ...form, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Material" : "Novo Material"}</DialogTitle>
          <DialogDescription>Preencha os dados do material.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Nome do Material *</Label>
            <Input value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} placeholder="ex: Vidro Temperado 8mm" />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={form.category || ""} onChange={(e) => updateField("category", e.target.value)} placeholder="ex: Vidros" list="categories-list" />
            <datalist id="categories-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <Label>Preço Base (R$) *</Label>
            <Input type="number" step="0.01" min="0" value={form.basePrice || ""} onChange={(e) => updateField("basePrice", parseFloat(e.target.value) || 0)} placeholder="0,00" />
          </div>
          <div>
            <Label>Unidade de Cobrança</Label>
            <Select value={form.chargeUnit || "m²"} onValueChange={(v) => updateField("chargeUnit", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHARGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Unidade de Medida</Label>
            <Select value={form.measureUnit || "centímetro"} onValueChange={(v) => updateField("measureUnit", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEASURE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => onFormChange({ ...form, notes: e.target.value })} placeholder="Informações adicionais sobre o material…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isPending}>
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
