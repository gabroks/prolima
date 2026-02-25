import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, MaterialForm, DbMaterial } from "@/hooks/useMaterials";
import { useBudgets } from "@/hooks/useBudgets";
import { QuotaButton } from "@/components/QuotaButton";
import { MaterialFormDialog } from "@/components/materials/MaterialFormDialog";
import { Plus, Search, Pencil, Trash2, Package, ArrowUpDown, DollarSign, Layers, ClipboardList, TrendingUp, TrendingDown, Download } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/formatters";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";

type SortKey = "name" | "price-asc" | "price-desc" | "category";
const PAGE_SIZE = 15;

const emptyForm: MaterialForm = { name: "", category: "", chargeUnit: "m²", measureUnit: "centímetro", basePrice: 0 };

export default function Materials() {
  const { data: materials = [], isLoading, isError } = useMaterials();
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
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.category?.toLowerCase().includes(q) || m.notes?.toLowerCase().includes(q);
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
  const maxPrice = materials.length > 0 ? Math.max(...materials.map(m => m.base_price)) : 0;
  const minPrice = materials.length > 0 ? Math.min(...materials.map(m => m.base_price)) : 0;

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
  const unusedCount = materials.length - materialsInUse;

  // Active filters count
  const activeFiltersCount = [categoryFilter !== "all", !!search].filter(Boolean).length;

  // Delete dialog: find material info
  const materialToDelete = useMemo(() => {
    if (!deleteId) return null;
    return materials.find(m => m.id === deleteId) || null;
  }, [deleteId, materials]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") { openNew(); setSearchParams({}, { replace: true }); }
  }, [searchParams]);
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

  const exportCSV = useCallback(() => {
    exportToCSV({
      headers: ["Nome", "Categoria", "Unidade Cobrança", "Unidade Medida", "Preço Base", "Observações"],
      rows: filtered.map(m => [
        m.name, m.category || "", m.charge_unit, m.measure_unit,
        String(m.base_price), m.notes || "",
      ]),
      filename: "materiais",
      successMessage: `${filtered.length} materiais exportados`,
    });
  }, [filtered]);

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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="h-10 w-10 text-destructive mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">Erro ao carregar materiais</h3>
        <p className="text-sm text-muted-foreground mt-1">Verifique sua conexão e tente novamente.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Materiais</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie o catálogo de materiais e preços
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-primary font-medium">• {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          )}
          <QuotaButton resource="materials" onClick={openNew} className="shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />Novo Material
          </QuotaButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: String(materials.length), icon: Package, bgColor: "bg-primary/10", iconColor: "text-primary", extra: `${categories.length} categoria${categories.length !== 1 ? "s" : ""}` },
          { label: "Preço Médio", value: formatCurrency(avgPrice), icon: DollarSign, bgColor: "bg-primary/10", iconColor: "text-primary", extra: `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}` },
          { label: "Em Uso", value: String(materialsInUse), icon: ClipboardList, bgColor: materialsInUse > 0 ? "bg-primary/10" : "bg-muted", iconColor: materialsInUse > 0 ? "text-primary" : "text-muted-foreground", extra: unusedCount > 0 ? `${unusedCount} sem uso` : null },
          { label: "Categorias", value: String(categories.length), icon: Layers, bgColor: "bg-primary/10", iconColor: "text-primary", extra: categories.length > 0 ? categories.slice(0, 2).join(", ") + (categories.length > 2 ? "…" : "") : null },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${s.bgColor} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
                {"extra" in s && s.extra && (
                  <p className="text-[10px] text-muted-foreground truncate">{s.extra}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, categoria ou observação…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[160px]">
            <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
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
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setSearch(""); setCategoryFilter("all"); resetPage(); }}>
            Limpar filtros
          </Button>
        )}
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
                    <p>{activeFiltersCount > 0 ? "Nenhum material encontrado" : "Nenhum material cadastrado"}</p>
                    {activeFiltersCount === 0 && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro material
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : paged.map((m) => {
                const usage = materialUsageStats.get(m.id);
                const priceVsAvg = avgPrice > 0 ? ((m.base_price - avgPrice) / avgPrice) * 100 : 0;
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
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="tabular-nums font-semibold text-primary">{formatCurrency(m.base_price)}</span>
                      {materials.length > 1 && Math.abs(priceVsAvg) > 10 && (
                        priceVsAvg > 0 ? (
                          <TrendingUp className="h-3 w-3 text-destructive" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-primary" />
                        )
                      )}
                    </div>
                  </TableCell>
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

      <PaginationFooter
        page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE}
        onPageChange={setPage} label="materiais"
        filterSummary={activeFiltersCount > 0 ? [categoryFilter !== "all" && categoryFilter, search && `"${search}"`].filter(Boolean).join(", ") : undefined}
      />

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

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir material?" isDeleting={deleteMaterial.isPending}
        description={<>{materialToDelete && <span className="block mb-2 font-medium text-foreground">"{materialToDelete.name}" — {materialToDelete.category} — {formatCurrency(materialToDelete.base_price)}/{materialToDelete.charge_unit}</span>}{(() => { const usage = deleteId ? materialUsageStats.get(deleteId) : null; if (usage && usage.budgetCount > 0) return `⚠️ Este material está sendo usado em ${usage.budgetCount} orçamento${usage.budgetCount !== 1 ? "s" : ""} (${usage.itemCount} item${usage.itemCount !== 1 ? "ns" : ""}). A exclusão é permanente e não pode ser desfeita.`; return "Esta ação não pode ser desfeita. O material será removido do catálogo."; })()}</>}
      />
    </div>
  );
}
