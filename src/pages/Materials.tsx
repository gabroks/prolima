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
import { Skeleton } from "@/components/ui/skeleton";
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, MaterialForm, DbMaterial } from "@/hooks/useMaterials";
import { Plus, Search, Pencil, Trash2, Package, ArrowUpDown, Tag, DollarSign, Layers } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

const CHARGE_UNITS = ["m²", "metro", "unidade", "kg", "litro", "peça"];
const MEASURE_UNITS = ["centímetro", "metro", "milímetro", "unidade"];

type SortKey = "name" | "price-asc" | "price-desc" | "category";

const emptyForm: MaterialForm = { name: "", category: "", chargeUnit: "m²", measureUnit: "centímetro", basePrice: 0 };

export default function Materials() {
  const { data: materials = [], isLoading } = useMaterials();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialForm>(emptyForm);

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

    const sorted = [...result];
    switch (sortBy) {
      case "name": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": sorted.sort((a, b) => a.base_price - b.base_price); break;
      case "price-desc": sorted.sort((a, b) => b.base_price - a.base_price); break;
      case "category": sorted.sort((a, b) => (a.category || "").localeCompare(b.category || "")); break;
    }
    return sorted;
  }, [materials, search, categoryFilter, sortBy]);

  const avgPrice = materials.length > 0 ? materials.reduce((s, m) => s + m.base_price, 0) / materials.length : 0;
  const maxPrice = materials.length > 0 ? Math.max(...materials.map(m => m.base_price)) : 0;

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (m: DbMaterial) => {
    setEditingId(m.id);
    setForm({
      name: m.name, category: m.category,
      chargeUnit: m.charge_unit, measureUnit: m.measure_unit,
      basePrice: m.base_price, notes: m.notes || undefined,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do material"); return; }
    if (!form.basePrice || form.basePrice <= 0) { toast.error("Informe um preço base válido"); return; }
    if (editingId) {
      updateMaterial.mutate({ id: editingId, form });
    } else {
      createMaterial.mutate(form);
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMaterial.mutate(deleteId);
    setDeleteId(null);
  };

  const updateField = (field: keyof MaterialForm, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

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
          { label: "Total", value: materials.length, icon: Package },
          { label: "Categorias", value: categories.length, icon: Layers },
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
                <TableHead>Preço Base</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
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
                  <TableCell className="text-sm">{m.charge_unit}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{m.measure_unit}</TableCell>
                  <TableCell className="tabular-nums font-semibold text-primary">{formatCurrency(m.base_price)}</TableCell>
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
            <Button onClick={handleSave} disabled={createMaterial.isPending || updateMaterial.isPending}>
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
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
