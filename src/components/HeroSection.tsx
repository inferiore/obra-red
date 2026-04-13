import { ArrowRight, Search, ShieldCheck, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-illustration.jpg";

const HeroSection = () => {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 animate-fade-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Plataforma activa en tu ciudad
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
              Conecta con trabajadores{" "}
              <span className="gradient-text">confiables</span> en minutos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
              Publica tu trabajo, recibe ofertas y contrata al mejor profesional.
              Pago seguro garantizado.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button size="lg" className="text-base gap-2 px-8 py-6 rounded-2xl shadow-lg">
                Publicar trabajo gratis
                <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base gap-2 px-8 py-6 rounded-2xl"
              >
                <Search size={18} />
                Encontrar trabajo
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-success" />
                <span>Pago 100% seguro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-warning" />
                <span>4.9/5 satisfacción</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-primary" />
                <span className="font-semibold text-foreground">+2,500</span> usuarios activos
              </div>
            </div>
          </div>

          <div className="relative animate-fade-up-delay-2 hidden lg:block">
            <div className="relative animate-float">
              <img
                src={heroImg}
                alt="ObraRed marketplace de servicios en acción"
                width={1024}
                height={768}
                className="rounded-3xl shadow-[var(--shadow-elevated)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
