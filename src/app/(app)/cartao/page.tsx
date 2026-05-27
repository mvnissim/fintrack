'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { formatCurrency, formatMonthTitle, getLastNMonths, formatMonthShort } from '@/lib/utils'
import { InlineEdit } from '@/components/ui/InlineEdit'
import { CategoryTag } from '@/components/ui/CategoryTag'
import { parseOFX } from '@/lib/parsers/ofx'
import { parseCSV } from '@/lib/parsers/csv'
import { parsePDF } from '@/lib/parsers/pdf'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Upload, Plus, X, FileText, TrendingDown, TrendingUp } from 'lucide-react'
import type { Categoria } from '@/types'

export default function CartaoPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { currentMonth } = useMonth()
  const fileRef = useRef<HTMLInputElement>(null)
  const last12 = getLastNMonths(currentMonth, 12)

  const [showAdd, setShowAdd] = useState(false)
  const [newDesc, setNewDesc] = useState('')
  const [newValor, setNewValor] = useState('')
  const [newData, setNewData] = useState('')
  const [newTipo, setNewTipo] = useState<'debito' | 'credito'>('debito')
  const [importing, setImporting] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [importPreview, setImportPreview] = useState<{ descricao: string; valor: number; data: string | null; tipo: string }[] | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['cartao', currentMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const [{ data: transacoes }, { data: gastos }, { data: cats }, { data: gastosHist }] = await Promise.all([
        supabase.from('transacoes').select('*, categorias(*)').eq('user_id', user.id).eq('mes', currentMonth).order('data', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('gastos_cartao').select('*').eq('user_id', user.id).eq('mes', currentMonth).maybeSingle(),
        supabase.from('categorias').select('*').eq('user_id', user.id).order('nome'),
        supabase.from('gastos_cartao').select('*').eq('user_id', user.id).in('mes', last12),
      ])

      return { transacoes: transacoes ?? [], gasto: gastos, categorias: cats ?? [], gastosHist: gastosHist ?? [] }
    },
  })

  const upsertEstimado = useMutation({
    mutationFn: async (valor: number) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      await supabase.from('gastos_cartao').upsert({ user_id: user.id, mes: currentMonth, valor_estimado: valor }, { onConflict: 'user_id,mes' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartao', currentMonth] }),
  })

  const addTransacao = useMutation({
    mutationFn: async (t: { descricao: string; valor: number; data: string | null; tipo: 'debito' | 'credito'; origem: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('transacoes').insert({ ...t, user_id: user.id, mes: currentMonth })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartao', currentMonth] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentMonth] })
    },
  })

  const updateTransacao = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const { error } = await supabase.from('transacoes').update({ [field]: value }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cartao', currentMonth] }),
  })

  const deleteTransacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transacoes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartao', currentMonth] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentMonth] })
    },
  })

  // Leitura do arquivo OFX/CSV/PDF
  async function handleFile(file: File) {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      setPdfLoading(true)
      try {
        const parsed = await parsePDF(file)
        setImportPreview(parsed)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erro ao processar PDF')
      } finally {
        setPdfLoading(false)
      }
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      const isOFX = file.name.toLowerCase().endsWith('.ofx') || content.includes('OFXHEADER') || content.includes('<OFX>')
      const parsed = isOFX ? parseOFX(content) : parseCSV(content)
      setImportPreview(parsed)
    }
    reader.readAsText(file, 'latin1')
  }

  async function confirmImport() {
    if (!importPreview) return
    setImporting(true)
    for (const t of importPreview) {
      await addTransacao.mutateAsync({ ...t, tipo: t.tipo as 'debito' | 'credito', origem: 'importado' })
    }
    setImportPreview(null)
    setImporting(false)
  }

  async function handleManualAdd() {
    if (!newDesc || !newValor) return
    await addTransacao.mutateAsync({
      descricao: newDesc,
      valor: parseFloat(newValor.replace(',', '.')),
      data: newData || null,
      tipo: newTipo,
      origem: 'manual',
    })
    setNewDesc(''); setNewValor(''); setNewData(''); setNewTipo('debito')
    setShowAdd(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const transacoes   = data?.transacoes ?? []
  const categorias   = data?.categorias ?? []
  const gastosHist   = data?.gastosHist ?? []
  const estimado     = data?.gasto?.valor_estimado ?? 0
  const debitos      = transacoes.filter(t => t.tipo === 'debito')
  const creditos     = transacoes.filter(t => t.tipo === 'credito')
  const totalReal    = debitos.reduce((s, t) => s + t.valor, 0) - creditos.reduce((s, t) => s + t.valor, 0)
  const diferenca    = estimado - totalReal

  // Atualiza valor_real no gastos_cartao para o dashboard
  const gastoMap: Record<string, { valor_estimado?: number }> = {}
  gastosHist.forEach(g => { gastoMap[g.mes] = g })

  const chartData = last12.map(mes => ({
    label: formatMonthShort(mes),
    estimado: gastoMap[mes]?.valor_estimado ?? 0,
  }))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold" style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
            Cartão de Crédito
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {formatMonthTitle(currentMonth)} · {transacoes.length} lançamentos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 font-medium rounded-md transition-opacity hover:opacity-90 px-3 py-2 text-xs disabled:opacity-50"
            style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)', color: 'var(--text-secondary)' }}
          >
            {pdfLoading
              ? <><span className="w-3 h-3 rounded-full border-2 animate-spin inline-block" style={{ borderColor: 'var(--text-secondary)', borderTopColor: 'transparent' }} /> Lendo PDF...</>
              : <><Upload size={13} /> Importar OFX/CSV/PDF</>}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 font-medium text-white rounded-md transition-opacity hover:opacity-90 px-3 py-2 text-xs"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={13} />
            Lançamento manual
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".ofx,.csv,.txt,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0]); e.target.value = '' } }} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">Estimado</p>
          <InlineEdit value={estimado || null} onSave={async v => { await upsertEstimado.mutateAsync(v) }} />
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">Real (lançamentos)</p>
          <p className="font-display font-bold" style={{ fontSize: '22px', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            {formatCurrency(totalReal)}
          </p>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="mb-2">Diferença</p>
          <div className="flex items-center gap-1.5">
            {diferenca >= 0
              ? <TrendingDown size={16} style={{ color: 'var(--primary)' }} />
              : <TrendingUp size={16} style={{ color: 'var(--danger)' }} />}
            <p className="font-display font-bold" style={{ fontSize: '22px', letterSpacing: '-0.5px', color: diferenca >= 0 ? 'var(--primary)' : 'var(--danger)' }}>
              {estimado === 0 && totalReal === 0 ? '—' : `${diferenca >= 0 ? '+' : ''}${formatCurrency(diferenca)}`}
            </p>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {diferenca >= 0 ? 'abaixo do estimado' : 'acima do estimado'}
          </p>
        </div>
      </div>

      {/* Preview importação */}
      {importPreview && (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: `1.5px solid var(--primary)` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText size={14} style={{ color: 'var(--primary)' }} />
              <span className="font-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {importPreview.length} lançamentos encontrados
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setImportPreview(null)}
                className="px-3 py-1.5 rounded-md text-xs"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-3 py-1.5 rounded-md text-xs text-white font-medium"
                style={{ background: 'var(--primary)' }}
              >
                {importing ? 'Importando...' : `Confirmar importação`}
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {importPreview.slice(0, 20).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', width: '70px' }}>{t.data ?? '—'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)' }} className="truncate">{t.descricao}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: t.tipo === 'credito' ? 'var(--primary)' : 'var(--text-primary)', flexShrink: 0, marginLeft: '8px' }}>
                  {t.tipo === 'credito' ? '+' : '-'}{formatCurrency(t.valor)}
                </span>
              </div>
            ))}
            {importPreview.length > 20 && (
              <p className="text-center pt-2" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                + {importPreview.length - 20} lançamentos
              </p>
            )}
          </div>
        </div>
      )}

      {/* Manual add form */}
      {showAdd && (
        <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Descrição</label>
              <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex: Supermercado"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', minWidth: '180px', fontFamily: 'var(--font-dm-sans)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Valor (R$)</label>
              <input type="text" value={newValor} onChange={e => setNewValor(e.target.value)} placeholder="0,00"
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', width: '110px', fontFamily: 'var(--font-dm-sans)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Data</label>
              <input type="date" value={newData} onChange={e => setNewData(e.target.value)}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontFamily: 'var(--font-dm-sans)' }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
              <select value={newTipo} onChange={e => setNewTipo(e.target.value as 'debito' | 'credito')}
                className="rounded-md px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)', fontFamily: 'var(--font-dm-sans)', color: 'var(--text-primary)' }}>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleManualAdd} disabled={!newDesc || !newValor}
                className="px-4 py-2 rounded-md text-white text-sm font-medium" style={{ background: 'var(--primary)' }}>
                Adicionar
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions table */}
      {transacoes.length > 0 ? (
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border-tertiary)' }}>
                  <th className="text-left px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '90px' }}>Data</th>
                  <th className="text-left px-3 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Descrição</th>
                  <th className="text-left px-3 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '110px' }}>Categoria</th>
                  <th className="text-right px-4 py-3" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, width: '100px' }}>Valor</th>
                  <th style={{ width: '32px' }} />
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t, i) => {
                  const cat = (t as { categorias?: Categoria }).categorias
                  return (
                    <tr key={t.id} className="group" style={{ borderBottom: i < transacoes.length - 1 ? '0.5px solid var(--border-tertiary)' : 'none' }}>
                      <td className="px-4 py-2.5">
                        <input
                          type="date"
                          defaultValue={t.data ?? ''}
                          onBlur={e => e.target.value !== t.data && updateTransacao.mutate({ id: t.id, field: 'data', value: e.target.value || null })}
                          className="outline-none bg-transparent text-xs"
                          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)', width: '80px' }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="text"
                          defaultValue={t.descricao}
                          onBlur={e => e.target.value !== t.descricao && updateTransacao.mutate({ id: t.id, field: 'descricao', value: e.target.value })}
                          className="outline-none bg-transparent w-full"
                          style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-dm-sans)' }}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={t.categoria_id ?? ''}
                          onChange={e => updateTransacao.mutate({ id: t.id, field: 'categoria_id', value: e.target.value || null })}
                          className="outline-none bg-transparent text-xs"
                          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-dm-sans)', maxWidth: '100px' }}
                        >
                          <option value="">—</option>
                          {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <InlineEdit
                          value={t.valor}
                          onSave={async v => { await updateTransacao.mutateAsync({ id: t.id, field: 'valor', value: v }) }}
                        />
                      </td>
                      <td className="pr-3 py-2.5">
                        <button
                          onClick={() => deleteTransacao.mutate(t.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <td colSpan={3} className="px-4 py-2.5 font-medium" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Total débitos</td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ fontSize: '13px', color: 'var(--danger)' }}>{formatCurrency(totalReal)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg p-10 text-center" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <Upload size={24} style={{ color: 'var(--text-tertiary)', margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginBottom: '8px' }}>Nenhum lançamento em {formatMonthTitle(currentMonth)}</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => fileRef.current?.click()} className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              Importar OFX/CSV/PDF
            </button>
            <span style={{ color: 'var(--text-tertiary)' }}>·</span>
            <button onClick={() => setShowAdd(true)} className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
              Adicionar manual
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="rounded-lg p-4" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
        <p className="font-display font-semibold mb-4" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          Estimado — últimos 12 meses
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-tertiary)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={45} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, border: '0.5px solid var(--border-tertiary)', borderRadius: 6 }} />
            <Line type="monotone" dataKey="estimado" name="Estimado" stroke="#0D7C66" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
        Clique em qualquer campo para editar. Salvo automaticamente.
      </p>
    </div>
  )
}
