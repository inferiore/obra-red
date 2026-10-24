import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

const fetchBySolicitudMock = vi.fn();
const enviarMock = vi.fn();

// El componente solo usa `useMensajesStore` vía selectores — un store falso
// con la misma forma es suficiente y evita depender de `apiFetch` real.
let mensajesState: {
  bySolicitud: Record<string, unknown[]>;
  fetchBySolicitud: typeof fetchBySolicitudMock;
  enviar: typeof enviarMock;
};

vi.mock("@/store/mensajesStore", () => ({
  useMensajesStore: (selector: (state: typeof mensajesState) => unknown) =>
    selector(mensajesState),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import { ChatSolicitudDialog } from "@/components/ChatSolicitudDialog";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";

const flushPromises = () => vi.advanceTimersByTimeAsync(0);

describe("ChatSolicitudDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchBySolicitudMock.mockReset();
    fetchBySolicitudMock.mockResolvedValue(undefined);
    enviarMock.mockReset();
    toastMock.mockReset();
    mensajesState = {
      bySolicitud: {},
      fetchBySolicitud: fetchBySolicitudMock,
      enviar: enviarMock,
    };
    useAuthStore.setState({
      user: { username: "cliente1", name: "Cliente Uno", role: "cliente" },
      token: "fake-token",
    });
    useSolicitudesStore.setState({ solicitudes: [], loading: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hace polling de fetchBySolicitud repetidamente mientras el diálogo está abierto", async () => {
    render(
      <ChatSolicitudDialog solicitudId="sol-1" open onOpenChange={() => {}} />,
    );

    await flushPromises();
    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(4000);
    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(4000);
    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(3);
  });

  it("limpia el intervalo y deja de refrescar cuando el diálogo se cierra", async () => {
    const { rerender } = render(
      <ChatSolicitudDialog solicitudId="sol-1" open onOpenChange={() => {}} />,
    );
    await flushPromises();
    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(1);

    rerender(
      <ChatSolicitudDialog solicitudId="sol-1" open={false} onOpenChange={() => {}} />,
    );
    await flushPromises();

    const llamadasAlCerrar = fetchBySolicitudMock.mock.calls.length;

    await vi.advanceTimersByTimeAsync(12000);

    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(llamadasAlCerrar);
  });

  it("limpia el intervalo al desmontar el componente", async () => {
    const { unmount } = render(
      <ChatSolicitudDialog solicitudId="sol-1" open onOpenChange={() => {}} />,
    );
    await flushPromises();
    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(1);

    unmount();

    const llamadasAlDesmontar = fetchBySolicitudMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(12000);

    expect(fetchBySolicitudMock).toHaveBeenCalledTimes(llamadasAlDesmontar);
  });

  it("muestra un toast de error si el fetch falla, sin que el componente crashee", async () => {
    fetchBySolicitudMock.mockRejectedValue(new Error("network"));

    expect(() =>
      render(
        <ChatSolicitudDialog solicitudId="sol-1" open onOpenChange={() => {}} />,
      ),
    ).not.toThrow();

    await flushPromises();

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "No se pudieron cargar los mensajes",
        variant: "destructive",
      }),
    );
  });
});
