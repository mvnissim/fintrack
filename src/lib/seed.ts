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

  // ─── Categorias ───────────────────────────────────────────────────────────
  const categoriasData = [
    { nome: 'Educação',    cor: '#854F0B', icone: 'BookOpen' },
    { nome: 'Casa',        cor: '#185FA5', icone: 'Home' },
    { nome: 'Tênis',       cor: '#0F6E56', icone: 'Activity' },
    { nome: 'Saúde',       cor: '#A32D2D', icone: 'Heart' },
    { nome: 'Lazer',       cor: '#6B21A8', icone: 'Star' },
    { nome: 'Alimentação', cor: '#92400E', icone: 'Coffee' },
    { nome: 'Transporte',  cor: '#0369A1', icone: 'Car' },
    { nome: 'Vestuário',   cor: '#9D174D', icone: 'ShoppingBag' },
  ]

  const { data: cats } = await supabase
    .from('categorias')
    .insert(categoriasData.map(c => ({ ...c, user_id: userId })))
    .select()

  if (!cats) return

  const c: Record<string, string> = {}
  cats.forEach(cat => { c[cat.nome] = cat.id })

  // ─── Despesas Fixas (valores reais Jan-Dez 2026) ─────────────────────────
  const despesasFixas = [
    {
      descricao: 'Escola',
      categoria_id: c['Educação'],
      valores: {
        // Jan vazio (sem cobrança)
        '2026-02': 1492.60, '2026-03': 1492.60, '2026-04': 1492.60,
        '2026-05': 1492.60, '2026-06': 1492.60, '2026-07': 1492.60,
        '2026-08': 1492.60, '2026-09': 1492.60, '2026-10': 1492.60,
        '2026-11': 1492.60, '2026-12': 1492.60,
      },
    },
    {
      descricao: 'Água',
      categoria_id: c['Casa'],
      valores: {
        '2026-01': 300.00,  '2026-02': 350.00,  '2026-03': 350.00,
        '2026-04': 550.00,  '2026-05': 450.00,  '2026-06': 350.00,
        '2026-07': 350.00,  '2026-08': 350.00,  '2026-09': 350.00,
        '2026-10': 350.00,  '2026-11': 350.00,  '2026-12': 350.00,
      },
    },
    {
      descricao: 'Energia',
      categoria_id: c['Casa'],
      valores: {
        '2026-01': 277.49, '2026-02': 200.00, '2026-03': 200.00,
        '2026-04': 200.00, '2026-05': 239.00, '2026-06': 200.00,
        '2026-07': 200.00, '2026-08': 200.00, '2026-09': 200.00,
        '2026-10': 200.00, '2026-11': 200.00, '2026-12': 200.00,
      },
    },
    {
      descricao: 'Internet',
      categoria_id: c['Casa'],
      valores: {
        '2026-01': 100.00, '2026-02': 100.00, '2026-03': 100.00,
        '2026-04': 100.00, '2026-05': 100.00, '2026-06': 100.00,
        '2026-07': 100.00, '2026-08': 100.00, '2026-09': 100.00,
        '2026-10': 100.00, '2026-11': 100.00, '2026-12': 100.00,
      },
    },
    {
      descricao: 'Aulas de Tênis - Natan',
      categoria_id: c['Tênis'],
      valores: {
        '2026-01': 800.00, '2026-02': 800.00, '2026-03': 800.00,
        '2026-04': 800.00, '2026-05': 800.00, '2026-06': 800.00,
        '2026-07': 800.00, '2026-08': 800.00, '2026-09': 800.00,
        '2026-10': 800.00, '2026-11': 800.00, '2026-12': 800.00,
      },
    },
    {
      descricao: 'Conta Claro',
      categoria_id: c['Casa'],
      valores: {
        '2026-01': 79.00, '2026-02': 79.00, '2026-03': 79.00,
        '2026-04': 79.00, '2026-05': 79.00, '2026-06': 79.00,
        '2026-07': 79.00, '2026-08': 79.00, '2026-09': 79.00,
        '2026-10': 79.00, '2026-11': 79.00, '2026-12': 79.00,
      },
    },
    {
      descricao: 'Academia Wellhub',
      categoria_id: c['Saúde'],
      valores: {
        '2026-01': 189.90, '2026-02': 189.90, '2026-03': 189.90,
        '2026-04': 189.90, '2026-05': 199.00, '2026-06': 199.00,
        '2026-07': 199.00, '2026-08': 199.00, '2026-09': 199.00,
        '2026-10': 199.00, '2026-11': 199.00, '2026-12': 199.00,
      },
    },
    {
      descricao: 'IPVA Carro',
      categoria_id: c['Transporte'],
      valores: {
        '2026-04': 509.21,  '2026-05': 509.21,  '2026-06': 509.21,
        '2026-07': 1018.42, '2026-08': 1018.42, '2026-09': 1018.42,
        '2026-10': 1018.42,
      },
    },
    {
      descricao: 'Aulas de Tênis - Mizukami',
      categoria_id: c['Tênis'],
      valores: {
        '2026-01': 700.00, '2026-02': 700.00, '2026-03': 700.00,
        '2026-04': 700.00, '2026-05': 700.00, '2026-06': 700.00,
        '2026-07': 700.00, '2026-08': 700.00, '2026-09': 700.00,
        '2026-10': 700.00, '2026-11': 700.00, '2026-12': 700.00,
      },
    },
    {
      descricao: 'Aulas de Tênis - Ueslei AABB',
      categoria_id: c['Tênis'],
      valores: {
        '2026-01': 440.00, '2026-02': 440.00, '2026-03': 440.00,
        '2026-04': 440.00, '2026-05': 440.00, '2026-06': 440.00,
        '2026-07': 440.00, '2026-08': 440.00, '2026-09': 440.00,
        '2026-10': 440.00, '2026-11': 440.00, '2026-12': 440.00,
      },
    },
  ]

  await supabase.from('despesas_fixas').insert(
    despesasFixas.map(d => ({ ...d, user_id: userId, ativo: true }))
  )

  // ─── Parcelas (dados reais da planilha) ───────────────────────────────────
  const parcelas = [
    // Janeiro
    { descricao: 'Parcelamento Fiat Toro Volcano 2022', categoria_id: c['Transporte'],  valor_parcela: 2891.66, total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Assinatura Clube Wine (Anual)',        categoria_id: c['Lazer'],        valor_parcela: 159.20,  total_parcelas: 8,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Gastos Cartão Nubank (saldo ant.)',    categoria_id: c['Lazer'],        valor_parcela: 986.56,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Raquete Beach Tênis (Daiane)',         categoria_id: c['Tênis'],        valor_parcela: 210.00,  total_parcelas: 7,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Crocs Miguel',                         categoria_id: c['Vestuário'],    valor_parcela: 106.49,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Pneus Dianteiros (Fiat Toro)',         categoria_id: c['Transporte'],   valor_parcela: 490.00,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Raquete Miguel Pure Aero Jr 25',       categoria_id: c['Tênis'],        valor_parcela: 127.65,  total_parcelas: 9,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Anuidade Clube de Tiro CTCI',          categoria_id: c['Lazer'],        valor_parcela: 141.67,  total_parcelas: 11, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Nike Araguaia Shopping',               categoria_id: c['Vestuário'],    valor_parcela: 239.99,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Bateria Fiat Toro',                    categoria_id: c['Transporte'],   valor_parcela: 325.00,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Bota de Compressão Relaxmedic',        categoria_id: c['Saúde'],        valor_parcela: 196.15,  total_parcelas: 12, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Raqueteira Babolat X6 Pure Aero',      categoria_id: c['Tênis'],        valor_parcela: 63.90,   total_parcelas: 10, parcela_inicial: 1, mes_inicio: '2026-01' },
    { descricao: 'Óculos de Grau',                       categoria_id: c['Saúde'],        valor_parcela: 160.00,  total_parcelas: 1,  parcela_inicial: 1, mes_inicio: '2026-01' },
    // Fevereiro
    { descricao: 'Borracharia do Guto',                  categoria_id: c['Transporte'],   valor_parcela: 350.00,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-02' },
    { descricao: 'Troca de Óleo/Filtros/Limpeza (Toro)', categoria_id: c['Transporte'],   valor_parcela: 360.00,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-02' },
    { descricao: 'Livros de Inglês KNN',                 categoria_id: c['Educação'],     valor_parcela: 502.01,  total_parcelas: 6,  parcela_inicial: 1, mes_inicio: '2026-02' },
    { descricao: 'Zerando Sunset (Chile)',               categoria_id: c['Lazer'],        valor_parcela: 200.00,  total_parcelas: 6,  parcela_inicial: 1, mes_inicio: '2026-02' },
    { descricao: 'Hotel Fazenda 100spin (Carnaval)',      categoria_id: c['Lazer'],        valor_parcela: 500.00,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-02' },
    // Março
    { descricao: 'Mensalidade KNN Nissim',               categoria_id: c['Educação'],     valor_parcela: 316.00,  total_parcelas: 10, parcela_inicial: 1, mes_inicio: '2026-03' },
    { descricao: 'Mensalidade KNN Miguel',               categoria_id: c['Educação'],     valor_parcela: 316.00,  total_parcelas: 10, parcela_inicial: 1, mes_inicio: '2026-03' },
    { descricao: 'Bitzee (Mãe)',                         categoria_id: c['Lazer'],        valor_parcela: 77.00,   total_parcelas: 5,  parcela_inicial: 1, mes_inicio: '2026-03' },
    // Abril
    { descricao: 'Manguito Nike (Amazon)',               categoria_id: c['Tênis'],        valor_parcela: 89.10,   total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-04' },
    { descricao: 'Tênis Adidas Barricade Silver',        categoria_id: c['Tênis'],        valor_parcela: 81.30,   total_parcelas: 9,  parcela_inicial: 1, mes_inicio: '2026-04' },
    // Maio
    { descricao: 'Camisas LuShoes ForMen',               categoria_id: c['Vestuário'],    valor_parcela: 229.50,  total_parcelas: 4,  parcela_inicial: 1, mes_inicio: '2026-05' },
    { descricao: 'Mala Kazan',                           categoria_id: c['Lazer'],        valor_parcela: 199.95,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-05' },
    { descricao: 'Republika',                            categoria_id: c['Lazer'],        valor_parcela: 100.00,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-05' },
    { descricao: 'Tela Notebook Dell',                   categoria_id: c['Casa'],         valor_parcela: 132.01,  total_parcelas: 2,  parcela_inicial: 1, mes_inicio: '2026-05' },
    { descricao: 'Tênis Adidas Daiane (Dia das Mães)',   categoria_id: c['Vestuário'],    valor_parcela: 225.00,  total_parcelas: 4,  parcela_inicial: 1, mes_inicio: '2026-05' },
    { descricao: 'Troca dos Bicos Injetores (Toro)',     categoria_id: c['Transporte'],   valor_parcela: 1425.00, total_parcelas: 4,  parcela_inicial: 1, mes_inicio: '2026-05' },
    // Junho
    { descricao: 'Raquete Blade v10',                    categoria_id: c['Tênis'],        valor_parcela: 219.00,  total_parcelas: 7,  parcela_inicial: 1, mes_inicio: '2026-06' },
  ]

  await supabase.from('parcelas').insert(
    parcelas.map(p => ({ ...p, user_id: userId }))
  )

  // ─── Gastos Cartão Estimados (dados reais da planilha) ────────────────────
  const gastosCartao = [
    { mes: '2026-01', valor_estimado: 8325.35 },
    { mes: '2026-02', valor_estimado: 6000.00 },
    { mes: '2026-03', valor_estimado: 5834.00 },
    { mes: '2026-04', valor_estimado: 8500.00 },
    { mes: '2026-05', valor_estimado: 4302.91 },
    { mes: '2026-06', valor_estimado: 4500.00 },
    { mes: '2026-07', valor_estimado: 3500.00 },
    { mes: '2026-08', valor_estimado: 3500.00 },
    { mes: '2026-09', valor_estimado: 3500.00 },
    { mes: '2026-10', valor_estimado: 3500.00 },
    { mes: '2026-11', valor_estimado: 3500.00 },
    { mes: '2026-12', valor_estimado: 3500.00 },
  ]

  await supabase.from('gastos_cartao').insert(
    gastosCartao.map(g => ({ ...g, user_id: userId }))
  )

  // ─── Investimentos (dados reais da planilha) ──────────────────────────────
  const meses2026 = Array.from({ length: 12 }, (_, i) =>
    `2026-${String(i + 1).padStart(2, '0')}`
  )

  const investimentos = meses2026.flatMap(mes => [
    { mes, tipo: 'renda_fixa',    descricao: 'Renda Fixa',    meta: 2000.00, realizado: null },
    { mes, tipo: 'renda_variavel', descricao: 'Renda Variável', meta: 500.00,  realizado: null },
  ])

  await supabase.from('investimentos').insert(
    investimentos.map(i => ({ ...i, user_id: userId }))
  )
}
