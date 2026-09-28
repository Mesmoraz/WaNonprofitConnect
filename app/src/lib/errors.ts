import { ApiError } from '../api'

const TRY_AGAIN = 'That didn’t work. Try again.'

/**
 * The line to show when an action fails. A 4xx problem's title is written as the plain sentence to show
 * (docs/ALPHA.md), so it says why ("Urgent is 2 a month. Pick This week instead."). Anything else: try again.
 */
export const errorLine = (err: unknown) =>
  err instanceof ApiError && err.status >= 400 && err.status < 500 && err.status !== 401 && err.message && !err.message.startsWith('Request failed')
    ? err.message
    : TRY_AGAIN
