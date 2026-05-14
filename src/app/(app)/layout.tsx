import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MonthProvider } from '@/contexts/MonthContext'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <MonthProvider>
      <div className="min-h-screen" style={{ background: 'var(--bg-tertiary)' }}>
        <Sidebar userEmail={user.email} />
        <div style={{ marginLeft: '200px' }}>
          <Topbar />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </MonthProvider>
  )
}
