import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Trash2, FileText, DollarSign, Users, AlertTriangle } from "lucide-react";
import { Notification } from "@/types";
import { toast } from "sonner";

const mockNotifications: Notification[] = [
  { id: "1", message: "Orçamento ORC-001 foi aprovado pelo cliente João Silva", read: false, createdAt: "2025-02-15T10:30:00" },
  { id: "2", message: "Novo pagamento de R$ 647,00 registrado para ORC-001", read: false, createdAt: "2025-02-14T15:45:00" },
  { id: "3", message: "O orçamento ORC-002 está próximo da validade (20/03/2025)", read: false, createdAt: "2025-02-13T09:00:00" },
  { id: "4", message: "Cliente Maria Oliveira foi marcado como inativo", read: true, createdAt: "2025-02-12T14:20:00" },
  { id: "5", message: "Despesa de R$ 2.500,00 registrada: Aluguel do galpão", read: true, createdAt: "2025-02-01T08:00:00" },
];

const getIcon = (message: string) => {
  if (message.includes("Orçamento") || message.includes("orçamento")) return FileText;
  if (message.includes("pagamento") || message.includes("Despesa")) return DollarSign;
  if (message.includes("Cliente")) return Users;
  if (message.includes("validade")) return AlertTriangle;
  return Bell;
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  return `${days} dias atrás`;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("Todas marcadas como lidas");
  };

  const remove = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Notificação removida");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Notificações</h2>
          {unreadCount > 0 && <Badge>{unreadCount} novas</Badge>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />Marcar todas como lidas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mb-4 opacity-30" />
          <p>Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = getIcon(n.message);
            return (
              <Card key={n.id} className={`group transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? "font-medium" : "text-muted-foreground"}`}>{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markAsRead(n.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(n.id)}>
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
