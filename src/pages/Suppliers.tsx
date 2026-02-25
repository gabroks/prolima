import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useToggleSupplierActive, type SupplierForm, type DbSupplier } from "@/hooks/useSuppliers";
import { QuotaButton } from "@/components/QuotaButton";
import { useExpenses } from "@/hooks/useExpenses";
import { SupplierFormDialog } from "@/components/suppliers/SupplierFormDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { FilterBar } from "@/components/shared/FilterBar";
import { Plus, Search, Pencil, Trash2, Truck, CheckCircle, Phone, Mail, MapPin, ArrowUpDown, DollarSign, MessageCircle, Receipt, Download } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/formatters";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";

type SortKey = "name" | "city" | "status";
const PAGE_SIZE = 15;
const emptyForm: SupplierForm = { name: "", personType: "juridica", active: true };

export default function Suppliers() {
  const { data: suppliers = [], isLoading, isError } = useSuppliers();
  const { data: expenses = [] } = useExpenses();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const toggleActive = useToggleSupplierActive();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    suppliers.forEach(s => { if (s.city) cities.add(s.city); });
    return Array.from(cities).sort();
  }, [suppliers]);

  const filtered = useMemo(() => {
    let result = suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || (s.document?.includes(q)) || (s.phone?.includes(q)) || (s.city?.toLowerCase().includes(q)) || (s.email?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? s.active : !s.active);
      const matchType = typeFilter === "all" || s.person_type === typeFilter;
      const matchCity = cityFilter === "all" || s.city === cityFilter;
      return matchSearch && matchStatus && matchType && matchCity;
    });
    switch (sortBy) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "city": result.sort((a, b) => (a.city || "").localeCompare(b.city || "")); break;
      case "status": result.sort((a, b) => Number(b.active) - Number(a.active)); break;
    }
    return result;
  }, [suppliers, search, statusFilter, typeFilter, cityFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);
  const resetPage = () => setPage(0);

  const activeCount = suppliers.filter(s => s.active).length;
  const inactiveCount = suppliers.length - activeCount;

  const supplierExpenseStats = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    expenses.forEach(e => {
      if (e.supplier_id) {
        const prev = map.get(e.supplier_id) || { total: 0, count: 0 };
        prev.total += Number(e.amount);
        prev.count++;
        map.set(e.supplier_id, prev);
      }
    });
    return map;
  }, [expenses]);
  const totalSupplierExpenses = Array.from(supplierExpenseStats.values()).reduce((s, v) => s + v.total, 0);
  const totalExpenseCount = Array.from(supplierExpenseStats.values()).reduce((s, v) => s + v.count, 0);

  const formatWhatsApp = (phone: string) => `https://wa.me/55${phone.replace(/\D/g, "")}`;

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") { openNew(); setSearchParams({}, { replace: true }); }
  }, [searchParams]);
  const openEdit = (s: DbSupplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name, personType: s.person_type as "fisica" | "juridica",
      document: s.document || undefined, phone: s.phone || undefined,
      email: s.email || undefined, address: s.address || undefined,
      neighborhood: s.neighborhood || undefined, city: s.city || undefined,
      notes: s.notes || undefined, active: s.active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do fornecedor"); return; }
    const onSuccess = () => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); };
    if (editingId) updateSupplier.mutate({ id: editingId, form }, { onSuccess });
    else createSupplier.mutate(form, { onSuccess });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteSupplier.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const handleToggle = (s: DbSupplier) => toggleActive.mutate({ id: s.id, currentActive: s.active });

  const supplierToDelete = useMemo(() => deleteId ? suppliers.find(s => s.id === deleteId) || null : null, [deleteId, suppliers]);
  const activeFiltersCount = [statusFilter !== "all", typeFilter !== "all", cityFilter !== "all", !!search].filter(Boolean).length;

  const filterSummary = activeFiltersCount > 0
    ? [statusFilter !== "all" && (statusFilter === "active" ? "Ativos" : "Inativos"), typeFilter !== "all" && (typeFilter === "fisica" ? "PF" : "PJ"), cityFilter !== "all" && cityFilter, search && `"${search}"`].filter(Boolean).join(", ")
    : undefined;

  const exportCSV = useCallback(() => {
    exportToCSV({
      headers: ["Nome", "Tipo", "Documento", "Telefone", "Email", "Cidade", "Bairro", "Status"],
      rows: filtered.map(s => [
        s.name, s.person_type === "fisica" ? "PF" : "PJ", s.document || "", s.phone || "",
        s.email || "", s.city || "", s.neighborhood || "", s.active ? "Ativo" : "Inativo",
      ]),
      filename: "fornecedores",
      successMessage: `${filtered.length} fornecedores exportados`,
    });
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Truck className="h-10 w-10 text-destructive mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">Erro ao carregar fornecedores</h3>
        <p className="text-sm text-muted-foreground mt-1">Verifique sua conexão e tente novamente.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  const deleteDescription = (
    <>
      {supplierToDelete && (
        <span className="block mb-2 font-medium text-foreground">
          "{supplierToDelete.name}"{supplierToDelete.document ? ` — ${supplierToDelete.document}` : ""}
        </span>
      )}
      {(() => {
        const stats = deleteId ? supplierExpenseStats.get(deleteId) : null;
        if (stats && stats.count > 0) {
          return `⚠️ Este fornecedor possui ${stats.count} despesa${stats.count !== 1 ? "s" : ""} vinculada${stats.count !== 1 ? "s" : ""} (${formatCurrency(stats.total)}). A exclusão é permanente e não pode ser desfeita.`;
        }
        return "Esta ação não pode ser desfeita. O fornecedor será removido permanentemente.";
      })()}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fornecedores</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie seus fornecedores e contatos
            {activeFiltersCount > 0 && <span className="ml-2 text-primary font-medium">• {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          )}
          <QuotaButton resource="suppliers" onClick={openNew} className="shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />Novo Fornecedor
          </QuotaButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: String(suppliers.length), icon: Truck, bgColor: "bg-primary/10", iconColor: "text-primary" },
          { label: "Ativos", value: String(activeCount), icon: CheckCircle, bgColor: "bg-primary/10", iconColor: "text-primary", extra: inactiveCount > 0 ? `${inactiveCount} inativo${inactiveCount > 1 ? "s" : ""}` : null },
          { label: "Despesas", value: String(totalExpenseCount), icon: Receipt, bgColor: totalExpenseCount > 0 ? "bg-destructive/10" : "bg-muted", iconColor: totalExpenseCount > 0 ? "text-destructive" : "text-muted-foreground" },
          { label: "Total Gasto", value: formatCurrency(totalSupplierExpenses), icon: DollarSign, bgColor: totalSupplierExpenses > 0 ? "bg-destructive/10" : "bg-muted", iconColor: totalSupplierExpenses > 0 ? "text-destructive" : "text-muted-foreground" },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${s.bgColor} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold tabular-nums truncate">{s.value}</p>
                {"extra" in s && s.extra && <p className="text-[10px] text-muted-foreground">{s.extra}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <FilterBar
        activeFiltersCount={activeFiltersCount}
        onClearFilters={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setCityFilter("all"); resetPage(); }}
        searchInput={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, documento, telefone, cidade…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
          </div>
        }
        filters={<>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="fisica">Pessoa Física</SelectItem>
              <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>
          {availableCities.length > 0 && (
            <Select value={cityFilter} onValueChange={(v) => { setCityFilter(v); resetPage(); }}>
              <SelectTrigger className="w-full md:w-[160px]">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas cidades</SelectItem>
                {availableCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-full md:w-[140px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="city">Cidade</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </>}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                <TableHead className="hidden sm:table-cell">Gasto Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Truck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{activeFiltersCount > 0 ? "Nenhum fornecedor encontrado com os filtros aplicados" : "Nenhum fornecedor cadastrado"}</p>
                    {activeFiltersCount > 0 ? (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setCityFilter("all"); }}>
                        Limpar filtros
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro fornecedor
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : paged.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(s.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{s.name}</p>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">{s.person_type === "fisica" ? "PF" : "PJ"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{s.document || "—"}</p>
                        <div className="flex flex-wrap gap-2 mt-1 md:hidden">
                          {s.phone && (
                            <a href={`tel:${s.phone}`} className="text-xs text-primary flex items-center gap-1 hover:underline" onClick={e => e.stopPropagation()}>
                              <Phone className="h-3 w-3" />{s.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      {s.phone && <a href={`tel:${s.phone}`} className="text-sm flex items-center gap-1.5 text-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}><Phone className="h-3.5 w-3.5 text-muted-foreground" />{s.phone}</a>}
                      {s.email && <a href={`mailto:${s.email}`} className="text-sm flex items-center gap-1.5 text-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}><Mail className="h-3.5 w-3.5 text-muted-foreground" />{s.email}</a>}
                      {!s.phone && !s.email && <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {s.city ? <span className="text-sm flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" />{s.city}{s.neighborhood ? `, ${s.neighborhood}` : ""}</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {(() => {
                      const stats = supplierExpenseStats.get(s.id);
                      if (!stats) return <span className="text-muted-foreground text-xs">—</span>;
                      return (
                        <div>
                          <span className="text-sm font-semibold tabular-nums text-destructive">{formatCurrency(stats.total)}</span>
                          <p className="text-[10px] text-muted-foreground">{stats.count} despesa{stats.count !== 1 ? "s" : ""}</p>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.active ? "default" : "secondary"} className="cursor-pointer select-none" onClick={() => handleToggle(s)}>
                      {s.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {s.phone && (
                        <a href={formatWhatsApp(s.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors" onClick={e => e.stopPropagation()} title="WhatsApp">
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                        </a>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationFooter page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} label="fornecedores" filterSummary={filterSummary} />

      <SupplierFormDialog open={dialogOpen} onOpenChange={setDialogOpen} form={form} onFormChange={setForm} onSave={handleSave} isEditing={!!editingId} isSaving={createSupplier.isPending || updateSupplier.isPending} />

      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete} title="Excluir fornecedor?" description={deleteDescription} isDeleting={deleteSupplier.isPending} />
    </div>
  );
}
