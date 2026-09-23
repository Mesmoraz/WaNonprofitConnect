import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateListing, useMe, type Cadence, type KindOfHelp, type ListingKind, type Urgency } from '../../api'
import { HELP_LABEL } from '../../lib/words'
import { Page } from '../../shell/Page'
import { useToast } from '../../shell/Toast'
import './post.css'

// Placeholders from docs/TAXONOMY.md, "A need sounds like" / "An offer sounds like", without the closing period.
const SOUNDS_LIKE: Record<ListingKind, Record<KindOfHelp, string>> = {
  Need: {
    Time: 'Drivers, Saturday mornings, 4-hour shifts', Skills: 'Bookkeeping, a few hours a month', Things: '12 laptops for client intake',
    Partnership: 'A sponsor for our summer meals program', ForSchools: 'Guest speakers for career day', JobsAndMentoring: 'Mock interviewers for 20 trainees',
  },
  Offer: {
    Time: 'I have Saturday mornings free', Skills: 'I’m a CPA. A few hours a month', Things: '15 refurbished laptops',
    Partnership: 'Our staff can volunteer one day a quarter', ForSchools: 'We’ll host a field trip to our shop', JobsAndMentoring: 'We’re hiring 3 apprentices this fall',
  },
}
// B7 lists the kinds in this order (the board's row leads with Things).
const POST_HELPS: KindOfHelp[] = ['Time', 'Skills', 'Things', 'Partnership', 'ForSchools', 'JobsAndMentoring']
const HOW_SOON: [Urgency, string][] = [['Critical', 'Urgent'], ['High', 'This week'], ['Normal', 'This month'], ['Low', 'Whenever']]
const HOW_OFTEN: [Cadence, string][] = [['OneTime', 'Once'], ['Weekly', 'Every week'], ['Monthly', 'Every month'], ['Quarterly', 'Every quarter'], ['Ongoing', 'Ongoing']]

/** B7, Post. Kind of help first, then the rest. Copy: docs/ALPHA-BRIEFS.md. */
export function Post() {
  const { data: me } = useMe({ fresh: true }) // urgentLeft may have changed since sign-in
  const create = useCreateListing()
  const toast = useToast()
  const navigate = useNavigate()
  const [kind, setKind] = useState<ListingKind>('Need')
  const [help, setHelp] = useState<KindOfHelp | null>(null)
  const [title, setTitle] = useState('')
  const [details, setDetails] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('Normal')
  const [cadence, setCadence] = useState<Cadence>('OneTime')
  const [failed, setFailed] = useState(false)

  const urgentLeft = me?.membership?.urgentLeft
  const urgentOff = urgentLeft !== undefined && urgentLeft <= 0
  const isNeed = kind === 'Need'
  const ready = !!help && !!title.trim() && !create.isPending

  const submit = () => {
    if (!help || !title.trim()) return
    setFailed(false)
    const n = parseInt(qty, 10)
    create.mutate({
      kind, help, title: title.trim(), description: details.trim() || undefined,
      quantity: Number.isFinite(n) && n > 0 ? n : undefined, unit: unit.trim() || undefined,
      urgency: isNeed ? (urgency === 'Critical' && urgentOff ? 'Normal' : urgency) : 'Normal', cadence,
    }, {
      onSuccess: l => { toast('Posted. It’s on the board now.'); navigate(`/listing/${l.id}`, { replace: true }) },
      onError: () => setFailed(true),
    })
  }

  return (
    <Page className="post" cta={<button className="btn primary" disabled={!ready} onClick={submit}>{isNeed ? 'Post need' : 'Post offer'}</button>}>
      <div className="chips" role="radiogroup" aria-label="Need or offer">
        {(['Need', 'Offer'] as ListingKind[]).map(k => (
          <button key={k} role="radio" aria-checked={kind === k} className={`chip${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>
            {k === 'Need' ? 'We need' : 'We have'}
          </button>
        ))}
      </div>
      <h1 className="h">{isNeed ? 'What do you need?' : 'What do you have?'}</h1>

      <div className="field-label" id="help-label">Kind of help</div>
      <div className="chips" role="radiogroup" aria-labelledby="help-label">
        {POST_HELPS.map(h => (
          <button key={h} role="radio" aria-checked={help === h} className={`chip${help === h ? ' on' : ''}`} onClick={() => setHelp(h)}>{HELP_LABEL[h]}</button>
        ))}
      </div>

      <label className="field-label" htmlFor="p-title">What is it?</label>
      <input id="p-title" value={title} onChange={e => setTitle(e.target.value)} placeholder={SOUNDS_LIKE[kind][help ?? 'Things']} />

      <label className="field-label" htmlFor="p-details">Details</label>
      <textarea id="p-details" rows={3} value={details} onChange={e => setDetails(e.target.value)} placeholder="Condition, pickup or delivery, dates." />

      <div className="post-row">
        <div>
          <label className="field-label" htmlFor="p-qty">How many</label>
          <input id="p-qty" inputMode="numeric" pattern="[0-9]*" value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))} />
        </div>
        <div>
          <label className="field-label" htmlFor="p-unit">Of what</label>
          <input id="p-unit" value={unit} onChange={e => setUnit(e.target.value)} />
        </div>
      </div>

      {isNeed && <>
        <div className="field-label" id="soon-label">How soon</div>
        <div className="chips" role="radiogroup" aria-labelledby="soon-label">
          {HOW_SOON.map(([u, t]) => {
            const off = u === 'Critical' && urgentOff
            return <button key={u} role="radio" aria-checked={urgency === u} disabled={off} className={`chip${urgency === u ? ' on' : ''}`} onClick={() => setUrgency(u)}>{t}</button>
          })}
        </div>
        <p className="hint">Urgent is 2 a month, so it keeps meaning you can’t operate without it.</p>
      </>}

      <div className="field-label" id="often-label">How often</div>
      <div className="chips" role="radiogroup" aria-labelledby="often-label">
        {HOW_OFTEN.map(([c, t]) => (
          <button key={c} role="radio" aria-checked={cadence === c} className={`chip${cadence === c ? ' on' : ''}`} onClick={() => setCadence(c)}>{t}</button>
        ))}
      </div>

      {failed && <p className="error" role="alert">That didn’t work. Try again.</p>}
    </Page>
  )
}
