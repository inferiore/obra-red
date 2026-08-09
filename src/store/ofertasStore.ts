import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";
import type { Oferta } from "@/lib/ofertas";
import { useAuthStore } from "@/store/authStore";

interface OfertasState {
  bySolicitud: Record<string, Oferta[]>;
  fetchBySolicitud: (solicitudId: string) => Promise<Oferta[]>;
  crear: (data: {
    solicitudId: string;
    precio: number;
    mensaje: string;
    fechaInicio: string;
    tiempoEstimadoDias?: number;
  }) => Promise<void>;
  aceptar: (ofertaId: string, solicitudId: string) => Promise<void>;
}

const authToken = () => useAuthStore.getState().token;

export const useOfertasStore = create<OfertasState>()((set, get) => ({
  bySolicitud: {},

  fetchBySolicitud: async (solicitudId) => {
    const ofertas = await apiFetch<Oferta[]>(`/ofertas?solicitudId=${solicitudId}`, {
      token: authToken(),
    });
    set((state) => ({ bySolicitud: { ...state.bySolicitud, [solicitudId]: ofertas } }));
    return ofertas;
  },

  crear: async (data) => {
    await apiFetch("/ofertas", { method: "POST", body: data, token: authToken() });
    await get().fetchBySolicitud(data.solicitudId);
  },

  aceptar: async (ofertaId, solicitudId) => {
    await apiFetch(`/ofertas/${ofertaId}/aceptar`, { method: "PATCH", token: authToken() });
    await get().fetchBySolicitud(solicitudId);
  },
}));
