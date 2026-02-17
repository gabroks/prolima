import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { mockMaterials } from "@/data/mock";
import { Material } from "@/types";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Material>>({});

  const filtered = materials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do material"); return; }
    const newMaterial: Material = {
      id: Date.now().toString(), name: form.name!, chargeUnit: form.chargeUnit || "m²",
      measureUnit: form.measureUnit || "centímetro", basePrice: form.basePrice || 0, notes: form.notes,
    };
    setMaterials([...materials, newMaterial]);
    setDialogOpen(false);
    setForm({});
    toast.success("Material cadastrado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Materiais</h2>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Material</Button>
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
                <TableHead>Preço Base</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum material cadastrado</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.chargeUnit}</TableCell>
                  <TableCell>R$ {m.basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Nome do Material *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Unidade de Cobrança Padrão</Label><Input value={form.chargeUnit || ""} onChange={(e) => setForm({ ...form, chargeUnit: e.target.value })} placeholder="ex: m²" /></div>
            <div><Label>Unidade de Cálculo das Medidas</Label><Input value={form.measureUnit || ""} onChange={(e) => setForm({ ...form, measureUnit: e.target.value })} placeholder="ex: centímetro" /></div>
            <div><Label>Preço Base por Unidade (R$)</Label><Input type="number" value={form.basePrice || ""} onChange={(e) => setForm({ ...form, basePrice: parseFloat(e.target.value) || 0 })} /></div>
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
