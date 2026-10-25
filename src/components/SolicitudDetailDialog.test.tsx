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
  BASE_URL: "http://localhost:3001",
  resolveFileUrl: (path: string) => {
    if (!path) return path;
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
      return path;
    }
    return `http://localhost:3001${path}`;
  },
}));

import { apiFetch } from "@/lib/apiClient";
import { SolicitudDetailDialog } from "@/components/SolicitudDetailDialog";
import { useAuthStore } from "@/store/authStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const solicitudBase: Solicitud = {
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

describe("SolicitudDetailDialog", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });
  });

  it("antepone la URL base de la API a las fotos servidas desde disco (/uploads/...)", () => {
    render(
      <SolicitudDetailDialog
        solicitud={{ ...solicitudBase, fotos: ["/uploads/foto1.jpg", "/uploads/foto2.jpg"] }}
        open
        onOpenChange={() => {}}
      />,
    );

    const imagenes = screen.getAllByAltText(/foto-/) as HTMLImageElement[];
    expect(imagenes).toHaveLength(2);
    expect(imagenes[0].src).toBe("http://localhost:3001/uploads/foto1.jpg");
    expect(imagenes[1].src).toBe("http://localhost:3001/uploads/foto2.jpg");
  });

  it("no muestra la sección de fotos cuando la solicitud no tiene ninguna", () => {
    render(
      <SolicitudDetailDialog
        solicitud={{ ...solicitudBase, fotos: [] }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.queryByText("Fotos")).not.toBeInTheDocument();
  });

  it("muestra el texto de resolución cuando la solicitud tiene resolucionDisputa", () => {
    render(
      <SolicitudDetailDialog
        solicitud={{ ...solicitudBase, estado: "finalizado", resolucionDisputa: "trabajador" }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(
      screen.getByText("Disputa resuelta: pago liberado al trabajador"),
    ).toBeInTheDocument();
  });

  it("no muestra el texto de resolución cuando resolucionDisputa no viene", () => {
    render(
      <SolicitudDetailDialog solicitud={solicitudBase} open onOpenChange={() => {}} />,
    );

    expect(
      screen.queryByText(/disputa resuelta/i),
    ).not.toBeInTheDocument();
  });

  it("no revienta cuando `fotos` viene undefined, como la trae GET /solicitudes (listado) al abrir una card", () => {
    // SolicitudesService.findAll excluye la columna `fotos` del `select` por
    // peso (ver server/src/solicitudes/solicitudes.service.ts), así que el
    // objeto que Dashboard pasa a este dialog al hacer click en una card no
    // trae ese campo en absoluto.
    const { fotos, ...sinFotos } = solicitudBase;

    expect(() =>
      render(
        <SolicitudDetailDialog
          solicitud={sinFotos as typeof solicitudBase}
          open
          onOpenChange={() => {}}
        />,
      ),
    ).not.toThrow();

    expect(screen.queryByText("Fotos")).not.toBeInTheDocument();
  });
});

describe("SolicitudDetailDialog - eliminar solicitud", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetch.mockImplementation(async () => ({}));
  });

  it("muestra el botón de eliminar cuando el usuario logueado es el cliente dueño", () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });

    render(
      <SolicitudDetailDialog solicitud={solicitudBase} open onOpenChange={() => {}} />,
    );

    expect(
      screen.getByRole("button", { name: /eliminar solicitud/i }),
    ).toBeInTheDocument();
  });

  it("no muestra el botón de eliminar cuando el usuario logueado no es el cliente dueño", () => {
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });

    render(
      <SolicitudDetailDialog solicitud={solicitudBase} open onOpenChange={() => {}} />,
    );

    expect(
      screen.queryByRole("button", { name: /eliminar solicitud/i }),
    ).not.toBeInTheDocument();
  });

  it("no muestra el botón de eliminar cuando ya hay un trabajador asignado", () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });

    render(
      <SolicitudDetailDialog
        solicitud={{ ...solicitudBase, estado: "ejecucion", trabajadorAsignado: "trabajador1" }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /eliminar solicitud/i }),
    ).not.toBeInTheDocument();
  });

  it("no muestra el botón de eliminar cuando existe una oferta aceptada", () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });

    render(
      <SolicitudDetailDialog
        solicitud={{
          ...solicitudBase,
          ofertas: [
            {
              id: "oferta-1",
              solicitudId: solicitudBase.id,
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
            },
          ],
        }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /eliminar solicitud/i }),
    ).not.toBeInTheDocument();
  });

  it("al confirmar, llama al DELETE del store, muestra el toast y cierra el diálogo", async () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    const onOpenChange = vi.fn();

    render(
      <SolicitudDetailDialog solicitud={solicitudBase} open onOpenChange={onOpenChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /eliminar solicitud/i }));

    const botonConfirmar = await screen.findByRole("button", { name: /sí, eliminar/i });
    fireEvent.click(botonConfirmar);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        `/solicitudes/${solicitudBase.id}`,
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
