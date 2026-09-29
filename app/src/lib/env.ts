/**
 * The staging copy of the site (helpbook-staging.azurewebsites.net). The same build runs on staging and production,
 * so this is read from the address, not baked in at build time.
 */
export const STAGING = typeof location !== 'undefined' && /(^|[.-])staging([.-]|$)/.test(location.hostname)

/**
 * Which pull request and commit this build came from, set by the GitHub workflow (.github/workflows/deploy-staging.yml).
 * Empty for a build made by hand. Only the staging tag shows it.
 */
const env = import.meta.env
const repo = (env.VITE_BUILD_REPO as string | undefined) || ''
const pr = (env.VITE_BUILD_PR as string | undefined) || ''
const sha = (env.VITE_BUILD_SHA as string | undefined) || ''
export const BUILD = {
  label: pr ? `PR #${pr}` : sha ? sha.slice(0, 7) : '',
  href: !repo ? '' : pr ? `https://github.com/${repo}/pull/${pr}` : sha ? `https://github.com/${repo}/commit/${sha}` : '',
}
