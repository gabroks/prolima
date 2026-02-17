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
import { Switch } from "@/components/ui/switch";
import { mockSuppliers, mockExpenses } from "@/data/mock";
import { Supplier } from "@/types";
import { Plus, Search, Pencil, Trash2, Truck, CheckCircle, XCircle, Phone, Mail, MapPin, ArrowUpDown, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";

type SortKey = "name" | "city" | "status";

const emptyForm: Partial<Supplier> = { personType: "juridica", active: true };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Supplier>>(emptyForm);

  const filtered = useMemo(() => {
    let result = suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = s.name.toLowerCase().includes(q) || (s.document?.includes(q)) || (s.phone?.includes(q)) || (s.city?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "all" || (statusFilter === "active" ? s.active : !s.active);
      return matchSearch && matchStatus;
    });

    switch (sortBy) {
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "city": result.sort((a, b) => (a.city || "").localeCompare(b.city || "")); break;
      case "status": result.sort((a, b) => Number(b.active) - Number(a.active)); break;
    }
    return result;
  }, [suppliers, search, statusFilter, sortBy]);

  const activeCount = suppliers.filter(s => s.active).length;
  const cities = useMemo(() => [...new Set(suppliers.map(s => s.city).filter(Boolean))], [suppliers]);

  // Expense totals per supplier
  const supplierExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    mockExpenses.forEach(e => { if (e.supplierId) map[e.supplierId] = (map[e.supplierId] || 0) + e.amount; });
    return map;
  }, []);
  const totalSupplierExpenses = Object.values(supplierExpenses).reduce((s, v) => s + v, 0);

  const openNew = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (s: Supplier) => { setEditingId(s.id); setForm({ ...s }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name) { toast.error("Informe o nome do fornecedor"); return; }
    if (editingId) {
      setSuppliers(prev => prev.map(s => s.id === editingId ? { ...s, ...form } as Supplier : s));
      toast.success("Fornecedor atualizado!");
    } else {
      const newSupplier: Supplier = {
        id: Date.now().toString(), name: form.name!, personType: form.personType || "juridica",
        document: form.document, phone: form.phone, email: form.email,
        address: form.address, neighborhood: form.neighborhood, city: form.city,
        notes: form.notes, active: form.active ?? true,
      };
      setSuppliers(prev => [...prev, newSupplier]);
      toast.success("Fornecedor cadastrado!");
    }
    setDialogOpen(false); setForm(emptyForm); setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setSuppliers(prev => prev.filter(s => s.id !== deleteId));
    setDeleteId(null);
    toast.success("Fornecedor removido!");
  };

  const toggleActive = (id: string) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
    const supplier = suppliers.find(s => s.id === id);
    toast.success(`${supplier?.name} ${supplier?.active ? "desativado" : "ativado"}`);
  };

  const updateField = (field: keyof Supplier, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fornecedores</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus fornecedores e contatos</p>
        </div>
        <Button onClick={openNew} className="shadow-md shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />Novo Fornecedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: suppliers.length, icon: Truck, color: "text-primary" },
          { label: "Ativos", value: activeCount, icon: CheckCircle, color: "text-primary" },
          { label: "Inativos", value: suppliers.length - activeCount, icon: XCircle, color: "text-destructive" },
          { label: "Total Gasto", value: formatCurrency(totalSupplierExpenses), icon: DollarSign, color: "text-primary" },
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
          <Input placeholder="Buscar por nome, documento, telefone, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome A-Z</SelectItem>
            <SelectItem value="city">Cidade</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                    <p>{search || statusFilter !== "all" ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}</p>
                    {!search && statusFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" />Cadastrar primeiro fornecedor
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{s.document || "—"}</p>
                      {/* Mobile contact info */}
                      <div className="flex flex-wrap gap-2 mt-1 md:hidden">
                        {s.phone && (
                          <a href={`tel:${s.phone}`} className="text-xs text-primary flex items-center gap-1 hover:underline" onClick={e => e.stopPropagation()}>
                            <Phone className="h-3 w-3" />{s.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="space-y-1">
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="text-sm flex items-center gap-1.5 text-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />{s.phone}
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="text-sm flex items-center gap-1.5 text-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />{s.email}
                        </a>
                      )}
                      {!s.phone && !s.email && <span className="text-sm text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {s.city ? (
                      <span className="text-sm flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />{s.city}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm font-semibold tabular-nums text-primary">
                      {supplierExpenses[s.id] ? formatCurrency(supplierExpenses[s.id]) : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={s.active ? "default" : "secondary"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleActive(s.id)}
                    >
                      {s.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(s.id)}>
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
        Exibindo {filtered.length} de {suppliers.length} fornecedores
        {statusFilter !== "all" && <> • Filtro: <span className="font-medium text-foreground">{statusFilter === "active" ? "Ativos" : "Inativos"}</span></>}
      </p>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
            <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} placeholder="Nome do fornecedor" />
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
              <Label>{form.personType === "juridica" ? "CNPJ" : "CPF"}</Label>
              <Input value={form.document || ""} onChange={(e) => updateField("document", e.target.value)} placeholder={form.personType === "juridica" ? "00.000.000/0001-00" : "000.000.000-00"} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => updateField("email", e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.city || ""} onChange={(e) => updateField("city", e.target.value)} />
            </div>
            <div>
              <Label>Bairro</Label>
              <Input value={form.neighborhood || ""} onChange={(e) => updateField("neighborhood", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} placeholder="Rua, número, complemento" />
            </div>
            <div className="sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações adicionais…" />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">Fornecedor Ativo</Label>
                <p className="text-xs text-muted-foreground">Desative para ocultar dos filtros padrão</p>
              </div>
              <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
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
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. O fornecedor será removido permanentemente.</AlertDialogDescription>
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
