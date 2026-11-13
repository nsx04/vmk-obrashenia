import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { useSession } from '../useSession.js'

export default function AdminPassword() {
  const session = useSession()
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (session === undefined) return <p className="page muted center">Загрузка…</p>
  if (!session) return <Navigate to="/admin/login" replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (p1.length < 8) return setError('Пароль должен быть не короче 8 символов.')
    if (p1 !== p2) return setError('Пароли не совпадают.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: p1 })
    setBusy(false)
    if (error) return setError('Не удалось сменить пароль. Попробуйте другой пароль.')
    navigate('/admin')
  }

  return (
    <div className="page narrow">
      <Link to="/admin" className="back">← Назад</Link>
      <div className="card">
        <h2>Смена пароля</h2>
        <p className="muted small">{session.user.email}</p>
        <form onSubmit={submit} className="form">
          <label>
            Новый пароль
            <input type="password" required value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" />
          </label>
          <label>
            Повторите пароль
            <input type="password" required value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Сохранение…' : 'Сохранить пароль'}</button>
        </form>
      </div>
    </div>
  )
}
