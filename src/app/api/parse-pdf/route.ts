// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>

import { NextRequest, NextResponse } from 'next/server'

interface Transaction {
  descricao: string
  valor: number
  data: string | null
  tipo: 'debito' | 'credito'
}

function parseBRValue(raw: string): number {
  return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0
}

// DD/MM → YYYY-MM-DD (usa o ano do mês da data atual como referência)
function parseBRDate(day: string, month: string): string {
  const now = new Date()
  // Se o mês da fatura for maior que o mês atual, é do ano anterior
  const year = parseInt(month) > now.getMonth() + 1 ? now.getFullYear() - 1 : now.getFullYear()
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Linhas a ignorar (cabeçalhos, saldos, pagamentos, totais)
const SKIP_RE = [
  /^data\s+histórico/i,
  /histórico\s+moeda/i,
  /^moeda\s+de/i,
  /^us\$/i,
  /saldo anterior/i,
  /^pagto\./i,
  /pagamento mínimo/i,
  /^total\s+(para|da|de)/i,
  /total da fatura/i,
  /^situação do extrato/i,
  /^aplicativo bradesco/i,
  /^data:\s*\d/i,
  /^xxxx/i,
  /^\./,
]

function shouldSkip(line: string): boolean {
  return SKIP_RE.some(r => r.test(line))
}

// Regex principal: DD/MM  DESCRIÇÃO  1.234,56
const TX_FULL = /^(\d{1,2})\/(\d{2})\s+(.+?)\s+([-+]?\d{1,3}(?:\.\d{3})*,\d{2})\s*$/

// Linha sem valor no fim (descrição quebrou para próxima linha)
const TX_NO_VALUE = /^(\d{1,2})\/(\d{2})\s+(.+)$/

// Continuação de linha quebrada: "N/M  1.234,56"  (ex: "1/12 196,15")
const CONTINUATION = /^(\d{1,2})\/(\d{2})\s+([-+]?\d{1,3}(?:\.\d{3})*,\d{2})\s*$/

function parsePDFText(text: string): Transaction[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const transactions: Transaction[] = []

  let pending: { day: string; month: string; desc: string } | null = null

  for (const line of lines) {
    if (shouldSkip(line)) {
      pending = null
      continue
    }

    // Tenta encaixar continuação de linha quebrada (ex: "1/12 196,15")
    if (pending) {
      const cont = CONTINUATION.exec(line)
      if (cont) {
        const installment = `${cont[1]}/${cont[2]}`
        const valorRaw = cont[3]
        const valor = parseBRValue(valorRaw)
        if (valor > 0) {
          transactions.push({
            descricao: `${pending.desc} ${installment}`.trim(),
            valor,
            data: parseBRDate(pending.day, pending.month),
            tipo: valorRaw.startsWith('-') ? 'credito' : 'debito',
          })
        }
        pending = null
        continue
      }
      pending = null
    }

    // Linha completa: data + descrição + valor
    const full = TX_FULL.exec(line)
    if (full) {
      const [, day, month, desc, valorRaw] = full
      const valor = parseBRValue(valorRaw)
      if (valor > 0 && desc.trim()) {
        transactions.push({
          descricao: desc.trim(),
          valor,
          data: parseBRDate(day, month),
          tipo: valorRaw.startsWith('-') ? 'credito' : 'debito',
        })
      }
      continue
    }

    // Linha com data + descrição mas SEM valor (vai quebrar na próxima)
    const noVal = TX_NO_VALUE.exec(line)
    if (noVal) {
      // Confirma que o fim da linha não é um valor (evita falso positivo)
      const endsWithValue = /\d+,\d{2}$/.test(line)
      if (!endsWithValue) {
        pending = { day: noVal[1], month: noVal[2], desc: noVal[3] }
      }
    }
  }

  return transactions
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const pdf = await pdfParse(buffer)
    const transactions = parsePDFText(pdf.text)

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma transação encontrada no PDF. Verifique se o arquivo é um extrato/fatura de cartão.' },
        { status: 422 }
      )
    }

    return NextResponse.json(transactions)
  } catch (err) {
    console.error('parse-pdf error:', err)
    return NextResponse.json({ error: 'Erro ao processar PDF' }, { status: 500 })
  }
}
