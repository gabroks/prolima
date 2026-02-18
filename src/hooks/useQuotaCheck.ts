import { useSystemLimits, useUsageCounts } from "@/hooks/useSystemLimits";

type ResourceType = "clients" | "budgets" | "materials" | "suppliers";

const limitKeyMap: Record<ResourceType, string> = {
  clients: "max_clients",
  budgets: "max_budgets",
  materials: "max_materials",
  suppliers: "max_suppliers",
};

const labelMap: Record<ResourceType, string> = {
  clients: "clientes",
  budgets: "orçamentos",
  materials: "materiais",
  suppliers: "fornecedores",
};

export function useQuotaCheck(resource: ResourceType) {
  const { data: limits } = useSystemLimits();
  const { data: usage } = useUsageCounts();

  const max = limits ? (limits as any)[limitKeyMap[resource]] as number : Infinity;
  const current = usage ? usage[resource] : 0;
  const remaining = Math.max(0, max - current);
  const isAtLimit = current >= max;
  const label = labelMap[resource];

  return {
    isAtLimit,
    current,
    max,
    remaining,
    message: isAtLimit
      ? `Limite de ${label} atingido (${current}/${max}). Contate o administrador para aumentar o limite.`
      : null,
  };
}
