import { ArrowRight, Clock, DollarSign, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Users, title: "Múltiples ofertas", desc: "Compara precios y perfiles antes de decidir" },
  { icon: ShieldIcon, title: "Pago protegido", desc: "Tu dinero se libera solo cuando estés satisfecho" },
  { icon: Star, title: "Profesionales verificados", desc: "Todos los trabajadores pasan por verificación" },
  { icon: Clock, title: "Rápido y fácil", desc: "Publica en minutos, recibe ofertas al instante" },
];

function ShieldIcon(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return <DollarSign {...props} />;
}

const ForClients = () => {
  return (
    <section id="explorar" className="section-padding bg-secondary/50">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
              Para clientes
            </p>
            <h2 className="section-title mb-6">
              Tu proyecto en las mejores manos
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <b.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{b.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-8 gap-2 rounded-2xl px-8 py-6">
              Publicar trabajo
              <ArrowRight size={18} />
            </Button>
          </div>

          <div className="relative">
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">JM</div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Juan Martínez</p>
                  <p className="text-xs text-muted-foreground">Necesita reparación de tubería</p>
                </div>
              </div>
              <div className="bg-secondary rounded-xl p-4 mb-3">
                <p className="text-sm font-medium text-foreground">Reparación de tubería en cocina</p>
                <p className="text-xs text-muted-foreground mt-1">Presupuesto: $500 - $1,500</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>📍 Ciudad de México</span>
                <span className="text-success font-medium">3 ofertas recibidas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForClients;
