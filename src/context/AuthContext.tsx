import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { AuthUser, UserRole } from "@/types/solicitud";

// Hardcoded users (sin backend)
export const HARDCODED_USERS: AuthUser[] = [
  { username: "cliente", password: "obrared1", name: "Carlos Cliente", role: "cliente" },
  { username: "trabajador", password: "obrared1", name: "Tomás Trabajador", role: "trabajador" },
  { username: "admin", password: "obrared1", name: "Admin ObraRed", role: "admin" },
];

const REGISTERED_KEY = "obrared_registered_users";
const STORAGE_KEY = "obrared_session";

interface SessionUser {
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export type ProfileUpdate = Partial<Pick<SessionUser, "name" | "email" | "telefono" | "direccion">>;

interface AuthContextValue {
  user: SessionUser | null;
  login: (username: string, password: string) => { ok: boolean; error?: string; role?: UserRole };
  logout: () => void;
  register: (data: AuthUser) => { ok: boolean; error?: string };
  updateProfile: (data: ProfileUpdate) => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getRegistered = (): AuthUser[] => {
  try {
    const raw = localStorage.getItem(REGISTERED_KEY);
    return raw ? (JSON.parse(raw) as AuthUser[]) : [];
  } catch {
    return [];
  }
};

const saveRegistered = (users: AuthUser[]) => {
  localStorage.setItem(REGISTERED_KEY, JSON.stringify(users));
};

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

  const findUser = (username: string, password: string): AuthUser | undefined => {
    const all = [...HARDCODED_USERS, ...getRegistered()];
    return all.find((u) => u.username === username.trim() && u.password === password);
  };

  const login: AuthContextValue["login"] = (username, password) => {
    const found = findUser(username, password);
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

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    (data) => {
      if (!user) return { ok: false, error: "No hay sesión activa" };
      const name = data.name?.trim();
      if (data.name !== undefined && !name) {
        return { ok: false, error: "El nombre no puede estar vacío" };
      }
      const email = data.email?.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Correo electrónico inválido" };
      }
      const updated: SessionUser = {
        ...user,
        ...(name ? { name } : {}),
        ...(data.email !== undefined ? { email } : {}),
        ...(data.telefono !== undefined ? { telefono: data.telefono?.trim() } : {}),
        ...(data.direccion !== undefined ? { direccion: data.direccion?.trim() } : {}),
      };
      // Persistir en sesión
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      // Persistir también en el listado de registrados (si aplica)
      const registered = getRegistered();
      const idx = registered.findIndex((u) => u.username === user.username);
      if (idx >= 0) {
        registered[idx] = {
          ...registered[idx],
          name: updated.name,
          email: updated.email,
          telefono: updated.telefono,
          direccion: updated.direccion,
        };
        saveRegistered(registered);
      }
      return { ok: true };
    },
    [user],
  );

  const register = useCallback<AuthContextValue["register"]>((data) => {
    const all = [...HARDCODED_USERS, ...getRegistered()];
    const username = data.username.trim().toLowerCase();
    if (all.some((u) => u.username.toLowerCase() === username)) {
      return { ok: false, error: "El nombre de usuario ya está en uso" };
    }
    if (data.email && all.some((u) => u.email?.toLowerCase() === data.email!.toLowerCase())) {
      return { ok: false, error: "El correo ya está registrado" };
    }
    const newUser: AuthUser = { ...data, username };
    saveRegistered([...getRegistered(), newUser]);
    // Auto-login
    const session: SessionUser = { username: newUser.username, name: newUser.name, role: newUser.role };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    return { ok: true };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, updateProfile }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
