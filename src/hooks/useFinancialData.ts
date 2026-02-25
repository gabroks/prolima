import { useMemo } from "react";
import { useBudgets } from "@/hooks/useBudgets";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import type { DbPayment } from "@/hooks/usePayments";

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

interface PeriodBounds {
  "this-month": string;
  "last-month": string;
  "last-month-end": string;
  "this-quarter": string;
  "this-year": string;
}

interface FilterParams {
  search: string;
  methodFilter: string;
  periodFilter: string;
  sortBy: SortKey;
}

export function useFinancialData() {
  const { data: budgets = [], isLoading: lb, isError: budgetError } = useBudgets();
  const { data: payments = [], isLoading: lp, isError: paymentError } = usePayments();
  const { data: expenses = [] } = useExpenses();

  const approvedBudgets = useMemo(() => budgets.filter(b => b.status === "approved"), [budgets]);

  const totals = useMemo(() => {
    const totalApproved = approvedBudgets.reduce((s, b) => s + Number(b.total), 0);
    const totalReceived = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const balance = totalApproved - totalReceived;
    const profit = totalReceived - totalExpenses;
    const receivedPct = totalApproved > 0 ? Math.round((totalReceived / totalApproved) * 100) : 0;
    const profitMargin = totalReceived > 0 ? ((profit / totalReceived) * 100).toFixed(1) : "0.0";
    return { totalApproved, totalReceived, totalExpenses, balance, profit, receivedPct, profitMargin };
  }, [approvedBudgets, payments, expenses]);

  const monthComparison = useMemo(() => {
    const now = new Date();
    const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const curTotal = payments.filter(p => p.date.startsWith(curMonth)).reduce((s, p) => s + Number(p.amount), 0);
    const prevTotal = payments.filter(p => p.date.startsWith(prevMonth)).reduce((s, p) => s + Number(p.amount), 0);
    const curCount = payments.filter(p => p.date.startsWith(curMonth)).length;
    return { curTotal, prevTotal, curCount, diff: prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal) * 100 : 0 };
  }, [payments]);

  const methodBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    payments.forEach(p => { map[p.method] = (map[p.method] || 0) + Number(p.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const monthlyRevenue = useMemo(() => {
    const months: Record<string, number> = {};
    payments.forEach(p => { const key = p.date.slice(0, 7); months[key] = (months[key] || 0) + Number(p.amount); });
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([key, total]) => ({ month: monthNames[parseInt(key.split("-")[1]) - 1], total }));
  }, [payments]);

  const periodBounds = useMemo<PeriodBounds>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return {
      "this-month": new Date(y, m, 1).toISOString().split("T")[0],
      "last-month": new Date(y, m - 1, 1).toISOString().split("T")[0],
      "last-month-end": new Date(y, m, 0).toISOString().split("T")[0],
      "this-quarter": new Date(y, Math.floor(m / 3) * 3, 1).toISOString().split("T")[0],
      "this-year": `${y}-01-01`,
    };
  }, []);

  return {
    budgets, payments, expenses, approvedBudgets,
    isLoading: lb || lp,
    isError: budgetError || paymentError,
    totals, monthComparison, methodBreakdown, monthlyRevenue, periodBounds,
  };
}

export function useFilteredPayments(payments: DbPayment[], periodBounds: PeriodBounds, filters: FilterParams) {
  return useMemo(() => {
    const q = filters.search.toLowerCase();
    let result = payments.filter(p => {
      const matchSearch = !q || p.client_name.toLowerCase().includes(q) || p.budget_number.toLowerCase().includes(q) || (p.notes?.toLowerCase().includes(q));
      const matchMethod = filters.methodFilter === "all" || p.method === filters.methodFilter;
      let matchPeriod = true;
      if (filters.periodFilter === "this-month") matchPeriod = p.date >= periodBounds["this-month"];
      else if (filters.periodFilter === "last-month") matchPeriod = p.date >= periodBounds["last-month"] && p.date <= periodBounds["last-month-end"];
      else if (filters.periodFilter === "this-quarter") matchPeriod = p.date >= periodBounds["this-quarter"];
      else if (filters.periodFilter === "this-year") matchPeriod = p.date >= periodBounds["this-year"];
      return matchSearch && matchMethod && matchPeriod;
    });
    switch (filters.sortBy) {
      case "date-desc": result.sort((a, b) => b.date.localeCompare(a.date)); break;
      case "date-asc": result.sort((a, b) => a.date.localeCompare(b.date)); break;
      case "amount-desc": result.sort((a, b) => Number(b.amount) - Number(a.amount)); break;
      case "amount-asc": result.sort((a, b) => Number(a.amount) - Number(b.amount)); break;
    }
    return result;
  }, [payments, filters.search, filters.methodFilter, filters.periodFilter, filters.sortBy, periodBounds]);
}

export type { SortKey };
