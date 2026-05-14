import { createClient } from './supabase/client'

export async function seedInitialData(userId: string) {
  const supabase = createClient()

  // Check if already seeded
  const { data: existing } = await supabase
    .from('despesas_fixas')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  // Create categories
  const categorias = [
    { nome: 'Educação', cor: '#854F0B', icone: 'BookOpen' },
    { nome: 'Casa', cor: '#185FA5', icone: 'Home' },
    { nome: 'Tênis', cor: '#0F6E56', icone: 'Activity' },
    { nome: 'Saúde', cor: '#A32D2D', icone: 'Heart' },
    { nome: 'Lazer', cor: '#6B21A8', icone: 'Star' },
    { nome: 'Alimentação', cor: '#92400E', icone: 'Coffee' },
  ]

  const { data: cats } = await supabase
    .from('categorias')
    .insert(categorias.map(c => ({ ...c, user_id: userId })))
    .select()

  if (!cats) return

  const catMap: Record<string, string> = {}
  cats.forEach(c => { catMap[c.nome] = c.id })

  // Despesas fixas de Janeiro/2026
  const despesasFixas = [
    { descricao: 'Escola', categoria_id: catMap['Educação'], valores: { '2026-01': 1492.60 } },
    { descricao: 'Água', categoria_id: catMap['Casa'], valores: { '2026-01': 300.00 } },
    { descricao: 'Energia', categoria_id: catMap['Casa'], valores: { '2026-01': 277.49 } },
    { descricao: 'Internet', categoria_id: catMap['Casa'], valores: { '2026-01': 100.00 } },
    { descricao: 'Aulas de Tênis - Natan', categoria_id: catMap['Tênis'], valores: { '2026-01': 800.00 } },
    { descricao: 'Conta Claro', categoria_id: catMap['Casa'], valores: { '2026-01': 79.00 } },
    { descricao: 'Academia Wellhub', categoria_id: catMap['Saúde'], valores: { '2026-01': 189.90 } },
    { descricao: 'Aulas de Tênis - Mizukami', categoria_id: catMap['Tênis'], valores: { '2026-01': 700.00 } },
    { descricao: 'Aulas de Tênis - Ueslei AABB', categoria_id: catMap['Tênis'], valores: { '2026-01': 440.00 } },
  ]

  await supabase
    .from('despesas_fixas')
    .insert(despesasFixas.map(d => ({ ...d, user_id: userId, ativo: true })))

  // Parcelas ativas
  const parcelas = [
    { descricao: 'Assinatura Clube Wine (Anual)', categoria_id: catMap['Lazer'], valor_parcela: 159.20, total_parcelas: 8, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Raquete Beach Tênis (Daiane)', categoria_id: catMap['Tênis'], valor_parcela: 210.00, total_parcelas: 7, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Raquete Miguel Pure Aero Jr 25', categoria_id: catMap['Tênis'], valor_parcela: 127.65, total_parcelas: 9, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Anuidade Clube de Tiro CTCI', categoria_id: catMap['Lazer'], valor_parcela: 141.67, total_parcelas: 11, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Bota de Compressão Relaxmedic', categoria_id: catMap['Saúde'], valor_parcela: 196.15, total_parcelas: 12, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Raqueteira Babolat X6', categoria_id: catMap['Tênis'], valor_parcela: 63.90, total_parcelas: 10, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Mensalidade KNN Nissim', categoria_id: catMap['Educação'], valor_parcela: 316.00, total_parcelas: 10, parcela_inicial: 1, mes_inicio: '2026-03' },
    { descricao: 'Mensalidade KNN Miguel', categoria_id: catMap['Educação'], valor_parcela: 316.00, total_parcelas: 10, parcela_inicial: 1, mes_inicio: '2026-03' },
    { descricao: 'Tênis Adidas Barricade Silver', categoria_id: catMap['Tênis'], valor_parcela: 81.30, total_parcelas: 9, parcela_inicial: 1, mes_inicio: '2026-04' },
    { descricao: 'Raquete Blade v10', categoria_id: catMap['Tênis'], valor_parcela: 219.00, total_parcelas: 7, parcela_inicial: 1, mes_inicio: '2026-06' },
  ]

  await supabase
    .from('parcelas')
    .insert(parcelas.map(p => ({ ...p, user_id: userId })))

  // Investimentos meta (para os próximos 12 meses a partir de jan/2026)
  const investimentosMeses = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    return `2026-${month}`
  })

  const investimentosData = investimentosMeses.flatMap(mes => [
    { mes, tipo: 'renda_fixa', descricao: 'Renda Fixa', meta: 2000.00, realizado: null },
    { mes, tipo: 'renda_variavel', descricao: 'Renda Variável', meta: 500.00, realizado: null },
  ])

  await supabase
    .from('investimentos')
    .insert(investimentosData.map(i => ({ ...i, user_id: userId })))
}
