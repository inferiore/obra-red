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

export type SolicitudEstado = "borrador" | "publicado" | "ejecucion" | "finalizado";

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
  createdAt: string;
}

export const ESTADO_LABELS: Record<SolicitudEstado, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  ejecucion: "En ejecución",
  finalizado: "Finalizado",
};
