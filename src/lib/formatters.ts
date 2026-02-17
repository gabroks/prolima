export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function getInitials(name: string, max = 2): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, max).toUpperCase();
}

export const budgetStatusConfig = {
  draft: { label: "Rascunho", color: "text-muted-foreground", bg: "bg-muted-foreground", variant: "secondary" as const },
  issued: { label: "Emitido", color: "text-[hsl(var(--info))]", bg: "bg-[hsl(var(--info))]", variant: "outline" as const },
  approved: { label: "Aprovado", color: "text-primary", bg: "bg-primary", variant: "default" as const },
  rejected: { label: "Rejeitado", color: "text-destructive", bg: "bg-destructive", variant: "destructive" as const },
} as const;

export type BudgetStatus = keyof typeof budgetStatusConfig;
