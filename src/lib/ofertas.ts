export type OfertaEstado = "pendiente" | "aceptada" | "rechazada";

export interface Oferta {
  id: string;
  solicitudId: string;
  trabajadorUsername: string;
  nombre: string;
  fotoUrl: string;
  calificacion: number; // 0-5
  trabajosCompletados: number;
  verificado: boolean;
  precio: number;
  tiempoEstimadoDias: number | null;
  fechaInicio: string | null;
  mensaje: string;
  estado: OfertaEstado;
  createdAt: string;
  expirada: boolean;
}

// Score: combina calificación, precio (menor es mejor vs presupuesto) y tiempo (menor es mejor)
export const calcularScore = (o: Oferta, presupuesto: number) => {
  const ratingScore = (o.calificacion / 5) * 50; // 0-50
  const priceRatio = Math.min(o.precio / presupuesto, 1.5);
  const priceScore = (1 - Math.min(priceRatio, 1)) * 30 + 5; // mejor si <= presupuesto
  const tiempoScore = o.tiempoEstimadoDias == null ? 10 : Math.max(0, 20 - o.tiempoEstimadoDias * 1.5);
  const verifBonus = o.verificado ? 5 : 0;
  return ratingScore + priceScore + tiempoScore + verifBonus;
};

export const ordenarPorMejor = (ofertas: Oferta[], presupuesto: number) => {
  return [...ofertas].sort((a, b) => calcularScore(b, presupuesto) - calcularScore(a, presupuesto));
};

export const razonMejorOferta = (o: Oferta, presupuesto: number): string => {
  const partes: string[] = [];
  if (o.calificacion >= 4.7) partes.push("alta calificación");
  if (o.precio <= presupuesto) partes.push("precio dentro del presupuesto");
  else if (o.precio <= presupuesto * 1.05) partes.push("precio competitivo");
  if (o.tiempoEstimadoDias != null && o.tiempoEstimadoDias <= 5) partes.push("entrega rápida");
  if (o.verificado) partes.push("trabajador verificado");
  if (partes.length === 0) return "Mejor balance entre precio, calidad y tiempo";
  return partes.join(", ").replace(/^./, (c) => c.toUpperCase());
};
