import { useMe } from '../../api'
import { Door } from '../../shell/Door'

// Copy: docs/ALPHA-BRIEFS.md, Waiting. No button: there is nothing to do but wait.
// /me is checked every 30 seconds, so an approval moves you on to the board without a reload.
export function Waiting() {
  const { data: me } = useMe({ refetchInterval: 30_000 })
  const org = me?.membership?.orgName ?? ''
  return (
    <Door who>
      <div className="door-space" />
      <h1 className="h center">We’ll check and let you know</h1>
      <p className="sub center">Someone will confirm you belong to {org} within a day.</p>
    </Door>
  )
}
