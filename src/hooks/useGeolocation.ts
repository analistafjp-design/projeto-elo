import { useCallback, useState } from "react";

interface Coordenadas {
  latitude: number;
  longitude: number;
}

interface UseGeolocationResult {
  coordenadas: Coordenadas | null;
  obtendo: boolean;
  erro: string | null;
  obterLocalizacao: () => Promise<Coordenadas | null>;
}

export function useGeolocation(): UseGeolocationResult {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [obtendo, setObtendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const obterLocalizacao = useCallback(async (): Promise<Coordenadas | null> => {
    if (!("geolocation" in navigator)) {
      setErro("Geolocalização não é suportada neste dispositivo.");
      return null;
    }

    setObtendo(true);
    setErro(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoordenadas(coords);
          setObtendo(false);
          resolve(coords);
        },
        (err) => {
          const mensagens: Record<number, string> = {
            1: "Permissão de localização negada. Habilite o acesso à localização para registrar a visita.",
            2: "Não foi possível obter sua localização no momento.",
            3: "Tempo esgotado ao tentar obter a localização.",
          };
          setErro(mensagens[err.code] ?? "Erro ao obter localização.");
          setObtendo(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  return { coordenadas, obtendo, erro, obterLocalizacao };
}
