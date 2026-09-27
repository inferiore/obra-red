import { useEffect, useRef, useState } from "react";
import { Download, MapPin, ShieldCheck, Star, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { TIPOS_TRABAJO, type Solicitud } from "@/types/solicitud";
import logo from "@/assets/obrared-logo.png";

const tipoLabel = (tipo: string) => TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

const hoyLargo = () =>
  new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" });

interface TrabajadorPerfilPublico {
  username: string;
  name: string;
  fotoUrl: string;
  calificacion: number;
  verificado: boolean;
}

interface Props {
  solicitud: Solicitud | null;
  // Quién aparece como asignado en el carnet. Se pide explícito en vez de
  // leerlo siempre de `solicitud.trabajadorAsignado` porque, justo tras
  // aceptar una oferta, el objeto `solicitud` que tiene el diálogo llamador
  // puede seguir siendo el de antes de la aceptación (sin refetch) — ver
  // OfertasDialog.tsx.
  trabajadorUsername: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CarnetTrabajadorDialog = ({
  solicitud,
  trabajadorUsername,
  open,
  onOpenChange,
}: Props) => {
  const token = useAuthStore((s) => s.token);
  const [perfil, setPerfil] = useState<TrabajadorPerfilPublico | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const carnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !trabajadorUsername) return;
    setLoading(true);
    setError(null);
    setPerfil(null);
    apiFetch<TrabajadorPerfilPublico>(`/users/${trabajadorUsername}`, { token })
      .then(setPerfil)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error de conexión con el servidor"))
      .finally(() => setLoading(false));
  }, [open, trabajadorUsername, token]);

  if (!solicitud) return null;

  const handleDescargarPDF = async () => {
    if (!carnetRef.current) return;
    setDescargando(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(carnetRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`carnet-${solicitud.id}.pdf`);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Carnet del trabajador</DialogTitle>
          <DialogDescription>
            Identificación del trabajador asignado a esta solicitud.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!loading && error && <p className="text-sm text-destructive py-6 text-center">{error}</p>}

        {!loading && perfil && (
          <>
            <div
              ref={carnetRef}
              className="rounded-xl border-2 border-primary/20 bg-card p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <img src={logo} alt="ObraRed" className="w-6 h-6 rounded object-cover" />
                  <span className="text-sm font-bold">
                    Obra<span className="text-primary">Red</span>
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Carnet de trabajo
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 border-2 border-primary/30">
                  <AvatarImage src={perfil.fotoUrl} alt={perfil.name} />
                  <AvatarFallback>
                    <User size={22} />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold truncate">{perfil.name}</p>
                    {perfil.verificado && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <ShieldCheck size={12} /> Verificado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm mt-0.5">
                    <Star size={13} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{perfil.calificacion.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Trabajo autorizado
                </p>
                <p className="text-sm font-semibold">{tipoLabel(solicitud.tipo)}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{solicitud.descripcion}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</p>
                  <p className="font-medium">{solicitud.clienteNombre}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <MapPin size={11} /> Ubicación
                  </p>
                  <p className="font-medium">{solicitud.ubicacion}</p>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground text-right">Emitido el {hoyLargo()}</p>
            </div>

            <Button onClick={handleDescargarPDF} disabled={descargando} className="w-full">
              <Download size={14} />
              {descargando ? "Generando PDF..." : "Descargar PDF"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
