import { MAP_FRAME, WORLD_LAND } from "./worldLand"

export default function WorldMap() {
  const { width, height } = MAP_FRAME
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="世界地圖" className="block h-auto w-full">
      <path
        d={WORLD_LAND}
        fill="#1c1c1c"
        stroke="#505050"
        strokeWidth="1.05"
        strokeLinejoin="round"
        strokeLinecap="round"
        fillRule="evenodd"
      />
    </svg>
  )
}
