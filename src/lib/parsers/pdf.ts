import type { ParsedTransaction } from './ofx'

export async function parsePDF(file: File): Promise<ParsedTransaction[]> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Erro ao processar PDF')
  }

  return res.json()
}
