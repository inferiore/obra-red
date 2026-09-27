export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// El backend devuelve rutas relativas para archivos servidos desde disco
// (ej. "/uploads/<uuid>.jpg", vía POST /files). Hay que anteponerles la URL
// base de la API para que sirvan como <img src>; las URLs ya absolutas o los
// data: URLs (evidencias en base64) se dejan intactas.
export const resolveFileUrl = (path: string): string => {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${BASE_URL}${path}`;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export const apiFetch = async <T>(
  path: string,
  options: Options = {}
): Promise<T> => {
  const { method = "GET", body, token } = options;
  const isMultiPart = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isMultiPart) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isMultiPart
      ? body
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = data?.message ?? res.statusText;
    throw new ApiError(
      res.status,
      Array.isArray(message) ? message.join(", ") : message
    );
  }

  return data as T;
};
