import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, DollarSign, Receipt, FileText } from "lucide-react";
import { formatCurrency, formatRelativeDate, budgetStatusConfig, BudgetStatus } from "@/lib/formatters";
import { useNavigate } from "react-router-dom";
import { WidgetEmpty } from "@/components/shared/WidgetEmpty";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { Tables } from "@/integrations/supabase/types";

interface RecentActivityProps {
  payments: Tables<"payments">[];
  expenses: Tables<"expenses">[];
  budgets: BudgetWithItems[];
}

export function RecentActivity({ payments, expenses, budgets }: RecentActivityProps) {
  const navigate = useNavigate();
  const activityFeed = useMemo(() => {
    const items = [
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        title: `Pagamento — ${p.client_name}`,
        subtitle: formatCurrency(Number(p.amount)),
        date: p.date,
        icon: DollarSign,
        iconBg: "bg-primary/10 text-primary",
        href: "/financeiro",
        badge: p.method,
        badgeVariant: "secondary" as const,
      })),
      ...expenses.map((e) => ({
        id: `exp-${e.id}`,
        title: `Despesa — ${e.description}`,
        subtitle: formatCurrency(Number(e.amount)),
        date: e.date,
        icon: Receipt,
        iconBg: "bg-destructive/10 text-destructive",
        href: "/despesas",
        badge: e.category,
        badgeVariant: "outline" as const,
      })),
      ...budgets.map((b) => ({
        id: `bud-${b.id}`,
        title: `Orçamento ${b.number} — ${b.client_name}`,
        subtitle: budgetStatusConfig[b.status as BudgetStatus]?.label,
        date: b.created_at,
        icon: FileText,
        iconBg: "bg-muted text-muted-foreground",
        href: `/editar-orcamento/${b.id}`,
        badge: null as string | null,
        badgeVariant: "secondary" as const,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);
    return items;
  }, [payments, expenses, budgets]);

  return (
    <Card className="animate-slide-up" style={{ animationDelay: "640ms", animationFillMode: "backwards" }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] px-6 pb-4">
          <div className="space-y-3">
            {activityFeed.length === 0 ? (
              <WidgetEmpty icon={CalendarClock} title="Nenhuma atividade recente" subtitle="Registre pagamentos e despesas para acompanhar aqui" />
            ) : (
              activityFeed.map((item) => (
                <div key={item.id} role="button" tabIndex={0} className="flex items-start gap-3 cursor-pointer hover:bg-muted/40 -mx-2 px-2 py-1.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => navigate(item.href)} onKeyDown={(e) => e.key === "Enter" && navigate(item.href)}>
                  <div className={`p-1.5 rounded-md ${item.iconBg} shrink-0 mt-0.5`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground">{item.subtitle}</span>
                      {item.badge && (
                        <Badge variant={item.badgeVariant} className="text-[9px] h-4 px-1">{item.badge}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground tabular-nums">• {formatRelativeDate(item.date)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
