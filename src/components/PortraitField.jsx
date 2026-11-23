import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react"
import { clampPortrait, fitPortrait, portraitOffset, portraitRatio, portraitSources } from "../portrait"

const PortraitField = forwardRef(function PortraitField({ existingUrl = "", ratio, scale = 1, disabled = false, children }, ref) {
  const frameRef = useRef(null)
  const drag = useRef(null)
  const [link, setLink] = useState(existingUrl)
  const [sources, setSources] = useState(() => portraitSources(existingUrl))
  const [sourceIndex, setSourceIndex] = useState(0)
  const preview = sources[sourceIndex] || ""
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [frame, setFrame] = useState({ width: 0, height: 0 })
  const [offset, setOffset] = useState(null)
  const [zoom, setZoom] = useState(scale >= 1 ? scale : 1)
  const [error, setError] = useState("")
  const size = fitPortrait(natural, frame, zoom)
  const placed = offset || portraitOffset(ratio, frame, size)

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
  }, [preview])

  useImperativeHandle(ref, () => ({
    url() {
      const next = portraitSources(link)
      if (!link.trim()) return ""
      if (!preview || next[0] !== sources[0]) throw new Error("請先讀取立繪")
      return preview
    },
    ratio() {
      if (!frame.width || !size.width) return { ...(ratio || { x: 0, y: 0 }), scale: zoom }
      return { ...portraitRatio(placed, frame), scale: zoom }
    },
  }))

  function loadLink() {
    const next = portraitSources(link)
    if (!link.trim()) {
      setError("")
      setSources([])
      setSourceIndex(0)
      setNatural({ width: 0, height: 0 })
      setOffset(null)
      return
    }
    if (!next.length) {
      setError("請貼上有效的雲端圖片網址")
      return
    }
    setError("")
    setOffset(null)
    setNatural({ width: 0, height: 0 })
    setSources(next)
    setSourceIndex(0)
  }

  function onPointerDown(event) {
    if (!preview || disabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { px: event.clientX, py: event.clientY, x: placed.x, y: placed.y }
  }

  function onPointerMove(event) {
    if (!drag.current) return
    setOffset(
      clampPortrait(
        drag.current.x + event.clientX - drag.current.px,
        drag.current.y + event.clientY - drag.current.py,
        frame,
        size,
      ),
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-48 flex-1 font-mono text-[11px] tracking-[0.16em] text-ash">
          雲端網址
          <input
            value={link}
            disabled={disabled}
            placeholder="https://"
            onChange={(event) => setLink(event.target.value)}
            className="mt-2 w-full border border-black/20 bg-white px-3 py-2 font-mono text-sm text-black outline-none focus:border-alert"
          />
        </label>
        <button type="button" disabled={disabled} onClick={loadLink} className="border border-black/20 px-3 py-2 font-mono text-xs tracking-wide text-ink hover:border-alert hover:text-alert">
          [ 讀取立繪 ]
        </button>
      </div>
      {preview && (
        <label className="mt-3 block font-mono text-[11px] tracking-[0.16em] text-ash">
          放大
          <input
            type="range"
            min="1"
            max="6"
            step="0.01"
            value={zoom}
            disabled={disabled}
            onChange={(event) => {
              const nextZoom = Number(event.target.value)
              const current = fitPortrait(natural, frame, zoom)
              const upcoming = fitPortrait(natural, frame, nextZoom)
              const centerX = placed.x + current.width / 2
              const centerY = placed.y + current.height / 2
              setZoom(nextZoom)
              setOffset(clampPortrait(centerX - upcoming.width / 2, centerY - upcoming.height / 2, frame, upcoming))
            }}
            className="mt-2 block w-full accent-alert"
          />
        </label>
      )}
      <p className="mt-2 font-mono text-[10px] tracking-wide text-ash">可放大並拖曳。超出框線的部分會被裁切，上緣仍可略為超出。</p>
      {error && <p className="mt-2 font-mono text-[11px] text-alert">{error}</p>}
      <div>
        <p className="text-center font-mono text-[11px] tracking-[0.16em] text-ash">角色卡預覽</p>
        <div className="mt-2 flex justify-center overflow-visible pt-16">
          <div className="roster-slot">
            <div className="panel character-card hud-corner relative min-h-[var(--portrait-h)] overflow-visible pr-[var(--portrait-w)]">
              <div className="flex w-full min-w-0 items-end gap-4 p-4">
                {children}
              </div>
              <div
                ref={frameRef}
                className={`portrait-frame shadow-[inset_1px_0_0_rgba(0,0,0,0.45)] ${preview ? "cursor-grab touch-none" : ""}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => {
                  drag.current = null
                }}
                onPointerCancel={() => {
                  drag.current = null
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt=""
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onLoad={(event) => {
                      setError("")
                      setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
                    }}
                    onError={() => {
                      if (sourceIndex + 1 < sources.length) {
                        setSourceIndex(sourceIndex + 1)
                        return
                      }
                      setSources([])
                      setSourceIndex(0)
                      setError("無法從這個雲端網址讀取立繪。請確認連結已開放檢視，並貼上檔案分享網址。")
                    }}
                    className="absolute max-w-none select-none"
                    style={{ width: size.width || undefined, height: size.height || undefined, left: placed.x, top: placed.y }}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center px-2 text-center font-mono text-[10px] text-ash">NO IMAGE</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default PortraitField
