import { useState } from "react";
import { Camera, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import {
  TIPOS_TRABAJO,
  type TipoTrabajo,
  type SolicitudEstado,
  Solicitud,
} from "@/types/solicitud";

interface Props {
  onClose: () => void;
  solicitud?: Solicitud;
}

const MAX_FOTOS = 5;

export const SolicitudForm = ({ onClose, solicitud }: Props) => {
  const user = useAuthStore((s) => s.user);
  const crear = useSolicitudesStore((s) => s.crear);
  const actualizar = useSolicitudesStore((s) => s.actualizar);

  const { toast } = useToast();

  const [tipo, setTipo] = useState<TipoTrabajo | "">(solicitud?.tipo ?? "");
  const [descripcion, setDescripcion] = useState(solicitud?.descripcion ?? "");
  const [presupuesto, setPresupuesto] = useState(solicitud?.presupuesto ?? "");
  const [ubicacion, setUbicacion] = useState(solicitud?.ubicacion ?? "");
  const [fotos, setFotos] = useState<string[]>(
    solicitud?.id ? solicitud.fotos : []
  );

  const handleFotos = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_FOTOS - fotos.length;
    const arr = Array.from(files).slice(0, remaining);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setFotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFoto = (idx: number) =>
    setFotos((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (estado: SolicitudEstado) => {
    if (!user) return;
    if (!tipo || !descripcion.trim() || !presupuesto) {
      toast({
        title: "Faltan datos",
        description: "Completa tipo, descripción y presupuesto.",
        variant: "destructive",
      });
      return;
    }
    if (!ubicacion.trim() || ubicacion.trim().length < 5) {
      toast({
        title: "Ubicación inválida",
        description:
          "Indica la dirección exacta del servicio (mínimo 5 caracteres).",
        variant: "destructive",
      });
      return;
    }
    const presupuestoNum = Number(presupuesto);
    if (isNaN(presupuestoNum) || presupuestoNum <= 0) {
      toast({ title: "Presupuesto inválido", variant: "destructive" });
      return;
    }
    if (!solicitud?.id) {
      await crear({
        tipo: tipo as TipoTrabajo,
        descripcion: descripcion.trim(),
        presupuesto: presupuestoNum,
        ubicacion: ubicacion.trim(),
        fotos,
        estado,
      });
    } else {
      await actualizar({
        id: solicitud.id,
        tipo: tipo as TipoTrabajo,
        descripcion: descripcion.trim(),
        presupuesto: presupuestoNum,
        ubicacion: ubicacion.trim(),
        fotos,
        estado: estado,
      });
    }

    toast({
      title:
        estado === "publicado" ? "Solicitud publicada" : "Borrador guardado",
      description:
        estado === "publicado"
          ? "Los trabajadores ya pueden ver tu solicitud."
          : "Puedes editarla y publicarla luego.",
    });
    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Tipo de trabajo *</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoTrabajo)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecciona una actividad" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_TRABAJO.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción *</Label>
        <Textarea
          id="descripcion"
          placeholder="Describe el trabajo: alcance, materiales, plazos, ubicación general..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="presupuesto">Presupuesto (COP) *</Label>
        <Input
          id="presupuesto"
          type="number"
          inputMode="numeric"
          placeholder="500000"
          value={presupuesto}
          onChange={(e) => setPresupuesto(e.target.value)}
          className="h-11"
          min={0}
        />
        <p className="text-xs text-muted-foreground">
          Monto que estás dispuesto a pagar. Se retiene en escrow al aceptar
          oferta.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ubicacion">Ubicación exacta del servicio *</Label>
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            id="ubicacion"
            type="text"
            placeholder="Ej: Barrio Manga, Cra 21 #29-45, Cartagena"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="h-11 pl-9"
            maxLength={150}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Indica barrio, dirección y referencias para que el trabajador pueda
          llegar fácilmente.
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Fotos del inicio del trabajo ({fotos.length}/{MAX_FOTOS})
        </Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {fotos.map((src, i) => (
            <div
              key={i}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFoto(i)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar foto"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center cursor-pointer transition-colors text-muted-foreground hover:text-primary">
              <Camera size={20} />
              <span className="text-xs mt-1">Agregar</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFotos(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11"
          onClick={() => submit("borrador")}
        >
          Guardar borrador
        </Button>
        <Button
          type="button"
          className="flex-1 h-11"
          onClick={() => submit("publicado")}
        >
          Publicar solicitud
        </Button>
      </div>
    </div>
  );
};
