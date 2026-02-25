import type { LucideIcon } from "lucide-react";

interface WidgetEmptyProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}

export function WidgetEmpty({ icon: Icon, title, subtitle }: WidgetEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2 opacity-20" />
      <p className="text-sm font-medium">{title}</p>
      {subtitle && <p className="text-xs mt-0.5">{subtitle}</p>}
    </div>
  );
}
