import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useSession } from '../useSession.js'

export default function AdminLogin() {
  const session = useSession()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (session) return <Navigate to="/admin" replace />

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError('Неверный email или пароль.')
    else navigate('/admin')
  }

  return (
    <div className="page narrow">
      <div className="card">
        <h2>Вход для сотрудников</h2>
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Пароль
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Вход…' : 'Войти'}</button>
        </form>
      </div>
    </div>
  )
}
