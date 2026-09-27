import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
import Dashboard from "@/pages/Dashboard";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useNotificacionesStore } from "@/store/notificacionesStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const solicitudEnDisputa: Solicitud = {
  id: "sol-disputa-1",
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

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe("Dashboard - acción de disputa para trabajador", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/solicitudes") return [solicitudEnDisputa];
      if (path.startsWith("/solicitudes/")) return solicitudEnDisputa;
      if (path === "/notificaciones") return [];
      if (path === "/mensajes/conversaciones") return [];
      return {};
    });

    useAuthStore.setState({
      user: {
        username: "trabajador1",
        name: "Trabajador Uno",
        role: "trabajador",
      },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [solicitudEnDisputa], loading: false });
    useNotificacionesStore.setState({ items: [], noLeidas: 0 });
  });

  it("muestra un botón para que el trabajador suba evidencia cuando la solicitud está en disputa", async () => {
    renderDashboard();

    const boton = await screen.findByRole("button", {
      name: /subir evidencia de disputa/i,
    });
    expect(boton).toBeInTheDocument();
  });

  it("abre el diálogo de evidencias (con la pestaña de disputa) al hacer clic en el botón", async () => {
    renderDashboard();

    const boton = await screen.findByRole("button", {
      name: /subir evidencia de disputa/i,
    });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByText("Evidencia de disputa")).toBeInTheDocument();
    });
  });
});
