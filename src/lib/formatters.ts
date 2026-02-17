export function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatRelativeDate(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "ontem";
  if (diffD < 7) return `${diffD} dias atrás`;
  return formatDate(date);
}

export function getInitials(name: string, max = 2): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, max).toUpperCase();
}

export const budgetStatusConfig = {
  draft: { label: "Rascunho", color: "text-muted-foreground", bg: "bg-muted-foreground", variant: "secondary" as const },
  issued: { label: "Emitido", color: "text-info", bg: "bg-info", variant: "outline" as const },
  approved: { label: "Aprovado", color: "text-primary", bg: "bg-primary", variant: "default" as const },
  rejected: { label: "Rejeitado", color: "text-destructive", bg: "bg-destructive", variant: "destructive" as const },
} as const;

export type BudgetStatus = keyof typeof budgetStatusConfig;
