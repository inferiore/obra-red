import { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Hammer,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { useCalificacionesStore } from "@/store/calificacionesStore";
import type { Calificacion } from "@/lib/calificaciones";
import { TIPOS_TRABAJO } from "@/types/solicitud";

const tipoLabel = (tipo: string) => TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

// Referencia estable: si el selector devolviera un `[]` nuevo en cada
// render, useSyncExternalStore (por dentro de Zustand) entra en loop
// infinito al no poder confirmar que el valor "no cambió".
const EMPTY_CALIFICACIONES: Calificacion[] = [];

const Estrellas = ({ valor }: { valor: number }) => (
  <span className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        size={12}
        className={n <= valor ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}
      />
    ))}
  </span>
);

interface TrabajadorPerfil {
  username: string;
  name: string;
  fotoUrl: string;
  especialidad: string | null;
  especialidadesExtra: string[];
  experiencia: number | null;
  descripcionProfesional: string | null;
  zonasCobertura: string[];
  calificacion: number;
  trabajosCompletados: number;
  verificado: boolean;
}

interface Props {
  username: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TrabajadorPerfilDialog = ({ username, open, onOpenChange }: Props) => {
  const token = useAuthStore((s) => s.token);
  const fetchCalificaciones = useCalificacionesStore((s) => s.fetchByTrabajador);
  const calificaciones = useCalificacionesStore((s) =>
    username ? s.byTrabajador[username] ?? EMPTY_CALIFICACIONES : EMPTY_CALIFICACIONES,
  );
  const [perfil, setPerfil] = useState<TrabajadorPerfil | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !username) return;
    setLoading(true);
    setError(null);
    setPerfil(null);
    apiFetch<TrabajadorPerfil>(`/users/${username}`, { token })
      .then(setPerfil)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Error de conexión con el servidor"))
      .finally(() => setLoading(false));
    fetchCalificaciones(username).catch(() => {});
  }, [open, username, token, fetchCalificaciones]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Perfil del trabajador</DialogTitle>
          <DialogDescription>Información pública visible para clientes.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0">
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-destructive py-6 text-center">{error}</p>
        )}

        {!loading && perfil && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14 border">
                <AvatarImage src={perfil.fotoUrl} alt={perfil.name} />
                <AvatarFallback>
                  <User size={20} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{perfil.name}</p>
                  {perfil.verificado && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <ShieldCheck size={12} /> Verificado
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm mt-0.5">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{perfil.calificacion.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({perfil.trabajosCompletados} trabajos completados)
                  </span>
                </div>
              </div>
            </div>

            {(perfil.especialidad || perfil.especialidadesExtra.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {perfil.especialidad && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Hammer size={12} />
                    {tipoLabel(perfil.especialidad)}
                  </Badge>
                )}
                {perfil.especialidadesExtra.map((esp) => (
                  <Badge key={esp} variant="outline">
                    {tipoLabel(esp)}
                  </Badge>
                ))}
              </div>
            )}

            {perfil.descripcionProfesional && (
              <p className="text-sm text-muted-foreground">{perfil.descripcionProfesional}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Briefcase size={11} /> Experiencia
                  </p>
                  <p className="text-sm font-semibold mt-1">
                    {perfil.experiencia != null
                      ? `${perfil.experiencia} ${perfil.experiencia === 1 ? "año" : "años"}`
                      : "No especificada"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 size={11} /> Trabajos
                  </p>
                  <p className="text-sm font-semibold mt-1">{perfil.trabajosCompletados} completados</p>
                </CardContent>
              </Card>
            </div>

            {perfil.zonasCobertura.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
                  <MapPin size={11} /> Zonas de cobertura
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {perfil.zonasCobertura.map((zona) => (
                    <Badge key={zona} variant="outline" className="text-xs">
                      {zona}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2">
                <MessageSquare size={11} /> Reseñas de clientes
              </p>
              {calificaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Todavía no tiene reseñas.
                </p>
              ) : (
                <div className="space-y-2">
                  {calificaciones.map((c) => (
                    <div key={c.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Estrellas valor={c.estrellas} />
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.clienteNombre} · {tipoLabel(c.tipo)}
                      </p>
                      {c.comentario && (
                        <p className="text-sm mt-2 whitespace-pre-line">{c.comentario}</p>
                      )}
                      {c.etiquetas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.etiquetas.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
