import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProfiles, useToggleProfileStatus } from "@/hooks/useProfiles";
import { useSystemLimits, useUpdateSystemLimits, useUsageCounts } from "@/hooks/useSystemLimits";
import { Users, FileText, Package, Truck, Search, Save, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";

export function AdminClientsList() {
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const toggleStatus = useToggleProfileStatus();
  const { data: limits, isLoading: loadingLimits } = useSystemLimits();
  const { data: usage, isLoading: loadingUsage } = useUsageCounts();
  const updateLimits = useUpdateSystemLimits();

  const [search, setSearch] = useState("");
  const [editLimits, setEditLimits] = useState<Record<string, number> | null>(null);

  const isLoading = loadingProfiles || loadingLimits || loadingUsage;

  const filteredProfiles = profiles?.filter(p =>
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const currentLimits = editLimits || (limits ? {
    max_clients: limits.max_clients,
    max_budgets: limits.max_budgets,
    max_materials: limits.max_materials,
    max_suppliers: limits.max_suppliers,
  } : null);

  const handleSaveLimits = () => {
    if (!limits || !currentLimits) return;
    updateLimits.mutate({ id: limits.id, data: currentLimits });
    setEditLimits(null);
  };

  const quotas = [
    { key: "max_clients", label: "Clientes", icon: Users, used: usage?.clients ?? 0, color: "text-blue-500" },
    { key: "max_budgets", label: "Orçamentos", icon: FileText, used: usage?.budgets ?? 0, color: "text-green-500" },
    { key: "max_materials", label: "Materiais", icon: Package, used: usage?.materials ?? 0, color: "text-orange-500" },
    { key: "max_suppliers", label: "Fornecedores", icon: Truck, used: usage?.suppliers ?? 0, color: "text-purple-500" },
  ];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  const activeCount = profiles?.filter(p => p.active).length ?? 0;
  const inactiveCount = profiles?.filter(p => !p.active).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Quotas / Limits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Limites de Uso do Sistema</CardTitle>
          <CardDescription>Defina os limites máximos de cadastros no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {quotas.map(q => {
              const max = currentLimits?.[q.key as keyof typeof currentLimits] ?? 0;
              const pct = max > 0 ? Math.min((q.used / max) * 100, 100) : 0;
              return (
                <div key={q.key} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <q.icon className={`h-4 w-4 ${q.color}`} />
                      <span className="text-sm font-medium">{q.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{q.used}/{max}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Limite:</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-7 text-xs w-20"
                      value={currentLimits?.[q.key as keyof typeof currentLimits] ?? 0}
                      onChange={(e) => setEditLimits(prev => ({
                        ...(prev || currentLimits || {}),
                        [q.key]: parseInt(e.target.value) || 0,
                      }))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {editLimits && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveLimits} disabled={updateLimits.isPending}>
                <Save className="h-3.5 w-3.5 mr-1.5" />Salvar Limites
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User profiles list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Usuários do Sistema</CardTitle>
              <CardDescription>Usuários que fizeram login com e-mail e senha.</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <UserCheck className="h-3.5 w-3.5 text-green-500" />
                <span>{activeCount} ativos</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <UserX className="h-3.5 w-3.5 text-destructive" />
                <span>{inactiveCount} inativos</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                  <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map(profile => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium text-sm">
                        {profile.name || <span className="text-muted-foreground italic">Sem nome</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{profile.email}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {format(new Date(profile.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={profile.active ? "default" : "secondary"} className="text-[10px]">
                          {profile.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={profile.active}
                          onCheckedChange={() => toggleStatus.mutate({ id: profile.id, currentActive: profile.active })}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
