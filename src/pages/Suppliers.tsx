import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { mockSuppliers } from "@/data/mock";
import { Supplier } from "@/types";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Supplier>>({ personType: "juridica", active: true });

  const filtered = suppliers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do fornecedor"); return; }
    const newSupplier: Supplier = {
      id: Date.now().toString(), name: form.name!, personType: form.personType || "juridica",
      document: form.document, phone: form.phone, email: form.email,
      address: form.address, neighborhood: form.neighborhood, city: form.city,
      notes: form.notes, active: form.active ?? true,
    };
    setSuppliers([...suppliers, newSupplier]);
    setDialogOpen(false);
    setForm({ personType: "juridica", active: true });
    toast.success("Fornecedor cadastrado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Fornecedores</h2>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Fornecedor</Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar fornecedores…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.document || "—"}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{s.city || "—"}</TableCell>
                  <TableCell><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Nome *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Tipo de Pessoa</Label>
              <Select value={form.personType} onValueChange={(v: "fisica" | "juridica") => setForm({ ...form, personType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Pessoa Física</SelectItem>
                  <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>CPF/CNPJ</Label><Input value={form.document || ""} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><Label>Bairro</Label><Input value={form.neighborhood || ""} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: !!v })} />
              <Label>Fornecedor ativo</Label>
            </div>
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
