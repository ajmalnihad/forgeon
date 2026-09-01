import { apiClient } from "./client.js";

/**
 * Report scope shared by every endpoint below:
 *   from, to           → date range
 *   customerId         → optional customer filter
 *   productId          → optional product filter
 */
function scopeParams(params = {}) {
  return {
    date_from: params.from,
    date_to: params.to,
    customer: params.customerId,
    product: params.productId,
  };
}

/** GET /api/v1/reports/summary/?date_from=&date_to=&customer=&product= */
export async function summary(params = {}) {
  const { data } = await apiClient.get("/api/v1/reports/summary/", { params: scopeParams(params) });
  return data;
}

/** GET /api/v1/reports/timeseries/?period=&customer=&product= */
export async function timeseries(params = {}) {
  const { data } = await apiClient.get("/api/v1/reports/timeseries/", {
    params: { period: params.period, customer: params.customerId, product: params.productId },
  });
  return data;
}

/** GET /api/v1/reports/top-products/ */
export async function topProducts(params = {}) {
  const { data } = await apiClient.get("/api/v1/reports/top-products/", {
    params: { ...scopeParams(params), limit: params.limit },
  });
  return data;
}

/** GET /api/v1/reports/top-customers/ */
export async function topCustomers(params = {}) {
  const { data } = await apiClient.get("/api/v1/reports/top-customers/", {
    params: { ...scopeParams(params), limit: params.limit },
  });
  return data;
}

/** GET /api/v1/reports/loyalty/ */
export async function loyaltyOverview() {
  const { data } = await apiClient.get("/api/v1/reports/loyalty/");
  return data;
}
