import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ backgroundColor: '#F8F5EE' }}
    >
      <h1
        className="text-5xl font-bold"
        style={{ color: '#CBAD74', fontFamily: 'Aptos, Calibri, Arial, sans-serif' }}
      >
        Tulpiaan Pijplijn
      </h1>

      <p
        className="text-xl"
        style={{ color: '#1A1A1A' }}
      >
        Welkom {session.user.name}
      </p>

      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/login' })
        }}
      >
        <button
          type="submit"
          className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: '#1A1A1A',
            color: '#F8F5EE',
          }}
        >
          Uitloggen
        </button>
      </form>
    </main>
  )
}
