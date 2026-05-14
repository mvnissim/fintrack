'use client'

import { useState, useRef, useEffect } from 'react'
import { formatCurrency, parseCurrencyInput } from '@/lib/utils'

interface InlineEditProps {
  value: number | null | undefined
  onSave: (value: number) => Promise<void>
  placeholder?: string
  className?: string
}

export function InlineEdit({ value, onSave, placeholder = '—', className }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function handleClick() {
    setInputValue(value != null ? String(value).replace('.', ',') : '')
    setEditing(true)
  }

  async function handleBlur() {
    setEditing(false)
    const parsed = parseCurrencyInput(inputValue)
    if (parsed !== (value ?? 0)) {
      setSaving(true)
      try {
        await onSave(parsed)
      } finally {
        setSaving(false)
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`inline-input ${className ?? ''}`}
        placeholder="0,00"
      />
    )
  }

  return (
    <button
      onClick={handleClick}
      className="text-right transition-opacity hover:opacity-70"
      style={{
        fontSize: '13px',
        fontWeight: 500,
        color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
        fontFamily: 'var(--font-dm-sans)',
        opacity: saving ? 0.5 : 1,
        minWidth: '80px',
        display: 'block',
        cursor: 'text',
      }}
    >
      {value != null && value > 0 ? formatCurrency(value) : placeholder}
    </button>
  )
}
