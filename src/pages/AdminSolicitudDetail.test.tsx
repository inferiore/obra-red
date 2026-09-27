import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

import { apiFetch } from "@/lib/apiClient";
import AdminSolicitudDetail from "@/pages/AdminSolicitudDetail";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useOfertasStore } from "@/store/ofertasStore";
import { useMensajesStore } from "@/store/mensajesStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const solicitudEnDisputa: Solicitud = {
  id: "sol-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "plomeria",
  descripcion: "Reparar tubería con fuga",
  presupuesto: 200000,
  ubicacion: "Bogotá",
  fotos: [],
  estado: "disputa",
  trabajadorAsignado: "trabajador1",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const renderDetalle = () =>
  render(
    <MemoryRouter initialEntries={["/admin/solicitudes/sol-1"]}>
      <Routes>
        <Route path="/admin/solicitudes/:id" element={<AdminSolicitudDetail />} />
      </Routes>
    </MemoryRouter>
  );

describe("AdminSolicitudDetail", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetch.mockImplementation(async (path: string, options?: { method?: string }) => {
      if (options?.method === "PATCH" && path === "/solicitudes/sol-1/resolver-disputa") {
        return { ...solicitudEnDisputa, estado: "ejecucion" };
      }
      if (path === "/solicitudes/sol-1") return solicitudEnDisputa;
      if (path.startsWith("/ofertas")) return [];
      if (path === "/solicitudes/sol-1/mensajes") return [];
      if (path === "/mensajes/conversaciones") return [];
      return {};
    });

    useAuthStore.setState({
      user: { username: "admin1", name: "Admin Uno", role: "admin" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [solicitudEnDisputa], loading: false });
    useOfertasStore.setState({ bySolicitud: {} });
    useMensajesStore.setState({ bySolicitud: {}, conversaciones: [] });
  });

  it("muestra las acciones de resolver disputa cuando la solicitud está en disputa", async () => {
    renderDetalle();

    expect(await screen.findByRole("button", { name: /reanudar trabajo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dar por finalizado/i })).toBeInTheDocument();
  });

  it("llama a resolverDisputa con 'ejecucion' al hacer clic en 'Reanudar trabajo'", async () => {
    renderDetalle();

    const boton = await screen.findByRole("button", { name: /reanudar trabajo/i });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/solicitudes/sol-1/resolver-disputa",
        expect.objectContaining({
          method: "PATCH",
          body: { estado: "ejecucion" },
        })
      );
    });
  });

  it("no muestra las acciones de resolver disputa fuera del estado disputa", async () => {
    const enEjecucion = { ...solicitudEnDisputa, estado: "ejecucion" as const };
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/solicitudes/sol-1") return enEjecucion;
      if (path.startsWith("/ofertas")) return [];
      if (path === "/solicitudes/sol-1/mensajes") return [];
      if (path === "/mensajes/conversaciones") return [];
      return {};
    });
    useSolicitudesStore.setState({ solicitudes: [enEjecucion], loading: false });

    renderDetalle();

    await screen.findByText("Reparar tubería con fuga");
    expect(screen.queryByRole("button", { name: /reanudar trabajo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dar por finalizado/i })).not.toBeInTheDocument();
  });
});
