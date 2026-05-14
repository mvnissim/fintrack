'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency, formatMonthShort } from '@/lib/utils'

interface MonthlyData {
  mes: string
  receita: number
  comprometido: number
}

interface MonthlyBarChartProps {
  data: MonthlyData[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-md px-3 py-2 shadow-sm"
        style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)', fontSize: '12px' }}
      >
        <p className="mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color, marginBottom: '1px' }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const chartData = data.map(d => ({
    ...d,
    label: formatMonthShort(d.mes),
  }))

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
    >
      <p
        className="font-display font-semibold mb-4"
        style={{ fontSize: '13px', color: 'var(--text-primary)' }}
      >
        Receita vs Comprometido (6 meses)
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barGap={4} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-tertiary)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={value => (
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{value}</span>
            )}
          />
          <Bar dataKey="receita" name="Receita" fill="#0D7C66" radius={[3, 3, 0, 0]} />
          <Bar dataKey="comprometido" name="Comprometido" fill="#A8C8E8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
