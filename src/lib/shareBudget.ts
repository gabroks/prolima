import type { BudgetWithItems } from "@/hooks/useBudgets";
import { formatCurrency, formatDate } from "@/lib/formatters";

/**
 * Generates a WhatsApp share URL with a pre-formatted budget summary message.
 * If a phone number is provided, it opens a direct chat; otherwise uses the share link.
 */
export function generateWhatsAppMessage(budget: BudgetWithItems, companyName?: string): string {
  const items = budget.budget_items || [];
  const itemLines = items
    .slice(0, 10)
    .map((item, i) => {
      const qty = Number(item.qty);
      const total = formatCurrency(Number(item.total));
      return `  ${i + 1}. ${item.material_name} — ${qty} ${item.unit} — ${total}`;
    })
    .join("\n");

  const moreItems = items.length > 10 ? `\n  ... e mais ${items.length - 10} ite${items.length - 10 === 1 ? "m" : "ns"}` : "";

  const discountLine = Number(budget.total_discount) > 0
    ? `\n🏷️ Desconto: -${formatCurrency(Number(budget.total_discount))}`
    : "";

  const freightLine = Number(budget.freight) > 0
    ? `\n🚚 Frete: +${formatCurrency(Number(budget.freight))}`
    : "";

  const validityLine = budget.validity_date
    ? `\n📅 Válido até: ${formatDate(budget.validity_date)}`
    : "";

  const paymentLine = budget.payment_terms
    ? `\n💳 Pagamento: ${budget.payment_terms}`
    : "";

  const header = companyName ? `*${companyName}*\n\n` : "";

  const message = `${header}📋 *Orçamento ${budget.number}*

👤 Cliente: ${budget.client_name}
📅 Data: ${formatDate(budget.created_at)}${validityLine}

📦 *Itens:*
${itemLines}${moreItems}

💰 Subtotal: ${formatCurrency(Number(budget.subtotal))}${discountLine}${freightLine}
*💵 TOTAL: ${formatCurrency(Number(budget.total))}*${paymentLine}

${budget.general_notes ? `📝 Obs: ${budget.general_notes}\n` : ""}---
_Orçamento gerado automaticamente_`;

  return message;
}

export function openWhatsAppShare(budget: BudgetWithItems, companyName?: string, phone?: string) {
  const message = generateWhatsAppMessage(budget, companyName);
  const encoded = encodeURIComponent(message);

  // Clean phone number: remove non-digits, ensure country code
  let url: string;
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    url = `https://wa.me/${phoneWithCountry}?text=${encoded}`;
  } else {
    url = `https://wa.me/?text=${encoded}`;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

export function copyBudgetText(budget: BudgetWithItems, companyName?: string): Promise<void> {
  const message = generateWhatsAppMessage(budget, companyName);
  return navigator.clipboard.writeText(message);
}
