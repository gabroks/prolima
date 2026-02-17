import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, Check, CheckCheck, Trash2, FileText, DollarSign,
  Users, AlertTriangle, Filter, Inbox,
} from "lucide-react";
import {
  useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  useDeleteNotification, useClearAllNotifications, type DbNotification,
} from "@/hooks/useNotifications";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type NotifCategory = "all" | "budgets" | "payments" | "clients" | "alerts";

const categoryConfig: Record<NotifCategory, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "Todas", icon: Inbox, color: "text-foreground" },
  budgets: { label: "Orçamentos", icon: FileText, color: "text-info" },
  payments: { label: "Pagamentos", icon: DollarSign, color: "text-primary" },
  clients: { label: "Clientes", icon: Users, color: "text-chart-5" },
  alerts: { label: "Alertas", icon: AlertTriangle, color: "text-warning" },
};

function guessCategory(message: string): NotifCategory {
  const lower = message.toLowerCase();
  if (lower.includes("orçamento") || lower.includes("orc-")) return "budgets";
  if (lower.includes("pagamento") || lower.includes("despesa") || lower.includes("r$")) return "payments";
  if (lower.includes("cliente")) return "clients";
  if (lower.includes("alerta") || lower.includes("validade") || lower.includes("próximo")) return "alerts";
  return "all";
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  if (days < 30) return `${days} dias atrás`;
  return `${Math.floor(days / 30)} mês(es) atrás`;
};

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const [tab, setTab] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<NotifCategory>("all");

  const enriched = useMemo(() =>
    notifications.map(n => ({ ...n, category: guessCategory(n.message) })),
    [notifications]
  );

  const filtered = useMemo(() => {
    let items = enriched;
    if (tab === "unread") items = items.filter(n => !n.read);
    if (category !== "all") items = items.filter(n => n.category === category);
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [enriched, tab, category]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (Object.keys(categoryConfig) as NotifCategory[]).forEach(k => {
      counts[k] = k === "all" ? unreadCount : enriched.filter(n => n.category === k && !n.read).length;
    });
    return counts;
  }, [enriched, unreadCount]);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Notificações</h2>
          {unreadCount > 0 && <Badge className="tabular-nums">{unreadCount} {unreadCount === 1 ? "nova" : "novas"}</Badge>}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="h-4 w-4 mr-1.5" />{markAllRead.isPending ? "Marcando…" : "Marcar lidas"}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => clearAll.mutate()} disabled={clearAll.isPending}>
              <Trash2 className="h-4 w-4 mr-1.5" />{clearAll.isPending ? "Limpando…" : "Limpar"}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs px-3">Não lidas {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={category} onValueChange={(v) => setCategory(v as NotifCategory)}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(categoryConfig) as NotifCategory[]).map(k => {
              const cfg = categoryConfig[k];
              return (
                <SelectItem key={k} value={k} className="text-xs">
                  <div className="flex items-center gap-2">
                    <cfg.icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    {cfg.label}
                    {catCounts[k] > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-1">{catCounts[k]}</Badge>}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mb-4 opacity-20" />
          <p className="font-medium">Nenhuma notificação</p>
          <p className="text-xs mt-1">{tab === "unread" ? "Todas as notificações foram lidas" : "Você não tem notificações ainda"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cat = n.category as NotifCategory;
            const Icon = categoryConfig[cat]?.icon || Bell;
            const color = categoryConfig[cat]?.color || "text-muted-foreground";
            return (
              <Card
                key={n.id}
                className={`group transition-all duration-200 hover:shadow-md ${!n.read ? "bg-primary/5 border-primary/20 shadow-sm" : "hover:bg-muted/30"}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${!n.read ? color : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${!n.read ? "font-medium" : "text-muted-foreground"}`}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal">
                        {categoryConfig[cat]?.label || "Geral"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{timeAgo(n.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending} title="Marcar como lida">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteNotif.mutate(n.id)} disabled={deleteNotif.isPending} title="Remover">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
