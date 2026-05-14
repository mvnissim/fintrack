'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useMonth } from '@/contexts/MonthContext'
import { getLastNMonths, isParcelaActiveInMonth } from '@/lib/utils'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { CommitmentBar } from '@/components/dashboard/CommitmentBar'
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart'
import { MonthlyBarChart } from '@/components/dashboard/MonthlyBarChart'
import { TopExpenses } from '@/components/dashboard/TopExpenses'
import { seedInitialData } from '@/lib/seed'
import { useEffect } from 'react'

export default function DashboardPage() {
  const supabase = createClient()
  const { currentMonth } = useMonth()

  // Seed check on first load
  useEffect(() => {
    async function checkSeed() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await seedInitialData(user.id)
    }
    checkSeed()
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', currentMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const last6 = getLastNMonths(currentMonth, 6)

      const [
        { data: receitas },
        { data: despesasFixas },
        { data: parcelas },
        { data: gastoCartao },
        { data: investimentos },
        { data: categorias },
        { data: receitasHist },
        { data: despFixasHist },
        { data: parcelasAll },
        { data: cartaoHist },
      ] = await Promise.all([
        supabase.from('receitas').select('*').eq('user_id', user.id).eq('mes', currentMonth),
        supabase.from('despesas_fixas').select('*, categorias(*)').eq('user_id', user.id).eq('ativo', true),
        supabase.from('parcelas').select('*, categorias(*)').eq('user_id', user.id),
        supabase.from('gastos_cartao').select('*').eq('user_id', user.id).eq('mes', currentMonth).maybeSingle(),
        supabase.from('investimentos').select('*').eq('user_id', user.id).eq('mes', currentMonth),
        supabase.from('categorias').select('*').eq('user_id', user.id),
        supabase.from('receitas').select('*').eq('user_id', user.id).in('mes', last6),
        supabase.from('despesas_fixas').select('valores, ativo').eq('user_id', user.id).eq('ativo', true),
        supabase.from('parcelas').select('*').eq('user_id', user.id),
        supabase.from('gastos_cartao').select('*').eq('user_id', user.id).in('mes', last6),
      ])

      // Current month calcs
      const totalReceitas = (receitas ?? []).reduce((s, r) => s + r.valor, 0)

      const totalDespesasFixas = (despesasFixas ?? []).reduce((s, d) => {
        return s + (d.valores?.[currentMonth] ?? 0)
      }, 0)

      const totalParcelas = (parcelas ?? []).reduce((s, p) => {
        if (isParcelaActiveInMonth(p, currentMonth)) return s + p.valor_parcela
        return s
      }, 0)

      const totalCartao = gastoCartao?.valor_estimado ?? 0
      const totalComprometido = totalDespesasFixas + totalParcelas + totalCartao
      const saldoLivre = totalReceitas - totalComprometido
      const totalInvestido = (investimentos ?? []).reduce((s, i) => s + (i.realizado ?? 0), 0)

      // Category distribution
      const catMap: Record<string, { nome: string; valor: number; cor: string }> = {}
      const catData = categorias ?? []

      ;(despesasFixas ?? []).forEach(d => {
        const v = d.valores?.[currentMonth] ?? 0
        if (v > 0 && d.categorias) {
          const cat = d.categorias as { id: string; nome: string; cor: string }
          if (!catMap[cat.nome]) catMap[cat.nome] = { nome: cat.nome, valor: 0, cor: cat.cor }
          catMap[cat.nome].valor += v
        }
      })
      ;(parcelas ?? []).forEach(p => {
        if (!isParcelaActiveInMonth(p, currentMonth)) return
        const cat = (p as { categorias?: { id: string; nome: string; cor: string } }).categorias
        if (cat) {
          if (!catMap[cat.nome]) catMap[cat.nome] = { nome: cat.nome, valor: 0, cor: cat.cor }
          catMap[cat.nome].valor += p.valor_parcela
        }
      })
      const categoryData = Object.values(catMap).filter(c => c.valor > 0)

      // Top expenses
      const topGastos: { descricao: string; valor: number }[] = []
      ;(despesasFixas ?? []).forEach(d => {
        const v = d.valores?.[currentMonth] ?? 0
        if (v > 0) topGastos.push({ descricao: d.descricao, valor: v })
      })
      ;(parcelas ?? []).forEach(p => {
        if (isParcelaActiveInMonth(p, currentMonth)) {
          topGastos.push({ descricao: p.descricao, valor: p.valor_parcela })
        }
      })
      if (totalCartao > 0) topGastos.push({ descricao: 'Cartão (estimado)', valor: totalCartao })

      // Historical data (last 6 months)
      const monthlyData = last6.map(mes => {
        const rec = (receitasHist ?? []).filter(r => r.mes === mes).reduce((s, r) => s + r.valor, 0)
        const fixas = (despFixasHist ?? []).reduce((s: number, d: { valores: Record<string, number> }) => s + (d.valores?.[mes] ?? 0), 0)
        const parc = (parcelasAll ?? []).reduce((s: number, p: { mes_inicio: string; total_parcelas: number; parcela_inicial: number; valor_parcela: number }) => {
          if (isParcelaActiveInMonth(p, mes)) return s + p.valor_parcela
          return s
        }, 0)
        const cart = (cartaoHist ?? []).find(c => c.mes === mes)?.valor_estimado ?? 0
        return { mes, receita: rec, comprometido: fixas + parc + cart }
      })

      return {
        totalReceitas,
        totalDespesasFixas,
        totalParcelas,
        totalCartao,
        totalComprometido,
        saldoLivre,
        totalInvestido,
        categoryData,
        topGastos,
        monthlyData,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <SummaryCards
        totalReceitas={data.totalReceitas}
        totalComprometido={data.totalComprometido}
        saldoLivre={data.saldoLivre}
        totalInvestido={data.totalInvestido}
      />

      <CommitmentBar
        totalReceitas={data.totalReceitas}
        totalDespesasFixas={data.totalDespesasFixas}
        totalParcelas={data.totalParcelas}
        totalCartao={data.totalCartao}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryPieChart data={data.categoryData} />
        <MonthlyBarChart data={data.monthlyData} />
      </div>

      <TopExpenses items={data.topGastos} />
    </div>
  )
}
