import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, compressAvatar, compressCard } from "../media"

const FRAME = 180
const OUTPUT = 512

function place(natural, zoom, offsetX, offsetY) {
  if (!natural.width || !natural.height) return { width: 0, height: 0, x: 0, y: 0 }
  const cover = Math.max(FRAME / natural.width, FRAME / natural.height)
  const width = natural.width * cover * zoom
  const height = natural.height * cover * zoom
  const maxX = Math.max(0, (width - FRAME) / 2)
  const maxY = Math.max(0, (height - FRAME) / 2)
  return {
    width,
    height,
    x: Math.min(maxX, Math.max(-maxX, offsetX)),
    y: Math.min(maxY, Math.max(-maxY, offsetY)),
  }
}

const ImageField = forwardRef(function ImageField({ label, kind, existingUrl = "", disabled = false, tone = "paper" }, ref) {
  const [preview, setPreview] = useState(existingUrl)
  const [file, setFile] = useState(null)
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [error, setError] = useState("")
  const drag = useRef(null)
  const imageRef = useRef(null)
  const framed = place(natural, zoom, offset.x, offset.y)
  const cropping = kind === "avatar" && Boolean(file)

  useImperativeHandle(ref, () => ({
    async prepare() {
      if (!file) return null
      if (kind === "avatar") {
        if (!natural.width) throw new Error("頭像尚未載入")
        const canvas = document.createElement("canvas")
        canvas.width = OUTPUT
        canvas.height = OUTPUT
        const context = canvas.getContext("2d")
        const scale = OUTPUT / FRAME
        context.drawImage(
          imageRef.current,
          framed.x * scale + (OUTPUT - framed.width * scale) / 2,
          framed.y * scale + (OUTPUT - framed.height * scale) / 2,
          framed.width * scale,
          framed.height * scale,
        )
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("影像裁切失敗"))), "image/png")
        })
        return compressAvatar(new File([blob], "avatar.png", { type: "image/png" }))
      }
      return compressCard(file)
    },
  }))

  function onFile(event) {
    const next = event.target.files?.[0]
    event.target.value = ""
    if (!next) return
    if (!ALLOWED_IMAGE_TYPES.includes(next.type)) {
      setError("僅接受 JPG、PNG、WEBP")
      return
    }
    if (next.size > MAX_IMAGE_BYTES) {
      setError("圖片需小於 5MB")
      return
    }
    setError("")
    setFile(next)
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    setNatural({ width: 0, height: 0 })
    setPreview(URL.createObjectURL(next))
  }

  function onPointerDown(event) {
    if (!cropping || disabled) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, originX: offset.x, originY: offset.y }
  }

  function onPointerMove(event) {
    if (!drag.current) return
    const next = place(
      natural,
      zoom,
      drag.current.originX + event.clientX - drag.current.x,
      drag.current.originY + event.clientY - drag.current.y,
    )
    setOffset({ x: next.x, y: next.y })
  }

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.16em] text-ash">{label}</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <div
          className={`relative shrink-0 overflow-hidden border bg-white ${tone === "terminal" ? "border-white/20" : "border-black/15"} ${kind === "avatar" ? "h-[180px] w-[180px]" : "h-[120px] w-[180px]"} ${cropping ? "cursor-grab touch-none" : ""}`}
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
              ref={imageRef}
              src={preview}
              alt=""
              draggable={false}
              onLoad={(event) => {
                setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
              }}
              className={cropping ? "absolute max-w-none" : "h-full w-full object-cover"}
              style={
                cropping
                  ? {
                      width: framed.width,
                      height: framed.height,
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${framed.x}px), calc(-50% + ${framed.y}px))`,
                    }
                  : undefined
              }
            />
          ) : (
            <span className="flex h-full items-center justify-center font-mono text-[10px] text-ash">NO IMAGE</span>
          )}
        </div>
        <label className={`cursor-pointer border px-3 py-2 font-mono text-xs tracking-wide text-ink hover:border-alert hover:text-alert ${tone === "terminal" ? "border-white/20" : "border-black/20"}`}>
          [ 選擇影像 ]
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={disabled}
            onChange={onFile}
          />
        </label>
      </div>
      {cropping && (
        <label className="mt-3 block font-mono text-[11px] tracking-[0.16em] text-ash">
          裁切
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            disabled={disabled}
            onChange={(event) => {
              const nextZoom = Number(event.target.value)
              const next = place(natural, nextZoom, offset.x, offset.y)
              setZoom(nextZoom)
              setOffset({ x: next.x, y: next.y })
            }}
            className="mt-2 block w-full accent-alert"
          />
        </label>
      )}
      {error && <p className="mt-2 font-mono text-[11px] text-alert">{error}</p>}
    </div>
  )
})

export default ImageField
