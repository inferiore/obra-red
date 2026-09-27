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
import { EvidenciasUploadDialog } from "@/components/EvidenciasUploadDialog";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import type { Solicitud } from "@/types/solicitud";

const mockedApiFetch = vi.mocked(apiFetch);

// El diálogo lee la solicitud vía prop, pero recibe actualizaciones cuando el
// store se refresca (fetchOne), igual que Dashboard.tsx: reproduce ese cableo
// para que el efecto de "primera vez" del EPP vea la evidencia post-refetch.
const EvidenciasUploadDialogHarness = ({
  solicitudId,
  open,
}: {
  solicitudId: string;
  open: boolean;
}) => {
  const solicitud =
    useSolicitudesStore((s) => s.solicitudes).find((s) => s.id === solicitudId) ?? null;
  return <EvidenciasUploadDialog solicitud={solicitud} open={open} onOpenChange={() => {}} />;
};

const baseSolicitud: Solicitud = {
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

const EPP_LABELS = [
  "Cascos",
  "Guantes",
  "Botas de seguridad",
  "Gafas",
  "Suéteres tipo buzo",
  "Pantalones largos",
];

const marcarTodoElEpp = () => {
  EPP_LABELS.forEach((label) => {
    fireEvent.click(screen.getByRole("checkbox", { name: label }));
  });
};

describe("EvidenciasUploadDialog - checklist de EPP", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockedApiFetch.mockReset();
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });
  });

  it("muestra el checklist de EPP antes de las pestañas cuando nunca se ha subido evidencia", async () => {
    const sinEvidencia: Solicitud = { ...baseSolicitud, evidenciaAntes: [], evidenciaDurante: [], evidenciaDespues: [] };
    mockedApiFetch.mockResolvedValue(sinEvidencia);
    useSolicitudesStore.setState({ solicitudes: [sinEvidencia], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);

    expect(await screen.findByText("Antes de subir evidencias")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Por tu seguridad, confirma que estás usando tu dotación de protección personal antes de continuar.",
      ),
    ).toBeInTheDocument();
    EPP_LABELS.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.queryByRole("tab", { name: "Antes" })).not.toBeInTheDocument();
  });

  it("mantiene deshabilitado 'Confirmar y continuar' hasta marcar los 6 ítems y luego revela las pestañas", async () => {
    const sinEvidencia: Solicitud = { ...baseSolicitud, evidenciaAntes: [], evidenciaDurante: [], evidenciaDespues: [] };
    mockedApiFetch.mockResolvedValue(sinEvidencia);
    useSolicitudesStore.setState({ solicitudes: [sinEvidencia], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);
    await screen.findByText("Antes de subir evidencias");

    const confirmar = screen.getByRole("button", { name: /confirmar y continuar/i });
    expect(confirmar).toBeDisabled();

    // Marcar solo 5 de los 6 no debe habilitar el botón.
    EPP_LABELS.slice(0, 5).forEach((label) => {
      fireEvent.click(screen.getByRole("checkbox", { name: label }));
    });
    expect(confirmar).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: EPP_LABELS[5] }));
    expect(confirmar).toBeEnabled();

    fireEvent.click(confirmar);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Antes" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Antes de subir evidencias")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("epp-confirmado-sol-1")).toBe("1");
  });

  it("no vuelve a pedir el checklist al reabrir el diálogo en la misma sesión tras confirmarlo", async () => {
    sessionStorage.setItem("epp-confirmado-sol-1", "1");
    const sinEvidencia: Solicitud = { ...baseSolicitud, evidenciaAntes: [], evidenciaDurante: [], evidenciaDespues: [] };
    mockedApiFetch.mockResolvedValue(sinEvidencia);
    useSolicitudesStore.setState({ solicitudes: [sinEvidencia], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Antes" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Antes de subir evidencias")).not.toBeInTheDocument();
  });

  it("no muestra el checklist si la solicitud ya tiene evidencia real, incluso en un resubmit 'corrigiendo'", async () => {
    const conEvidencia: Solicitud = {
      ...baseSolicitud,
      estado: "corrigiendo",
      evidenciaAntes: ["data:image/png;base64,abc"],
      evidenciaDurante: [],
      evidenciaDespues: [],
    };
    mockedApiFetch.mockResolvedValue(conEvidencia);
    useSolicitudesStore.setState({ solicitudes: [conEvidencia], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Antes" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Antes de subir evidencias")).not.toBeInTheDocument();
  });

  it("el cliente nunca ve el checklist de EPP, sin importar la evidencia previa", async () => {
    const sinEvidencia: Solicitud = { ...baseSolicitud, evidenciaAntes: [], evidenciaDurante: [], evidenciaDespues: [] };
    mockedApiFetch.mockResolvedValue(sinEvidencia);
    useSolicitudesStore.setState({ solicitudes: [sinEvidencia], loading: false });
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Antes" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Antes de subir evidencias")).not.toBeInTheDocument();
  });
});
