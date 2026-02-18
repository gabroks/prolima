import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, MaterialForm, DbMaterial } from "@/hooks/useMaterials";
import { useBudgets } from "@/hooks/useBudgets";
import { QuotaButton } from "@/components/QuotaButton";
import { MaterialFormDialog } from "@/components/materials/MaterialFormDialog";
import { Plus, Search, Pencil, Trash2, Package, ArrowUpDown, DollarSign, Layers, ClipboardList } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/formatters";
import { toast } from "sonner";

type SortKey = "name" | "price-asc" | "price-desc" | "category";
const PAGE_SIZE = 15;

const emptyForm: MaterialForm = { name: "", category: "", chargeUnit: "m²", measureUnit: "centímetro", basePrice: 0 };

export default function Materials() {
  const { data: materials = [], isLoading } = useMaterials();
  const { data: budgets = [] } = useBudgets();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(0);
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const resetPage = () => setPage(0);

  const avgPrice = materials.length > 0 ? materials.reduce((s, m) => s + m.base_price, 0) / materials.length : 0;

  // Material usage stats from budget_items
  const materialUsageStats = useMemo(() => {
    const map = new Map<string, { budgetCount: number; itemCount: number }>();
    budgets.forEach(b => {
      const items = (b as any).budget_items || [];
      const seenInBudget = new Set<string>();
      items.forEach((item: any) => {
        if (item.material_id) {
          const prev = map.get(item.material_id) || { budgetCount: 0, itemCount: 0 };
          prev.itemCount++;
          if (!seenInBudget.has(item.material_id)) {
            prev.budgetCount++;
            seenInBudget.add(item.material_id);
          }
          map.set(item.material_id, prev);
        }
      });
    });
    return map;
  }, [budgets]);
  const materialsInUse = new Set(materialUsageStats.keys()).size;

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
    const onSuccess = () => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); };
    if (editingId) {
      updateMaterial.mutate({ id: editingId, form }, { onSuccess });
    } else {
      createMaterial.mutate(form, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMaterial.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
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
        <QuotaButton resource="materials" onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Novo Material
        </QuotaButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: materials.length, icon: Package },
          { label: "Categorias", value: categories.length, icon: Layers },
          { label: "Preço Médio", value: formatCurrency(avgPrice), icon: DollarSign },
          { label: "Em Uso", value: materialsInUse, icon: ClipboardList },
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
          <Input placeholder="Buscar por nome ou categoria…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
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
                <TableHead className="hidden lg:table-cell">Uso</TableHead>
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
              ) : paged.map((m) => {
                const usage = materialUsageStats.get(m.id);
                return (
                <TableRow key={m.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{m.name}</p>
                        {m.notes && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{m.notes}</p>}
                        <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{m.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs font-normal">{m.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{m.charge_unit}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{m.measure_unit}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {usage ? (
                      <div>
                        <span className="text-sm font-semibold tabular-nums">{usage.budgetCount}</span>
                        <p className="text-[10px] text-muted-foreground">orçamento{usage.budgetCount !== 1 ? "s" : ""}</p>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-primary">{formatCurrency(m.base_price)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          Exibindo {filtered.length > 0 ? page * PAGE_SIZE + 1 : 0}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} materiais
          {categoryFilter !== "all" && <> • Filtro: <span className="font-medium text-foreground">{categoryFilter}</span></>}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próximo</Button>
          </div>
        )}
      </div>

      <MaterialFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isEditing={!!editingId}
        isPending={createMaterial.isPending || updateMaterial.isPending}
        categories={categories}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const usage = deleteId ? materialUsageStats.get(deleteId) : null;
                if (usage && usage.budgetCount > 0) {
                  return `⚠️ Este material está sendo usado em ${usage.budgetCount} orçamento${usage.budgetCount !== 1 ? "s" : ""} (${usage.itemCount} item${usage.itemCount !== 1 ? "ns" : ""}). A exclusão é permanente e não pode ser desfeita.`;
                }
                return "Esta ação não pode ser desfeita. O material será removido do catálogo.";
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMaterial.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMaterial.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
