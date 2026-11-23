import { useLayoutEffect, useRef, useState } from "react"
import { fitPortrait, portraitOffset, portraitSources } from "../portrait"

export default function PortraitArt({ url, ratio, scale = 1, frameClass }) {
  const frameRef = useRef(null)
  const sources = portraitSources(url)
  const [sourceIndex, setSourceIndex] = useState(0)
  const seenUrl = useRef(url)
  if (seenUrl.current !== url) {
    seenUrl.current = url
    setSourceIndex(0)
  }
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const source = sources[sourceIndex] || ""
  const size = fitPortrait(natural, frame, scale)
  const offset = portraitOffset(ratio, frame, size)

  useLayoutEffect(() => {
    const node = frameRef.current
    if (!node) return undefined
    const measure = () => {
      const box = node.getBoundingClientRect()
      setFrame((current) => (current.width === box.width && current.height === box.height ? current : { width: box.width, height: box.height }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [source])

  if (!source) return null

  return (
    <span ref={frameRef} className={`portrait-frame ${frameClass || ""}`}>
      <img
        src={source}
        alt=""
        draggable={false}
        referrerPolicy="no-referrer"
        onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
        onError={() => {
          if (sourceIndex + 1 < sources.length) setSourceIndex(sourceIndex + 1)
        }}
        className="absolute max-w-none select-none"
        style={{ width: size.width || undefined, height: size.height || undefined, left: offset.x, top: offset.y }}
      />
    </span>
  )
}
