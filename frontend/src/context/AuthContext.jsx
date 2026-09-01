import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api/index.js";
import { tokenStore } from "../services/api/client.js";

const AuthContext = createContext(null);
const USER_KEY = "forgeon.auth.user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    const cached = localStorage.getItem(USER_KEY);
    if (token && cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        tokenStore.clear();
      }
    }
    setBooting(false);
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    tokenStore.set(data.access);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      isStaff: user?.role === "staff",
      /** UX-layer permission map. Backend authorization remains the real gate. */
      can: {
        markPaid: user?.role === "admin",
        deleteSale: user?.role === "admin",
        restoreSale: user?.role === "admin",
        manageProducts: user?.role === "admin",
        editCustomer: user?.role === "admin",
        viewTrash: user?.role === "admin",
      },
    }),
    [user, booting, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
