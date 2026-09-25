import { useCallback, useEffect, useState } from "react";
import * as clientesService from "@/services/clientesService";
import type { Cliente, ClienteFiltros, ClienteInsert, ClienteUpdate } from "@/types";

export function useClientes(filtros: ClienteFiltros = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const dados = await clientesService.listarClientes(filtros);
      setClientes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filtros)]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const criar = async (payload: ClienteInsert) => {
    const novo = await clientesService.criarCliente(payload);
    await carregar();
    return novo;
  };

  const atualizar = async (id: string, payload: ClienteUpdate) => {
    const atualizado = await clientesService.atualizarCliente(id, payload);
    await carregar();
    return atualizado;
  };

  const excluir = async (id: string) => {
    await clientesService.excluirCliente(id);
    await carregar();
  };

  return { clientes, loading, erro, recarregar: carregar, criar, atualizar, excluir };
}
