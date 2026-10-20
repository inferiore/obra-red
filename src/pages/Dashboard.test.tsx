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

const solicitudPublicadaSinAsignar: Solicitud = {
  id: "sol-publicada-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "electricidad",
  descripcion: "Cambiar breakers del tablero",
  presupuesto: 150000,
  ubicacion: "Medellín",
  fotos: [],
  estado: "publicado",
  ofertas: [],
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("Dashboard - eliminar solicitud publicada (cliente dueño)", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();

    useAuthStore.setState({
      user: {
        username: "cliente1",
        name: "Cliente Uno",
        role: "cliente",
      },
      token: "fake-token",
    });
    useNotificacionesStore.setState({ items: [], noLeidas: 0 });
  });

  it("muestra el botón de eliminar y borra la solicitud al confirmar", async () => {
    mockedApiFetch.mockImplementation(async (path: string, options?: { method?: string }) => {
      if (options?.method === "DELETE") return {};
      if (path === "/solicitudes") return [solicitudPublicadaSinAsignar];
      if (path === "/notificaciones") return [];
      if (path === "/mensajes/conversaciones") return [];
      return {};
    });
    useSolicitudesStore.setState({
      solicitudes: [solicitudPublicadaSinAsignar],
      loading: false,
    });

    renderDashboard();

    const botonEliminar = await screen.findByRole("button", {
      name: /eliminar solicitud/i,
    });
    fireEvent.click(botonEliminar);

    const botonConfirmar = await screen.findByRole("button", {
      name: /sí, eliminar/i,
    });
    fireEvent.click(botonConfirmar);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        `/solicitudes/${solicitudPublicadaSinAsignar.id}`,
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("no muestra el botón de eliminar cuando ya hay un trabajador asignado", async () => {
    const solicitudAsignada: Solicitud = {
      ...solicitudPublicadaSinAsignar,
      id: "sol-asignada-1",
      estado: "ejecucion",
      trabajadorAsignado: "trabajador1",
    };
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/solicitudes") return [solicitudAsignada];
      if (path === "/notificaciones") return [];
      if (path === "/mensajes/conversaciones") return [];
      return {};
    });
    useSolicitudesStore.setState({ solicitudes: [solicitudAsignada], loading: false });

    renderDashboard();

    await screen.findAllByText(solicitudAsignada.descripcion);
    expect(
      screen.queryByRole("button", { name: /eliminar solicitud/i })
    ).not.toBeInTheDocument();
  });

  it("no muestra el botón de eliminar cuando existe una oferta aceptada", async () => {
    const solicitudConOfertaAceptada: Solicitud = {
      ...solicitudPublicadaSinAsignar,
      id: "sol-oferta-aceptada-1",
      ofertas: [
        {
          id: "oferta-1",
          solicitudId: "sol-oferta-aceptada-1",
          trabajadorUsername: "trabajador1",
          nombre: "Trabajador Uno",
          fotoUrl: "",
          calificacion: 5,
          trabajosCompletados: 3,
          verificado: true,
          precio: 150000,
          tiempoEstimadoDias: 3,
          fechaInicio: "2026-10-01",
          mensaje: "Puedo hacerlo",
          estado: "aceptada",
          createdAt: "2026-09-02T00:00:00.000Z",
          expirada: false,
        },
      ],
    };
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/solicitudes") return [solicitudConOfertaAceptada];
      if (path === "/notificaciones") return [];
      if (path === "/mensajes/conversaciones") return [];
      return {};
    });
    useSolicitudesStore.setState({
      solicitudes: [solicitudConOfertaAceptada],
      loading: false,
    });

    renderDashboard();

    await screen.findAllByText(solicitudConOfertaAceptada.descripcion);
    expect(
      screen.queryByRole("button", { name: /eliminar solicitud/i })
    ).not.toBeInTheDocument();
  });
});
