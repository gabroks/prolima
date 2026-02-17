import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface SummaryCard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend: string | null;
  trendUp: boolean;
  href: string;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card
          key={card.title}
          className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group animate-slide-up"
          onClick={() => navigate(card.href)}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                <card.icon className="h-5 w-5" />
              </div>
              {card.trend && (
                <div className={`hidden sm:flex items-center gap-1 text-[11px] font-medium ${card.trendUp ? "text-primary" : "text-destructive"}`}>
                  {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{card.trend}</span>
                </div>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight">{card.value}</div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
