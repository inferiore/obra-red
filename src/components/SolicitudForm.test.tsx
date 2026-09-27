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

// Los primitivos de shadcn/Radix para Select no son fáciles de manejar en
// jsdom (requieren pointer capture / scrollIntoView); se reemplazan por un
// <select> nativo equivalente solo para este test, dejando la lógica del
// formulario (la que nos interesa probar) intacta.
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
      <option value="">Selecciona una actividad</option>
      <option value="plomeria">Plomería</option>
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

import { apiFetch } from "@/lib/apiClient";
import { SolicitudForm } from "@/components/SolicitudForm";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const solicitudCreada: Solicitud = {
  id: "sol-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "plomeria",
  descripcion: "Reparar tubería con fuga en la cocina",
  presupuesto: 200000,
  ubicacion: "Barrio Manga, Cra 21 #29-45",
  fotos: [],
  estado: "publicado",
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-26T00:00:00.000Z",
};

const solicitudConFotos: Solicitud = {
  ...solicitudCreada,
  fotos: ["/uploads/foto1.jpg"],
};

const llenarFormulario = () => {
  fireEvent.change(screen.getByLabelText("Tipo de trabajo"), {
    target: { value: "plomeria" },
  });
  fireEvent.change(screen.getByLabelText("Descripción *"), {
    target: { value: "Reparar tubería con fuga en la cocina" },
  });
  fireEvent.change(screen.getByLabelText("Presupuesto (COP) *"), {
    target: { value: "200000" },
  });
  fireEvent.change(screen.getByLabelText("Ubicación exacta del servicio *"), {
    target: { value: "Barrio Manga, Cra 21 #29-45" },
  });
};

describe("SolicitudForm", () => {
  beforeEach(() => {
    // jsdom no implementa createObjectURL/revokeObjectURL; el formulario los
    // usa solo para previsualizar las fotos localmente antes de subirlas.
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });
    mockedApiFetch.mockReset();
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [], loading: false });
  });

  it("tras crear la solicitud, sube las fotos y persiste sus URLs con PATCH, guardando el resultado final en el store", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(solicitudCreada) // POST /solicitudes
      .mockResolvedValueOnce({ path: ["/uploads/foto1.jpg"] }) // POST /files
      .mockResolvedValueOnce(solicitudConFotos); // PATCH /solicitudes/:id

    render(<SolicitudForm onClose={() => {}} />);
    llenarFormulario();

    const archivo = new File(["contenido"], "foto1.jpg", { type: "image/jpeg" });
    const inputArchivo = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(inputArchivo, { target: { files: [archivo] } });

    fireEvent.click(screen.getByRole("button", { name: /publicar solicitud/i }));

    await waitFor(() => expect(mockedApiFetch).toHaveBeenCalledTimes(3));

    // 1) crea la solicitud sin fotos todavía
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      1,
      "/solicitudes",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({ fotos: [] }),
      }),
    );

    // 2) sube el archivo real a /files
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      2,
      "/files",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );

    // 3) persiste las URLs devueltas por /files sobre la solicitud recién creada
    expect(mockedApiFetch).toHaveBeenNthCalledWith(
      3,
      "/solicitudes/sol-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({
          id: "sol-1",
          fotos: ["/uploads/foto1.jpg"],
        }),
      }),
    );

    // El store queda con la solicitud final (fotos reales), sin requerir refetch manual.
    await waitFor(() => {
      const guardada = useSolicitudesStore
        .getState()
        .solicitudes.find((s) => s.id === "sol-1");
      expect(guardada?.fotos).toEqual(["/uploads/foto1.jpg"]);
    });
  });

  it("no intenta subir ni persistir fotos cuando no se adjuntó ninguna", async () => {
    mockedApiFetch.mockResolvedValueOnce(solicitudCreada); // POST /solicitudes

    render(<SolicitudForm onClose={() => {}} />);
    llenarFormulario();

    fireEvent.click(screen.getByRole("button", { name: /publicar solicitud/i }));

    await waitFor(() => expect(mockedApiFetch).toHaveBeenCalledTimes(1));
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/solicitudes",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
