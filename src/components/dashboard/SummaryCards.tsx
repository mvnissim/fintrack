'use client'

import { formatCurrency } from '@/lib/utils'

interface SummaryCard {
  label: string
  value: number
  sub?: string
  positive?: boolean
  danger?: boolean
}

interface SummaryCardsProps {
  totalReceitas: number
  totalComprometido: number
  saldoLivre: number
  totalInvestido: number
}

function Card({ label, value, sub, positive, danger }: SummaryCard) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--bg-primary)',
        border: '0.5px solid var(--border-tertiary)',
      }}
    >
      <p
        className="font-medium uppercase tracking-wide mb-2"
        style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}
      >
        {label}
      </p>
      <p
        className="font-display font-bold"
        style={{
          fontSize: '22px',
          letterSpacing: '-0.5px',
          color: danger
            ? 'var(--danger)'
            : positive
            ? 'var(--primary)'
            : 'var(--text-primary)',
        }}
      >
        {formatCurrency(value)}
      </p>
      {sub && (
        <p
          className="mt-1"
          style={{ fontSize: '11px', color: 'var(--text-secondary)' }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

export function SummaryCards({ totalReceitas, totalComprometido, saldoLivre, totalInvestido }: SummaryCardsProps) {
  const percentComprometido = totalReceitas > 0
    ? Math.round((totalComprometido / totalReceitas) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="Total Receitas"
        value={totalReceitas}
        positive
      />
      <Card
        label="Comprometido"
        value={totalComprometido}
        sub={`${percentComprometido}% da receita`}
      />
      <Card
        label="Saldo Livre"
        value={saldoLivre}
        positive={saldoLivre >= 0}
        danger={saldoLivre < 0}
      />
      <Card
        label="Total Investido"
        value={totalInvestido}
        positive
      />
    </div>
  )
}
