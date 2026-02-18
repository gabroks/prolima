import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FilePlus, UserPlus, Receipt, DollarSign, Truck } from "lucide-react";

const quickActions = [
  { label: "Novo Orçamento", shortLabel: "Orçamento", icon: FilePlus, href: "/novo-orcamento", primary: true },
  { label: "Novo Cliente", shortLabel: "Cliente", icon: UserPlus, href: "/clientes" },
  { label: "Registrar Despesa", shortLabel: "Despesa", icon: Receipt, href: "/despesas" },
  { label: "Novo Fornecedor", shortLabel: "Fornecedor", icon: Truck, href: "/fornecedores" },
  { label: "Ver Financeiro", shortLabel: "Financeiro", icon: DollarSign, href: "/financeiro" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2 flex-wrap">
      {quickActions.map((a) => (
        <Button
          key={a.label}
          variant={a.primary ? "default" : "outline"}
          size="sm"
          className={a.primary ? "shadow-md shadow-primary/20" : ""}
          onClick={() => navigate(a.href)}
        >
          <a.icon className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">{a.label}</span>
          <span className="sm:hidden">{a.shortLabel}</span>
        </Button>
      ))}
    </div>
  );
}
