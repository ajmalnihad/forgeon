import { apiClient } from "./client.js";

/** GET /api/v1/sales/?search=&date_from=&date_to=&payment_status=&customer=&product=&ordering= */
export async function list(params = {}) {
  const { data } = await apiClient.get("/api/v1/sales/", {
    params: {
      search: params.q,
      date_from: params.from,
      date_to: params.to,
      payment_status: params.status === "all" ? undefined : params.status,
      customer: params.customerId,
      product: params.productId,
      ordering: params.sort,
    },
  });
  return data.results ?? data;
}

/** GET /api/v1/sales/:id/ */
export async function get(id) {
  const { data } = await apiClient.get(`/api/v1/sales/${id}/`);
  return data;
}

/** POST /api/v1/sales/ */
export async function create(payload, actor) {
  const { data } = await apiClient.post("/api/v1/sales/", payload);
  return data;
}

/** PATCH /api/v1/sales/:id/ */
export async function update(id, payload) {
  const { data } = await apiClient.patch(`/api/v1/sales/${id}/`, payload);
  return data;
}

/** POST /api/v1/sales/:id/mark-paid/ (Admin only — backend enforces) */
export async function markPaid(id) {
  const { data } = await apiClient.post(`/api/v1/sales/${id}/mark-paid/`);
  return data;
}

/** DELETE /api/v1/sales/:id/ with required reason — soft delete (Admin only) */
export async function softDelete(id, reason, actor) {
  const { data } = await apiClient.delete(`/api/v1/sales/${id}/`, { data: { reason } });
  return data;
}

/** POST /api/v1/sales/:id/restore/ (Admin only) */
export async function restore(id) {
  const { data } = await apiClient.post(`/api/v1/sales/${id}/restore/`);
  return data;
}

/** GET /api/v1/sales/trash/ (Admin only) */
export async function trash() {
  const { data } = await apiClient.get("/api/v1/sales/trash/");
  return data.results ?? data;
}

/** GET /api/v1/sales/?payment_status=pending */
export async function pending() {
  const { data } = await apiClient.get("/api/v1/sales/", {
    params: { payment_status: "pending" },
  });
  return data.results ?? data;
}
