import type { TipoTrabajo } from "@/types/solicitud";

export interface Calificacion {
  id: string;
  solicitudId: string;
  clienteUsername: string;
  clienteNombre: string;
  tipo: TipoTrabajo;
  trabajadorUsername: string;
  estrellas: number;
  comentario?: string;
  etiquetas: string[];
  createdAt: string;
}
