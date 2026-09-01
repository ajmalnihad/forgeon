import { apiClient } from "./client.js";

/**
 * PDF EXPORT — PLACEHOLDER SERVICE BOUNDARY.
 *
 * Backend PDF generation (Django) is processed as a GET stream. Once Stage 3 is ready,
 * this will stream the real PDF and trigger client-side download.
 */
export async function exportSalesReportPdf(params = {}) {
  const response = await apiClient.get("/api/v1/reports/export/pdf/", {
    params: { date_from: params.from, date_to: params.to, ...params },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `forgeon-sales-report-${params.from || "all"}-${params.to || "all"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}
