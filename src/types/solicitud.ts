import type { Oferta } from "@/lib/ofertas";

export type UserRole = "cliente" | "trabajador" | "admin";

export interface AuthUser {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  // Datos de perfil opcionales (registrados desde el formulario)
  email?: string;
  telefono?: string;
  documento?: string;
  // Cliente
  tipoCliente?: "natural" | "empresa";
  razonSocial?: string;
  nit?: string;
  direccion?: string;
  barrio?: string;
  // Trabajador
  especialidad?: string;
  especialidadesExtra?: string[];
  experiencia?: number;
  descripcionProfesional?: string;
  zonasCobertura?: string[];
}

export type SolicitudEstado =
  | "borrador"
  | "publicado"
  | "ejecucion"
  | "revision"
  | "corrigiendo"
  | "disputa"
  | "finalizado";

export type TipoTrabajo =
  | "albanileria"
  | "plomeria"
  | "electricidad"
  | "carpinteria"
  | "pintura"
  | "soldadura"
  | "techado"
  | "demolicion"
  | "yeso"
  | "otro";

export const TIPOS_TRABAJO: { value: TipoTrabajo; label: string }[] = [
  { value: "albanileria", label: "Albañilería" },
  { value: "plomeria", label: "Plomería" },
  { value: "electricidad", label: "Electricidad" },
  { value: "carpinteria", label: "Carpintería" },
  { value: "pintura", label: "Pintura" },
  { value: "soldadura", label: "Soldadura" },
  { value: "techado", label: "Techado" },
  { value: "demolicion", label: "Demolición" },
  { value: "yeso", label: "Yesería / Drywall" },
  { value: "otro", label: "Otro" },
];

export interface Solicitud {
  id: string;
  clienteUsername: string;
  clienteNombre: string;
  tipo: TipoTrabajo;
  descripcion: string;
  presupuesto: number;
  ubicacion: string;
  fotos: string[]; // data URLs
  estado: SolicitudEstado;
  trabajadorAsignado?: string;
  // Sí vienen en el listado (GET /solicitudes) — el backend las embebe
  // batcheadas para evitar que el frontend tenga que pedirlas una por una.
  ofertas?: Oferta[];
  // No vienen en el listado (GET /solicitudes) por su peso — solo al pedir
  // el detalle de una solicitud puntual (GET /solicitudes/:id).
  evidenciaAntes?: string[];
  evidenciaDurante?: string[];
  evidenciaDespues?: string[];
  evidenciaNota?: string;
  // Evidencia subida por cualquiera de las dos partes mientras la solicitud
  // está en disputa. A diferencia de las otras fases, cada elemento lleva
  // atribución (quién la subió y cuándo) porque ambas partes pueden subir.
  evidenciaDisputa?: { url: string; autorUsername: string; createdAt: string }[];
  correcciones: string[];
  correccionesCount: number;
  createdAt: string;
}

export const ESTADO_LABELS: Record<SolicitudEstado, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  ejecucion: "En ejecución",
  revision: "En revisión",
  corrigiendo: "Corrigiendo",
  disputa: "En disputa",
  finalizado: "Finalizado",
};
