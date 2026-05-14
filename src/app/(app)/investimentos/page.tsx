'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { formatCurrency, formatMonthTitle, getMonthsInYear } from '@/lib/utils'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { Plus } from 'lucide-react'
import { useState } from 'react'

type InvTipo = 'renda_fixa' | 'renda_variavel' | 'outro'

const tipoLabels: Record<InvTipo, string> = {
  renda_fixa: 'Renda Fixa',
  renda_variavel: 'Renda Variável',
  outro: 'Outro',
}

export default function InvestimentosPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()
  const year = parseInt(currentMonth.split('-')[0])
  const months = getMonthsInYear(year)

  const [showAdd, setShowAdd] = useState(false)
  const [newTipo, setNewTipo] = useState<InvTipo>('renda_fixa')
  const [newDescricao, setNewDescricao] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['investimentos', year],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const [{ data: investimentos }, { data: receitas }] = await Promise.all([
        supabase.from('investimentos').select('*').eq('user_id', user.id).in('mes', months),
        supabase.from('receitas').select('*').eq('user_id', user.id).eq('mes', currentMonth),
      ])
      return { investimentos: investimentos ?? [], receitas: receitas ?? [] }
    },
  })

  const updateInvestimento = useMutation({
    mutationFn: async ({ id, field, valor }: { id: string; field: 'meta' | 'realizado'; valor: number }) => {
      const { error } = await supabase.from('investimentos').update({ [field]: valor }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investimentos', year] }),
  })

  const addInvestimento = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const inserts = months.map(mes => ({
        user_id: user.id,
        mes,
        tipo: newTipo,
        descricao: newDescricao || tipoLabels[newTipo],
        meta: null,
        realizado: null,
      }))
      const { error } = await supabase.from('investimentos').insert(inserts)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investimentos', year] })
      setNewDescricao('')
      setShowAdd(false)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const investimentos = data?.investimentos ?? []
  const receitas = data?.receitas ?? []
  const totalReceita = receitas.reduce((s, r) => s + r.valor, 0)

  // Group by tipo+descricao
  type InvGroup = {
    id: string
    tipo: InvTipo
    descricao: string
    meta: number | null
    realizado: number | null
    mes: string
  }

  const groups: Record<string, { tipo: InvTipo; descricao: string; rows: InvGroup[] }> = {}
  investimentos.forEach(inv => {
    const key = `${inv.tipo}__${inv.descricao ?? inv.tipo}`
    if (!groups[key]) groups[key] = { tipo: inv.tipo as InvTipo, descricao: inv.descricao ?? tipoLabels[inv.tipo as InvTipo], rows: [] }
    groups[key].rows.push(inv as InvGroup)
  })

  // Year totals
  const totalMetaAno = investimentos.reduce((s, i) => s + (i.meta ?? 0), 0)
  const totalRealizadoAno = investimentos.reduce((s, i) => s + (i.realizado ?? 0), 0)

  // Current month
  const currentMonthInvs = investimentos.filter(i => i.mes === currentMonth)
  const totalMetaMes = currentMonthInvs.reduce((s, i) => s + (i.meta ?? 0), 0)
  const totalRealizadoMes = currentMonthInvs.reduce((s, i) => s + (i.realizado ?? 0), 0)
  const pctReceita = totalReceita > 0 ? Math.round((totalRealizadoMes / totalReceita) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Investimentos
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {year} · {pctReceita}% da receita investida
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 font-medium text-white rounded-md transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', padding: '4px 10px', fontSize: '12px' }}
        >
          <Plus size={13} />
          Nova categoria
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Meta mês', value: totalMetaMes },
          { label: 'Realizado mês', value: totalRealizadoMes, positive: true },
          { label: 'Meta ano', value: totalMetaAno },
          { label: 'Realizado ano', value: totalRealizadoAno, positive: true },
        ].map(card => (
          <div key={card.label} className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">
              {card.label}
            </p>
            <p className="font-display font-bold" style={{ fontSize: '22px', letterSpacing: '-0.5px', color: card.positive ? 'var(--primary)' : 'var(--text-primary)' }}>
              {formatCurrency(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p className="font-medium mb-3" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Nova categoria de investimento</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
              <select
                value={newTipo}
                onChange={e => setNewTipo(e.target.value as InvTipo)}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontFamily: 'var(--font-dm-sans)', color: 'var(--text-primary)' }}
              >
                <option value="renda_fixa">Renda Fixa</option>
                <option value="renda_variavel">Renda Variável</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Descrição (opcional)</label>
              <input
                type="text"
                value={newDescricao}
                onChange={e => setNewDescricao(e.target.value)}
                placeholder={tipoLabels[newTipo]}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minWidth: '180px', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => addInvestimento.mutate()}
                disabled={addInvestimento.isPending}
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ background: 'var(--primary)' }}
              >
                Criar
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-2 rounded-md text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tables per group */}
      {Object.entries(groups).map(([key, group]) => {
        const groupMeta = group.rows.reduce((s, r) => s + (r.meta ?? 0), 0)
        const groupRealizado = group.rows.reduce((s, r) => s + (r.realizado ?? 0), 0)

        return (
          <div key={key} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-display font-semibold" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {group.descricao}
              </p>
              <span
                className="rounded-full text-xs font-medium"
                style={{
                  background: group.tipo === 'renda_fixa' ? '#E1F5EE' : group.tipo === 'renda_variavel' ? '#E6F1FB' : '#F3F4F6',
                  color: group.tipo === 'renda_fixa' ? '#0F6E56' : group.tipo === 'renda_variavel' ? '#185FA5' : '#4B5563',
                  padding: '2px 8px',
                  fontSize: '11px',
                }}
              >
                {tipoLabels[group.tipo]}
              </span>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}>
                    <th className="text-left px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Mês</th>
                    <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Meta</th>
                    <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Realizado</th>
                    <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows
                    .sort((a, b) => a.mes.localeCompare(b.mes))
                    .map((row, i) => {
                      const pct = row.meta && row.meta > 0 ? Math.round(((row.realizado ?? 0) / row.meta) * 100) : null
                      const isCurrent = row.mes === currentMonth
                      return (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: i < group.rows.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none',
                            background: isCurrent ? 'var(--primary-light)' : 'transparent',
                          }}
                        >
                          <td className="px-4 py-2.5" style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: isCurrent ? 500 : 400 }}>
                            {formatMonthTitle(row.mes)}
                            {isCurrent && <span className="ml-2 text-xs font-medium" style={{ color: 'var(--primary)' }}>atual</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <InlineEdit
                              value={row.meta}
                              onSave={async v => { await updateInvestimento.mutateAsync({ id: row.id, field: 'meta', valor: v }) }}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <InlineEdit
                              value={row.realizado}
                              onSave={async v => { await updateInvestimento.mutateAsync({ id: row.id, field: 'realizado', valor: v }) }}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: pct == null ? 'var(--text-tertiary)' : pct >= 100 ? 'var(--primary)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                            {pct != null ? `${pct}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  {/* Group total */}
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Total {year}</td>
                    <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{formatCurrency(groupMeta)}</td>
                    <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: 'var(--primary)' }}>{formatCurrency(groupRealizado)}</td>
                    <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: groupMeta > 0 ? (groupRealizado >= groupMeta ? 'var(--primary)' : 'var(--warning)') : 'var(--text-tertiary)' }}>
                      {groupMeta > 0 ? `${Math.round((groupRealizado / groupMeta) * 100)}%` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {Object.keys(groups).length === 0 && (
        <div className="rounded-lg p-10 text-center" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Nenhum investimento cadastrado</p>
        </div>
      )}

      <p className="mt-2 text-center" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Clique em qualquer valor para editar. Salvo automaticamente ao sair do campo.
      </p>
    </div>
  )
}
