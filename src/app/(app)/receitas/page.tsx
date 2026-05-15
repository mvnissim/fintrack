'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { formatCurrency, formatMonthTitle, getMonthsInYear } from '@/lib/utils'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { Plus, X, RefreshCw } from 'lucide-react'

export default function ReceitasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()
  const year = parseInt(currentMonth.split('-')[0])

  const [showAdd, setShowAdd] = useState(false)
  const [newDescricao, setNewDescricao] = useState('Salário')
  const [newValor, setNewValor] = useState('')
  const [recorrente, setRecorrente] = useState(true)

  const { data: receitas = [], isLoading } = useQuery({
    queryKey: ['receitas', currentMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data } = await supabase
        .from('receitas')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', currentMonth)
        .order('created_at')
      return data ?? []
    },
  })

  const addReceita = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const valor = parseFloat(newValor.replace(',', '.'))
      const descricao = newDescricao || 'Salário'

      if (recorrente) {
        // Insere em todos os meses do ano
        const meses = getMonthsInYear(year)
        const inserts = meses.map(mes => ({ user_id: user.id, mes, descricao, valor }))
        const { error } = await supabase.from('receitas').insert(inserts)
        if (error) throw error
      } else {
        const { error } = await supabase.from('receitas').insert({
          user_id: user.id,
          mes: currentMonth,
          descricao,
          valor,
        })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setNewDescricao('Salário')
      setNewValor('')
      setRecorrente(true)
      setShowAdd(false)
    },
  })

  const updateReceita = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'descricao' | 'valor'; value: string | number }) => {
      const { error } = await supabase.from('receitas').update({ [field]: value }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas', currentMonth] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentMonth] })
    },
  })

  const deleteReceita = useMutation({
    mutationFn: async ({ id, apenasEste }: { id: string; apenasEste: boolean }) => {
      if (apenasEste) {
        const { error } = await supabase.from('receitas').delete().eq('id', id)
        if (error) throw error
      } else {
        // Busca descrição e deleta de todos os meses do ano
        const { data } = await supabase.from('receitas').select('descricao, user_id').eq('id', id).single()
        if (data) {
          const meses = getMonthsInYear(year)
          const { error } = await supabase
            .from('receitas')
            .delete()
            .eq('user_id', data.user_id)
            .eq('descricao', data.descricao)
            .in('mes', meses)
          if (error) throw error
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const total = receitas.reduce((s, r) => s + r.valor, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Receitas
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {formatMonthTitle(currentMonth)} · {receitas.length} {receitas.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 font-medium text-white rounded-md transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', padding: '4px 10px', fontSize: '12px' }}
        >
          <Plus size={13} />
          Nova receita
        </button>
      </div>

      {/* Total */}
      <div
        className="rounded-lg p-4 mb-5 inline-block"
        style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
      >
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Total do mês
        </p>
        <p className="font-display font-bold mt-1" style={{ fontSize: '28px', letterSpacing: '-0.5px', color: 'var(--primary)' }}>
          {formatCurrency(total)}
        </p>
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
        >
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
              <input
                type="text"
                value={newDescricao}
                onChange={e => setNewDescricao(e.target.value)}
                placeholder="Ex: Salário"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minWidth: '180px', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Valor (R$)</label>
              <input
                type="text"
                value={newValor}
                onChange={e => setNewValor(e.target.value)}
                placeholder="0,00"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', width: '120px', fontFamily: 'var(--font-dm-sans)' }}
                onKeyDown={e => e.key === 'Enter' && newValor && addReceita.mutate()}
              />
            </div>

            {/* Toggle recorrente */}
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => setRecorrente(v => !v)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  background: recorrente ? 'var(--primary-light)' : 'var(--bg-secondary)',
                  color: recorrente ? 'var(--primary)' : 'var(--text-secondary)',
                  border: `1px solid ${recorrente ? 'var(--primary)' : 'var(--border-primary)'}`,
                }}
              >
                <RefreshCw size={11} />
                Repetir todo mês ({year})
              </button>
            </div>

            <div className="flex gap-2 pb-2">
              <button
                onClick={() => newValor && addReceita.mutate()}
                disabled={!newValor || addReceita.isPending}
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ background: 'var(--primary)' }}
              >
                {addReceita.isPending ? 'Salvando...' : recorrente ? `Adicionar (12 meses)` : 'Adicionar'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setNewDescricao('Salário'); setNewValor(''); setRecorrente(true) }}
                className="px-3 py-2 rounded-md text-sm"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
            </div>
          </div>

          {recorrente && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              O valor será inserido em todos os 12 meses de {year}. Você pode editar mês a mês depois.
            </p>
          )}
        </div>
      )}

      {/* List */}
      {receitas.length === 0 ? (
        <div
          className="rounded-lg p-10 text-center"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
        >
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '8px' }}>
            Nenhuma receita em {formatMonthTitle(currentMonth)}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            + Adicionar salário
          </button>
        </div>
      ) : (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}>
                <th className="text-left px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Descrição</th>
                <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Valor</th>
                <th style={{ width: '40px' }} />
              </tr>
            </thead>
            <tbody>
              {receitas.map((receita, i) => (
                <tr
                  key={receita.id}
                  className="group"
                  style={{ borderBottom: i < receitas.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none' }}
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      defaultValue={receita.descricao}
                      onBlur={e => {
                        if (e.target.value !== receita.descricao) {
                          updateReceita.mutate({ id: receita.id, field: 'descricao', value: e.target.value })
                        }
                      }}
                      className="outline-none bg-transparent w-full"
                      style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)', cursor: 'text' }}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InlineEdit
                      value={receita.valor}
                      onSave={async v => { await updateReceita.mutateAsync({ id: receita.id, field: 'valor', value: v }) }}
                    />
                  </td>
                  <td className="pr-2 py-3">
                    {/* Dropdown: excluir só este ou todos os meses */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-end">
                      <button
                        onClick={() => deleteReceita.mutate({ id: receita.id, apenasEste: true })}
                        className="text-xs px-2 py-1 rounded"
                        style={{ color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}
                        title="Excluir só este mês"
                      >
                        <X size={11} />
                      </button>
                      <button
                        onClick={() => deleteReceita.mutate({ id: receita.id, apenasEste: false })}
                        className="text-xs px-2 py-1 rounded flex items-center gap-1"
                        style={{ color: 'var(--danger)', background: '#FCEBEB' }}
                        title={`Excluir em todos os meses de ${year}`}
                      >
                        <X size={11} />
                        <RefreshCw size={9} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ background: 'var(--bg-secondary)' }}>
                <td className="px-4 py-3 font-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Total</td>
                <td className="px-4 py-3 text-right font-medium" style={{ fontSize: '13px', color: 'var(--primary)' }}>
                  {formatCurrency(total)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-center" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Clique no valor para editar. <span style={{ marginLeft: '4px' }}><X size={9} style={{ display: 'inline' }} /></span> exclui só este mês · <X size={9} style={{ display: 'inline' }} /><RefreshCw size={8} style={{ display: 'inline' }} /> exclui todo o ano.
      </p>
    </div>
  )
}
