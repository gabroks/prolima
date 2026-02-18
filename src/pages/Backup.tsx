import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  Database, Download, Loader2, CheckCircle2, Package, Users,
  FileText, DollarSign, Receipt, Truck, Upload, FileDown,
  AlertTriangle, FileSpreadsheet, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useMaterials } from "@/hooks/useMaterials";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useQueryClient } from "@tanstack/react-query";

const TABLES = [
  { key: "clients", label: "Clientes", icon: Users },
  { key: "suppliers", label: "Fornecedores", icon: Truck },
  { key: "materials", label: "Materiais", icon: Package },
  { key: "budgets", label: "Orçamentos", icon: FileText },
  { key: "budget_items", label: "Itens de Orçamento", icon: FileText },
  { key: "payments", label: "Pagamentos", icon: DollarSign },
  { key: "expenses", label: "Despesas", icon: Receipt },
  { key: "company_settings", label: "Configurações", icon: Database },
] as const;

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function arrayToCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export default function Backup() {
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importConfirm, setImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{ tables: number; records: number } | null>(null);
  const [lastExport, setLastExport] = useState<{ date: string; tables: number; records: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clients = [] } = useClients();
  const { data: budgets = [] } = useBudgets();
  const { data: payments = [] } = usePayments();
  const { data: expenses = [] } = useExpenses();
  const { data: materials = [] } = useMaterials();
  const { data: suppliers = [] } = useSuppliers();
  const { data: companySettings } = useCompanySettings();

  const tableCounts: Record<string, number> = {
    clients: clients.length,
    suppliers: suppliers.length,
    materials: materials.length,
    budgets: budgets.length,
    budget_items: 0,
    payments: payments.length,
    expenses: expenses.length,
    company_settings: companySettings ? 1 : 0,
  };

  const totalRecords = Object.values(tableCounts).reduce((s, v) => s + v, 0);

  const getTableData = (key: string): Record<string, unknown>[] => {
    switch (key) {
      case "clients": return clients as unknown as Record<string, unknown>[];
      case "suppliers": return suppliers as unknown as Record<string, unknown>[];
      case "materials": return materials as unknown as Record<string, unknown>[];
      case "budgets": return budgets.map(({ budget_items, ...rest }) => rest) as unknown as Record<string, unknown>[];
      case "payments": return payments as unknown as Record<string, unknown>[];
      case "expenses": return expenses as unknown as Record<string, unknown>[];
      case "company_settings": return companySettings ? [companySettings] as unknown as Record<string, unknown>[] : [];
      default: return [];
    }
  };

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const { data: budgetItems } = await supabase.from("budget_items").select("*");
      const backup: Record<string, unknown> = {
        _meta: { exportedAt: new Date().toISOString(), version: "1.0", system: "Pro Orçamento" },
        clients, suppliers, materials,
        budgets: budgets.map(({ budget_items, ...rest }) => rest),
        budget_items: budgetItems || [],
        payments, expenses,
        company_settings: companySettings ? [companySettings] : [],
      };
      const date = new Date();
      downloadFile(JSON.stringify(backup, null, 2), `pro-orcamento-backup-${date.toISOString().slice(0, 10)}.json`, "application/json");
      const records = clients.length + suppliers.length + materials.length + budgets.length + (budgetItems?.length || 0) + payments.length + expenses.length + (companySettings ? 1 : 0);
      setLastExport({ date: date.toISOString(), tables: 8, records });
      toast.success(`Backup exportado com ${records} registros!`);
    } catch (err: any) {
      toast.error("Erro ao exportar: " + (err.message || "erro desconhecido"));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async (tableKey: string) => {
    setExportingCsv(tableKey);
    try {
      let data: Record<string, unknown>[];
      if (tableKey === "budget_items") {
        const { data: items } = await supabase.from("budget_items").select("*");
        data = (items || []) as unknown as Record<string, unknown>[];
      } else {
        data = getTableData(tableKey);
      }
      if (data.length === 0) {
        toast.error("Nenhum registro para exportar");
        return;
      }
      const csv = arrayToCsv(data);
      const label = TABLES.find(t => t.key === tableKey)?.label || tableKey;
      downloadFile(csv, `pro-orcamento-${tableKey}-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
      toast.success(`${label}: ${data.length} registros exportados em CSV`);
    } catch (err: any) {
      toast.error("Erro ao exportar CSV");
    } finally {
      setExportingCsv(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error("Selecione um arquivo JSON válido");
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data._meta || data._meta.system !== "Pro Orçamento") {
        toast.error("Arquivo não é um backup válido do Pro Orçamento");
        return;
      }
      const tables = TABLES.filter(t => Array.isArray(data[t.key]) && data[t.key].length > 0).length;
      const records = TABLES.reduce((s, t) => s + (Array.isArray(data[t.key]) ? data[t.key].length : 0), 0);
      setImportFile(file);
      setImportPreview({ tables, records });
      setImportConfirm(true);
    } catch {
      toast.error("Arquivo JSON inválido");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportConfirm(false);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const importOrder = ["company_settings", "clients", "suppliers", "materials", "budgets", "budget_items", "payments", "expenses"] as const;
      let imported = 0;
      for (const table of importOrder) {
        const rows = data[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;
        const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
        if (error) {
          console.warn(`Import ${table} error:`, error.message);
        } else {
          imported += rows.length;
        }
      }
      queryClient.invalidateQueries();
      toast.success(`Importação concluída! ${imported} registros processados.`);
    } catch (err: any) {
      toast.error("Erro na importação: " + (err.message || "erro desconhecido"));
    } finally {
      setImporting(false);
      setImportFile(null);
      setImportPreview(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Backup dos Dados</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Exporte, importe e gerencie cópias dos seus dados</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{totalRecords}</p>
          <p className="text-xs text-muted-foreground">Registros totais</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{TABLES.length}</p>
          <p className="text-xs text-muted-foreground">Tabelas</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{lastExport ? lastExport.records : "—"}</p>
          <p className="text-xs text-muted-foreground">Último export</p>
        </Card>
        <Card className="p-4 text-center">
          {lastExport ? (
            <>
              <p className="text-sm font-bold">{new Date(lastExport.date).toLocaleDateString("pt-BR")}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(lastExport.date).toLocaleTimeString("pt-BR")}</p>
            </>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">Nenhum</p>
          )}
          <p className="text-xs text-muted-foreground">Data do último</p>
        </Card>
      </div>

      {/* Tables overview with CSV export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />Dados por Tabela
          </CardTitle>
          <CardDescription>Exporte cada tabela individualmente em CSV ou faça backup completo em JSON.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TABLES.map((t) => (
              <div key={t.key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <t.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{t.label}</span>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{tableCounts[t.key]} registro{tableCounts[t.key] !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                  disabled={exportingCsv === t.key || tableCounts[t.key] === 0}
                  onClick={() => handleExportCsv(t.key)}
                  title="Exportar CSV"
                >
                  {exportingCsv === t.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3" />}
                  CSV
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export JSON */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Exportar Backup Completo (JSON)</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Um arquivo JSON será gerado com todos os dados do sistema. Guarde-o em local seguro.
              </p>
            </div>
          </div>
          <Button onClick={handleExportJson} disabled={exporting} size="lg" className="w-full shadow-md shadow-primary/20">
            {exporting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exportando…</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Baixar Backup JSON</>
            )}
          </Button>
          {lastExport && (
            <div className="flex items-center gap-2 justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">
                Último backup: {new Date(lastExport.date).toLocaleString("pt-BR")} — {lastExport.records} registros
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Import */}
      <Card className="border-warning/30">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
              <Upload className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold">Importar Backup (JSON)</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Restaure dados a partir de um arquivo de backup JSON exportado anteriormente.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border p-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              A importação usa <strong>upsert</strong> (inserir ou atualizar). Registros existentes com o mesmo ID serão atualizados. Novos registros serão criados. Nenhum dado existente será excluído.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" />Selecionar arquivo JSON</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import confirmation */}
      <AlertDialog open={importConfirm} onOpenChange={setImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirmar importação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {importPreview && (
                <span className="block mb-2 font-medium text-foreground">
                  Arquivo: {importFile?.name} — {importPreview.tables} tabela{importPreview.tables !== 1 ? "s" : ""} com {importPreview.records} registro{importPreview.records !== 1 ? "s" : ""}
                </span>
              )}
              Registros existentes com o mesmo ID serão atualizados. Novos registros serão criados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              Importar dados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
