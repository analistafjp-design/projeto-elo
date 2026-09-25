import { useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

/**
 * Botão "Capturar Foto": em dispositivos móveis, o atributo `capture`
 * instrui o navegador a abrir diretamente a câmera nativa do aparelho
 * em vez do seletor de arquivos genérico.
 */
export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full sm:w-auto"
      >
        <Camera className="h-4 w-4" />
        Capturar Foto
      </Button>
    </>
  );
}
