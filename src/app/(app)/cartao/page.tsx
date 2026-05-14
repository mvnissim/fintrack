'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { formatCurrency, formatMonthTitle, getLastNMonths } from '@/lib/utils'
import { InlineEdit } from '@/components/ui/InlineEdit'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatMonthShort } from '@/lib/utils'

export default function CartaoPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()

  const last12 = getLastNMonths(currentMonth, 12)

  const { data, isLoading } = useQuery({
    queryKey: ['cartao', currentMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data: gastos } = await supabase
        .from('gastos_cartao')
        .select('*')
        .eq('user_id', user.id)
        .in('mes', last12)
        .order('mes')
      return gastos ?? []
    },
  })

  const upsertGasto = useMutation({
    mutationFn: async ({ mes, field, valor }: { mes: string; field: 'valor_estimado' | 'valor_real'; valor: number }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('gastos_cartao')
        .upsert({ user_id: user.id, mes, [field]: valor }, { onConflict: 'user_id,mes' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartao', currentMonth] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const gastos = data ?? []
  const gastoMap: Record<string, { valor_estimado?: number; valor_real?: number }> = {}
  gastos.forEach(g => { gastoMap[g.mes] = g })

  const currentGasto = gastoMap[currentMonth] ?? {}
  const estimado = currentGasto.valor_estimado ?? 0
  const real = currentGasto.valor_real ?? 0
  const diferenca = estimado - real
  const diffPositive = diferenca >= 0

  // Chart data
  const chartData = last12.map(mes => ({
    label: formatMonthShort(mes),
    estimado: gastoMap[mes]?.valor_estimado ?? 0,
    real: gastoMap[mes]?.valor_real ?? 0,
  }))

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
          Cartão de Crédito
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Gastos variáveis por mês
        </p>
      </div>

      {/* Current month highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">
            Estimado
          </p>
          <InlineEdit
            value={estimado || null}
            onSave={async v => { await upsertGasto.mutateAsync({ mes: currentMonth, field: 'valor_estimado', valor: v }) }}
          />
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">
            Real
          </p>
          <InlineEdit
            value={real || null}
            onSave={async v => { await upsertGasto.mutateAsync({ mes: currentMonth, field: 'valor_real', valor: v }) }}
          />
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">
            Diferença
          </p>
          <p
            className="font-display font-bold"
            style={{ fontSize: '22px', letterSpacing: '-0.5px', color: diffPositive ? 'var(--primary)' : 'var(--danger)' }}
          >
            {diferenca !== 0 ? `${diffPositive ? '+' : ''}${formatCurrency(diferenca)}` : '—'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {diffPositive ? 'abaixo do estimado' : 'acima do estimado'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg p-4 mb-5" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
        <p className="font-display font-semibold mb-4" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          Estimado vs Real (12 meses)
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-tertiary)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={45} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ fontSize: 12, border: '0.5px solid var(--border-tertiary)', borderRadius: 6 }}
            />
            <Legend formatter={v => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v}</span>} />
            <Line type="monotone" dataKey="estimado" name="Estimado" stroke="#0D7C66" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="real" name="Real" stroke="#D85A30" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* History table */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}>
              <th className="text-left px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Mês</th>
              <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Estimado</th>
              <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Real</th>
              <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Diferença</th>
            </tr>
          </thead>
          <tbody>
            {[...last12].reverse().map((mes, i) => {
              const g = gastoMap[mes] ?? {}
              const est = g.valor_estimado ?? 0
              const rl = g.valor_real ?? 0
              const diff = est - rl
              const isCurrent = mes === currentMonth
              return (
                <tr
                  key={mes}
                  style={{
                    borderBottom: i < last12.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none',
                    background: isCurrent ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  <td className="px-4 py-2.5" style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: isCurrent ? 500 : 400 }}>
                    {formatMonthTitle(mes)}
                    {isCurrent && <span className="ml-2 text-xs font-medium" style={{ color: 'var(--primary)' }}>atual</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <InlineEdit
                      value={est || null}
                      onSave={async v => { await upsertGasto.mutateAsync({ mes, field: 'valor_estimado', valor: v }) }}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <InlineEdit
                      value={rl || null}
                      onSave={async v => { await upsertGasto.mutateAsync({ mes, field: 'valor_real', valor: v }) }}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: est === 0 && rl === 0 ? 'var(--text-tertiary)' : diff >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
                    {est === 0 && rl === 0 ? '—' : `${diff >= 0 ? '+' : ''}${formatCurrency(diff)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-center" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Clique em qualquer valor para editar. Salvo automaticamente ao sair do campo.
      </p>
    </div>
  )
}
