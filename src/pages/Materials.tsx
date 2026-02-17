import { useState, useMemo } from "react";
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
import { mockMaterials, mockBudgets } from "@/data/mock";
import { Material } from "@/types";
import { Plus, Search, Pencil, Trash2, Package, ArrowUpDown, Tag, DollarSign, Layers } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";

const CHARGE_UNITS = ["m²", "metro", "unidade", "kg", "litro", "peça"];
const MEASURE_UNITS = ["centímetro", "metro", "milímetro", "unidade"];

type SortKey = "name" | "price-asc" | "price-desc" | "category";

const emptyForm: Partial<Material> = { chargeUnit: "m²", measureUnit: "centímetro", category: "" };

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>(mockMaterials);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Material>>(emptyForm);

  const categories = useMemo(() =>
    [...new Set(materials.map(m => m.category).filter(Boolean))].sort(),
    [materials]
  );

  const filtered = useMemo(() => {
    let result = materials.filter((m) => {
      const q = search.toLowerCase();
      const matchSearch = m.name.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "all" || m.category === categoryFilter;
      return matchSearch && matchCategory;
    });

    switch (sortBy) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": result.sort((a, b) => a.basePrice - b.basePrice); break;
      case "price-desc": result.sort((a, b) => b.basePrice - a.basePrice); break;
      case "category": result.sort((a, b) => (a.category || "").localeCompare(b.category || "")); break;
    }
    return result;
  }, [materials, search, categoryFilter, sortBy]);

  const avgPrice = materials.length > 0 ? materials.reduce((s, m) => s + m.basePrice, 0) / materials.length : 0;
  const maxPrice = materials.length > 0 ? Math.max(...materials.map(m => m.basePrice)) : 0;

  // Usage count per material across all budgets
  const materialUsage = useMemo(() => {
    const map: Record<string, number> = {};
    mockBudgets.forEach(b => b.items.forEach(item => {
      map[item.materialId] = (map[item.materialId] || 0) + 1;
    }));
    return map;
  }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: Material) => { setEditingId(m.id); setForm({ ...m }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do material"); return; }
    if (!form.basePrice || form.basePrice <= 0) { toast.error("Informe um preço válido"); return; }
    if (editingId) {
      setMaterials(prev => prev.map(m => m.id === editingId ? { ...m, ...form } as Material : m));
      toast.success("Material atualizado!");
    } else {
      const newMaterial: Material = {
        id: Date.now().toString(), name: form.name!,
        category: form.category || "Outros",
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
        <div>
          <h2 className="text-2xl font-bold">Materiais</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie o catálogo de materiais e preços</p>
        </div>
        <Button onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Novo Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: materials.length, icon: Package, suffix: "itens" },
          { label: "Categorias", value: categories.length, icon: Layers, suffix: "tipos" },
          { label: "Preço Médio", value: formatCurrency(avgPrice), icon: DollarSign },
          { label: "Maior Preço", value: formatCurrency(maxPrice), icon: Tag },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold tabular-nums">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou categoria…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome A-Z</SelectItem>
            <SelectItem value="price-asc">Menor preço</SelectItem>
            <SelectItem value="price-desc">Maior preço</SelectItem>
            <SelectItem value="category">Categoria</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="hidden md:table-cell">Medida</TableHead>
                <TableHead className="hidden sm:table-cell">Uso</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{search || categoryFilter !== "all" ? "Nenhum material encontrado" : "Nenhum material cadastrado"}</p>
                    {!search && categoryFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro material
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      {m.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{m.notes}</p>}
                      <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{m.category}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs font-normal">{m.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{m.chargeUnit}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{m.measureUnit}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {materialUsage[m.id] ? (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 tabular-nums">{materialUsage[m.id]} orç.</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-primary">{formatCurrency(m.basePrice)}</TableCell>
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

      <p className="text-xs text-muted-foreground">
        Exibindo {filtered.length} de {materials.length} materiais
        {categoryFilter !== "all" && <> • Filtro: <span className="font-medium text-foreground">{categoryFilter}</span></>}
      </p>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Material" : "Novo Material"}</DialogTitle>
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
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações adicionais sobre o material…" />
            </div>
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
            <AlertDialogDescription>Esta ação não pode ser desfeita. O material será removido do catálogo.</AlertDialogDescription>
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
