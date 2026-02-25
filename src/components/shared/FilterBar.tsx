import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";

interface FilterBarProps {
  searchInput: React.ReactNode;
  filters: React.ReactNode;
  activeFiltersCount: number;
  onClearFilters?: () => void;
}

export function FilterBar({ searchInput, filters, activeFiltersCount, onClearFilters }: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <div className="flex-1 min-w-0">
          {searchInput}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="md:hidden shrink-0"
          onClick={() => setFiltersOpen(prev => !prev)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1.5 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
      {/* Desktop: always visible. Mobile: toggled */}
      <div className={`flex gap-3 flex-wrap ${filtersOpen ? "flex" : "hidden md:flex"}`}>
        {filters}
        {activeFiltersCount > 0 && onClearFilters && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onClearFilters}>
            <X className="h-3 w-3 mr-1" />Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
