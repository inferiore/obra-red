import { create } from "zustand";
import { apiFetch } from "@/lib/apiClient";
import type { Solicitud, SolicitudEstado } from "@/types/solicitud";
import { useAuthStore } from "@/store/authStore";

interface SolicitudesState {
  solicitudes: Solicitud[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  fetchOne: (id: string) => Promise<Solicitud>;
  porUsuario: (username: string) => Solicitud[];
  crear: (
    data: Omit<
      Solicitud,
      | "id"
      | "createdAt"
      | "estado"
      | "clienteUsername"
      | "clienteNombre"
      | "evidenciaAntes"
      | "evidenciaDurante"
      | "evidenciaDespues"
      | "correcciones"
      | "correccionesCount"
    > & {
      estado?: SolicitudEstado;
    }
  ) => Promise<Solicitud | null>;
  actualizarEstado: (
    id: string,
    estado: SolicitudEstado,
    trabajadorUsername?: string
  ) => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  actualizar?: (
    data: Omit<
      Solicitud,
      | "createdAt"
      | "clienteUsername"
      | "clienteNombre"
      | "evidenciaAntes"
      | "evidenciaDurante"
      | "evidenciaDespues"
      | "correcciones"
      | "correccionesCount"
    >
  ) => Promise<Solicitud | null>;
  subirEvidencias: (
    id: string,
    data: {
      antes: string[];
      durante: string[];
      despues: string[];
      nota?: string;
    }
  ) => Promise<Solicitud>;
  subirEvidenciaDisputa: (id: string, fotos: string[]) => Promise<void>;
  solicitarCorreccion: (id: string, comentario: string) => Promise<Solicitud>;
  abrirDisputa: (id: string, comentario: string) => Promise<Solicitud>;
  resolverDisputa: (
    id: string,
    estado: "ejecucion" | "finalizado"
  ) => Promise<Solicitud>;
  adjuntarFotos: (
    objectId: string,
    object: string,
    file: File[]
  ) => Promise<string[]>;
}

const authToken = () => useAuthStore.getState().token;

export const useSolicitudesStore = create<SolicitudesState>()((set, get) => ({
  solicitudes: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const solicitudes = await apiFetch<Solicitud[]>("/solicitudes", {
        token: authToken(),
      });
      set({ solicitudes, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchOne: async (id) => {
    const actualizada = await apiFetch<Solicitud>(`/solicitudes/${id}`, {
      token: authToken(),
    });
    set((state) => {
      const existe = state.solicitudes.some((s) => s.id === id);
      return {
        solicitudes: existe
          ? state.solicitudes.map((s) => (s.id === id ? actualizada : s))
          : [...state.solicitudes, actualizada],
      };
    });
    return actualizada;
  },

  porUsuario: (username) =>
    get().solicitudes.filter((s) => s.clienteUsername === username),

  crear: async (data) => {
    const nueva = await apiFetch<Solicitud>("/solicitudes", {
      method: "POST",
      body: data,
      token: authToken(),
    });
    set((state) => ({ solicitudes: [nueva, ...state.solicitudes] }));
    return nueva;
  },

  actualizarEstado: async (id, estado, trabajadorUsername) => {
    const actualizada = await apiFetch<Solicitud>(`/solicitudes/${id}/estado`, {
      method: "PATCH",
      body: { estado, trabajadorUsername },
      token: authToken(),
    });
    set((state) => ({
      solicitudes: state.solicitudes.map((s) =>
        s.id === id ? actualizada : s
      ),
    }));
  },

  eliminar: async (id) => {
    await apiFetch(`/solicitudes/${id}`, {
      method: "DELETE",
      token: authToken(),
    });
    set((state) => ({
      solicitudes: state.solicitudes.filter((s) => s.id !== id),
    }));
  },
  actualizar: async (data) => {
    const updated = await apiFetch<Solicitud>(`/solicitudes/${data.id}`, {
      method: "PATCH",
      body: data,
      token: authToken(),
    });
    set((state) => ({
      solicitudes: state.solicitudes.map((item) =>
        item.id === data.id ? updated : item
      ),
    }));
    return updated;
  },

  subirEvidencias: async (id, data) => {
    const actualizada = await apiFetch<Solicitud>(
      `/solicitudes/${id}/evidencias`,
      {
        method: "PATCH",
        body: data,
        token: authToken(),
      }
    );
    set((state) => ({
      solicitudes: state.solicitudes.map((s) =>
        s.id === id ? actualizada : s
      ),
    }));
    return actualizada;
  },

  subirEvidenciaDisputa: async (id, fotos) => {
    const actualizada = await apiFetch<Solicitud>(
      `/solicitudes/${id}/evidencia-disputa`,
      {
        method: "PATCH",
        body: { fotos },
        token: authToken(),
      }
    );
    set((state) => ({
      solicitudes: state.solicitudes.map((s) =>
        s.id === id ? actualizada : s
      ),
    }));
  },

  solicitarCorreccion: async (id, comentario) => {
    const actualizada = await apiFetch<Solicitud>(
      `/solicitudes/${id}/solicitar-correccion`,
      {
        method: "PATCH",
        body: { comentario },
        token: authToken(),
      }
    );
    set((state) => ({
      solicitudes: state.solicitudes.map((s) =>
        s.id === id ? actualizada : s
      ),
    }));
    return actualizada;
  },

  abrirDisputa: async (id, comentario) => {
    const actualizada = await apiFetch<Solicitud>(
      `/solicitudes/${id}/abrir-disputa`,
      {
        method: "PATCH",
        body: { comentario },
        token: authToken(),
      }
    );
    set((state) => ({
      solicitudes: state.solicitudes.map((s) =>
        s.id === id ? actualizada : s
      ),
    }));
    return actualizada;
  },
  resolverDisputa: async (id, estado) => {
    const actualizada = await apiFetch<Solicitud>(
      `/solicitudes/${id}/resolver-disputa`,
      {
        method: "PATCH",
        body: { estado },
        token: authToken(),
      }
    );
    set((state) => ({
      solicitudes: state.solicitudes.map((s) =>
        s.id === id ? actualizada : s
      ),
    }));
    return actualizada;
  },
  adjuntarFotos: async (objectId, object, files) => {
    const formData = new FormData();
    formData.append("objectId", objectId);
    formData.append("object", object);
    files.forEach((file) => formData.append("files", file));

    const { path } = await apiFetch<{ path: string[] }>(`/files`, {
      method: "POST",
      body: formData,
      token: authToken(),
    });
    return path;
  },
}));
