import { MoreVertical, Pencil, Trash2, Handshake, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { NegociacaoStatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Negociacao, NegociacaoComCliente } from "@/types";

interface NegociacaoTableProps {
  negociacoes: (Negociacao | NegociacaoComCliente)[];
  loading: boolean;
  onEdit: (negociacao: Negociacao) => void;
  onDelete: (negociacao: Negociacao) => void;
  onLembrete?: (negociacao: NegociacaoComCliente) => void;
  mostrarCliente?: boolean;
}

export function NegociacaoTable({
  negociacoes,
  loading,
  onEdit,
  onDelete,
  onLembrete,
  mostrarCliente = false,
}: NegociacaoTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (negociacoes.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="Nenhuma negociação registrada"
        description="Registre uma negociação para começar a acompanhar o pagamento deste cliente."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            {mostrarCliente && <TableHead>Cliente</TableHead>}
            <TableHead>Valor</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Observação</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {negociacoes.map((neg) => {
            const dias = daysUntil(neg.data_vencimento);
            const comCliente = neg as NegociacaoComCliente;
            return (
              <TableRow key={neg.id}>
                {mostrarCliente && (
                  <TableCell className="font-medium">
                    {comCliente.cliente?.nome ?? "-"}
                    <p className="text-xs text-muted-foreground">{comCliente.cliente?.matricula}</p>
                  </TableCell>
                )}
                <TableCell className="font-medium">{formatCurrency(neg.valor_negociado)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      dias !== null && dias < 0 && neg.status !== "Pago" && "font-semibold text-destructive",
                    )}
                  >
                    {formatDate(neg.data_vencimento)}
                  </span>
                </TableCell>
                <TableCell>
                  <NegociacaoStatusBadge status={neg.status} />
                </TableCell>
                <TableCell className="hidden max-w-xs truncate lg:table-cell text-muted-foreground">
                  {neg.observacao || "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(neg)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      {onLembrete && (
                        <DropdownMenuItem onClick={() => onLembrete(comCliente)}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Enviar lembrete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(neg)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
