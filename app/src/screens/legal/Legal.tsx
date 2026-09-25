import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BRAND } from '../../brand'
import { LEGAL, LEGAL_DRAFT } from '../../legal/facts'
import { Door } from '../../shell/Door'
import './legal.css'

/** A fact Taylor hasn't supplied yet shows as a highlighted [placeholder]. */
const Fact = ({ value, placeholder }: { value: string | null; placeholder: string }) =>
  value ? <>{value}</> : <mark className="legal-todo">[{placeholder}]</mark>
const Email = () => <Fact value={LEGAL.contactEmail} placeholder="contact email" />
const Updated = () => <Fact value={LEGAL.updated} placeholder="date" />

function LegalPage({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <Door back="/">
      <article className="legal">
        {LEGAL_DRAFT && <p className="demo legal-draft">Draft: this page is still being reviewed.</p>}
        <h1 className="h">{title}</h1>
        <p className="legal-lede">{lede}</p>
        {children}
      </article>
    </Door>
  )
}

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="legal-section">
    <h2>{title}</h2>
    <ul>{children}</ul>
  </section>
)

/** /privacy (S-77). Wording: docs/PRIVACY-TERMS-DRAFT.md. Every fact here matches what the app does. */
export function Privacy() {
  const n = BRAND.name
  return (
    <LegalPage title="What we keep, and why" lede={`${n} helps Washington nonprofits trade what they have for what they need. To do that we keep a little about you. Here is all of it.`}>
      <Section title="What we keep">
        <li>Your name and email, from your Google sign-in. Google also gives us an account number, so we know it’s you next time.</li>
        <li>Which organization you’re with, and how you joined: an invite code, or a claim we approved.</li>
        <li>What your organization posts: needs, offers, and the details you write.</li>
        <li>Your threads: who started them, your messages, and whether they’re done.</li>
        <li>How often each post has been seen, as a number. Not who saw it.</li>
        <li>Your organization’s filters, such as who they serve.</li>
        <li>Errors. If a screen breaks on your device, we get the page, the error, and your browser’s name. Not your messages or anything you typed.</li>
        <li>Feedback you send. Your note, and a picture of your screen if you leave that ticked, with the page you were on, your device and browser, and recent errors. Only the people who run {n} see it.</li>
      </Section>
      <Section title="What we don’t do">
        <li>We don’t sell or rent anything about you. To anyone.</li>
        <li>We don’t show ads, and we don’t track you across other sites.</li>
        <li>We don’t handle money. No donations, payments or card numbers go through {n}.</li>
      </Section>
      <Section title="Who sees what">
        <li>Everyone signed in can see your organization’s name, city and posts, and your organization on the map.</li>
        <li>Messages in a thread are seen by the two organizations in it. The people who run {n} can see them too, but only look when we have to keep the site safe or fix a problem.</li>
        <li>Your email is never shown to other organizations.</li>
      </Section>
      <Section title="Where it lives">
        <li>On Microsoft Azure servers in the western United States. Azure backs it up and keeps backups for 7 days.</li>
        <li>Google handles sign-in. When you open the map, OpenFreeMap sends the map tiles, and Google Fonts sends the lettering. Those services see your device’s internet address, as any website does.</li>
      </Section>
      <Section title="Cookies">
        <li>One cookie, to keep you signed in. It lasts 30 days. No tracking cookies.</li>
      </Section>
      <Section title="Public information we use">
        <li>The IRS list of tax-exempt organizations, and Census Bureau data, to place organizations on the map. This is public, and it’s how your organization was already here before you joined.</li>
      </Section>
      <Section title="Your choices">
        <li>To see what we keep about you, or to have it deleted, email <Email />. We’ll answer within {LEGAL.replyDays} days.</li>
        <li>When we delete your account, your name and email go. Your organization’s posts stay unless you ask us to remove those too.</li>
      </Section>
      <Section title="Changes">
        <li>If this page changes in a way that matters, we’ll tell you in the app before it takes effect.</li>
      </Section>
      <p className="legal-foot">Last updated <Updated />. Questions: <Email />. See also <Link to="/terms">the terms</Link>.</p>
    </LegalPage>
  )
}

/** /terms (S-77). Wording: docs/PRIVACY-TERMS-DRAFT.md. */
export function Terms() {
  const n = BRAND.name
  return (
    <LegalPage title={`How ${n} works`} lede={`These are the rules for using ${n}. By signing in, you agree to them.`}>
      <Section title="Who runs it">
        <li>{n} is run by <Fact value={LEGAL.runBy} placeholder="who runs it" />. It’s free for nonprofits.</li>
        <li>This is an early version, shared with a small group. It will change, and sometimes it will break. Tell us when it does.</li>
      </Section>
      <Section title="Who can join">
        <li>You must be 18 or older and work or volunteer for the organization you join as.</li>
        <li>Only join as an organization you’re allowed to speak for.</li>
      </Section>
      <Section title="What you post">
        <li>Post real needs and offers, for your organization.</li>
        <li>No money: don’t ask for or offer cash, donations or payments here.</li>
        <li>Nothing illegal, unsafe, hateful, or meant to mislead.</li>
        <li>You keep what you write. You let us show it in {n} so others can respond.</li>
        <li>We may remove a post or an account that breaks these rules. We’ll tell you why.</li>
      </Section>
      <Section title="Between organizations">
        <li>{n} helps you find each other. What you agree to, the things you hand over, and any pickups or deliveries are between your organizations.</li>
        <li>We don’t check the condition of items, and we aren’t part of your agreement. Use the same care you would with any partner.</li>
      </Section>
      <Section title="No guarantees">
        <li>We work to keep {n} running and your information safe, but we can’t promise it will always be available or free of mistakes.</li>
        <li><Fact value={LEGAL.liability} placeholder="limit of liability: wording for the lawyer" /></li>
      </Section>
      <Section title="Leaving">
        <li>You can stop any time. Email <Email /> and we’ll delete your account, as described on <Link to="/privacy">the privacy page</Link>.</li>
      </Section>
      <Section title="Changes">
        <li>If these rules change in a way that matters, we’ll tell you in the app before it takes effect.</li>
      </Section>
      <p className="legal-foot">These terms follow Washington state law. Last updated <Updated />. Questions: <Email />.</p>
    </LegalPage>
  )
}
