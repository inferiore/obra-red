import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError, resolveFileUrl, BASE_URL } from "@/lib/apiClient";

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: "Error",
  text: async () => (body === undefined ? "" : JSON.stringify(body)),
});

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía Content-Type application/json y el body serializado cuando el body es un objeto plano", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await apiFetch("/solicitudes", {
      method: "POST",
      body: { tipo: "plomeria" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe(JSON.stringify({ tipo: "plomeria" }));
    expect(result).toEqual({ ok: true });
  });

  it("no envía body cuando options.body es undefined, pero sí fija Content-Type application/json", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, undefined));

    await apiFetch("/solicitudes");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBeUndefined();
  });

  it("no fija Content-Type y envía el FormData tal cual cuando el body es multipart", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const formData = new FormData();
    formData.append("files", new Blob(["foto"]), "foto.jpg");

    await apiFetch("/solicitudes/sol-1/evidencias", {
      method: "PATCH",
      body: formData,
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({});
    expect("Content-Type" in init.headers).toBe(false);
    expect(init.body).toBe(formData);
  });

  it("agrega el header Authorization cuando se pasa un token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await apiFetch("/auth/me", { token: "fake-token" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer fake-token",
    });
  });

  it("no agrega el header Authorization cuando no se pasa token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await apiFetch("/solicitudes");

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("lanza ApiError con el status y mensaje del backend cuando la respuesta no es 2xx", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { message: "Credenciales inválidas" })
    );

    await expect(apiFetch("/auth/login", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 401,
      message: "Credenciales inválidas",
    });
  });

  it("lanza ApiError uniendo con coma los mensajes cuando el backend responde un arreglo", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(400, { message: ["el campo tipo es requerido", "el campo precio es requerido"] })
    );

    let error: unknown;
    try {
      await apiFetch("/solicitudes", { method: "POST", body: {} });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toBe(
      "el campo tipo es requerido, el campo precio es requerido"
    );
  });

  it("usa statusText como mensaje cuando el backend no incluye un campo message", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "",
    });

    await expect(apiFetch("/solicitudes")).rejects.toMatchObject({
      status: 500,
      message: "Internal Server Error",
    });
  });
});

describe("resolveFileUrl", () => {
  it("antepone la URL base de la API a una ruta relativa servida por el backend", () => {
    expect(resolveFileUrl("/uploads/abc.jpg")).toBe(`${BASE_URL}/uploads/abc.jpg`);
  });

  it("deja intacta una URL ya absoluta (http/https)", () => {
    expect(resolveFileUrl("https://cdn.example.com/foto.jpg")).toBe(
      "https://cdn.example.com/foto.jpg"
    );
  });

  it("deja intacto un data: URL (evidencias en base64)", () => {
    const dataUrl = "data:image/png;base64,AAA";
    expect(resolveFileUrl(dataUrl)).toBe(dataUrl);
  });

  it("devuelve el valor tal cual cuando está vacío", () => {
    expect(resolveFileUrl("")).toBe("");
  });
});
