import { ArrowRight, CheckCircle, CreditCard, FileText, MessageSquare, PlayCircle } from "lucide-react";

const flowSteps = [
  { icon: FileText, label: "Publicación", color: "bg-primary text-primary-foreground" },
  { icon: MessageSquare, label: "Oferta", color: "bg-primary/80 text-primary-foreground" },
  { icon: CreditCard, label: "Pago", color: "bg-warning text-warning-foreground" },
  { icon: PlayCircle, label: "Ejecución", color: "bg-success/80 text-success-foreground" },
  { icon: CheckCircle, label: "Finalización", color: "bg-success text-success-foreground" },
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

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
          {flowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 md:gap-2">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
                  <step.icon size={26} />
                </div>
                <span className="text-sm font-semibold text-foreground">{step.label}</span>
              </div>
              {i < flowSteps.length - 1 && (
                <ArrowRight className="text-muted-foreground hidden md:block mx-2" size={20} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlowSection;
