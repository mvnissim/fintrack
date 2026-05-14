'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryPieChartProps {
  data: { nome: string; valor: number; cor: string }[]
}

const COLORS = ['#0D7C66', '#6EBD9F', '#185FA5', '#A8C8E8', '#EF9F27', '#D85A30', '#854F0B', '#6B21A8']

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-md px-3 py-2 shadow-sm"
        style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)', fontSize: '12px' }}
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2px' }}>{payload[0].name}</p>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) {
    return (
      <div
        className="rounded-lg p-4 flex items-center justify-center"
        style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)', height: '280px' }}
      >
        <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Sem dados para exibir</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
    >
      <p
        className="font-display font-semibold mb-4"
        style={{ fontSize: '13px', color: 'var(--text-primary)' }}
      >
        Distribuição por Categoria
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="valor"
            nameKey="nome"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.nome}
                fill={entry.cor || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
