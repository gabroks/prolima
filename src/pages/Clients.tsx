import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useToggleClientStatus, ClientForm, DbClient } from "@/hooks/useClients";
import {
  Plus, Search, Pencil, Trash2, Users, UserCheck, UserX, Building2,
  ArrowUpDown, Phone, Mail, MapPin, MessageCircle,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

type SortKey = "name" | "date-desc" | "date-asc" | "city";
const PAGE_SIZE = 15;

const emptyForm: ClientForm = { name: "", phone: "", personType: "fisica", document: "", status: "active" };

export default function Clients() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const toggleStatus = useToggleClientStatus();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [page, setPage] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

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
      return matchSearch && matchStatus && matchType;
    });

    switch (sortBy) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "date-desc": result.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case "date-asc": result.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "city": result.sort((a, b) => (a.city || "").localeCompare(b.city || "")); break;
    }
    return result;
  }, [clients, search, statusFilter, typeFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  // Reset page when filters change
  const resetPage = () => setPage(0);

  const activeCount = clients.filter(c => c.status === "active").length;
  const pjCount = clients.filter(c => c.person_type === "juridica").length;

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
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
    deleteClient.mutate(deleteId);
    setDeleteId(null);
  };

  const handleToggleStatus = (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStatus.mutate({ id, currentStatus });
  };

  const formatWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/55${digits}`;
  };

  const updateField = (field: keyof ClientForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));

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
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua carteira de clientes</p>
        </div>
        <Button onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Novo Cliente
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: clients.length, icon: Users, color: "text-primary" },
          { label: "Ativos", value: activeCount, icon: UserCheck, color: "text-primary" },
          { label: "Inativos", value: clients.length - activeCount, icon: UserX, color: "text-destructive" },
          { label: "Pessoa Jurídica", value: pjCount, icon: Building2, color: "text-primary" },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
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
          <Input placeholder="Buscar por nome, telefone, documento, email, cidade…" value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); resetPage(); }}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            <SelectItem value="fisica">Pessoa Física</SelectItem>
            <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[150px]">
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
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{search || statusFilter !== "all" || typeFilter !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
                    {!search && statusFilter === "all" && typeFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro cliente
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : paged.map((c) => (
                <TableRow key={c.id} className="group cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                  <TableCell>
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
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          Exibindo {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length} clientes
          {(statusFilter !== "all" || typeFilter !== "all") && (
            <> • Filtros ativos: {[
              statusFilter !== "all" && (statusFilter === "active" ? "Ativos" : "Inativos"),
              typeFilter !== "all" && (typeFilter === "fisica" ? "PF" : "PJ"),
            ].filter(Boolean).join(", ")}</>
          )}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próximo</Button>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
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
                <Select value={form.personType} onValueChange={(v: "fisica" | "juridica") => setForm({ ...form, personType: v })}>
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
            {editingId && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Cliente Ativo</Label>
                  <p className="text-xs text-muted-foreground">Desative para ocultar dos filtros padrão</p>
                </div>
                <Switch
                  checked={form.status === "active"}
                  onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createClient.isPending || updateClient.isPending}>
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente e todo o histórico associado serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteClient.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteClient.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
