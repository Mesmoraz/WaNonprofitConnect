import { useEffect, useState } from 'react'
import { useMe, useMyOrg, useSaveMyOrg, type MyOrg } from '../../api'
import { errorLine } from '../../lib/errors'
import { causeOf, cap, formatEin } from '../../lib/words'
import { BackLink, Page } from '../../shell/Page'
import { Slow } from '../../shell/Slow'
import { useToast } from '../../shell/Toast'

const ABOUT_MAX = 140
const firstName = (name: string) => name.trim().split(/\s+/)[0] || name

/** Your organization (S-99): what it says about itself, which others see on its page. From the name menu, confirmed people only. */
export function YourOrg() {
  const { data: me } = useMe()
  const ein = me?.membership?.ein ?? ''
  const { data: mine, isError, refetch } = useMyOrg(ein)

  if (isError && !mine) {
    return <Page><BackLink /><p className="empty">That didn’t work. <button className="inline-link" onClick={() => refetch()}>Try again</button></p></Page>
  }
  if (!mine) return <Page><BackLink /><Slow /></Page>
  return <AboutYou key={mine.org.ein} ein={ein} mine={mine} />
}

function AboutYou({ ein, mine }: { ein: string; mine: MyOrg }) {
  const save = useSaveMyOrg(ein)
  const toast = useToast()
  const [about, setAbout] = useState(mine.about ?? '')
  const [website, setWebsite] = useState(mine.website ?? '')
  const [contact, setContact] = useState<string | null>(mine.contactAccountId)
  const [failed, setFailed] = useState<string | null>(null)

  // What the server kept (a website gains https://) shows once it's saved.
  useEffect(() => { setWebsite(mine.website ?? '') }, [mine.website])

  const submit = () => {
    setFailed(null)
    save.mutate({ about: about.trim() || null, website: website.trim() || null, contactAccountId: contact }, {
      onSuccess: () => toast('Saved.'),
      onError: e => setFailed(errorLine(e)),
    })
  }

  const o = mine.org
  return (
    <Page className="your-org" cta={<button className="btn primary" disabled={save.isPending} onClick={submit}>Save</button>}>
      <BackLink />
      <h1 className="h">{o.name}</h1>
      <p className="sub">{[cap(o.city), causeOf(o.ntee), `EIN ${formatEin(o.ein)}`].filter(Boolean).join(' · ')}</p>

      <div className="label">About you</div>
      <label className="field-label" htmlFor="o-about">What you do</label>
      <input id="o-about" maxLength={ABOUT_MAX} value={about} onChange={e => setAbout(e.target.value)}
        placeholder="We run a food bank and a free store in Ballard." aria-describedby="o-about-hint" />
      <p className="hint" id="o-about-hint">One line. Others see it on your page.</p>

      <label className="field-label" htmlFor="o-web">Website</label>
      <input id="o-web" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={200}
        value={website} onChange={e => setWebsite(e.target.value)} placeholder="yourorganization.org" />

      <div className="field-label" id="o-ask-label">Who to ask</div>
      <div className="chips" role="radiogroup" aria-labelledby="o-ask-label" aria-describedby="o-ask-hint">
        {mine.people.map(p => (
          <button key={p.accountId} role="radio" aria-checked={contact === p.accountId} className={`chip${contact === p.accountId ? ' on' : ''}`}
            onClick={() => setContact(c => (c === p.accountId ? null : p.accountId))}>{firstName(p.name)}</button>
        ))}
      </div>
      <p className="hint" id="o-ask-hint">Others see the name, not the email. Messages still go through threads.</p>

      {failed && <p className="error" role="alert">{failed}</p>}
    </Page>
  )
}
