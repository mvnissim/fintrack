'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import {
  formatCurrency,
  formatMonthTitle,
  getParcelaEndMonth,
  isParcelaActiveInMonth,
  getPaidParcelas,
} from '@/lib/utils'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { Plus, X, Calendar } from 'lucide-react'
import type { Parcela, Categoria } from '@/types'

function ProgressBar({ percent }: { percent: number }) {
  const color = percent >= 70 ? '#0D7C66' : percent >= 30 ? '#EF9F27' : '#D85A30'
  return (
    <div style={{ height: '5px', background: 'var(--bg-secondary)', borderRadius: '10px', width: '100%' }}>
      <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '10px', transition: 'width 0.5s' }} />
    </div>
  )
}

function EndBadge({ percent, endMonth }: { percent: number; endMonth: string }) {
  const cfg =
    percent >= 70
      ? { bg: '#E1F5EE', color: '#0F6E56' }
      : percent >= 30
      ? { bg: '#FAEEDA', color: '#854F0B' }
      : { bg: '#FCEBEB', color: '#A32D2D' }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', padding: '2px 8px' }}
    >
      <Calendar size={10} />
      Termina {formatMonthTitle(endMonth)}
    </span>
  )
}

export default function ParcelasPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    descricao: '',
    valor_parcela: '',
    total_parcelas: '',
    mes_inicio: currentMonth,
    categoria_id: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['parcelas'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const [{ data: parcelas }, { data: cats }] = await Promise.all([
        supabase.from('parcelas').select('*, categorias(*)').eq('user_id', user.id).order('mes_inicio'),
        supabase.from('categorias').select('*').eq('user_id', user.id).order('nome'),
      ])
      return { parcelas: parcelas ?? [], categorias: cats ?? [] }
    },
  })

  const addParcela = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('parcelas').insert({
        user_id: user.id,
        descricao: form.descricao,
        valor_parcela: parseFloat(form.valor_parcela.replace(',', '.')),
        total_parcelas: parseInt(form.total_parcelas),
        parcela_inicial: 1,
        mes_inicio: form.mes_inicio,
        categoria_id: form.categoria_id || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] })
      setForm({ descricao: '', valor_parcela: '', total_parcelas: '', mes_inicio: currentMonth, categoria_id: '' })
      setShowAdd(false)
    },
  })

  const deleteParcela = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parcelas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parcelas'] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const parcelas = data?.parcelas ?? []
  const categorias = data?.categorias ?? []
  const ativas = parcelas.filter(p => isParcelaActiveInMonth(p, currentMonth))
  const futuras = parcelas.filter(p => p.mes_inicio > currentMonth)
  const encerradas = parcelas.filter(p => {
    const end = getParcelaEndMonth(p)
    return end < currentMonth
  })

  const totalMes = ativas.reduce((s, p) => s + p.valor_parcela, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Parcelas
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {ativas.length} ativas · {formatCurrency(totalMes)} este mês
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 font-medium text-white rounded-md transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', padding: '4px 10px', fontSize: '12px' }}
        >
          <Plus size={13} />
          Nova parcela
        </button>
      </div>

      {/* Summary card */}
      <div
        className="rounded-lg p-4 mb-5 inline-flex items-center gap-6"
        style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
      >
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total este mês</p>
          <p className="font-display font-bold" style={{ fontSize: '22px', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
            {formatCurrency(totalMes)}
          </p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ativas</p>
          <p className="font-display font-bold" style={{ fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            {ativas.length}
          </p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          className="rounded-lg p-4 mb-4"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
        >
          <p className="font-medium mb-3" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Nova parcela</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
              <input
                type="text"
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Ex: Notebook Dell"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minWidth: '200px', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Valor/parcela (R$)</label>
              <input
                type="text"
                value={form.valor_parcela}
                onChange={e => setForm(f => ({ ...f, valor_parcela: e.target.value }))}
                placeholder="0,00"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', width: '100px', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Nº parcelas</label>
              <input
                type="number"
                value={form.total_parcelas}
                onChange={e => setForm(f => ({ ...f, total_parcelas: e.target.value }))}
                placeholder="12"
                min="1"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', width: '80px', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Mês de início</label>
              <input
                type="month"
                value={form.mes_inicio}
                onChange={e => setForm(f => ({ ...f, mes_inicio: e.target.value }))}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontFamily: 'var(--font-dm-sans)' }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
              <select
                value={form.categoria_id}
                onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontFamily: 'var(--font-dm-sans)', color: 'var(--text-primary)' }}
              >
                <option value="">Sem categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => form.descricao && form.valor_parcela && form.total_parcelas && addParcela.mutate()}
                disabled={addParcela.isPending}
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ background: 'var(--primary)' }}
              >
                Adicionar
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

      {/* Ativas */}
      {ativas.length > 0 && (
        <div className="mb-4">
          <p className="font-medium mb-2" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ativas neste mês
          </p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
          >
            {ativas.map((parcela, i) => {
              const totalParcelas = parcela.total_parcelas - parcela.parcela_inicial + 1
              const paid = getPaidParcelas(parcela, currentMonth)
              const pct = Math.round((paid / totalParcelas) * 100)
              const endMonth = getParcelaEndMonth(parcela)
              const cat = (parcela as Parcela & { categorias: Categoria | null }).categorias

              return (
                <div
                  key={parcela.id}
                  className="px-4 py-3 group"
                  style={{ borderBottom: i < ativas.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {parcela.descricao}
                        </span>
                        {cat && <CategoryTag nome={cat.nome} />}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {formatCurrency(parcela.valor_parcela)}/mês · {paid} de {totalParcelas} pagas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <EndBadge percent={pct} endMonth={endMonth} />
                      <button
                        onClick={() => deleteParcela.mutate(parcela.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <ProgressBar percent={pct} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Futuras */}
      {futuras.length > 0 && (
        <div className="mb-4">
          <p className="font-medium mb-2" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Futuras
          </p>
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
          >
            {futuras.map((parcela, i) => {
              const totalParcelas = parcela.total_parcelas - parcela.parcela_inicial + 1
              const endMonth = getParcelaEndMonth(parcela)
              const cat = (parcela as Parcela & { categorias: Categoria | null }).categorias

              return (
                <div
                  key={parcela.id}
                  className="px-4 py-3 group"
                  style={{ borderBottom: i < futuras.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {parcela.descricao}
                        </span>
                        {cat && <CategoryTag nome={cat.nome} />}
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        Inicia {formatMonthTitle(parcela.mes_inicio)} · {formatCurrency(parcela.valor_parcela)}/mês · {totalParcelas}x
                      </p>
                    </div>
                    <button
                      onClick={() => deleteParcela.mutate(parcela.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Encerradas */}
      {encerradas.length > 0 && (
        <details className="mb-4">
          <summary className="cursor-pointer font-medium mb-2" style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', listStyle: 'none' }}>
            Encerradas ({encerradas.length})
          </summary>
          <div
            className="rounded-lg overflow-hidden mt-2"
            style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)', opacity: 0.6 }}
          >
            {encerradas.map((parcela, i) => (
              <div
                key={parcela.id}
                className="px-4 py-3"
                style={{ borderBottom: i < encerradas.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none' }}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{parcela.descricao}</span>
                <span className="ml-2" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  · {parcela.total_parcelas}x {formatCurrency(parcela.valor_parcela)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {ativas.length === 0 && futuras.length === 0 && encerradas.length === 0 && (
        <div
          className="rounded-lg p-10 text-center"
          style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}
        >
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Nenhuma parcela cadastrada</p>
        </div>
      )}
    </div>
  )
}
