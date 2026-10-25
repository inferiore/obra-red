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
import { RevisionTrabajoDialog } from "@/components/RevisionTrabajoDialog";
import { useAuthStore } from "@/store/authStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

const baseSolicitud: Solicitud = {
  id: "sol-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "plomeria",
  descripcion: "Reparar tubería con fuga",
  presupuesto: 200000,
  ubicacion: "Bogotá",
  fotos: [],
  estado: "revision",
  trabajadorAsignado: "trabajador1",
  evidenciaAntes: [],
  evidenciaDurante: [],
  evidenciaDespues: ["data:image/png;base64,xyz"],
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const COMENTARIO_VALIDO = "El baño quedó con una fuga visible en la tubería";

const abrirSeccionCorreccion = async () => {
  fireEvent.click(screen.getByRole("button", { name: /solicitar corrección/i }));
  await screen.findByPlaceholderText("Describe los detalles que requieren corrección...");
};

const getFileInputs = () =>
  Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];

describe("RevisionTrabajoDialog - adjuntos al solicitar corrección", () => {
  beforeEach(() => {
    // jsdom no implementa createObjectURL/revokeObjectURL; el diálogo los usa
    // solo para leer la duración del video antes de permitir el envío.
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
    mockedApiFetch.mockImplementation(
      async (path: string, opts?: { method?: string }) => {
        if (!opts?.method || opts.method === "GET") {
          return baseSolicitud;
        }
        if (path === "/files") {
          return { path: ["/uploads/foto1.jpg", "/uploads/video1.mp4"] };
        }
        if (path.endsWith("/solicitar-correccion")) {
          return {
            ...baseSolicitud,
            estado: "corrigiendo",
            correcciones: ["ajustar algo"],
            correccionesCount: 1,
          };
        }
        throw new Error(`ruta no mockeada en el test: ${path}`);
      }
    );
  });

  it("sube las fotos y el video a /files antes de llamar a solicitar-correccion", async () => {
    render(
      <RevisionTrabajoDialog
        solicitud={baseSolicitud}
        open
        onOpenChange={() => {}}
        onAprobar={() => {}}
      />
    );

    await abrirSeccionCorreccion();

    fireEvent.change(
      screen.getByPlaceholderText("Describe los detalles que requieren corrección..."),
      { target: { value: COMENTARIO_VALIDO } }
    );

    const [inputFotos, inputVideo] = getFileInputs();
    const foto = new File(["contenido"], "foto1.jpg", { type: "image/jpeg" });
    fireEvent.change(inputFotos, { target: { files: [foto] } });

    const video = new File(["contenido"], "video1.mp4", { type: "video/mp4" });
    fireEvent.change(inputVideo, { target: { files: [video] } });

    const videoEl = document.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(videoEl, "duration", { value: 12, configurable: true });
    fireEvent(videoEl, new Event("loadedmetadata"));

    fireEvent.click(screen.getByRole("button", { name: /enviar solicitud de corrección/i }));

    await waitFor(() =>
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/solicitudes/sol-1/solicitar-correccion",
        expect.objectContaining({
          method: "PATCH",
          body: { comentario: COMENTARIO_VALIDO },
        })
      )
    );

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/files",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) })
    );

    const callPaths = mockedApiFetch.mock.calls.map(([path]) => path);
    const filesIdx = callPaths.indexOf("/files");
    const correccionIdx = callPaths.indexOf("/solicitudes/sol-1/solicitar-correccion");
    expect(filesIdx).toBeGreaterThanOrEqual(0);
    expect(correccionIdx).toBeGreaterThan(filesIdx);

    const filesCall = mockedApiFetch.mock.calls.find(([path]) => path === "/files");
    const body = filesCall?.[1]?.body as FormData;
    expect(body.get("object")).toBe("correccion");
    expect(body.get("objectId")).toBe("sol-1");
    expect(body.getAll("files")).toHaveLength(2);
  });

  it("bloquea el envío y no llama al backend si el video seleccionado dura más de 30 segundos", async () => {
    render(
      <RevisionTrabajoDialog
        solicitud={baseSolicitud}
        open
        onOpenChange={() => {}}
        onAprobar={() => {}}
      />
    );

    await abrirSeccionCorreccion();

    fireEvent.change(
      screen.getByPlaceholderText("Describe los detalles que requieren corrección..."),
      { target: { value: COMENTARIO_VALIDO } }
    );

    const [, inputVideo] = getFileInputs();
    const video = new File(["contenido"], "video-largo.mp4", { type: "video/mp4" });
    fireEvent.change(inputVideo, { target: { files: [video] } });

    const videoEl = document.querySelector("video") as HTMLVideoElement;
    Object.defineProperty(videoEl, "duration", { value: 45, configurable: true });
    fireEvent(videoEl, new Event("loadedmetadata"));

    expect(
      await screen.findByText(/el video dura más de 30 segundos/i)
    ).toBeInTheDocument();

    const enviarBtn = screen.getByRole("button", { name: /enviar solicitud de corrección/i });
    expect(enviarBtn).toBeDisabled();

    fireEvent.click(enviarBtn);

    expect(mockedApiFetch).not.toHaveBeenCalledWith("/files", expect.anything());
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      "/solicitudes/sol-1/solicitar-correccion",
      expect.anything()
    );
  });
});
