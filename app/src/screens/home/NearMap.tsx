import { useMapPoints, type MapData } from '../../api'
import { ThreadMap } from '../../map'

const ignore = () => {}

/** Home's small live map (S-126): every nonprofit as a faint dot, organizations here as pins, threads live. It doesn't move. */
export default function NearMap({ data, me, view }: { data: MapData; me: string | undefined; view: { center: [number, number]; zoom: number } | undefined }) {
  const { data: points } = useMapPoints()
  return <ThreadMap data={data} points={points} me={me} onSelect={ignore} initialView={view} still className="near-map" />
}
