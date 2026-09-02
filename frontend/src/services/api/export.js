import { apiClient } from "./client.js";

/**
 * Download the authenticated PDF response as a browser file.
 */
export async function exportSalesReportPdf(params = {}) {
  const response = await apiClient.get("/api/v1/reports/export/pdf/", {
    params: {
      date_from: params.from,
      date_to: params.to,
      customer: params.customerId,
      product: params.productId,
      payment_status: params.status === "all" ? undefined : params.status,
    },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `forgeon-sales-report-${params.from || "all"}-${params.to || "all"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true };
}
