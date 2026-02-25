import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PageLoadingProps {
  cards?: number;
  tableHeight?: string;
}

export function PageLoading({ cards = 4, tableHeight = "h-96" }: PageLoadingProps) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: cards }, (_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className={tableHeight} />
    </div>
  );
}

interface PageErrorProps {
  icon?: React.ElementType;
  title?: string;
  message?: string;
}

export function PageError({ icon: Icon = AlertCircle, title = "Erro ao carregar dados", message = "Verifique sua conexão e tente novamente." }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="h-10 w-10 text-destructive mb-4 opacity-50" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Tentar novamente</Button>
    </div>
  );
}
