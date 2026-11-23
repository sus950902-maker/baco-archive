import { MAP_FRAME, WORLD_LAND, mapX, mapY } from "./worldLand"

const GRATICULE = []
for (let lon = -150; lon <= 150; lon += 30) {
  const x = mapX(lon)
  GRATICULE.push(`M${x} 0V${MAP_FRAME.height}`)
}
for (let lat = -30; lat <= 45; lat += 30) {
  const y = mapY(lat)
  if (y < 0 || y > MAP_FRAME.height) continue
  GRATICULE.push(`M0 ${y}H${MAP_FRAME.width}`)
}

export default function WorldMap() {
  const { width, height } = MAP_FRAME
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="世界地圖" className="block h-auto w-full bg-white">
      <rect width={width} height={height} fill="#f7f7f7" />
      <path d={GRATICULE.join("")} fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="0.6" />
      <path
        d={WORLD_LAND}
        fill="#c2c2c2"
        stroke="#111"
        strokeWidth="1.05"
        strokeLinejoin="round"
        strokeLinecap="round"
        fillRule="evenodd"
      />
    </svg>
  )
}
