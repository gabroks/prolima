import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Download, Upload, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Backup() {
  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold">Backup dos Dados</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Criar Backup</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nome do Backup</Label><Input value={backupName} onChange={(e) => setBackupName(e.target.value)} placeholder="Ex: Backup Fevereiro 2025" /></div>
          <div><Label>Descrição (opcional)</Label><Textarea value={backupDescription} onChange={(e) => setBackupDescription(e.target.value)} /></div>
          <div className="flex gap-3">
            <Button onClick={() => toast.success("Backup salvo no banco!")}><Database className="h-4 w-4 mr-2" />Salvar no Banco</Button>
            <Button variant="outline" onClick={() => toast.success("Arquivo de backup gerado!")}><Download className="h-4 w-4 mr-2" />Baixar Arquivo</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Restaurar de Arquivo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" />
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>A restauração substituirá todos os dados atuais e não pode ser desfeita.</AlertDescription>
          </Alert>
          <Button variant="destructive"><Upload className="h-4 w-4 mr-2" />Restaurar Backup</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Meus Backups Salvos</CardTitle>
            <Button variant="ghost" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Nenhum backup encontrado</p>
        </CardContent>
      </Card>
    </div>
  );
}
