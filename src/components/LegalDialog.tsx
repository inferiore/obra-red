import { ExternalLink, ShieldCheck, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type LegalType = "terminos" | "privacidad";

interface LegalDialogProps {
  type: LegalType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TERMINOS_RESUMEN: { titulo: string; texto: string }[] = [
  {
    titulo: "1. ¿Qué es ObraRed?",
    texto:
      "DIGITAL OBRARED S.A.S. es una plataforma tecnológica colombiana que conecta clientes con trabajadores independientes. ObraRed actúa únicamente como intermediario, no presta los servicios ni es empleador.",
  },
  {
    titulo: "2. Cómo funciona",
    texto:
      "El cliente publica una solicitud, los trabajadores ofertan, el cliente elige y el pago queda retenido en escrow. Una vez aprobada la evidencia del trabajo, se libera el pago al trabajador.",
  },
  {
    titulo: "3. Sin relación laboral",
    texto:
      "Los trabajadores son independientes, sin subordinación ni vínculo laboral con ObraRed. Cada uno responde por su afiliación a seguridad social, salud, pensión y riesgos laborales.",
  },
  {
    titulo: "4. Aceptación y cuenta",
    texto:
      "Al registrarte aceptas estos Términos. Tu cuenta es personal e intransferible y eres responsable de toda actividad realizada con tus credenciales. Solo mayores de 18 años.",
  },
  {
    titulo: "5. Pagos y comisiones",
    texto:
      "Los precios los definen los trabajadores. ObraRed puede cobrar comisiones por uso de la plataforma. En cancelaciones o disputas, ObraRed puede retener o reversar los pagos.",
  },
  {
    titulo: "6. Cancelaciones y disputas",
    texto:
      "Tras aceptar un servicio, ambas partes deben cumplir lo acordado. Las cancelaciones se evalúan caso a caso. ObraRed puede suspender cuentas por fraude, mal comportamiento o riesgo.",
  },
  {
    titulo: "7. Calificaciones y conducta",
    texto:
      "Clientes y trabajadores pueden calificarse mutuamente. ObraRed puede suspender cuentas por bajo desempeño, fraude o incumplimiento de los Términos.",
  },
  {
    titulo: "8. Modificaciones",
    texto:
      "ObraRed puede actualizar estos Términos en cualquier momento. Los cambios se notifican dentro de la app y el uso continuado implica aceptación.",
  },
];

const PRIVACIDAD_RESUMEN: { titulo: string; texto: string }[] = [
  {
    titulo: "1. Marco legal",
    texto:
      "Tratamos tus datos personales conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas vigentes en Colombia sobre protección de datos.",
  },
  {
    titulo: "2. Para qué usamos tus datos",
    texto:
      "Para permitir el acceso a la plataforma, conectar clientes con trabajadores, gestionar pagos, brindar soporte y cumplir obligaciones legales y contractuales.",
  },
  {
    titulo: "3. Tu autorización",
    texto:
      "Al registrarte autorizas previa, expresa e informadamente el tratamiento de tus datos para los fines descritos. Declaras que la información que entregas es veraz y está actualizada.",
  },
  {
    titulo: "4. Tus derechos",
    texto:
      "Puedes en cualquier momento conocer, actualizar, rectificar y suprimir tus datos, así como revocar la autorización, mediante los canales de contacto de ObraRed.",
  },
  {
    titulo: "5. Seguridad",
    texto:
      "ObraRed adopta medidas técnicas, humanas y administrativas para evitar la pérdida, adulteración, consulta o uso no autorizado de tu información.",
  },
];

const LegalDialog = ({ type, open, onOpenChange }: LegalDialogProps) => {
  const isTerminos = type === "terminos";
  const titulo = isTerminos ? "Términos y Condiciones" : "Política de Privacidad";
  const subtitulo = isTerminos
    ? "Resumen de las reglas que rigen el uso de la plataforma ObraRed."
    : "Resumen de cómo tratamos y protegemos tus datos personales.";
  const items = isTerminos ? TERMINOS_RESUMEN : PRIVACIDAD_RESUMEN;
  const Icon = isTerminos ? FileText : ShieldCheck;
  const fullPath = isTerminos ? "/terminos" : "/privacidad";

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

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.titulo}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {item.titulo}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.texto}
                </p>
              </div>
            ))}

            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-3">
                Este es un resumen. Consulta el documento completo para conocer
                todos los detalles legales.
              </p>
              <Button asChild variant="outline" className="gap-2">
                <Link
                  to={fullPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onOpenChange(false)}
                >
                  Ver documento completo
                  <ExternalLink size={14} />
                </Link>
              </Button>
            </div>
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/20">
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
