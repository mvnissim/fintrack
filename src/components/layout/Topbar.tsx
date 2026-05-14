'use client'

import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { useMonth } from '@/contexts/MonthContext'
import { formatMonthTitle } from '@/lib/utils'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { currentMonth, nextMonth, prevMonth } = useMonth()

  return (
    <div
      className="flex items-center justify-between px-4 md:px-6 py-3.5 sticky top-0 z-10"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '0.5px solid var(--border-tertiary)',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Hamburger — só no mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-md mr-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Menu size={18} />
        </button>

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
            className="font-display font-semibold px-1"
            style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              minWidth: '120px',
              textAlign: 'center',
            }}
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
      </div>

      <p className="hidden sm:block text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Salvo automaticamente
      </p>
    </div>
  )
}
