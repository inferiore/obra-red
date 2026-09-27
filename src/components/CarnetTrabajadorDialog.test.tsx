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

const saveMock = vi.fn();
vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: saveMock,
  })),
}));
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    width: 400,
    height: 600,
    toDataURL: () => "data:image/png;base64,fake",
  }),
}));

import { apiFetch } from "@/lib/apiClient";
import { CarnetTrabajadorDialog } from "@/components/CarnetTrabajadorDialog";
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

const perfil = {
  username: "trabajador1",
  name: "Trabajador Uno",
  fotoUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Trabajador",
  calificacion: 4.7,
  verificado: true,
};

describe("CarnetTrabajadorDialog", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    saveMock.mockReset();
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
  });

  it("no hace fetch ni renderiza contenido cuando está cerrado", () => {
    render(
      <CarnetTrabajadorDialog
        solicitud={solicitud}
        trabajadorUsername="trabajador1"
        open={false}
        onOpenChange={() => {}}
      />,
    );
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("no hace fetch si no hay trabajadorUsername, aunque esté abierto", () => {
    render(
      <CarnetTrabajadorDialog
        solicitud={solicitud}
        trabajadorUsername={null}
        open
        onOpenChange={() => {}}
      />,
    );
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it("carga el perfil público del trabajador y muestra los datos del carnet", async () => {
    mockedApiFetch.mockResolvedValue(perfil);

    render(
      <CarnetTrabajadorDialog
        solicitud={solicitud}
        trabajadorUsername="trabajador1"
        open
        onOpenChange={() => {}}
      />,
    );

    expect(mockedApiFetch).toHaveBeenCalledWith("/users/trabajador1", { token: "fake-token" });

    await waitFor(() => {
      expect(screen.getByText("Trabajador Uno")).toBeInTheDocument();
    });
    expect(screen.getByText("Plomería")).toBeInTheDocument();
    expect(screen.getByText("Reparar tubería con fuga")).toBeInTheDocument();
    expect(screen.getByText("Cliente Uno")).toBeInTheDocument();
    expect(screen.getByText("Bogotá")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument();
  });

  it("muestra un mensaje de error si la carga del perfil falla", async () => {
    mockedApiFetch.mockRejectedValue(new Error("Error de conexión con el servidor"));

    render(
      <CarnetTrabajadorDialog
        solicitud={solicitud}
        trabajadorUsername="trabajador1"
        open
        onOpenChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Error de conexión con el servidor")).toBeInTheDocument();
    });
  });

  it("descarga un PDF del carnet al hacer clic en el botón", async () => {
    mockedApiFetch.mockResolvedValue(perfil);

    render(
      <CarnetTrabajadorDialog
        solicitud={solicitud}
        trabajadorUsername="trabajador1"
        open
        onOpenChange={() => {}}
      />,
    );

    const boton = await screen.findByRole("button", { name: /descargar pdf/i });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith("carnet-sol-1.pdf");
    });
  });
});
