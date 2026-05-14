'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Verifique seu email para confirmar o cadastro.')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message === 'Invalid login credentials'
          ? 'Email ou senha incorretos'
          : err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <TrendingUp size={16} color="white" />
          </div>
          <span className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
            FinTrack
          </span>
        </div>

        {/* Card */}
        <div className="rounded-lg p-8" style={{ background: 'var(--bg-primary)', border: '0.5px solid var(--border-tertiary)' }}>
          <h1 className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Acesse sua conta FinTrack' : 'Comece a controlar suas finanças'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors"
                style={{
                  border: '1px solid var(--border-primary)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-dm-sans)',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 rounded-md text-sm outline-none transition-colors pr-10"
                  style={{
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs py-2 px-3 rounded-md" style={{
                color: error.includes('Verifique') ? 'var(--primary)' : 'var(--danger)',
                background: error.includes('Verifique') ? 'var(--primary-light)' : '#FCEBEB',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-medium text-white transition-opacity mt-2"
              style={{ background: loading ? '#6BAF9F' : 'var(--primary)' }}
            >
              {loading ? 'Entrando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
              <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                {mode === 'login' ? 'Criar agora' : 'Entrar'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
