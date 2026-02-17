import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { mockMaterials } from "@/data/mock";
import { Material } from "@/types";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";

const emptyForm: Partial<Material> = { chargeUnit: "m²", measureUnit: "centímetro" };

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Material>>(emptyForm);

  const filtered = materials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const avgPrice = materials.length > 0 ? materials.reduce((s, m) => s + m.basePrice, 0) / materials.length : 0;

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Material) => { setEditingId(m.id); setForm({ ...m }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do material"); return; }
    if (editingId) {
      setMaterials(prev => prev.map(m => m.id === editingId ? { ...m, ...form } as Material : m));
      toast.success("Material atualizado!");
    } else {
      const newMaterial: Material = {
        id: Date.now().toString(), name: form.name!,
        chargeUnit: form.chargeUnit || "m²", measureUnit: form.measureUnit || "centímetro",
        basePrice: form.basePrice || 0, notes: form.notes,
      };
      setMaterials(prev => [...prev, newMaterial]);
      toast.success("Material cadastrado!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setMaterials(prev => prev.filter(m => m.id !== deleteId));
    setDeleteId(null);
    toast.success("Material removido!");
  };

  const updateField = (field: keyof Material, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Materiais</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Material</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total cadastrados</p>
              <p className="text-xl font-bold tabular-nums">{materials.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-primary font-bold text-sm">R$</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Preço médio</p>
              <p className="text-xl font-bold tabular-nums">{formatCurrency(avgPrice)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar materiais…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="hidden sm:table-cell">Medida</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum material cadastrado</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      {m.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{m.notes}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{m.chargeUnit}</TableCell>
                  <TableCell className="hidden sm:table-cell">{m.measureUnit}</TableCell>
                  <TableCell className="tabular-nums font-medium">{formatCurrency(m.basePrice)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(m.id)}>
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

      <p className="text-sm text-muted-foreground">Exibindo {filtered.length} de {materials.length} materiais</p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Material" : "Novo Material"}</DialogTitle>
            <DialogDescription>Preencha os dados do material.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Nome do Material *</Label><Input value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} /></div>
            <div><Label>Unidade de Cobrança</Label><Input value={form.chargeUnit || ""} onChange={(e) => updateField("chargeUnit", e.target.value)} placeholder="ex: m²" /></div>
            <div><Label>Unidade de Medida</Label><Input value={form.measureUnit || ""} onChange={(e) => updateField("measureUnit", e.target.value)} placeholder="ex: centímetro" /></div>
            <div><Label>Preço Base (R$)</Label><Input type="number" step="0.01" min="0" value={form.basePrice || ""} onChange={(e) => updateField("basePrice", parseFloat(e.target.value) || 0)} /></div>
            <div className="sm:col-span-2"><Label>Observações</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
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
