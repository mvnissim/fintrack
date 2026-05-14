import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatMonthLabel(mes: string): string {
  const [year, month] = mes.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function formatMonthShort(mes: string): string {
  const [year, month] = mes.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'short' })
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
}

export function formatMonthTitle(mes: string): string {
  const [year, month] = mes.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function addMonths(mes: string, n: number): string {
  const [year, month] = mes.split('-').map(Number)
  const date = new Date(year, month - 1 + n, 1)
  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')
  return `${newYear}-${newMonth}`
}

export function getLastNMonths(mes: string, n: number): string[] {
  const months: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(addMonths(mes, -i))
  }
  return months
}

export function getMonthsInYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    return `${year}-${month}`
  })
}

export function getParcelaEndMonth(parcela: {
  mes_inicio: string
  total_parcelas: number
  parcela_inicial: number
}): string {
  const totalPagas = parcela.total_parcelas - parcela.parcela_inicial + 1
  return addMonths(parcela.mes_inicio, totalPagas - 1)
}

export function isParcelaActiveInMonth(
  parcela: { mes_inicio: string; total_parcelas: number; parcela_inicial: number },
  mes: string
): boolean {
  const endMonth = getParcelaEndMonth(parcela)
  return mes >= parcela.mes_inicio && mes <= endMonth
}

export function getPaidParcelas(
  parcela: { mes_inicio: string; total_parcelas: number; parcela_inicial: number },
  currentMes: string
): number {
  if (currentMes < parcela.mes_inicio) return 0
  const [startYear, startMonth] = parcela.mes_inicio.split('-').map(Number)
  const [currYear, currMonth] = currentMes.split('-').map(Number)
  const monthsDiff = (currYear - startYear) * 12 + (currMonth - startMonth)
  const totalParcelas = parcela.total_parcelas - parcela.parcela_inicial + 1
  return Math.min(monthsDiff + 1, totalParcelas)
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}
