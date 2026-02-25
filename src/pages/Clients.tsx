import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { PaginationFooter } from "@/components/shared/PaginationFooter";
import { FilterBar } from "@/components/shared/FilterBar";
import { PageLoading, PageError } from "@/components/shared/PageStates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useToggleClientStatus, ClientForm, DbClient } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";
import { QuotaButton } from "@/components/QuotaButton";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import {
  Plus, Search, Pencil, Trash2, Users, UserCheck, UserX, Building2,
  ArrowUpDown, Phone, Mail, MapPin, MessageCircle, FileText, DollarSign, Download,
} from "lucide-react";
import { formatDate, formatCurrency, getInitials } from "@/lib/formatters";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/exportCsv";

type SortKey = "name" | "date-desc" | "date-asc" | "city";
const PAGE_SIZE = 15;

const emptyForm: ClientForm = { name: "", phone: "", personType: "fisica", document: "", status: "active" };

export default function Clients() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading, isError } = useClients();
  const { data: budgets = [] } = useBudgets();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const toggleStatus = useToggleClientStatus();

  // Pre-compute budget stats per client
  const clientStats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; approved: number }>();
    budgets.forEach(b => {
      const prev = map.get(b.client_id || "") || { count: 0, total: 0, approved: 0 };
      prev.count++;
      prev.total += Number(b.total);
      if (b.status === "approved") prev.approved++;
      map.set(b.client_id || "", prev);
    });
    return map;
  }, [budgets]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  // Available cities for filter
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    clients.forEach(c => { if (c.city) cities.add(c.city); });
    return Array.from(cities).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = clients.filter((c) => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) || c.document?.includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.razao_social?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchType = typeFilter === "all" || c.person_type === typeFilter;
      const matchCity = cityFilter === "all" || c.city === cityFilter;
      return matchSearch && matchStatus && matchType && matchCity;
    });

    switch (sortBy) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "date-desc": result.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case "date-asc": result.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "city": result.sort((a, b) => (a.city || "").localeCompare(b.city || "")); break;
    }
    return result;
  }, [clients, search, statusFilter, typeFilter, cityFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  const resetPage = () => setPage(0);

  const activeCount = clients.filter(c => c.status === "active").length;
  const inactiveCount = clients.length - activeCount;
  const pjCount = clients.filter(c => c.person_type === "juridica").length;
  const totalBudgetValue = useMemo(() => budgets.reduce((s, b) => s + Number(b.total), 0), [budgets]);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  // Handle ?new=1 from CommandPalette
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get("new") === "1") { openNew(); setSearchParams({}, { replace: true }); }
  }, [searchParams]);
  const openEdit = (client: DbClient, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(client.id);
    setForm({
      name: client.name, phone: client.phone,
      personType: client.person_type as "fisica" | "juridica",
      document: client.document,
      razaoSocial: client.razao_social || undefined,
      nomeFantasia: client.nome_fantasia || undefined,
      contact: client.contact || undefined,
      email: client.email || undefined,
      neighborhood: client.neighborhood || undefined,
      city: client.city || undefined,
      address: client.address || undefined,
      status: client.status as "active" | "inactive",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do cliente"); return; }
    if (!form.phone) { toast.error("Informe o telefone do cliente"); return; }
    if (!form.document) { toast.error("Informe o CPF/CNPJ do cliente"); return; }
    const onSuccess = () => { setDialogOpen(false); setForm(emptyForm); setEditingId(null); };
    if (editingId) {
      updateClient.mutate({ id: editingId, form }, { onSuccess });
    } else {
      createClient.mutate(form, { onSuccess });
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteClient.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const handleToggleStatus = (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatus.mutate({ id, currentStatus });
  };

  const formatWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/55${digits}`;
  };

  const exportCSV = useCallback(() => {
    exportToCSV({
      headers: ["Nome", "Tipo", "Documento", "Telefone", "Email", "Cidade", "Bairro", "Status"],
      rows: filtered.map(c => [
        c.name, c.person_type === "fisica" ? "PF" : "PJ", c.document, c.phone,
        c.email || "", c.city || "", c.neighborhood || "", c.status === "active" ? "Ativo" : "Inativo",
      ]),
      filename: "clientes",
      successMessage: `${filtered.length} clientes exportados`,
    });
  }, [filtered]);

  // Delete dialog: find client info
  const clientToDelete = useMemo(() => {
    if (!deleteId) return null;
    return clients.find(c => c.id === deleteId) || null;
  }, [deleteId, clients]);

  // Active filters count
  const activeFiltersCount = [statusFilter !== "all", typeFilter !== "all", cityFilter !== "all", !!search].filter(Boolean).length;

  if (isLoading) return <PageLoading />;
  if (isError) return <PageError icon={Users} title="Erro ao carregar clientes" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie sua carteira de clientes
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
          <QuotaButton resource="clients" onClick={openNew} className="shadow-md shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />Novo Cliente
          </QuotaButton>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: String(clients.length), icon: Users, bgColor: "bg-primary/10", iconColor: "text-primary" },
          { label: "Ativos", value: String(activeCount), icon: UserCheck, bgColor: "bg-primary/10", iconColor: "text-primary", extra: inactiveCount > 0 ? `${inactiveCount} inativo${inactiveCount > 1 ? "s" : ""}` : null },
          { label: "Pessoa Jurídica", value: String(pjCount), icon: Building2, bgColor: "bg-primary/10", iconColor: "text-primary", extra: clients.length > 0 ? `${Math.round((pjCount / clients.length) * 100)}%` : null },
          { label: "Valor Gerado", value: formatCurrency(totalBudgetValue), icon: DollarSign, bgColor: totalBudgetValue > 0 ? "bg-primary/10" : "bg-muted", iconColor: totalBudgetValue > 0 ? "text-primary" : "text-muted-foreground" },
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
                  <p className="text-[10px] text-muted-foreground">{s.extra}</p>
                )}
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
            <Input placeholder="Buscar por nome, telefone, documento, email, cidade…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
          </div>
        }
        filters={<>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
            <SelectTrigger className="w-full md:w-[130px]"><SelectValue /></SelectTrigger>
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
                {availableCities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="w-full md:w-[150px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome A-Z</SelectItem>
              <SelectItem value="date-desc">Mais recente</SelectItem>
              <SelectItem value="date-asc">Mais antigo</SelectItem>
              <SelectItem value="city">Cidade</SelectItem>
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
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">Localização</TableHead>
                <TableHead className="hidden xl:table-cell">Orçamentos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{activeFiltersCount > 0 ? "Nenhum cliente encontrado com os filtros aplicados" : "Nenhum cliente cadastrado"}</p>
                    {activeFiltersCount > 0 ? (
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setCityFilter("all"); }}>
                        Limpar filtros
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro cliente
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : paged.map((c) => (
                <TableRow key={c.id} className="group cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0 hidden sm:flex">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-primary hover:underline">{c.name}</p>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">
                            {c.person_type === "fisica" ? "PF" : "PJ"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.document}</p>
                        <div className="flex gap-2 mt-1 md:hidden">
                          <a href={`tel:${c.phone}`} className="text-xs text-primary flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Phone className="h-3 w-3" />{c.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      <a href={`tel:${c.phone}`} className="text-sm flex items-center gap-1.5 hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />{c.phone}
                      </a>
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-sm flex items-center gap-1.5 hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />{c.email}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {c.city ? (
                      <span className="text-sm flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {c.city}{c.neighborhood ? `, ${c.neighborhood}` : ""}
                      </span>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {(() => {
                      const stats = clientStats.get(c.id);
                      if (!stats || stats.count === 0) return <span className="text-muted-foreground text-xs">—</span>;
                      return (
                        <div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium tabular-nums">{stats.count}</span>
                            <span className="text-muted-foreground text-xs">({stats.approved} aprov.)</span>
                          </div>
                          <p className="text-xs text-muted-foreground tabular-nums mt-0.5 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(stats.total)}
                          </p>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer select-none"
                      onClick={(e) => handleToggleStatus(c.id, c.status, e)}
                    >
                      {c.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <a
                        href={formatWhatsApp(c.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors"
                        onClick={e => e.stopPropagation()}
                        title="WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-primary" />
                      </a>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => openEdit(c, e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }}>
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

      <PaginationFooter
        page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE}
        onPageChange={setPage} label="clientes"
        filterSummary={activeFiltersCount > 0 ? [statusFilter !== "all" && (statusFilter === "active" ? "Ativos" : "Inativos"), typeFilter !== "all" && (typeFilter === "fisica" ? "PF" : "PJ"), cityFilter !== "all" && cityFilter, search && `"${search}"`].filter(Boolean).join(", ") : undefined}
      />

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        isEditing={!!editingId}
        isSaving={createClient.isPending || updateClient.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Excluir cliente?" isDeleting={deleteClient.isPending}
        description={<>{clientToDelete && <span className="block mb-2 font-medium text-foreground">"{clientToDelete.name}" — {clientToDelete.document}</span>}{(() => { const stats = deleteId ? clientStats.get(deleteId) : null; if (stats && stats.count > 0) return `⚠️ Este cliente possui ${stats.count} orçamento${stats.count !== 1 ? "s" : ""} vinculado${stats.count !== 1 ? "s" : ""} (${formatCurrency(stats.total)}). A exclusão é permanente e não pode ser desfeita.`; return "Esta ação não pode ser desfeita. O cliente será removido permanentemente."; })()}</>}
      />
    </div>
  );
}
