import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/components/OfertasDialog", () => ({
  OfertasDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="dialog-ofertas" /> : null,
}));
vi.mock("@/components/SolicitudDetailDialog", () => ({
  SolicitudDetailDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="dialog-detalle" /> : null,
}));
vi.mock("@/components/ProgresoTrabajoDialog", () => ({
  ProgresoTrabajoDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="dialog-progreso" /> : null,
}));
vi.mock("@/components/ChatSolicitudDialog", () => ({
  ChatSolicitudDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="dialog-chat" /> : null,
}));

import { apiFetch } from "@/lib/apiClient";
import { NotificacionesMenu } from "@/components/NotificacionesMenu";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useNotificacionesStore, type Notificacion } from "@/store/notificacionesStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const solicitud: Solicitud = {
  id: "sol-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "plomeria",
  descripcion: "Reparar tubería con fuga",
  presupuesto: 200000,
  ubicacion: "Bogotá",
  fotos: [],
  estado: "publicado",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const crearNotificacion = (overrides: Partial<Notificacion> = {}): Notificacion => ({
  id: "notif-1",
  tipo: "nueva_oferta",
  mensaje: "Recibiste una nueva oferta",
  solicitudId: "sol-1",
  object: "oferta",
  objectId: "oferta-1",
  leido: false,
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

const setup = (items: Notificacion[]) => {
  useNotificacionesStore.setState({
    items,
    noLeidas: items.filter((n) => !n.leido).length,
  });
};

const abrirMenu = () => {
  const trigger = screen.getByRole("button");
  fireEvent.keyDown(trigger, { key: "Enter" });
};

const clickNotificacion = (mensaje: string) => {
  abrirMenu();
  fireEvent.click(screen.getByText(mensaje));
};

describe("NotificacionesMenu", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetch.mockResolvedValue([]);
    toastMock.mockReset();
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [], loading: false });
    useNotificacionesStore.setState({ items: [], noLeidas: 0 });
  });

  it("cache hit: abre el diálogo correcto sin llamar a fetchOne", async () => {
    useSolicitudesStore.setState({ solicitudes: [solicitud] });
    setup([crearNotificacion({ tipo: "nueva_oferta" })]);

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(screen.getByTestId("dialog-ofertas")).toBeInTheDocument();
    });
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      "/solicitudes/sol-1",
      expect.anything()
    );
  });

  it("cache miss: llama a fetchOne y abre el diálogo solo después de que resuelve", async () => {
    setup([crearNotificacion({ tipo: "oferta_aceptada" })]);
    mockedApiFetch.mockImplementation((path: string) => {
      if (path === "/solicitudes/sol-1") return Promise.resolve(solicitud);
      return Promise.resolve([]);
    });

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    expect(screen.queryByTestId("dialog-detalle")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("dialog-detalle")).toBeInTheDocument();
    });
    expect(mockedApiFetch).toHaveBeenCalledWith("/solicitudes/sol-1", {
      token: "fake-token",
    });
  });

  it("rama por rol: cliente abre ProgresoTrabajoDialog en una notificación de disputa", async () => {
    useSolicitudesStore.setState({ solicitudes: [solicitud] });
    setup([crearNotificacion({ tipo: "solicitud_en_disputa" })]);

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(screen.getByTestId("dialog-progreso")).toBeInTheDocument();
    });
  });

  it("rama por rol: trabajador abre SolicitudDetailDialog en la misma notificación de disputa", async () => {
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [solicitud] });
    setup([crearNotificacion({ tipo: "solicitud_en_disputa" })]);

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(screen.getByTestId("dialog-detalle")).toBeInTheDocument();
    });
  });

  it("nuevo_mensaje abre el chat solo con el id, sin fetch de la solicitud completa", async () => {
    setup([crearNotificacion({ tipo: "nuevo_mensaje" })]);

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(screen.getByTestId("dialog-chat")).toBeInTheDocument();
    });
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      "/solicitudes/sol-1",
      expect.anything()
    );
  });

  it("solicitudId nulo: marca como leído pero no abre ningún diálogo", async () => {
    setup([crearNotificacion({ solicitudId: null })]);

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/notificaciones/notif-1/leer", {
        method: "PATCH",
        token: "fake-token",
      });
    });
    expect(screen.queryByTestId("dialog-ofertas")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog-detalle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog-progreso")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog-chat")).not.toBeInTheDocument();
  });

  it("fetchOne rechazada: no abre diálogo y muestra un toast de error", async () => {
    setup([crearNotificacion({ tipo: "oferta_aceptada" })]);
    mockedApiFetch.mockImplementation((path: string) => {
      if (path === "/solicitudes/sol-1") return Promise.reject(new Error("404"));
      return Promise.resolve([]);
    });

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "No se pudo cargar la solicitud" })
      );
    });
    expect(screen.queryByTestId("dialog-detalle")).not.toBeInTheDocument();
  });

  it("item ya leído: el click no vuelve a llamar a marcarLeida pero sí abre su diálogo", async () => {
    useSolicitudesStore.setState({ solicitudes: [solicitud] });
    setup([crearNotificacion({ tipo: "nueva_oferta", leido: true })]);

    render(<NotificacionesMenu />);
    clickNotificacion("Recibiste una nueva oferta");

    await waitFor(() => {
      expect(screen.getByTestId("dialog-ofertas")).toBeInTheDocument();
    });
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      "/notificaciones/notif-1/leer",
      expect.anything()
    );
  });
});
