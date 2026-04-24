import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F8F5EE' }}>
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#F8F5EE' }}>
        {children}
      </main>
    </div>
  )
}
