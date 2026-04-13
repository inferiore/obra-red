import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const StickyMobileCTA = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 safe-area-pb">
      <Button size="lg" className="w-full gap-2 rounded-2xl py-5 text-base shadow-lg">
        Publicar trabajo gratis
        <ArrowRight size={18} />
      </Button>
    </div>
  );
};

export default StickyMobileCTA;
