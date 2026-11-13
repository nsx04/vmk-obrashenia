import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useSession } from '../useSession.js'

export default function AdminLayout() {
  const session = useSession()
  const [me, setMe] = useState(undefined) // undefined — загрузка, null — не привязан к должности

  useEffect(() => {
    if (!session) return
    supabase
      .from('staff')
      .select('id, position, full_name, is_admin')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setMe(data ?? null))
  }, [session])

  const logout = () => supabase.auth.signOut()

  if (session === undefined) return <p className="page muted center">Загрузка…</p>
  if (!session) return <Navigate to="/admin/login" replace />
  if (me === undefined) return <p className="page muted center">Загрузка…</p>

  if (me === null) {
    return (
      <div className="page narrow">
        <div className="alert error">Ваш аккаунт не привязан к должности. Обратитесь к администратору системы.</div>
        <button className="btn secondary" onClick={logout}>Выйти</button>
      </div>
    )
  }

  return (
    <div>
      <header className="topbar">
        <Link to="/admin" className="brand">📩 Обращения</Link>
        <div className="who">
          <span>{me.is_admin ? 'Администратор' : me.position}</span>
          <button className="btn-link" onClick={logout}>Выйти</button>
        </div>
      </header>
      <main className="page wide">
        <Outlet context={me} />
      </main>
    </div>
  )
}
