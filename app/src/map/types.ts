import type { CSSProperties } from 'react'

// The map's inputs, mirrored from the contract in docs/ALPHA.md. Structural, so the api lane's
// own types (src/api) pass straight in without an import between the two folders.

export type KindOfHelp = 'Time' | 'Skills' | 'Things' | 'Partnership' | 'ForSchools' | 'JobsAndMentoring';
export type ThreadStatus = 'Proposed' | 'Accepted' | 'Declined' | 'Completed' | 'Cancelled';

export interface OrgSummary {
  ein: string; name: string; city: string | null; zip5: string | null; ntee: string | null;
  lat: number | null; lon: number | null; isMember: boolean;
}

export interface MapThread { id: number; status: ThreadStatus; help: KindOfHelp; fromEin: string; toEin: string; title: string }
export interface MapSuggested { needId: number; offerId: number; fromEin: string; toEin: string }

export interface MapData {
  members: OrgSummary[];
  threads: MapThread[];      // from = giver (offer side)
  suggested: MapSuggested[];
}

/** `GET /api/v1/map/points`: every WA 501(c)(3) as [ein, lat, lon]. */
export type MapPoint = [string, number, number];

/** pair: two organizations' EINs as "a|b", from tapping a line that carries more than one thread (S-127). */
export type MapSelection = { kind: 'org'; id: string } | { kind: 'thread'; id: number } | { kind: 'pair'; id: string };

export interface ThreadMapProps {
  data: MapData;
  points?: MapPoint[];
  /** The signed-in org's EIN. Its pin gets the amber ring. */
  me?: string;
  selected?: MapSelection | null;
  onSelect: (sel: MapSelection | null) => void;
  /** Where to open. Default: the whole state. Read once, on mount. */
  initialView?: { center: [number, number]; zoom: number };
  className?: string;
  style?: CSSProperties;
}
