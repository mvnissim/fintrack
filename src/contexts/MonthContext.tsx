'use client'

import { createContext, useContext, useState } from 'react'
import { getCurrentMonth, addMonths } from '@/lib/utils'

interface MonthContextType {
  currentMonth: string
  setCurrentMonth: (month: string) => void
  nextMonth: () => void
  prevMonth: () => void
}

const MonthContext = createContext<MonthContextType | undefined>(undefined)

export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth)

  const nextMonth = () => setCurrentMonth(m => addMonths(m, 1))
  const prevMonth = () => setCurrentMonth(m => addMonths(m, -1))

  return (
    <MonthContext.Provider value={{ currentMonth, setCurrentMonth, nextMonth, prevMonth }}>
      {children}
    </MonthContext.Provider>
  )
}

export function useMonth() {
  const ctx = useContext(MonthContext)
  if (!ctx) throw new Error('useMonth must be used within MonthProvider')
  return ctx
}
