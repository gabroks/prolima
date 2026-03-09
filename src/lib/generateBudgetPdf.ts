import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BudgetWithItems } from "@/hooks/useBudgets";
import type { DbCompanySettings } from "@/hooks/useCompanySettings";
import { formatCurrency, formatDate } from "@/lib/formatters";

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function getThemePrimary(): [number, number, number] {
  const saved = localStorage.getItem("app-theme-primary");
  if (saved) {
    const parts = saved.match(/([\d.]+)/g);
    if (parts && parts.length >= 3) {
      return hslToRgb(Number(parts[0]), Number(parts[1]), Number(parts[2]));
    }
  }
  return [45, 138, 94]; // default green
}

const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [120, 120, 120];
const GOLD: [number, number, number] = [218, 165, 32];
const WHITE: [number, number, number] = [255, 255, 255];

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: "S" | "F" | "FD" = "S") {
  doc.roundedRect(x, y, w, h, r, r, style);
}

function drawSectionBox(doc: jsPDF, x: number, y: number, w: number, h: number, borderColor: [number, number, number] = [45, 138, 94], fillColor?: [number, number, number]) {
  if (fillColor) {
    doc.setFillColor(...fillColor);
  }
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  drawRoundedRect(doc, x, y, w, h, 2, fillColor ? "FD" : "S");
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number, w: number, color: [number, number, number] = [45, 138, 94]) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, 7, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(title, x + 3, y + 5);
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateBudgetPdf(budget: BudgetWithItems, company?: DbCompanySettings | null) {
  const PRIMARY = getThemePrimary();
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Header ───
  // Logo (left)
  let logoEndX = margin;
  if (company?.logo) {
    try {
      const logoData = await loadImageAsBase64(company.logo);
      if (logoData) {
        doc.addImage(logoData, "PNG", margin, y, 40, 18);
        logoEndX = margin + 42;
      }
    } catch { /* no logo */ }
  }

  // Title (center)
  doc.setFillColor(...PRIMARY);
  const titleW = 70;
  const titleX = (pageWidth - titleW) / 2;
  drawRoundedRect(doc, titleX, y, titleW, 18, 3, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ORÇAMENTO", pageWidth / 2, y + 8, { align: "center" });
  doc.setFontSize(10);
  doc.text(budget.number, pageWidth / 2, y + 15, { align: "center" });

  // PIX QR Code (right)
  if (company?.pix_qr_code) {
    try {
      const qrData = await loadImageAsBase64(company.pix_qr_code);
      if (qrData) {
        doc.addImage(qrData, "PNG", pageWidth - margin - 25, y - 2, 25, 25);
      }
    } catch { /* no qr */ }
  }

  y += 24;

  // ─── Company info box ───
  drawSectionBox(doc, margin, y, contentWidth, 18, PRIMARY, [248, 248, 248]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const companyName = company?.nome_fantasia || company?.razao_social || "EMPRESA";
  doc.text(companyName, margin + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  const companyLines: string[] = [];
  if (company?.phone) companyLines.push(`Tel: ${company.phone}`);
  if (company?.email) companyLines.push(`Email: ${company.email}`);
  const address = [company?.street, company?.neighborhood, company?.city, company?.state].filter(Boolean).join(", ");
  if (address) companyLines.push(address);
  companyLines.forEach((line, i) => {
    doc.text(line, margin + 3, y + 9 + i * 3.5);
  });

  y += 22;

  // ─── Client info box (gold border) ───
  const clientBoxH = 16;
  drawSectionTitle(doc, "INFORMAÇÕES DO CLIENTE", margin, y, contentWidth, PRIMARY);
  y += 7;
  drawSectionBox(doc, margin, y, contentWidth, clientBoxH, GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(budget.client_name, margin + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  // We don't have client phone/email on budget, just show name
  y += clientBoxH + 8;

  // ─── Dates row ───
  const dateColW = contentWidth / 3;
  const dateBoxH = 12;
  const dates = [
    { label: "EMISSÃO", value: formatDate(budget.created_at) },
    { label: "VALIDADE", value: budget.validity_date ? formatDate(budget.validity_date) : "—" },
    { label: "PREV. ENTREGA", value: budget.delivery_date ? formatDate(budget.delivery_date) : "—" },
  ];
  dates.forEach((d, i) => {
    const dx = margin + i * dateColW;
    drawSectionBox(doc, dx, y, dateColW, dateBoxH, [200, 200, 200]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(d.label, dx + dateColW / 2, y + 4, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    doc.text(d.value, dx + dateColW / 2, y + 9.5, { align: "center" });
  });
  y += dateBoxH + 4;

  // ─── Service description ───
  if (budget.service_description) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text("DESCRIÇÃO DO SERVIÇO", margin, y);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.5, margin + 55, y + 1.5);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    const descLines = doc.splitTextToSize(budget.service_description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 3.5 + 8;
  }

  // ─── Materials table ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.text("MATERIAIS E SERVIÇOS", margin, y);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, margin + 55, y + 1.5);
  y += 2;

  const items = budget.budget_items || [];
  const tableHead = [["#", "DESCRIÇÃO", "UN", "L", "A", "QTD", "PREÇO", "SUBTOTAL"]];
  const tableBody = items.map((item, i) => {
    const w = Number(item.width);
    const h = Number(item.height);
    const desc = item.material_name + (item.notes ? `\nObs: ${item.notes}` : "");
    const qty = Number(item.qty);
    const unitPrice = qty === 1 ? Number(item.total) : Number(item.unit_price);
    return [
      String(i + 1),
      desc,
      item.unit,
      w > 0 ? String(w) : "-",
      h > 0 ? String(h) : "-",
      String(qty),
      formatCurrency(unitPrice),
      formatCurrency(Number(item.total)),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "center", cellWidth: 12 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "right", cellWidth: 24 },
      7: { halign: "right", cellWidth: 28, fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // ─── Payment terms box ───
  if (budget.payment_terms) {
    drawSectionTitle(doc, "FORMAS DE PAGAMENTO:", margin, y, contentWidth, PRIMARY);
    y += 7;
    drawSectionBox(doc, margin, y, contentWidth, 10, [200, 200, 200]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(budget.payment_terms, margin + 3, y + 5);
    y += 14;
  }

  // ─── Totals ───
  const totalsX = pageWidth - margin - 70;
  const valX = pageWidth - margin;

  const labelX = valX - 50;

  const addTotalLine = (label: string, value: string, bold = false, color: [number, number, number] = DARK) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 9);
    doc.setTextColor(...GRAY);
    doc.text(label, labelX, y, { align: "right" });
    doc.setTextColor(...color);
    doc.text(value, valX, y, { align: "right" });
    y += bold ? 8 : 5;
  };

  addTotalLine("Subtotal:", formatCurrency(Number(budget.subtotal)));
  if (Number(budget.total_discount) > 0) {
    addTotalLine(
      `Desconto${budget.discount_type === "percent" ? ` (${budget.discount_value}%)` : ""}: −`,
      formatCurrency(Number(budget.total_discount)),
      false,
      [200, 50, 50]
    );
  }
  if (Number(budget.freight) > 0) {
    addTotalLine("Frete: +", formatCurrency(Number(budget.freight)));
  }
  if (Number(budget.other_costs) > 0) {
    addTotalLine("Outros custos: +", formatCurrency(Number(budget.other_costs)));
  }

  doc.setDrawColor(200, 200, 200);
  doc.line(totalsX, y - 2, valX, y - 2);
  y += 2;

  addTotalLine("TOTAL:", formatCurrency(Number(budget.total)), true, PRIMARY);
  y += 4;

  // ─── Observations box ───
  if (budget.general_notes) {
    drawSectionTitle(doc, "OBSERVAÇÕES:", margin, y, contentWidth, PRIMARY);
    y += 7;
    const noteLines = doc.splitTextToSize(budget.general_notes, contentWidth - 6);
    const noteBoxH = Math.max(10, noteLines.length * 4 + 6);
    drawSectionBox(doc, margin, y, contentWidth, noteBoxH, [200, 200, 200]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(noteLines, margin + 3, y + 5);
    y += noteBoxH + 4;
  }

  // ─── Footer with signatures ───
  const footerY = pageHeight - 30;

  // Separator line
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Company name + CNPJ centered
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  const footerName = company?.razao_social || company?.nome_fantasia || "";
  const footerCnpj = company?.cnpj ? ` - CNPJ: ${company.cnpj}` : "";
  doc.text(footerName + footerCnpj, pageWidth / 2, footerY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const contactLine = [company?.phone, company?.email].filter(Boolean).join(" | ");
  if (contactLine) {
    doc.text(contactLine, pageWidth / 2, footerY + 9, { align: "center" });
  }

  // Signature lines
  const sigY = footerY + 18;
  const sigWidth = 60;

  // Client signature
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY, margin + sigWidth, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("Assinatura Cliente", margin + sigWidth / 2, sigY + 4, { align: "center" });

  // Company signature
  doc.line(pageWidth - margin - sigWidth, sigY, pageWidth - margin, sigY);
  doc.text("Assinatura Empresa", pageWidth - margin - sigWidth / 2, sigY + 4, { align: "center" });

  return doc;
}

export async function downloadBudgetPdf(budget: BudgetWithItems, company?: DbCompanySettings | null) {
  const doc = await generateBudgetPdf(budget, company);
  doc.save(`${budget.number}.pdf`);
}
