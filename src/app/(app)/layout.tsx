import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayoutClient } from '@/components/layout/AppLayoutClient'
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
      <AppLayoutClient userEmail={user.email}>
        {children}
      </AppLayoutClient>
    </MonthProvider>
  )
}
