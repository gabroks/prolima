import { useMemo } from "react";
import { useClients } from "@/hooks/useClients";
import { useMaterials } from "@/hooks/useMaterials";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useCurrentProfile } from "@/hooks/useCurrentProfile";
import { formatCurrency } from "@/lib/formatters";

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getPrevMonthKey(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthKey(d);
}

export function useDashboardData() {
  const { data: clients = [], isLoading: loadingClients, isError: errorClients } = useClients();
  const { data: materials = [], isLoading: loadingMaterials, isError: errorMaterials } = useMaterials();
  const { data: budgets = [], isLoading: loadingBudgets, isError: errorBudgets } = useBudgets();
  const { data: payments = [], isLoading: loadingPayments, isError: errorPayments } = usePayments();
  const { data: expenses = [], isLoading: loadingExpenses, isError: errorExpenses } = useExpenses();
  const { data: suppliers = [] } = useSuppliers();
  const { data: profile } = useCurrentProfile();

  const isLoading = loadingClients || loadingBudgets || loadingMaterials || loadingPayments || loadingExpenses;
  const hasError = errorClients || errorBudgets || errorMaterials || errorPayments || errorExpenses;
  const isEmpty = !isLoading && clients.length === 0 && budgets.length === 0 && payments.length === 0 && expenses.length === 0;

  const userName = profile?.name || profile?.email?.split("@")[0] || "";

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = useMemo(() => getMonthKey(now), [now]);
  const prevMonthKey = useMemo(() => getPrevMonthKey(now), [now]);

  const computed = useMemo(() => {
    const monthPayments = payments.filter((p) => p.date.startsWith(currentMonthKey));
    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthKey));
    const prevMonthPayments = payments.filter((p) => p.date.startsWith(prevMonthKey));
    const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevMonthKey));

    const totalReceitas = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalDespesas = expenses.reduce((s, e) => s + Number(e.amount), 0);

    const monthReceitas = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
    const monthDespesas = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const monthSaldo = monthReceitas - monthDespesas;

    const prevMonthReceitas = prevMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
    const prevMonthDespesas = prevMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const prevMonthSaldo = prevMonthReceitas - prevMonthDespesas;

    const approvedBudgets = budgets.filter((b) => b.status === "approved");
    const totalApproved = approvedBudgets.reduce((s, b) => s + Number(b.total), 0);
    const pendingBudgets = budgets.filter((b) => b.status === "issued" || b.status === "draft");
    const rejectedBudgets = budgets.filter((b) => b.status === "rejected");

    const monthBudgetCount = budgets.filter(b => b.created_at.startsWith(currentMonthKey)).length;
    const prevMonthBudgetCount = budgets.filter(b => b.created_at.startsWith(prevMonthKey)).length;
    const budgetDiff = monthBudgetCount - prevMonthBudgetCount;

    const saldoDiff = monthSaldo - prevMonthSaldo;
    const saldoTrendLabel = saldoDiff > 0 ? `+${formatCurrency(saldoDiff)}` : saldoDiff < 0 ? formatCurrency(saldoDiff) : "Estável";

    const activeClients = clients.filter((c) => c.status === "active").length;
    const activeSuppliers = suppliers.filter((s) => s.active).length;

    const materialCategories = new Set(materials.map(m => m.category)).size;

    const topClients: [string, number][] = (() => {
      const map: Record<string, number> = {};
      payments.forEach(p => { map[p.client_name] = (map[p.client_name] || 0) + Number(p.amount); });
      return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 3);
    })();

    const pendingTotal = pendingBudgets.reduce((s, b) => s + Number(b.total), 0);

    return {
      totalReceitas, totalDespesas,
      monthReceitas, monthDespesas, monthSaldo,
      prevMonthReceitas, prevMonthDespesas, prevMonthSaldo,
      approvedBudgets, totalApproved, pendingBudgets, rejectedBudgets,
      budgetDiff, saldoDiff, saldoTrendLabel,
      activeClients, activeSuppliers, materialCategories,
      topClients, pendingTotal,
    };
  }, [clients, materials, budgets, payments, expenses, suppliers, currentMonthKey, prevMonthKey]);

  return {
    clients, materials, budgets, payments, expenses, suppliers,
    profile, userName,
    isLoading, hasError, isEmpty,
    ...computed,
  };
}
