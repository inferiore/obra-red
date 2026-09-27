import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

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

import { SolicitudDetailDialog } from "@/components/SolicitudDetailDialog";
import { useAuthStore } from "@/store/authStore";
import type { Solicitud } from "@/types/solicitud";

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
});
