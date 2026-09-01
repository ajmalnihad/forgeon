import { apiClient } from "./client.js";

/** GET /api/v1/products/?search=&category=&include_inactive= */
export async function list(params = {}) {
  const { data } = await apiClient.get("/api/v1/products/", {
    params: {
      search: params.q,
      category: params.category === "all" ? undefined : params.category,
      include_inactive: params.includeInactive || undefined,
    },
  });
  return data.results ?? data;
}

/** GET /api/v1/products/categories/ */
export async function categories() {
  const { data } = await apiClient.get("/api/v1/products/categories/");
  return data;
}

/** POST /api/v1/products/ (Admin) */
export async function create(payload) {
  const { data } = await apiClient.post("/api/v1/products/", payload);
  return data;
}

/** PATCH /api/v1/products/:id/ (Admin) */
export async function update(id, payload) {
  const { data } = await apiClient.patch(`/api/v1/products/${id}/`, payload);
  return data;
}

/** PATCH /api/v1/products/:id/ — soft delete / reactivate (Admin) */
export async function setActive(id, active) {
  const { data } = await apiClient.patch(`/api/v1/products/${id}/`, { active });
  return data;
}
