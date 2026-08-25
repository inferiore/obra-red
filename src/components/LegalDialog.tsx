import { ShieldCheck, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TERMINOS_SECCIONES, PRIVACIDAD_SECCIONES } from "@/lib/legal";

type LegalType = "terminos" | "privacidad";

interface LegalDialogProps {
  type: LegalType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LegalDialog = ({ type, open, onOpenChange }: LegalDialogProps) => {
  const isTerminos = type === "terminos";
  const titulo = isTerminos ? "Términos y Condiciones" : "Política de Privacidad";
  const subtitulo = isTerminos
    ? "Términos y Condiciones de uso de la plataforma ObraRed."
    : "Cómo tratamos y protegemos tus datos personales.";
  const items = isTerminos ? TERMINOS_SECCIONES : PRIVACIDAD_SECCIONES;
  const Icon = isTerminos ? FileText : ShieldCheck;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[85vh] sm:h-auto sm:max-h-[85vh] grid-rows-[auto_1fr_auto] grid">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg md:text-xl">{titulo}</DialogTitle>
              <DialogDescription className="text-xs md:text-sm mt-0.5">
                {subtitulo}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 px-6 py-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.titulo}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {item.titulo}
                </h3>
                <div className="space-y-2">
                  {item.parrafos.map((p, i) => (
                    <p
                      key={i}
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button
            type="button"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalDialog;
