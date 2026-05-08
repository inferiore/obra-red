import { useEffect, useState } from "react";
import { Camera, Upload, X, CheckCircle2, ImageIcon, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Solicitud } from "@/types/solicitud";

const ETAPAS = [
  { key: "antes" as const, label: "Antes", desc: "Estado inicial del lugar" },
  { key: "durante" as const, label: "Durante", desc: "Trabajo en progreso" },
  { key: "despues" as const, label: "Después", desc: "Resultado final" },
];

type Etapa = (typeof ETAPAS)[number]["key"];

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEnviarParaRevision?: (id: string) => void;
}

export const EvidenciasUploadDialog = ({
  solicitud,
  open,
  onOpenChange,
  onEnviarParaRevision,
}: Props) => {
  const { toast } = useToast();
  const [evidencias, setEvidencias] = useState<Record<Etapa, string[]>>({
    antes: [],
    durante: [],
    despues: [],
  });
  const [nota, setNota] = useState("");

  useEffect(() => {
    if (open) {
      setEvidencias({ antes: [], durante: [], despues: [] });
      setNota("");
    }
  }, [open]);

  if (!solicitud) return null;

  const handleFile = (etapa: Etapa, files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - evidencias[etapa].length);
    Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) =>
      setEvidencias((prev) => ({ ...prev, [etapa]: [...prev[etapa], ...urls] })),
    );
  };

  const remove = (etapa: Etapa, i: number) => {
    setEvidencias((prev) => ({
      ...prev,
      [etapa]: prev[etapa].filter((_, idx) => idx !== i),
    }));
  };

  const totalEv = evidencias.antes.length + evidencias.durante.length + evidencias.despues.length;
  const completo = evidencias.despues.length > 0;

  const handleEnviar = () => {
    if (!completo) {
      toast({
        title: "Falta evidencia final",
        description: "Sube al menos una foto del resultado final.",
        variant: "destructive",
      });
      return;
    }
    onEnviarParaRevision?.(solicitud.id);
    toast({
      title: "Evidencias enviadas",
      description: "El cliente revisará el trabajo y aprobará la liberación del pago.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Camera size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl">Subir evidencias</DialogTitle>
              <DialogDescription>
                Documenta el trabajo en cada etapa para activar la liberación del pago.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {ETAPAS.map((etapa) => (
              <div key={etapa.key} className="rounded-xl border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{etapa.label}</p>
                    <p className="text-xs text-muted-foreground">{etapa.desc}</p>
                  </div>
                  <Badge variant={evidencias[etapa.key].length > 0 ? "default" : "outline"}>
                    {evidencias[etapa.key].length}/5
                  </Badge>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {evidencias[etapa.key].map((src, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                    >
                      <img src={src} alt={`${etapa.label} ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => remove(etapa.key, i)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Eliminar"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {evidencias[etapa.key].length < 5 && (
                    <label
                      className={cn(
                        "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/40 transition-colors",
                        "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Upload size={18} />
                      <span className="text-[10px] text-center px-1">Subir foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFile(etapa.key, e.target.files)}
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}

            <div className="rounded-xl border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Nota para el cliente (opcional)
              </p>
              <Textarea
                placeholder="Describe brevemente el trabajo realizado..."
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              <ImageIcon size={14} />
              <span>{totalEv} {totalEv === 1 ? "foto subida" : "fotos subidas"} en total</span>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-4 shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button variant="outline" className="sm:flex-1" onClick={() => onOpenChange(false)}>
            Guardar borrador
          </Button>
          <Button
            className="sm:flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-elevated"
            onClick={handleEnviar}
            disabled={!completo}
          >
            {completo ? <CheckCircle2 size={16} /> : <Send size={16} />}
            Enviar para revisión del cliente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
