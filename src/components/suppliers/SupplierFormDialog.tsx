import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MaskedInput } from "@/components/ui/masked-input";
import type { SupplierForm } from "@/hooks/useSuppliers";

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: SupplierForm;
  onFormChange: (form: SupplierForm) => void;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

export function SupplierFormDialog({ open, onOpenChange, form, onFormChange, onSave, isEditing, isSaving }: SupplierFormDialogProps) {
  const update = (field: string, value: any) => onFormChange({ ...form, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="Nome do fornecedor" />
          </div>
          <div>
            <Label>Tipo de Pessoa</Label>
            <Select value={form.personType} onValueChange={(v: "fisica" | "juridica") => update("personType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">Pessoa Física</SelectItem>
                <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{form.personType === "juridica" ? "CNPJ" : "CPF"}</Label>
            <MaskedInput mask={form.personType === "juridica" ? "cnpj" : "cpf"} value={form.document || ""} onValueChange={(v) => update("document", v)} placeholder={form.personType === "juridica" ? "00.000.000/0001-00" : "000.000.000-00"} />
          </div>
          <div>
            <Label>Telefone</Label>
            <MaskedInput mask="phone" value={form.phone || ""} onValueChange={(v) => update("phone", v)} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={form.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city || ""} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={form.neighborhood || ""} onChange={(e) => update("neighborhood", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="Rua, número, complemento" />
          </div>
          <div className="sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} placeholder="Informações adicionais…" />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">Fornecedor Ativo</Label>
              <p className="text-xs text-muted-foreground">Desative para ocultar dos filtros padrão</p>
            </div>
            <Switch checked={form.active ?? true} onCheckedChange={(v) => update("active", v)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>{isEditing ? "Atualizar" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
