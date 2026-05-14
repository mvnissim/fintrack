export interface Categoria {
  id: string
  user_id: string
  nome: string
  cor: string
  icone?: string
  created_at: string
}

export interface DespesaFixa {
  id: string
  user_id: string
  descricao: string
  categoria_id?: string
  valores: Record<string, number>
  ativo: boolean
  created_at: string
  categorias?: Categoria
}

export interface Parcela {
  id: string
  user_id: string
  descricao: string
  categoria_id?: string
  valor_parcela: number
  total_parcelas: number
  parcela_inicial: number
  mes_inicio: string
  created_at: string
  categorias?: Categoria
}

export interface GastoCartao {
  id: string
  user_id: string
  mes: string
  valor_estimado?: number
  valor_real?: number
  created_at: string
}

export interface Investimento {
  id: string
  user_id: string
  mes: string
  tipo: 'renda_fixa' | 'renda_variavel' | 'outro'
  descricao?: string
  meta?: number
  realizado?: number
  created_at: string
}

export interface Receita {
  id: string
  user_id: string
  mes: string
  descricao: string
  valor: number
  created_at: string
}

export interface DashboardData {
  totalReceitas: number
  totalDespesasFixas: number
  totalParcelas: number
  totalCartao: number
  totalComprometido: number
  saldoLivre: number
  totalInvestido: number
  percentualComprometido: number
  categoriaData: { nome: string; valor: number; cor: string }[]
  topGastos: { descricao: string; valor: number; categoria?: string }[]
}
