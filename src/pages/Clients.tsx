import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockClients } from "@/data/mock";
import { Client } from "@/types";
import { Plus, Search, Pencil, Trash2, Users, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";

const emptyForm: Partial<Client> = { personType: "fisica", status: "active" };

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Client>>(emptyForm);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) || (c.document?.includes(q)) ||
      (c.razaoSocial?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = clients.filter(c => c.status === "active").length;
  const inactiveCount = clients.filter(c => c.status === "inactive").length;

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client: Client) => {
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
      toast.success("Cliente atualizado com sucesso!");
    } else {
      const newClient: Client = {
        id: Date.now().toString(),
        name: form.name!,
        phone: form.phone!,
        personType: form.personType || "fisica",
        document: form.document!,
        razaoSocial: form.razaoSocial,
        nomeFantasia: form.nomeFantasia,
        contact: form.contact,
        email: form.email,
        neighborhood: form.neighborhood,
        city: form.city,
        address: form.address,
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setClients(prev => [...prev, newClient]);
      toast.success("Cliente cadastrado com sucesso!");
    }
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setClients(prev => prev.filter(c => c.id !== deleteId));
    setDeleteId(null);
    toast.success("Cliente removido com sucesso!");
  };

  const toggleStatus = (id: string) => {
    setClients(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === "active" ? "inactive" as const : "active" as const } : c
    ));
  };

  const updateField = (field: keyof Client, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total", value: clients.length, icon: Users, color: "text-primary" },
          { label: "Ativos", value: activeCount, icon: UserCheck, color: "text-primary" },
          { label: "Inativos", value: inactiveCount, icon: UserX, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold tabular-nums">{s.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone, documento…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
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
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden lg:table-cell">Documento</TableHead>
                <TableHead className="hidden md:table-cell">Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum cliente encontrado</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{c.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{c.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs">{c.document}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.city || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(c.id)}
                    >
                      {c.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}>
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

      <p className="text-sm text-muted-foreground">Exibindo {filtered.length} de {clients.length} clientes</p>

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
                <Input value={form.name || ""} onChange={(e) => updateField("name", e.target.value)} />
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
                <Input value={form.document || ""} onChange={(e) => updateField("document", e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={form.email || ""} onChange={(e) => updateField("email", e.target.value)} />
              </div>
            </div>
            {form.personType === "juridica" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Razão Social</Label><Input value={form.razaoSocial || ""} onChange={(e) => updateField("razaoSocial", e.target.value)} /></div>
                <div><Label>Nome Fantasia</Label><Input value={form.nomeFantasia || ""} onChange={(e) => updateField("nomeFantasia", e.target.value)} /></div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Contato</Label><Input value={form.contact || ""} onChange={(e) => updateField("contact", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={form.city || ""} onChange={(e) => updateField("city", e.target.value)} /></div>
              <div><Label>Bairro</Label><Input value={form.neighborhood || ""} onChange={(e) => updateField("neighborhood", e.target.value)} /></div>
              <div><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => updateField("address", e.target.value)} /></div>
            </div>
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
            <AlertDialogDescription>Esta ação não pode ser desfeita. O cliente será removido permanentemente.</AlertDialogDescription>
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
