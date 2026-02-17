import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockClients } from "@/data/mock";
import { Client } from "@/types";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({ personType: "fisica", status: "active" });

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) || (c.razaoSocial?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = () => {
    if (!form.name || !form.phone || !form.document) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
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
    setClients([...clients, newClient]);
    setDialogOpen(false);
    setForm({ personType: "fisica", status: "active" });
    toast.success("Cliente cadastrado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone, razão social…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.document}</TableCell>
                  <TableCell>{c.city || "—"}</TableCell>
                  <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>Nome Completo *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Telefone/WhatsApp *</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
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
            <div><Label>{form.personType === "juridica" ? "CNPJ *" : "CPF *"}</Label><Input value={form.document || ""} onChange={(e) => setForm({ ...form, document: e.target.value })} /></div>
            {form.personType === "juridica" && (
              <>
                <div><Label>Razão Social</Label><Input value={form.razaoSocial || ""} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} /></div>
                <div><Label>Nome Fantasia</Label><Input value={form.nomeFantasia || ""} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} /></div>
              </>
            )}
            <div><Label>Contato</Label><Input value={form.contact || ""} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Bairro</Label><Input value={form.neighborhood || ""} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Endereço</Label><Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
