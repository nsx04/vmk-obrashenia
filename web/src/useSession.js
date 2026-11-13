import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// undefined — ещё загружается, null — не вошёл, объект — сессия
export function useSession() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  return session
}
