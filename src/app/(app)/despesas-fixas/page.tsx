'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { formatCurrency, formatMonthShort } from '@/lib/utils'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { Plus, X } from 'lucide-react'
import type { DespesaFixa, Categoria } from '@/types'

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export default function DespesasFixasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()
  const year = parseInt(currentMonth.split('-')[0])

  const [showAdd, setShowAdd] = useState(false)
  const [newDescricao, setNewDescricao] = useState('')
  const [newCategoriaId, setNewCategoriaId] = useState('')

  const monthKeys = Array.from({ length: 12 }, (_, i) => getMonthKey(year, i))

  const { data, isLoading } = useQuery({
    queryKey: ['despesas-fixas', year],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [{ data: despesas }, { data: cats }] = await Promise.all([
        supabase
          .from('despesas_fixas')
          .select('*, categorias(*)')
          .eq('user_id', user.id)
          .eq('ativo', true)
          .order('created_at'),
        supabase.from('categorias').select('*').eq('user_id', user.id).order('nome'),
      ])

      return { despesas: despesas ?? [], categorias: cats ?? [] }
    },
  })

  const updateValor = useMutation({
    mutationFn: async ({ id, mes, valor, currentValores }: { id: string; mes: string; valor: number; currentValores: Record<string, number> }) => {
      const newValores = { ...currentValores, [mes]: valor }
      const { error } = await supabase
        .from('despesas_fixas')
        .update({ valores: newValores })
        .eq('id', id)
      if (error) throw error
      return newValores
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['despesas-fixas', year] }),
  })

  const addDespesa = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('despesas_fixas').insert({
        user_id: user.id,
        descricao: newDescricao,
        categoria_id: newCategoriaId || null,
        valores: {},
        ativo: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas', year] })
      setNewDescricao('')
      setNewCategoriaId('')
      setShowAdd(false)
    },
  })

  const deleteDespesa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('despesas_fixas').update({ ativo: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['despesas-fixas', year] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const despesas = data?.despesas ?? []
  const categorias = data?.categorias ?? []

  // Totals per month
  const monthTotals = monthKeys.map(mk =>
    despesas.reduce((s, d) => s + (d.valores?.[mk] ?? 0), 0)
  )
  const grandTotal = monthTotals.reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Despesas Fixas
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {year} · {despesas.length} itens
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 font-medium text-white rounded-md transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', padding: '4px 10px', fontSize: '12px' }}
        >
          <Plus size={13} />
          Nova despesa
        </button>
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
              placeholder="Ex: Aluguel"
              className="rounded-md px-3 py-2 text-sm outline-none"
              style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minWidth: '200px', fontFamily: 'var(--font-dm-sans)' }}
              onKeyDown={e => e.key === 'Enter' && newDescricao && addDespesa.mutate()}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
            <select
              value={newCategoriaId}
              onChange={e => setNewCategoriaId(e.target.value)}
              className="rounded-md px-3 py-2 text-sm outline-none"
              style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontFamily: 'var(--font-dm-sans)', color: 'var(--text-primary)' }}
            >
              <option value="">Sem categoria</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => newDescricao && addDespesa.mutate()}
              disabled={!newDescricao || addDespesa.isPending}
              className="px-4 py-2 rounded-md text-white text-sm font-medium"
              style={{ background: 'var(--primary)' }}
            >
              Adicionar
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewDescricao(''); setNewCategoriaId('') }}
              className="px-3 py-2 rounded-md text-sm"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-lg overflow-x-auto"
        style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
      >
        <table className="w-full" style={{ minWidth: '900px' }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}>
              <th className="text-left px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '200px' }}>
                Descrição
              </th>
              <th className="text-left px-3 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '110px' }}>
                Categoria
              </th>
              {MONTHS_SHORT.map(m => (
                <th key={m} className="text-right px-2 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '80px' }}>
                  {m}
                </th>
              ))}
              <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '90px' }}>
                Total
              </th>
              <th style={{ width: '32px' }} />
            </tr>
          </thead>
          <tbody>
            {despesas.map(despesa => {
              const rowTotal = monthKeys.reduce((s, mk) => s + (despesa.valores?.[mk] ?? 0), 0)
              const cat = (despesa as DespesaFixa & { categorias: Categoria | null }).categorias
              return (
                <tr
                  key={despesa.id}
                  style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}
                  className="group"
                >
                  <td className="px-4 py-2.5" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                    {despesa.descricao}
                  </td>
                  <td className="px-3 py-2.5">
                    {cat ? <CategoryTag nome={cat.nome} /> : <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>—</span>}
                  </td>
                  {monthKeys.map(mk => (
                    <td key={mk} className="px-2 py-2.5 text-right">
                      <InlineEdit
                        value={despesa.valores?.[mk] ?? null}
                        onSave={async (v) => {
                          await updateValor.mutateAsync({
                            id: despesa.id,
                            mes: mk,
                            valor: v,
                            currentValores: despesa.valores ?? {},
                          })
                        }}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: 'var(--primary)' }}>
                    {rowTotal > 0 ? formatCurrency(rowTotal) : '—'}
                  </td>
                  <td className="pr-3 py-2.5">
                    <button
                      onClick={() => deleteDespesa.mutate(despesa.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              )
            })}

            {/* Total row */}
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <td className="px-4 py-2.5 font-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                Total
              </td>
              <td />
              {monthTotals.map((total, i) => (
                <td key={i} className="px-2 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: total > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                  {total > 0 ? formatCurrency(total) : '—'}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: 'var(--primary)' }}>
                {formatCurrency(grandTotal)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-center" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Clique em qualquer valor para editar. Salvo automaticamente ao sair do campo.
      </p>
    </div>
  )
}
