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
  negative?: boolean;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5" role="list" aria-label="Resumo do sistema">
      {cards.map((card, i) => {
        const isNegative = card.negative;
        return (
          <Card
            key={card.title}
            role="listitem"
            tabIndex={0}
            aria-label={`${card.title}: ${card.value}. ${card.subtitle}`}
            className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group animate-slide-up focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            onClick={() => navigate(card.href)}
            onKeyDown={(e) => e.key === "Enter" && navigate(card.href)}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 rounded-lg transition-colors duration-200 ${
                  isNegative
                    ? "bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground"
                    : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                }`}>
                  <card.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                {card.trend && (
                  <div className={`hidden sm:flex items-center gap-1 text-[11px] font-medium ${card.trendUp ? "text-primary" : "text-destructive"}`}>
                    {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{card.trend}</span>
                  </div>
                )}
              </div>
              <div className={`text-lg sm:text-2xl font-bold tracking-tight tabular-nums ${isNegative ? "text-destructive" : ""}`}>
                {card.value}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{card.subtitle}</p>
              {/* Mobile trend indicator */}
              {card.trend && (
                <div className={`sm:hidden flex items-center gap-1 text-[10px] font-medium mt-1 ${card.trendUp ? "text-primary" : "text-destructive"}`}>
                  {card.trendUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  <span>{card.trend}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
