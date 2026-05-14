-- Script de importação de dados pessoais — mvnissim@gmail.com
-- Execute no SQL Editor: https://supabase.com/dashboard/project/wiytevedcegotbjupgvw/sql/new
-- ATENÇÃO: limpa todos os dados do usuário antes de reinserir

DO $$
DECLARE
  uid uuid;
  cat_educacao   uuid; cat_casa      uuid; cat_tenis    uuid;
  cat_saude      uuid; cat_lazer     uuid; cat_transporte uuid;
  cat_vestuario  uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'mvnissim@gmail.com';
  IF uid IS NULL THEN RAISE EXCEPTION 'Usuário não encontrado'; END IF;

  -- Limpa dados existentes
  DELETE FROM despesas_fixas WHERE user_id = uid;
  DELETE FROM parcelas       WHERE user_id = uid;
  DELETE FROM gastos_cartao  WHERE user_id = uid;
  DELETE FROM investimentos  WHERE user_id = uid;
  DELETE FROM receitas       WHERE user_id = uid;
  DELETE FROM categorias     WHERE user_id = uid;

  -- Categorias
  INSERT INTO categorias (user_id, nome, cor, icone) VALUES
    (uid, 'Educação',   '#854F0B', 'BookOpen'),
    (uid, 'Casa',       '#185FA5', 'Home'),
    (uid, 'Tênis',      '#0F6E56', 'Activity'),
    (uid, 'Saúde',      '#A32D2D', 'Heart'),
    (uid, 'Lazer',      '#6B21A8', 'Star'),
    (uid, 'Alimentação','#92400E', 'Coffee'),
    (uid, 'Transporte', '#0369A1', 'Car'),
    (uid, 'Vestuário',  '#9D174D', 'ShoppingBag');

  SELECT id INTO cat_educacao   FROM categorias WHERE user_id = uid AND nome = 'Educação';
  SELECT id INTO cat_casa       FROM categorias WHERE user_id = uid AND nome = 'Casa';
  SELECT id INTO cat_tenis      FROM categorias WHERE user_id = uid AND nome = 'Tênis';
  SELECT id INTO cat_saude      FROM categorias WHERE user_id = uid AND nome = 'Saúde';
  SELECT id INTO cat_lazer      FROM categorias WHERE user_id = uid AND nome = 'Lazer';
  SELECT id INTO cat_transporte FROM categorias WHERE user_id = uid AND nome = 'Transporte';
  SELECT id INTO cat_vestuario  FROM categorias WHERE user_id = uid AND nome = 'Vestuário';

  -- Despesas Fixas (valores reais Jan-Dez 2026)
  INSERT INTO despesas_fixas (user_id, descricao, categoria_id, valores, ativo) VALUES
  (uid, 'Escola', cat_educacao, '{"2026-02":1492.60,"2026-03":1492.60,"2026-04":1492.60,"2026-05":1492.60,"2026-06":1492.60,"2026-07":1492.60,"2026-08":1492.60,"2026-09":1492.60,"2026-10":1492.60,"2026-11":1492.60,"2026-12":1492.60}'::jsonb, true),
  (uid, 'Água', cat_casa, '{"2026-01":300.00,"2026-02":350.00,"2026-03":350.00,"2026-04":550.00,"2026-05":450.00,"2026-06":350.00,"2026-07":350.00,"2026-08":350.00,"2026-09":350.00,"2026-10":350.00,"2026-11":350.00,"2026-12":350.00}'::jsonb, true),
  (uid, 'Energia', cat_casa, '{"2026-01":277.49,"2026-02":200.00,"2026-03":200.00,"2026-04":200.00,"2026-05":239.00,"2026-06":200.00,"2026-07":200.00,"2026-08":200.00,"2026-09":200.00,"2026-10":200.00,"2026-11":200.00,"2026-12":200.00}'::jsonb, true),
  (uid, 'Internet', cat_casa, '{"2026-01":100.00,"2026-02":100.00,"2026-03":100.00,"2026-04":100.00,"2026-05":100.00,"2026-06":100.00,"2026-07":100.00,"2026-08":100.00,"2026-09":100.00,"2026-10":100.00,"2026-11":100.00,"2026-12":100.00}'::jsonb, true),
  (uid, 'Aulas de Tênis - Natan', cat_tenis, '{"2026-01":800.00,"2026-02":800.00,"2026-03":800.00,"2026-04":800.00,"2026-05":800.00,"2026-06":800.00,"2026-07":800.00,"2026-08":800.00,"2026-09":800.00,"2026-10":800.00,"2026-11":800.00,"2026-12":800.00}'::jsonb, true),
  (uid, 'Conta Claro', cat_casa, '{"2026-01":79.00,"2026-02":79.00,"2026-03":79.00,"2026-04":79.00,"2026-05":79.00,"2026-06":79.00,"2026-07":79.00,"2026-08":79.00,"2026-09":79.00,"2026-10":79.00,"2026-11":79.00,"2026-12":79.00}'::jsonb, true),
  (uid, 'Academia Wellhub', cat_saude, '{"2026-01":189.90,"2026-02":189.90,"2026-03":189.90,"2026-04":189.90,"2026-05":199.00,"2026-06":199.00,"2026-07":199.00,"2026-08":199.00,"2026-09":199.00,"2026-10":199.00,"2026-11":199.00,"2026-12":199.00}'::jsonb, true),
  (uid, 'IPVA Carro', cat_transporte, '{"2026-04":509.21,"2026-05":509.21,"2026-06":509.21,"2026-07":1018.42,"2026-08":1018.42,"2026-09":1018.42,"2026-10":1018.42}'::jsonb, true),
  (uid, 'Aulas de Tênis - Mizukami', cat_tenis, '{"2026-01":700.00,"2026-02":700.00,"2026-03":700.00,"2026-04":700.00,"2026-05":700.00,"2026-06":700.00,"2026-07":700.00,"2026-08":700.00,"2026-09":700.00,"2026-10":700.00,"2026-11":700.00,"2026-12":700.00}'::jsonb, true),
  (uid, 'Aulas de Tênis - Ueslei AABB', cat_tenis, '{"2026-01":440.00,"2026-02":440.00,"2026-03":440.00,"2026-04":440.00,"2026-05":440.00,"2026-06":440.00,"2026-07":440.00,"2026-08":440.00,"2026-09":440.00,"2026-10":440.00,"2026-11":440.00,"2026-12":440.00}'::jsonb, true);

  -- Parcelas
  INSERT INTO parcelas (user_id, descricao, categoria_id, valor_parcela, total_parcelas, parcela_inicial, mes_inicio) VALUES
  (uid, 'Parcelamento Fiat Toro Volcano 2022', cat_transporte, 2891.66, 2,  1, '2026-01'),
  (uid, 'Assinatura Clube Wine (Anual)',        cat_lazer,      159.20,  8,  1, '2026-01'),
  (uid, 'Gastos Cartão Nubank (saldo ant.)',    cat_lazer,      986.56,  2,  1, '2026-01'),
  (uid, 'Raquete Beach Tênis (Daiane)',         cat_tenis,      210.00,  7,  1, '2026-01'),
  (uid, 'Crocs Miguel',                         cat_vestuario,  106.49,  2,  1, '2026-01'),
  (uid, 'Pneus Dianteiros (Fiat Toro)',         cat_transporte, 490.00,  2,  1, '2026-01'),
  (uid, 'Raquete Miguel Pure Aero Jr 25',       cat_tenis,      127.65,  9,  1, '2026-01'),
  (uid, 'Anuidade Clube de Tiro CTCI',          cat_lazer,      141.67,  11, 1, '2026-01'),
  (uid, 'Nike Araguaia Shopping',               cat_vestuario,  239.99,  2,  1, '2026-01'),
  (uid, 'Bateria Fiat Toro',                    cat_transporte, 325.00,  2,  1, '2026-01'),
  (uid, 'Bota de Compressão Relaxmedic',        cat_saude,      196.15,  12, 1, '2026-01'),
  (uid, 'Raqueteira Babolat X6 Pure Aero',      cat_tenis,      63.90,   10, 1, '2026-01'),
  (uid, 'Óculos de Grau',                       cat_saude,      160.00,  1,  1, '2026-01'),
  (uid, 'Borracharia do Guto',                  cat_transporte, 350.00,  2,  1, '2026-02'),
  (uid, 'Troca de Óleo/Filtros/Limpeza (Toro)', cat_transporte, 360.00,  2,  1, '2026-02'),
  (uid, 'Livros de Inglês KNN',                 cat_educacao,   502.01,  6,  1, '2026-02'),
  (uid, 'Zerando Sunset (Chile)',               cat_lazer,      200.00,  6,  1, '2026-02'),
  (uid, 'Hotel Fazenda 100spin (Carnaval)',      cat_lazer,      500.00,  2,  1, '2026-02'),
  (uid, 'Mensalidade KNN Nissim',               cat_educacao,   316.00,  10, 1, '2026-03'),
  (uid, 'Mensalidade KNN Miguel',               cat_educacao,   316.00,  10, 1, '2026-03'),
  (uid, 'Bitzee (Mãe)',                         cat_lazer,      77.00,   5,  1, '2026-03'),
  (uid, 'Manguito Nike (Amazon)',               cat_tenis,      89.10,   2,  1, '2026-04'),
  (uid, 'Tênis Adidas Barricade Silver',        cat_tenis,      81.30,   9,  1, '2026-04'),
  (uid, 'Camisas LuShoes ForMen',               cat_vestuario,  229.50,  4,  1, '2026-05'),
  (uid, 'Mala Kazan',                           cat_lazer,      199.95,  2,  1, '2026-05'),
  (uid, 'Republika',                            cat_lazer,      100.00,  2,  1, '2026-05'),
  (uid, 'Tela Notebook Dell',                   cat_casa,       132.01,  2,  1, '2026-05'),
  (uid, 'Tênis Adidas Daiane (Dia das Mães)',   cat_vestuario,  225.00,  4,  1, '2026-05'),
  (uid, 'Troca dos Bicos Injetores (Toro)',     cat_transporte, 1425.00, 4,  1, '2026-05'),
  (uid, 'Raquete Blade v10',                    cat_tenis,      219.00,  7,  1, '2026-06');

  -- Gastos Cartão Estimados
  INSERT INTO gastos_cartao (user_id, mes, valor_estimado) VALUES
  (uid,'2026-01',8325.35),(uid,'2026-02',6000.00),(uid,'2026-03',5834.00),
  (uid,'2026-04',8500.00),(uid,'2026-05',4302.91),(uid,'2026-06',4500.00),
  (uid,'2026-07',3500.00),(uid,'2026-08',3500.00),(uid,'2026-09',3500.00),
  (uid,'2026-10',3500.00),(uid,'2026-11',3500.00),(uid,'2026-12',3500.00);

  -- Investimentos
  INSERT INTO investimentos (user_id, mes, tipo, descricao, meta) VALUES
  (uid,'2026-01','renda_fixa','Renda Fixa',2000),(uid,'2026-01','renda_variavel','Renda Variável',500),
  (uid,'2026-02','renda_fixa','Renda Fixa',2000),(uid,'2026-02','renda_variavel','Renda Variável',500),
  (uid,'2026-03','renda_fixa','Renda Fixa',2000),(uid,'2026-03','renda_variavel','Renda Variável',500),
  (uid,'2026-04','renda_fixa','Renda Fixa',2000),(uid,'2026-04','renda_variavel','Renda Variável',500),
  (uid,'2026-05','renda_fixa','Renda Fixa',2000),(uid,'2026-05','renda_variavel','Renda Variável',500),
  (uid,'2026-06','renda_fixa','Renda Fixa',2000),(uid,'2026-06','renda_variavel','Renda Variável',500),
  (uid,'2026-07','renda_fixa','Renda Fixa',2000),(uid,'2026-07','renda_variavel','Renda Variável',500),
  (uid,'2026-08','renda_fixa','Renda Fixa',2000),(uid,'2026-08','renda_variavel','Renda Variável',500),
  (uid,'2026-09','renda_fixa','Renda Fixa',2000),(uid,'2026-09','renda_variavel','Renda Variável',500),
  (uid,'2026-10','renda_fixa','Renda Fixa',2000),(uid,'2026-10','renda_variavel','Renda Variável',500),
  (uid,'2026-11','renda_fixa','Renda Fixa',2000),(uid,'2026-11','renda_variavel','Renda Variável',500),
  (uid,'2026-12','renda_fixa','Renda Fixa',2000),(uid,'2026-12','renda_variavel','Renda Variável',500);

  RAISE NOTICE 'Dados importados com sucesso para %', uid;
END $$;
