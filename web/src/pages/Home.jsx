import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { COLLEGE_NAME, PRIVACY_TEXT } from '../config.js'

export default function Home() {
  const [list, setList] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('list_recipients').then(({ data, error }) => {
      if (error) setError('Не удалось загрузить список. Обновите страницу.')
      else setList(data)
    })
  }, [])

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-badge">{COLLEGE_NAME}</div>
        <h1>Обращение к администрации</h1>
        <p>Выберите, к кому хотите обратиться</p>
      </header>

      {error && <div className="alert error">{error}</div>}
      {!list && !error && <p className="muted center">Загрузка…</p>}

      <div className="list">
        {list?.map((s) => (
          <Link key={s.id} className="list-item" to={'/send/' + s.id} state={{ position: s.position }}>
            <span>{s.position}</span>
            <span className="chevron">›</span>
          </Link>
        ))}
      </div>

      <p className="note">🔒 {PRIVACY_TEXT}</p>
    </div>
  )
}
