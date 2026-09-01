import { apiClient } from "./client.js";

/** GET /api/v1/customers/?search=&limit= */
export async function list(params = {}) {
  const { data } = await apiClient.get("/api/v1/customers/", {
    params: { search: params.q, limit: params.limit },
  });
  return data.results ?? data;
}

/** GET /api/v1/customers/:id/ */
export async function get(id) {
  const { data } = await apiClient.get(`/api/v1/customers/${id}/`);
  return data;
}

/** POST /api/v1/customers/ */
export async function create(payload) {
  const { data } = await apiClient.post("/api/v1/customers/", payload);
  return data;
}

/** PATCH /api/v1/customers/:id/ (Admin) */
export async function update(id, payload) {
  const { data } = await apiClient.patch(`/api/v1/customers/${id}/`, payload);
  return data;
}

/** GET /api/v1/customers/:id/loyalty/ */
export async function loyalty(id) {
  const { data } = await apiClient.get(`/api/v1/customers/${id}/loyalty/`);
  return data;
}

/**
 * POST /api/v1/customers/:id/loyalty-preview/
 * Body: { date, paymentDone, excludeSaleId }
 */
export async function loyaltyPreview({ customerId, date, paymentDone, excludeSaleId } = {}) {
  const { data } = await apiClient.post(`/api/v1/customers/${customerId}/loyalty-preview/`, {
    date,
    paymentDone,
    excludeSaleId,
  });
  return data;
}
