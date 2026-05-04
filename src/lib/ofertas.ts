// Mock de ofertas recibidas por solicitud (determinístico según id)
export interface Oferta {
  id: string;
  trabajadorUsername: string;
  nombre: string;
  fotoUrl: string;
  calificacion: number; // 0-5
  trabajosCompletados: number;
  verificado: boolean;
  precio: number;
  tiempoEstimadoDias: number;
  mensaje: string;
}

const TRABAJADORES = [
  { u: "juan_p", n: "Juan Pérez", cal: 4.9, comp: 87, ver: true, msg: "Tengo experiencia en este tipo de trabajo. Materiales incluidos y garantía de 6 meses." },
  { u: "maria_g", n: "María Gómez", cal: 4.7, comp: 54, ver: true, msg: "Puedo iniciar mañana mismo. Trabajo limpio y entrego a tiempo." },
  { u: "carlos_r", n: "Carlos Ramírez", cal: 4.5, comp: 32, ver: true, msg: "Buen precio, buena calidad. Llevo 8 años en el oficio." },
  { u: "ana_l", n: "Ana López", cal: 4.8, comp: 71, ver: true, msg: "Especialista certificada. Incluye garantía escrita y soporte post-obra." },
  { u: "pedro_m", n: "Pedro Muñoz", cal: 4.2, comp: 19, ver: false, msg: "Disponibilidad inmediata, precio competitivo." },
  { u: "luisa_t", n: "Luisa Torres", cal: 4.6, comp: 43, ver: true, msg: "Trabajo con mi equipo. Terminamos rápido y sin contratiempos." },
];

// hash simple para semilla determinística
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const getOfertasMock = (solicitudId: string, presupuesto: number): Oferta[] => {
  const seed = hash(solicitudId);
  const cantidad = 3 + (seed % 3); // 3 a 5 ofertas
  return Array.from({ length: cantidad }, (_, i) => {
    const t = TRABAJADORES[(seed + i * 7) % TRABAJADORES.length];
    // Precio entre 75% y 115% del presupuesto
    const factor = 0.75 + (((seed >> (i + 1)) % 40) / 100);
    const precio = Math.round((presupuesto * factor) / 1000) * 1000;
    const tiempo = 1 + ((seed >> (i + 2)) % 10);
    return {
      id: `${solicitudId}-of-${i}`,
      trabajadorUsername: t.u,
      nombre: t.n,
      fotoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.n)}`,
      calificacion: t.cal,
      trabajosCompletados: t.comp,
      verificado: t.ver,
      precio,
      tiempoEstimadoDias: tiempo,
      mensaje: t.msg,
    };
  });
};

// Score: combina calificación, precio (menor es mejor vs presupuesto) y tiempo (menor es mejor)
export const calcularScore = (o: Oferta, presupuesto: number) => {
  const ratingScore = (o.calificacion / 5) * 50; // 0-50
  const priceRatio = Math.min(o.precio / presupuesto, 1.5);
  const priceScore = (1 - Math.min(priceRatio, 1)) * 30 + 5; // mejor si <= presupuesto
  const tiempoScore = Math.max(0, 20 - o.tiempoEstimadoDias * 1.5);
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
  if (o.tiempoEstimadoDias <= 5) partes.push("entrega rápida");
  if (o.verificado) partes.push("trabajador verificado");
  if (partes.length === 0) return "Mejor balance entre precio, calidad y tiempo";
  return partes.join(", ").replace(/^./, (c) => c.toUpperCase());
};
