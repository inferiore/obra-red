import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: { getState: () => ({ token: "fake-token" }) },
}));

import { apiFetch } from "@/lib/apiClient";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const crearSolicitud = (overrides: Partial<Solicitud> = {}): Solicitud => ({
  id: "sol-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "plomeria",
  descripcion: "Reparar tubería",
  presupuesto: 150000,
  ubicacion: "Bogotá",
  fotos: [],
  estado: "disputa",
  correcciones: [],
  correccionesCount: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

describe("solicitudesStore", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    useSolicitudesStore.setState({ solicitudes: [], loading: false });
  });

  describe("fetchOne", () => {
    it("agrega la solicitud al store cuando no existe una entrada previa con ese id (navegación directa)", async () => {
      const solicitud = crearSolicitud();
      mockedApiFetch.mockResolvedValueOnce(solicitud);

      const resultado = await useSolicitudesStore.getState().fetchOne("sol-1");

      expect(mockedApiFetch).toHaveBeenCalledWith("/solicitudes/sol-1", {
        token: "fake-token",
      });
      expect(resultado).toEqual(solicitud);
      expect(
        useSolicitudesStore.getState().solicitudes.find((s) => s.id === "sol-1")
      ).toEqual(solicitud);
    });

    it("reemplaza la entrada existente cuando ya hay una solicitud con ese id en el store", async () => {
      useSolicitudesStore.setState({
        solicitudes: [crearSolicitud(), crearSolicitud({ id: "sol-2" })],
      });
      const actualizada = crearSolicitud({ estado: "ejecucion" });
      mockedApiFetch.mockResolvedValueOnce(actualizada);

      await useSolicitudesStore.getState().fetchOne("sol-1");

      const { solicitudes } = useSolicitudesStore.getState();
      expect(solicitudes).toHaveLength(2);
      expect(solicitudes.find((s) => s.id === "sol-1")).toEqual(actualizada);
      expect(solicitudes.find((s) => s.id === "sol-2")?.estado).toBe("disputa");
    });
  });

  describe("subirEvidenciaDisputa", () => {
    it("hace PATCH a /solicitudes/:id/evidencia-disputa con las fotos y refresca la solicitud en el store", async () => {
      useSolicitudesStore.setState({
        solicitudes: [crearSolicitud(), crearSolicitud({ id: "sol-2" })],
      });
      const actualizada = crearSolicitud({
        evidenciaDisputa: [
          { url: "data:foto1", autorUsername: "cliente1", createdAt: "2026-09-10T12:00:00.000Z" },
        ],
      });
      mockedApiFetch.mockResolvedValueOnce(actualizada);

      await useSolicitudesStore.getState().subirEvidenciaDisputa("sol-1", ["data:foto1"]);

      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/solicitudes/sol-1/evidencia-disputa",
        {
          method: "PATCH",
          body: { fotos: ["data:foto1"] },
          token: "fake-token",
        }
      );

      const { solicitudes } = useSolicitudesStore.getState();
      expect(solicitudes.find((s) => s.id === "sol-1")).toEqual(actualizada);
      // No debe tocar otras solicitudes del store.
      expect(solicitudes.find((s) => s.id === "sol-2")?.evidenciaDisputa).toBeUndefined();
    });

    it("propaga el error si el PATCH falla, sin modificar el store", async () => {
      useSolicitudesStore.setState({ solicitudes: [crearSolicitud()] });
      mockedApiFetch.mockRejectedValueOnce(new Error("forbidden"));

      await expect(
        useSolicitudesStore.getState().subirEvidenciaDisputa("sol-1", ["data:foto1"])
      ).rejects.toThrow("forbidden");

      expect(useSolicitudesStore.getState().solicitudes[0].evidenciaDisputa).toBeUndefined();
    });
  });

  describe("resolverDisputa", () => {
    it("hace PATCH a /solicitudes/:id/resolver-disputa con el estado elegido y refresca el store", async () => {
      useSolicitudesStore.setState({
        solicitudes: [crearSolicitud(), crearSolicitud({ id: "sol-2" })],
      });
      const actualizada = crearSolicitud({ estado: "ejecucion" });
      mockedApiFetch.mockResolvedValueOnce(actualizada);

      const resultado = await useSolicitudesStore
        .getState()
        .resolverDisputa("sol-1", "ejecucion");

      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/solicitudes/sol-1/resolver-disputa",
        {
          method: "PATCH",
          body: { estado: "ejecucion" },
          token: "fake-token",
        }
      );
      expect(resultado).toEqual(actualizada);

      const { solicitudes } = useSolicitudesStore.getState();
      expect(solicitudes.find((s) => s.id === "sol-1")).toEqual(actualizada);
      // No debe tocar otras solicitudes del store.
      expect(solicitudes.find((s) => s.id === "sol-2")?.estado).toBe("disputa");
    });

    it("propaga el error si el PATCH falla, sin modificar el store", async () => {
      useSolicitudesStore.setState({ solicitudes: [crearSolicitud()] });
      mockedApiFetch.mockRejectedValueOnce(new Error("solo se puede resolver desde disputa"));

      await expect(
        useSolicitudesStore.getState().resolverDisputa("sol-1", "finalizado")
      ).rejects.toThrow("solo se puede resolver desde disputa");

      expect(useSolicitudesStore.getState().solicitudes[0].estado).toBe("disputa");
    });
  });

  describe("adjuntarFotos", () => {
    it("hace POST a /files con un FormData y devuelve las rutas subidas (no un void descartado)", async () => {
      mockedApiFetch.mockResolvedValueOnce({
        path: ["/uploads/a.jpg", "/uploads/b.jpg"],
      });
      const file = new File(["contenido"], "a.jpg", { type: "image/jpeg" });

      const resultado = await useSolicitudesStore
        .getState()
        .adjuntarFotos("sol-1", "solicitud", [file]);

      expect(resultado).toEqual(["/uploads/a.jpg", "/uploads/b.jpg"]);
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/files",
        expect.objectContaining({
          method: "POST",
          body: expect.any(FormData),
          token: "fake-token",
        })
      );
      const body = mockedApiFetch.mock.calls[0][1]?.body as FormData;
      expect(body.get("objectId")).toBe("sol-1");
      expect(body.get("object")).toBe("solicitud");
      expect(body.getAll("files")).toHaveLength(1);
    });
  });
});
