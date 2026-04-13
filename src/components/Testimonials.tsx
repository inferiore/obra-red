import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "María González",
    role: "Cliente",
    text: "Necesitaba un electricista urgente y en 20 minutos ya tenía 4 ofertas. Increíble servicio y el pago seguro me dio mucha tranquilidad.",
    rating: 5,
    initials: "MG",
    saved: "$2,300",
    label: "Ahorró comparando ofertas",
  },
  {
    name: "Roberto Silva",
    role: "Carpintero",
    text: "Desde que me uní a ObraRed he duplicado mis ingresos. Los clientes confían más porque ven mis reseñas y verificación.",
    rating: 5,
    initials: "RS",
    saved: "2x",
    label: "Duplicó sus ingresos",
  },
  {
    name: "Ana Rodríguez",
    role: "Cliente",
    text: "Renové toda mi cocina a través de ObraRed. El sistema de escrow me dio la confianza para contratar sin miedo.",
    rating: 5,
    initials: "AR",
    saved: "100%",
    label: "Satisfacción total",
  },
];

const Testimonials = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Testimonios
          </p>
          <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
          <p className="section-subtitle mx-auto mt-4">
            Historias reales de personas que confían en ObraRed
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card p-8 flex flex-col">
              <Quote size={24} className="text-primary/30 mb-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6 flex-1">"{t.text}"</p>
              <div className="bg-success/10 rounded-xl px-4 py-3 mb-6">
                <p className="text-success font-bold text-lg">{t.saved}</p>
                <p className="text-success/80 text-xs">{t.label}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
