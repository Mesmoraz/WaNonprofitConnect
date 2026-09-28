/**
 * The staging copy of the site (helpbook-staging.azurewebsites.net). The same build runs on staging and production,
 * so this is read from the address, not baked in at build time.
 */
export const STAGING = typeof location !== 'undefined' && /(^|[.-])staging([.-]|$)/.test(location.hostname)
