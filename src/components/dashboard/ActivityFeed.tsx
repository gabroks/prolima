import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { formatRelativeDate } from "@/lib/formatters";
import { LucideIcon } from "lucide-react";
import { WidgetEmpty } from "@/components/shared/WidgetEmpty";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  icon: LucideIcon;
  iconBg: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card className="animate-slide-up" style={{ animationDelay: "640ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <WidgetEmpty icon={CalendarClock} title="Nenhuma atividade recente" />
        ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className={`p-1.5 rounded-md ${item.iconBg} shrink-0 mt-0.5`}>
                <item.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-medium text-muted-foreground">{item.subtitle}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">• {formatRelativeDate(item.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  );
}
