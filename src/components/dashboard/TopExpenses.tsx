'use client'

import { formatCurrency } from '@/lib/utils'

interface TopExpense {
  descricao: string
  valor: number
  categoria?: string
}

interface TopExpensesProps {
  items: TopExpense[]
}

export function TopExpenses({ items }: TopExpensesProps) {
  const sorted = [...items].sort((a, b) => b.valor - a.valor).slice(0, 8)
  const max = sorted[0]?.valor ?? 1

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
    >
      <p
        className="font-display font-semibold mb-4"
        style={{ fontSize: '13px', color: 'var(--text-primary)' }}
      >
        Maiores Gastos do Mês
      </p>
      {sorted.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Nenhum gasto registrado</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }} className="truncate mr-2 flex-1">
                  {item.descricao}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}>
                  {formatCurrency(item.valor)}
                </span>
              </div>
              <div style={{ height: '3px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(item.valor / max) * 100}%`,
                    background: 'var(--primary)',
                    borderRadius: '10px',
                    transition: 'width 0.5s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
