import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Database, Download, Loader2, CheckCircle2, Package, Users,
  FileText, DollarSign, Receipt, Truck,
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

function downloadJson(data: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Backup() {
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<{ date: string; tables: number; records: number } | null>(null);

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
    budget_items: 0, // fetched during export
    payments: payments.length,
    expenses: expenses.length,
    company_settings: companySettings ? 1 : 0,
  };

  const totalRecords = Object.values(tableCounts).reduce((s, v) => s + v, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch budget_items separately since we don't have a hook for listing all
      const { data: budgetItems } = await supabase.from("budget_items").select("*");

      const backup: Record<string, unknown> = {
        _meta: {
          exportedAt: new Date().toISOString(),
          version: "1.0",
          system: "Pro Orçamento",
        },
        clients,
        suppliers,
        materials,
        budgets,
        budget_items: budgetItems || [],
        payments,
        expenses,
        company_settings: companySettings ? [companySettings] : [],
      };

      const date = new Date();
      const filename = `pro-orcamento-backup-${date.toISOString().slice(0, 10)}.json`;
      downloadJson(backup, filename);

      const records = clients.length + suppliers.length + materials.length + budgets.length + (budgetItems?.length || 0) + payments.length + expenses.length + (companySettings ? 1 : 0);

      setLastExport({ date: date.toISOString(), tables: 8, records });
      toast.success(`Backup exportado com ${records} registros!`);
    } catch (err: any) {
      toast.error("Erro ao exportar: " + (err.message || "erro desconhecido"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Backup dos Dados</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Exporte uma cópia completa dos seus dados em JSON</p>
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

      {/* Tables overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />Dados que serão exportados
          </CardTitle>
          <CardDescription>Todas as tabelas do sistema serão incluídas no backup.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TABLES.map((t) => (
              <div key={t.key} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <t.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{t.label}</span>
                </div>
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {tableCounts[t.key]} {tableCounts[t.key] === 1 ? "registro" : "registros"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export action */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Exportar Backup Completo</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Um arquivo JSON será gerado com todos os dados do sistema. Guarde-o em local seguro.
              </p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={exporting} size="lg" className="w-full shadow-md shadow-primary/20">
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
    </div>
  );
}
