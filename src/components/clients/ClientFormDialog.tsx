import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ClientForm } from "@/hooks/useClients";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: ClientForm;
  onFormChange: (form: ClientForm) => void;
  onSave: () => void;
  isEditing: boolean;
  isSaving: boolean;
}

export function ClientFormDialog({ open, onOpenChange, form, onFormChange, onSave, isEditing, isSaving }: ClientFormDialogProps) {
  const updateField = (field: keyof ClientForm, value: string) =>
    onFormChange({ ...form, [field]: value });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente. Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome Completo *</Label>
              <Input value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div>
              <Label>Telefone/WhatsApp *</Label>
              <MaskedInput mask="phone" value={form.phone || ""} onValueChange={(v) => updateField("phone", v)} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Tipo de Pessoa</Label>
              <Select value={form.personType} onValueChange={(v: "fisica" | "juridica") => onFormChange({ ...form, personType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.personType === "juridica" ? "CNPJ *" : "CPF *"}</Label>
              <MaskedInput mask={form.personType === "juridica" ? "cnpj" : "cpf"} value={form.document || ""} onValueChange={(v) => updateField("document", v)} placeholder={form.personType === "juridica" ? "00.000.000/0001-00" : "000.000.000-00"} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
          {form.personType === "juridica" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Razão Social</Label><Input value={form.razaoSocial || ""} onChange={(e) => updateField("razaoSocial", e.target.value)} /></div>
              <div><Label>Nome Fantasia</Label><Input value={form.nomeFantasia || ""} onChange={(e) => updateField("nomeFantasia", e.target.value)} /></div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Contato</Label><Input value={form.contact || ""} onChange={(e) => updateField("contact", e.target.value)} placeholder="Nome do contato" /></div>
            <div><Label>Cidade</Label><Input value={form.city || ""} onChange={(e) => updateField("city", e.target.value)} /></div>
            <div><Label>Bairro</Label><Input value={form.neighborhood || ""} onChange={(e) => updateField("neighborhood", e.target.value)} /></div>
            <div><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Rua, número, complemento" /></div>
          </div>
          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Cliente Ativo</Label>
                <p className="text-xs text-muted-foreground">Desative para ocultar dos filtros padrão</p>
              </div>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(v) => onFormChange({ ...form, status: v ? "active" : "inactive" })}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
