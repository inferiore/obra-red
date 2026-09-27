import { describe, it, expect } from "vitest";
import { tieneOfertaPendiente, type Oferta } from "@/lib/ofertas";
import type { Solicitud } from "@/types/solicitud";

const crearOferta = (overrides: Partial<Oferta> = {}): Oferta => ({
  id: "oferta-1",
  solicitudId: "sol-1",
  trabajadorUsername: "trabajador1",
  nombre: "Trabajador Uno",
  fotoUrl: "",
  calificacion: 4.5,
  trabajosCompletados: 10,
  verificado: true,
  precio: 100000,
  tiempoEstimadoDias: 3,
  fechaInicio: "2026-09-15",
  mensaje: "Puedo hacer el trabajo.",
  estado: "pendiente",
  createdAt: "2026-09-01T00:00:00.000Z",
  expirada: false,
  ...overrides,
});

const crearSolicitud = (ofertas: Oferta[] = []): Solicitud => ({
  id: "sol-1",
  clienteUsername: "cliente1",
  clienteNombre: "Cliente Uno",
  tipo: "plomeria",
  descripcion: "Reparar tubería",
  presupuesto: 150000,
  ubicacion: "Bogotá",
  fotos: [],
  estado: "publicado",
  ofertas,
  correcciones: [],
  correccionesCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
});

describe("tieneOfertaPendiente", () => {
  it("bloquea cuando existe una oferta pendiente del mismo trabajador", () => {
    const solicitud = crearSolicitud([
      crearOferta({ trabajadorUsername: "trabajador1", estado: "pendiente" }),
    ]);
    expect(tieneOfertaPendiente(solicitud, "trabajador1")).toBe(true);
  });

  it("no bloquea cuando la única oferta del trabajador está rechazada", () => {
    const solicitud = crearSolicitud([
      crearOferta({ trabajadorUsername: "trabajador1", estado: "rechazada" }),
    ]);
    expect(tieneOfertaPendiente(solicitud, "trabajador1")).toBe(false);
  });

  it("no bloquea cuando no hay ninguna oferta de ese trabajador", () => {
    const solicitud = crearSolicitud([
      crearOferta({ trabajadorUsername: "otroTrabajador", estado: "pendiente" }),
    ]);
    expect(tieneOfertaPendiente(solicitud, "trabajador1")).toBe(false);
  });

  it("no bloquea cuando la solicitud no tiene ofertas", () => {
    const solicitud = crearSolicitud([]);
    expect(tieneOfertaPendiente(solicitud, "trabajador1")).toBe(false);
  });
});
