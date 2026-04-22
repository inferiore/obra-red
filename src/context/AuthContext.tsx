import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { AuthUser, UserRole } from "@/types/solicitud";

// Hardcoded users (sin backend)
export const HARDCODED_USERS: AuthUser[] = [
  { username: "cliente", password: "cliente123", name: "Carlos Cliente", role: "cliente" },
  { username: "trabajador", password: "trabajador123", name: "Tomás Trabajador", role: "trabajador" },
  { username: "admin", password: "admin123", name: "Admin ObraRed", role: "admin" },
];

interface SessionUser {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: SessionUser | null;
  login: (username: string, password: string) => { ok: boolean; error?: string; role?: UserRole };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "obrared_session";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login: AuthContextValue["login"] = (username, password) => {
    const found = HARDCODED_USERS.find(
      (u) => u.username === username.trim() && u.password === password,
    );
    if (!found) return { ok: false, error: "Credenciales incorrectas" };
    const session: SessionUser = { username: found.username, name: found.name, role: found.role };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true, role: found.role };
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
