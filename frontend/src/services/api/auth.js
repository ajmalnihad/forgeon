import { apiClient, tokenStore } from "./client.js";

/** POST /api/v1/auth/login/ → { access, refresh, user } */
export async function login(credentials) {
  const { data } = await apiClient.post("/api/v1/auth/login/", credentials);
  return data;
}

/** GET /api/v1/auth/me/ */
export async function me() {
  const { data } = await apiClient.get("/api/v1/auth/me/");
  return data;
}

/** Client-side logout. SimpleJWT token blacklist integration can go here if needed. */
export async function logout() {
  tokenStore.clear();
  return true;
}
