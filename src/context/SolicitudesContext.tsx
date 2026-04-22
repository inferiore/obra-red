import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { v4 as uuid } from "uuid";
import type { Solicitud, SolicitudEstado } from "@/types/solicitud";

const STORAGE_KEY = "obrared_solicitudes";

const MOCK_SOLICITUDES: Solicitud[] = [
  {
    id: uuid(),
    clienteUsername: "cliente",
    clienteNombre: "Carlos Cliente",
    tipo: "plomeria",
    descripcion: "Reparación de fuga en tubería principal de la cocina. Urgente, hay filtración al piso inferior.",
    presupuesto: 250000,
    fotos: [],
    estado: "publicado",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: uuid(),
    clienteUsername: "cliente",
    clienteNombre: "Carlos Cliente",
    tipo: "electricidad",
    descripcion: "Instalación de 6 tomas nuevas y revisión del tablero principal en apartamento de 80m².",
    presupuesto: 480000,
    fotos: [],
    estado: "ejecucion",
    trabajadorAsignado: "trabajador",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: uuid(),
    clienteUsername: "cliente",
    clienteNombre: "Carlos Cliente",
    tipo: "pintura",
    descripcion: "Pintura interior de sala y comedor, 2 manos, color blanco hueso. Incluye estuco menor.",
    presupuesto: 900000,
    fotos: [],
    estado: "borrador",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: uuid(),
    clienteUsername: "cliente",
    clienteNombre: "Carlos Cliente",
    tipo: "carpinteria",
    descripcion: "Fabricación e instalación de mueble de cocina a medida, 3 metros lineales.",
    presupuesto: 2500000,
    fotos: [],
    estado: "finalizado",
    trabajadorAsignado: "trabajador",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
];

interface SolicitudesContextValue {
  solicitudes: Solicitud[];
  porUsuario: (username: string) => Solicitud[];
  crear: (data: Omit<Solicitud, "id" | "createdAt" | "estado"> & { estado?: SolicitudEstado }) => Solicitud;
  actualizarEstado: (id: string, estado: SolicitudEstado, trabajadorUsername?: string) => void;
  eliminar: (id: string) => void;
}

const SolicitudesContext = createContext<SolicitudesContextValue | undefined>(undefined);

export const SolicitudesProvider = ({ children }: { children: ReactNode }) => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSolicitudes(JSON.parse(raw));
        return;
      } catch {
        /* ignore */
      }
    }
    setSolicitudes(MOCK_SOLICITUDES);
  }, []);

  useEffect(() => {
    if (solicitudes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(solicitudes));
    }
  }, [solicitudes]);

  const porUsuario = useCallback(
    (username: string) => solicitudes.filter((s) => s.clienteUsername === username),
    [solicitudes],
  );

  const crear: SolicitudesContextValue["crear"] = (data) => {
    const nueva: Solicitud = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
      estado: data.estado ?? "borrador",
    };
    setSolicitudes((prev) => [nueva, ...prev]);
    return nueva;
  };

  const actualizarEstado: SolicitudesContextValue["actualizarEstado"] = (id, estado, trabajadorUsername) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, estado, trabajadorAsignado: trabajadorUsername ?? s.trabajadorAsignado }
          : s,
      ),
    );
  };

  const eliminar = (id: string) => {
    setSolicitudes((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <SolicitudesContext.Provider value={{ solicitudes, porUsuario, crear, actualizarEstado, eliminar }}>
      {children}
    </SolicitudesContext.Provider>
  );
};

export const useSolicitudes = () => {
  const ctx = useContext(SolicitudesContext);
  if (!ctx) throw new Error("useSolicitudes debe usarse dentro de <SolicitudesProvider>");
  return ctx;
};
