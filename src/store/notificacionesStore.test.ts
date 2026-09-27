import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: { getState: () => ({ token: "fake-token" }) },
}));

import { apiFetch } from "@/lib/apiClient";
import { useNotificacionesStore, type Notificacion } from "@/store/notificacionesStore";

const mockedApiFetch = vi.mocked(apiFetch);

const crearNotificacion = (
  overrides: Partial<Notificacion> = {}
): Notificacion => ({
  id: "notif-1",
  tipo: "nueva_oferta",
  mensaje: "Recibiste una nueva oferta en tu solicitud",
  solicitudId: "sol-1",
  object: "oferta",
  objectId: "oferta-1",
  leido: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

describe("notificacionesStore", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    useNotificacionesStore.setState({ items: [], noLeidas: 0 });
  });

  describe("fetchAll", () => {
    it("carga las notificaciones y deriva noLeidas de las no leídas", async () => {
      const notificaciones = [
        crearNotificacion({ id: "n1", leido: false }),
        crearNotificacion({ id: "n2", leido: true }),
        crearNotificacion({ id: "n3", leido: false }),
      ];
      mockedApiFetch.mockResolvedValueOnce(notificaciones);

      await useNotificacionesStore.getState().fetchAll();

      expect(mockedApiFetch).toHaveBeenCalledWith("/notificaciones", {
        token: "fake-token",
      });
      expect(useNotificacionesStore.getState().items).toEqual(notificaciones);
      expect(useNotificacionesStore.getState().noLeidas).toBe(2);
    });

    it("deriva noLeidas en 0 cuando todas están leídas", async () => {
      mockedApiFetch.mockResolvedValueOnce([
        crearNotificacion({ id: "n1", leido: true }),
      ]);

      await useNotificacionesStore.getState().fetchAll();

      expect(useNotificacionesStore.getState().noLeidas).toBe(0);
    });
  });

  describe("marcarLeida", () => {
    it("marca solo la notificación indicada como leída y recalcula noLeidas sin refetch", async () => {
      useNotificacionesStore.setState({
        items: [
          crearNotificacion({ id: "n1", leido: false }),
          crearNotificacion({ id: "n2", leido: false }),
        ],
        noLeidas: 2,
      });
      mockedApiFetch.mockResolvedValueOnce(undefined);

      await useNotificacionesStore.getState().marcarLeida("n1");

      expect(mockedApiFetch).toHaveBeenCalledTimes(1);
      expect(mockedApiFetch).toHaveBeenCalledWith("/notificaciones/n1/leer", {
        method: "PATCH",
        token: "fake-token",
      });

      const { items, noLeidas } = useNotificacionesStore.getState();
      expect(items.find((n) => n.id === "n1")?.leido).toBe(true);
      expect(items.find((n) => n.id === "n2")?.leido).toBe(false);
      expect(noLeidas).toBe(1);
    });
  });
});
