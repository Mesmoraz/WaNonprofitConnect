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
}
export interface ListingDetail extends Listing { fits: Listing[] }

export interface Thread {
  id: number; status: ThreadStatus; need: Listing; offer: Listing; startedByEin: string
  createdAt: string; respondedAt: string | null; completedAt: string | null; lastMessageAt: string | null; unread: number
}
export interface Message { id: number; threadId: number; senderEin: string; senderName: string; body: string; sentAt: string }
export interface ThreadDetail extends Thread { messages: Message[] }

/** title and help come from the need; needId/offerId/offerTitle let a tapped thread show both posts. */
export interface MapThread { id: number; status: ThreadStatus; help: KindOfHelp; fromEin: string; toEin: string; title: string; needId: number; offerId: number; offerTitle: string | null }
/** An organization's page: its card, open needs and offers, and its live and golden thread counts. */
export interface OrgPage { org: OrgSummary; listings: Listing[]; golden: number; live: number }
export interface MapSuggested { needId: number; offerId: number; fromEin: string; toEin: string }
export interface MapData { members: OrgSummary[]; threads: MapThread[]; suggested: MapSuggested[] }
export type MapPoint = [ein: string, lat: number, lon: number]

export interface Claim { id: number; ein: string; orgName: string; city: string | null; accountId: string; email: string; name: string; status: string; createdAt: string; decidedAt: string | null }
export interface Invite { code: string; ein: string; orgName: string; uses: number; used: number }

export interface BoardQuery { help?: KindOfHelp; kind?: ListingKind; q?: string }
export interface NewListing {
  kind: ListingKind; help: KindOfHelp; title: string; description?: string
  quantity?: number; unit?: string; urgency: Urgency; cadence: Cadence
}
export interface NewThread { listingId: number; myListingId?: number; message: string }
export type ThreadAction = 'accept' | 'decline' | 'complete' | 'cancel'
