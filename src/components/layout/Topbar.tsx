'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonth } from '@/contexts/MonthContext'
import { formatMonthTitle } from '@/lib/utils'

export function Topbar() {
  const { currentMonth, nextMonth, prevMonth } = useMonth()

  return (
    <div
      className="flex items-center justify-between px-6 py-3.5"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '0.5px solid var(--border-tertiary)',
      }}
    >
      {/* Month selector */}
      <div className="flex items-center gap-1">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-gray-100"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={15} />
        </button>
        <span
          className="font-display font-semibold px-2"
          style={{ fontSize: '15px', color: 'var(--text-primary)', minWidth: '140px', textAlign: 'center' }}
        >
          {formatMonthTitle(currentMonth)}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-gray-100"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Last updated hint */}
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Salvo automaticamente
      </p>
    </div>
  )
}
