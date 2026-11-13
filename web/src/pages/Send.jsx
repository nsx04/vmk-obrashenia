import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { supabase, TG_BOT } from '../supabase.js'
import { CATEGORIES, CONSENT_TEXT, PRIVACY_TEXT, URGENT_FOR, URGENT_TEXT } from '../config.js'

export default function Send() {
  const { staffId } = useParams()
  const location = useLocation()
  const [position, setPosition] = useState(location.state?.position ?? '')

  const [step, setStep] = useState('form') // form → verify → done
  const [category, setCategory] = useState(CATEGORIES[0])
  const [text, setText] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [number, setNumber] = useState(null)

  // Если открыли по прямой ссылке — подгружаем название должности
  useEffect(() => {
    if (position) return
    supabase.rpc('list_recipients').then(({ data }) => {
      const found = data?.find((s) => s.id === staffId)
      setPosition(found ? found.position : null)
    })
  }, [position, staffId])

  // Пока студент подтверждает номер в Telegram — проверяем статус каждые 3 сек.
  useEffect(() => {
    if (step !== 'verify') return
    const timer = setInterval(async () => {
      const { data } = await supabase.rpc('draft_status', { p_token: token })
      const row = data?.[0]
      if (row && row.status !== 'pending') {
        setNumber(row.number)
        setStep('done')
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [step, token])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (text.trim().length < 10) return setError('Опишите обращение подробнее (минимум 10 символов).')
    if (!consent) return setError('Нужно согласие на обработку номера телефона.')

    setBusy(true)
    const { data, error } = await supabase.rpc('create_draft', {
      p_staff_id: staffId,
      p_category: category,
      p_text: text,
    })
    setBusy(false)

    if (error) return setError(error.message || 'Ошибка отправки. Попробуйте ещё раз.')
    setToken(data)
    setStep('verify')
  }

  if (position === null) {
    return (
      <div className="page">
        <div className="alert error">Адресат не найден.</div>
        <Link to="/" className="btn secondary">← К списку</Link>
      </div>
    )
  }

  const isUrgent = URGENT_FOR.includes(position)

  return (
    <div className="page">
      {step === 'form' && <Link to="/" className="back">← Назад</Link>}

      <div className="card">
        <div className="card-label">Обращение к</div>
        <h2>{position || '…'}</h2>

        {step === 'form' && (
          <form onSubmit={submit} className="form">
            {isUrgent && <div className="alert warn">🚨 {URGENT_TEXT}</div>}

            <label>
              Тема
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>

            <label>
              Текст обращения
              <textarea
                rows={7}
                maxLength={3000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Опишите ситуацию…"
              />
              <span className="counter">{text.length} / 3000</span>
            </label>

            <p className="note small">🔒 {PRIVACY_TEXT}</p>

            <label className="check">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>{CONSENT_TEXT}</span>
            </label>

            {error && <div className="alert error">{error}</div>}

            <button className="btn" disabled={busy}>
              {busy ? 'Отправка…' : 'Далее — подтвердить номер'}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <div className="verify">
            <p><b>Последний шаг — подтвердите номер телефона в Telegram:</b></p>
            <ol>
              <li>Нажмите кнопку ниже — откроется Telegram.</li>
              <li>Нажмите <b>«Запустить»</b> (Start).</li>
              <li>Нажмите <b>«📱 Поделиться номером»</b>.</li>
            </ol>
            <a className="btn tg" href={'https://t.me/' + TG_BOT + '?start=' + token} target="_blank" rel="noreferrer">
              Подтвердить в Telegram
            </a>
            <p className="muted small center">
              ⏳ Ожидаем подтверждение… Страница обновится сама. Ссылка действует 1 час.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="done">
            <div className="done-icon">✅</div>
            <h3>Обращение №{number} отправлено</h3>
            <p>Ответ придёт вам в Telegram от нашего бота.</p>
            <Link to="/" className="btn secondary">На главную</Link>
          </div>
        )}
      </div>
    </div>
  )
}
