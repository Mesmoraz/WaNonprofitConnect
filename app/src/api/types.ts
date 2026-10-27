// The contract in docs/ALPHA.md, as types. JSON, camelCase, enums as strings.

export type KindOfHelp = 'Time' | 'Skills' | 'Things' | 'Partnership' | 'ForSchools' | 'JobsAndMentoring'
export type Urgency = 'Low' | 'Normal' | 'High' | 'Critical'
export type Cadence = 'OneTime' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Ongoing'
export type ThreadStatus = 'Proposed' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled'
export type ListingKind = 'Need' | 'Offer'

export interface Account { id: string; email: string; name: string; isAdmin: boolean }
export interface Membership {
  ein: string; orgName: string; status: 'confirmed' | 'pending'
  /** Urgent needs the org can still post: 2 minus those posted in the last 30 days. Added by the backend lane after ALPHA.md. */
  urgentLeft?: number
  /** With no Urgent left: when one comes back (S-109, "You can use it again on Oct 21"). Null while any are left. */
  urgentAgainOn?: string | null
}
export interface Me { account: Account; membership: Membership | null }

export interface OrgSummary {
  ein: string; name: string; city: string | null; zip5: string | null; ntee: string | null
  lat: number | null; lon: number | null; isMember: boolean
}

export interface Listing {
  id: number; kind: ListingKind; help: KindOfHelp; title: string; description: string | null
  quantity: number | null; unit: string | null; urgency: Urgency; cadence: Cadence; status: string
  org: OrgSummary; createdAt: string; views: number; why: string
  /** When its poster last changed it (S-97): "· Edited". */
  editedAt?: string | null
}
/** openThreads only on your own post: threads on it still going ("1 thread is open on this"). */
export interface ListingDetail extends Listing { fits: Listing[]; myThreadId?: number; openThreads?: number }

export interface Thread {
  id: number; status: ThreadStatus; need: Listing; offer: Listing; startedByEin: string
  createdAt: string; respondedAt: string | null; completedAt: string | null; lastMessageAt: string | null; unread: number
}
export interface Message { id: number; threadId: number; senderEin: string; senderName: string; body: string; sentAt: string }
export interface ThreadDetail extends Thread { messages: Message[] }

/** title and help come from the need; needId/offerId/offerTitle let a tapped thread show both posts. */
export interface MapThread { id: number; status: ThreadStatus; help: KindOfHelp; fromEin: string; toEin: string; title: string; needId: number; offerId: number; offerTitle: string | null }
/** A "Send feedback" note, for the Admin page. context is the JSON the app attached. */
export interface FeedbackItem { id: number; email: string | null; name: string | null; ein: string | null; orgName: string | null; message: string; page: string; context: string; hasScreenshot: boolean; createdAt: string; status: string }
/** Your organization's saved board filters. serve is null until someone there saves them (start from the cause code). */
export interface Filters { serve: string[] | null }
/** An organization's page: its card, open needs and offers, and its live and golden thread counts. */
/** about, website and askFor are what the organization says about itself (S-99); askFor is a first name, never an email. */
export interface OrgPage { org: OrgSummary; listings: Listing[]; golden: number; live: number; about: string | null; website: string | null; askFor: string | null }
/** Your organization (S-99). Only people at the organization get this, so it carries their emails. */
export interface OrgPerson { accountId: string; name: string; email: string; isYou: boolean }
export interface MyOrg { org: OrgSummary; about: string | null; website: string | null; contactAccountId: string | null; people: OrgPerson[]; placesLeft: number }
export interface SaveMyOrg { about: string | null; website: string | null; contactAccountId: string | null }
export interface MapSuggested { needId: number; offerId: number; fromEin: string; toEin: string }
/** How many open needs and offers an organization has: its pin's ring (S-129). */
export interface MapOpen { ein: string; needs: number; offers: number }
export interface MapData { members: OrgSummary[]; threads: MapThread[]; suggested: MapSuggested[]; open: MapOpen[] }
/** What fits your organization (S-130): another organization's open post, and which of yours it fits best. */
export interface MapFit { myId: number; myTitle: string; post: Listing }
export type MapFitsFor = 'needs' | 'offers'
export type MapPoint = [ein: string, lat: number, lon: number]

/** A place you can tap on the map (S-144): a city or town, a census place, or a Seattle district or neighborhood. */
export type PlaceKind = 'city' | 'cdp' | 'district' | 'neighborhood'
export interface PlaceFeature {
  type: 'Feature'; id: string
  properties: { id: string; name: string; kind: PlaceKind; bbox: [west: number, south: number, east: number, north: number] }
  geometry: { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] }
}
/** `GET /api/v1/places`: every outline, as GeoJSON. */
export interface Places { type: 'FeatureCollection'; features: PlaceFeature[] }
/** One organization inside a place, with what it has open. */
export interface PlaceOrg { org: OrgSummary; needs: number; offers: number }
/** `GET /api/v1/places/{id}/orgs`: how many inside, how many joined, and a page of them, joined first. */
export interface PlaceOrgs { id: string; name: string; total: number; joined: number; orgs: PlaceOrg[] }

/** A thread stalled on someone (Admin, "Waiting on someone"): unanswered for 2 days, or accepted and quiet for 7. */
export interface WaitingThread { id: number; title: string; why: 'unanswered' | 'quiet'; since: string; days: number; waitingOn: string[]; people: { name: string; email: string }[] }
/** Admin, "How it's going" (S-100): the six alpha measures, real organizations only. got of of: "4 of 12". */
export interface Ratio { got: number; of: number }
export interface AlphaNumbers {
  posts: number; started: number; accepted: number; golden: number
  goldenThisMonth: number; month: string
  threadWithin14Days: Ratio; firstAnswerMedianMinutes: number | null; becameGolden: Ratio; bothInFirstWeek: Ratio; givenAndReceived: Ratio
}
export interface Claim { id: number; ein: string; orgName: string; city: string | null; accountId: string; email: string; name: string; status: string; createdAt: string; decidedAt: string | null }
export interface Invite { code: string; ein: string; orgName: string; uses: number; used: number }

export interface BoardQuery { help?: KindOfHelp; kind?: ListingKind; q?: string }
export interface NewListing {
  kind: ListingKind; help: KindOfHelp; title: string; description?: string
  quantity?: number; unit?: string; urgency: Urgency; cadence: Cadence
}
/** Edit a post (S-97): everything but whether it's a need or an offer. */
export type ListingEdit = Omit<NewListing, 'kind'>
export interface NewThread { listingId: number; myListingId?: number; message: string }
export type ThreadAction = 'accept' | 'decline' | 'complete' | 'cancel'
