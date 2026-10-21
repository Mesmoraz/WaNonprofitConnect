import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Step = 'ask' | 'need' | 'give'

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/**
 * "What brings you here today?" (S-132, docs/ALPHA-BRIEFS.md "Home asks what brings you here"). Replaces the Welcome
 * card: four answers, and the first two open a second step in the same card ("Two ways to start"). Home decides when
 * it shows. `offers` and `needs` are what the Board will show (undefined while it loads); `mapTo` opens the Map on
 * your place, as Near you does.
 */
export function QuestionCard({ city, mapTo, offers, needs, onNotNow }: {
  city: string | null; mapTo: string; offers: number | undefined; needs: number | undefined; onNotNow: () => void
}) {
  const [step, setStep] = useState<Step>('ask')
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)
  // After an answer (or "Pick another answer"), the new heading takes focus so a screen reader hears the next step.
  useEffect(() => { if (moved.current) heading.current?.focus(); moved.current = true }, [step])

  const search = (e: FormEvent) => {
    e.preventDefault()
    const text = q.trim()
    navigate(text ? `/board?q=${encodeURIComponent(text)}` : '/board')
  }
  const golden = (
    <p className="ask-golden">When another organization helps, it becomes a golden thread on <Link className="inline-link" to="/map">the map</Link>.</p>
  )
  const back = <button className="inline-link ask-later" onClick={() => setStep('ask')}>Pick another answer</button>

  return (
    <section className="card ask" aria-labelledby="ask-h">
      {step === 'ask' ? <>
        <h2 id="ask-h" className="ask-h" ref={heading} tabIndex={-1}>What brings you here today?</h2>
        <p className="ask-line">Pick one. We’ll show you the next step.</p>
        <div className="ask-answers">
          <Answer title="We need something" line="Volunteers, skills, things, or a partner." onClick={() => setStep('need')} />
          <Answer title="We have something to give" line="Time, skills, or things you can spare." onClick={() => setStep('give')} />
          <Answer title="Who’s near us?" line={`Organizations and golden threads around ${city || 'Washington'}.`} to={mapTo} />
          <Answer title="Just looking" line="See everything posted." to="/board" />
        </div>
        <button className="inline-link ask-later" onClick={onNotNow}>Not now</button>
      </> : <>
        <h2 id="ask-h" className="ask-h" ref={heading} tabIndex={-1}>Two ways to start</h2>
        {step === 'need' ? <>
          <div className="ask-answers">
            <Answer title="Post what you need" line="Others here can offer to help." to="/post" />
            <Answer title="See what’s offered" line={offers === undefined ? '' : offers ? `${plural(offers, 'offer')} on the board now.` : 'Nothing offered yet.'} to="/board?kind=Offer" />
          </div>
          <form className="ask-search" role="search" onSubmit={search}>
            <label className="field-label" htmlFor="ask-q">Looking for something specific?</label>
            <div className="ask-search-row">
              <input id="ask-q" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Laptops, drivers, a cooler" maxLength={100} />
              <button className="btn" type="submit">Search</button>
            </div>
          </form>
        </> : (
          <div className="ask-answers">
            <Answer title="Find a need you could meet" line={needs === undefined ? '' : needs ? `${plural(needs, 'need')} on the board now.` : 'Nothing needed yet.'} to="/board?kind=Need" />
            <Answer title="Post what you have" line="Others can ask for it." to="/post?kind=Offer" />
          </div>
        )}
        {golden}
        {back}
      </>}
    </section>
  )
}

/** One answer: a full-width row, its title and a short line under it. A link when it leaves Home, a button when it opens the next step. */
function Answer({ title, line, to, onClick }: { title: string; line: string; to?: string; onClick?: () => void }) {
  const body = <><span className="ask-t">{title}</span>{line && <span className="ask-m">{line}</span>}</>
  return to
    ? <Link className="ask-answer" to={to}>{body}</Link>
    : <button className="ask-answer" onClick={onClick}>{body}</button>
}
