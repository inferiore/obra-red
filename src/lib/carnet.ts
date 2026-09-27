import type { Solicitud } from "@/types/solicitud";

/**
 * El carnet de un trabajador para una solicitud es visible mientras haya un
 * trabajador asignado y el trabajo no se haya marcado como finalizado — se
 * mantiene visible durante `ejecucion`, `revision`, `corrigiendo` y
 * `disputa`. Ver specs/2026-09-26-carnet-trabajador.md, sección
 * "Resolved Decisions".
 */
export const puedeVerCarnet = (
  solicitud: Pick<Solicitud, "trabajadorAsignado" | "estado">,
): boolean => !!solicitud.trabajadorAsignado && solicitud.estado !== "finalizado";
