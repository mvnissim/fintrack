export interface ParsedTransaction {
  descricao: string
  valor: number
  data: string | null
  tipo: 'debito' | 'credito'
}

export function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []

  const getField = (block: string, field: string): string => {
    const m = new RegExp(`<${field}>([^<\n\r]+)`, 'i').exec(block)
    return m ? m[1].trim() : ''
  }

  // Tenta XML primeiro, depois SGML
  const xmlBlocks = content.match(/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi)
  const sgmlBlocks = content.match(/<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi)
  const blocks = xmlBlocks ?? sgmlBlocks ?? []

  for (const block of blocks) {
    const dtPosted = getField(block, 'DTPOSTED')
    const trnAmt   = getField(block, 'TRNAMT')
    const memo     = getField(block, 'MEMO') || getField(block, 'NAME') || getField(block, 'FITID')

    if (!trnAmt) continue

    const valorRaw = parseFloat(trnAmt.replace(',', '.'))
    if (isNaN(valorRaw) || valorRaw === 0) continue

    const valor = Math.abs(valorRaw)
    const tipo: 'debito' | 'credito' = valorRaw < 0 ? 'debito' : 'credito'
    const data = dtPosted.length >= 8
      ? `${dtPosted.slice(0, 4)}-${dtPosted.slice(4, 6)}-${dtPosted.slice(6, 8)}`
      : null

    transactions.push({ descricao: memo || 'Sem descrição', valor, data, tipo })
  }

  return transactions
}
