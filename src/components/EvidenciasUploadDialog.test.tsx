import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@/lib/apiClient", () => ({
  apiFetch: vi.fn(),
  resolveFileUrl: (path: string) =>
    path.startsWith("http") || path.startsWith("data:")
      ? path
      : `http://localhost:3001${path}`,
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

// Básicos: siempre obligatorios, sin importar el tipo de trabajo.
const EPP_LABELS_BASICOS = [
  "Guantes",
  "Botas de seguridad",
  "Gafas",
  "Suéteres tipo buzo",
  "Pantalones largos",
];

// Condicionales: obligatorios solo para tipos de alto riesgo (ver
// TIPOS_ALTO_RIESGO en el componente); siempre visibles y marcables.
const EPP_LABELS_CONDICIONALES = ["Cascos", "Protección auditiva"];

const EPP_LABELS = [...EPP_LABELS_BASICOS, ...EPP_LABELS_CONDICIONALES];

// Los checkboxes condicionales muestran un sufijo "(opcional...)" en su
// texto cuando la solicitud no es de alto riesgo, lo cual cambia su nombre
// accesible — de ahí el matcher parcial por defecto.
const getEppCheckbox = (label: string) =>
  screen.getByRole("checkbox", { name: new RegExp(`^${label}`) });

const marcarBasicosEpp = () => {
  EPP_LABELS_BASICOS.forEach((label) => {
    fireEvent.click(getEppCheckbox(label));
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
      expect(getEppCheckbox(label)).toBeInTheDocument();
    });
    expect(screen.queryByRole("tab", { name: "Antes" })).not.toBeInTheDocument();
  });

  it("protección auditiva aparece en el checklist sin importar el tipo de la solicitud", async () => {
    const altoRiesgo: Solicitud = {
      ...baseSolicitud,
      tipo: "soldadura",
      evidenciaAntes: [],
      evidenciaDurante: [],
      evidenciaDespues: [],
    };
    mockedApiFetch.mockResolvedValue(altoRiesgo);
    useSolicitudesStore.setState({ solicitudes: [altoRiesgo], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);
    await screen.findByText("Antes de subir evidencias");

    expect(getEppCheckbox("Protección auditiva")).toBeInTheDocument();
  });

  it("con un tipo que no es de alto riesgo (plomería), marcar solo los básicos habilita 'Confirmar y continuar'", async () => {
    const sinEvidencia: Solicitud = { ...baseSolicitud, evidenciaAntes: [], evidenciaDurante: [], evidenciaDespues: [] };
    mockedApiFetch.mockResolvedValue(sinEvidencia);
    useSolicitudesStore.setState({ solicitudes: [sinEvidencia], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);
    await screen.findByText("Antes de subir evidencias");

    const confirmar = screen.getByRole("button", { name: /confirmar y continuar/i });
    expect(confirmar).toBeDisabled();

    // Marcar solo 4 de los 5 básicos no debe habilitar el botón.
    EPP_LABELS_BASICOS.slice(0, 4).forEach((label) => {
      fireEvent.click(getEppCheckbox(label));
    });
    expect(confirmar).toBeDisabled();

    // El quinto básico habilita el botón sin necesidad de marcar casco ni
    // protección auditiva, porque plomería no es un tipo de alto riesgo.
    fireEvent.click(getEppCheckbox(EPP_LABELS_BASICOS[4]));
    expect(confirmar).toBeEnabled();

    fireEvent.click(confirmar);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Antes" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Antes de subir evidencias")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("epp-confirmado-sol-1")).toBe("1");
  });

  it("con un tipo de alto riesgo (albañilería), marcar solo los básicos no alcanza para habilitar el botón", async () => {
    const altoRiesgo: Solicitud = {
      ...baseSolicitud,
      tipo: "albanileria",
      evidenciaAntes: [],
      evidenciaDurante: [],
      evidenciaDespues: [],
    };
    mockedApiFetch.mockResolvedValue(altoRiesgo);
    useSolicitudesStore.setState({ solicitudes: [altoRiesgo], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);
    await screen.findByText("Antes de subir evidencias");

    const confirmar = screen.getByRole("button", { name: /confirmar y continuar/i });

    marcarBasicosEpp();
    expect(confirmar).toBeDisabled();

    fireEvent.click(getEppCheckbox("Cascos"));
    expect(confirmar).toBeDisabled();

    fireEvent.click(getEppCheckbox("Protección auditiva"));
    expect(confirmar).toBeEnabled();
  });

  it("con un tipo de bajo riesgo (pintura), no marcar casco ni protección auditiva igual habilita el botón", async () => {
    const bajoRiesgo: Solicitud = {
      ...baseSolicitud,
      tipo: "pintura",
      evidenciaAntes: [],
      evidenciaDurante: [],
      evidenciaDespues: [],
    };
    mockedApiFetch.mockResolvedValue(bajoRiesgo);
    useSolicitudesStore.setState({ solicitudes: [bajoRiesgo], loading: false });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);
    await screen.findByText("Antes de subir evidencias");

    const confirmar = screen.getByRole("button", { name: /confirmar y continuar/i });

    marcarBasicosEpp();
    expect(confirmar).toBeEnabled();
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

describe("EvidenciasUploadDialog - fotos/video adjuntos a la corrección", () => {
  const solicitudCorrigiendo: Solicitud = {
    ...baseSolicitud,
    estado: "corrigiendo",
    correcciones: ["Falta pintar el marco de la puerta"],
    correccionesCount: 1,
    evidenciaAntes: ["data:image/png;base64,antes"],
    evidenciaDurante: ["data:image/png;base64,durante"],
    evidenciaDespues: ["data:image/png;base64,despues"],
  };

  beforeEach(() => {
    sessionStorage.clear();
    mockedApiFetch.mockReset();
    useAuthStore.setState({
      user: { username: "trabajador1", name: "Trabajador Uno", role: "trabajador" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [solicitudCorrigiendo], loading: false });
  });

  it("pide GET /files?object=correccion y muestra la foto y el video devueltos", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === `/solicitudes/${solicitudCorrigiendo.id}`) {
        return solicitudCorrigiendo;
      }
      if (path === `/files?object=correccion&objectId=${solicitudCorrigiendo.id}`) {
        return [
          { id: "file-1", name: "foto1.jpg", path: "uploads/foto1.jpg", object: "correccion", objectId: solicitudCorrigiendo.id },
          { id: "file-2", name: "video1.mp4", path: "uploads/video1.mp4", object: "correccion", objectId: solicitudCorrigiendo.id },
        ];
      }
      throw new Error(`ruta no mockeada en el test: ${path}`);
    });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);

    expect(await screen.findByText("Fotos y video adjuntos por el cliente")).toBeInTheDocument();

    const foto = await screen.findByAltText("foto1.jpg");
    expect(foto).toHaveAttribute("src", expect.stringContaining("/uploads/foto1.jpg"));

    const video = document.querySelector("video[controls]") as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.getAttribute("src")).toContain("/uploads/video1.mp4");
  });

  it("no muestra la sección de adjuntos si /files no devuelve nada para esa corrección", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === `/solicitudes/${solicitudCorrigiendo.id}`) {
        return solicitudCorrigiendo;
      }
      if (path === `/files?object=correccion&objectId=${solicitudCorrigiendo.id}`) {
        return [];
      }
      throw new Error(`ruta no mockeada en el test: ${path}`);
    });

    render(<EvidenciasUploadDialogHarness solicitudId="sol-1" open />);

    await screen.findByText("Falta pintar el marco de la puerta");
    expect(screen.queryByText("Fotos y video adjuntos por el cliente")).not.toBeInTheDocument();
  });
});
