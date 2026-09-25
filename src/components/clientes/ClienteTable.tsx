import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, Eye, Phone } from "lucide-react";
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
import { ClienteStatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";
import type { Cliente } from "@/types";

interface ClienteTableProps {
  clientes: Cliente[];
  loading: boolean;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
}

export function ClienteTable({ clientes, loading, onEdit, onDelete }: ClienteTableProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cliente encontrado"
        description="Cadastre um novo cliente ou ajuste os filtros de busca."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matrícula</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Telefone</TableHead>
            <TableHead className="hidden xl:table-cell">Endereço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow
              key={cliente.id}
              className="cursor-pointer"
              onClick={() => navigate(`/clientes/${cliente.id}`)}
            >
              <TableCell className="font-medium">{cliente.matricula}</TableCell>
              <TableCell>{cliente.nome}</TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {cliente.telefone || "-"}
                </span>
              </TableCell>
              <TableCell className="hidden max-w-[220px] truncate xl:table-cell">
                {cliente.endereco || "-"}
              </TableCell>
              <TableCell>
                <ClienteStatusBadge status={cliente.status} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Ações">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/clientes/${cliente.id}`)}>
                      <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(cliente)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(cliente)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
