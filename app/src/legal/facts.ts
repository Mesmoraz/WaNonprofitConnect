// The few facts on the privacy and terms pages that only Taylor can supply (S-77). Fill these in and the pages
// update; anything still null shows as a highlighted [placeholder], and the pages say they're a draft.
// The wording itself lives in screens/legal and was drafted in docs/PRIVACY-TERMS-DRAFT.md.
export const LEGAL = {
  /** Where people write to see or delete their data, or with questions. */
  contactEmail: null as string | null,
  /** "Taylor Philpott, until the nonprofit is formed", or the organization's legal name. */
  runBy: null as string | null,
  /** Days to answer a request to see or delete data. */
  replyDays: 7,
  /** "Sep 24, 2026", set when a version is approved. */
  updated: null as string | null,
  /** The limit-of-liability sentence, from the lawyer. */
  liability: null as string | null,
}

/** True until every fact above is filled in: the pages carry a "Draft:" line. */
export const LEGAL_DRAFT = Object.values(LEGAL).some(v => v === null)
