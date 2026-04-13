import { ArrowRight, Briefcase, TrendingUp, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Briefcase, title: "Trabajos constantes", desc: "Accede a nuevos proyectos todos los días" },
  { icon: Wallet, title: "Cobro garantizado", desc: "Recibe tu pago seguro al finalizar cada trabajo" },
  { icon: TrendingUp, title: "Crece tu reputación", desc: "Las buenas reseñas te traen más clientes" },
  { icon: Zap, title: "Sin complicaciones", desc: "Envía ofertas rápido y gestiona todo desde la app" },
];

const ForWorkers = () => {
  return (
    <section className="section-padding">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-sm font-bold text-success">CP</div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Carlos Pérez</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-warning text-xs">★</span>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">4.9 (127 trabajos)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {["Plomería", "Electricidad", "Gas"].map((s) => (
                  <div key={s} className="bg-secondary rounded-lg py-2 text-center text-xs font-medium text-secondary-foreground">
                    {s}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-success text-sm font-medium">✓ Verificado</span>
                <span className="text-sm font-semibold text-foreground">$45,000 ganados</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-success font-semibold text-sm uppercase tracking-wider mb-3">
              Para trabajadores
            </p>
            <h2 className="section-title mb-6">
              Encuentra clientes y crece tu negocio
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                    <b.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{b.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-8 gap-2 rounded-2xl px-8 py-6 bg-success hover:bg-success/90 text-success-foreground">
              Empezar a trabajar
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForWorkers;
