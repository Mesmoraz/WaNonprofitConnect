import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateListing, useMe, type Cadence, type KindOfHelp, type ListingKind, type Urgency } from '../../api'
import { HELP_LABEL } from '../../lib/words'
import { Page } from '../../shell/Page'
import { useToast } from '../../shell/Toast'
import './post.css'
import { errorLine } from '../../lib/errors'

// Placeholders from docs/TAXONOMY.md, "A need sounds like" / "An offer sounds like", without the closing period.
const SOUNDS_LIKE: Record<ListingKind, Record<KindOfHelp, string>> = {
  Need: {
    Time: 'Drivers, Saturday mornings, 4-hour shifts', Skills: 'Bookkeeping, a few hours a month', Things: 'Laptops for client intake',
    Partnership: 'A sponsor for our summer meals program', ForSchools: 'Guest speakers for career day', JobsAndMentoring: 'Mock interviewers for 20 trainees',
  },
  Offer: {
    Time: 'I have Saturday mornings free', Skills: 'I’m a CPA. A few hours a month', Things: 'Refurbished laptops',
    Partnership: 'Our staff can volunteer one day a quarter', ForSchools: 'We’ll host a field trip to our shop', JobsAndMentoring: 'We’re hiring 3 apprentices this fall',
  },
}
// Mario's feedback (#3, Sep 26): pick, don't type, "like Autotrader but with the thread focus". The talking happens in the thread.
// A short list of what people usually post for each kind of help; the chip becomes the title. "Something else" opens the text box.
const COMMON: Record<KindOfHelp, string[]> = {
  Time: ['Driving', 'Event help', 'Sorting and packing', 'Tutoring', 'Office help'],
  Skills: ['Bookkeeping', 'Legal help', 'Tech help', 'Design', 'Marketing'],
  Things: ['Laptops', 'Food', 'Clothing', 'Furniture', 'Supplies'],
  Partnership: ['A sponsor', 'Staff volunteer day', 'Event partner', 'Shared space'],
  ForSchools: ['Guest speakers', 'Field trips', 'Classroom supplies', 'Tutoring'],
  JobsAndMentoring: ['Mock interviews', 'Mentors', 'Job openings', 'Apprenticeships'],
}
const OTHER = 'Something else'
const DETAILS_MAX = 280
// B7 lists the kinds in this order (the board's row leads with Things).
const POST_HELPS: KindOfHelp[] = ['Time', 'Skills', 'Things', 'Partnership', 'ForSchools', 'JobsAndMentoring']
const HOW_SOON: [Urgency, string][] = [['Critical', 'Urgent'], ['High', 'This week'], ['Normal', 'This month'], ['Low', 'Whenever']]
const HOW_OFTEN: [Cadence, string][] = [['OneTime', 'Once'], ['Weekly', 'Every week'], ['Monthly', 'Every month'], ['Quarterly', 'Every quarter'], ['Ongoing', 'Ongoing']]

/** B7, Post. Kind of help first, then pick what it is, then the rest. Details are optional. Copy: docs/ALPHA-BRIEFS.md. */
export function Post() {
  const { data: me } = useMe({ fresh: true }) // urgentLeft may have changed since sign-in
  const create = useCreateListing()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [kind, setKind] = useState<ListingKind>(params.get('kind') === 'Offer' ? 'Offer' : 'Need')
  const [help, setHelp] = useState<KindOfHelp | null>(null)
  const [pickWhat, setPickWhat] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [details, setDetails] = useState('')
  const [qty, setQty] = useState('')
  const [urgency, setUrgency] = useState<Urgency>('Normal')
  const [cadence, setCadence] = useState<Cadence>('OneTime')
  const [failed, setFailed] = useState<string | null>(null)

  const urgentLeft = me?.membership?.urgentLeft
  const urgentOff = urgentLeft !== undefined && urgentLeft <= 0
  const isNeed = kind === 'Need'
  const title = pickWhat === OTHER ? typed.trim() : pickWhat ?? ''
  const ready = !!help && !!title && !create.isPending
  const chooseHelp = (h: KindOfHelp) => { if (h !== help) { setHelp(h); setPickWhat(null) } }

  const submit = () => {
    if (!help || !title) return
    setFailed(null)
    const n = parseInt(qty, 10)
    create.mutate({
      kind, help, title, description: details.trim() || undefined,
      quantity: Number.isFinite(n) && n > 0 ? n : undefined, unit: undefined,
      urgency: isNeed ? (urgency === 'Critical' && urgentOff ? 'Normal' : urgency) : 'Normal', cadence,
    }, {
      onSuccess: l => { toast('Posted. It’s on the board now.'); navigate(`/listing/${l.id}`, { replace: true }) },
      onError: e => setFailed(errorLine(e)),
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
          <button key={h} role="radio" aria-checked={help === h} className={`chip${help === h ? ' on' : ''}`} onClick={() => chooseHelp(h)}>{HELP_LABEL[h]}</button>
        ))}
      </div>

      {help && <>
        <div className="field-label" id="what-label">What is it?</div>
        <div className="chips" role="radiogroup" aria-labelledby="what-label">
          {[...COMMON[help], OTHER].map(w => (
            <button key={w} role="radio" aria-checked={pickWhat === w} className={`chip${pickWhat === w ? ' on' : ''}`} onClick={() => setPickWhat(w)}>{w}</button>
          ))}
        </div>
        {pickWhat === OTHER && (
          <input id="p-title" aria-labelledby="what-label" maxLength={80} autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={SOUNDS_LIKE[kind][help]} />
        )}
      </>}

      {/* "Of what" is gone (Taylor, Sep 23): the title already says what it is. */}
      <div className="post-qty">
        <label className="field-label" htmlFor="p-qty">How many</label>
        <input id="p-qty" inputMode="numeric" pattern="[0-9]*" value={qty} onChange={e => setQty(e.target.value.replace(/\D/g, ''))} aria-describedby="p-qty-hint" />
        <p className="hint" id="p-qty-hint">Just the number, if it matters.</p>
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

      {showDetails
        ? <>
          <label className="field-label" htmlFor="p-details">Details</label>
          <textarea id="p-details" rows={2} maxLength={DETAILS_MAX} autoFocus value={details} onChange={e => setDetails(e.target.value)} placeholder="Condition, pickup or delivery, dates." />
          <p className="hint">The rest you can work out in the thread.</p>
        </>
        : <p className="post-more"><button className="inline-link" onClick={() => setShowDetails(true)}>Add details</button></p>}

      {failed && <p className="error" role="alert">{failed}</p>}
    </Page>
  )
}
