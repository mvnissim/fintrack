'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { formatCurrency, formatMonthTitle } from '@/lib/utils'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { Plus, X } from 'lucide-react'

export default function ReceitasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()

  const [showAdd, setShowAdd] = useState(false)
  const [newDescricao, setNewDescricao] = useState('Salário')
  const [newValor, setNewValor] = useState('')

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
      const { error } = await supabase.from('receitas').insert({
        user_id: user.id,
        mes: currentMonth,
        descricao: newDescricao || 'Salário',
        valor: parseFloat(newValor.replace(',', '.')),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas', currentMonth] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentMonth] })
      setNewDescricao('Salário')
      setNewValor('')
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('receitas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas', currentMonth] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentMonth] })
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

      {/* Total card */}
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
          className="rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
        >
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
          <div className="flex gap-2">
            <button
              onClick={() => newValor && addReceita.mutate()}
              disabled={!newValor || addReceita.isPending}
              className="px-4 py-2 rounded-md text-white text-sm font-medium"
              style={{ background: 'var(--primary)' }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewDescricao('Salário'); setNewValor('') }}
              className="px-3 py-2 rounded-md text-sm"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
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
                <th style={{ width: '32px' }} />
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
                  <td className="pr-3 py-3">
                    <button
                      onClick={() => deleteReceita.mutate(receita.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {/* Total */}
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
        Clique em qualquer valor para editar. Salvo automaticamente ao sair do campo.
      </p>
    </div>
  )
}
