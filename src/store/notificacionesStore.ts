import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

export interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  solicitudId: string | null;
  object: string | null;
  objectId: string | null;
  leido: boolean;
  createdAt: string;
}

interface NotificacionesState {
  items: Notificacion[];
  noLeidas: number;
  fetchAll: () => Promise<void>;
  marcarLeida: (id: string) => Promise<void>;
}

const authToken = () => useAuthStore.getState().token;

const contarNoLeidas = (items: Notificacion[]) =>
  items.filter((n) => !n.leido).length;

export const useNotificacionesStore = create<NotificacionesState>()((set) => ({
  items: [],
  noLeidas: 0,

  fetchAll: async () => {
    const items = await apiFetch<Notificacion[]>("/notificaciones", {
      token: authToken(),
    });
    set({ items, noLeidas: contarNoLeidas(items) });
  },

  marcarLeida: async (id) => {
    await apiFetch(`/notificaciones/${id}/leer`, {
      method: "PATCH",
      token: authToken(),
    });
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, leido: true } : n
      );
      return { items, noLeidas: contarNoLeidas(items) };
    });
  },
}));
