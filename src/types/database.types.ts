// ============================================================
// Tipos gerados manualmente a partir do schema Supabase (ELO).
// Caso o schema mude, regenere com:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
// ============================================================

export type Perfil = "administrador" | "operador";
export type ClienteStatus = "Ativo" | "Inativo" | "Em Negociação";
export type NegociacaoStatus =
  | "Aguardando Pagamento"
  | "Pago"
  | "Vencido"
  | "Em Acompanhamento";
export type ComprovanteTipo = "Conta" | "Comprovante";
export type InteracaoTipo = "Ligação" | "WhatsApp" | "Visita" | "Negociação";
export type AlertaStatus = "Pendente" | "Enviado" | "Resolvido";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          perfil: Perfil;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          nome: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          matricula: string;
          nome: string;
          telefone: string | null;
          endereco: string | null;
          email: string | null;
          cpf: string | null;
          status: ClienteStatus;
          operador_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clientes"]["Row"]> & {
          matricula: string;
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Row"]>;
        Relationships: [];
      };
      negociacoes: {
        Row: {
          id: string;
          cliente_id: string;
          valor_negociado: number;
          data_vencimento: string;
          status: NegociacaoStatus;
          observacao: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["negociacoes"]["Row"]> & {
          cliente_id: string;
          valor_negociado: number;
          data_vencimento: string;
        };
        Update: Partial<Database["public"]["Tables"]["negociacoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "negociacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      comprovantes: {
        Row: {
          id: string;
          cliente_id: string;
          negociacao_id: string | null;
          arquivo_url: string;
          arquivo_path: string;
          tipo: ComprovanteTipo;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["comprovantes"]["Row"]> & {
          cliente_id: string;
          arquivo_url: string;
          arquivo_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["comprovantes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "comprovantes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comprovantes_negociacao_id_fkey";
            columns: ["negociacao_id"];
            isOneToOne: false;
            referencedRelation: "negociacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      interacoes: {
        Row: {
          id: string;
          cliente_id: string;
          tipo: InteracaoTipo;
          descricao: string | null;
          latitude: number | null;
          longitude: number | null;
          foto_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["interacoes"]["Row"]> & {
          cliente_id: string;
          tipo: InteracaoTipo;
        };
        Update: Partial<Database["public"]["Tables"]["interacoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "interacoes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
        ];
      };
      alertas: {
        Row: {
          id: string;
          cliente_id: string;
          negociacao_id: string;
          data_alerta: string;
          status: AlertaStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["alertas"]["Row"]> & {
          cliente_id: string;
          negociacao_id: string;
          data_alerta: string;
        };
        Update: Partial<Database["public"]["Tables"]["alertas"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "alertas_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alertas_negociacao_id_fkey";
            columns: ["negociacao_id"];
            isOneToOne: false;
            referencedRelation: "negociacoes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      vw_dashboard_resumo: {
        Row: {
          clientes_total: number;
          negociacoes_ativas: number;
          valor_negociado_total: number;
          valor_recuperado_total: number;
          comprovantes_pendentes: number;
          negociacoes_vencidas: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      gerar_alertas_vencimento: {
        Args: Record<string, never>;
        Returns: { alertas_gerados: number; negociacoes_marcadas_vencidas: number }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
