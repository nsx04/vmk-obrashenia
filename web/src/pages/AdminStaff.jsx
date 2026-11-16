import { useEffect, useState } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { formatDate } from './AdminList.jsx'

// Вызов серверной функции управления аккаунтами (только для администратора)
async function callAdmin(body) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body })
  if (error) {
    let text = 'Ошибка сервера'
    try {
      const j = await error.context.json()
      if (j.error) text = j.error
    } catch (e) { /* ответ без JSON */ }
    throw new Error(text)
  }
  return data
}

function Alert({ msg }) {
  if (!msg) return null
  return <div className={'alert ' + (msg.type === 'ok' ? 'ok' : 'error')}>{msg.text}</div>
}

// Одна должность: название, ФИО, привязанный аккаунт, Telegram, видимость
function StaffRow({ row, users, onSaved }) {
  const [f, setF] = useState({
    position: row.position,
    full_name: row.full_name ?? '',
    user_id: row.user_id ?? '',
    telegram_chat_id: row.telegram_chat_id ?? '',
    is_active: row.is_active,
    is_recipient: row.is_recipient,
  })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const set = (key) => (e) =>
    setF({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function save() {
    setMsg(null)
    const chat = String(f.telegram_chat_id).trim()
    if (!f.position.trim()) return setMsg({ type: 'error', text: 'Укажите название должности.' })
    if (chat && !/^-?\d+$/.test(chat)) return setMsg({ type: 'error', text: 'Chat id — только цифры.' })

    const patch = {
      position: f.position.trim(),
      full_name: f.full_name.trim() || null,
      telegram_chat_id: chat ? Number(chat) : null,
    }
    // Строку администратора не отвязываем и не скрываем, чтобы не потерять доступ
    if (!row.is_admin) {
      patch.user_id = f.user_id || null
      patch.is_active = f.is_active
      patch.is_recipient = f.is_recipient
    }

    setBusy(true)
    const { error } = await supabase.from('staff').update(patch).eq('id', row.id)
    setBusy(false)
    if (error) {
      return setMsg({
        type: 'error',
        text: error.code === '23505' ? 'Этот аккаунт уже привязан к другой должности.' : 'Не удалось сохранить.',
      })
    }
    setMsg({ type: 'ok', text: 'Сохранено.' })
    onSaved()
  }

  return (
    <div className="card">
      <div className="form">
        <label>
          Должность
          <input value={f.position} onChange={set('position')} />
        </label>
        <label>
          ФИО сотрудника
          <input value={f.full_name} onChange={set('full_name')} placeholder="Например: Иванова А. Б." />
        </label>
        <label>
          Аккаунт для входа
          <select value={f.user_id} onChange={set('user_id')} disabled={row.is_admin}>
            <option value="">— не привязан —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
        </label>
        <label>
          Telegram chat id (для уведомлений)
          <input value={f.telegram_chat_id} onChange={set('telegram_chat_id')} placeholder="Сотрудник пишет боту /start — бот пришлёт число" />
        </label>
        {!row.is_admin && (
          <>
            <label className="check">
              <input type="checkbox" checked={f.is_recipient} onChange={set('is_recipient')} />
              <span>Показывать студентам в списке адресатов</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={f.is_active} onChange={set('is_active')} />
              <span>Должность активна (если выключить — сотрудник не сможет войти в панель)</span>
            </label>
          </>
        )}
        <Alert msg={msg} />
        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

function AddPosition({ onAdded }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function add() {
    setMsg(null)
    if (!name.trim()) return setMsg({ type: 'error', text: 'Введите название должности.' })
    setBusy(true)
    const { error } = await supabase.from('staff').insert({ position: name.trim(), sort: 50 })
    setBusy(false)
    if (error) return setMsg({ type: 'error', text: 'Не удалось добавить должность.' })
    setName('')
    setMsg({ type: 'ok', text: 'Должность добавлена — она появилась в списке выше.' })
    onAdded()
  }

  return (
    <div className="card">
      <h3>Новая должность</h3>
      <div className="form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Куратор" />
        <Alert msg={msg} />
        <button className="btn secondary" onClick={add} disabled={busy}>Добавить должность</button>
      </div>
    </div>
  )
}

function CreateUser({ onCreated }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function create(e) {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      await callAdmin({ action: 'create', email, password })
      setMsg({ type: 'ok', text: 'Аккаунт создан. Привяжите его к должности в разделе выше.' })
      setEmail('')
      setPassword('')
      onCreated()
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
    setBusy(false)
  }

  return (
    <div className="card">
      <h3>Создать аккаунт сотрудника</h3>
      <form className="form" onSubmit={create}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Пароль (не короче 8 символов)
          <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
        </label>
        <Alert msg={msg} />
        <button className="btn" disabled={busy}>{busy ? 'Создание…' : 'Создать аккаунт'}</button>
      </form>
    </div>
  )
}

function UserRow({ user }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function savePassword() {
    setMsg(null)
    if (password.length < 8) return setMsg({ type: 'error', text: 'Пароль должен быть не короче 8 символов.' })
    setBusy(true)
    try {
      await callAdmin({ action: 'set_password', user_id: user.id, password })
      setMsg({ type: 'ok', text: 'Пароль изменён. Сообщите его сотруднику.' })
      setPassword('')
      setOpen(false)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    }
    setBusy(false)
  }

  return (
    <div className="msg-item">
      <div className="msg-top">
        <b>{user.email}</b>
        <button className="btn-link" onClick={() => setOpen(!open)}>
          {open ? 'Отмена' : 'Сменить пароль'}
        </button>
      </div>
      <div className="msg-meta">
        {user.position || 'не привязан к должности'} · последний вход:{' '}
        {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'ещё не входил'}
      </div>
      {open && (
        <div className="form">
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Новый пароль" autoComplete="off" />
          <button className="btn" onClick={savePassword} disabled={busy}>
            {busy ? 'Сохранение…' : 'Сохранить пароль'}
          </button>
        </div>
      )}
      <Alert msg={msg} />
    </div>
  )
}

export default function AdminStaff() {
  const me = useOutletContext()
  const [staff, setStaff] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!me.is_admin) return
    supabase
      .from('staff')
      .select('*')
      .order('is_admin', { ascending: false })
      .order('sort')
      .order('position')
      .then(({ data, error }) => {
        if (error) setError('Не удалось загрузить должности.')
        else setStaff(data)
      })
    callAdmin({ action: 'list' })
      .then((d) => setUsers(d.users))
      .catch((e) => setError('Не удалось загрузить аккаунты: ' + e.message))
  }, [reload, me.is_admin])

  if (!me.is_admin) return <Navigate to="/admin" replace />

  const refresh = () => setReload((n) => n + 1)
  const usersWithPosition = users.map((u) => ({
    ...u,
    position: staff?.find((s) => s.user_id === u.id)?.position,
  }))

  return (
    <>
      <Link to="/admin" className="back">← К обращениям</Link>
      {error && <div className="alert error">{error}</div>}

      <h2>Должности</h2>
      <p className="muted small">
        Если сотрудник ушёл — создайте аккаунт новому сотруднику ниже и выберите его в поле
        «Аккаунт для входа» нужной должности. Все обращения остаются за должностью.
      </p>
      {!staff && !error && <p className="muted center">Загрузка…</p>}
      {staff?.map((row) => (
        <StaffRow key={row.id} row={row} users={users} onSaved={refresh} />
      ))}
      <AddPosition onAdded={refresh} />

      <h2>Аккаунты сотрудников</h2>
      <CreateUser onCreated={refresh} />
      <div className="msg-list">
        {usersWithPosition.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
      </div>
    </>
  )
}
