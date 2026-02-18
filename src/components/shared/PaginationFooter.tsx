import { Button } from "@/components/ui/button";

interface PaginationFooterProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  label: string;
  extraInfo?: React.ReactNode;
  filterSummary?: string;
}

export function PaginationFooter({ page, totalPages, totalItems, pageSize, onPageChange, label, extraInfo, filterSummary }: PaginationFooterProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <p className="text-xs text-muted-foreground">
        Exibindo {totalItems > 0 ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, totalItems)} de {totalItems} {label}
        {filterSummary && <> • Filtros: {filterSummary}</>}
      </p>
      <div className="flex items-center gap-3">
        {extraInfo}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => onPageChange(page - 1)}>Anterior</Button>
            <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>Próximo</Button>
          </div>
        )}
      </div>
    </div>
  );
}
