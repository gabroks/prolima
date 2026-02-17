import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Database, Download, Upload, AlertTriangle, HardDrive, Clock,
  Trash2, Shield, CalendarClock, CheckCircle2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/formatters";

interface BackupEntry {
  id: string;
  name: string;
  description?: string;
  date: string;
  size: string;
  type: "cloud" | "local";
}

const mockBackups: BackupEntry[] = [
  { id: "1", name: "Backup Fevereiro 2025", description: "Backup mensal completo", date: "2025-02-01", size: "2.4 MB", type: "cloud" },
  { id: "2", name: "Backup Janeiro 2025", date: "2025-01-15", size: "1.8 MB", type: "cloud" },
  { id: "3", name: "Backup Dezembro 2024", description: "Backup de fim de ano", date: "2024-12-28", size: "1.5 MB", type: "local" },
];

export default function Backup() {
  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");
  const [backups, setBackups] = useState<BackupEntry[]>(mockBackups);
  const [autoBackup, setAutoBackup] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const totalSize = backups.reduce((s, b) => s + parseFloat(b.size), 0).toFixed(1);
  const maxStorage = 50; // MB
  const usagePct = Math.min((parseFloat(totalSize) / maxStorage) * 100, 100);

  const handleCreate = async (type: "cloud" | "local") => {
    if (!backupName.trim()) { toast.error("Informe um nome para o backup"); return; }
    setCreating(true);
    // Simulate
    await new Promise(r => setTimeout(r, 1200));
    const newBackup: BackupEntry = {
      id: Date.now().toString(), name: backupName, description: backupDescription,
      date: new Date().toISOString().split("T")[0], size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`, type,
    };
    setBackups(prev => [newBackup, ...prev]);
    setBackupName(""); setBackupDescription("");
    setCreating(false);
    toast.success(type === "cloud" ? "Backup salvo na nuvem!" : "Arquivo de backup gerado!");
  };

  const handleDelete = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    setDeleteDialog(null);
    toast.success("Backup removido!");
  };

  const handleRestore = () => {
    setRestoreDialog(false);
    toast.success("Restauração iniciada! Os dados serão atualizados em instantes.");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Backup dos Dados</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie cópias de segurança do seu sistema</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de backups</p>
              <p className="text-xl font-bold tabular-nums">{backups.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Último backup</p>
              <p className="text-lg font-bold">{backups.length > 0 ? formatDate(backups[0].date) : "Nenhum"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Armazenamento</p>
              <p className="text-lg font-bold tabular-nums">{totalSize} / {maxStorage} MB</p>
            </div>
          </div>
          <Progress value={usagePct} className="h-1.5" />
        </Card>
      </div>

      {/* Auto Backup */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarClock className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Backup automático</p>
              <p className="text-xs text-muted-foreground">Cria backup semanal automaticamente toda segunda-feira</p>
            </div>
          </div>
          <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
        </div>
        {autoBackup && (
          <div className="flex items-center gap-2 mt-3 ml-12">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-primary font-medium">Próximo backup: segunda-feira</span>
          </div>
        )}
      </Card>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Criar Backup
          </CardTitle>
          <CardDescription>Salve uma cópia de segurança dos seus dados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Nome do Backup *</Label>
              <Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="Ex: Backup Fevereiro 2025" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={backupDescription} onChange={(e) => setBackupDescription(e.target.value)} placeholder="Descrição opcional…" className="mt-1.5" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => handleCreate("cloud")} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Salvar na Nuvem
            </Button>
            <Button variant="outline" onClick={() => handleCreate("local")} disabled={creating}>
              <Download className="h-4 w-4 mr-2" />Baixar Arquivo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restaurar de Arquivo</CardTitle>
          <CardDescription>Importe um backup previamente exportado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</p>
            <p className="text-xs text-muted-foreground mt-1">.json, .zip</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setRestoreDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />Restaurar Dados
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Backups</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="hidden sm:table-cell">Tamanho</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Database className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium">Nenhum backup encontrado</p>
                    <p className="text-xs mt-1">Crie seu primeiro backup acima</p>
                  </TableCell>
                </TableRow>
              ) : backups.map(b => (
                <TableRow key={b.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{b.name}</p>
                      {b.description && <p className="text-xs text-muted-foreground">{b.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm tabular-nums">{formatDate(b.date)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs tabular-nums">{b.size}</TableCell>
                  <TableCell>
                    <Badge variant={b.type === "cloud" ? "default" : "secondary"} className="text-[10px]">
                      {b.type === "cloud" ? "Nuvem" : "Local"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success("Baixando backup…")} title="Baixar">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteDialog(b.id)} title="Excluir">
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

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />Confirmar Restauração
            </DialogTitle>
            <DialogDescription>
              A restauração substituirá <strong>todos os dados atuais</strong> pelos dados do backup. Esta ação não pode ser desfeita. Tem certeza?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRestore}>Sim, restaurar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir backup?</DialogTitle>
            <DialogDescription>
              O backup será removido permanentemente. Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
