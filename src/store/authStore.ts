import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiFetch, ApiError } from "@/lib/apiClient";
import type { AuthUser, UserRole } from "@/types/solicitud";

export const DEMO_USERS: { username: string; password: string; role: UserRole }[] = [
  { username: "cliente", password: "obrared1", role: "cliente" },
  { username: "trabajador", password: "obrared1", role: "trabajador" },
  { username: "trabajador2", password: "obrared1", role: "trabajador" },
  { username: "admin", password: "obrared1", role: "admin" },
];

interface SessionUser {
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export type ProfileUpdate = Partial<Pick<SessionUser, "name" | "email" | "telefono" | "direccion">>;

interface ApiUser {
  username: string;
  name: string;
  role: UserRole;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}

const toSessionUser = (u: ApiUser): SessionUser => ({
  username: u.username,
  name: u.name,
  role: u.role,
  email: u.email ?? undefined,
  telefono: u.telefono ?? undefined,
  direccion: u.direccion ?? undefined,
});

const errorMessage = (e: unknown) => (e instanceof ApiError ? e.message : "Error de conexión con el servidor");

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  login: (
    username: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string; role?: UserRole }>;
  logout: () => void;
  register: (data: AuthUser) => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (data: ProfileUpdate) => Promise<{ ok: boolean; error?: string }>;
  cambiarPassword: (actual: string, nueva: string) => Promise<{ ok: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: async (username, password) => {
        try {
          const res = await apiFetch<{ token: string; user: ApiUser }>("/auth/login", {
            method: "POST",
            body: { username, password },
          });
          set({ user: toSessionUser(res.user), token: res.token });
          return { ok: true, role: res.user.role };
        } catch (e) {
          return { ok: false, error: errorMessage(e) };
        }
      },

      logout: () => set({ user: null, token: null }),

      register: async (data) => {
        try {
          const res = await apiFetch<{ token: string; user: ApiUser }>("/auth/register", {
            method: "POST",
            body: data,
          });
          set({ user: toSessionUser(res.user), token: res.token });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: errorMessage(e) };
        }
      },

      updateProfile: async (data) => {
        const { token } = get();
        try {
          const updated = await apiFetch<ApiUser>("/users/me", {
            method: "PATCH",
            body: data,
            token,
          });
          set({ user: toSessionUser(updated) });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: errorMessage(e) };
        }
      },

      cambiarPassword: async (actual, nueva) => {
        const { token } = get();
        try {
          await apiFetch<void>("/auth/cambiar-password", {
            method: "PATCH",
            body: { actual, nueva },
            token,
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: errorMessage(e) };
        }
      },
    }),
    {
      name: "obrared_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);
