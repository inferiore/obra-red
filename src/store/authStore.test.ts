import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/apiClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/apiClient")>("@/lib/apiClient");
  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

import { apiFetch, ApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

const mockedApiFetch = vi.mocked(apiFetch);

describe("authStore.cambiarPassword", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
    useAuthStore.setState({
      user: { username: "trabajador", name: "Juan", role: "trabajador" },
      token: "fake-token",
    });
  });

  it("envía la contraseña actual y la nueva con el token de sesión", async () => {
    mockedApiFetch.mockResolvedValueOnce(undefined);

    const result = await useAuthStore.getState().cambiarPassword("actual123", "nueva123");

    expect(mockedApiFetch).toHaveBeenCalledWith("/auth/cambiar-password", {
      method: "PATCH",
      body: { actual: "actual123", nueva: "nueva123" },
      token: "fake-token",
    });
    expect(result).toEqual({ ok: true });
  });

  it("retorna el mensaje de error del backend cuando la contraseña actual es incorrecta", async () => {
    mockedApiFetch.mockRejectedValueOnce(new ApiError(401, "Contraseña actual incorrecta"));

    const result = await useAuthStore.getState().cambiarPassword("mala", "nueva123");

    expect(result).toEqual({ ok: false, error: "Contraseña actual incorrecta" });
  });
});
