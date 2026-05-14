import { cn } from '@/lib/utils'

const categoryStyles: Record<string, { bg: string; color: string }> = {
  'Tênis': { bg: '#E1F5EE', color: '#0F6E56' },
  'Casa': { bg: '#E6F1FB', color: '#185FA5' },
  'Educação': { bg: '#FAEEDA', color: '#854F0B' },
  'Saúde': { bg: '#FCEBEB', color: '#A32D2D' },
  'Lazer': { bg: '#F3E8FF', color: '#6B21A8' },
  'Alimentação': { bg: '#FEF3C7', color: '#92400E' },
}

interface CategoryTagProps {
  nome: string
  cor?: string
  className?: string
}

export function CategoryTag({ nome, cor, className }: CategoryTagProps) {
  const style = categoryStyles[nome] ?? {
    bg: '#F3F4F6',
    color: '#4B5563',
  }

  return (
    <span
      className={cn('inline-block rounded-full text-xs font-medium', className)}
      style={{
        background: style.bg,
        color: style.color,
        padding: '2px 8px',
        fontSize: '11px',
        letterSpacing: '0.1px',
      }}
    >
      {nome}
    </span>
  )
}
