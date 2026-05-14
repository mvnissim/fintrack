'use client'

import { formatCurrency } from '@/lib/utils'

interface CommitmentBarProps {
  totalReceitas: number
  totalDespesasFixas: number
  totalParcelas: number
  totalCartao: number
}

export function CommitmentBar({ totalReceitas, totalDespesasFixas, totalParcelas, totalCartao }: CommitmentBarProps) {
  const total = totalDespesasFixas + totalParcelas + totalCartao
  const pct = totalReceitas > 0 ? Math.min((total / totalReceitas) * 100, 100) : 0
  const pctFixas = totalReceitas > 0 ? Math.min((totalDespesasFixas / totalReceitas) * 100, 100) : 0
  const pctParcelas = totalReceitas > 0 ? Math.min((totalParcelas / totalReceitas) * 100, 100) : 0
  const pctCartao = totalReceitas > 0 ? Math.min((totalCartao / totalReceitas) * 100, 100) : 0

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--bg-primary)',
        border: '0.5px solid var(--border-tertiary)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="font-medium uppercase tracking-wide"
          style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
        >
          Comprometimento da Receita
        </p>
        <span
          className="font-display font-semibold"
          style={{ fontSize: '14px', color: 'var(--primary)' }}
        >
          {Math.round(pct)}%
        </span>
      </div>

      {/* Bar */}
      <div
        className="w-full rounded-full overflow-hidden mb-3 flex"
        style={{ height: '8px', background: 'var(--bg-secondary)' }}
      >
        <div style={{ width: `${pctFixas}%`, background: '#0D7C66', transition: 'width 0.5s' }} />
        <div style={{ width: `${pctParcelas}%`, background: '#6EBD9F', transition: 'width 0.5s' }} />
        <div style={{ width: `${pctCartao}%`, background: '#A8C8E8', transition: 'width 0.5s' }} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        <LegendItem color="#0D7C66" label="Despesas fixas" value={totalDespesasFixas} />
        <LegendItem color="#6EBD9F" label="Parcelas" value={totalParcelas} />
        <LegendItem color="#A8C8E8" label="Cartão estimado" value={totalCartao} />
      </div>
    </div>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 500 }}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
