import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { DbCompanySettings } from "@/hooks/useCompanySettings";
import { formatCurrency, formatDate } from "@/lib/formatters";

export function generateBudgetPdf(budget: BudgetWithItems, company?: DbCompanySettings | null) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const primaryColor: [number, number, number] = [45, 138, 94]; // default green
  const darkColor: [number, number, number] = [30, 30, 30];
  const grayColor: [number, number, number] = [120, 120, 120];
  const lightBg: [number, number, number] = [245, 245, 245];

  // ─── Header bar ───
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(company?.nome_fantasia || company?.razao_social || "ORÇAMENTO", margin, 16);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (company) {
    const lines: string[] = [];
    if (company.cnpj) lines.push(`CNPJ: ${company.cnpj}`);
    if (company.phone) lines.push(`Tel: ${company.phone}`);
    if (company.email) lines.push(company.email);
    const address = [company.street, company.neighborhood, company.city, company.state].filter(Boolean).join(", ");
    if (address) lines.push(address);
    if (company.cep) lines.push(`CEP: ${company.cep}`);
    lines.forEach((line, i) => {
      doc.text(line, margin, 24 + i * 4);
    });
  }

  // Budget number on right
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(budget.number, pageWidth - margin, 16, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${formatDate(budget.created_at)}`, pageWidth - margin, 24, { align: "right" });
  if (budget.validity_date) {
    doc.text(`Validade: ${formatDate(budget.validity_date)}`, pageWidth - margin, 28, { align: "right" });
  }
  if (budget.delivery_date) {
    doc.text(`Entrega: ${formatDate(budget.delivery_date)}`, pageWidth - margin, 32, { align: "right" });
  }

  y = 46;

  // ─── Client info ───
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text("CLIENTE", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(budget.client_name, margin, y);
  y += 5;
  if (budget.service_description) {
    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    const descLines = doc.splitTextToSize(budget.service_description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 2;
  }

  y += 4;

  // ─── Items table ───
  const items = budget.budget_items || [];
  const tableHead = [["#", "Material", "Dimensões", "Qtd", "Unid.", "Preço Unit.", "Total"]];
  const tableBody = items.map((item, i) => {
    const w = Number(item.width);
    const h = Number(item.height);
    const area = item.unit === "m²" && w > 0 && h > 0 ? (w / 100) * (h / 100) : 0;
    const dims = w > 0 && h > 0 ? `${w} × ${h} cm${area > 0 ? ` (${area.toFixed(2)} m²)` : ""}` : "—";
    return [
      String(i + 1),
      item.material_name + (item.notes ? `\n${item.notes}` : ""),
      dims,
      String(item.qty),
      item.unit,
      formatCurrency(Number(item.unit_price)),
      formatCurrency(Number(item.total)),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 35 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "right", cellWidth: 28 },
      6: { halign: "right", cellWidth: 28, fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Totals section ───
  const totalsX = pageWidth - margin - 80;
  const valX = pageWidth - margin;

  const addTotalLine = (label: string, value: string, bold = false, color: [number, number, number] = darkColor) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(...grayColor);
    doc.text(label, totalsX, y);
    doc.setTextColor(...color);
    doc.text(value, valX, y, { align: "right" });
    y += bold ? 7 : 5;
  };

  addTotalLine("Subtotal", formatCurrency(Number(budget.subtotal)));
  if (Number(budget.total_discount) > 0) {
    addTotalLine(
      `Desconto${budget.discount_type === "percent" ? ` (${budget.discount_value}%)` : ""}`,
      `− ${formatCurrency(Number(budget.total_discount))}`,
      false,
      [200, 50, 50]
    );
  }
  if (Number(budget.freight) > 0) {
    addTotalLine("Frete", `+ ${formatCurrency(Number(budget.freight))}`);
  }
  if (Number(budget.other_costs) > 0) {
    addTotalLine("Outros custos", `+ ${formatCurrency(Number(budget.other_costs))}`);
  }

  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, y - 2, valX, y - 2);
  y += 2;

  addTotalLine("TOTAL", formatCurrency(Number(budget.total)), true, primaryColor);

  y += 4;

  // ─── Payment terms & notes ───
  if (budget.payment_terms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text("CONDIÇÕES DE PAGAMENTO", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    const ptLines = doc.splitTextToSize(budget.payment_terms, contentWidth);
    doc.text(ptLines, margin, y);
    y += ptLines.length * 4 + 4;
  }

  if (budget.general_notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text("OBSERVAÇÕES", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    const noteLines = doc.splitTextToSize(budget.general_notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 4;
  }

  // ─── Footer ───
  const footerText = company?.doc_footer_text || "Orçamento válido por 15 dias. Valores sujeitos a alteração sem aviso prévio.";
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.setFont("helvetica", "italic");
  const footerLines = doc.splitTextToSize(footerText, contentWidth);
  doc.text(footerLines, pageWidth / 2, pageHeight - 12, { align: "center" });

  // Page number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, pageWidth / 2, pageHeight - 6, { align: "center" });

  return doc;
}

export function downloadBudgetPdf(budget: BudgetWithItems, company?: DbCompanySettings | null) {
  const doc = generateBudgetPdf(budget, company);
  doc.save(`${budget.number}.pdf`);
}
