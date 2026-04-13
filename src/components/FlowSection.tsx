import { CheckCircle, CreditCard, FileText, MessageSquare, PlayCircle } from "lucide-react";

const flowSteps = [
  { icon: FileText, label: "Publicación", desc: "Describe tu proyecto", color: "bg-primary text-primary-foreground" },
  { icon: MessageSquare, label: "Oferta", desc: "Recibe propuestas", color: "bg-primary/80 text-primary-foreground" },
  { icon: CreditCard, label: "Pago seguro", desc: "Escrow protegido", color: "bg-warning text-warning-foreground" },
  { icon: PlayCircle, label: "Ejecución", desc: "Trabajo en curso", color: "bg-success/80 text-success-foreground" },
  { icon: CheckCircle, label: "Finalización", desc: "Libera el pago", color: "bg-success text-success-foreground" },
];

const FlowSection = () => {
  return (
    <section className="section-padding bg-secondary/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Flujo completo
          </p>
          <h2 className="section-title">De la idea al trabajo terminado</h2>
          <p className="section-subtitle mx-auto mt-4">
            Un proceso transparente de principio a fin
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-0">
              <div className="flex flex-col items-center gap-2 min-w-[100px]">
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
                  <step.icon size={28} />
                </div>
                <span className="text-sm font-bold text-foreground">{step.label}</span>
                <span className="text-xs text-muted-foreground">{step.desc}</span>
              </div>
              {i < flowSteps.length - 1 && (
                <div className="hidden md:flex items-center mx-3">
                  <div className="w-10 h-0.5 bg-border" />
                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-t-transparent border-b-transparent border-l-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlowSection;
