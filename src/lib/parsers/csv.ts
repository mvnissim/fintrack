import type { ParsedTransaction } from './ofx'

function parseDate(raw: string): string | null {
  // DD/MM/YYYY ou YYYY-MM-DD
  const dmY = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim())
  if (dmY) return `${dmY[3]}-${dmY[2]}-${dmY[1]}`
  const Ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim())
  if (Ymd) return raw.trim()
  return null
}

function parseValor(raw: string): number {
  const cleaned = raw.trim().replace(/[R$\s]/g, '').replace('.', '').replace(',', '.')
  return Math.abs(parseFloat(cleaned) || 0)
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Detecta separador
  const sep = lines[0].includes(';') ? ';' : ','

  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/"/g, ''))

  // Mapeia colunas comuns do Bradesco e outros bancos
  const colData    = headers.findIndex(h => h.includes('data') || h.includes('date'))
  const colDesc    = headers.findIndex(h => h.includes('hist') || h.includes('descri') || h.includes('memo') || h.includes('lançamento'))
  const colValor   = headers.findIndex(h => h.includes('valor') || h.includes('amount') || h.includes('quantia'))
  const colTipo    = headers.findIndex(h => h.includes('tipo') || h.includes('natureza'))

  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim().replace(/"/g, ''))
    if (cols.length < 2) continue

    const descricao = colDesc >= 0 ? cols[colDesc] : cols[1] ?? 'Lançamento'
    const valorRaw  = colValor >= 0 ? cols[colValor] : cols[2] ?? '0'
    const dataRaw   = colData >= 0 ? cols[colData] : cols[0] ?? ''
    const tipoRaw   = colTipo >= 0 ? cols[colTipo]?.toLowerCase() : ''

    const valor = parseValor(valorRaw)
    if (!valor || !descricao) continue

    const data = parseDate(dataRaw)
    const tipo: 'debito' | 'credito' = tipoRaw.includes('cred') || tipoRaw.includes('entr')
      ? 'credito'
      : valorRaw.trim().startsWith('-') ? 'credito' : 'debito'

    transactions.push({ descricao, valor, data, tipo })
  }

  return transactions
}
