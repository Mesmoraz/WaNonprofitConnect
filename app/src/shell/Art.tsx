import needlePin from '../assets/art/needle-pin.webp'
import goldenThread from '../assets/art/golden-thread.webp'

/**
 * The golden thread art (S-150, docs/ALPHA-BRIEFS.md). Decoration only: alt="" because the words beside it
 * already say it. Sources and status: design/art/README.md.
 */
export function EmptyArt() {
  return <img className="art-empty" src={needlePin} alt="" width={140} height={140} />
}

export function GoldenArt() {
  return <img className="art-golden" src={goldenThread} alt="" width={800} height={320} />
}
