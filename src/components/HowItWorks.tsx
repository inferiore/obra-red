import { FileText, MessageSquare, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Publica tu trabajo",
    description: "Describe lo que necesitas, establece tu presupuesto y publica en segundos.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Recibe ofertas",
    description: "Trabajadores verificados te enviarán sus propuestas con precio y plazo.",
    color: "bg-success/10 text-success",
  },
  {
    icon: ShieldCheck,
    title: "Contrata y paga seguro",
    description: "Elige la mejor oferta. Tu pago queda protegido hasta que el trabajo esté listo.",
    color: "bg-warning/10 text-warning",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Proceso simple
          </p>
          <h2 className="section-title">¿Cómo funciona?</h2>
          <p className="section-subtitle mx-auto mt-4">
            En solo 3 pasos consigue al profesional ideal para tu proyecto
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`glass-card p-8 text-center animate-fade-up-delay-${i + 1}`}
            >
              <div className="flex justify-center mb-6">
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center`}>
                  <step.icon size={28} />
                </div>
              </div>
              <div className="text-xs font-bold text-muted-foreground mb-2">
                PASO {i + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
