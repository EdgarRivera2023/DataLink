'use client'

import { useSession, signIn, signOut } from "next-auth/react"

export default function HomePage() {
  const { data: session, status } = useSession()

  // 1. Manejamos el estado de carga
  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <p className="text-lg animate-pulse text-blue-600 font-medium">Cargando sesión...</p>
      </main>
    )
  }

  // 2. Si hay sesión activa
  if (session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome, {session.user.name || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">You are logged into MLA Dashboard.</p>
        
        <div className="flex gap-4 mt-6">
          <button 
            onClick={() => window.location.href = '/dashboard/admin'} 
            className="rounded-md bg-green-600 px-6 py-2 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Go to Admin Panel
          </button>
          <button 
            onClick={() => signOut()} 
            className="rounded-md bg-red-600 px-6 py-2 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </main>
    )
  }

  // 3. Si NO hay sesión
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800">MLA Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">Please sign in to continue.</p>
      <button 
        onClick={() => signIn(undefined, { callbackUrl: '/dashboard/admin' })} 
        className="mt-6 rounded-md bg-blue-600 px-8 py-3 text-white font-bold shadow-lg hover:bg-blue-700 transition-all"
      >
        Sign In
      </button>
    </main>
  )
}