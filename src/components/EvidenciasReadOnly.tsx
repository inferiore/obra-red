import { ImageIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SolicitudEstado } from "@/types/solicitud";

const ETAPAS = [
  { key: "antes" as const, label: "Antes" },
  { key: "durante" as const, label: "Durante" },
  { key: "despues" as const, label: "Después" },
];

interface Props {
  estado: SolicitudEstado;
  evidenciaAntes?: string[];
  evidenciaDurante?: string[];
  evidenciaDespues?: string[];
  evidenciaDisputa?: { url: string; autorUsername: string; createdAt: string }[];
}

const FotosVacias = ({ texto }: { texto: string }) => (
  <div className="rounded-md bg-muted/40 py-6 flex flex-col items-center justify-center text-muted-foreground">
    <ImageIcon size={20} className="mb-1 opacity-60" />
    <span className="text-xs">{texto}</span>
  </div>
);

const FotosGrid = ({ fotos }: { fotos: string[] }) =>
  fotos.length === 0 ? (
    <FotosVacias texto="Sin fotos en esta etapa" />
  ) : (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {fotos.map((src, i) => (
        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
          <img src={src} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );

// Vista de solo lectura de la evidencia por fases (antes/durante/después +
// disputa), para el panel de administrador: mismas pestañas que
// EvidenciasUploadDialog pero sin ningún control de subida — el admin nunca
// sube evidencia.
export const EvidenciasReadOnly = ({
  estado,
  evidenciaAntes = [],
  evidenciaDurante = [],
  evidenciaDespues = [],
  evidenciaDisputa = [],
}: Props) => {
  const mostrarTabDisputa = estado === "disputa" || evidenciaDisputa.length > 0;

  return (
    <Tabs defaultValue="antes">
      <TabsList className={cn("grid w-full", mostrarTabDisputa ? "grid-cols-4" : "grid-cols-3")}>
        {ETAPAS.map((etapa) => (
          <TabsTrigger key={etapa.key} value={etapa.key}>
            {etapa.label}
          </TabsTrigger>
        ))}
        {mostrarTabDisputa && (
          <TabsTrigger value="disputa" className="text-red-600 data-[state=active]:text-red-700">
            Disputa
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="antes">
        <FotosGrid fotos={evidenciaAntes} />
      </TabsContent>
      <TabsContent value="durante">
        <FotosGrid fotos={evidenciaDurante} />
      </TabsContent>
      <TabsContent value="despues">
        <FotosGrid fotos={evidenciaDespues} />
      </TabsContent>

      {mostrarTabDisputa && (
        <TabsContent value="disputa">
          {evidenciaDisputa.length === 0 ? (
            <FotosVacias texto="Aún no hay evidencia de disputa" />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {evidenciaDisputa.map((item, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={item.url} alt={`Disputa ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white px-1 py-0.5">
                    <p className="text-[9px] font-medium truncate">{item.autorUsername}</p>
                    <p className="text-[9px] opacity-80 truncate">
                      {new Date(item.createdAt).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      )}
    </Tabs>
  );
};
