import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notificações</h2>
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Bell className="h-12 w-12 mb-4 opacity-30" />
        <p>Nenhuma notificação</p>
      </div>
    </div>
  );
}
