import { Lock, ShieldCheck, Star, UserCheck } from "lucide-react";

const trustItems = [
  {
    icon: Lock,
    title: "Pago Escrow",
    description: "Tu dinero se retiene de forma segura hasta que confirmes que el trabajo está completo. Protección total.",
  },
  {
    icon: UserCheck,
    title: "Perfiles verificados",
    description: "Verificamos la identidad y antecedentes de cada trabajador registrado en la plataforma.",
  },
  {
    icon: Star,
    title: "Calificaciones reales",
    description: "Solo clientes que contrataron pueden dejar reseñas. Transparencia total para tomar mejores decisiones.",
  },
  {
    icon: ShieldCheck,
    title: "Soporte 24/7",
    description: "Nuestro equipo está disponible para resolver cualquier problema durante todo el proceso.",
  },
];

const TrustSection = () => {
  return (
    <section className="section-padding bg-foreground text-primary-foreground">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Seguridad y confianza
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Tu tranquilidad es nuestra prioridad
          </h2>
          <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto mt-4">
            Construimos ObraRed con la seguridad como pilar fundamental
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="bg-primary-foreground/5 backdrop-blur-sm border border-primary-foreground/10 rounded-2xl p-6 text-center hover:bg-primary-foreground/10 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-5">
                <item.icon size={26} />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
