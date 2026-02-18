import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useProfiles, useToggleProfileStatus } from "@/hooks/useProfiles";
import { useSystemLimits, useUpdateSystemLimits, useUsageCounts } from "@/hooks/useSystemLimits";
import { supabase } from "@/integrations/supabase/client";
import { Users, FileText, Package, Truck, Search, Save, UserCheck, UserX, Send, CalendarPlus, X, Trash2, UserCircle } from "lucide-react";
import { format, differenceInDays, addDays, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function AdminClientsList() {
  const { data: profiles, isLoading: loadingProfiles } = useProfiles();
  const toggleStatus = useToggleProfileStatus();
  const { data: limits, isLoading: loadingLimits } = useSystemLimits();
  const { data: usage, isLoading: loadingUsage } = useUsageCounts();
  const updateLimits = useUpdateSystemLimits();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [editLimits, setEditLimits] = useState<Record<string, number> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isLoading = loadingProfiles || loadingLimits || loadingUsage;

  const filteredProfiles = profiles?.filter(p =>
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p as any).company_name?.toLowerCase().includes(search.toLowerCase()) ||
    (p as any).username?.toLowerCase().includes(search.toLowerCase())
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

  const handleExtendValidity = async (profileId: string, days: number) => {
    const profile = profiles?.find(p => p.id === profileId) as any;
    if (!profile) return;

    const currentDate = profile.valid_until ? new Date(profile.valid_until) : new Date();
    const baseDate = isPast(currentDate) ? new Date() : currentDate;
    const newDate = addDays(baseDate, days);

    const { error } = await supabase
      .from("profiles")
      .update({ valid_until: format(newDate, "yyyy-MM-dd") } as any)
      .eq("id", profileId);

    if (error) {
      toast.error("Erro ao estender validade");
    } else {
      toast.success(`Validade estendida em ${days} dias`);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    }
  };

  const handleDeleteProfile = async () => {
    if (!deleteId) return;
    // Deactivate instead of hard delete for safety
    const { error } = await supabase
      .from("profiles")
      .update({ active: false })
      .eq("id", deleteId);

    if (error) {
      toast.error("Erro ao remover usuário");
    } else {
      toast.success("Usuário desativado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    }
    setDeleteId(null);
  };

  const handleSendNotification = async (userId: string, userName: string) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      message: `Olá ${userName}, sua conta está sendo monitorada pelo administrador.`,
    });

    if (error) {
      toast.error("Erro ao enviar notificação");
    } else {
      toast.success(`Notificação enviada para ${userName}`);
    }
  };

  const getValidityInfo = (validUntil: string | null) => {
    if (!validUntil) return { label: "Ilimitado", daysLeft: Infinity, expired: false, unlimited: true };
    const date = new Date(validUntil);
    const days = differenceInDays(date, new Date());

    if (isPast(date) && !isToday(date)) {
      return { label: "Expirado", daysLeft: days, expired: true };
    }
    return {
      label: `${days} dia${days !== 1 ? "s" : ""} restante${days !== 1 ? "s" : ""}`,
      daysLeft: days,
      expired: false,
    };
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Usuários do Sistema</CardTitle>
              <CardDescription>Gerencie usuários, planos e validades.</CardDescription>
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
              placeholder="Buscar por nome, e-mail, empresa ou usuário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="hidden md:table-cell">Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">Validade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                  filteredProfiles.map(profile => {
                    const p = profile as any;
                    const validity = getValidityInfo(p.valid_until);

                    return (
                      <TableRow key={profile.id}>
                        {/* USUÁRIO */}
                        <TableCell>
                          <div className="flex items-start gap-2.5">
                            <UserCircle className="h-8 w-8 text-muted-foreground/40 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-tight truncate">
                                {profile.name || <span className="text-muted-foreground italic">Sem nome</span>}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                              {p.username && (
                                <p className="text-xs text-muted-foreground/60 truncate">@{p.username}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* EMPRESA */}
                        <TableCell className="hidden md:table-cell">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.company_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.company_phone || "—"}</p>
                          </div>
                        </TableCell>

                        {/* VALIDADE */}
                        <TableCell className="hidden sm:table-cell">
                          <div className="min-w-0">
                            {(validity as any).unlimited ? (
                              <>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <CalendarPlus className="h-3 w-3 shrink-0" />∞
                                </p>
                                <p className="text-xs font-medium mt-0.5 text-primary">Ilimitado</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <CalendarPlus className="h-3 w-3 shrink-0" />
                                  {p.valid_until ? format(new Date(p.valid_until), "dd/MM/yyyy") : "—"}
                                </p>
                                <p className={`text-xs font-medium mt-0.5 ${
                                  validity.expired 
                                    ? "text-destructive" 
                                    : validity.daysLeft <= 7 
                                      ? "text-yellow-600 dark:text-yellow-400" 
                                      : "text-primary"
                                }`}>
                                  {validity.label}
                                </p>
                              </>
                            )}
                          </div>
                        </TableCell>

                        {/* STATUS */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Badge 
                              variant={profile.active ? "default" : "secondary"} 
                              className={`text-[10px] ${profile.active ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" : ""}`}
                            >
                              {profile.active ? "Ativo" : "Inativo"}
                            </Badge>
                            {p.plan_type === "trial" && (
                              <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-600 dark:text-yellow-400">
                                Trial
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* AÇÕES */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                  onClick={() => handleSendNotification(profile.user_id, profile.name)}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Enviar notificação</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1.5 text-xs text-primary hover:bg-primary/10"
                                  onClick={() => handleExtendValidity(profile.id, 7)}
                                >
                                  +7d
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Estender 7 dias</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1.5 text-xs text-primary hover:bg-primary/10"
                                  onClick={() => handleExtendValidity(profile.id, 30)}
                                >
                                  +30d
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Estender 30 dias</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/10"
                                  onClick={() => toggleStatus.mutate({ id: profile.id, currentActive: profile.active })}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">
                                {profile.active ? "Desativar" : "Ativar"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteId(profile.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Remover</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário será desativado e não poderá mais acessar o sistema. Esta ação pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
