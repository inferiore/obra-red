import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

// Los primitivos de shadcn/Radix para Select no son fáciles de manejar en
// jsdom (requieren pointer capture / scrollIntoView); se reemplazan por un
// <select> nativo equivalente solo para este test, igual que en
// SolicitudForm.test.tsx.
vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
  }: {
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <select
      aria-label="Tipo de trabajo"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="todas">Todos los tipos</option>
      <option value="plomeria">Plomería</option>
      <option value="electricidad">Electricidad</option>
      <option value="carpinteria">Carpintería</option>
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

import { apiFetch } from "@/lib/apiClient";
import AdminSolicitudes from "@/pages/AdminSolicitudes";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import type { Solicitud } from "@/types/solicitud";
import type { Oferta } from "@/lib/ofertas";

const mockedApiFetch = vi.mocked(apiFetch);

const ofertaAceptada = (overrides: Partial<Oferta>): Oferta => ({
  id: "of-1",
  solicitudId: "sol-x",
  trabajadorUsername: "trabajadorX",
  nombre: "Trabajador X",
  fotoUrl: "",
  calificacion: 4.5,
  trabajosCompletados: 10,
  verificado: true,
  precio: 150000,
  tiempoEstimadoDias: 3,
  fechaInicio: null,
  mensaje: "",
  estado: "aceptada",
  createdAt: "2026-09-01T00:00:00.000Z",
  ...overrides,
});

const solPublicadaSinTrabajador: Solicitud = {
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
  ofertas: [],
};

const solEnEjecucion: Solicitud = {
  id: "sol-2",
  clienteUsername: "cliente2",
  clienteNombre: "Cliente Dos",
  tipo: "electricidad",
  descripcion: "Instalar breaker nuevo",
  presupuesto: 100000,
  ubicacion: "Medellín",
  fotos: [],
  estado: "ejecucion",
  trabajadorAsignado: "trabajador1",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-02T00:00:00.000Z",
  ofertas: [
    ofertaAceptada({
      id: "of-2",
      solicitudId: "sol-2",
      trabajadorUsername: "trabajador1",
      nombre: "Juan Pérez",
    }),
  ],
};

const solEnDisputa: Solicitud = {
  id: "sol-3",
  clienteUsername: "cliente3",
  clienteNombre: "Cliente Tres",
  tipo: "plomeria",
  descripcion: "Arreglar corto circuito",
  presupuesto: 300000,
  ubicacion: "Cali",
  fotos: [],
  estado: "disputa",
  trabajadorAsignado: "trabajador2",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-03T00:00:00.000Z",
  ofertas: [
    ofertaAceptada({
      id: "of-3",
      solicitudId: "sol-3",
      trabajadorUsername: "trabajador2",
      nombre: "Pedro Gómez",
    }),
  ],
};

const solFinalizadaSinTrabajador: Solicitud = {
  id: "sol-4",
  clienteUsername: "cliente4",
  clienteNombre: "Cliente Cuatro",
  tipo: "carpinteria",
  descripcion: "Construir closet de madera",
  presupuesto: 400000,
  ubicacion: "Barranquilla",
  fotos: [],
  estado: "finalizado",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-04T00:00:00.000Z",
  ofertas: [],
};

const todasLasSolicitudes = [
  solPublicadaSinTrabajador,
  solEnEjecucion,
  solEnDisputa,
  solFinalizadaSinTrabajador,
];

const renderPagina = () =>
  render(
    <MemoryRouter>
      <AdminSolicitudes />
    </MemoryRouter>
  );

describe("AdminSolicitudes - filtros de trazabilidad", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/solicitudes") return todasLasSolicitudes;
      return {};
    });

    useAuthStore.setState({
      user: { username: "admin1", name: "Admin Uno", role: "admin" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: todasLasSolicitudes, loading: false });
  });

  it("muestra todas las solicitudes sin filtros aplicados", async () => {
    renderPagina();

    expect(await screen.findByText(/Reparar tubería con fuga/)).toBeInTheDocument();
    expect(screen.getByText(/Instalar breaker nuevo/)).toBeInTheDocument();
    expect(screen.getByText(/Arreglar corto circuito/)).toBeInTheDocument();
    expect(screen.getByText(/Construir closet de madera/)).toBeInTheDocument();
  });

  it("filtra por estado al hacer clic en un tab", async () => {
    renderPagina();
    await screen.findByText(/Reparar tubería con fuga/);

    // Radix Tabs activa el valor en `mousedown`, no en `click` (ver
    // @radix-ui/react-tabs TabsTrigger).
    fireEvent.mouseDown(screen.getByRole("tab", { name: "En ejecución" }));

    expect(screen.getByText(/Instalar breaker nuevo/)).toBeInTheDocument();
    expect(screen.queryByText(/Reparar tubería con fuga/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Arreglar corto circuito/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Construir closet de madera/)).not.toBeInTheDocument();
  });

  it("filtra por tipo de trabajo usando el select", async () => {
    renderPagina();
    await screen.findByText(/Reparar tubería con fuga/);

    fireEvent.change(screen.getByLabelText("Tipo de trabajo"), {
      target: { value: "plomeria" },
    });

    expect(screen.getByText(/Reparar tubería con fuga/)).toBeInTheDocument();
    expect(screen.getByText(/Arreglar corto circuito/)).toBeInTheDocument();
    expect(screen.queryByText(/Instalar breaker nuevo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Construir closet de madera/)).not.toBeInTheDocument();
  });

  it("filtra por nombre o username del cliente", async () => {
    renderPagina();
    await screen.findByText(/Reparar tubería con fuga/);

    const inputCliente = screen.getByPlaceholderText(/buscar por cliente/i);
    fireEvent.change(inputCliente, { target: { value: "Cliente Uno" } });
    expect(screen.getByText(/Reparar tubería con fuga/)).toBeInTheDocument();
    expect(screen.queryByText(/Instalar breaker nuevo/)).not.toBeInTheDocument();

    fireEvent.change(inputCliente, { target: { value: "cliente3" } });
    expect(screen.getByText(/Arreglar corto circuito/)).toBeInTheDocument();
    expect(screen.queryByText(/Reparar tubería con fuga/)).not.toBeInTheDocument();
  });

  it("filtra por trabajador resolviendo el nombre desde las ofertas, no solo el username literal", async () => {
    renderPagina();
    await screen.findByText(/Reparar tubería con fuga/);

    const inputTrabajador = screen.getByPlaceholderText(/buscar por trabajador/i);
    // "Juan" es el nombre resuelto vía ofertas; el username real es "trabajador1".
    fireEvent.change(inputTrabajador, { target: { value: "Juan" } });

    expect(screen.getByText(/Instalar breaker nuevo/)).toBeInTheDocument();
    expect(screen.queryByText(/Arreglar corto circuito/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Reparar tubería con fuga/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Construir closet de madera/)).not.toBeInTheDocument();

    // También debe matchear por username.
    fireEvent.change(inputTrabajador, { target: { value: "trabajador2" } });
    expect(screen.getByText(/Arreglar corto circuito/)).toBeInTheDocument();
    expect(screen.queryByText(/Instalar breaker nuevo/)).not.toBeInTheDocument();
  });

  it("combina estado + tipo con AND, no OR", async () => {
    renderPagina();
    await screen.findByText(/Reparar tubería con fuga/);

    // disputa + plomeria -> solo sol-3 (sol-1 es plomería pero está publicada).
    fireEvent.mouseDown(screen.getByRole("tab", { name: "En disputa" }));
    fireEvent.change(screen.getByLabelText("Tipo de trabajo"), {
      target: { value: "plomeria" },
    });

    expect(screen.getByText(/Arreglar corto circuito/)).toBeInTheDocument();
    expect(screen.queryByText(/Reparar tubería con fuga/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instalar breaker nuevo/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Construir closet de madera/)).not.toBeInTheDocument();
  });

  it("una solicitud sin trabajador asignado no aparece al buscar un trabajador específico, pero sí con el campo vacío", async () => {
    renderPagina();
    await screen.findByText(/Construir closet de madera/);

    const inputTrabajador = screen.getByPlaceholderText(/buscar por trabajador/i);
    fireEvent.change(inputTrabajador, { target: { value: "cualquiera" } });

    expect(screen.queryByText(/Construir closet de madera/)).not.toBeInTheDocument();

    fireEvent.change(inputTrabajador, { target: { value: "" } });
    expect(screen.getByText(/Construir closet de madera/)).toBeInTheDocument();
  });
});
