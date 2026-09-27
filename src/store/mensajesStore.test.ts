import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: { getState: () => ({ token: "fake-token" }) },
}));

import { apiFetch } from "@/lib/apiClient";
import { useMensajesStore, type Mensaje, type Conversacion } from "@/store/mensajesStore";

const mockedApiFetch = vi.mocked(apiFetch);

const crearMensaje = (overrides: Partial<Mensaje> = {}): Mensaje => ({
  id: "msg-1",
  solicitudId: "sol-1",
  autorUsername: "trabajador",
  contenido: "Hola, ya voy en camino",
  leidoPorDestinatario: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

const crearConversacion = (overrides: Partial<Conversacion> = {}): Conversacion => ({
  solicitudId: "sol-1",
  contraparteNombre: "Juan Pérez",
  ultimoMensaje: "Hola, ya voy en camino",
  ultimaFecha: "2026-09-01T00:00:00.000Z",
  noLeidos: 1,
  ...overrides,
});

describe("mensajesStore", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    useMensajesStore.setState({ bySolicitud: {}, conversaciones: [] });
  });

  describe("fetchConversaciones", () => {
    it("carga la lista de conversaciones", async () => {
      const conversaciones = [crearConversacion()];
      mockedApiFetch.mockResolvedValueOnce(conversaciones);

      await useMensajesStore.getState().fetchConversaciones();

      expect(mockedApiFetch).toHaveBeenCalledWith("/mensajes/conversaciones", {
        token: "fake-token",
      });
      expect(useMensajesStore.getState().conversaciones).toEqual(conversaciones);
    });
  });

  describe("fetchBySolicitud", () => {
    it("carga los mensajes de una solicitud y refresca conversaciones", async () => {
      const mensajes = [crearMensaje({ id: "m1" }), crearMensaje({ id: "m2" })];
      const conversaciones = [crearConversacion({ noLeidos: 0 })];
      mockedApiFetch.mockResolvedValueOnce(mensajes);
      mockedApiFetch.mockResolvedValueOnce(conversaciones);

      await useMensajesStore.getState().fetchBySolicitud("sol-1");

      expect(mockedApiFetch).toHaveBeenNthCalledWith(1, "/solicitudes/sol-1/mensajes", {
        token: "fake-token",
      });
      expect(mockedApiFetch).toHaveBeenNthCalledWith(2, "/mensajes/conversaciones", {
        token: "fake-token",
      });
      expect(useMensajesStore.getState().bySolicitud["sol-1"]).toEqual(mensajes);
      expect(useMensajesStore.getState().conversaciones).toEqual(conversaciones);
    });

    it("no mezcla mensajes de distintas solicitudes en el mapa bySolicitud", async () => {
      useMensajesStore.setState({
        bySolicitud: { "sol-otro": [crearMensaje({ id: "otro", solicitudId: "sol-otro" })] },
      });
      mockedApiFetch.mockResolvedValueOnce([crearMensaje({ id: "m1" })]);
      mockedApiFetch.mockResolvedValueOnce([]);

      await useMensajesStore.getState().fetchBySolicitud("sol-1");

      const { bySolicitud } = useMensajesStore.getState();
      expect(bySolicitud["sol-otro"]).toHaveLength(1);
      expect(bySolicitud["sol-1"]).toHaveLength(1);
    });
  });

  describe("enviar", () => {
    it("hace POST del contenido y refetch de mensajes y conversaciones", async () => {
      mockedApiFetch.mockResolvedValueOnce(undefined); // POST
      mockedApiFetch.mockResolvedValueOnce([crearMensaje()]); // fetchBySolicitud
      mockedApiFetch.mockResolvedValueOnce([crearConversacion({ noLeidos: 0 })]); // fetchConversaciones

      await useMensajesStore.getState().enviar("sol-1", "Hola");

      expect(mockedApiFetch).toHaveBeenNthCalledWith(1, "/solicitudes/sol-1/mensajes", {
        method: "POST",
        body: { contenido: "Hola" },
        token: "fake-token",
      });
      expect(mockedApiFetch).toHaveBeenNthCalledWith(2, "/solicitudes/sol-1/mensajes", {
        token: "fake-token",
      });
      expect(mockedApiFetch).toHaveBeenNthCalledWith(3, "/mensajes/conversaciones", {
        token: "fake-token",
      });
      expect(useMensajesStore.getState().bySolicitud["sol-1"]).toHaveLength(1);
      expect(useMensajesStore.getState().conversaciones[0].noLeidos).toBe(0);
    });
  });
});
