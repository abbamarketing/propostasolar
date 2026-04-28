export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cities_irradiance: {
        Row: {
          cidade: string
          hsp_abr: number | null
          hsp_ago: number | null
          hsp_dez: number | null
          hsp_fev: number | null
          hsp_jan: number | null
          hsp_jul: number | null
          hsp_jun: number | null
          hsp_mai: number | null
          hsp_mar: number | null
          hsp_medio: number
          hsp_nov: number | null
          hsp_out: number | null
          hsp_set: number | null
          id: string
          uf: string
        }
        Insert: {
          cidade: string
          hsp_abr?: number | null
          hsp_ago?: number | null
          hsp_dez?: number | null
          hsp_fev?: number | null
          hsp_jan?: number | null
          hsp_jul?: number | null
          hsp_jun?: number | null
          hsp_mai?: number | null
          hsp_mar?: number | null
          hsp_medio: number
          hsp_nov?: number | null
          hsp_out?: number | null
          hsp_set?: number | null
          id?: string
          uf: string
        }
        Update: {
          cidade?: string
          hsp_abr?: number | null
          hsp_ago?: number | null
          hsp_dez?: number | null
          hsp_fev?: number | null
          hsp_jan?: number | null
          hsp_jul?: number | null
          hsp_jun?: number | null
          hsp_mai?: number | null
          hsp_mar?: number | null
          hsp_medio?: number
          hsp_nov?: number | null
          hsp_out?: number | null
          hsp_set?: number | null
          id?: string
          uf?: string
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          categoria: string
          client_id: string
          company_id: string
          created_at: string
          id: string
          mime_type: string | null
          nome_arquivo: string
          storage_path: string
          tamanho_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          categoria?: string
          client_id: string
          company_id: string
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          storage_path: string
          tamanho_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          categoria?: string
          client_id?: string
          company_id?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          storage_path?: string
          tamanho_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string
          concessionaria: string | null
          consumo_medio_kwh: number | null
          conta_luz_media: number | null
          conta_luz_url: string | null
          cpf_cnpj: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          nome: string
          nome_fantasia: string | null
          numero_instalacao: string | null
          observacoes: string | null
          rg_ie: string | null
          telefone: string | null
          tipo: string
          tipo_ligacao: string | null
          tipo_telhado: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          company_id: string
          concessionaria?: string | null
          consumo_medio_kwh?: number | null
          conta_luz_media?: number | null
          conta_luz_url?: string | null
          cpf_cnpj: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          nome: string
          nome_fantasia?: string | null
          numero_instalacao?: string | null
          observacoes?: string | null
          rg_ie?: string | null
          telefone?: string | null
          tipo: string
          tipo_ligacao?: string | null
          tipo_telhado?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string
          concessionaria?: string | null
          consumo_medio_kwh?: number | null
          conta_luz_media?: number | null
          conta_luz_url?: string | null
          cpf_cnpj?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          nome?: string
          nome_fantasia?: string | null
          numero_instalacao?: string | null
          observacoes?: string | null
          rg_ie?: string | null
          telefone?: string | null
          tipo?: string
          tipo_ligacao?: string | null
          tipo_telhado?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          inscricao_estadual: string | null
          logo_url: string | null
          nome_fantasia: string | null
          razao_social: string
          responsavel_tecnico_crea: string | null
          responsavel_tecnico_email: string | null
          responsavel_tecnico_nome: string | null
          site: string | null
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cnpj: string
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social: string
          responsavel_tecnico_crea?: string | null
          responsavel_tecnico_email?: string | null
          responsavel_tecnico_nome?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cnpj?: string
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          inscricao_estadual?: string | null
          logo_url?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          responsavel_tecnico_crea?: string | null
          responsavel_tecnico_email?: string | null
          responsavel_tecnico_nome?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      products_inverters: {
        Row: {
          ativo: boolean
          company_id: string
          created_at: string
          fases: string | null
          garantia_anos: number | null
          id: string
          marca: string
          modelo: string
          mppts: number | null
          potencia_kw: number
          preco_custo: number | null
          preco_venda: number | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          company_id: string
          created_at?: string
          fases?: string | null
          garantia_anos?: number | null
          id?: string
          marca: string
          modelo: string
          mppts?: number | null
          potencia_kw: number
          preco_custo?: number | null
          preco_venda?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          company_id?: string
          created_at?: string
          fases?: string | null
          garantia_anos?: number | null
          id?: string
          marca?: string
          modelo?: string
          mppts?: number | null
          potencia_kw?: number
          preco_custo?: number | null
          preco_venda?: number | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_inverters_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      products_modules: {
        Row: {
          ativo: boolean
          company_id: string
          created_at: string
          eficiencia_pct: number | null
          garantia_geracao_anos: number | null
          garantia_produto_anos: number | null
          id: string
          marca: string
          modelo: string
          potencia_w: number
          preco_custo: number | null
          preco_venda: number | null
          tecnologia: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          company_id: string
          created_at?: string
          eficiencia_pct?: number | null
          garantia_geracao_anos?: number | null
          garantia_produto_anos?: number | null
          id?: string
          marca: string
          modelo: string
          potencia_w: number
          preco_custo?: number | null
          preco_venda?: number | null
          tecnologia?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          company_id?: string
          created_at?: string
          eficiencia_pct?: number | null
          garantia_geracao_anos?: number | null
          garantia_produto_anos?: number | null
          id?: string
          marca?: string
          modelo?: string
          potencia_w?: number
          preco_custo?: number | null
          preco_venda?: number | null
          tecnologia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_financing_options: {
        Row: {
          banco: string | null
          entrada: number | null
          id: string
          incluir_proposta: boolean
          prazo_meses: number | null
          proposal_id: string
          taxa_mensal: number | null
          valor_parcela: number | null
          valor_total_financiado: number | null
        }
        Insert: {
          banco?: string | null
          entrada?: number | null
          id?: string
          incluir_proposta?: boolean
          prazo_meses?: number | null
          proposal_id: string
          taxa_mensal?: number | null
          valor_parcela?: number | null
          valor_total_financiado?: number | null
        }
        Update: {
          banco?: string | null
          entrada?: number | null
          id?: string
          incluir_proposta?: boolean
          prazo_meses?: number | null
          proposal_id?: string
          taxa_mensal?: number | null
          valor_parcela?: number | null
          valor_total_financiado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_financing_options_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          categoria: string | null
          descricao: string
          id: string
          ordem: number
          proposal_id: string
          quantidade: number | null
          unidade: string | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          categoria?: string | null
          descricao: string
          id?: string
          ordem: number
          proposal_id: string
          quantidade?: number | null
          unidade?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          categoria?: string | null
          descricao?: string
          id?: string
          ordem?: number
          proposal_id?: string
          quantidade?: number | null
          unidade?: string | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_photos: {
        Row: {
          id: string
          legenda: string | null
          ordem: number | null
          proposal_id: string
          url: string
        }
        Insert: {
          id?: string
          legenda?: string | null
          ordem?: number | null
          proposal_id: string
          url: string
        }
        Update: {
          id?: string
          legenda?: string | null
          ordem?: number | null
          proposal_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_photos_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          aceita_em: string | null
          cidade_projeto: string | null
          client_id: string
          co2_evitado_kg_ano: number | null
          company_id: string
          consumo_estimado_kwh: number | null
          created_at: string
          custo_cabos_protecoes: number | null
          custo_disponibilidade_kwh: number | null
          custo_estrutura: number | null
          custo_inversor: number | null
          custo_mao_obra: number | null
          custo_modulos: number | null
          custo_outros: number | null
          custo_projeto_art: number | null
          custo_total: number | null
          economia_anual: number | null
          economia_mensal: number | null
          energia_compensar_kwh: number | null
          enviada_em: string | null
          garantia_instalacao_anos: number
          garantia_inversor_anos: number | null
          garantia_modulo_anos: number | null
          geracao_estimada_anual: number | null
          geracao_estimada_mensal: number | null
          hsp_usado: number | null
          id: string
          inversor_id: string | null
          inversor_marca: string | null
          inversor_modelo: string | null
          inversor_potencia_kw: number | null
          kwp_instalado: number | null
          kwp_necessario: number | null
          margem_pct: number | null
          modulo_id: string | null
          modulo_marca: string | null
          modulo_modelo: string | null
          modulo_potencia_w: number | null
          numero: string | null
          observacoes_comerciais: string | null
          payback_anos: number | null
          payback_descontado_anos: number | null
          pdf_url: string | null
          performance_ratio: number | null
          personalizar_garantias: boolean
          prazo_execucao_dias_uteis: number
          prazo_homologacao_dias: number
          qtd_inversores: number | null
          qtd_modulos: number | null
          recusada_em: string | null
          status: string
          tarifa_kwh: number | null
          template: string | null
          uf_projeto: string | null
          updated_at: string
          validade_dias: number | null
          valido_ate: string | null
          valor_a_vista: number | null
          valor_total: number | null
          vendedor_id: string | null
        }
        Insert: {
          aceita_em?: string | null
          cidade_projeto?: string | null
          client_id: string
          co2_evitado_kg_ano?: number | null
          company_id: string
          consumo_estimado_kwh?: number | null
          created_at?: string
          custo_cabos_protecoes?: number | null
          custo_disponibilidade_kwh?: number | null
          custo_estrutura?: number | null
          custo_inversor?: number | null
          custo_mao_obra?: number | null
          custo_modulos?: number | null
          custo_outros?: number | null
          custo_projeto_art?: number | null
          custo_total?: number | null
          economia_anual?: number | null
          economia_mensal?: number | null
          energia_compensar_kwh?: number | null
          enviada_em?: string | null
          garantia_instalacao_anos?: number
          garantia_inversor_anos?: number | null
          garantia_modulo_anos?: number | null
          geracao_estimada_anual?: number | null
          geracao_estimada_mensal?: number | null
          hsp_usado?: number | null
          id?: string
          inversor_id?: string | null
          inversor_marca?: string | null
          inversor_modelo?: string | null
          inversor_potencia_kw?: number | null
          kwp_instalado?: number | null
          kwp_necessario?: number | null
          margem_pct?: number | null
          modulo_id?: string | null
          modulo_marca?: string | null
          modulo_modelo?: string | null
          modulo_potencia_w?: number | null
          numero?: string | null
          observacoes_comerciais?: string | null
          payback_anos?: number | null
          payback_descontado_anos?: number | null
          pdf_url?: string | null
          performance_ratio?: number | null
          personalizar_garantias?: boolean
          prazo_execucao_dias_uteis?: number
          prazo_homologacao_dias?: number
          qtd_inversores?: number | null
          qtd_modulos?: number | null
          recusada_em?: string | null
          status?: string
          tarifa_kwh?: number | null
          template?: string | null
          uf_projeto?: string | null
          updated_at?: string
          validade_dias?: number | null
          valido_ate?: string | null
          valor_a_vista?: number | null
          valor_total?: number | null
          vendedor_id?: string | null
        }
        Update: {
          aceita_em?: string | null
          cidade_projeto?: string | null
          client_id?: string
          co2_evitado_kg_ano?: number | null
          company_id?: string
          consumo_estimado_kwh?: number | null
          created_at?: string
          custo_cabos_protecoes?: number | null
          custo_disponibilidade_kwh?: number | null
          custo_estrutura?: number | null
          custo_inversor?: number | null
          custo_mao_obra?: number | null
          custo_modulos?: number | null
          custo_outros?: number | null
          custo_projeto_art?: number | null
          custo_total?: number | null
          economia_anual?: number | null
          economia_mensal?: number | null
          energia_compensar_kwh?: number | null
          enviada_em?: string | null
          garantia_instalacao_anos?: number
          garantia_inversor_anos?: number | null
          garantia_modulo_anos?: number | null
          geracao_estimada_anual?: number | null
          geracao_estimada_mensal?: number | null
          hsp_usado?: number | null
          id?: string
          inversor_id?: string | null
          inversor_marca?: string | null
          inversor_modelo?: string | null
          inversor_potencia_kw?: number | null
          kwp_instalado?: number | null
          kwp_necessario?: number | null
          margem_pct?: number | null
          modulo_id?: string | null
          modulo_marca?: string | null
          modulo_modelo?: string | null
          modulo_potencia_w?: number | null
          numero?: string | null
          observacoes_comerciais?: string | null
          payback_anos?: number | null
          payback_descontado_anos?: number | null
          pdf_url?: string | null
          performance_ratio?: number | null
          personalizar_garantias?: boolean
          prazo_execucao_dias_uteis?: number
          prazo_homologacao_dias?: number
          qtd_inversores?: number | null
          qtd_modulos?: number | null
          recusada_em?: string | null
          status?: string
          tarifa_kwh?: number | null
          template?: string | null
          uf_projeto?: string | null
          updated_at?: string
          validade_dias?: number | null
          valido_ate?: string | null
          valor_a_vista?: number | null
          valor_total?: number | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_inversor_id_fkey"
            columns: ["inversor_id"]
            isOneToOne: false
            referencedRelation: "products_inverters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "products_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      structure_costs: {
        Row: {
          company_id: string | null
          custo_por_placa: number
          id: string
          placas_max: number
          placas_min: number
          tipo_telhado: string
        }
        Insert: {
          company_id?: string | null
          custo_por_placa: number
          id?: string
          placas_max: number
          placas_min: number
          tipo_telhado: string
        }
        Update: {
          company_id?: string | null
          custo_por_placa?: number
          id?: string
          placas_max?: number
          placas_min?: number
          tipo_telhado?: string
        }
        Relationships: [
          {
            foreignKeyName: "structure_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tariffs: {
        Row: {
          atualizado_em: string
          bandeira_atual: string | null
          classe: string | null
          concessionaria: string
          id: string
          subgrupo: string | null
          uf: string
          valor_kwh: number
        }
        Insert: {
          atualizado_em: string
          bandeira_atual?: string | null
          classe?: string | null
          concessionaria: string
          id?: string
          subgrupo?: string | null
          uf: string
          valor_kwh: number
        }
        Update: {
          atualizado_em?: string
          bandeira_atual?: string | null
          classe?: string | null
          concessionaria?: string
          id?: string
          subgrupo?: string | null
          uf?: string
          valor_kwh?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          cargo: string | null
          company_id: string | null
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          cargo?: string | null
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "vendedor" | "gestor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "vendedor", "gestor"],
    },
  },
} as const
