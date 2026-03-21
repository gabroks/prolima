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
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const footerHeight = 28;
  const pageBottom = pageHeight - margin;
  const lastSectionBottom = pageHeight - footerHeight - margin;
  let y = margin;

  const ensureSpace = (needed: number, reserveFooter = false) => {
    const limit = reserveFooter ? lastSectionBottom : pageBottom;
    if (y + needed > limit) {
      doc.addPage();
      y = margin;
    }
  };

  // ─── Header (compact) ───
  if (company?.logo) {
    try {
      const logoData = await loadImageAsBase64(company.logo);
      if (logoData) doc.addImage(logoData, "PNG", margin, y, 32, 14);
    } catch { /* no logo */ }
  }

  doc.setFillColor(...PRIMARY);
  const titleW = 60;
  const titleX = (pageWidth - titleW) / 2;
  drawRoundedRect(doc, titleX, y, titleW, 14, 3, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ORÇAMENTO", pageWidth / 2, y + 6, { align: "center" });
  doc.setFontSize(9);
  doc.text(budget.number, pageWidth / 2, y + 12, { align: "center" });

  if (company?.pix_qr_code) {
    try {
      const qrData = await loadImageAsBase64(company.pix_qr_code);
      if (qrData) doc.addImage(qrData, "PNG", pageWidth - margin - 20, y - 1, 20, 20);
    } catch { /* no qr */ }
  }

  y += 17;

  // ─── Company info (compact) ───
  const companyName = company?.nome_fantasia || company?.razao_social || "EMPRESA";
  const companyInfoParts: string[] = [];
  if (company?.phone) companyInfoParts.push(`Tel: ${company.phone}`);
  if (company?.email) companyInfoParts.push(company.email);
  const address = [company?.street, company?.neighborhood, company?.city, company?.state].filter(Boolean).join(", ");
  if (address) companyInfoParts.push(address);

  drawSectionBox(doc, margin, y, contentWidth, 12, PRIMARY, [248, 248, 248]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(companyName, margin + 3, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  if (companyInfoParts.length > 0) {
    doc.text(companyInfoParts.join("  |  "), margin + 3, y + 9);
  }
  y += 14;

  // ─── Client + Dates in same row ───
  drawSectionTitle(doc, "CLIENTE", margin, y, contentWidth * 0.55, PRIMARY);
  drawSectionTitle(doc, "DATAS", margin + contentWidth * 0.57, y, contentWidth * 0.43, PRIMARY);
  y += 7;

  // Client box
  const clientW = contentWidth * 0.55;
  drawSectionBox(doc, margin, y, clientW, 10, GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(budget.client_name, margin + 3, y + 6);

  // Dates inline
  const datesX = margin + contentWidth * 0.57;
  const datesW = contentWidth * 0.43;
  const dateColW = datesW / 3;
  const dates = [
    { label: "EMISSÃO", value: formatDate(budget.created_at) },
    { label: "VALIDADE", value: budget.validity_date ? formatDate(budget.validity_date) : "—" },
    { label: "ENTREGA", value: budget.delivery_date ? formatDate(budget.delivery_date) : "—" },
  ];
  dates.forEach((d, i) => {
    const dx = datesX + i * dateColW;
    drawSectionBox(doc, dx, y, dateColW, 10, [200, 200, 200]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text(d.label, dx + dateColW / 2, y + 3.5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(d.value, dx + dateColW / 2, y + 8, { align: "center" });
  });
  y += 13;

  // ─── Service description ───
  if (budget.service_description) {
    doc.setFontSize(8);
    const descLines = doc.splitTextToSize(budget.service_description, contentWidth);
    const descH = descLines.length * 3 + 8;
    ensureSpace(descH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...PRIMARY);
    doc.text("DESCRIÇÃO DO SERVIÇO", margin, y);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1.2, margin + 45, y + 1.2);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(descLines, margin, y);
    y += descLines.length * 3 + 3;
  }

  // ─── Materials table ───
  ensureSpace(12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...PRIMARY);
  doc.text("MATERIAIS E SERVIÇOS", margin, y);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.2, margin + 45, y + 1.2);
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
    margin: { left: margin, right: margin, bottom: margin + 3 },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 7 },
      1: { cellWidth: "auto" },
      2: { halign: "center", cellWidth: 12 },
      3: { halign: "center", cellWidth: 10 },
      4: { halign: "center", cellWidth: 10 },
      5: { halign: "center", cellWidth: 12 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "right", cellWidth: 26, fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  // ─── Payment terms (inline) ───
  if (budget.payment_terms) {
    ensureSpace(14, true);
    drawSectionTitle(doc, "PAGAMENTO:", margin, y, contentWidth, PRIMARY);
    y += 7;
    drawSectionBox(doc, margin, y, contentWidth, 8, [200, 200, 200]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(budget.payment_terms, margin + 3, y + 5);
    y += 10;
  }

  // ─── Totals ───
  const totalLinesCount = 2 + (Number(budget.total_discount) > 0 ? 1 : 0) + (Number(budget.freight) > 0 ? 1 : 0) + (Number(budget.other_costs) > 0 ? 1 : 0);
  ensureSpace(totalLinesCount * 5 + 8, true);

  const valX = pageWidth - margin;
  const labelX = valX - 45;
  const totalsX = pageWidth - margin - 65;

  const addTotalLine = (label: string, value: string, bold = false, color: [number, number, number] = DARK) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 8);
    doc.setTextColor(...GRAY);
    doc.text(label, labelX, y, { align: "right" });
    doc.setTextColor(...color);
    doc.text(value, valX, y, { align: "right" });
    y += bold ? 6 : 4.5;
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
  doc.line(totalsX, y - 1, valX, y - 1);
  y += 1.5;

  addTotalLine("TOTAL:", formatCurrency(Number(budget.total)), true, PRIMARY);
  y += 2;

  // ─── Observations ───
  if (budget.general_notes) {
    doc.setFontSize(7.5);
    const noteLines = doc.splitTextToSize(budget.general_notes, contentWidth - 6);
    const noteBoxH = Math.max(8, noteLines.length * 3.5 + 4);
    ensureSpace(noteBoxH + 9, true);
    drawSectionTitle(doc, "OBSERVAÇÕES:", margin, y, contentWidth, PRIMARY);
    y += 7;
    drawSectionBox(doc, margin, y, contentWidth, noteBoxH, [200, 200, 200]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(noteLines, margin + 3, y + 4);
    y += noteBoxH + 2;
  }

  // ─── Footer with signatures (last page, bottom) ───
  const drawFooter = () => {
    const footerY = pageHeight - 24;

    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...DARK);
    const footerName = company?.razao_social || company?.nome_fantasia || "";
    const footerCnpj = company?.cnpj ? ` - CNPJ: ${company.cnpj}` : "";
    doc.text(footerName + footerCnpj, pageWidth / 2, footerY + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    const contactLine = [company?.phone, company?.email].filter(Boolean).join(" | ");
    if (contactLine) {
      doc.text(contactLine, pageWidth / 2, footerY + 7.5, { align: "center" });
    }

    const sigY = footerY + 14;
    const sigWidth = 55;

    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.3);
    doc.line(margin, sigY, margin + sigWidth, sigY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text("Assinatura Cliente", margin + sigWidth / 2, sigY + 3.5, { align: "center" });

    doc.line(pageWidth - margin - sigWidth, sigY, pageWidth - margin, sigY);
    doc.text("Assinatura Empresa", pageWidth - margin - sigWidth / 2, sigY + 3.5, { align: "center" });
  };

  drawFooter();

  return doc;
}

export async function downloadBudgetPdf(budget: BudgetWithItems, company?: DbCompanySettings | null) {
  const doc = await generateBudgetPdf(budget, company);
  doc.save(`${budget.number}.pdf`);
}
