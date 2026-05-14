import { createClient } from './supabase/client'

export async function seedInitialData(userId: string) {
  const supabase = createClient()

  // Check if already seeded
  const { data: existing } = await supabase
    .from('categorias')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existing && existing.length > 0) return

  // ─── Categorias padrão ────────────────────────────────────────────────────
  const categoriasData = [
    { nome: 'Casa',        cor: '#185FA5', icone: 'Home' },
    { nome: 'Alimentação', cor: '#92400E', icone: 'Coffee' },
    { nome: 'Saúde',       cor: '#A32D2D', icone: 'Heart' },
    { nome: 'Educação',    cor: '#854F0B', icone: 'BookOpen' },
    { nome: 'Transporte',  cor: '#0369A1', icone: 'Car' },
    { nome: 'Lazer',       cor: '#6B21A8', icone: 'Star' },
    { nome: 'Vestuário',   cor: '#9D174D', icone: 'ShoppingBag' },
    { nome: 'Outros',      cor: '#4B5563', icone: 'MoreHorizontal' },
  ]

  const { data: cats } = await supabase
    .from('categorias')
    .insert(categoriasData.map(c => ({ ...c, user_id: userId })))
    .select()

  if (!cats) return

  const c: Record<string, string> = {}
  cats.forEach(cat => { c[cat.nome] = cat.id })

  // ─── Despesas fixas comuns ────────────────────────────────────────────────
  const mes = new Date()
  const mesAtual = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`

  const despesasFixas = [
    { descricao: 'Água',       categoria_id: c['Casa'],  valores: { [mesAtual]: 150.00 } },
    { descricao: 'Energia',    categoria_id: c['Casa'],  valores: { [mesAtual]: 200.00 } },
    { descricao: 'Internet',   categoria_id: c['Casa'],  valores: { [mesAtual]: 100.00 } },
    { descricao: 'Streaming',  categoria_id: c['Lazer'], valores: { [mesAtual]: 55.90  } },
  ]

  await supabase.from('despesas_fixas').insert(
    despesasFixas.map(d => ({ ...d, user_id: userId, ativo: true }))
  )
}
