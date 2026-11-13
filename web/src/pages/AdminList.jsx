import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { STATUSES } from '../config.js'

const FILTERS = [
  ['active', 'Активные'],
  ['new', 'Новые'],
  ['in_progress', 'В работе'],
  ['answered', 'Отвечено'],
  ['closed', 'Закрыто'],
  ['spam', 'Спам'],
  ['all', 'Все'],
]

export function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminList() {
  const me = useOutletContext()
  const [filter, setFilter] = useState('active')
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setItems(null)
    // RLS в базе сама отдаёт сотруднику только его обращения, администратору — все
    let q = supabase
      .from('messages')
      .select('id, number, created_at, category, status, phone, text, staff(position)')
      .order('created_at', { ascending: false })
      .limit(300)

    if (filter === 'active') q = q.in('status', ['new', 'in_progress'])
    else if (filter !== 'all') q = q.eq('status', filter)

    q.then(({ data, error }) => {
      if (error) setError('Не удалось загрузить обращения.')
      else setItems(data)
    })
  }, [filter])

  return (
    <>
      <div className="filters">
        {FILTERS.map(([key, label]) => (
          <button key={key} className={'chip ' + (filter === key ? 'active' : '')} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {error && <div className="alert error">{error}</div>}
      {!items && !error && <p className="muted center">Загрузка…</p>}
      {items?.length === 0 && <p className="muted center">Обращений нет.</p>}

      <div className="msg-list">
        {items?.map((m) => (
          <Link key={m.id} to={'/admin/m/' + m.id} className="msg-item">
            <div className="msg-top">
              <b>№{m.number}</b>
              <span className={'badge ' + m.status}>{STATUSES[m.status]}</span>
            </div>
            <div className="msg-meta">
              {formatDate(m.created_at)} · {m.category}
              {me.is_admin && <> · <i>{m.staff?.position}</i></>}
            </div>
            <div className="msg-preview">{m.text.length > 140 ? m.text.slice(0, 140) + '…' : m.text}</div>
            {m.phone && <div className="msg-phone">📞 {m.phone}</div>}
          </Link>
        ))}
      </div>
    </>
  )
}
