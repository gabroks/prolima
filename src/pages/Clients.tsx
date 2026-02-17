import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { mockClients, mockBudgets, mockPayments } from "@/data/mock";
import { Client } from "@/types";
import {
  Plus, Search, Pencil, Trash2, Users, UserCheck, UserX, Building2,
  ArrowUpDown, Phone, Mail, MapPin, MessageCircle, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/formatters";

type SortKey = "name" | "date-desc" | "date-asc" | "city";

const emptyForm: Partial<Client> = { personType: "fisica", status: "active" };

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Client>>(emptyForm);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = clients.filter((c) => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) || (c.document?.includes(q)) ||
        (c.email?.toLowerCase().includes(q)) ||
        (c.city?.toLowerCase().includes(q)) ||
        (c.razaoSocial?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchType = typeFilter === "all" || c.personType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });

    switch (sortBy) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "date-desc": result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case "date-asc": result.sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case "city": result.sort((a, b) => (a.city || "").localeCompare(b.city || "")); break;
    }
    return result;
  }, [clients, search, statusFilter, typeFilter, sortBy]);

  const activeCount = clients.filter(c => c.status === "active").length;
  const pjCount = clients.filter(c => c.personType === "juridica").length;
  const cities = useMemo(() => [...new Set(clients.map(c => c.city).filter(Boolean))], [clients]);

  // Budget count per client
  const budgetCounts = useMemo(() => {
    const map: Record<string, number> = {};
    mockBudgets.forEach(b => { map[b.clientId] = (map[b.clientId] || 0) + 1; });
    return map;
  }, []);

  // Revenue per client
  const clientRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    mockPayments.forEach(p => {
      const budget = mockBudgets.find(b => b.id === p.budgetId);
      if (budget) map[budget.clientId] = (map[budget.clientId] || 0) + p.amount;
    });
    return map;
  }, []);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(client.id);
    setForm({ ...client });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.phone || !form.document) {
      toast.error("Preencha os campos obrigatórios: Nome, Telefone e Documento");
      return;
    }
    if (editingId) {
      setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...form } as Client : c));
      toast.success("Cliente atualizado!");
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        name: form.name!, phone: form.phone!,
        personType: form.personType || "fisica",
        document: form.document!,
        razaoSocial: form.razaoSocial, nomeFantasia: form.nomeFantasia,
        contact: form.contact, email: form.email,
        neighborhood: form.neighborhood, city: form.city, address: form.address,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setClients(prev => [...prev, newClient]);
      toast.success("Cliente cadastrado!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setClients(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Cliente removido!");
  };

  const toggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const client = clients.find(c => c.id === id);
    setClients(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === "active" ? "inactive" as const : "active" as const } : c
    ));
    toast.success(`${client?.name} ${client?.status === "active" ? "desativado" : "ativado"}`);
  };

  const formatWhatsApp = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/55${digits}`;
  };

  const updateField = (field: keyof Client, value: string) => setForm(prev => ({ ...prev, [field]: value }));

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
          <Input placeholder="Buscar por nome, telefone, documento, email, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                <TableHead className="hidden sm:table-cell">Orçamentos</TableHead>
                <TableHead className="hidden sm:table-cell">Receita</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{search || statusFilter !== "all" || typeFilter !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
                    {!search && statusFilter === "all" && typeFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro cliente
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="group cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-primary hover:underline">{c.name}</p>
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {c.personType === "fisica" ? "PF" : "PJ"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.document}</p>
                      {/* Mobile contact */}
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
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm font-semibold tabular-nums">{budgetCounts[c.id] || 0}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {clientRevenue[c.id] ? formatCurrency(clientRevenue[c.id]) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer select-none"
                      onClick={(e) => toggleStatus(c.id, e)}
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

      <p className="text-xs text-muted-foreground">
        Exibindo {filtered.length} de {clients.length} clientes
        {(statusFilter !== "all" || typeFilter !== "all") && (
          <> • Filtros ativos: {[
            statusFilter !== "all" && (statusFilter === "active" ? "Ativos" : "Inativos"),
            typeFilter !== "all" && (typeFilter === "fisica" ? "PF" : "PJ"),
          ].filter(Boolean).join(", ")}</>
        )}
      </p>

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
                <Input value={form.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="(00) 00000-0000" />
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
                <Input value={form.document || ""} onChange={(e) => updateField("document", e.target.value)} placeholder={form.personType === "juridica" ? "00.000.000/0001-00" : "000.000.000-00"} />
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
            <Button onClick={handleSave}>{editingId ? "Atualizar" : "Salvar"}</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
