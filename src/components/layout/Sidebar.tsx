'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TrendingUp, LayoutDashboard, Repeat, CreditCard, BarChart2, PiggyBank, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/despesas-fixas', label: 'Despesas Fixas', icon: Repeat },
  { href: '/parcelas', label: 'Parcelas', icon: CreditCard },
  { href: '/cartao', label: 'Cartão', icon: BarChart2 },
  { href: '/investimentos', label: 'Investimentos', icon: PiggyBank },
]

interface SidebarProps {
  userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-10"
      style={{
        width: '200px',
        background: 'var(--bg-primary)',
        borderRight: '0.5px solid var(--border-tertiary)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          <TrendingUp size={14} color="white" />
        </div>
        <span
          className="font-display font-bold text-lg"
          style={{ color: 'var(--text-primary)' }}
        >
          FinTrack
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 pt-2 pb-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-5 py-2.5 text-sm transition-colors',
                isActive ? 'font-medium' : 'font-normal'
              )}
              style={{
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                fontSize: '13px',
              }}
            >
              <Icon size={15} style={{ flexShrink: 0, width: '18px' }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '0.5px solid var(--border-tertiary)' }}
      >
        <p
          className="text-xs truncate mb-2"
          style={{ color: 'var(--text-secondary)' }}
          title={userEmail}
        >
          {userEmail || 'Usuário'}
        </p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <LogOut size={13} />
          Sair
        </button>
      </div>
    </aside>
  )
}
