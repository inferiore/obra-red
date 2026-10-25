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

import { apiFetch } from "@/lib/apiClient";
import { ProgresoTrabajoDialog } from "@/components/ProgresoTrabajoDialog";
import { useAuthStore } from "@/store/authStore";
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
  estado: "ejecucion",
  trabajadorAsignado: "trabajador1",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const perfilTrabajador = {
  username: "trabajador1",
  name: "Trabajador Uno",
  fotoUrl: "",
  calificacion: 4.7,
  verificado: true,
};

const mockApiFetchFor = (codigoRespuesta: { codigo: string; documentoFallback?: string }) => {
  mockedApiFetch.mockImplementation(async (path: string) => {
    if (path.includes("/codigo-verificacion")) return codigoRespuesta;
    if (path.startsWith("/users/")) return perfilTrabajador;
    return {};
  });
};

describe("ProgresoTrabajoDialog - código de verificación", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("muestra el código al cliente", async () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    mockApiFetchFor({ codigo: "4821", documentoFallback: "789" });

    render(
      <ProgresoTrabajoDialog solicitud={solicitud} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("4821")).toBeInTheDocument();
    });
  });

  it("muestra el código al trabajador asignado", async () => {
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });
    mockApiFetchFor({ codigo: "4821", documentoFallback: "789" });

    render(
      <ProgresoTrabajoDialog solicitud={solicitud} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("4821")).toBeInTheDocument();
    });
  });

  it("solo muestra el botón de verificación alterna al cliente, nunca al trabajador", async () => {
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });
    mockApiFetchFor({ codigo: "4821", documentoFallback: "789" });

    render(
      <ProgresoTrabajoDialog solicitud={solicitud} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(screen.getByText("4821")).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /no puede mostrar el código/i }),
    ).not.toBeInTheDocument();
  });

  it("al cliente, expandir el botón de verificación alterna muestra nombre y últimos 3 dígitos del documento", async () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    mockApiFetchFor({ codigo: "4821", documentoFallback: "789" });

    render(
      <ProgresoTrabajoDialog solicitud={solicitud} open onOpenChange={() => {}} />,
    );

    const boton = await screen.findByRole("button", { name: /no puede mostrar el código/i });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByText(/Trabajador Uno/)).toBeInTheDocument();
      expect(screen.getByText(/789/)).toBeInTheDocument();
    });
  });

  it("al cliente, si el trabajador no tiene documento registrado, muestra un mensaje neutro en vez del botón", async () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    mockApiFetchFor({ codigo: "4821" });

    render(
      <ProgresoTrabajoDialog solicitud={solicitud} open onOpenChange={() => {}} />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("No hay verificación alterna disponible para este trabajador."),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /no puede mostrar el código/i }),
    ).not.toBeInTheDocument();
  });

  it("no muestra la sección de código si la solicitud no está en ejecución/corrigiendo", () => {
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });

    render(
      <ProgresoTrabajoDialog
        solicitud={{ ...solicitud, estado: "revision" }}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.queryByText("Código de verificación")).not.toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
