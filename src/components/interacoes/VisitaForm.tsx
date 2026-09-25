import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/comprovantes/CameraCapture";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect } from "react";

interface VisitaFormProps {
  foto: File | null;
  onFotoChange: (file: File | null) => void;
  onCoordenadasChange: (coords: { latitude: number; longitude: number } | null) => void;
}

/**
 * Campos específicos exibidos quando o tipo de interação é "Visita":
 * captura automática de geolocalização e registro de foto.
 */
export function VisitaForm({ foto, onFotoChange, onCoordenadasChange }: VisitaFormProps) {
  const { coordenadas, obtendo, erro, obterLocalizacao } = useGeolocation();

  useEffect(() => {
    obterLocalizacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onCoordenadasChange(coordenadas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordenadas]);

  const previewUrl = foto ? URL.createObjectURL(foto) : null;

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          {obtendo && <span className="text-muted-foreground">Obtendo localização...</span>}
          {!obtendo && coordenadas && (
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Localização registrada ({coordenadas.latitude.toFixed(5)}, {coordenadas.longitude.toFixed(5)})
            </span>
          )}
          {!obtendo && erro && <span className="text-destructive">{erro}</span>}
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={obterLocalizacao} disabled={obtendo}>
          {obtendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Atualizar"}
        </Button>
      </div>

      <div>
        {foto ? (
          <div className="relative">
            <img src={previewUrl ?? ""} alt="Foto da visita" className="max-h-40 rounded-md object-contain" />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => onFotoChange(null)}
            >
              Remover foto
            </Button>
          </div>
        ) : (
          <CameraCapture onCapture={onFotoChange} />
        )}
      </div>
    </div>
  );
}
