import { useEffect, useState } from "react";
import * as alertasService from "@/services/alertasService";

export function useAlertasPendentesCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    alertasService
      .contarAlertasPendentes()
      .then((total) => {
        if (mounted) setCount(total);
      })
      .catch(() => {
        if (mounted) setCount(0);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { count };
}
