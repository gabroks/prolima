import { useQuotaCheck } from "@/hooks/useQuotaCheck";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

type ResourceType = "clients" | "budgets" | "materials" | "suppliers";

interface QuotaButtonProps {
  resource: ResourceType;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function QuotaButton({ resource, onClick, children, className }: QuotaButtonProps) {
  const { isAtLimit, current, max, message } = useQuotaCheck(resource);

  if (isAtLimit) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled className={className}>
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Limite atingido
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[260px]">
          <p className="text-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={onClick} className={className}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{current}/{max} utilizados</p>
      </TooltipContent>
    </Tooltip>
  );
}
