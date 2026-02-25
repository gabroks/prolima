import { toast } from "sonner";

interface ExportOptions {
  headers: string[];
  rows: string[][];
  filename: string;
  successMessage?: string;
}

export function exportToCSV({ headers, rows, filename, successMessage }: ExportOptions) {
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(successMessage || `${rows.length} registros exportados`);
}
