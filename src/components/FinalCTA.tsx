import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  return (
    <section className="section-padding" style={{ background: "var(--gradient-primary)" }}>
      <div className="container mx-auto text-center">
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
            Publicar trabajo
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
      </div>
    </section>
  );
};

export default FinalCTA;
