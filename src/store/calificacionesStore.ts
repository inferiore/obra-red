import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";
import type { Calificacion } from "@/lib/calificaciones";
import { useAuthStore } from "@/store/authStore";

interface CalificacionesState {
  byTrabajador: Record<string, Calificacion[]>;
  fetchByTrabajador: (trabajadorUsername: string) => Promise<Calificacion[]>;
  crear: (data: {
    solicitudId: string;
    estrellas: number;
    comentario?: string;
    etiquetas?: string[];
  }) => Promise<Calificacion>;
}

const authToken = () => useAuthStore.getState().token;

export const useCalificacionesStore = create<CalificacionesState>()((set) => ({
  byTrabajador: {},

  fetchByTrabajador: async (trabajadorUsername) => {
    const calificaciones = await apiFetch<Calificacion[]>(
      `/calificaciones?trabajadorUsername=${trabajadorUsername}`,
      { token: authToken() },
    );
    set((state) => ({
      byTrabajador: { ...state.byTrabajador, [trabajadorUsername]: calificaciones },
    }));
    return calificaciones;
  },

  crear: async (data) => {
    return apiFetch<Calificacion>("/calificaciones", {
      method: "POST",
      body: data,
      token: authToken(),
    });
  },
}));
