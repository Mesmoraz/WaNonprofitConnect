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

export interface MapOpen { ein: string; needs: number; offers: number }

export interface MapData {
  members: OrgSummary[];
  threads: MapThread[];      // from = giver (offer side)
  suggested: MapSuggested[];
  /** Open posts per organization: its pin's ring (S-129). Older data without it draws every pin grey. */
  open?: MapOpen[];
}

/** `GET /api/v1/map/points`: every WA 501(c)(3) as [ein, lat, lon]. */
export type MapPoint = [string, number, number];

/** pair: two organizations' EINs as "a|b", from tapping a line that carries more than one thread (S-127). */
export type MapSelection = { kind: 'org'; id: string } | { kind: 'thread'; id: number } | { kind: 'pair'; id: string };

export interface MapView { west: number; south: number; east: number; north: number; center: [number, number] }

export interface MapFits { kind: 'offers' | 'needs'; eins: string[] }

/** A town or neighborhood name on the base map, tapped (S-144): its name, OpenStreetMap's class for it, and where the label sits. */
export interface MapLabelTap { name: string; kind: string; lon: number; lat: number }

/** A place to outline (S-144): GeoJSON polygon or multipolygon coordinates, and its [west, south, east, north] box. */
export interface MapPlace {
  id: string;
  bbox: [number, number, number, number];
  geometry: { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };
}

export interface ThreadMapProps {
  data: MapData;
  points?: MapPoint[];
  /** The signed-in org's EIN. Its pin gets the amber ring. */
  me?: string;
  selected?: MapSelection | null;
  onSelect: (sel: MapSelection | null) => void;
  /**
   * The map's toggles (S-130): a dashed line from your pin to each organization that fits, only while on and only for you.
   * offers: offers that could fit your needs (green, running to you); needs: needs you could help with (amber, running from you).
   */
  fits?: MapFits | null;
  /** A fit line tapped: that organization's EIN. */
  onFitTap?: (ein: string) => void;
  /** A place name on the base map tapped, when no pin or line was (S-144). Without it, place names do nothing. */
  onLabelTap?: (label: MapLabelTap) => void;
  /** The place to outline (S-144): the map frames it when it changes, fades the land outside, and keeps it as you move. */
  place?: MapPlace | null;
  /** Where the map is looking, once it has loaded and after every move (S-131: what's open in view). */
  onViewChange?: (view: MapView) => void;
  /** Where to open. Default: the whole state. Read once, on mount. */
  initialView?: { center: [number, number]; zoom: number };
  /** A small map that doesn't move (Home's "Near you", S-126): no pan, zoom or taps; the page around it handles the tap. */
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}
