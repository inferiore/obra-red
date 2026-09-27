import {
  Lock,
  ShieldCheck,
  Star,
  UserCheck,
  BadgeCheck,
  CreditCard,
} from "lucide-react";

const trustItems = [
  {
    icon: Lock,
    title: "Pago Escrow",
    description:
      "Tu dinero se retiene de forma segura hasta que confirmes que el trabajo está completo. Protección total.",
    highlight: true,
  },
  {
    icon: UserCheck,
    title: "Perfiles verificados",
    description:
      "Verificamos la identidad y antecedentes de cada trabajador registrado en la plataforma.",
    highlight: false,
  },
  {
    icon: Star,
    title: "Calificaciones reales",
    description:
      "Solo clientes que contrataron pueden dejar reseñas. Transparencia total para tomar mejores decisiones.",
    highlight: false,
  },
  {
    icon: ShieldCheck,
    title: "Soporte 24/7",
    description:
      "Nuestro equipo está disponible para resolver cualquier problema durante todo el proceso.",
    highlight: false,
  },
];

const stats = [
  { value: "$2.5M+", label: "Transacciones protegidas" },
  { value: "99.8%", label: "Pagos exitosos" },
  { value: "0", label: "Fraudes reportados" },
  { value: "24/7", label: "Monitoreo activo" },
];

const TrustSection = () => {
  return (
    <section className="section-padding bg-foreground text-primary-foreground">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <ShieldCheck size={16} />
            Protección garantizada
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Tu tranquilidad es nuestra prioridad
          </h2>
          <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto mt-4">
            Construimos ObraRed con la seguridad como pilar fundamental
          </p>
        </div>

        {/* Escrow Explainer */}
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 md:p-12 mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={24} className="text-primary" />
                <h3 className="text-2xl font-bold">
                  ¿Cómo funciona el pago seguro?
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    text: "El cliente deposita el pago al aceptar una oferta",
                  },
                  {
                    step: "2",
                    text: "ObraRed retiene el dinero de forma segura (escrow)",
                  },
                  { step: "3", text: "El trabajador realiza el servicio" },
                  {
                    step: "4",
                    text: "El cliente confirma y se libera el pago",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <p className="text-primary-foreground/90">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock size={48} className="text-primary" />
              </div>
              <p className="text-center text-sm opacity-70 max-w-xs">
                Si no estás satisfecho, puedes solicitar un reembolso. Tu dinero
                siempre está protegido.
              </p>
              <div className="flex items-center gap-2 bg-success/20 text-success rounded-full px-4 py-2 text-sm font-medium">
                <BadgeCheck size={16} />
                Garantía de devolución
              </div>
            </div>
          </div>
        </div>
        {/* Trust Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className={`backdrop-blur-sm border rounded-2xl p-6 text-center transition-all duration-300 ${
                item.highlight
                  ? "bg-primary/15 border-primary/30 hover:bg-primary/20"
                  : "bg-primary-foreground/5 border-primary-foreground/10 hover:bg-primary-foreground/10"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-5">
                <item.icon size={26} />
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
