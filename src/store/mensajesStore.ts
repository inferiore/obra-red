import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

export interface Mensaje {
  id: string;
  solicitudId: string;
  autorUsername: string;
  contenido: string;
  leidoPorDestinatario: boolean;
  createdAt: string;
}

export interface Conversacion {
  solicitudId: string;
  contraparteNombre: string;
  ultimoMensaje: string;
  ultimaFecha: string;
  noLeidos: number;
}

interface MensajesState {
  bySolicitud: Record<string, Mensaje[]>;
  conversaciones: Conversacion[];
  fetchConversaciones: () => Promise<void>;
  fetchBySolicitud: (solicitudId: string) => Promise<void>;
  enviar: (solicitudId: string, contenido: string) => Promise<void>;
}

const authToken = () => useAuthStore.getState().token;

export const useMensajesStore = create<MensajesState>()((set, get) => ({
  bySolicitud: {},
  conversaciones: [],

  fetchConversaciones: async () => {
    const conversaciones = await apiFetch<Conversacion[]>("/mensajes/conversaciones", {
      token: authToken(),
    });
    set({ conversaciones });
  },

  fetchBySolicitud: async (solicitudId) => {
    const mensajes = await apiFetch<Mensaje[]>(`/solicitudes/${solicitudId}/mensajes`, {
      token: authToken(),
    });
    set((state) => ({ bySolicitud: { ...state.bySolicitud, [solicitudId]: mensajes } }));
    await get().fetchConversaciones();
  },

  enviar: async (solicitudId, contenido) => {
    await apiFetch(`/solicitudes/${solicitudId}/mensajes`, {
      method: "POST",
      body: { contenido },
      token: authToken(),
    });
    await get().fetchBySolicitud(solicitudId);
  },
}));
