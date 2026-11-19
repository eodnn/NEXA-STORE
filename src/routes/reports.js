
const router = require('express').Router();
const pool = require('../config/db');

const asyncRoute = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ==========================================
// DASHBOARD - VISAO GERAL
// ==========================================

router.get('/dashboard', asyncRoute(async (req, res) => {

  // Indicadores principais
  const [kpis] = await pool.query(`
    SELECT
      (SELECT COALESCE(SUM(total), 0)
       FROM vendas
       WHERE status = 'concluida') AS faturamento_total,

      (SELECT COALESCE(SUM(total), 0)
       FROM vendas
       WHERE status = 'concluida'
       AND criada_em >= DATE_FORMAT(CURDATE(), '%Y-%m-01'))
       AS faturamento_mes,

      (SELECT COUNT(*)
       FROM vendas
       WHERE status = 'concluida') AS total_vendas,

      (SELECT COALESCE(AVG(total), 0)
       FROM vendas
       WHERE status = 'concluida') AS ticket_medio,

      (SELECT COUNT(*)
       FROM produtos
       WHERE ativo = 1) AS produtos_ativos,

      (SELECT COUNT(*)
       FROM produtos
       WHERE ativo = 1
       AND estoque <= estoque_minimo) AS estoque_baixo
  `);

  // Faturamento diario - GROUP BY corrigido
  const [daily] = await pool.query(`
    SELECT
      DATE_FORMAT(criada_em, '%Y-%m-%d') AS dia,
      COUNT(*) AS quantidade,
      ROUND(SUM(total), 2) AS faturamento
    FROM vendas
    WHERE status = 'concluida'
      AND criada_em >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
    GROUP BY DATE_FORMAT(criada_em, '%Y-%m-%d')
    ORDER BY dia
  `);

  // Produtos mais vendidos
  const [top] = await pool.query(`
    SELECT
      p.nome,
      SUM(i.quantidade) AS quantidade,
      ROUND(SUM(i.total), 2) AS faturamento
    FROM itens_venda i
    JOIN vendas v ON v.id = i.venda_id
    JOIN produtos p ON p.id = i.produto_id
    WHERE v.status = 'concluida'
    GROUP BY p.id, p.nome
    ORDER BY quantidade DESC
    LIMIT 6
  `);

  // Faturamento por categoria
  const [categories] = await pool.query(`
    SELECT
      c.nome,
      ROUND(
        COALESCE(
          SUM(
            CASE
              WHEN v.id IS NOT NULL THEN i.total
              ELSE 0
            END
          ), 0
        ), 2
      ) AS valor
    FROM categorias c
    LEFT JOIN produtos p ON p.categoria_id = c.id
    LEFT JOIN itens_venda i ON i.produto_id = p.id
    LEFT JOIN vendas v
      ON v.id = i.venda_id
      AND v.status = 'concluida'
    GROUP BY c.id, c.nome
    ORDER BY valor DESC
  `);

  // Ultimas vendas
  const [recent] = await pool.query(`
    SELECT
      v.id,
      v.codigo,
      v.total,
      v.criada_em,
      COALESCE(c.nome, 'Consumidor final') AS cliente_nome,
      v.status
    FROM vendas v
    LEFT JOIN clientes c ON c.id = v.cliente_id
    ORDER BY v.criada_em DESC
    LIMIT 5
  `);

  // Alertas de estoque baixo
  const [alerts] = await pool.query(`
    SELECT
      id,
      nome,
      sku,
      estoque,
      estoque_minimo
    FROM produtos
    WHERE ativo = 1
      AND estoque <= estoque_minimo
    ORDER BY estoque ASC
    LIMIT 6
  `);

  res.json({
    kpis: kpis[0],
    daily,
    top,
    categories,
    recent,
    alerts
  });

}));

// ==========================================
// RELATORIOS COMERCIAIS
// ==========================================

router.get('/relatorios', asyncRoute(async (req, res) => {

  // Periodos permitidos
  const allowed = ['7', '30', '90', '365'];

  const days = allowed.includes(String(req.query.dias))
    ? Number(req.query.dias)
    : 30;

  // Vendas e faturamento por dia
  // GROUP BY corrigido para MySQL 8
  const [daily] = await pool.query(`
    SELECT
      DATE_FORMAT(v.criada_em, '%Y-%m-%d') AS dia,
      COUNT(*) AS vendas,
      ROUND(SUM(v.total), 2) AS faturamento
    FROM vendas v
    WHERE v.status = 'concluida'
      AND v.criada_em >= DATE_SUB(
        CURDATE(), INTERVAL ? DAY
      )
    GROUP BY DATE_FORMAT(v.criada_em, '%Y-%m-%d')
    ORDER BY dia
  `, [days]);

  // Ranking de produtos vendidos
  const [products] = await pool.query(`
    SELECT
      p.id,
      p.nome,
      SUM(i.quantidade) AS unidades,
      ROUND(SUM(i.total), 2) AS receita
    FROM itens_venda i
    JOIN vendas v ON v.id = i.venda_id
    JOIN produtos p ON p.id = i.produto_id
    WHERE v.status = 'concluida'
      AND v.criada_em >= DATE_SUB(
        CURDATE(), INTERVAL ? DAY
      )
    GROUP BY p.id, p.nome
    ORDER BY unidades DESC
    LIMIT 15
  `, [days]);

  // Relatorio por categoria
  const [categories] = await pool.query(`
    SELECT
      c.nome,
      COUNT(DISTINCT v.id) AS vendas,
      COALESCE(
        SUM(
          CASE
            WHEN v.id IS NOT NULL THEN i.quantidade
            ELSE 0
          END
        ), 0
      ) AS unidades,
      ROUND(
        COALESCE(
          SUM(
            CASE
              WHEN v.id IS NOT NULL THEN i.total
              ELSE 0
            END
          ), 0
        ), 2
      ) AS receita
    FROM categorias c
    LEFT JOIN produtos p ON p.categoria_id = c.id
    LEFT JOIN itens_venda i ON i.produto_id = p.id
    LEFT JOIN vendas v
      ON v.id = i.venda_id
      AND v.status = 'concluida'
      AND v.criada_em >= DATE_SUB(
        CURDATE(), INTERVAL ? DAY
      )
    GROUP BY c.id, c.nome
    ORDER BY receita DESC
  `, [days]);

  // Estatisticas financeiras
  const [stats] = await pool.query(`
    SELECT
      COUNT(*) AS vendas,
      ROUND(COALESCE(SUM(total), 0), 2) AS faturamento,
      ROUND(COALESCE(AVG(total), 0), 2) AS ticket_medio
    FROM vendas
    WHERE status = 'concluida'
      AND criada_em >= DATE_SUB(
        CURDATE(), INTERVAL ? DAY
      )
  `, [days]);

  // Produtos com estoque baixo
  const [low] = await pool.query(`
    SELECT
      nome,
      sku,
      estoque,
      estoque_minimo
    FROM produtos
    WHERE ativo = 1
      AND estoque <= estoque_minimo
    ORDER BY estoque
    LIMIT 30
  `);

  res.json({
    daily,
    products,
    categories,
    stats: stats[0],
    low,
    dias: days
  });

}));

module.exports = router;
