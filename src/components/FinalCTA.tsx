import { ArrowRight, ShieldCheck, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  return (
    <section className="section-padding" style={{ background: "var(--gradient-primary)" }}>
      <div className="container mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary-foreground/20 text-primary-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap size={16} />
          Registro gratuito — empieza en 2 minutos
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
          Empieza ahora con ObraRed
        </h2>
        <p className="text-lg md:text-xl text-primary-foreground/80 max-w-xl mx-auto mb-8">
          Únete a miles de personas que ya confían en ObraRed para conectar talento con oportunidades.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-card text-foreground hover:bg-card/90 gap-2 rounded-2xl px-8 py-6 text-base shadow-lg"
          >
            Publicar trabajo gratis
            <ArrowRight size={18} />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 rounded-2xl px-8 py-6 text-base"
          >
            Empezar a trabajar
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-primary-foreground/70">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Sin tarjeta de crédito
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            Cancela cuando quieras
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={14} />
            Publicación instantánea
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
