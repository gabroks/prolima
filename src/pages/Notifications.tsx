import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Check, CheckCheck, Trash2, FileText, DollarSign,
  Users, AlertTriangle, Filter, Inbox,
} from "lucide-react";
import { Notification } from "@/types";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type NotifCategory = "all" | "budgets" | "payments" | "clients" | "alerts";

interface ExtendedNotification extends Notification {
  category: NotifCategory;
}

const mockNotifications: ExtendedNotification[] = [
  { id: "1", message: "Orçamento ORC-001 foi aprovado pelo cliente João Silva", read: false, createdAt: "2025-02-15T10:30:00", category: "budgets" },
  { id: "2", message: "Novo pagamento de R$ 647,00 registrado para ORC-001", read: false, createdAt: "2025-02-14T15:45:00", category: "payments" },
  { id: "3", message: "O orçamento ORC-002 está próximo da validade (20/03/2025)", read: false, createdAt: "2025-02-13T09:00:00", category: "alerts" },
  { id: "4", message: "Cliente Maria Oliveira foi marcado como inativo", read: true, createdAt: "2025-02-12T14:20:00", category: "clients" },
  { id: "5", message: "Despesa de R$ 2.500,00 registrada: Aluguel do galpão", read: true, createdAt: "2025-02-01T08:00:00", category: "payments" },
  { id: "6", message: "Pagamento de R$ 6.880,00 recebido — Construtora ABC (ORC-002)", read: false, createdAt: "2025-03-10T11:00:00", category: "payments" },
  { id: "7", message: "Orçamento ORC-003 emitido para Maria Oliveira", read: true, createdAt: "2025-02-14T16:00:00", category: "budgets" },
  { id: "8", message: "Novo cliente cadastrado: Construtora ABC Ltda", read: true, createdAt: "2025-02-01T09:00:00", category: "clients" },
];

const categoryConfig: Record<NotifCategory, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "Todas", icon: Inbox, color: "text-foreground" },
  budgets: { label: "Orçamentos", icon: FileText, color: "text-[hsl(var(--info))]" },
  payments: { label: "Pagamentos", icon: DollarSign, color: "text-primary" },
  clients: { label: "Clientes", icon: Users, color: "text-[hsl(var(--chart-5))]" },
  alerts: { label: "Alertas", icon: AlertTriangle, color: "text-[hsl(var(--warning))]" },
};

const getIcon = (cat: NotifCategory) => categoryConfig[cat]?.icon || Bell;
const getColor = (cat: NotifCategory) => categoryConfig[cat]?.color || "text-muted-foreground";

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
  const [notifications, setNotifications] = useState<ExtendedNotification[]>(mockNotifications);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<NotifCategory>("all");

  const filtered = useMemo(() => {
    let items = notifications;
    if (tab === "unread") items = items.filter(n => !n.read);
    if (category !== "all") items = items.filter(n => n.category === category);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, tab, category]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Todas marcadas como lidas");
  };

  const remove = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notificação removida");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success("Todas as notificações removidas");
  };

  // Category counts
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (Object.keys(categoryConfig) as NotifCategory[]).forEach(k => {
      counts[k] = k === "all" ? notifications.filter(n => !n.read).length : notifications.filter(n => n.category === k && !n.read).length;
    });
    return counts;
  }, [notifications]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Notificações</h2>
          {unreadCount > 0 && (
            <Badge className="tabular-nums">{unreadCount} {unreadCount === 1 ? "nova" : "novas"}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-1.5" />Marcar lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1.5" />Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs px-3">
              Não lidas {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={category} onValueChange={(v) => setCategory(v as NotifCategory)}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mb-4 opacity-20" />
          <p className="font-medium">Nenhuma notificação</p>
          <p className="text-xs mt-1">{tab === "unread" ? "Todas as notificações foram lidas" : "Você não tem notificações ainda"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const Icon = getIcon(n.category);
            const color = getColor(n.category);
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
                        {categoryConfig[n.category]?.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAsRead(n.id)} title="Marcar como lida">
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(n.id)} title="Remover">
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
