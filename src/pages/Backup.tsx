import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, Download, Upload, AlertTriangle, HardDrive, Clock, Trash2 } from "lucide-react";
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
];

export default function Backup() {
  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");
  const [backups, setBackups] = useState<BackupEntry[]>(mockBackups);

  const handleCreate = (type: "cloud" | "local") => {
    if (!backupName.trim()) { toast.error("Informe um nome para o backup"); return; }
    const newBackup: BackupEntry = {
      id: Date.now().toString(), name: backupName, description: backupDescription,
      date: new Date().toISOString().split("T")[0], size: "0.5 MB", type,
    };
    setBackups(prev => [newBackup, ...prev]);
    setBackupName(""); setBackupDescription("");
    toast.success(type === "cloud" ? "Backup salvo na nuvem!" : "Arquivo de backup gerado!");
  };

  const handleDelete = (id: string) => {
    setBackups(prev => prev.filter(b => b.id !== id));
    toast.success("Backup removido!");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">Backup dos Dados</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de backups</p>
              <p className="text-xl font-bold tabular-nums">{backups.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Último backup</p>
              <p className="text-xl font-bold">{backups.length > 0 ? formatDate(backups[0].date) : "Nenhum"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Criar Backup</CardTitle>
          <CardDescription>Salve uma cópia de segurança dos seus dados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Nome do Backup *</Label><Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="Ex: Backup Fevereiro 2025" /></div>
            <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={backupDescription} onChange={(e) => setBackupDescription(e.target.value)} placeholder="Descrição opcional…" /></div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => handleCreate("cloud")}><Database className="h-4 w-4 mr-2" />Salvar na Nuvem</Button>
            <Button variant="outline" onClick={() => handleCreate("local")}><Download className="h-4 w-4 mr-2" />Baixar Arquivo</Button>
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
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>A restauração substituirá todos os dados atuais. Esta ação não pode ser desfeita.</AlertDescription>
          </Alert>
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
                    <Database className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Nenhum backup encontrado</p>
                  </TableCell>
                </TableRow>
              ) : backups.map(b => (
                <TableRow key={b.id} className="group">
                  <TableCell>
                    <div>
                      <p className="font-medium">{b.name}</p>
                      {b.description && <p className="text-xs text-muted-foreground">{b.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(b.date)}</TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">{b.size}</TableCell>
                  <TableCell>
                    <Badge variant={b.type === "cloud" ? "default" : "secondary"}>{b.type === "cloud" ? "Nuvem" : "Local"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success("Baixando backup…")}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}>
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
    </div>
  );
}
