import { useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { STATUSES } from '../config.js'
import { formatDate } from './AdminList.jsx'

export default function AdminMessage() {
  const { id } = useParams()
  const me = useOutletContext()
  const [msg, setMsg] = useState(undefined)
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState('new')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState(null) // { type: 'ok' | 'error', text }

  useEffect(() => {
    supabase
      .from('messages')
      .select('*, staff(position)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setMsg(data ?? null)
        if (data) {
          setReply(data.reply ?? '')
          setStatus(data.status)
          supabase.rpc('log_open', { p_message_id: id }) // запись в журнал
        }
      })
  }, [id])

  async function save() {
    setBusy(true)
    setInfo(null)
    const newReply = reply.trim() || null
    const replyChanged = newReply !== (msg.reply ?? null)

    const { data, error } = await supabase
      .from('messages')
      .update({ reply: newReply, status })
      .eq('id', id)
      .select('*, staff(position)')
      .single()

    if (error) {
      setBusy(false)
      return setInfo({ type: 'error', text: 'Не удалось сохранить.' })
    }

    setMsg(data)
    setStatus(data.status)

    if (replyChanged && newReply && data.student_chat_id) {
      const { error: fnError } = await supabase.functions.invoke('notify-reply', { body: { message_id: id } })
      setInfo(fnError
        ? { type: 'error', text: 'Ответ сохранён, но не отправлен в Telegram. Попробуйте ещё раз.' }
        : { type: 'ok', text: 'Ответ сохранён и отправлен студенту в Telegram.' })
    } else {
      setInfo({ type: 'ok', text: 'Сохранено.' })
    }
    setBusy(false)
  }

  if (msg === undefined) return <p className="muted center">Загрузка…</p>
  if (msg === null) return <div className="alert error">Обращение не найдено или нет доступа.</div>

  return (
    <>
      <Link to="/admin" className="back">← К списку</Link>

      <div className="card">
        <div className="msg-top">
          <h2>Обращение №{msg.number}</h2>
          <span className={'badge ' + msg.status}>{STATUSES[msg.status]}</span>
        </div>

        <dl className="details">
          <dt>Дата</dt><dd>{formatDate(msg.created_at)}</dd>
          <dt>Тема</dt><dd>{msg.category}</dd>
          {me.is_admin && <><dt>Кому</dt><dd>{msg.staff?.position}</dd></>}
          <dt>Телефон</dt>
          <dd>{msg.phone ? <a href={'tel:' + msg.phone}>{msg.phone}</a> : <span className="muted">удалён (срок хранения истёк)</span>}</dd>
        </dl>

        <div className="msg-text">{msg.text}</div>
      </div>

      <div className="card">
        <h3>Ответ</h3>
        {msg.replied_at && <p className="muted small">Последний ответ: {formatDate(msg.replied_at)}</p>}
        <div className="form">
          <textarea
            rows={6}
            maxLength={3000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Текст ответа — придёт студенту в Telegram"
          />
          <label>
            Статус
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
          {info && <div className={'alert ' + (info.type === 'ok' ? 'ok' : 'error')}>{info.text}</div>}
          <button className="btn" onClick={save} disabled={busy}>
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </>
  )
}
